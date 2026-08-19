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
  Sparkles,
  HelpCircle,
  MessageSquare,
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
  const [explainingLogId, setExplainingLogId] = useState<string | null>(null);
  const [logExplanations, setLogExplanations] = useState<Record<string, string>>({});
  const [loadingExplainer, setLoadingExplainer] = useState(false);

  const handleExplainExecution = async (log: ExecutionLogEntry) => {
    if (logExplanations[log.id]) {
      setExplainingLogId(explainingLogId === log.id ? null : log.id);
      return;
    }

    setLoadingExplainer(true);
    setExplainingLogId(log.id);

    try {
      // Synthesize structured audit events from log traces
      const auditEvents = log.logs.map((l, idx) => ({
        id: `ev-${idx}`,
        executionId: log.id,
        workflowId: log.workflowId,
        sequence: idx + 1,
        timestamp: new Date().toISOString(),
        eventType: l.includes('fail') || l.includes('503') || l.includes('FAIL')
          ? 'PRIMARY_ACTION_FAILED'
          : l.includes('Recover') || l.includes('Backup')
          ? 'FALLBACK_EXECUTED'
          : l.includes('Retry')
          ? 'RETRY_1_STARTED'
          : l.includes('Verified')
          ? 'OUTCOME_VERIFICATION_CONFIRMED'
          : 'ACTION_STARTED',
        type: 'ACTION_STARTED',
        title: l.split(':')[0] || 'Step',
        message: l,
        status: l.includes('fail') || l.includes('503') ? 'ERROR' : l.includes('Verified') ? 'SUCCESS' : 'INFO',
      }));

      const res = await fetch('/api/explain-execution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'What happened during this execution and why?',
          auditEvents,
          workflowName: log.workflowName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.summary) {
          setLogExplanations((prev) => ({ ...prev, [log.id]: data.summary }));
        }
      }
    } catch (err) {
      console.warn('Failed to generate execution explanation:', err);
    } finally {
      setLoadingExplainer(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.workflowName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.triggerType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
              Observability & Audit Trail
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Execution Logs & Telemetry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time audit receipts of all autonomous dispatches, verifications, and failover self-healing paths
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search execution traces, triggers, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-600">Status:</span>
          {(['ALL', 'SUCCESS', 'RECOVERED', 'FAILED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Log List */}
      {filteredLogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <Terminal className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No execution logs match</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Trigger a workflow from the Studio or click "Trigger Test Event" to produce live receipts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const isExplaining = explainingLogId === log.id;
            const explanation = logExplanations[log.id];

            return (
              <div
                key={log.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-200">
                      {log.status === 'SUCCESS' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      {log.status === 'RECOVERED' && <RotateCw className="h-4 w-4 text-indigo-600" />}
                      {log.status === 'FAILED' && <XCircle className="h-4 w-4 text-rose-600" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{log.workflowName}</span>
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

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => handleExplainExecution(log)}
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors"
                    >
                      <Sparkles className="h-3 w-3 text-indigo-500" />
                      <span>{isExplaining && explanation ? 'Hide AI Explanation' : 'Explain Execution'}</span>
                    </button>

                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="text-xs font-bold font-mono text-slate-600 hover:text-slate-900 underline decoration-slate-300"
                    >
                      {isExpanded ? 'Hide Trace' : 'View Trace'}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span>{log.details}</span>
                  {log.recoveryNote && (
                    <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 ml-2">
                      {log.recoveryNote}
                    </span>
                  )}
                </div>

                {/* Natural Language Explanation Box */}
                {isExplaining && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-1.5 animate-fade-in">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      <span>AURA Audit Trail Explanation (Evidence-Based)</span>
                    </div>
                    {loadingExplainer && !explanation ? (
                      <p className="text-xs text-indigo-700 animate-pulse">AURA is synthesizing audit receipts...</p>
                    ) : (
                      <p className="text-xs text-slate-700 leading-relaxed">{explanation}</p>
                    )}
                  </div>
                )}

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
                          l.includes('ERROR') || l.includes('503') || l.includes('failed')
                            ? 'text-rose-400'
                            : l.includes('SUCCESS') || l.includes('verified') || l.includes('Verified')
                            ? 'text-emerald-400'
                            : l.includes('CircuitBreaker') || l.includes('Recovered') || l.includes('Resilience') || l.includes('Fallback')
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
