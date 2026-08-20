/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionType,
  CapabilityRequirement,
  ConditionType,
  RecoveryStrategyType,
  TriggerType,
  VerificationType,
  Workflow,
} from './types.ts';

export interface CapabilityMeta<T extends string> {
  type: T;
  label: string;
  category: string;
  description: string;
  requiredPermission?: {
    category: string;
    permission: string;
    label: string;
    description: string;
  };
}

export const SUPPORTED_TRIGGERS: Record<TriggerType, CapabilityMeta<TriggerType>> = {
  EMAIL_RECEIVED: {
    type: 'EMAIL_RECEIVED',
    label: 'Incoming Email Event',
    category: 'Email',
    description: 'Triggers when a new email arrives in your inbox or specific folder',
    requiredPermission: {
      category: 'Email',
      permission: 'email:read',
      label: 'Email: Read',
      description: 'Allows reading metadata and contents of incoming emails',
    },
  },
  TEXT_RECEIVED: {
    type: 'TEXT_RECEIVED',
    label: 'Incoming Text / SMS Command',
    category: 'Messaging',
    description: 'Triggers when an SMS, text message, or instant command arrives from user or client',
    requiredPermission: {
      category: 'Messaging',
      permission: 'sms:read',
      label: 'Text / SMS: Read',
      description: 'Allows reading incoming SMS and text command messages',
    },
  },
  SCHEDULE: {
    type: 'SCHEDULE',
    label: 'Time-based Schedule (Cron)',
    category: 'Time',
    description: 'Triggers periodically based on a defined schedule or recurring interval',
  },
  MANUAL: {
    type: 'MANUAL',
    label: 'Manual Instant Trigger',
    category: 'User',
    description: 'Triggers on direct user delegation or one-click command',
  },
  CALENDAR_EVENT: {
    type: 'CALENDAR_EVENT',
    label: 'Calendar Event Change',
    category: 'Calendar',
    description: 'Triggers before, during, or after events on your calendar',
    requiredPermission: {
      category: 'Calendar',
      permission: 'calendar:read',
      label: 'Calendar: Read',
      description: 'Allows reading calendar events and attendee responses',
    },
  },
  FORM_SUBMITTED: {
    type: 'FORM_SUBMITTED',
    label: 'Form / Webhook Submission',
    category: 'Forms',
    description: 'Triggers when external forms or webhook payloads arrive',
  },
};

export const SUPPORTED_CONDITIONS: Record<ConditionType, CapabilityMeta<ConditionType>> = {
  EMAIL_URGENT: {
    type: 'EMAIL_URGENT',
    label: 'Email Urgency Evaluation',
    category: 'AI Analysis',
    description: 'Evaluates email semantic urgency, tone, SLA markers, and customer importance',
  },
  SENDER_MATCH: {
    type: 'SENDER_MATCH',
    label: 'Sender / Domain Match',
    category: 'Filters',
    description: 'Checks if sender matches specific email addresses, domains, or VIP lists',
  },
  SEMANTIC_MATCH: {
    type: 'SEMANTIC_MATCH',
    label: 'AI Semantic Meaning Match',
    category: 'AI Analysis',
    description: 'Evaluates whether content matches a natural language concept or intent',
  },
  KEYWORD_MATCH: {
    type: 'KEYWORD_MATCH',
    label: 'Exact Keyword Filter',
    category: 'Filters',
    description: 'Checks for presence of specific keywords or tags',
  },
  TIME_MATCH: {
    type: 'TIME_MATCH',
    label: 'Time Window Evaluation',
    category: 'Time',
    description: 'Checks if execution occurs within specific business hours or dates',
  },
  AVAILABILITY: {
    type: 'AVAILABILITY',
    label: 'Free / Busy Calendar Check',
    category: 'Calendar',
    description: 'Verifies user calendar availability without conflicts',
    requiredPermission: {
      category: 'Calendar',
      permission: 'calendar:read',
      label: 'Calendar: Read',
      description: 'Checks schedule for free/busy status',
    },
  },
  PRIORITY_MATCH: {
    type: 'PRIORITY_MATCH',
    label: 'Priority Level Match',
    category: 'Filters',
    description: 'Matches tasks or tickets by priority level',
  },
};

