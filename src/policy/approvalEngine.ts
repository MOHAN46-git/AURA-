/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Workflow } from '../workflow/types.ts';

export interface ApprovalCheckResult {
  canAutoExecute: boolean;
  approvalRequired: boolean;
  blockReason?: string;
  badgeLabel: string;
  badgeVariant: 'safe' | 'warning' | 'danger';
}

export function checkApprovalPolicy(workflow: Workflow): ApprovalCheckResult {
  if (workflow.risk.level === 'HIGH' || workflow.risk.level === 'CRITICAL' || workflow.approvalRequired) {
    return {
      canAutoExecute: false,
      approvalRequired: true,
      blockReason: workflow.risk.level === 'HIGH' || workflow.risk.level === 'CRITICAL'
        ? `Manual authorization required due to ${workflow.risk.level} risk classification (${workflow.risk.reason})`
        : 'Explicit user approval gate configured for this automation',
      badgeLabel: 'User approval required before execution',
      badgeVariant: 'warning',
    };
  }

  return {
    canAutoExecute: true,
    approvalRequired: false,
    badgeLabel: 'No manual approval required',
    badgeVariant: 'safe',
  };
}
