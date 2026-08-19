/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateWorkflow } from '../../src/workflow/validator.ts';
import { assert, assertEqual, assertTrue, assertFalse } from '../helpers/testHarness.ts';
import { GOLDEN_HACKATHON_WORKFLOW, UNSUPPORTED_CAPABILITY_WORKFLOW } from '../fixtures/workflows.ts';

export async function testWorkflowValidation(): Promise<void> {
  // 1. Valid Golden Workflow passes validation
  const validRes = validateWorkflow(GOLDEN_HACKATHON_WORKFLOW, GOLDEN_HACKATHON_WORKFLOW.goal);
  assertTrue(validRes.valid, 'Golden workflow must pass validation');
  assert(Boolean(validRes.sanitizedWorkflow), 'Sanitized workflow must be generated');
  assertEqual(validRes.sanitizedWorkflow?.goal, GOLDEN_HACKATHON_WORKFLOW.goal);

  // 2. Missing Goal rejection
  const missingGoalRes = validateWorkflow({
    name: 'Workflow with no goal',
    trigger: { type: 'EMAIL_RECEIVED' },
    actions: [{ type: 'CREATE_TASK' }],
  });
  assertFalse(missingGoalRes.valid, 'Workflow without goal must be rejected');
  assert(
    missingGoalRes.issues.some((i) => i.field === 'goal' && i.severity === 'ERROR'),
    'Must report missing goal error'
  );

  // 3. Missing Trigger rejection
  const missingTriggerRes = validateWorkflow({
    goal: 'Create a task automatically',
    actions: [{ type: 'CREATE_TASK' }],
  });
  assertFalse(missingTriggerRes.valid, 'Workflow without trigger must be rejected');
  assert(
    missingTriggerRes.issues.some((i) => i.field === 'trigger' && i.severity === 'ERROR'),
    'Must report missing trigger error'
  );

  // 4. Missing Actions rejection
  const missingActionsRes = validateWorkflow({
    goal: 'Listen for emails only',
    trigger: { type: 'EMAIL_RECEIVED' },
    actions: [],
  });
  assertFalse(missingActionsRes.valid, 'Workflow with empty actions array must be rejected');
  assert(
    missingActionsRes.issues.some((i) => i.field === 'actions' && i.severity === 'ERROR'),
    'Must report missing actions error'
  );

  // 5. Unsupported Action Type rejection (TRANSFER_MONEY)
  const unsupportedActionRes = validateWorkflow(UNSUPPORTED_CAPABILITY_WORKFLOW);
  assertFalse(unsupportedActionRes.valid, 'Workflow with unsupported action TRANSFER_MONEY must be rejected');
  assert(
    unsupportedActionRes.issues.some((i) => i.message.includes('TRANSFER_MONEY')),
    'Must explicitly name unsupported action'
  );

  // 6. Invalid / Unsupported Trigger type rejection
  const invalidTriggerRes = validateWorkflow({
    goal: 'Trigger on unknown satellite pulse',
    trigger: { type: 'SATELLITE_PULSE_EVENT' as any },
    actions: [{ type: 'CREATE_TASK' }],
  });
  assertFalse(invalidTriggerRes.valid, 'Invalid trigger type must be rejected');

  // 7. Malformed Condition Type rejection
  const invalidConditionRes = validateWorkflow({
    goal: 'Trigger task on condition',
    trigger: { type: 'EMAIL_RECEIVED' },
    conditions: [{ type: 'UNRECOGNIZED_PREDICATE' as any, value: 'test' }],
    actions: [{ type: 'CREATE_TASK' }],
  });
  assertFalse(invalidConditionRes.valid, 'Invalid condition type must be rejected');

  // 8. Confidence normalization check
  const overScoreRes = validateWorkflow({
    goal: 'Standard task workflow',
    confidence: 95, // Percentage format
    trigger: { type: 'EMAIL_RECEIVED' },
    actions: [{ type: 'CREATE_TASK' }],
  });
  assertTrue(overScoreRes.valid, 'Valid workflow with percentage confidence should sanitize');
  assertEqual(overScoreRes.sanitizedWorkflow?.confidence, 0.95, 'Should normalize 95% to 0.95');
}
