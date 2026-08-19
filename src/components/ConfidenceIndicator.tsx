/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { ConfidenceLevel } from '../workflow/types.ts';

interface ConfidenceIndicatorProps {
  confidence: number;
  level: ConfidenceLevel;
  clarificationNeeded?: string;
  showBar?: boolean;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  level,
  clarificationNeeded,
  showBar = true,
}) => {
  const percent = Math.round(confidence * 100);

  const getStyle = () => {
    switch (level) {
      case 'HIGH':
        return {
          bg: 'bg-indigo-50 border-indigo-100 text-indigo-700',
          barColor: 'bg-indigo-600',
          dot: 'bg-indigo-500',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />,
          label: `CONFIDENCE ${percent}%`,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-orange-50 border-orange-100 text-orange-700',
          barColor: 'bg-orange-500',
          dot: 'bg-orange-500',
          icon: <AlertTriangle className="h-3.5 w-3.5 text-orange-600 shrink-0" />,
          label: `CONFIDENCE ${percent}%`,
        };
      case 'LOW':
        return {
          bg: 'bg-rose-50 border-rose-100 text-rose-700',
          barColor: 'bg-rose-500',
          dot: 'bg-rose-500',
          icon: <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />,
          label: `CONFIDENCE ${percent}%`,
        };
    }
  };

  const style = getStyle();

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${style.bg}`}>
        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
        <span className="font-bold whitespace-nowrap">{style.label}</span>
      </div>

      {showBar && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full transition-all duration-500 ${style.barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {level === 'MEDIUM' && (
        <div className="rounded-lg border border-orange-200 bg-orange-50/70 p-2.5 text-xs text-orange-900">
          <span className="font-bold block mb-0.5">AURA needs confirmation:</span>
          <p className="text-orange-800">{clarificationNeeded || 'Please review the generated assumptions below before activating.'}</p>
        </div>
      )}

      {level === 'LOW' && (
        <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-2.5 text-xs text-rose-900">
          <span className="font-bold block mb-0.5">I need more information before I can safely create this automation:</span>
          <p className="text-rose-800">{clarificationNeeded || 'Could you provide more specific triggers and desired actions?'}</p>
        </div>
      )}
    </div>
  );
};
