/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionDefinition,
  ActionType,
  ConditionDefinition,
  ConditionType,
  ConfidenceLevel,
  RecoveryConfig,
  RecoveryStrategyType,
  TriggerDefinition,
  TriggerType,
  ValidationIssue,
  ValidationResult,
  VerificationConfig,
  VerificationType,
  Workflow,
} from './types.ts';
import {
  SUPPORTED_ACTIONS,
  SUPPORTED_CONDITIONS,
  SUPPORTED_RECOVERY_STRATEGIES,
  SUPPORTED_TRIGGERS,
  SUPPORTED_VERIFICATION_TYPES,
  extractRequiredCapabilities,
} from './capabilityRegistry.ts';
import { evaluateDeterministicRisk } from '../policy/riskEngine.ts';

/**
 * Validates and sanitizes a raw workflow object against strict schemas and capability registries.
 */
export function validateWorkflow(raw: unknown, rawPrompt?: string): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!raw || typeof raw !== 'object') {
    return {
      valid: false,
      issues: [
        {
          field: 'root',
          message: 'Workflow payload must be a valid JSON object.',
          severity: 'ERROR',
        },
      ],
    };
  }

  const obj = raw as Record<string, any>;

  // 1. Goal validation
  let goal = typeof obj.goal === 'string' && obj.goal.trim() ? obj.goal.trim() : '';
  if (!goal && rawPrompt) {
    goal = rawPrompt.trim();
  }
  if (!goal) {
    issues.push({
      field: 'goal',
      message: 'Workflow must have a defined goal.',
      severity: 'ERROR',
    });
  }

  // 2. Name validation
  let name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : '';
  if (!name) {
    name = goal ? `${goal.slice(0, 36)}...` : 'Automated Workflow';
  }

  // 3. Confidence scoring
  let confidence = typeof obj.confidence === 'number' ? obj.confidence : 0.9;
  if (confidence > 1 && confidence <= 100) {
    confidence = confidence / 100;
  }
  confidence = Math.max(0.1, Math.min(1.0, confidence));

  let confidenceLevel: ConfidenceLevel = 'HIGH';
  if (confidence < 0.6) {
    confidenceLevel = 'LOW';
  } else if (confidence < 0.85) {
    confidenceLevel = 'MEDIUM';
  }

  // 4. Trigger validation
  let trigger: TriggerDefinition = {
    type: 'MANUAL',
    description: 'Manual trigger',
  };

  if (!obj.trigger || typeof obj.trigger !== 'object') {
    issues.push({
      field: 'trigger',
      message: 'Missing trigger configuration in workflow.',
      severity: 'ERROR',
    });
  } else {
    const rawTriggerType = String(obj.trigger.type || '').toUpperCase() as TriggerType;
    if (!(rawTriggerType in SUPPORTED_TRIGGERS)) {
      issues.push({
        field: 'trigger.type',
        message: `Unsupported trigger type: "${obj.trigger.type}".`,
        severity: 'ERROR',
        unsupportedValue: String(obj.trigger.type),
        supportedAlternatives: Object.keys(SUPPORTED_TRIGGERS),
      });
    } else {
      trigger = {
        type: rawTriggerType,
        description: obj.trigger.description || SUPPORTED_TRIGGERS[rawTriggerType].description,
        config: typeof obj.trigger.config === 'object' ? obj.trigger.config : {},
      };
    }
  }

  // 5. Conditions validation
  const conditions: ConditionDefinition[] = [];
  if (Array.isArray(obj.conditions)) {
    for (let i = 0; i < obj.conditions.length; i++) {
      const c = obj.conditions[i];
      if (!c || typeof c !== 'object') continue;

      const rawCondType = String(c.type || '').toUpperCase() as ConditionType;
      if (!(rawCondType in SUPPORTED_CONDITIONS)) {
        issues.push({
          field: `conditions[${i}].type`,
          message: `Unsupported condition type: "${c.type}".`,
          severity: 'ERROR',
          unsupportedValue: String(c.type),
          supportedAlternatives: Object.keys(SUPPORTED_CONDITIONS),
        });
      } else {
        conditions.push({
          type: rawCondType,
          value: c.value ? String(c.value) : undefined,
          description: c.description || SUPPORTED_CONDITIONS[rawCondType].description,
          field: c.field ? String(c.field) : undefined,
        });
      }
    }
  }

  // 6. Actions validation
  const actions: ActionDefinition[] = [];
  if (!Array.isArray(obj.actions) || obj.actions.length === 0) {
    issues.push({
      field: 'actions',
      message: 'Workflow must contain at least one valid action.',
      severity: 'ERROR',
    });
  } else {
    for (let i = 0; i < obj.actions.length; i++) {
      const a = obj.actions[i];
      if (!a || typeof a !== 'object') continue;

      const rawActType = String(a.type || '').toUpperCase() as ActionType;
      if (!(rawActType in SUPPORTED_ACTIONS)) {
        issues.push({
          field: `actions[${i}].type`,
          message: `Unsupported action type: "${a.type}".`,
          severity: 'ERROR',
          unsupportedValue: String(a.type),
          supportedAlternatives: Object.keys(SUPPORTED_ACTIONS),
        });
      } else {
        actions.push({
          id: a.id || `action-${i + 1}`,
          type: rawActType,
          description: a.description || SUPPORTED_ACTIONS[rawActType].description,
          priority: a.priority && ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(String(a.priority).toUpperCase())
            ? (String(a.priority).toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')
            : 'MEDIUM',
          target: a.target ? String(a.target) : undefined,
          config: typeof a.config === 'object' ? a.config : {},
        });
      }
    }
  }

  // 7. Recovery validation
  let recovery: RecoveryConfig = {
    enabled: false,
    strategy: 'NONE',
  };

  if (obj.recovery && typeof obj.recovery === 'object') {
    const rawStrategy = String(obj.recovery.strategy || 'NONE').toUpperCase() as RecoveryStrategyType;
    if (!(rawStrategy in SUPPORTED_RECOVERY_STRATEGIES)) {
      issues.push({
        field: 'recovery.strategy',
        message: `Unsupported recovery strategy: "${obj.recovery.strategy}".`,
        severity: 'WARNING',
        unsupportedValue: String(obj.recovery.strategy),
        supportedAlternatives: Object.keys(SUPPORTED_RECOVERY_STRATEGIES),
      });
      recovery = {
        enabled: false,
        strategy: 'NONE',
      };
    } else {
      const isEnabled = obj.recovery.enabled === true || rawStrategy !== 'NONE';
      recovery = {
        enabled: isEnabled,
        strategy: rawStrategy,
        retryCount: typeof obj.recovery.retryCount === 'number' ? obj.recovery.retryCount : (isEnabled ? 2 : 0),
        fallback: obj.recovery.fallback ? String(obj.recovery.fallback) : (isEnabled ? 'BACKUP_TASK_PROVIDER' : undefined),
        description: obj.recovery.description || (isEnabled ? `Retry ${obj.recovery.retryCount || 2} times then failover to fallback service` : 'No recovery configured'),
      };
    }
  }

  // 8. Verification validation
  let verification: VerificationConfig = {
    type: 'TASK_EXISTS',
    description: 'Verify execution outcome',
  };

  if (obj.verification && typeof obj.verification === 'object') {
    const rawVerType = String(obj.verification.type || '').toUpperCase() as VerificationType;
    if (!(rawVerType in SUPPORTED_VERIFICATION_TYPES)) {
      issues.push({
        field: 'verification.type',
        message: `Unsupported verification type: "${obj.verification.type}".`,
        severity: 'WARNING',
        unsupportedValue: String(obj.verification.type),
        supportedAlternatives: Object.keys(SUPPORTED_VERIFICATION_TYPES),
      });
      // Fallback verification based on primary action
      verification = determineDefaultVerification(actions);
    } else {
      verification = {
        type: rawVerType,
        description: obj.verification.description || SUPPORTED_VERIFICATION_TYPES[rawVerType].description,
        target: obj.verification.target ? String(obj.verification.target) : undefined,
      };
    }
  } else {
    verification = determineDefaultVerification(actions);
  }

  // 9. Explainability validation & compilation
  const explainability = {
    understoodIntent:
      obj.explainability?.understoodIntent ||
      `AURA will automatically execute actions to satisfy the goal: "${goal}".`,
    planSteps: Array.isArray(obj.explainability?.planSteps) && obj.explainability.planSteps.length > 0
      ? obj.explainability.planSteps.map(String)
      : compilePlanSteps(trigger, conditions, actions, recovery, verification),
    actionJustification:
      obj.explainability?.actionJustification ||
      'Configured actions directly fulfil your requested outcome with minimal permission footprint.',
    failureModes: Array.isArray(obj.explainability?.failureModes) && obj.explainability.failureModes.length > 0
      ? obj.explainability.failureModes.map(String)
      : ['Primary service API timeouts or transient rate limits', 'Network connectivity interruptions'],
    recoveryExplanation:
      obj.explainability?.recoveryExplanation ||
      (recovery.enabled
        ? `If the primary step fails, AURA will retry ${recovery.retryCount || 2} times before routing to ${recovery.fallback || 'the backup provider'}.`
        : 'If an error occurs, the workflow will log the failure and notify you.'),
    verificationExplanation:
      obj.explainability?.verificationExplanation ||
      `AURA queries the destination service to confirm: ${verification.description}.`,
  };

  // 10. Deterministic Risk Evaluation (Overrides any hallucinated model risk)
  const partialWorkflow: Partial<Workflow> = {
    goal,
    rawPrompt,
    trigger,
    conditions,
    actions,
  };
  const { risk, approvalRequired } = evaluateDeterministicRisk(partialWorkflow);

  // 11. Extract required capabilities
  const requiredCapabilities = extractRequiredCapabilities({
    trigger,
    conditions,
    actions,
  });

  const valid = issues.filter((i) => i.severity === 'ERROR').length === 0;

  const sanitizedWorkflow: Workflow = {
    id: obj.id || `aura-wf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    goal,
    rawPrompt: rawPrompt || goal,
    confidence,
    confidenceLevel,
    clarificationNeeded: obj.clarificationNeeded || (confidenceLevel === 'MEDIUM' ? 'Please verify that the trigger frequency and fallback services match your expectations.' : undefined),
    trigger,
    conditions,
    actions,
    risk,
    approvalRequired: obj.approvalRequired === true ? true : approvalRequired,
    recovery,
    verification,
    explainability,
    requiredCapabilities,
    createdAt: obj.createdAt || new Date().toISOString(),
    status: obj.status || 'DRAFT',
  };

  return {
    valid,
    issues,
    sanitizedWorkflow: valid ? sanitizedWorkflow : undefined,
  };
}

function determineDefaultVerification(actions: ActionDefinition[]): VerificationConfig {
  if (actions.some((a) => a.type === 'CREATE_TASK')) {
    return {
      type: 'TASK_EXISTS',
      description: 'Confirm that the requested task exists and has been assigned',
    };
  }
  if (actions.some((a) => a.type === 'SEND_EMAIL')) {
    return {
      type: 'EMAIL_SENT',
      description: 'Confirm that outgoing email was successfully dispatched',
    };
  }
  if (actions.some((a) => a.type === 'CREATE_CALENDAR_EVENT')) {
    return {
      type: 'EVENT_EXISTS',
      description: 'Verify event was created in the target calendar schedule',
    };
  }
  if (actions.some((a) => a.type === 'CALL_WEBHOOK')) {
    return {
      type: 'WEBHOOK_SUCCESS',
      description: 'Verify receiving webhook server responded with HTTP 200/201',
    };
  }
  if (actions.some((a) => a.type === 'SAVE_DATA')) {
    return {
      type: 'DATA_SAVED',
      description: 'Verify database record consistency and integrity check',
    };
  }
  return {
    type: 'USER_CONFIRMATION',
    description: 'Verify operation was completed without errors',
  };
}

function compilePlanSteps(
  trigger: TriggerDefinition,
  conditions: ConditionDefinition[],
  actions: ActionDefinition[],
  recovery: RecoveryConfig,
  verification: VerificationConfig
): string[] {
  const steps: string[] = [];
  steps.push(`Monitor for ${trigger.description.toLowerCase() || 'incoming trigger event'}.`);

  for (const c of conditions) {
    steps.push(`Evaluate whether ${c.description.toLowerCase() || 'conditions are met'}.`);
  }

  for (const a of actions) {
    steps.push(`${a.description}${a.priority ? ` (${a.priority} priority)` : ''}.`);
  }

  steps.push(`Verify outcome: ${verification.description}.`);

  if (recovery.enabled) {
    if (recovery.strategy === 'RETRY_THEN_FALLBACK') {
      steps.push(`If action fails, retry ${recovery.retryCount || 2} times before failing over to ${recovery.fallback || 'backup provider'}.`);
    } else if (recovery.strategy === 'RETRY') {
      steps.push(`Retry up to ${recovery.retryCount || 2} times upon transient failure.`);
    } else if (recovery.strategy === 'FALLBACK') {
      steps.push(`Failover immediately to ${recovery.fallback || 'backup provider'} if primary action fails.`);
    }
  }

  return steps;
}