export const SUPPORTED_ACTIONS: Record<ActionType, CapabilityMeta<ActionType>> = {
  CREATE_TASK: {
    type: 'CREATE_TASK',
    label: 'Create Task',
    category: 'Tasks',
    description: 'Creates a new actionable task in the primary task provider with priority & due dates',
    requiredPermission: {
      category: 'Tasks',
      permission: 'tasks:create',
      label: 'Tasks: Create',
      description: 'Creates items in primary and backup task services',
    },
  },
  SEND_NOTIFICATION: {
    type: 'SEND_NOTIFICATION',
    label: 'Send Private Notification',
    category: 'Notifications',
    description: 'Sends real-time in-app, push, or desktop alert to the user',
    requiredPermission: {
      category: 'Notifications',
      permission: 'notifications:send',
      label: 'Notifications: Send',
      description: 'Dispatches secure private notifications to your devices',
    },
  },
  SEND_EMAIL: {
    type: 'SEND_EMAIL',
    label: 'Send Outbound Email',
    category: 'Email',
    description: 'Dispatches an email to external recipients or drafts a response',
    requiredPermission: {
      category: 'Email',
      permission: 'email:send',
      label: 'Email: Send',
      description: 'Allows sending emails to external parties',
    },
  },
  SEND_TEXT: {
    type: 'SEND_TEXT',
    label: 'Send Outbound Text / SMS',
    category: 'Messaging',
    description: 'Dispatches an outbound SMS or instant text message to recipient or phone number',
    requiredPermission: {
      category: 'Messaging',
      permission: 'sms:send',
      label: 'Text / SMS: Send',
      description: 'Allows dispatching outbound SMS and text messages',
    },
  },
  CREATE_CALENDAR_EVENT: {
    type: 'CREATE_CALENDAR_EVENT',
    label: 'Schedule Calendar Event',
    category: 'Calendar',
    description: 'Creates a calendar meeting or time-block on your primary calendar',
    requiredPermission: {
      category: 'Calendar',
      permission: 'calendar:write',
      label: 'Calendar: Write',
      description: 'Creates or updates calendar events',
    },
  },
  GENERATE_SUMMARY: {
    type: 'GENERATE_SUMMARY',
    label: 'Synthesize AI Summary',
    category: 'AI Analysis',
    description: 'Uses AI (Grok / Gemini) to summarize updates, transcripts, or email threads',
  },
  SAVE_DATA: {
    type: 'SAVE_DATA',
    label: 'Store Document / Data',
    category: 'Storage',
    description: 'Saves structured records, files, or audit logs to database',
    requiredPermission: {
      category: 'Storage',
      permission: 'storage:write',
      label: 'Storage: Write',
      description: 'Stores data in application persistence',
    },
  },
  CALL_WEBHOOK: {
    type: 'CALL_WEBHOOK',
    label: 'Dispatch Secure Webhook',
    category: 'Integrations',
    description: 'Calls an external HTTPS webhook endpoint with structured payload',
    requiredPermission: {
      category: 'Integrations',
      permission: 'webhook:execute',
      label: 'Webhook: Call',
      description: 'Executes outgoing network webhooks',
    },
  },
};

export const SUPPORTED_RECOVERY_STRATEGIES: Record<RecoveryStrategyType, { label: string; description: string }> = {
  NONE: {
    label: 'Fail Immediately',
    description: 'Do not attempt recovery; flag as failed and halt workflow.',
  },
  RETRY: {
    label: 'Exponential Retry',
    description: 'Automatically retry the failed action up to designated retry count.',
  },
  FALLBACK: {
    label: 'Backup Provider Fallback',
    description: 'Switch immediately to secondary backup service if primary provider fails.',
  },
  RETRY_THEN_FALLBACK: {
    label: 'Retry then Failover to Backup Provider',
    description: 'Retry primary service first; if retries exhaust, gracefully execute backup provider.',
  },
  REQUEST_USER: {
    label: 'Request User Intervention',
    description: 'Pause execution and notify user with resolution options.',
  },
};

