/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  WORKFLOW_GENERATION_SYSTEM_INSTRUCTION,
  WORKFLOW_RESPONSE_SCHEMA,
} from '../ai/prompts.ts';
import { validateWorkflow } from '../workflow/validator.ts';
import { Workflow } from '../workflow/types.ts';

let geminiClient: any = null;

export interface AiProviderInfo {
  provider: 'grok' | 'gemini' | 'deterministic';
  model: string;
  hasKey: boolean;
}

/**
 * Detects the active AI provider based on environment variables.
 * Automatically recognizes GROK_API_KEY, XAI_API_KEY, and Gemini keys.
 * Also auto-detects xAI keys (prefixed with 'xai-') even if placed in GEMINI_API_KEY.
 */
export function getAiProviderInfo(): AiProviderInfo {
  const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  if (grokKey && grokKey !== 'MY_GROK_API_KEY' && grokKey !== 'your_grok_api_key_here' && grokKey.trim()) {
    return {
      provider: 'grok',
      model: 'grok-2-latest',
      hasKey: true,
    };
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY' && geminiKey.trim()) {
    if (geminiKey.startsWith('xai-')) {
      return {
        provider: 'grok',
        model: 'grok-2-latest',
        hasKey: true,
      };
    }
    return {
      provider: 'gemini',
      model: 'gemini-3.7-flash',
      hasKey: true,
    };
  }

  return {
    provider: 'deterministic',
    model: 'heuristic-engine',
    hasKey: false,
  };
}

function getGrokApiKey(): string | null {
  const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  if (grokKey && grokKey !== 'MY_GROK_API_KEY' && grokKey !== 'your_grok_api_key_here' && grokKey.trim()) {
    return grokKey.trim();
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.startsWith('xai-')) {
    return geminiKey.trim();
  }

  return null;
}

async function getGeminiClient(): Promise<any> {
  if (geminiClient) return geminiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.startsWith('xai-')) {
    return null;
  }
  try {
    const { GoogleGenAI } = await import('@google/genai');
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return geminiClient;
  } catch (err) {
    console.warn('[AURA Server] Optional @google/genai module not loaded:', err);
    return null;
  }
}

/**
 * Strips markdown code blocks and trims JSON strings safely.
 */
function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

/**
 * Calls Grok (xAI API) with automatic retries and model failover across candidate models.
 */
async function callGrokWithFailover(
  apiKey: string,
  userPrompt: string,
  systemInstruction: string
): Promise<string | null> {
  const candidateModels = ['grok-3-mini', 'grok-3', 'grok-2', 'grok-2-latest', 'grok-beta', 'grok-2-1212'];

  const systemMessage = `${systemInstruction}

CRITICAL: Return ONLY a valid, single JSON object without explanation or markdown backticks.`;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: systemMessage,
              },
              {
                role: 'user',
                content: userPrompt,
              },
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[AURA Server] Grok model ${model} returned HTTP ${response.status}:`, errText);

          if ((response.status === 429 || response.status === 503) && attempt === 1) {
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }
          break; // Try next model candidate
        }

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) {
          return cleanJsonResponse(text);
        }
      } catch (err: any) {
        console.warn(`[AURA Server] Grok model ${model} attempt ${attempt} error:`, err?.message || err);
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
      }
    }
  }

  return null;
}

/**
 * Resilient helper that calls Gemini with automatic retries and model failover
 * (gemini-3.7-flash -> gemini-3.1-flash-lite) on 503 high demand spikes.
 */
async function callGeminiWithFailover(
  contents: string,
  systemInstruction: string
): Promise<string | null> {
  const ai = await getGeminiClient();
  if (!ai) return null;

  const candidateModels = ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: WORKFLOW_RESPONSE_SCHEMA as any,
          },
        });

        const text = response.text?.trim();
        if (text) {
          return cleanJsonResponse(text);
        }
      } catch (err: any) {
        const isUnavailable = err?.message?.includes('503') || err?.message?.includes('demand') || err?.status === 503;
        const isRateLimited = err?.message?.includes('429') || err?.status === 429;

        if ((isUnavailable || isRateLimited) && attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }

        if (isUnavailable || isRateLimited) {
          console.warn(`[AURA Server] Gemini model ${model} is experiencing high demand, falling over...`);
          break;
        }

        console.warn(`[AURA Server] Gemini model ${model} error:`, err?.message || err);
        break;
      }
    }
  }

  return null;
}

/**
 * Dispatches prompt to active AI provider (Grok -> Gemini -> fallback).
 */
async function callAiWithFailover(
  userPrompt: string,
  systemInstruction: string
): Promise<string | null> {
  // 1. Check Grok key
  const grokApiKey = getGrokApiKey();
  if (grokApiKey) {
    const grokResult = await callGrokWithFailover(grokApiKey, userPrompt, systemInstruction);
    if (grokResult) return grokResult;
  }

  // 2. Check Gemini client
  const geminiResult = await callGeminiWithFailover(userPrompt, systemInstruction);
  if (geminiResult) return geminiResult;

  return null;
}

/**
 * Interprets a natural language goal using Grok / Gemini and returns a validated Workflow.
 */
export async function generateWorkflowFromGoal(goalPrompt: string): Promise<Workflow> {
  const cleanPrompt = goalPrompt.trim();
  if (!cleanPrompt) {
    throw new Error('Goal cannot be empty.');
  }

  try {
    const contents = `Translate this human automation goal into a safe, strongly-typed AURA workflow:
