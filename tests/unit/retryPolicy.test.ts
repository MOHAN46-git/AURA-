/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { executeWorkflowEngine } from '../../src/workflow/executionEngine.ts';
import { assert, assertEqual, assertTrue, assertFalse } from '../helpers/testHarness.ts';
import { GOLDEN_HACKATHON_WORKFLOW } from '../fixtures/workflows.ts';

export async function testRetryPolicy(): Promise<void> {
  // Test retryCount = 0
  const res0 = await executeWorkflowEngine(GOLDEN_HACKATHON_WORKFLOW, {
    primaryTaskServiceFailure: true,
    retryCount: 0,
    stepDelayMs: 0,
  });
  assertEqual(res0.retriesAttempted, 0, 'retryCount = 0 should execute 0 retries');
  assertFalse(
    res0.auditEvents.some((e) => e.eventType === 'RETRY_1_STARTED'),
    'Should not dispatch retry #1 when retryCount is 0'
  );

  // Test retryCount = 1
  const res1 = await executeWorkflowEngine(GOLDEN_HACKATHON_WORKFLOW, {
    primaryTaskServiceFailure: true,
    retryCount: 1,
    stepDelayMs: 0,
  });
  assertEqual(res1.retriesAttempted, 1, 'retryCount = 1 should execute exactly 1 retry');
  assertTrue(
    res1.auditEvents.some((e) => e.eventType === 'RETRY_1_STARTED'),
    'Must record RETRY_1_STARTED event'
  );
  assertFalse(
    res1.auditEvents.some((e) => e.eventType === 'RETRY_2_STARTED'),
    'Must not execute RETRY_2 when retryCount is 1'
  );

  // Test retryCount = 2
  const res2 = await executeWorkflowEngine(GOLDEN_HACKATHON_WORKFLOW, {
    primaryTaskServiceFailure: true,
    retryCount: 2,
    stepDelayMs: 0,
  });
  assertEqual(res2.retriesAttempted, 2, 'retryCount = 2 should execute exactly 2 retries');
  assertTrue(
    res2.auditEvents.some((e) => e.eventType === 'RETRY_1_STARTED'),
    'Must record RETRY_1_STARTED'
  );
  assertTrue(
    res2.auditEvents.some((e) => e.eventType === 'RETRY_2_STARTED'),
    'Must record RETRY_2_STARTED'
  );
  assertFalse(
    res2.auditEvents.some((e) => e.eventType === 'RETRY_3_STARTED'),
    'Must not execute RETRY_3 when retryCount is 2'
  );

  // Test retryCount = 3
  const res3 = await executeWorkflowEngine(GOLDEN_HACKATHON_WORKFLOW, {
    primaryTaskServiceFailure: true,
    retryCount: 3,
    stepDelayMs: 0,
  });
  assertEqual(res3.retriesAttempted, 3, 'retryCount = 3 should execute exactly 3 retries');
  assertTrue(
    res3.auditEvents.some((e) => e.eventType === 'RETRY_3_STARTED'),
    'Must record RETRY_3_STARTED when retryCount is 3'
  );
}
