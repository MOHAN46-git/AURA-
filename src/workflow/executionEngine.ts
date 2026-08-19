/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Workflow, SimulationStep, SimulationResult } from './types.ts';
import { validateWorkflow } from './validator.ts';

/**
 * Standard Failure Classification Taxonomy
 */
export type FailureClassificationCode =
  | 'SERVICE_UNAVAILABLE'
  | 'TRANSIENT_SERVICE_UNAVAILABLE'
  | 'RATE_LIMIT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'TIMEOUT'
  | 'NETWORK_TIMEOUT'
  | 'AUTHENTICATION'
  | 'AUTHENTICATION_EXPIRED'
  | 'PERMISSION_DENIED'
  | 'INVALID_RESPONSE'
  | 'MISSING_DATA'
  | 'AI_UNCERTAIN'
  | 'UNKNOWN'
  | 'TARGET_NOT_FOUND'
  | 'UNRECOVERABLE_VALIDATION_ERROR';

export type RecommendedAction =
  | 'RETRY_WITH_BACKOFF'
  | 'ROUTE_TO_FALLBACK'
  | 'REFRESH_TOKEN'
  | 'HALT_AND_ALERT'
  | 'REQUEST_USER_INTERVENTION';

export interface FailureDiagnostic {
  code: FailureClassificationCode;
  httpStatus: number;
  retryable: boolean;
  recommendedAction: RecommendedAction;
  summary: string;
  serviceTarget: string;
  errorDetail: string;
  diagnosedAt: string;
}

/**
 * Structured Audit Event Types
 */
export type AuditEventType =
  | 'WORKFLOW_INITIALIZED'
  | 'TRIGGER_INGESTED'
  | 'TRIGGER_ACCEPTED'
  | 'CONDITION_EVALUATED'
  | 'ACTION_STARTED'
  | 'PRIMARY_ACTION_ATTEMPT'
  | 'PRIMARY_ACTION_FAILED'
  | 'ACTION_FAILED'
  | 'FAILURE_CLASSIFIED'
  | 'FAILURE_DIAGNOSED'
  | 'RETRY_SCHEDULED'
  | 'RETRY_1_STARTED'
  | 'RETRY_1_FAILED'
  | 'RETRY_2_STARTED'
  | 'RETRY_2_FAILED'
  | 'RETRY_3_STARTED'
  | 'RETRY_3_FAILED'
  | 'RETRY_ATTEMPT_EXECUTED'
  | 'RETRY_EXHAUSTED'
  | 'FALLBACK_SELECTED'
  | 'FALLBACK_ROUTED'
  | 'FALLBACK_STARTED'
  | 'FALLBACK_EXECUTED'
  | 'FALLBACK_SUCCEEDED'
  | 'NO_APPROVED_FALLBACK'
  | 'OUTCOME_VERIFICATION_INITIATED'
  | 'VERIFICATION_STARTED'
  | 'OUTCOME_VERIFICATION_CONFIRMED'
  | 'VERIFICATION_SUCCEEDED'
  | 'OUTCOME_VERIFICATION_FAILED'
  | 'VERIFICATION_FAILED'
  | 'GOAL_ACHIEVED'
  | 'WAITING_FOR_APPROVAL'
  | 'EMERGENCY_STOP'
  | 'EXECUTION_BLOCKED'
  | 'UNSUPPORTED_CAPABILITY_REJECTED'
  | 'IDEMPOTENCY_KEY_RECORDED'
  | 'WORKFLOW_TERMINATED';

export interface AuditEventReceipt {
  id: string;
  executionId: string;
  workflowId: string;
  sequence: number;
  timestamp: string;
  eventType: AuditEventType;
  type: AuditEventType; // Alias for backward-compat
  title: string;
  stepId?: string;
  status: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
  durationMs: number;
  failureType?: FailureClassificationCode;
  retryAttempt?: number;
  recoverable?: boolean;
  payload?: Record<string, unknown>;
}

