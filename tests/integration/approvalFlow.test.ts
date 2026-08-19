/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { executeWorkflowEngine } from '../../src/workflow/executionEngine.ts';
import { assert, assertEqual, assertTrue, assertFalse } from '../helpers/testHarness.ts';
import { HIGH_RISK_WORKFLOW, UNSUPPORTED_CAPABILITY_WORKFLOW } from '../fixtures/workflows.ts';

export async function testApprovalAndUnsupportedFlow(): Promise<void> {
  // 1. High-Risk Approval Enforcement Test
  const approvalResult = await executeWorkflowEngine(HIGH_RISK_WORKFLOW, {
    stepDelayMs: 0,
  });

  assertEqual(approvalResult.executionStatus, 'WAITING_FOR_APPROVAL');
  assertFalse(approvalResult.goalAchieved, 'Must not claim goal achieved while awaiting approval');
  assertFalse(
    approvalResult.auditEvents.some((e) => e.eventType === 'ACTION_STARTED'),
    'External actions must not start before human approval'
  );
  assertTrue(
    approvalResult.auditEvents.some((e) => e.eventType === 'WAITING_FOR_APPROVAL'),
    'Audit event must record WAITING_FOR_APPROVAL'
  );

  // 2. Unsupported Capability Rejection Test (e.g. TRANSFER_MONEY)
  const unsupportedResult = await executeWorkflowEngine(UNSUPPORTED_CAPABILITY_WORKFLOW, {
    stepDelayMs: 0,
  });

  assertEqual(unsupportedResult.executionStatus, 'VALIDATION_FAILED');
  assertFalse(unsupportedResult.goalAchieved);
  assertFalse(
    unsupportedResult.auditEvents.some((e) => e.eventType === 'ACTION_STARTED'),
    'Executor must never run external actions for unsupported capabilities'
  );
  assertTrue(
    unsupportedResult.auditEvents.some((e) => e.eventType === 'UNSUPPORTED_CAPABILITY_REJECTED'),
    'Audit trail must record UNSUPPORTED_CAPABILITY_REJECTED'
  );
}
