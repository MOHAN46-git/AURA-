/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Workflow } from '../../src/workflow/types.ts';

/**
 * Fixture: Golden Hackathon Workflow
 * Goal: "Whenever I receive an urgent customer email, create a high-priority task, notify me, and make sure the task gets created even if my primary task service fails."
 */
export const GOLDEN_HACKATHON_WORKFLOW: Workflow = {
  id: 'wf-golden-hackathon-01',
  name: 'Urgent Customer Email Handler with Resilient Fallback',
  goal: 'Whenever I receive an urgent customer email, create a high-priority task, notify me, and make sure the task gets created even if my primary task service fails.',
  confidence: 0.98,
  confidenceLevel: 'HIGH',
  trigger: {
    type: 'EMAIL_RECEIVED',
    description: 'When an incoming customer email is received in inbox',
  },
  conditions: [
    {
      type: 'SEMANTIC_MATCH',
      value: 'urgent customer request',
      description: 'Check if email subject or body indicates urgent customer priority',
    },
  ],
  actions: [
    {
      id: 'act-task-1',
      type: 'CREATE_TASK',
      description: 'Create high-priority task in primary task manager',
      priority: 'HIGH',
      target: 'PRIMARY_TASK_PROVIDER',
    },
    {
      id: 'act-notify-1',
      type: 'SEND_NOTIFICATION',
      description: 'Notify user via high-priority push notification',
      priority: 'LOW',
    },
  ],
  recovery: {
    enabled: true,
    strategy: 'RETRY_THEN_FALLBACK',
    retryCount: 2,
    fallback: 'BACKUP_TASK_PROVIDER',
    description: 'Retry 2 times then failover to backup task provider',
  },
  verification: {
    type: 'TASK_EXISTS',
    description: 'Confirm that task entity exists in destination store',
  },
  risk: {
    level: 'LOW',
    reason: 'Standard internal task creation and private user notification.',
    factors: ['Read-only email trigger', 'Reversible task creation', 'Safe internal notifications'],
  },
  approvalRequired: false,
  explainability: {
    understoodIntent: 'Handle urgent customer requests reliably with zero data loss failover.',
    planSteps: [
      'Monitor incoming email inbox.',
      'Evaluate urgency condition criteria.',
      'Attempt task creation in primary task provider.',
      'If primary provider fails, retry 2 times then failover to backup provider.',
      'Dispatch notification alert.',
      'Verify task presence in target system.',
    ],
    actionJustification: 'Ensures urgent customer issues are captured even during downstream service outages.',
    failureModes: ['Primary task service 503 outage', 'Network latency spikes'],
    recoveryExplanation: 'AURA will retry 2 times before routing to backup task provider.',
    verificationExplanation: 'Direct destination querying verifies the task entity.',
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
  createdAt: new Date().toISOString(),
  status: 'ACTIVE',
};

/**
 * Fixture: Normal Path Workflow (No Fallback Needed)
 * Goal: "Whenever I receive an urgent customer email, create a high-priority task and notify me."
 */
export const NORMAL_EXECUTION_WORKFLOW: Workflow = {
  id: 'wf-normal-01',
  name: 'Urgent Customer Email Task Creation',
  goal: 'Whenever I receive an urgent customer email, create a high-priority task and notify me.',
  confidence: 0.95,
  confidenceLevel: 'HIGH',
  trigger: {
    type: 'EMAIL_RECEIVED',
    description: 'When an incoming customer email is received',
  },
  conditions: [
    {
      type: 'SEMANTIC_MATCH',
      value: 'urgent customer request',
      description: 'Check if email indicates urgent customer priority',
    },
  ],
  actions: [
    {
      id: 'act-normal-task',
      type: 'CREATE_TASK',
      description: 'Create high-priority task',
      priority: 'HIGH',
    },
    {
      id: 'act-normal-notify',
      type: 'SEND_NOTIFICATION',
      description: 'Send instant notification alert',
      priority: 'LOW',
    },
  ],
  recovery: {
    enabled: false,
    strategy: 'NONE',
  },
  verification: {
    type: 'TASK_EXISTS',
    description: 'Confirm task exists in destination store',
  },
  risk: {
    level: 'LOW',
    reason: 'Standard automated task delegation and private notification.',
    factors: ['Standard automated task delegation'],
  },
  approvalRequired: false,
  explainability: {
    understoodIntent: 'Automatically create task and notify user upon urgent email.',
    planSteps: ['Ingest email', 'Check urgency', 'Create task', 'Notify user', 'Verify outcome'],
    actionJustification: 'Immediate task creation.',
    failureModes: [],
    recoveryExplanation: 'No recovery strategy configured.',
    verificationExplanation: 'Direct verification.',
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
  createdAt: new Date().toISOString(),
  status: 'ACTIVE',
};

/**
 * Fixture: High-Risk Workflow requiring explicit user approval
 * Goal: "Send the confidential project report to everyone in my contacts."
 */
export const HIGH_RISK_WORKFLOW: Workflow = {
  id: 'wf-high-risk-01',
  name: 'Confidential Report Mass Broadcast',
  goal: 'Send the confidential project report to everyone in my contacts.',
  confidence: 0.92,
  confidenceLevel: 'HIGH',
  trigger: {
    type: 'MANUAL',
    description: 'Manual operator dispatch',
  },
  conditions: [],
  actions: [
    {
      id: 'act-mass-email',
      type: 'SEND_EMAIL',
      description: 'Broadcast confidential project report to all external contacts',
      priority: 'HIGH',
      target: 'ALL_CONTACTS_EXTERNAL',
    },
  ],
  recovery: {
    enabled: false,
    strategy: 'NONE',
  },
  verification: {
    type: 'EMAIL_SENT',
    description: 'Confirm emails sent to contacts',
  },
  risk: {
    level: 'CRITICAL',
    reason: 'Broadcasts confidential materials to external contact list.',
    factors: [
      'Mass external distribution to unfiltered contacts',
      'Exfiltration of confidential data assets',
      'Irreversible outbound email communication',
    ],
  },
  approvalRequired: true,
  explainability: {
    understoodIntent: 'Distribute confidential report to all contacts.',
    planSteps: ['Pause for user authorization', 'Dispatch outbound emails', 'Verify delivery'],
    actionJustification: 'Outbound broadcast.',
    failureModes: ['Permission rejection', 'Bounce rates'],
    recoveryExplanation: 'Halt on failure.',
    verificationExplanation: 'Check delivery receipts.',
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
  ],
  createdAt: new Date().toISOString(),
  status: 'DRAFT',
};

/**
 * Fixture: Unsupported Capability Workflow (e.g. TRANSFER_MONEY)
 */
export const UNSUPPORTED_CAPABILITY_WORKFLOW: any = {
  id: 'wf-unsupported-01',
  name: 'Unauthorized Financial Transfer',
  goal: 'Transfer $500 to remote checking account upon receiving invoice.',
  confidence: 0.85,
  trigger: {
    type: 'EMAIL_RECEIVED',
    description: 'When invoice arrives',
  },
  actions: [
    {
      id: 'act-transfer',
      type: 'TRANSFER_MONEY', // Unsupported action
      description: 'Transfer funds automatically',
    },
  ],
  recovery: {
    enabled: false,
    strategy: 'NONE',
  },
  verification: {
    type: 'TASK_EXISTS',
    description: 'Verify transfer',
  },
};
