/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { executeWorkflowEngine } from '../../src/workflow/executionEngine.ts';
import { assert, assertEqual, assertTrue, assertFalse } from '../helpers/testHarness.ts';
import { GOLDEN_HACKATHON_WORKFLOW } from '../fixtures/workflows.ts';

export async function testIdempotencyAndKillSwitch(): Promise<void> {
  // 1. Idempotency Key Registration Test
  const testIdempotencyKey = 'idem-task-key-xyz-789';
  const idemResult = await executeWorkflowEngine(GOLDEN_HACKATHON_WORKFLOW, {
    primaryTaskServiceFailure: true,
    idempotencyKey: testIdempotencyKey,
    stepDelayMs: 0,
  });

  assertTrue(
    Boolean(idemResult.idempotencyKeysUsed?.includes(testIdempotencyKey)),
    'Engine must retain and track registered idempotency key'
  );
  assertTrue(
    idemResult.auditEvents.some((e) => e.eventType === 'IDEMPOTENCY_KEY_RECORDED'),
    'Audit trail must record IDEMPOTENCY_KEY_RECORDED'
  );

  // 2. Kill Switch / Emergency Stop Test
  const killSwitchResult = await executeWorkflowEngine(GOLDEN_HACKATHON_WORKFLOW, {
    killSwitch: true,
    stepDelayMs: 0,
  });

  assertEqual(killSwitchResult.executionStatus, 'EMERGENCY_STOPPED');
  assertFalse(killSwitchResult.goalAchieved, 'Goal must not be marked achieved when stopped by kill switch');
  assertFalse(
    killSwitchResult.auditEvents.some((e) => e.eventType === 'ACTION_STARTED'),
    'No actions should start after emergency stop is activated'
  );
  assertTrue(
    killSwitchResult.auditEvents.some((e) => e.eventType === 'EMERGENCY_STOP'),
    'Audit event must record EMERGENCY_STOP'
  );
}
