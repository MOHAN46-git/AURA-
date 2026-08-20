/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionType, RiskEvaluation, RiskLevel, Workflow } from '../workflow/types.ts';

/**
 * Deterministic Risk Classification Engine
 *
 * Enforces concrete risk rules based on operation safety boundaries:
 * - LOW: Read-only, AI summarization/classification, internal private notifications
 * - MEDIUM: Creating local tasks, setting calendar appointments, saving safe data
 * - HIGH: Outbound emails to external parties, broad distribution, webhooks
 * - CRITICAL: Destructive operations, financial calls, bulk deletions
 *
 * For HIGH and CRITICAL, approvalRequired MUST be deterministically forced to true.
 */

export function evaluateDeterministicRisk(workflow: Partial<Workflow>): {
  risk: RiskEvaluation;
  approvalRequired: boolean;
} {
  const actions = workflow.actions || [];
  const factors: string[] = [];
  let calculatedLevel: RiskLevel = 'LOW';
  let approvalRequired = false;

  // Scan actions
  for (const act of actions) {
    switch (act.type as ActionType) {
      case 'SEND_EMAIL':
        calculatedLevel = maxRisk(calculatedLevel, 'HIGH');
        factors.push('Sends outbound communications to external email recipients');
        approvalRequired = true;
        break;

      case 'SEND_TEXT':
        calculatedLevel = maxRisk(calculatedLevel, 'HIGH');
        factors.push('Dispatches outbound SMS or text message to recipient');
        approvalRequired = true;
        break;

      case 'CALL_WEBHOOK':
        calculatedLevel = maxRisk(calculatedLevel, 'HIGH');
        factors.push('Executes external HTTP webhook integration with third-party endpoints');
        approvalRequired = true;
        break;

      case 'CREATE_CALENDAR_EVENT':
        calculatedLevel = maxRisk(calculatedLevel, 'MEDIUM');
        factors.push('Modifies user calendar by scheduling a new event');
        break;

      case 'CREATE_TASK':
        calculatedLevel = maxRisk(calculatedLevel, 'MEDIUM');
        factors.push('Creates a persistent task in your task management system');
        break;

      case 'SAVE_DATA':
        calculatedLevel = maxRisk(calculatedLevel, 'MEDIUM');
        factors.push('Persists structured records into storage');
        break;

      case 'SEND_NOTIFICATION':
      case 'GENERATE_SUMMARY':
        // Safe internal operations
        factors.push(
          act.type === 'SEND_NOTIFICATION'
            ? 'Dispatches private notification to user only'
            : 'Performs read-only AI summarization'
        );
        break;

      default:
        // Unknown or custom actions default to HIGH for safety
        calculatedLevel = maxRisk(calculatedLevel, 'HIGH');
        factors.push(`Action type "${act.type}" requires heightened review`);
        approvalRequired = true;
        break;
    }
  }

  // Check for explicit user approval requests in goal text or trigger
  const goalLower = (workflow.goal || '').toLowerCase() + ' ' + (workflow.rawPrompt || '').toLowerCase();
  if (
    goalLower.includes('ask me') ||
    goalLower.includes('require approval') ||
    goalLower.includes('confirm before') ||
    goalLower.includes('ask before') ||
    goalLower.includes('need my permission')
  ) {
    approvalRequired = true;
    factors.push('User explicitly requested manual approval confirmation before execution');
  }

  // If actions only include private notifications and summaries, it is strictly LOW
  const onlySafeActions = actions.length > 0 && actions.every(
    (a) => a.type === 'SEND_NOTIFICATION' || a.type === 'GENERATE_SUMMARY'
  );

  if (onlySafeActions) {
    calculatedLevel = 'LOW';
    approvalRequired = false;
  }

  // Generate concise human reason
  let reason = '';
  if (calculatedLevel === 'LOW') {
    reason = 'Executes read-only evaluation and delivers private notification to you.';
  } else if (calculatedLevel === 'MEDIUM') {
    reason = 'Creates internal records or updates your tasks/calendar without external messaging.';
  } else if (calculatedLevel === 'HIGH') {
    reason = 'Interacts with external parties or remote endpoints; requires manual review before dispatching.';
  } else {
    reason = 'Contains critical or sensitive operations; strict guardrails and user authorization required.';
  }

  return {
    risk: {
      level: calculatedLevel,
      reason,
      factors,
      deterministicOverride: true,
    },
    approvalRequired,
  };
}

function riskToScore(level: RiskLevel): number {
  switch (level) {
    case 'LOW':
      return 1;
    case 'MEDIUM':
      return 2;
    case 'HIGH':
      return 3;
    case 'CRITICAL':
      return 4;
  }
}

function scoreToRisk(score: number): RiskLevel {
  switch (score) {
    case 1:
      return 'LOW';
    case 2:
      return 'MEDIUM';
    case 3:
      return 'HIGH';
    case 4:
    default:
      return 'CRITICAL';
  }
}

function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  const score = Math.max(riskToScore(a), riskToScore(b));
  return scoreToRisk(score);
}
