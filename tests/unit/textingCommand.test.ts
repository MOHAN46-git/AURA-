/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateClientWorkflow } from '../../src/workflow/clientFallback.ts';
import { validateWorkflow } from '../../src/workflow/validator.ts';
import { evaluateDeterministicRisk } from '../../src/policy/riskEngine.ts';
import { executeWorkflowEngine } from '../../src/workflow/executionEngine.ts';
import { extractRequiredCapabilities } from '../../src/workflow/capabilityRegistry.ts';
import { assert, assertTrue, assertFalse, assertEqual } from '../helpers/testHarness.ts';

export async function testTextingCommand(): Promise<void> {
  // =========================================================================
  // 1. Natural Language Intent Compilation for Texting Commands (English)
  // =========================================================================
  const englishPrompt =
    'Whenever I receive an urgent text message or SMS, create a high-priority task, text me a confirmation, and failover to my backup task provider if needed.';
  const wfEnglish = generateClientWorkflow(englishPrompt);

  assertEqual(wfEnglish.trigger.type, 'TEXT_RECEIVED', 'Trigger should compile to TEXT_RECEIVED');
  assertTrue(
    wfEnglish.actions.some((a) => a.type === 'CREATE_TASK'),
    'Should include CREATE_TASK action'
  );
  assertTrue(
    wfEnglish.actions.some((a) => a.type === 'SEND_TEXT'),
    'Should include SEND_TEXT action'
  );
  assertTrue(wfEnglish.recovery.enabled, 'Recovery should be enabled for failover prompt');
  assertEqual(wfEnglish.recovery.strategy, 'RETRY_THEN_FALLBACK', 'Strategy should be RETRY_THEN_FALLBACK');
  assertEqual(wfEnglish.confidenceLevel, 'HIGH', 'Confidence should be HIGH');
  assertTrue(wfEnglish.confidence >= 0.85, 'Confidence score should be >= 0.85');

  // =========================================================================
  // 2. Multilingual & Tamil NLP Texting Intent Compilation
  // =========================================================================
  const tamilPrompt =
    'அவசர குறுஞ்செய்தி வரும்போது, பணியை உருவாக்கி எனக்கு குறுஞ்செய்தி மூலம் உறுதிப்படுத்தவும்.';
  const wfTamil = generateClientWorkflow(tamilPrompt);

  assertEqual(wfTamil.trigger.type, 'TEXT_RECEIVED', 'Tamil prompt should compile to TEXT_RECEIVED trigger');
  assertTrue(
    wfTamil.actions.some((a) => a.type === 'SEND_TEXT'),
    'Tamil prompt should include SEND_TEXT action'
  );

  // =========================================================================
  // 3. Capability Extraction & Whitelist Verification
  // =========================================================================
  const capabilities = extractRequiredCapabilities(wfEnglish);
  const permissions = capabilities.map((c) => c.permission);

  assertTrue(permissions.includes('sms:read'), 'Must extract sms:read for TEXT_RECEIVED trigger');
  assertTrue(permissions.includes('tasks:create'), 'Must extract tasks:create for CREATE_TASK action');
  assertTrue(permissions.includes('sms:send'), 'Must extract sms:send for SEND_TEXT action');

  // =========================================================================
  // 4. Schema & Field Validation
  // =========================================================================
  const validation = validateWorkflow(wfEnglish, englishPrompt);
  assertTrue(validation.valid, 'Texting workflow must pass strict schema validation');
  assert(validation.issues.length === 0, 'Should have 0 validation error issues');

  // =========================================================================
  // 5. Deterministic Risk Classification & Safety Guardrails
  // =========================================================================
  const riskEval = evaluateDeterministicRisk(wfEnglish);
  assertEqual(riskEval.risk.level, 'HIGH', 'Outbound SEND_TEXT action must be evaluated as HIGH risk');
  assertTrue(riskEval.approvalRequired, 'Outbound text dispatch requires human-in-the-loop approval gate');
  assertTrue(
    riskEval.risk.factors.some((f) => f.toLowerCase().includes('text') || f.toLowerCase().includes('sms')),
    'Risk factors must mention text/SMS dispatch'
  );

  // =========================================================================
  // 6. End-to-End Workflow Execution & Outcome Verification (Normal Path)
  // =========================================================================
  // Temporarily bypass approval to test execution pipeline
  const testWf = { ...wfEnglish, approvalRequired: false };
  const normalResult = await executeWorkflowEngine(testWf, { injectFailure: false });

  assertEqual(normalResult.executionStatus, 'GOAL_ACHIEVED', 'Normal execution should achieve goal');
  assertTrue(normalResult.verificationPassed, 'Outcome verification must pass');
  assertTrue(normalResult.goalAchieved, 'Goal achieved boolean must be true');
  assertTrue(
    normalResult.steps.some((s) => s.phase === 'TRIGGER' && s.status === 'PENDING'),
    'Pipeline should contain trigger step'
  );

  // =========================================================================
  // 7. End-to-End Recovery & Failover with Texting Action
  // =========================================================================
  const recoveryResult = await executeWorkflowEngine(testWf, {
    injectFailure: true,
    primaryTaskServiceFailure: true,
    fallbackAvailable: true,
    retryCount: 2,
  });

  assertEqual(recoveryResult.executionStatus, 'RECOVERED', 'Recovery path should return RECOVERED status');
  assertTrue(recoveryResult.goalAchieved, 'Goal achieved must be true via fallback');
  assertTrue(recoveryResult.recoveryTriggered, 'Recovery must be triggered');
  assertTrue(recoveryResult.fallbackExecuted, 'Fallback provider must be executed');
  assertTrue(recoveryResult.verificationPassed, 'Verification must pass on recovered task/text');
  assertEqual(recoveryResult.retriesAttempted, 2, 'Must perform exactly 2 retry attempts');
}
