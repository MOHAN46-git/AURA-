/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestCase, TestResultItem, TestSuiteSummary } from './helpers/testHarness.ts';
import { testWorkflowValidation } from './unit/workflowValidator.test.ts';
import { testCapabilityRegistry } from './unit/capabilityRegistry.test.ts';
import { testRiskEngine } from './unit/riskEngine.test.ts';
import { testFailureClassification } from './unit/failureClassifier.test.ts';
import { testRetryPolicy } from './unit/retryPolicy.test.ts';
import { testNormalExecutionPath } from './integration/normalExecution.test.ts';
import { testRecoveryExecutionPath } from './integration/recoveryExecution.test.ts';
import { testNoFallbackSafeStop } from './integration/noFallback.test.ts';
import { testVerificationFailure } from './integration/verificationFailure.test.ts';
import { testApprovalAndUnsupportedFlow } from './integration/approvalFlow.test.ts';
import { testIdempotencyAndKillSwitch } from './integration/idempotencyKillSwitch.test.ts';
import { testAiProviderDetection } from './unit/aiProvider.test.ts';
import { testTamilNlpEngine } from './unit/tamilNlp.test.ts';
import { testGoogleAndTaskIntegration } from './integration/googleIntegration.test.ts';
import { testFirebaseIntegration } from './unit/firebaseConfig.test.ts';
import { testTextingCommand } from './unit/textingCommand.test.ts';

export const ALL_AURA_TESTS: TestCase[] = [
  {
    id: 'test-texting-command',
    name: 'Texting Command & Instant SMS Trigger / Failover',
    category: 'unit',
    fn: testTextingCommand,
  },
  {
    id: 'test-firebase-integration',
    name: 'Firebase (Auth & Firestore project1-4506) Cloud Sync',
    category: 'unit',
    fn: testFirebaseIntegration,
  },
  {
    id: 'test-google-task-integration',
    name: 'Google Services (Calendar/Gmail), Task Failover & Outcome Verification',
    category: 'integration',
    fn: testGoogleAndTaskIntegration,
  },
  {
    id: 'test-tamil-nlp-engine',
    name: 'Tamil (தமிழ்) & Multilingual NLP Intent Compilation',
    category: 'unit',
    fn: testTamilNlpEngine,
  },
  {
    id: 'test-ai-provider-detection',
    name: 'AI Provider & Grok (xAI) API Key Auto-Detection',
    category: 'unit',
    fn: testAiProviderDetection,
  },
  {
    id: 'test-schema-validation',
    name: 'Workflow Schema & Malformed Structure Validation',
    category: 'unit',
    fn: testWorkflowValidation,
  },
  {
    id: 'test-capability-registry',
    name: 'Capability Registry & Whitelist Verification',
    category: 'unit',
    fn: testCapabilityRegistry,
  },
  {
    id: 'test-risk-engine',
    name: 'Deterministic Risk Policy & Factor Scoring',
    category: 'unit',
    fn: testRiskEngine,
  },
  {
    id: 'test-failure-classifier',
    name: 'Failure Taxonomy & Error Diagnostic Classification',
    category: 'unit',
    fn: testFailureClassification,
  },
  {
    id: 'test-retry-policy',
    name: 'Retry Policy Bounds (0, 1, 2, 3 attempts) & Anti-Recursion',
    category: 'unit',
    fn: testRetryPolicy,
  },
  {
    id: 'test-normal-execution',
    name: 'Normal Path Execution (Trigger → Condition → Action → Verify → Achieved)',
    category: 'integration',
    fn: testNormalExecutionPath,
  },
  {
    id: 'test-golden-recovery',
    name: 'Primary Failure → Diagnose → Retry #1 → Retry #2 → Fallback → Success → Verify (Golden Hackathon Test)',
    category: 'golden',
    fn: testRecoveryExecutionPath,
  },
  {
    id: 'test-no-fallback',
    name: 'Missing Fallback Safe Stop (Retries Exhausted → Blocked / Needs User)',
    category: 'integration',
    fn: testNoFallbackSafeStop,
  },
  {
    id: 'test-verification-failure',
    name: 'Outcome Verification Failure (Action Success vs Outcome Failure Separation)',
    category: 'integration',
    fn: testVerificationFailure,
  },
  {
    id: 'test-approval-and-unsupported',
    name: 'High-Risk Human Approval & Unsupported Capability Rejection',
    category: 'integration',
    fn: testApprovalAndUnsupportedFlow,
  },
  {
    id: 'test-idempotency-killswitch',
    name: 'Action Idempotency Protection & Emergency Kill Switch',
    category: 'integration',
    fn: testIdempotencyAndKillSwitch,
  },
];

/**
 * Executes all automated tests and returns structured results.
 */
export async function runAllAuraTests(
  onProgress?: (result: TestResultItem) => void
): Promise<TestSuiteSummary> {
  const startTime = Date.now();
  const results: TestResultItem[] = [];

  for (const testCase of ALL_AURA_TESTS) {
    const itemStart = Date.now();
    let passed = false;
    let error: string | undefined;

    try {
      await testCase.fn();
      passed = true;
    } catch (err: any) {
      passed = false;
      error = err?.message || String(err);
    }

    const item: TestResultItem = {
      id: testCase.id,
      name: testCase.name,
      category: testCase.category,
      passed,
      durationMs: Date.now() - itemStart,
      error,
    };

    results.push(item);
    onProgress?.(item);
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return {
    suiteName: 'AURA Automated Workflow & Lifecycle Test Suite',
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    durationMs: Date.now() - startTime,
    results,
  };
}

// CLI Execution entrypoint
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('runAllTests')) {
  console.log('\n======================================================');
  console.log('   AURA AUTOMATED WORKFLOW TEST SUITE');
  console.log('======================================================\n');

  runAllAuraTests().then((summary) => {
    summary.results.forEach((r) => {
      const icon = r.passed ? '✓' : '✗';
      const color = r.passed ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';
      console.log(` ${color}${icon}${reset} ${r.name} (${r.durationMs}ms)`);
      if (!r.passed && r.error) {
        console.log(`    \x1b[31mError:\x1b[0m ${r.error}`);
      }
    });

    console.log('\n------------------------------------------------------');
    console.log(
      `Results: \x1b[32m${summary.passed} passed\x1b[0m, \x1b[31m${summary.failed} failed\x1b[0m (${summary.durationMs}ms)`
    );
    console.log('------------------------------------------------------\n');

    if (summary.failed > 0) {
      process.exit(1);
    }
  });
}
