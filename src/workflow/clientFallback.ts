/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Workflow } from './types.ts';
import { validateWorkflow } from './validator.ts';

/**
 * Client-side deterministic fallback generator to ensure 100% resilient offline generation.
 */
export function generateClientWorkflow(prompt: string): Workflow {
  const p = prompt.toLowerCase();

  const isEmail = p.includes('email') || p.includes('inbox') || p.includes('message');
  const isUrgent = p.includes('urgent') || p.includes('emergency') || p.includes('priority') || p.includes('customer');
  const isTask = p.includes('task') || p.includes('todo') || p.includes('action item');
  const isNotify = p.includes('notify') || p.includes('alert') || p.includes('ping');
  const isSummary = p.includes('summary') || p.includes('summarize') || p.includes('report') || p.includes('updates');
  const isCalendar = p.includes('calendar') || p.includes('meeting') || p.includes('schedule') || p.includes('event');
  const isFallback = p.includes('fail') || p.includes('backup') || p.includes('retry') || p.includes('even if');
  const isSendEmail = p.includes('send email') || p.includes('send external') || p.includes('outbound');
  const isWebhook = p.includes('webhook') || p.includes('api call');

  let triggerType: any = 'EMAIL_RECEIVED';
  let triggerDesc = 'When a new email arrives';

  if (p.includes('every monday') || p.includes('daily') || p.includes('weekly') || p.includes('every morning') || p.includes('schedule')) {
    triggerType = 'SCHEDULE';
    triggerDesc = p.includes('monday') ? 'Every Monday at 09:00 AM' : 'Scheduled recurring timer';
  } else if (p.includes('calendar') && (p.includes('before') || p.includes('after') || p.includes('event created'))) {
    triggerType = 'CALENDAR_EVENT';
    triggerDesc = 'When a calendar event is scheduled or updated';
  } else if (!isEmail && !p.includes('every')) {
    triggerType = 'MANUAL';
    triggerDesc = 'When manually triggered by user';
  }

  const conditions = [];
  if (isEmail && isUrgent) {
    conditions.push({
      type: 'SEMANTIC_MATCH' as const,
      value: 'urgent customer request',
      description: 'Determine whether the email represents an urgent customer request',
    });
  } else if (p.includes('customer')) {
    conditions.push({
      type: 'SENDER_MATCH' as const,
      value: 'customer domain',
      description: 'Check if sender belongs to active customer accounts',
    });
  } else if (isCalendar && p.includes('conflict')) {
    conditions.push({
      type: 'AVAILABILITY' as const,
      description: 'Check for calendar conflicts and available open slots',
    });
  }

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

  const retryCount = p.includes('three') || p.includes('3 times') ? 3 : 2;
  const recovery = {
    enabled: isFallback || isUrgent || actions.some((a) => a.type === 'CREATE_TASK'),
    strategy: isFallback ? ('RETRY_THEN_FALLBACK' as const) : ('RETRY' as const),
    retryCount,
    fallback: isFallback ? 'BACKUP_TASK_PROVIDER' : undefined,
    description: isFallback
      ? `Retry ${retryCount} times then failover to backup task provider`
      : `Auto-retry up to ${retryCount} times on transient API failure`,
  };

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

  const confidence = prompt.length > 15 ? 0.96 : 0.75;
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

export function editClientWorkflow(current: Workflow, instruction: string): Workflow {
  const inst = instruction.toLowerCase();
  const updated = JSON.parse(JSON.stringify(current)) as Workflow;

  if (inst.includes('retry 3') || inst.includes('three times') || inst.includes('retry three')) {
    updated.recovery.enabled = true;
    updated.recovery.retryCount = 3;
    updated.recovery.strategy = updated.recovery.fallback ? 'RETRY_THEN_FALLBACK' : 'RETRY';
    updated.recovery.description = `Retry 3 times ${updated.recovery.fallback ? 'then failover to backup provider' : 'on failure'}`;
  }

  if (inst.includes('retry twice') || inst.includes('2 times') || inst.includes('retry 2')) {
    updated.recovery.enabled = true;
    updated.recovery.retryCount = 2;
    updated.recovery.strategy = updated.recovery.fallback ? 'RETRY_THEN_FALLBACK' : 'RETRY';
  }

  if (inst.includes('ask me') || inst.includes('approval') || inst.includes('confirm before')) {
    updated.approvalRequired = true;
    updated.explainability.planSteps.unshift('AURA prompts user for confirmation prior to executing step.');
  }

  if (inst.includes('no approval') || inst.includes('auto execute') || inst.includes('remove approval')) {
    if (updated.risk.level !== 'HIGH' && updated.risk.level !== 'CRITICAL') {
      updated.approvalRequired = false;
    }
  }

  if (inst.includes('high priority') || inst.includes('priority to high')) {
    updated.actions.forEach((a) => {
      if (a.type === 'CREATE_TASK') a.priority = 'HIGH';
    });
  }

  if (inst.includes('medium priority') || inst.includes('priority to medium')) {
    updated.actions.forEach((a) => {
      if (a.type === 'CREATE_TASK') a.priority = 'MEDIUM';
    });
  }

  if (inst.includes('backup') && !updated.recovery.fallback) {
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
