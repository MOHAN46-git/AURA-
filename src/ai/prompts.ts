/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type } from '@google/genai';

export const WORKFLOW_GENERATION_SYSTEM_INSTRUCTION = `You are AURA, an AI-native Lifestyle & Automation Workflow operating system architect.
Your motto: "Users define goals. AURA determines how to accomplish them safely and reliably."

You receive a user's natural language goal and convert it into a STRICTLY STRUCTURED workflow schema.

CRITICAL ARCHITECTURAL CONSTRAINTS:
You must compose workflows using ONLY these supported capabilities:

1. SUPPORTED TRIGGERS:
- EMAIL_RECEIVED: When a new email arrives
- SCHEDULE: Time-based recurrence (e.g. every Monday, daily at 9am)
- MANUAL: Direct instant user invocation
- CALENDAR_EVENT: Calendar event start, update, or attendee change
- FORM_SUBMITTED: External form or webhook input

2. SUPPORTED CONDITIONS:
- EMAIL_URGENT: Evaluates urgency/importance of email
- SENDER_MATCH: Matches sender email or domain
- SEMANTIC_MATCH: Evaluates natural language meaning match (e.g. "urgent customer request")
- KEYWORD_MATCH: Matches specific keywords
- TIME_MATCH: Evaluates business hours / day / time window
- AVAILABILITY: Checks calendar free/busy availability
- PRIORITY_MATCH: Checks priority level

3. SUPPORTED ACTIONS:
- CREATE_TASK: Create task in task provider (priority: LOW, MEDIUM, HIGH, CRITICAL)
- SEND_NOTIFICATION: Send private user notification (push / in-app)
- SEND_EMAIL: Dispatch external email message
- CREATE_CALENDAR_EVENT: Schedule event or block time on calendar
- GENERATE_SUMMARY: Synthesize AI summary of data or updates
- SAVE_DATA: Save records or logs
- CALL_WEBHOOK: Dispatch external HTTPS webhook

4. SUPPORTED RECOVERY STRATEGIES:
- NONE
- RETRY (e.g. retry 2 or 3 times)
- FALLBACK (switch to backup provider)
- RETRY_THEN_FALLBACK (retry first, then fallback to backup provider)
- REQUEST_USER (ask user for guidance)

5. SUPPORTED VERIFICATION TYPES:
- TASK_EXISTS (verify task exists in provider)
- EMAIL_SENT (verify outgoing email delivery receipt)
- EVENT_EXISTS (verify calendar booking)
- DATA_SAVED (verify storage record)
- WEBHOOK_SUCCESS (verify HTTP 2xx response)
- USER_CONFIRMATION (ask for user acknowledgement)

6. CONFIDENCE SCORING RULES:
- High (0.85 - 1.00): Clear, well-defined goal using supported capabilities.
- Medium (0.60 - 0.84): Feasible but has minor ambiguities or assumptions. Provide clarificationNeeded.
- Low (0.00 - 0.59): Highly ambiguous, impossible, or largely unsupported request.

7. EXPLAINABILITY SECTION:
You must provide structured plain-English explanations answering:
- understoodIntent: What did AURA understand the user wants?
- planSteps: Array of sequential steps AURA will execute.
- actionJustification: Why are these actions necessary?
- failureModes: What could realistically fail during execution?
- recoveryExplanation: What will AURA do if something fails?
- verificationExplanation: How will AURA confirm the goal succeeded?

If the user's request asks to modify an existing workflow, preserve the existing workflow's structure and adapt only the targeted properties.`;

export const WORKFLOW_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: 'Clear, concise workflow name (e.g., "Urgent Customer Email Handler")',
    },
    goal: {
      type: Type.STRING,
      description: 'Normalized user goal in concise active voice',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Confidence score from 0.0 to 1.0',
    },
    clarificationNeeded: {
      type: Type.STRING,
      description: 'Optional question or clarification notice if confidence is below 0.85',
    },
    trigger: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          description: 'One of EMAIL_RECEIVED, SCHEDULE, MANUAL, CALENDAR_EVENT, FORM_SUBMITTED',
        },
        description: {
          type: Type.STRING,
          description: 'Human-readable trigger description',
        },
      },
      required: ['type', 'description'],
    },
    conditions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description: 'One of EMAIL_URGENT, SENDER_MATCH, SEMANTIC_MATCH, KEYWORD_MATCH, TIME_MATCH, AVAILABILITY, PRIORITY_MATCH',
          },
          value: {
            type: Type.STRING,
            description: 'Condition value or target expression',
          },
          description: {
            type: Type.STRING,
            description: 'Human-readable condition description',
          },
        },
        required: ['type', 'description'],
      },
    },
    actions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: 'Action unique ID like "action-1"',
          },
          type: {
            type: Type.STRING,
            description: 'One of CREATE_TASK, SEND_NOTIFICATION, SEND_EMAIL, CREATE_CALENDAR_EVENT, GENERATE_SUMMARY, SAVE_DATA, CALL_WEBHOOK',
          },
          description: {
            type: Type.STRING,
            description: 'Human-readable action description',
          },
          priority: {
            type: Type.STRING,
            description: 'One of LOW, MEDIUM, HIGH, CRITICAL',
          },
        },
        required: ['id', 'type', 'description'],
      },
    },
    recovery: {
      type: Type.OBJECT,
      properties: {
        enabled: {
          type: Type.BOOLEAN,
          description: 'Whether recovery is enabled',
        },
        strategy: {
          type: Type.STRING,
          description: 'One of NONE, RETRY, FALLBACK, RETRY_THEN_FALLBACK, REQUEST_USER',
        },
        retryCount: {
          type: Type.INTEGER,
          description: 'Number of retries (e.g. 2 or 3)',
        },
        fallback: {
          type: Type.STRING,
          description: 'Name of fallback provider or action (e.g. "BACKUP_TASK_PROVIDER")',
        },
        description: {
          type: Type.STRING,
          description: 'Human-readable recovery plan description',
        },
      },
      required: ['enabled', 'strategy'],
    },
    verification: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          description: 'One of TASK_EXISTS, EMAIL_SENT, EVENT_EXISTS, DATA_SAVED, WEBHOOK_SUCCESS, USER_CONFIRMATION',
        },
        description: {
          type: Type.STRING,
          description: 'How outcome will be verified',
        },
      },
      required: ['type', 'description'],
    },
    explainability: {
      type: Type.OBJECT,
      properties: {
        understoodIntent: {
          type: Type.STRING,
          description: 'Concise explanation of what AURA understood the user wants to achieve',
        },
        planSteps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Numbered steps in the execution plan',
        },
        actionJustification: {
          type: Type.STRING,
          description: 'Why these specific actions are necessary to achieve the goal',
        },
        failureModes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'What external or system errors could occur during execution',
        },
        recoveryExplanation: {
          type: Type.STRING,
          description: 'What AURA will specifically do if failures happen',
        },
        verificationExplanation: {
          type: Type.STRING,
          description: 'How AURA independently verifies the outcome has been achieved',
        },
      },
      required: [
        'understoodIntent',
        'planSteps',
        'actionJustification',
        'failureModes',
        'recoveryExplanation',
        'verificationExplanation',
      ],
    },
  },
  required: [
    'name',
    'goal',
    'confidence',
    'trigger',
    'actions',
    'recovery',
    'verification',
    'explainability',
  ],
};
