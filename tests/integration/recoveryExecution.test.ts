/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { executeWorkflowEngine } from '../../src/workflow/executionEngine.ts';
import { assert, assertEqual, assertTrue, assertFalse, assertEventOrder } from '../helpers/testHarness.ts';
import { GOLDEN_HACKATHON_WORKFLOW } from '../fixtures/workflows.ts';

export async function testRecoveryExecutionPath(): Promise<void> {
  const result = await executeWorkflowEngine(GOLDEN_HACKATHON_WORKFLOW, {
    primaryTaskServiceFailure: true,
    failureType: 'SERVICE_UNAVAILABLE',
    retryCount: 2,
    fallbackAvailable: true,
    stepDelayMs: 0,
  });

  // 1. Assert overall execution outcome & state
  assertTrue(result.goalAchieved, 'Workflow must achieve goal via approved fallback');
  assertEqual(result.executionStatus, 'RECOVERED', 'Execution status must be RECOVERED');
  assertTrue(result.recoveryTriggered, 'Recovery must be recorded as triggered');
  assertTrue(result.verificationPassed, 'Outcome verification must pass');
  assertEqual(result.retriesAttempted, 2, 'Must execute exactly 2 retries before fallback');
  assertTrue(result.fallbackExecuted, 'Fallback provider must be executed');

  // 2. Assert failure classification diagnostic
  assertEqual(result.diagnostics?.code, 'SERVICE_UNAVAILABLE');
  assertTrue(result.diagnostics?.retryable === true, 'SERVICE_UNAVAILABLE must be marked retryable');

  // 3. Assert exact sequence in Audit Event Stream
  const events = result.auditEvents;
  assertEventOrder(events, [
    'TRIGGER_INGESTED',
    'CONDITION_EVALUATED',
    'ACTION_STARTED',
    'ACTION_FAILED',
    'FAILURE_CLASSIFIED',
    'RETRY_1_STARTED',
    'RETRY_1_FAILED',
    'RETRY_2_STARTED',
    'RETRY_2_FAILED',
    'RETRY_EXHAUSTED',
    'FALLBACK_SELECTED',
    'FALLBACK_STARTED',
    'FALLBACK_SUCCEEDED',
    'VERIFICATION_STARTED',
    'VERIFICATION_SUCCEEDED',
    'GOAL_ACHIEVED',
  ]);

  // 4. Assert NO third retry occurred
  assertFalse(
    events.some((e) => e.eventType === 'RETRY_3_STARTED'),
    'Must not attempt a 3rd retry when retry limit is 2'
  );

  // 5. Assert audit events contain structured payload information
  const failEvent = events.find((e) => e.eventType === 'ACTION_FAILED');
  assert(Boolean(failEvent?.failureType), 'Failure audit event must contain failureType');
  assertEqual(failEvent?.failureType, 'SERVICE_UNAVAILABLE');

  const retry1Event = events.find((e) => e.eventType === 'RETRY_1_STARTED');
  assertEqual(retry1Event?.retryAttempt, 1, 'Retry #1 audit event must record retryAttempt: 1');
}
