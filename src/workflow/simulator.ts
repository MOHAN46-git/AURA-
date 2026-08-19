/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimulationResult, SimulationStep, Workflow } from './types.ts';

export interface SimulationOptions {
  injectFailure?: boolean;
  failureActionId?: string;
  stepDelayMs?: number;
  onStepProgress?: (step: SimulationStep, currentSteps: SimulationStep[]) => void;
}

/**
 * Builds the sequence of simulation steps for a workflow.
 */
export function buildSimulationSteps(workflow: Workflow, injectFailure = false): SimulationStep[] {
  const steps: SimulationStep[] = [];

  // 1. Trigger phase
  steps.push({
    id: 'sim-trigger',
    phase: 'TRIGGER',
    title: 'Trigger Event Detection',
    description: `Listening for ${workflow.trigger.description}`,
    status: 'PENDING',
    logs: [`[AURA Monitor] Simulated event received: ${workflow.trigger.type}`],
    details: {
      type: workflow.trigger.type,
      payload: {
        id: 'msg_89f92e01',
        from: 'acme-enterprise@customer.io',
        subject: 'URGENT: Production API Integration Failure on Tenant US-East',
        timestamp: new Date().toISOString(),
      },
    },
  });

  // 2. Condition evaluation phase
  if (workflow.conditions && workflow.conditions.length > 0) {
    for (let i = 0; i < workflow.conditions.length; i++) {
      const c = workflow.conditions[i];
      steps.push({
        id: `sim-cond-${i + 1}`,
        phase: 'CONDITION',
        title: `Condition: ${c.type}`,
        description: c.description,
        status: 'PENDING',
        logs: [`[AURA Evaluator] Analyzing context against rule: ${c.description}`],
        details: {
          conditionType: c.type,
          evaluatedValue: c.value || 'Urgent customer incident detected',
          confidence: 0.98,
          matched: true,
        },
      });
    }
  } else {
    steps.push({
      id: 'sim-cond-default',
      phase: 'CONDITION',
      title: 'Condition Check',
      description: 'Default pass-through guardrails validated',
      status: 'PENDING',
      logs: ['[AURA Guard] Baseline safety policies passed'],
    });
  }

  // 3. Action execution phase
  for (let i = 0; i < workflow.actions.length; i++) {
    const a = workflow.actions[i];
    const isFailedAction = injectFailure && (i === 0 || a.type === 'CREATE_TASK');

    steps.push({
      id: `sim-act-${a.id}`,
      phase: 'ACTION',
      title: `Action: ${a.type}`,
      description: a.description,
      status: 'PENDING',
      logs: [`[AURA Dispatcher] Initiating ${a.type} (${a.priority || 'MEDIUM'} priority)`],
      details: {
        actionId: a.id,
        type: a.type,
        priority: a.priority,
        target: a.target || 'Primary Provider',
        simulatedFailureInjected: isFailedAction,
      },
    });

    // If failure injected & recovery is configured
    if (isFailedAction && workflow.recovery.enabled) {
      if (workflow.recovery.strategy === 'RETRY_THEN_FALLBACK' || workflow.recovery.strategy === 'RETRY') {
        const retries = workflow.recovery.retryCount || 2;
        for (let r = 1; r <= retries; r++) {
          steps.push({
            id: `sim-retry-${a.id}-${r}`,
            phase: 'RECOVERY',
            title: `Auto-Retry ${r}/${retries}`,
            description: `Retrying primary service (Attempt ${r}) after transient connection error`,
            status: 'PENDING',
            logs: [`[AURA Resilience] Retry ${r} dispatched with exponential backoff (${r * 500}ms)`],
          });
        }
      }

      if (workflow.recovery.strategy === 'RETRY_THEN_FALLBACK' || workflow.recovery.strategy === 'FALLBACK') {
        steps.push({
          id: `sim-fallback-${a.id}`,
          phase: 'FALLBACK',
          title: `Failover: ${workflow.recovery.fallback || 'Backup Task Provider'}`,
          description: `Routing operation payload to designated backup service`,
          status: 'PENDING',
          logs: [
            `[AURA CircuitBreaker] Primary provider unavailable. Activating secondary failover endpoint: ${workflow.recovery.fallback || 'BACKUP_TASK_PROVIDER'}`,
          ],
          details: {
            fallbackTarget: workflow.recovery.fallback || 'BACKUP_TASK_PROVIDER',
            status: 'HEALTHY',
          },
        });
      }
    }
  }

  // 4. Verification phase
  steps.push({
    id: 'sim-verification',
    phase: 'VERIFICATION',
    title: `Outcome Verification: ${workflow.verification.type}`,
    description: workflow.verification.description,
    status: 'PENDING',
    logs: [`[AURA Verifier] Querying destination state to confirm: ${workflow.verification.description}`],
    details: {
      type: workflow.verification.type,
      verifiedAt: new Date().toISOString(),
      confirmed: true,
    },
  });

  return steps;
}

