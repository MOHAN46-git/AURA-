/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Workflow } from '../workflow/types.ts';
import { computeDashboardMetrics } from '../data/mockAutomations.ts';
import { ActiveAutomationsList } from './ActiveAutomationsList.tsx';
import {
  Activity,
  Zap,
  HeartPulse,
  RotateCw,
  ShieldAlert,
  Plus,
} from 'lucide-react';

interface DashboardViewProps {
  workflows: Workflow[];
  onSelectWorkflow: (workflow: Workflow) => void;
  onSimulateWorkflow: (workflow: Workflow) => void;
  onToggleStatus: (workflowId: string) => void;
  onDeleteWorkflow: (workflowId: string) => void;
  onNewGoalClick: () => void;
  onRunWorkflow?: (workflow: Workflow) => void;
  executionCount?: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  workflows,
  onSelectWorkflow,
  onSimulateWorkflow,
  onToggleStatus,
  onDeleteWorkflow,
  onNewGoalClick,
  onRunWorkflow,
  executionCount = 142,
}) => {
  const metrics = computeDashboardMetrics(workflows);

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Active Automations */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider">
              Active Workflows
            </span>
            <Activity className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics.activeAutomationsCount}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {workflows.length} total registered
          </span>
        </div>

        {/* Metric 2: Today's Executions */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider">
              Today's Runs
            </span>
            <Zap className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics.todayExecutions + (executionCount - 142)}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Live tracked dispatches
          </span>
        </div>

        {/* Metric 3: Workflow Health */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider">
              Workflow Health
            </span>
            <HeartPulse className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {metrics.workflowHealthPercent}%
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div className="bg-emerald-500 h-full w-[99.4%]" />
          </div>
        </div>

        {/* Metric 4: Recovered Executions */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider">
              RECOVERED
            </span>
            <RotateCw className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics.recoveredExecutions}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Failovers resolved
          </span>
        </div>

        {/* Metric 5: Pending Approvals */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider">
              APPROVALS
            </span>
            <ShieldAlert className="h-4 w-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics.pendingApprovals}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Safety reviewed
          </span>
        </div>
      </div>

      {/* Header and New Goal CTA */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Active Automation Fleet
          </h2>
          <p className="text-xs text-slate-500">
            Autonomous workflows operating under continuous verification
          </p>
        </div>

        <button
          onClick={onNewGoalClick}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-100"
        >
          <Plus className="h-4 w-4" />
          <span>Delegate New Goal</span>
        </button>
      </div>

      {/* List */}
      <ActiveAutomationsList
        workflows={workflows}
        onSelectWorkflow={onSelectWorkflow}
        onSimulateWorkflow={onSimulateWorkflow}
        onToggleStatus={onToggleStatus}
        onDeleteWorkflow={onDeleteWorkflow}
        onRunWorkflow={onRunWorkflow}
      />
    </div>
  );
};