export type ExecutionFinalStatus =
  | 'GOAL_ACHIEVED'
  | 'RECOVERED'
  | 'SUCCESS'
  | 'NEEDS_USER_INTERVENTION'
  | 'BLOCKED'
  | 'FAILED_SAFE'
  | 'OUTCOME_UNVERIFIED'
  | 'VERIFICATION_FAILED'
  | 'WAITING_FOR_APPROVAL'
  | 'EMERGENCY_STOPPED'
  | 'VALIDATION_FAILED'
  | 'FAILED';

export interface ExecutionOptions {
  injectFailure?: boolean;
  primaryTaskServiceFailure?: boolean;
  failureType?: FailureClassificationCode | string;
  retryCount?: number;
  fallbackAvailable?: boolean;
  forceVerificationFailure?: boolean;
  killSwitch?: boolean;
  idempotencyKey?: string;
  stepDelayMs?: number;
  onStepProgress?: (step: SimulationStep, currentSteps: SimulationStep[]) => void;
  onAuditEvent?: (event: AuditEventReceipt) => void;
}

export interface EngineExecutionResult extends SimulationResult {
  executionId: string;
  executionStatus: ExecutionFinalStatus;
  auditEvents: AuditEventReceipt[];
  diagnostics?: FailureDiagnostic;
  idempotencyKeysUsed?: string[];
  retriesAttempted: number;
  fallbackExecuted: boolean;
  verificationPassed: boolean;
  goalAchieved: boolean;
}

/**
 * Classifies an error into a structured failure diagnostic.
 */
export function classifyFailure(
  serviceTarget: string,
  errorHint?: string
): FailureDiagnostic {
  const timestamp = new Date().toISOString();
  const hint = (errorHint || '').toUpperCase();

  if (hint.includes('TIMEOUT') || hint.includes('NETWORK_TIMEOUT') || hint.includes('ETIMEDOUT')) {
    return {
      code: 'TIMEOUT',
      httpStatus: 408,
      retryable: true,
      recommendedAction: 'RETRY_WITH_BACKOFF',
      summary: 'Network socket timeout on remote gateway connection.',
      serviceTarget,
      errorDetail: 'Gateway connection timed out after 5000ms.',
      diagnosedAt: timestamp,
    };
  }

  if (hint.includes('429') || hint.includes('RATE_LIMIT') || hint.includes('RATE')) {
    return {
      code: 'RATE_LIMIT',
      httpStatus: 429,
      retryable: true,
      recommendedAction: 'RETRY_WITH_BACKOFF',
      summary: 'Target API rate limit threshold exceeded.',
      serviceTarget,
      errorDetail: 'HTTP 429 Too Many Requests. Backoff interval required.',
      diagnosedAt: timestamp,
    };
  }

  if (hint.includes('401') || hint.includes('AUTH') || hint.includes('AUTHENTICATION')) {
    return {
      code: 'AUTHENTICATION',
      httpStatus: 401,
      retryable: false,
      recommendedAction: 'REFRESH_TOKEN',
      summary: 'OAuth access token expired or revoked.',
      serviceTarget,
      errorDetail: 'HTTP 401 Unauthorized. Requires user authentication refresh.',
      diagnosedAt: timestamp,
    };
  }

  if (hint.includes('403') || hint.includes('PERMISSION') || hint.includes('DENIED')) {
    return {
      code: 'PERMISSION_DENIED',
      httpStatus: 403,
      retryable: false,
      recommendedAction: 'HALT_AND_ALERT',
      summary: 'Insufficient authorization credentials for target resource.',
      serviceTarget,
      errorDetail: 'HTTP 403 Forbidden. Safe execution halted to protect resources.',
      diagnosedAt: timestamp,
    };
  }

  if (hint.includes('INVALID_RESPONSE') || hint.includes('MALFORMED')) {
    return {
      code: 'INVALID_RESPONSE',
      httpStatus: 502,
      retryable: false,
      recommendedAction: 'ROUTE_TO_FALLBACK',
      summary: 'Target service returned malformed or unparseable payload.',
      serviceTarget,
      errorDetail: 'HTTP 502 Bad Gateway: Unrecognized JSON payload schema.',
      diagnosedAt: timestamp,
    };
  }

  if (hint.includes('MISSING_DATA') || hint.includes('404')) {
    return {
      code: 'MISSING_DATA',
      httpStatus: 404,
      retryable: false,
      recommendedAction: 'HALT_AND_ALERT',
      summary: 'Required resource or entity was not found in target provider.',
      serviceTarget,
      errorDetail: 'HTTP 404 Not Found. Required parent context missing.',
      diagnosedAt: timestamp,
    };
  }

  if (hint.includes('AI_UNCERTAIN') || hint.includes('CONFIDENCE_LOW')) {
    return {
      code: 'AI_UNCERTAIN',
      httpStatus: 422,
      retryable: false,
      recommendedAction: 'REQUEST_USER_INTERVENTION',
      summary: 'AI decision confidence fell below required threshold.',
      serviceTarget,
      errorDetail: 'Semantic confidence score below 0.60. Human confirmation required.',
      diagnosedAt: timestamp,
    };
  }

  // Default: SERVICE_UNAVAILABLE (HTTP 503)
  return {
    code: 'SERVICE_UNAVAILABLE',
    httpStatus: 503,
    retryable: true,
    recommendedAction: 'ROUTE_TO_FALLBACK',
    summary: 'Primary gateway connection reset or service outage.',
    serviceTarget,
    errorDetail: 'HTTP 503 Service Unavailable: Remote downstream host unreachable.',
    diagnosedAt: timestamp,
  };
}

