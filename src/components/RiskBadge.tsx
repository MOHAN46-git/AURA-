/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { RiskEvaluation, RiskLevel } from '../workflow/types.ts';

interface RiskBadgeProps {
  risk: RiskEvaluation;
  showDetails?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, showDetails = false }) => {
  const getBadgeConfig = (level: RiskLevel) => {
    switch (level) {
      case 'LOW':
        return {
          pill: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          dot: 'bg-emerald-500',
          icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />,
          label: 'RISK: LOW',
          desc: 'Internal actions only. Safe for automatic execution.',
        };
      case 'MEDIUM':
        return {
          pill: 'bg-orange-50 text-orange-700 border-orange-100',
          dot: 'bg-orange-500',
          icon: <Shield className="h-3.5 w-3.5 text-orange-600 shrink-0" />,
          label: 'RISK: MEDIUM',
          desc: 'Creates or updates workspace items without outbound broadcasts.',
        };
      case 'HIGH':
        return {
          pill: 'bg-rose-50 text-rose-700 border-rose-100',
          dot: 'bg-rose-500',
          icon: <ShieldAlert className="h-3.5 w-3.5 text-rose-600 shrink-0" />,
          label: 'RISK: HIGH',
          desc: 'Outbound emails or external webhooks. Requires manual approval.',
        };
      case 'CRITICAL':
        return {
          pill: 'bg-rose-100 text-rose-800 border-rose-200',
          dot: 'bg-rose-600',
          icon: <ShieldAlert className="h-3.5 w-3.5 text-rose-700 shrink-0" />,
          label: 'RISK: CRITICAL',
          desc: 'Destructive or high-impact actions. Strict user gate enforced.',
        };
    }
  };

  const config = getBadgeConfig(risk.level);

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${config.pill}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className="whitespace-nowrap">{config.label}</span>
      </div>

      {showDetails && (
        <div className="text-xs text-slate-500">
          <p className="text-slate-700 mb-1">{risk.reason}</p>
          {risk.factors && risk.factors.length > 0 && (
            <ul className="list-disc list-inside space-y-0.5 text-slate-500">
              {risk.factors.map((factor, idx) => (
                <li key={idx}>{factor}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