User Goal: "${cleanPrompt}"`;

    const responseText = await callAiWithFailover(
      contents,
      WORKFLOW_GENERATION_SYSTEM_INSTRUCTION
    );

    if (responseText) {
      const parsed = JSON.parse(responseText);
      const validation = validateWorkflow(parsed, cleanPrompt);
      if (validation.valid && validation.sanitizedWorkflow) {
        return validation.sanitizedWorkflow;
      } else if (validation.sanitizedWorkflow) {
        console.warn('[AURA Server] Sanitized workflow generated with warnings:', validation.issues);
        return validation.sanitizedWorkflow;
      }
    }
  } catch (err) {
    console.warn('[AURA Server] AI compilation engaged resilient heuristic engine:', err);
  }

  // Resilient deterministic generator fallback (guarantees 100% availability for all user goals)
  return generateDeterministicWorkflow(cleanPrompt);
}

/**
 * Modifies an existing workflow using conversational feedback from the user.
 */
export async function editWorkflowWithAI(
  currentWorkflow: Workflow,
  userInstruction: string
): Promise<Workflow> {
  const cleanInstruction = userInstruction.trim();
  if (!cleanInstruction) {
    return currentWorkflow;
  }

  try {
    const prompt = `You are editing an existing AURA workflow based on user feedback.
Current Workflow JSON:
${JSON.stringify(currentWorkflow, null, 2)}

User Modification Request:
"${cleanInstruction}"