/**
 * Builds the step sequence for visualization and execution.
 */
export function buildExecutionPipeline(
  workflow: Workflow,
  injectFailure: boolean,
  options?: ExecutionOptions
): SimulationStep[] {
  const steps: SimulationStep[] = [];
  const primaryAction = workflow.actions[0] || {
    id: 'act-1',
    type: 'CREATE_TASK',
    description: 'Create high-priority task',
    priority: 'HIGH',
  };

  // 1. Trigger
  steps.push({
    id: 'step-trigger',
    phase: 'TRIGGER',
    title: 'Trigger Event Ingestion',
    description: `Ingesting event listener for ${workflow.trigger.description}`,
    status: 'PENDING',
    logs: [
      `[EVENT_TRIGGER_INGESTED] Ingested trigger event: ${workflow.trigger.type}`,
      `[TRIGGER_ACCEPTED] Trigger validated against supported capability registry`,
    ],
    details: {
      triggerType: workflow.trigger.type,
      mode: 'EVENT_DRIVEN',
    },
  });

  // 2. Conditions
  if (workflow.conditions && workflow.conditions.length > 0) {
    workflow.conditions.forEach((c, idx) => {
      steps.push({
        id: `step-cond-${idx + 1}`,
        phase: 'CONDITION',
        title: `Condition: ${c.type}`,
        description: c.description,
        status: 'PENDING',
        logs: [
          `[EVENT_CONDITION_EVALUATED] Evaluated condition #${idx + 1}: ${c.description}`,
          `[MATCH_RESULT] Criteria evaluated: TRUE (Score: 0.98)`,
        ],
        details: { ruleType: c.type, evaluation: 'PASSED' },
      });
    });
  }

  // 3. Actions / Failures
  if (!injectFailure) {
    workflow.actions.forEach((act, idx) => {
      steps.push({
        id: `step-action-${act.id || idx}`,
        phase: 'ACTION',
        title: `Execute: ${act.type}`,
        description: act.description,
        status: 'PENDING',
        logs: [
          `[ACTION_STARTED] Dispatching payload for ${act.type}`,
          `[STATUS 200 OK] Action completed successfully. Entity ID #entity_${Date.now().toString().slice(-4)}`,
        ],
        details: { actionId: act.id, priority: act.priority || 'MEDIUM' },
      });
    });
  } else {
    // Step 3a: Primary Action Attempt
    steps.push({
      id: 'step-primary-attempt',
      phase: 'ACTION',
      title: 'Primary Action Attempt',
      description: `Dispatching to Primary Task Provider for ${primaryAction.description}`,
      status: 'PENDING',
      logs: [
        `[ACTION_STARTED] Connecting to Primary Provider gateway...`,
        `[ACTION_FAILED] Primary gateway connection reset (HTTP 503 Service Unavailable).`,
      ],
      details: { target: 'PRIMARY_TASK_PROVIDER', failureInjected: true },
    });

    // Step 3b: Failure Diagnosis
    steps.push({
      id: 'step-diagnose',
      phase: 'RECOVERY',
      title: 'Failure Classification & Diagnosis',
      description: 'Analyzing error signature and recovery policy',
      status: 'PENDING',
      logs: [
        `[FAILURE_CLASSIFIED] Classification: SERVICE_UNAVAILABLE (HTTP 503)`,
        `[DIAGNOSIS] Error is retryable. Max Retries: ${options?.retryCount ?? workflow.recovery.retryCount ?? 2}.`,
      ],
    });

    const retries = options?.retryCount ?? workflow.recovery.retryCount ?? 2;
    for (let r = 1; r <= retries; r++) {
      steps.push({
        id: `step-retry-${r}`,
        phase: 'RECOVERY',
        title: `Retry #${r} (${r === retries ? 'Final Attempt' : 'Exponential Backoff'})`,
        description: `Attempting retry ${r}/${retries} with ${r * 400}ms backoff`,
        status: 'PENDING',
        logs: [
          `[RETRY_${r}_STARTED] Dispatched Retry #${r} to Primary Provider`,
          `[RETRY_${r}_FAILED] Primary endpoint still unresponsive (HTTP 503)`,
        ],
      });
    }

    const fallbackAvailable = options?.fallbackAvailable !== false && Boolean(workflow.recovery.fallback);
    if (fallbackAvailable) {
      steps.push({
        id: 'step-fallback-routing',
        phase: 'FALLBACK',
        title: `Fallback: ${workflow.recovery.fallback || 'BACKUP_TASK_PROVIDER'}`,
        description: `Rerouting payload to designated secondary service`,
        status: 'PENDING',
        logs: [
          `[FALLBACK_SELECTED] Engaging approved resilience fallback route`,
          `[FALLBACK_STARTED] Transferring preserved idempotency key & priority`,
        ],
      });

      steps.push({
        id: 'step-fallback-success',
        phase: 'FALLBACK',
        title: 'Fallback Execution Success',
        description: 'Backup service processed payload and committed entity',
        status: 'PENDING',
        logs: [
          `[FALLBACK_EXECUTED] Backup provider acknowledged receipt`,
          `[FALLBACK_SUCCEEDED] Entity committed: ID #BK_TASK_${Date.now().toString().slice(-4)}`,
        ],
      });
    } else {
      steps.push({
        id: 'step-no-fallback',
        phase: 'FALLBACK',
        title: 'No Approved Fallback Available',
        description: 'Retries exhausted and no secondary provider configured',
        status: 'PENDING',
        logs: [
          `[NO_APPROVED_FALLBACK] No alternative fallback provider registered`,
          `[FAILED_SAFE] Halting execution safely. Requesting user intervention.`,
        ],
      });
    }
  }

  // 4. Outcome Verification
  steps.push({
    id: 'step-verify',
    phase: 'VERIFICATION',
    title: `Outcome Verification: ${workflow.verification.type}`,
    description: workflow.verification.description,
    status: 'PENDING',
    logs: [
      `[VERIFICATION_STARTED] Querying destination state: ${workflow.verification.description}`,
      `[VERIFICATION_SUCCEEDED] Target entity verified active in destination store`,
    ],
  });

  // 5. Goal Achieved
  steps.push({
    id: 'step-goal-achieved',
    phase: 'VERIFICATION',
    title: 'Goal Achieved & Certified',
    description: `Terminal fulfillment: "${workflow.goal}"`,
    status: 'PENDING',
    logs: [`[GOAL_ACHIEVED] End-to-end automation contract fulfilled`],
  });

  return steps;
}

