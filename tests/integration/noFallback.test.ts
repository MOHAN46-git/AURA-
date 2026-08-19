/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { executeWorkflowEngine } from '../../src/workflow/executionEngine.ts';
import { assert, assertEqual, assertTrue, assertFalse, assertEventOrder } from '../helpers/testHarness.ts';
import { GOLDEN_HACKATHON_WORKFLOW } from '../fixtures/workflows.ts';

export async function testNoFallbackSafeStop(): Promise<void> {
  const result = await executeWorkflowEngine(GOLDEN_HACKATHON_WORKFLOW, {
    primaryTaskServiceFailure: true,
    retryCount: 2,
    fallbackAvailable: false, // Explicitly no fallback available
    stepDelayMs: 0,
  });

  // 1. Assert workflow does NOT claim success
  assertFalse(result.goalAchieved, 'Workflow must NOT report goal achieved when no fallback exists');
  assertFalse(result.verificationPassed, 'Verification must not pass');
  assertFalse(result.fallbackExecuted, 'No unauthorized fallback should execute');

  // 2. Assert safe terminal status
  const validSafeStatuses = ['NEEDS_USER_INTERVENTION', 'BLOCKED', 'FAILED_SAFE'];
  assert(
    validSafeStatuses.includes(result.executionStatus),
    `Final status must be one of [${validSafeStatuses.join(', ')}], got ${result.executionStatus}`
  );

  // 3. Assert audit events record why execution stopped
  const events = result.auditEvents;
  assertTrue(
    events.some((e) => e.eventType === 'NO_APPROVED_FALLBACK'),
    'Audit trail must record NO_APPROVED_FALLBACK'
  );
  assertTrue(
    events.some((e) => e.eventType === 'EXECUTION_BLOCKED'),
    'Audit trail must record EXECUTION_BLOCKED'
  );

  // 4. Assert event ordering
  assertEventOrder(events, [
    'ACTION_FAILED',
    'FAILURE_CLASSIFIED',
    'RETRY_1_STARTED',
    'RETRY_2_STARTED',
    'RETRY_EXHAUSTED',
    'NO_APPROVED_FALLBACK',
    'EXECUTION_BLOCKED',
  ]);
}
