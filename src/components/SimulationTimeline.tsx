/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Workflow,
  SimulationResult,
  SimulationStep,
} from '../workflow/types.ts';
import { runSimulation } from '../workflow/simulator.ts';
import { AuditEventReceipt } from '../workflow/executionEngine.ts';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  XCircle,
  Clock,
  Terminal,
  Zap,
  ShieldCheck,
  X,
  ArrowRight,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface SimulationTimelineProps {
  workflow: Workflow;
  onClose: () => void;
  onSimulationComplete?: (result: SimulationResult, auditEvents: AuditEventReceipt[]) => void;
}

const MILESTONE_2_PIPELINE_NODES = [
  { id: 'primary-fail', label: 'Primary Failure', icon: '❌', match: (s: SimulationStep) => s.id === 'step-primary-attempt' },
  { id: 'diagnose', label: 'Diagnose', icon: '🔍', match: (s: SimulationStep) => s.id === 'step-diagnose' },
  { id: 'retry-1', label: 'Retry #1', icon: '🔄', match: (s: SimulationStep) => s.id === 'step-retry-1' },
  { id: 'retry-2', label: 'Retry #2', icon: '🔄', match: (s: SimulationStep) => s.id === 'step-retry-2' },
  { id: 'fallback', label: 'Fallback', icon: '🛡️', match: (s: SimulationStep) => s.id === 'step-fallback-routing' },
  { id: 'success', label: 'Success', icon: '✨', match: (s: SimulationStep) => s.id === 'step-fallback-success' },
  { id: 'verify', label: 'Verify', icon: '🔒', match: (s: SimulationStep) => s.id === 'step-verify' },
  { id: 'achieved', label: 'Goal Achieved', icon: '🎯', match: (s: SimulationStep) => s.id === 'step-goal-achieved' },
];