export const SUPPORTED_VERIFICATION_TYPES: Record<VerificationType, { label: string; description: string }> = {
  TASK_EXISTS: {
    label: 'Task Existence Verification',
    description: 'Queries task API to ensure the created task ID exists and matches payload.',
  },
  EMAIL_SENT: {
    label: 'Email Delivery Receipt',
    description: 'Confirms SMTP / API server accepted the outgoing message transmission.',
  },
  TEXT_SENT: {
    label: 'Text / SMS Delivery Confirmation',
    description: 'Confirms SMS gateway dispatched the message and received carrier delivery receipt.',
  },
  EVENT_EXISTS: {
    label: 'Calendar Event Confirmation',
    description: 'Confirms event was booked and appears on calendar feed.',
  },
  DATA_SAVED: {
    label: 'Data Consistency Check',
    description: 'Queries storage to confirm checksum and persistent record existence.',
  },
  WEBHOOK_SUCCESS: {
    label: 'Webhook HTTP 2xx Status',
    description: 'Validates that the target webhook returned HTTP 200/201/204 status code.',
  },
  USER_CONFIRMATION: {
    label: 'Manual User Acknowledgement',
    description: 'Awaits explicit user thumbs-up or confirmation before marking complete.',
  },
};

/**
 * Extracts and deduplicates the list of capability permissions required by a workflow.
 */
export function extractRequiredCapabilities(workflow: Partial<Workflow>): CapabilityRequirement[] {
  const capMap = new Map<string, CapabilityRequirement>();

  // Check Trigger
  if (workflow.trigger?.type && SUPPORTED_TRIGGERS[workflow.trigger.type]?.requiredPermission) {
    const p = SUPPORTED_TRIGGERS[workflow.trigger.type].requiredPermission!;
    capMap.set(p.permission, {
      id: p.permission,
      category: p.category,
      permission: p.permission,
      label: p.label,
      description: p.description,
      granted: true,
    });
  }

  // Check Conditions
  if (Array.isArray(workflow.conditions)) {
    for (const c of workflow.conditions) {
      if (c.type && SUPPORTED_CONDITIONS[c.type]?.requiredPermission) {
        const p = SUPPORTED_CONDITIONS[c.type].requiredPermission!;
        capMap.set(p.permission, {
          id: p.permission,
          category: p.category,
          permission: p.permission,
          label: p.label,
          description: p.description,
          granted: true,
        });
      }
    }
  }

  // Check Actions
  if (Array.isArray(workflow.actions)) {
    for (const a of workflow.actions) {
      if (a.type && SUPPORTED_ACTIONS[a.type]?.requiredPermission) {
        const p = SUPPORTED_ACTIONS[a.type].requiredPermission!;
        capMap.set(p.permission, {
          id: p.permission,
          category: p.category,
          permission: p.permission,
          label: p.label,
          description: p.description,
          granted: true,
        });
      }
    }
  }

  return Array.from(capMap.values());
}

/**
 * Checks if a given capability type is whitelisted in the capability registry.
 */
export function isCapabilitySupported(
  category: 'TRIGGERS' | 'CONDITIONS' | 'ACTIONS' | 'RECOVERY' | 'VERIFICATION',
  capabilityType: string
): boolean {
  switch (category) {
    case 'TRIGGERS':
      return capabilityType in SUPPORTED_TRIGGERS;
    case 'CONDITIONS':
      return capabilityType in SUPPORTED_CONDITIONS;
    case 'ACTIONS':
      return capabilityType in SUPPORTED_ACTIONS;
    case 'RECOVERY':
      return capabilityType in SUPPORTED_RECOVERY_STRATEGIES;
    case 'VERIFICATION':
      return capabilityType in SUPPORTED_VERIFICATION_TYPES;
    default:
      return false;
  }
}

