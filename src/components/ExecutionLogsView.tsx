/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Workflow } from '../workflow/types.ts';
import {
  CheckCircle2,
  RotateCw,
  XCircle,
  Play,
  Trash2,
  Search,
  Terminal,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export interface ExecutionLogEntry {
  id: string;
  workflowId: string;
  workflowName: string;
  triggerType: string;
  status: 'SUCCESS' | 'RECOVERED' | 'FAILED';
  durationMs: number;
  timestamp: string;
  details: string;
  recoveryNote?: string;
  logs: string[];
}

interface ExecutionLogsViewProps {
  workflows: Workflow[];
  logs: ExecutionLogEntry[];
  onTriggerTestRun: (workflow: Workflow) => void;
  onClearLogs: () => void;
}

export const ExecutionLogsView: React.FC<ExecutionLogsViewProps> = ({
  workflows,
  logs,
  onTriggerTestRun,
  onClearLogs,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'RECOVERED' | 'FAILED'>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.workflowName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.triggerType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
              Observability & Audit Trail
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Execution Logs & History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry of all autonomous workflow dispatches, verifications, and failovers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          )}

          {workflows.length > 0 && (
            <button
              onClick={() => onTriggerTestRun(workflows[0])}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-100"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Trigger Test Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search execution logs or events..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 self-end sm:self-auto">
          {(['ALL', 'SUCCESS', 'RECOVERED', 'FAILED'] as const).map((st) => (
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

      {/* Logs Table / List */}
      {filteredLogs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-2">
          <Terminal className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No execution logs found.</p>
          <p className="text-xs text-slate-400">
            Trigger a test run or simulate an automation to view real-time execution receipts.
          </p>
          {workflows.length > 0 && (
            <button
              onClick={() => onTriggerTestRun(workflows[0])}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-100"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Simulate Dispatch Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-200">
                      {log.status === 'SUCCESS' && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                      {log.status === 'RECOVERED' && (
                        <RotateCw className="h-4 w-4 text-indigo-600" />
                      )}
                      {log.status === 'FAILED' && (
                        <XCircle className="h-4 w-4 text-rose-600" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {log.workflowName}
                        </span>
                        <span
                          className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : log.status === 'RECOVERED'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        Trigger: {log.triggerType} • Latency: {log.durationMs}ms • {log.timestamp}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="text-xs font-bold font-mono text-indigo-600 hover:text-indigo-800 self-start sm:self-center underline decoration-indigo-200"
                  >
                    {isExpanded ? 'Hide Trace' : 'View Trace'}
                  </button>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span>{log.details}</span>
                  {log.recoveryNote && (
                    <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 ml-2">
                      {log.recoveryNote}
                    </span>
                  )}
                </div>

                {/* Expanded Console Logs Trace */}
                {isExpanded && (
                  <div className="rounded-xl bg-[#0F172A] p-4 text-xs font-mono shadow-inner space-y-1.5">
                    <div className="flex items-center justify-between text-indigo-400 text-[11px] border-b border-slate-800 pb-1.5 mb-2">
                      <span>// Execution Trace Logs • ID: {log.id}</span>
                      <span>Target: {log.workflowId}</span>
                    </div>
                    {log.logs.map((l, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-1.5 ${
                          l.includes('ERROR')
                            ? 'text-rose-400'
                            : l.includes('SUCCESS')
                            ? 'text-emerald-400'
                            : l.includes('CircuitBreaker') || l.includes('Recovered') || l.includes('Resilience')
                            ? 'text-orange-300'
                            : 'text-slate-400'
                        }`}
                      >
                        <Terminal className="h-3 w-3 mt-0.5 shrink-0 opacity-60" />
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
