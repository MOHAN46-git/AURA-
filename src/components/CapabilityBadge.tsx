/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CapabilityRequirement } from '../workflow/types.ts';

interface CapabilityBadgeProps {
  capability: CapabilityRequirement;
}

export const CapabilityBadge: React.FC<CapabilityBadgeProps> = ({ capability }) => {
  return (
    <div
      title={capability.description}
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 font-mono uppercase tracking-tight shadow-2xs hover:border-indigo-300 transition-colors"
    >
      <span>{capability.label}</span>
    </div>
  );
};