/**
 * Executes a simulated run with progressive step callbacks.
 */
export async function runSimulation(
  workflow: Workflow,
  options: SimulationOptions = {}
): Promise<SimulationResult> {
  const { injectFailure = false, stepDelayMs = 450, onStepProgress } = options;
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  const steps = buildSimulationSteps(workflow, injectFailure);
  let recoveryTriggered = false;
  let hasUnrecoveredFailure = false;

  for (let i = 0; i < steps.length; i++) {
    const currentStep = steps[i];
    currentStep.status = 'RUNNING';
    onStepProgress?.(currentStep, [...steps]);

    // Simulate async network execution
    await new Promise((r) => setTimeout(r, stepDelayMs));

    const isFailureStep =
      injectFailure &&
      currentStep.phase === 'ACTION' &&
      Boolean(currentStep.details?.simulatedFailureInjected);

    if (isFailureStep) {
      currentStep.status = 'FAILED';
      currentStep.durationMs = 280;
      currentStep.logs.push('[ERROR 503] Primary Task Gateway service unavailable / Connection reset.');
      
      if (!workflow.recovery.enabled || workflow.recovery.strategy === 'NONE') {
        hasUnrecoveredFailure = true;
      } else {
        recoveryTriggered = true;
      }
    } else if (currentStep.phase === 'RECOVERY') {
      // In failure simulation, retries fail until fallback
      currentStep.status = 'FAILED';
      currentStep.durationMs = 150;
      currentStep.logs.push('[WARN] Retry attempt failed: Target endpoint returned HTTP 503.');
    } else if (currentStep.phase === 'FALLBACK') {
      currentStep.status = 'SUCCESS';
      currentStep.durationMs = 190;
      currentStep.logs.push(`[SUCCESS] Fallback provider successfully received and processed task entity [ID: task_fallback_${Date.now().toString().slice(-4)}].`);
    } else {
      currentStep.status = 'SUCCESS';
      currentStep.durationMs = Math.floor(Math.random() * 80) + 40;
      currentStep.logs.push('[SUCCESS] Step verified and completed without anomalies.');
    }

    onStepProgress?.(currentStep, [...steps]);

    // If an unrecovered failure happened, skip subsequent action/verification steps
    if (hasUnrecoveredFailure && i < steps.length - 1) {
      for (let j = i + 1; j < steps.length; j++) {
        steps[j].status = 'SKIPPED';
        steps[j].logs.push('[SKIPPED] Skipped due to previous step failure.');
      }
      break;
    }
  }

  const completedAt = new Date().toISOString();
  const totalDurationMs = Date.now() - startTime;

  let overallStatus: 'SUCCESS' | 'RECOVERED' | 'FAILED' = 'SUCCESS';
  let message = 'Simulation completed successfully. Goal criteria fulfilled.';

  if (hasUnrecoveredFailure) {
    overallStatus = 'FAILED';
    message = 'Simulation failed at primary action step without recovery mechanism.';
  } else if (recoveryTriggered) {
    overallStatus = 'RECOVERED';
    message = 'Simulation encountered primary service outage and successfully recovered via backup provider.';
  }

  return {
    id: `sim-run-${Date.now()}`,
    workflowId: workflow.id,
    status: overallStatus,
    totalDurationMs,
    steps,
    startedAt,
    completedAt,
    recoveryTriggered,
    verificationPassed: !hasUnrecoveredFailure,
    message,
  };
}