Modify the workflow JSON to apply the requested changes while keeping unchanged fields intact.`;

    const responseText = await callAiWithFailover(
      prompt,
      WORKFLOW_GENERATION_SYSTEM_INSTRUCTION
    );

    if (responseText) {
      const parsed = JSON.parse(responseText);
      const validation = validateWorkflow(parsed, currentWorkflow.goal);
      if (validation.valid && validation.sanitizedWorkflow) {
        return {
          ...validation.sanitizedWorkflow,
          id: currentWorkflow.id,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('[AURA Server] Applying rule-based workflow editor:', err);
  }

  return applyDeterministicEdit(currentWorkflow, cleanInstruction);
}

/**
 * Deterministic generator tuned to accurately parse common automation intents.
 */
function generateDeterministicWorkflow(prompt: string): Workflow {
  const p = prompt.toLowerCase();

  // Primary demo prompts & keyword matching (English & Tamil / தமிழ்)
  const isEmail =
    p.includes('email') ||
    p.includes('inbox') ||
    p.includes('message') ||
    p.includes('மின்னஞ்சல்') ||
    p.includes('செய்தி') ||
    p.includes('மடல்') ||
    p.includes('மெயில்');

  const isUrgent =
    p.includes('urgent') ||
    p.includes('emergency') ||
    p.includes('priority') ||
    p.includes('customer') ||
    p.includes('அவசர') ||
    p.includes('அவசரம்') ||
    p.includes('முக்கிய') ||
    p.includes('முக்கியம்') ||
    p.includes('வாடிக்கையாளர்') ||
    p.includes('avasaram') ||
    p.includes('mukkiam');

  const isTask =
    p.includes('task') ||
    p.includes('todo') ||
    p.includes('action item') ||
    p.includes('பணி') ||
    p.includes('வேலை') ||
    p.includes('செயல்') ||
    p.includes('டாஸ்க்') ||
    p.includes('pani') ||
    p.includes('velai');

  const isNotify =
    p.includes('notify') ||
    p.includes('alert') ||
    p.includes('ping') ||
    p.includes('அறிவி') ||
    p.includes('அறிவிப்பு') ||
    p.includes('தெரிவி') ||
    p.includes('தெரிவிக்கவும்') ||
    p.includes('arivippu') ||
    p.includes('therivikavum');

  const isSummary =
    p.includes('summary') ||
    p.includes('summarize') ||
    p.includes('report') ||
    p.includes('updates') ||
    p.includes('சுருக்க') ||
    p.includes('விவர') ||
    p.includes('அறிக்கை') ||
    p.includes('surukk') ||
    p.includes('arikkai');

  const isCalendar =
    p.includes('calendar') ||
    p.includes('meeting') ||
    p.includes('schedule') ||
    p.includes('event') ||
    p.includes('நாள்காட்டி') ||
    p.includes('கூட்டம்') ||
    p.includes('நேரம்') ||
    p.includes('மீட்டிங்') ||
    p.includes('koottam') ||
    p.includes('naalkaatti');

  const isFallback =
    p.includes('fail') ||
    p.includes('backup') ||
    p.includes('retry') ||
    p.includes('even if') ||
    p.includes('தோல்வி') ||
    p.includes('தோற்றால்') ||
    p.includes('மாற்று') ||
    p.includes('மீண்டும்') ||
    p.includes('thotral') ||
    p.includes('meendum') ||
    p.includes('maattru');

  const isSendEmail =
    p.includes('send email') ||
    p.includes('send external') ||
    p.includes('outbound') ||
    p.includes('மின்னஞ்சல் அனுப்பு') ||
    p.includes('மெயில் அனுப்பு') ||
    p.includes('email anuppu');

  const isWebhook = p.includes('webhook') || p.includes('api call') || p.includes('வலைக்கொக்கி');

  // Trigger
  let triggerType: any = 'EMAIL_RECEIVED';
  let triggerDesc = 'When a new email arrives';

  if (
    p.includes('every monday') ||
    p.includes('daily') ||
    p.includes('weekly') ||
    p.includes('every morning') ||
    p.includes('schedule') ||
    p.includes('திங்கட்கிழமை') ||
    p.includes('திங்கள்') ||
    p.includes('தினமும்') ||
    p.includes('வாரம்') ||
    p.includes('காலை') ||
    p.includes('thingal') ||
    p.includes('thinamum')
  ) {
    triggerType = 'SCHEDULE';
    triggerDesc = (p.includes('monday') || p.includes('திங்கள்')) ? 'Every Monday at 09:00 AM' : 'Scheduled recurring timer';
  } else if (p.includes('calendar') || p.includes('நாள்காட்டி') || p.includes('கூட்டம்') && (p.includes('before') || p.includes('after') || p.includes('event created'))) {
    triggerType = 'CALENDAR_EVENT';
    triggerDesc = 'When a calendar event is scheduled or updated';
  } else if (!isEmail && !p.includes('every') && !p.includes('தினமும்')) {
    triggerType = 'MANUAL';
    triggerDesc = 'When manually triggered by user';
  }

  // Conditions
  const conditions = [];
  if (isEmail && isUrgent) {
    conditions.push({
      type: 'SEMANTIC_MATCH' as const,
      value: 'urgent customer request',
      description: 'Determine whether the email represents an urgent customer request',
    });
  } else if (p.includes('customer') || p.includes('வாடிக்கையாளர்')) {
    conditions.push({
      type: 'SENDER_MATCH' as const,
      value: 'customer domain',
      description: 'Check if sender belongs to active customer accounts',
    });
  } else if ((isCalendar || p.includes('நாள்காட்டி')) && (p.includes('conflict') || p.includes('மோதல்') || p.includes('இணை'))) {
    conditions.push({
      type: 'AVAILABILITY' as const,
      description: 'Check for calendar conflicts and available open slots',
    });
  }

  // Actions
  const actions = [];
  if (isSummary) {
    actions.push({
      id: 'action-summary',
      type: 'GENERATE_SUMMARY' as const,
      description: 'Synthesize project updates and key highlights',
      priority: 'MEDIUM' as const,
    });
  }
  if (isTask || (!isSummary && !isCalendar && !isSendEmail)) {
    actions.push({
      id: 'action-1',
      type: 'CREATE_TASK' as const,
      description: isUrgent ? 'Create a high-priority task' : 'Create an action task',
      priority: isUrgent ? ('HIGH' as const) : ('MEDIUM' as const),
    });
  }
  if (isCalendar) {
    actions.push({
      id: 'action-calendar',
      type: 'CREATE_CALENDAR_EVENT' as const,
      description: 'Schedule meeting during open afternoon window',
      priority: 'MEDIUM' as const,
    });
  }
  if (isNotify || actions.length === 1) {
    actions.push({
      id: 'action-2',
      type: 'SEND_NOTIFICATION' as const,
      description: 'Notify the user via instant private alert',
      priority: 'LOW' as const,
    });
  }
  if (isSendEmail) {
    actions.push({
      id: 'action-email',
      type: 'SEND_EMAIL' as const,
      description: 'Draft and send outgoing email response',
      priority: 'HIGH' as const,
    });
  }
  if (isWebhook) {
    actions.push({
      id: 'action-webhook',
      type: 'CALL_WEBHOOK' as const,
      description: 'Dispatch webhook payload to remote endpoint',
      priority: 'MEDIUM' as const,
    });
  }

  // Recovery
  const retryCount = (p.includes('three') || p.includes('3 times') || p.includes('3 முறை') || p.includes('மூன்று முறை')) ? 3 : 2;
  const recovery = {
    enabled: isFallback || isUrgent || actions.some((a) => a.type === 'CREATE_TASK'),
    strategy: isFallback ? ('RETRY_THEN_FALLBACK' as const) : ('RETRY' as const),
    retryCount,
    fallback: isFallback ? 'BACKUP_TASK_PROVIDER' : undefined,
    description: isFallback
      ? `Retry ${retryCount} times then failover to backup task provider`
      : `Auto-retry up to ${retryCount} times on transient API failure`,
  };

  // Verification
  const verification = {
    type: actions.some((a) => a.type === 'CREATE_TASK')
      ? ('TASK_EXISTS' as const)
      : actions.some((a) => a.type === 'SEND_EMAIL')
      ? ('EMAIL_SENT' as const)
      : ('DATA_SAVED' as const),
    description: actions.some((a) => a.type === 'CREATE_TASK')
      ? 'Confirm that the requested task exists'
      : 'Confirm operation execution receipt',
  };

  const confidence = prompt.length > 10 ? 0.96 : 0.75;
  const rawObj = {
    name: isUrgent && isEmail ? 'Urgent Customer Email Handler' : (isSummary ? 'Weekly Project Summary' : 'Intelligent Automation Plan'),
    goal: prompt,
    confidence,
    trigger: {
      type: triggerType,
      description: triggerDesc,
    },
    conditions,
    actions,
    recovery,
    verification,
    explainability: {
      understoodIntent: `Handle ${isUrgent ? 'urgent customer requests' : 'automated operations'} reliably and automatically.`,
      planSteps: [
        `Monitor ${triggerDesc.toLowerCase()}.`,
        ...(conditions.map((c) => `Verify that ${c.description.toLowerCase()}.`)),
        ...(actions.map((a) => `${a.description}.`)),
        `Verify outcome: ${verification.description}.`,
        ...(recovery.enabled ? [`If operation fails, ${recovery.description.toLowerCase()}.`] : []),
      ],
      actionJustification: 'Configured actions ensure critical items are immediately captured, assigned, and visible.',
      failureModes: [
        'Primary task service rate limits or temporary downtime (503 HTTP errors)',
        'Network gateway latency exceeding standard timeout windows',
      ],
      recoveryExplanation: recovery.enabled
        ? `If the primary step fails, AURA will retry ${recovery.retryCount} times with exponential backoff before failing over to ${recovery.fallback || 'the backup service'}.`
        : 'Logs failure and dispatches diagnostic notification.',
      verificationExplanation: `AURA directly verifies the target provider state to confirm ${verification.description}.`,
    },
  };

  const res = validateWorkflow(rawObj, prompt);
  return res.sanitizedWorkflow!;
}

function applyDeterministicEdit(current: Workflow, instruction: string): Workflow {
  const inst = instruction.toLowerCase();
  const updated = JSON.parse(JSON.stringify(current)) as Workflow;

  if (inst.includes('retry 3') || inst.includes('three times') || inst.includes('retry three') || inst.includes('3 முறை') || inst.includes('மூன்று முறை')) {
    updated.recovery.enabled = true;
    updated.recovery.retryCount = 3;
    updated.recovery.strategy = updated.recovery.fallback ? 'RETRY_THEN_FALLBACK' : 'RETRY';
    updated.recovery.description = `Retry 3 times ${updated.recovery.fallback ? 'then failover to backup provider' : 'on failure'}`;
  }

  if (inst.includes('retry twice') || inst.includes('2 times') || inst.includes('retry 2') || inst.includes('2 முறை') || inst.includes('இரண்டு முறை')) {
    updated.recovery.enabled = true;
    updated.recovery.retryCount = 2;
    updated.recovery.strategy = updated.recovery.fallback ? 'RETRY_THEN_FALLBACK' : 'RETRY';
  }

  if (inst.includes('ask me') || inst.includes('approval') || inst.includes('confirm before') || inst.includes('ஒப்புதல்') || inst.includes('கேட்கவும்') || inst.includes('opputhal')) {
    updated.approvalRequired = true;
    updated.explainability.planSteps.unshift('AURA prompts user for confirmation prior to executing step.');
  }

  if (inst.includes('no approval') || inst.includes('auto execute') || inst.includes('remove approval') || inst.includes('ஒப்புதல் தேவையில்லை')) {
    if (updated.risk.level !== 'HIGH' && updated.risk.level !== 'CRITICAL') {
      updated.approvalRequired = false;
    }
  }

  if (inst.includes('high priority') || inst.includes('priority to high') || inst.includes('உயர் முன்னுரிமை')) {
    updated.actions.forEach((a) => {
      if (a.type === 'CREATE_TASK') a.priority = 'HIGH';
    });
  }

  if (inst.includes('medium priority') || inst.includes('priority to medium') || inst.includes('நடுத்தர முன்னுரிமை')) {
    updated.actions.forEach((a) => {
      if (a.type === 'CREATE_TASK') a.priority = 'MEDIUM';
    });
  }

  if ((inst.includes('backup') || inst.includes('மாற்று')) && !updated.recovery.fallback) {
    updated.recovery.enabled = true;
    updated.recovery.strategy = 'RETRY_THEN_FALLBACK';
    updated.recovery.fallback = 'BACKUP_TASK_PROVIDER';
    updated.recovery.description = `Retry ${updated.recovery.retryCount || 2} times then failover to backup task provider`;
  }

  const validation = validateWorkflow(updated, updated.goal);
  return {
    ...(validation.sanitizedWorkflow || updated),
    id: current.id,
    updatedAt: new Date().toISOString(),
  };
}
