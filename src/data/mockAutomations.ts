/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Workflow } from '../workflow/types.ts';

export const INITIAL_MOCK_AUTOMATIONS: Workflow[] = [
  {
    id: 'wf-demo-urgent-email',
    name: 'Urgent Customer Email Handler',
    goal: 'Whenever I receive an urgent customer email, create a high-priority task, notify me, and make sure the task gets created even if my primary task service fails.',
    rawPrompt: 'Whenever I receive an urgent customer email, create a high-priority task, notify me, and make sure the task gets created even if my primary task service fails.',
    confidence: 0.96,
    confidenceLevel: 'HIGH',
    trigger: {
      type: 'EMAIL_RECEIVED',
      description: 'When a new email arrives in primary inbox',
    },
    conditions: [
      {
        type: 'SEMANTIC_MATCH',
        value: 'urgent customer request',
        description: 'Determine whether the email represents an urgent customer request',
      },
    ],
    actions: [
      {
        id: 'action-1',
        type: 'CREATE_TASK',
        description: 'Create a high-priority task in primary task provider',
        priority: 'HIGH',
      },
      {
        id: 'action-2',
        type: 'SEND_NOTIFICATION',
        description: 'Notify the user via instant high-priority alert',
        priority: 'HIGH',
      },
    ],
    risk: {
      level: 'LOW',
      reason: 'Creates an internal task and sends a private notification to you.',
      factors: ['Dispatches private notification to user only', 'Creates a persistent task in task provider'],
    },
    approvalRequired: false,
    recovery: {
      enabled: true,
      strategy: 'RETRY_THEN_FALLBACK',
      retryCount: 2,
      fallback: 'BACKUP_TASK_PROVIDER',
      description: 'Retry twice → Backup task provider',
    },
    verification: {
      type: 'TASK_EXISTS',
      description: 'Confirm that the requested task exists',
    },
    explainability: {
      understoodIntent: 'Handle urgent customer requests reliably with zero downtime.',
      planSteps: [
        'Monitor incoming email inbox for new messages.',
        'Determine whether message represents an urgent customer request using AI semantics.',
        'Create a high-priority task in task system.',
        'Notify the user via instant private notification.',
        'Verify that the requested task exists in the task repository.',
        'If primary task service fails, retry twice with exponential backoff.',
        'If retries fail, seamlessly route task creation to backup task provider.',
      ],
      actionJustification: 'Ensures urgent client requests are instantly surfaced to engineering on-call without getting dropped during vendor outages.',
      failureModes: [
        'Primary task service API 500/503 outage or rate limits',
        'Incoming email attachment size spikes causing gateway timeout',
      ],
      recoveryExplanation: 'AURA automatically catches primary task provider failures, retries 2 times, and switches to the verified backup provider.',
      verificationExplanation: 'AURA polls the task API endpoint to confirm receipt and verify the newly assigned task ID.',
    },
    requiredCapabilities: [
      {
        id: 'email:read',
        category: 'Email',
        permission: 'email:read',
        label: 'Email: Read',
        description: 'Allows reading metadata and contents of incoming emails',
        granted: true,
      },
      {
        id: 'tasks:create',
        category: 'Tasks',
        permission: 'tasks:create',
        label: 'Tasks: Create',
        description: 'Creates items in primary and backup task services',
        granted: true,
      },
      {
        id: 'notifications:send',
        category: 'Notifications',
        permission: 'notifications:send',
        label: 'Notifications: Send',
        description: 'Dispatches secure private notifications to your devices',
        granted: true,
      },
    ],
    createdAt: '2026-08-18T10:15:00Z',
    status: 'ACTIVE',
    executionCount: 142,
    lastRunStatus: 'SUCCESS',
  },
  {
    id: 'wf-weekly-exec-summary',
    name: 'Weekly Executive Briefing Synthesizer',
    goal: 'Every Monday morning, prepare a summary of my project updates and schedule team review.',
    rawPrompt: 'Every Monday morning, prepare a summary of my project updates and schedule team review.',
    confidence: 0.94,
    confidenceLevel: 'HIGH',
    trigger: {
      type: 'SCHEDULE',
      description: 'Every Monday at 09:00 AM UTC',
    },
    conditions: [
      {
        type: 'TIME_MATCH',
        value: 'Monday 09:00',
        description: 'Verify execution occurs within scheduled Monday morning window',
      },
    ],
    actions: [
      {
        id: 'act-sum-1',
        type: 'GENERATE_SUMMARY',
        description: 'Synthesize updates across recent project tickets and deliverables',
        priority: 'MEDIUM',
      },
      {
        id: 'act-sum-2',
        type: 'SEND_NOTIFICATION',
        description: 'Deliver executive summary card directly to dashboard',
        priority: 'LOW',
      },
    ],
    risk: {
      level: 'LOW',
      reason: 'Executes read-only evaluation and delivers private notification to you.',
      factors: ['Performs read-only AI summarization', 'Dispatches private notification to user only'],
    },
    approvalRequired: false,
    recovery: {
      enabled: true,
      strategy: 'RETRY',
      retryCount: 3,
      description: 'Retry 3 times on AI model rate limiting',
    },
    verification: {
      type: 'DATA_SAVED',
      description: 'Verify summary document generated and cached in workspace',
    },
    explainability: {
      understoodIntent: 'Automate weekly leadership updates compilation every Monday morning.',
      planSteps: [
        'Trigger at 9:00 AM every Monday.',
        'Collect project activity and synthesize key accomplishments.',
        'Deliver structured briefing notification.',
        'Verify document persistence in workspace storage.',
      ],
      actionJustification: 'Saves 45 minutes of manual status report writing every week.',
      failureModes: ['Temporary workspace API rate throttling'],
      recoveryExplanation: 'Retries synthesis with backoff up to 3 times.',
      verificationExplanation: 'Verifies briefing artifact is stored and accessible.',
    },
    requiredCapabilities: [
      {
        id: 'notifications:send',
        category: 'Notifications',
        permission: 'notifications:send',
        label: 'Notifications: Send',
        description: 'Dispatches secure private notifications to your devices',
        granted: true,
      },
    ],
    createdAt: '2026-08-15T08:00:00Z',
    status: 'ACTIVE',
    executionCount: 24,
    lastRunStatus: 'SUCCESS',
  },
  {
    id: 'wf-external-partner-sync',
    name: 'Partner Lead Inquiry Routing',
    goal: 'When an enterprise inquiry form is submitted, send introduction email with proposal link.',
    rawPrompt: 'When an enterprise inquiry form is submitted, send introduction email with proposal link.',
    confidence: 0.91,
    confidenceLevel: 'HIGH',
    trigger: {
      type: 'FORM_SUBMITTED',
      description: 'When enterprise partner form is submitted',
    },
    conditions: [
      {
        type: 'PRIORITY_MATCH',
        value: 'Tier-1 Enterprise',
        description: 'Verify submission meets Tier-1 revenue threshold',
      },
    ],
    actions: [
      {
        id: 'act-partner-email',
        type: 'SEND_EMAIL',
        description: 'Dispatch personalized proposal email to partner lead',
        priority: 'HIGH',
      },
      {
        id: 'act-partner-task',
        type: 'CREATE_TASK',
        description: 'Create CRM follow-up task for Account Executive',
        priority: 'MEDIUM',
      },
    ],
    risk: {
      level: 'HIGH',
      reason: 'Sends outbound communications to external email recipients.',
      factors: ['Sends outbound communications to external email recipients', 'Creates persistent task in task provider'],
    },
    approvalRequired: true,
    recovery: {
      enabled: true,
      strategy: 'REQUEST_USER',
      description: 'Request user intervention if outbound SMTP rejects recipient address',
    },
    verification: {
      type: 'EMAIL_SENT',
      description: 'Confirm that outgoing email was successfully dispatched and accepted',
    },
    explainability: {
      understoodIntent: 'Automate high-touch enterprise partner onboarding with mandatory safety review.',
      planSteps: [
        'Listen for enterprise lead form submission.',
        'Verify lead qualification tier.',
        'Request user authorization before dispatching external email.',
        'Send introductory email with custom collateral.',
        'Create follow-up task on sales calendar.',
        'Verify delivery receipt from mail exchange.',
      ],
      actionJustification: 'Accelerates lead response time while maintaining strict human-in-the-loop email safeguards.',
      failureModes: ['Invalid recipient email domain', 'Attachment upload latency'],
      recoveryExplanation: 'Prompts sales manager for clarification if delivery bounces.',
      verificationExplanation: 'Validates SMTP 250 OK acknowledgment from recipient mail server.',
    },
    requiredCapabilities: [
      {
        id: 'email:send',
        category: 'Email',
        permission: 'email:send',
        label: 'Email: Send',
        description: 'Allows sending emails to external parties',
        granted: true,
      },
      {
        id: 'tasks:create',
        category: 'Tasks',
        permission: 'tasks:create',
        label: 'Tasks: Create',
        description: 'Creates items in primary and backup task services',
        granted: true,
      },
    ],
    createdAt: '2026-08-16T14:30:00Z',
    status: 'ACTIVE',
    executionCount: 18,
    lastRunStatus: 'RECOVERED',
  },
  {
    id: 'wf-demo-texting-command',
    name: 'Texting Command & Instant Task Triage',
    goal: 'Whenever I receive an urgent text message or SMS, create a high-priority task and text me a confirmation.',
    rawPrompt: 'Whenever I receive an urgent text message or SMS, create a high-priority task and text me a confirmation.',
    confidence: 0.98,
    confidenceLevel: 'HIGH',
    trigger: {
      type: 'TEXT_RECEIVED',
      description: 'When an incoming text / SMS command is received',
    },
    conditions: [
      {
        type: 'SEMANTIC_MATCH',
        value: 'urgent request or command',
        description: 'Determine whether the text message represents an urgent request or command',
      },
    ],
    actions: [
      {
        id: 'action-task-1',
        type: 'CREATE_TASK',
        description: 'Create high-priority task in primary task provider',
        priority: 'HIGH',
      },
      {
        id: 'action-text-2',
        type: 'SEND_TEXT',
        description: 'Dispatch outbound SMS text message confirmation',
        priority: 'HIGH',
      },
    ],
    risk: {
      level: 'HIGH',
      reason: 'Dispatches outbound SMS / text communication; review confirmation before dispatching.',
      factors: ['Dispatches outbound SMS or text message to recipient', 'Creates a persistent task in task provider'],
    },
    approvalRequired: true,
    recovery: {
      enabled: true,
      strategy: 'RETRY_THEN_FALLBACK',
      retryCount: 2,
      fallback: 'BACKUP_TASK_PROVIDER',
      description: 'Retry twice → Backup task provider',
    },
    verification: {
      type: 'TEXT_SENT',
      description: 'Confirm text / SMS delivery receipt',
    },
    explainability: {
      understoodIntent: 'Handle urgent text commands and dispatch SMS confirmation receipts with failover.',
      planSteps: [
        'Monitor incoming SMS and text commands.',
        'Evaluate urgency semantic matching criteria.',
        'Create high-priority task in task system.',
        'Dispatch outbound text confirmation to sender.',
        'Verify SMS carrier receipt delivery acknowledgment.',
        'Failover to backup task provider if primary task service is degraded.',
      ],
      actionJustification: 'Allows seamless hands-free mobile command execution with instant SMS receipts.',
      failureModes: ['Carrier SMS gateway timeout', 'Task provider rate limiting'],
      recoveryExplanation: 'AURA retries 2 times and switches to backup task provider.',
      verificationExplanation: 'Queries SMS carrier gateway receipt for delivery certification.',
    },
    requiredCapabilities: [
      {
        id: 'sms:read',
        category: 'Messaging',
        permission: 'sms:read',
        label: 'Text / SMS: Read',
        description: 'Allows reading incoming SMS and text command messages',
        granted: true,
      },
      {
        id: 'tasks:create',
        category: 'Tasks',
        permission: 'tasks:create',
        label: 'Tasks: Create',
        description: 'Creates items in primary and backup task services',
        granted: true,
      },
      {
        id: 'sms:send',
        category: 'Messaging',
        permission: 'sms:send',
        label: 'Text / SMS: Send',
        description: 'Allows dispatching outbound SMS and text messages',
        granted: true,
      },
    ],
    createdAt: '2026-08-18T09:00:00Z',
    status: 'ACTIVE',
    executionCount: 24,
    lastRunStatus: 'SUCCESS',
  },
];

export interface DashboardMetrics {
  activeAutomationsCount: number;
  todayExecutions: number;
  workflowHealthPercent: number;
  recoveredExecutions: number;
  pendingApprovals: number;
}

export function computeDashboardMetrics(workflows: Workflow[]): DashboardMetrics {
  const activeCount = workflows.filter((w) => w.status === 'ACTIVE').length;
  const pendingApprovals = workflows.filter((w) => w.approvalRequired && w.status === 'ACTIVE').length;
  
  return {
    activeAutomationsCount: activeCount,
    todayExecutions: 89,
    workflowHealthPercent: 99.4,
    recoveredExecutions: 12,
    pendingApprovals,
  };
}