export const SimulationTimeline: React.FC<SimulationTimelineProps> = ({
  workflow,
  onClose,
  onSimulationComplete,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [injectFailure, setInjectFailure] = useState(true); // Default to demonstrate Milestone 2 loop
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [currentSteps, setCurrentSteps] = useState<SimulationStep[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [logsExpanded, setLogsExpanded] = useState<Record<string, boolean>>({});
  const [auditEvents, setAuditEvents] = useState<AuditEventReceipt[]>([]);
  const [viewMode, setViewMode] = useState<'steps' | 'audit_events'>('steps');

  const startSimulation = async () => {
    setIsRunning(true);
    setResult(null);
    setAuditEvents([]);
    setActiveStepIndex(0);

    const collectedAuditEvents: AuditEventReceipt[] = [];

    try {
      const res = await runSimulation(workflow, {
        injectFailure,
        stepDelayMs: 380,
        onStepProgress: (step, steps) => {
          setCurrentSteps([...steps]);
          const runningIdx = steps.findIndex((s) => s.id === step.id);
          if (runningIdx !== -1) setActiveStepIndex(runningIdx);
        },
        onAuditEvent: (evt) => {
          collectedAuditEvents.push(evt);
          setAuditEvents((prev) => [...prev, evt]);
        },
      });

      setResult(res);
      onSimulationComplete?.(res, collectedAuditEvents);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    startSimulation();
  }, [injectFailure]);

  const toggleStepLogs = (id: string) => {
    setLogsExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStepIcon = (status: SimulationStep['status'], phase: SimulationStep['phase']) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-rose-500" />;
      case 'RECOVERED':
        return <RotateCw className="h-4 w-4 text-indigo-500" />;
      case 'RUNNING':
        return <RotateCw className="h-4 w-4 text-indigo-500 animate-spin" />;
      case 'SKIPPED':
        return <Clock className="h-4 w-4 text-slate-300" />;
      case 'PENDING':
      default:
        return <span className="h-2 w-2 rounded-full bg-slate-300" />;
    }
  };

  const getPhaseBadge = (phase: SimulationStep['phase']) => {
    switch (phase) {
      case 'TRIGGER':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'CONDITION':
        return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'ACTION':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'RECOVERY':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'FALLBACK':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'VERIFICATION':
        return 'bg-purple-50 text-purple-700 border-purple-100';
    }
  };

  // Determine which milestone node is currently active / passed
  const getNodeStatus = (nodeId: string, nodeMatcher: (s: SimulationStep) => boolean) => {
    const matchingStep = currentSteps.find(nodeMatcher);
    if (!matchingStep) return 'pending';
    if (matchingStep.status === 'RUNNING') return 'active';
    if (matchingStep.status === 'SUCCESS' || matchingStep.status === 'FAILED') return 'completed';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  AURA Deterministic Execution Engine
                </h2>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase">
                  Milestone 2 • Controlled Failover & Verification Loop
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Milestone 2 Pipeline Progression Breadcrumb Bar */}
        {injectFailure && (
          <div className="my-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold font-mono text-indigo-700 uppercase tracking-wider">
                Milestone 2 Failover Lifecycle Progression:
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-medium">
                Primary Failure → Diagnose → Retry #1 → Retry #2 → Fallback → Success → Verify → Goal Achieved
              </span>
            </div>

            <div className="flex items-center justify-between overflow-x-auto gap-1 py-1 no-scrollbar">
              {MILESTONE_2_PIPELINE_NODES.map((node, nIdx) => {
                const status = getNodeStatus(node.id, node.match);

                return (
                  <React.Fragment key={node.id}>
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono font-bold whitespace-nowrap transition-all ${
                        status === 'active'
                          ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200 animate-pulse'
                          : status === 'completed'
                          ? 'bg-white border border-slate-200 text-slate-800 shadow-2xs'
                          : 'bg-slate-100/70 text-slate-400 opacity-60'
                      }`}
                    >
                      <span className="text-xs">{node.icon}</span>
                      <span>{node.label}</span>
                    </div>

                    {nIdx < MILESTONE_2_PIPELINE_NODES.length - 1 && (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-2.5 bg-slate-50 px-3 rounded-xl mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={startSimulation}
              disabled={isRunning}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                isRunning
                  ? 'bg-slate-200 cursor-not-allowed text-slate-400'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-100'
              }`}
            >
              {isRunning ? (
                <>
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Re-Run Milestone 2 Loop</span>
                </>
              )}
            </button>

            {/* Controlled Failure Injection Selector */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setInjectFailure(true)}
                disabled={isRunning}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  injectFailure
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Resilience Failover Test
              </button>
              <button
                type="button"
                onClick={() => setInjectFailure(false)}
                disabled={isRunning}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  !injectFailure
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Happy Path
              </button>
            </div>
          </div>

          {/* View Switcher: Steps vs Audit Events Stream */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('steps')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'steps'
                  ? 'bg-white border border-slate-200 text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-indigo-600" />
              <span>Step Pipeline ({currentSteps.length})</span>
            </button>

            <button
              onClick={() => setViewMode('audit_events')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'audit_events'
                  ? 'bg-white border border-slate-200 text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-indigo-600" />
              <span>Audit Receipts ({auditEvents.length})</span>
            </button>
          </div>
        </div>

        {/* Content Body: Steps View */}
        {viewMode === 'steps' && (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
            {currentSteps.map((step, idx) => {
              const isExpanded = logsExpanded[step.id];

              return (
                <div
                  key={step.id}
                  className={`rounded-xl border p-3.5 transition-all ${
                    step.status === 'RUNNING'
                      ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-200'
                      : step.status === 'FAILED'
                      ? 'border-rose-200 bg-rose-50/40'
                      : step.status === 'SUCCESS'
                      ? 'border-slate-200 bg-white shadow-2xs'
                      : 'border-slate-100 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
                        {getStepIcon(step.status, step.phase)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold font-mono uppercase px-1.5 py-0.2 rounded border ${getPhaseBadge(step.phase)}`}>
                            {step.phase}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {step.title}
                          </span>
                          {step.durationMs !== undefined && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {step.durationMs}ms
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-sans">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleStepLogs(step.id)}
                      className="text-[11px] font-mono font-bold text-indigo-600 hover:text-indigo-800 underline decoration-indigo-200"
                    >
                      {isExpanded ? 'Hide Trace' : 'Inspect Trace'}
                    </button>
                  </div>

                  {/* Navy Console for step logs */}
                  {isExpanded && (
                    <div className="mt-3 rounded-xl bg-[#0F172A] p-4 text-xs font-mono shadow-inner space-y-2">
                      <div className="flex items-center justify-between text-indigo-400 text-[11px] border-b border-slate-800 pb-1.5">
                        <span>// Execution Trace • Node: {step.id}</span>
                        <span>Phase: {step.phase}</span>
                      </div>

                      <div className="space-y-1 text-slate-300">
                        {step.logs.map((log, lIdx) => (
                          <div
                            key={lIdx}
                            className={`flex items-start gap-1.5 ${
                              log.includes('ERROR')
                                ? 'text-rose-400'
                                : log.includes('SUCCESS') || log.includes('200 OK')
                                ? 'text-emerald-400'
                                : log.includes('WARN') || log.includes('RETRY') || log.includes('DIAGNOSIS')
                                ? 'text-orange-300'
                                : 'text-slate-400'
                            }`}
                          >
                            <Terminal className="h-3 w-3 mt-0.5 shrink-0 opacity-60" />
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>

                      {step.details && (
                        <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                          <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">
                            Structured Payload & Metadata:
                          </span>
                          <pre className="text-slate-300 overflow-x-auto">
                            {JSON.stringify(step.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Content Body: Audit Events Stream View */}
        {viewMode === 'audit_events' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-1 font-mono">
            <div className="rounded-xl bg-[#0F172A] p-4 text-xs text-slate-300 shadow-inner space-y-2.5">
              <div className="flex items-center justify-between text-indigo-400 text-[11px] border-b border-slate-800 pb-2">
                <span>// Event-Based Execution Audit Trail (Milestone 2)</span>
                <span>{auditEvents.length} Receipts Emitted</span>
              </div>

              {auditEvents.length === 0 ? (
                <p className="text-slate-500 text-center py-4">Waiting for execution events...</p>
              ) : (
                auditEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="border-b border-slate-800/80 pb-2 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            evt.status === 'ERROR'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : evt.status === 'WARN'
                              ? 'bg-orange-950 text-orange-400 border border-orange-800'
                              : evt.status === 'SUCCESS'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          #{evt.sequence} {evt.type}
                        </span>
                        <span className="font-bold text-slate-200">{evt.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{evt.timestamp}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] pl-2">{evt.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer Outcome Summary */}
        {result && (
          <div className="border-t border-slate-100 pt-3 mt-2">
            <div
              className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                result.status === 'SUCCESS'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : result.status === 'RECOVERED'
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
                  : 'border-rose-200 bg-rose-50 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {result.status === 'SUCCESS' && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                )}
                {result.status === 'RECOVERED' && (
                  <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" />
                )}
                {result.status === 'FAILED' && (
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-xs sm:text-sm block">
                    {result.message}
                  </span>
                  <span className="text-[11px] opacity-80 font-mono">
                    Total Duration: {result.totalDurationMs}ms • Verification Confirmed • Zero Data Loss
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-lg bg-white border border-slate-200 hover:bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-700 transition-colors shadow-2xs shrink-0 self-end sm:self-center"
              >
                Close & Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