/**
 * Main Deterministic Workflow Execution Engine
 */
export async function executeWorkflowEngine(
  workflow: Workflow,
  options: ExecutionOptions = {}
): Promise<EngineExecutionResult> {
  const executionId = `exec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const auditEvents: AuditEventReceipt[] = [];
  const idempotencyKeysUsed: string[] = [];

  const {
    injectFailure = false,
    primaryTaskServiceFailure = false,
    failureType = 'SERVICE_UNAVAILABLE',
    retryCount: customRetryCount,
    fallbackAvailable: customFallbackAvailable,
    forceVerificationFailure = false,
    killSwitch = false,
    idempotencyKey,
    stepDelayMs = 0,
    onStepProgress,
    onAuditEvent,
  } = options;

  const shouldFailPrimary = injectFailure || primaryTaskServiceFailure;
  const configuredRetries = customRetryCount !== undefined ? customRetryCount : (workflow.recovery.enabled ? (workflow.recovery.retryCount ?? 2) : 0);
  const isFallbackApproved = customFallbackAvailable !== undefined ? customFallbackAvailable : Boolean(workflow.recovery.fallback);

  let sequence = 1;
  const emitEvent = (
    type: AuditEventType,
    title: string,
    message: string,
    status: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS',
    duration: number = 10,
    extras: Partial<AuditEventReceipt> = {}
  ): AuditEventReceipt => {
    const receipt: AuditEventReceipt = {
      id: `evt-${Date.now()}-${sequence}`,
      executionId,
      workflowId: workflow.id,
      sequence: sequence++,
      timestamp: new Date().toISOString(),
      eventType: type,
      type,
      title,
      message,
      status,
      durationMs: duration,
      ...extras,
    };
    auditEvents.push(receipt);
    onAuditEvent?.(receipt);
    return receipt;
  };

  emitEvent(
    'WORKFLOW_INITIALIZED',
    'Workflow Initialized',
    `Execution initiated for workflow: "${workflow.name}"`,
    'INFO'
  );

  // 0. Pre-Flight Validation & Capability Check
  const validation = validateWorkflow(workflow, workflow.goal);
  if (!validation.valid) {
    emitEvent(
      'UNSUPPORTED_CAPABILITY_REJECTED',
      'Validation Failed',
      `Workflow schema or capability validation failed: ${validation.issues.map((i) => i.message).join(', ')}`,
      'ERROR'
    );
    return {
      id: `sim-run-${Date.now()}`,
      executionId,
      workflowId: workflow.id,
      status: 'FAILED',
      executionStatus: 'VALIDATION_FAILED',
      totalDurationMs: Date.now() - startTime,
      steps: [],
      startedAt,
      completedAt: new Date().toISOString(),
      recoveryTriggered: false,
      verificationPassed: false,
      retriesAttempted: 0,
      fallbackExecuted: false,
      goalAchieved: false,
      auditEvents,
      message: 'Workflow rejected at pre-flight validation boundary.',
    };
  }

  // 0b. Kill Switch Check
  if (killSwitch) {
    emitEvent(
      'EMERGENCY_STOP',
      'Emergency Stop Activated',
      'Execution immediately halted by system kill switch.',
      'ERROR'
    );
    return {
      id: `sim-run-${Date.now()}`,
      executionId,
      workflowId: workflow.id,
      status: 'FAILED',
      executionStatus: 'EMERGENCY_STOPPED',
      totalDurationMs: Date.now() - startTime,
      steps: [],
      startedAt,
      completedAt: new Date().toISOString(),
      recoveryTriggered: false,
      verificationPassed: false,
      retriesAttempted: 0,
      fallbackExecuted: false,
      goalAchieved: false,
      auditEvents,
      message: 'Execution aborted: Emergency Kill Switch active.',
    };
  }

  // 0c. Approval Requirement Check
  if (workflow.approvalRequired) {
    emitEvent(
      'WAITING_FOR_APPROVAL',
      'Approval Required',
      `Execution paused. Workflow risk level is ${workflow.risk?.level || 'HIGH'}. Awaiting human authorization.`,
      'WARN'
    );
    return {
      id: `sim-run-${Date.now()}`,
      executionId,
      workflowId: workflow.id,
      status: 'BLOCKED',
      executionStatus: 'WAITING_FOR_APPROVAL',
      totalDurationMs: Date.now() - startTime,
      steps: [],
      startedAt,
      completedAt: new Date().toISOString(),
      recoveryTriggered: false,
      verificationPassed: false,
      retriesAttempted: 0,
      fallbackExecuted: false,
      goalAchieved: false,
      auditEvents,
      message: 'Workflow paused pending mandatory human approval.',
    };
  }

  // Idempotency Key Handling
  const activeIdempotencyKey = idempotencyKey || `idem-${workflow.id}-${Date.now().toString(36)}`;
  idempotencyKeysUsed.push(activeIdempotencyKey);
  emitEvent(
    'IDEMPOTENCY_KEY_RECORDED',
    'Idempotency Key Registered',
    `Registered execution idempotency key: ${activeIdempotencyKey}`,
    'INFO',
    5,
    { payload: { idempotencyKey: activeIdempotencyKey } }
  );

  // 1. Trigger
  emitEvent(
    'TRIGGER_INGESTED',
    'Trigger Ingested',
    `Trigger event received: ${workflow.trigger.type} (${workflow.trigger.description})`,
    'INFO'
  );
  emitEvent(
    'TRIGGER_ACCEPTED',
    'Trigger Accepted',
    `Trigger ${workflow.trigger.type} validated and accepted into pipeline.`,
    'SUCCESS'
  );

  // 2. Conditions
  if (workflow.conditions && workflow.conditions.length > 0) {
    for (const c of workflow.conditions) {
      emitEvent(
        'CONDITION_EVALUATED',
        `Condition Evaluated: ${c.type}`,
        `Evaluated rule "${c.description}": Match PASSED (confidence: 0.98)`,
        'SUCCESS'
      );
    }
  }

  const steps = buildExecutionPipeline(workflow, shouldFailPrimary, options);
  let retriesAttempted = 0;
  let fallbackExecuted = false;
  let verificationPassed = false;
  let goalAchieved = false;
  let diagnostics: FailureDiagnostic | undefined;

  // Execute Step Pipeline
  if (!shouldFailPrimary) {
    // Normal Path
    for (const action of workflow.actions) {
      emitEvent(
        'ACTION_STARTED',
        `Action Started: ${action.type}`,
        `Executing action ${action.type} (${action.description})`,
        'INFO',
        10,
        { stepId: action.id }
      );
    }

    // Outcome Verification
    emitEvent(
      'VERIFICATION_STARTED',
      'Verification Initiated',
      `Checking target state: ${workflow.verification.description}`,
      'INFO'
    );

    if (forceVerificationFailure) {
      verificationPassed = false;
      emitEvent(
        'VERIFICATION_FAILED',
        'Verification Failed',
        `Target state assertion failed for ${workflow.verification.type}. Destination did not reflect expected mutation.`,
        'ERROR'
      );
      emitEvent(
        'WORKFLOW_TERMINATED',
        'Workflow Terminated with Outcome Failure',
        'Actions succeeded technically, but goal outcome could not be verified.',
        'ERROR'
      );

      return {
        id: `sim-run-${Date.now()}`,
        executionId,
        workflowId: workflow.id,
        status: 'FAILED',
        executionStatus: 'VERIFICATION_FAILED',
        totalDurationMs: Date.now() - startTime,
        steps,
        startedAt,
        completedAt: new Date().toISOString(),
        recoveryTriggered: false,
        verificationPassed: false,
        retriesAttempted: 0,
        fallbackExecuted: false,
        goalAchieved: false,
        auditEvents,
        message: 'Action completed, but outcome verification failed. Goal not achieved.',
      };
    } else {
      verificationPassed = true;
      emitEvent(
        'VERIFICATION_SUCCEEDED',
        'Verification Confirmed',
        `Destination state confirmed: ${workflow.verification.description}`,
        'SUCCESS'
      );
      goalAchieved = true;
      emitEvent(
        'GOAL_ACHIEVED',
        'Goal Achieved',
        `Automation goal fulfilled: "${workflow.goal}"`,
        'SUCCESS'
      );
    }
  } else {
    // Failure & Recovery Path
    const primaryAction = workflow.actions[0] || { id: 'act-1', type: 'CREATE_TASK' as const, description: 'Create high-priority task' };
    emitEvent(
      'ACTION_STARTED',
      `Action Started: ${primaryAction.type}`,
      `Dispatching to Primary Provider for ${primaryAction.description || primaryAction.type}`,
      'INFO'
    );

    diagnostics = classifyFailure('PRIMARY_TASK_PROVIDER', String(failureType));

    emitEvent(
      'ACTION_FAILED',
      'Primary Action Failed',
      `Primary task service returned error: ${diagnostics.errorDetail}`,
      'ERROR',
      280,
      {
        failureType: diagnostics.code,
        recoverable: diagnostics.retryable,
        stepId: primaryAction.id,
      }
    );

    emitEvent(
      'FAILURE_CLASSIFIED',
      'Failure Classified',
      `Classified as ${diagnostics.code} (HTTP ${diagnostics.httpStatus}). Action: ${diagnostics.recommendedAction}`,
      'WARN',
      100,
      {
        failureType: diagnostics.code,
        recoverable: diagnostics.retryable,
      }
    );

    // Retries
    if (diagnostics.retryable && configuredRetries > 0) {
      for (let r = 1; r <= configuredRetries; r++) {
        retriesAttempted++;
        const retryStartEvent = (r === 1 ? 'RETRY_1_STARTED' : r === 2 ? 'RETRY_2_STARTED' : 'RETRY_3_STARTED') as AuditEventType;
        const retryFailEvent = (r === 1 ? 'RETRY_1_FAILED' : r === 2 ? 'RETRY_2_FAILED' : 'RETRY_3_FAILED') as AuditEventType;

        emitEvent(
          retryStartEvent,
          `Retry #${r} Started`,
          `Dispatching retry attempt ${r}/${configuredRetries} with ${r * 400}ms backoff`,
          'WARN',
          150,
          { retryAttempt: r, failureType: diagnostics.code, recoverable: true }
        );

        emitEvent(
          retryFailEvent,
          `Retry #${r} Failed`,
          `Retry attempt ${r} failed: Remote host still unavailable.`,
          'WARN',
          200,
          { retryAttempt: r, failureType: diagnostics.code, recoverable: true }
        );
      }
    }

    // Retries Exhausted
    if (retriesAttempted > 0) {
      emitEvent(
        'RETRY_EXHAUSTED',
        'Retries Exhausted',
        `All ${retriesAttempted} retry attempts exhausted without recovery.`,
        'WARN'
      );
    }

    // Fallback Routing Check
    if (isFallbackApproved) {
      const fallbackTarget = workflow.recovery.fallback || 'BACKUP_TASK_PROVIDER';
      emitEvent(
        'FALLBACK_SELECTED',
        'Approved Fallback Selected',
        `Tripping circuit breaker and selecting approved fallback: ${fallbackTarget}`,
        'INFO'
      );

      emitEvent(
        'FALLBACK_STARTED',
        'Fallback Execution Started',
        `Dispatching intact payload with idempotency key ${activeIdempotencyKey} to ${fallbackTarget}`,
        'INFO'
      );

      fallbackExecuted = true;
      emitEvent(
        'FALLBACK_SUCCEEDED',
        'Fallback Execution Succeeded',
        `Backup provider acknowledged receipt and committed entity.`,
        'SUCCESS'
      );

      // Notification action execution
      const notif = workflow.actions.find((a) => a.type === 'SEND_NOTIFICATION');
      if (notif) {
        emitEvent(
          'ACTION_STARTED',
          'Dispatch Notification Alert',
          `Sending alert to user: ${notif.description}`,
          'INFO'
        );
      }

      // Verification
      emitEvent(
        'VERIFICATION_STARTED',
        'Verification Initiated',
        `Querying destination state: ${workflow.verification.description}`,
        'INFO'
      );

      if (forceVerificationFailure) {
        verificationPassed = false;
        emitEvent(
          'VERIFICATION_FAILED',
          'Verification Failed',
          `Fallback succeeded but post-execution assertion failed.`,
          'ERROR'
        );

        return {
          id: `sim-run-${Date.now()}`,
          executionId,
          workflowId: workflow.id,
          status: 'FAILED',
          executionStatus: 'VERIFICATION_FAILED',
          totalDurationMs: Date.now() - startTime,
          steps,
          startedAt,
          completedAt: new Date().toISOString(),
          recoveryTriggered: true,
          verificationPassed: false,
          retriesAttempted,
          fallbackExecuted: true,
          goalAchieved: false,
          auditEvents,
          message: 'Fallback succeeded, but outcome verification failed.',
        };
      }

      verificationPassed = true;
      emitEvent(
        'VERIFICATION_SUCCEEDED',
        'Verification Confirmed',
        `Destination state confirmed: ${workflow.verification.description}`,
        'SUCCESS'
      );

      goalAchieved = true;
      emitEvent(
        'GOAL_ACHIEVED',
        'Goal Achieved',
        `Automation goal fulfilled via autonomous resilience fallback: "${workflow.goal}"`,
        'SUCCESS'
      );
    } else {
      // No Fallback -> Safe execution stop
      emitEvent(
        'NO_APPROVED_FALLBACK',
        'No Approved Fallback Available',
        'Retries exhausted and no secondary fallback route configured. Halting execution safely.',
        'ERROR'
      );

      emitEvent(
        'EXECUTION_BLOCKED',
        'Execution Blocked Safely',
        'Workflow stopped safely to prevent invalid state. Requesting user intervention.',
        'ERROR'
      );

      return {
        id: `sim-run-${Date.now()}`,
        executionId,
        workflowId: workflow.id,
        status: 'FAILED',
        executionStatus: 'NEEDS_USER_INTERVENTION',
        totalDurationMs: Date.now() - startTime,
        steps,
        startedAt,
        completedAt: new Date().toISOString(),
        recoveryTriggered: false,
        verificationPassed: false,
        retriesAttempted,
        fallbackExecuted: false,
        goalAchieved: false,
        auditEvents,
        message: 'Primary service failed, retries exhausted, and no approved fallback exists. Execution stopped safely.',
      };
    }
  }

  const completedAt = new Date().toISOString();
  const totalDurationMs = Date.now() - startTime;

  emitEvent(
    'WORKFLOW_TERMINATED',
    'Workflow Finalized',
    `Execution finalized cleanly with status: ${shouldFailPrimary ? 'RECOVERED' : 'SUCCESS'}`,
    'SUCCESS'
  );

  return {
    id: `sim-run-${Date.now()}`,
    executionId,
    workflowId: workflow.id,
    status: shouldFailPrimary ? 'RECOVERED' : 'SUCCESS',
    executionStatus: shouldFailPrimary ? 'RECOVERED' : 'GOAL_ACHIEVED',
    totalDurationMs,
    steps,
    startedAt,
    completedAt,
    recoveryTriggered: shouldFailPrimary,
    verificationPassed,
    retriesAttempted,
    fallbackExecuted,
    goalAchieved,
    auditEvents,
    diagnostics,
    idempotencyKeysUsed,
    message: shouldFailPrimary
      ? 'Primary Failure → Diagnose → Retry #1 → Retry #2 → Fallback → Success → Verify → Goal Achieved.'
      : 'Direct execution completed successfully on primary path. Goal achieved.',
  };
}
