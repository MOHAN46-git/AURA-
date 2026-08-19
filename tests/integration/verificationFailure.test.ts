/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { executeWorkflowEngine } from '../../src/workflow/executionEngine.ts';
import { assert, assertEqual, assertTrue, assertFalse, assertEventOrder } from '../helpers/testHarness.ts';
import { NORMAL_EXECUTION_WORKFLOW } from '../fixtures/workflows.ts';

export async function testVerificationFailure(): Promise<void> {
  const result = await executeWorkflowEngine(NORMAL_EXECUTION_WORKFLOW, {
    primaryTaskServiceFailure: false, // Technical action succeeds
    forceVerificationFailure: true, // Destination state assertion fails
    stepDelayMs: 0,
  });

  // 1. Assert AURA does NOT claim goal success
  assertFalse(result.goalAchieved, 'AURA must NOT claim goal success when verification fails');
  assertFalse(result.verificationPassed, 'verificationPassed must be false');

  // 2. Assert status indicates outcome unverified / verification failed
  const validVerificationFailureStatuses = ['VERIFICATION_FAILED', 'OUTCOME_UNVERIFIED', 'FAILED'];
  assert(
    validVerificationFailureStatuses.includes(result.executionStatus),
    `Status must indicate verification failure, got ${result.executionStatus}`
  );

  // 3. Assert audit trail clearly distinguishes technical action dispatch from outcome failure
  const events = result.auditEvents;
  assertTrue(
    events.some((e) => e.eventType === 'ACTION_STARTED'),
    'Audit trail must record action start'
  );
  assertTrue(
    events.some((e) => e.eventType === 'VERIFICATION_STARTED'),
    'Audit trail must record verification initiation'
  );
  assertTrue(
    events.some((e) => e.eventType === 'VERIFICATION_FAILED'),
    'Audit trail must record VERIFICATION_FAILED'
  );
  assertFalse(
    events.some((e) => e.eventType === 'GOAL_ACHIEVED'),
    'Audit trail must NOT contain GOAL_ACHIEVED when verification fails'
  );

  assertEventOrder(events, [
    'TRIGGER_ACCEPTED',
    'ACTION_STARTED',
    'VERIFICATION_STARTED',
    'VERIFICATION_FAILED',
  ]);
}
