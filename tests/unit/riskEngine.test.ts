/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { evaluateDeterministicRisk } from '../../src/policy/riskEngine.ts';
import { assert, assertEqual, assertTrue, assertFalse } from '../helpers/testHarness.ts';
import { GOLDEN_HACKATHON_WORKFLOW, HIGH_RISK_WORKFLOW } from '../fixtures/workflows.ts';

export async function testRiskEngine(): Promise<void> {
  // 1. Safe read-only and notification workflow evaluation (strictly LOW risk)
  const notificationOnlyEval = evaluateDeterministicRisk({
    goal: 'Notify me whenever daily summary is ready',
    actions: [
      { id: 'a1', type: 'GENERATE_SUMMARY', description: 'Synthesize summary' },
      { id: 'a2', type: 'SEND_NOTIFICATION', description: 'Send private alert' },
    ],
  });
  assertEqual(notificationOnlyEval.risk.level, 'LOW', 'Notification & summary actions must be LOW risk');
  assertFalse(notificationOnlyEval.approvalRequired, 'LOW risk workflows must not mandate approval');

  // 2. Standard internal task creation evaluation (MEDIUM risk, automated without approval)
  const taskEval = evaluateDeterministicRisk(GOLDEN_HACKATHON_WORKFLOW);
  assertEqual(taskEval.risk.level, 'MEDIUM', 'Task creation workflow is classified as standard MEDIUM risk');
  assertFalse(taskEval.approvalRequired, 'Standard internal task creation must not block on approval');

  // 3. High-risk external communication broadcast evaluation
  const highRiskEval = evaluateDeterministicRisk(HIGH_RISK_WORKFLOW);
  assert(
    highRiskEval.risk.level === 'HIGH' || highRiskEval.risk.level === 'CRITICAL',
    'Mass external email broadcast must be classified as HIGH or CRITICAL risk'
  );
  assertTrue(highRiskEval.approvalRequired, 'High-risk external broadcast must mandate approval');
  assert(highRiskEval.risk.factors.length > 0, 'Risk evaluation must include human-readable risk factors');

  // 4. Financial or destructive prompt detection
  const financialEval = evaluateDeterministicRisk({
    goal: 'Transfer wire funds from corporate account to third party vendor',
    actions: [{ id: 'a1', type: 'CALL_WEBHOOK', description: 'Wire transfer endpoint' }],
  });
  assert(
    financialEval.risk.level === 'CRITICAL' || financialEval.risk.level === 'HIGH',
    'Financial operations must trigger elevated risk level'
  );
  assertTrue(financialEval.approvalRequired, 'Financial operations must mandate approval');
}
