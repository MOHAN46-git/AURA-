/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { executeWorkflowEngine } from '../../src/workflow/executionEngine.ts';
import { assert, assertEqual, assertTrue, assertFalse, assertEventOrder } from '../helpers/testHarness.ts';
import { NORMAL_EXECUTION_WORKFLOW } from '../fixtures/workflows.ts';

export async function testNormalExecutionPath(): Promise<void> {
  const result = await executeWorkflowEngine(NORMAL_EXECUTION_WORKFLOW, {
    primaryTaskServiceFailure: false,
    stepDelayMs: 0,
  });

  // 1. Assert overall execution outcome
  assertTrue(result.goalAchieved, 'Normal execution must achieve goal');
  assertEqual(result.executionStatus, 'GOAL_ACHIEVED', 'Execution status must be GOAL_ACHIEVED');
  assertTrue(result.verificationPassed, 'Outcome verification must pass');
  assertFalse(result.recoveryTriggered, 'Recovery should not trigger on normal path');
  assertEqual(result.retriesAttempted, 0, 'No retries should occur on normal path');
  assertFalse(result.fallbackExecuted, 'No fallback should execute on normal path');

  // 2. Assert specific event presence in audit stream
  const events = result.auditEvents;
  assertTrue(
    events.some((e) => e.eventType === 'TRIGGER_INGESTED'),
    'Audit log must contain TRIGGER_INGESTED'
  );
  assertTrue(
    events.some((e) => e.eventType === 'TRIGGER_ACCEPTED'),
    'Audit log must contain TRIGGER_ACCEPTED'
  );
  assertTrue(
    events.some((e) => e.eventType === 'CONDITION_EVALUATED'),
    'Audit log must contain CONDITION_EVALUATED'
  );
  assertTrue(
    events.some((e) => e.eventType === 'ACTION_STARTED' && e.title.includes('CREATE_TASK')),
    'Audit log must contain CREATE_TASK'
  );
  assertTrue(
    events.some((e) => e.eventType === 'ACTION_STARTED' && e.title.includes('SEND_NOTIFICATION')),
    'Audit log must contain SEND_NOTIFICATION'
  );
  assertTrue(
    events.some((e) => e.eventType === 'VERIFICATION_SUCCEEDED'),
    'Audit log must contain VERIFICATION_SUCCEEDED'
  );
  assertTrue(
    events.some((e) => e.eventType === 'GOAL_ACHIEVED'),
    'Audit log must contain GOAL_ACHIEVED'
  );

  // 3. Assert strict event chronological ordering
  assertEventOrder(events, [
    'TRIGGER_INGESTED',
    'TRIGGER_ACCEPTED',
    'CONDITION_EVALUATED',
    'ACTION_STARTED',
    'VERIFICATION_STARTED',
    'VERIFICATION_SUCCEEDED',
    'GOAL_ACHIEVED',
  ]);
}
