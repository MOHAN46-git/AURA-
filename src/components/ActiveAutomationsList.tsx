/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Workflow } from '../workflow/types.ts';
import { CapabilityBadge } from './CapabilityBadge.tsx';
import {
  Play,
  Trash2,
  CheckCircle2,
  RotateCw,
  Search,
  Layers,
  Zap,
} from 'lucide-react';

interface ActiveAutomationsListProps {
  workflows: Workflow[];
  onSelectWorkflow: (workflow: Workflow) => void;
  onSimulateWorkflow: (workflow: Workflow) => void;
  onToggleStatus: (workflowId: string) => void;
  onDeleteWorkflow: (workflowId: string) => void;
  onRunWorkflow?: (workflow: Workflow) => void;
}

export const ActiveAutomationsList: React.FC<ActiveAutomationsListProps> = ({
  workflows,
  onSelectWorkflow,
  onSimulateWorkflow,
  onToggleStatus,
  onDeleteWorkflow,
  onRunWorkflow,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');

  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.trigger.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || w.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search automations or triggers..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 self-end sm:self-auto">
          {(['ALL', 'ACTIVE', 'PAUSED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1 text-xs font-mono font-bold transition-all ${
                statusFilter === st
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Automations */}
      {filteredWorkflows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Layers className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">
            No automations match your query.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting search terms or generate a new goal from the Studio tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWorkflows.map((wf) => (
            <div
              key={wf.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
                      {wf.trigger.type} • {wf.actions.length} Action{wf.actions.length > 1 ? 's' : ''}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {wf.name}
                    </h3>
                  </div>

                  {/* Active/Paused Switch */}
                  <button
                    onClick={() => onToggleStatus(wf.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-colors ${
                      wf.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        wf.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <span>{wf.status}</span>
                  </button>
                </div>

                {/* Goal description */}
                <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                  "{wf.goal}"
                </p>

                {/* Resilience & Verification tags */}
                <div className="space-y-1 mb-4 text-[11px] font-mono">
                  {wf.recovery.enabled && (
                    <div className="flex items-center gap-1.5 text-indigo-700">
                      <RotateCw className="h-3 w-3" />
                      <span>{wf.recovery.description || 'Self-healing failover active'}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-slate-600">
                    <CheckCircle2 className="h-3 w-3 text-indigo-600" />
                    <span>Verifies: {wf.verification.type}</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {wf.requiredCapabilities.slice(0, 3).map((cap) => (
                    <CapabilityBadge key={cap.id} capability={cap} />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onSelectWorkflow(wf)}
                    className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Inspect Plan
                  </button>

                  <button
                    onClick={() => onSimulateWorkflow(wf)}
                    className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    <Play className="h-3 w-3 text-indigo-600" />
                    <span>Simulate</span>
                  </button>

                  {onRunWorkflow && wf.status === 'ACTIVE' && (
                    <button
                      onClick={() => onRunWorkflow(wf)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-xs font-bold text-white transition-colors shadow-xs"
                      title="Trigger live test execution"
                    >
                      <Zap className="h-3 w-3" />
                      <span>Run Now</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onDeleteWorkflow(wf.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  title="Delete Automation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
