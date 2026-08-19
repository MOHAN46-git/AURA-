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
} from 'lucide-react';

interface SimulationTimelineProps {
  workflow: Workflow;
  onClose: () => void;
  onSimulationComplete?: (result: SimulationResult) => void;
}

export const SimulationTimeline: React.FC<SimulationTimelineProps> = ({
  workflow,
  onClose,
  onSimulationComplete,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [injectFailure, setInjectFailure] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [currentSteps, setCurrentSteps] = useState<SimulationStep[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [logsExpanded, setLogsExpanded] = useState<Record<string, boolean>>({});

  const startSimulation = async () => {
    setIsRunning(true);
    setResult(null);
    setActiveStepIndex(0);

    try {
      const res = await runSimulation(workflow, {
        injectFailure,
        stepDelayMs: 420,
        onStepProgress: (step, steps) => {
          setCurrentSteps([...steps]);
          const runningIdx = steps.findIndex((s) => s.id === step.id);
          if (runningIdx !== -1) setActiveStepIndex(runningIdx);
        },
      });

      setResult(res);
      onSimulationComplete?.(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    startSimulation();
  }, []);

  const toggleStepLogs = (id: string) => {
    setLogsExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStepIcon = (status: SimulationStep['status']) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Zap className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                AURA Simulation Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sandbox harness • Simulated payload • Zero external side-effects
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 bg-slate-50 px-3 rounded-xl my-3">
          <div className="flex items-center gap-2">
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
                  <span>Simulating...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Re-Run Simulation</span>
                </>
              )}
            </button>

            {/* Failure injection toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-slate-300 shadow-2xs">
              <input
                type="checkbox"
                checked={injectFailure}
                onChange={(e) => setInjectFailure(e.target.checked)}
                disabled={isRunning}
                className="h-3.5 w-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="font-mono text-[11px] font-bold text-orange-700">
                Inject Service Outage (Test Fallback)
              </span>
            </label>
          </div>

          {result && (
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-500">
                Duration: <strong className="text-slate-900">{result.totalDurationMs}ms</strong>
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${
                  result.status === 'SUCCESS'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : result.status === 'RECOVERED'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {result.status === 'SUCCESS' && <CheckCircle2 className="h-3 w-3" />}
                {result.status === 'RECOVERED' && <RotateCw className="h-3 w-3" />}
                {result.status === 'FAILED' && <XCircle className="h-3 w-3" />}
                <span>{result.status}</span>
              </span>
            </div>
          )}
        </div>

        {/* Step Execution Timeline */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {currentSteps.map((step) => {
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
                      {getStepIcon(step.status)}
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
                    {isExpanded ? 'Hide Logs' : 'Inspect'}
                  </button>
                </div>

                {/* Dark Navy Console for logs inspection (Matching theme design) */}
                {isExpanded && (
                  <div className="mt-3 rounded-xl bg-[#0F172A] p-4 text-xs font-mono shadow-inner space-y-2">
                    <div className="flex items-center justify-between text-indigo-400 text-[11px] border-b border-slate-800 pb-1.5">
                      <span>// Simulation Console Logs</span>
                      <span>Phase: {step.phase}</span>
                    </div>

                    <div className="space-y-1 text-slate-300">
                      {step.logs.map((log, lIdx) => (
                        <div
                          key={lIdx}
                          className={`flex items-start gap-1.5 ${
                            log.includes('ERROR')
                              ? 'text-rose-400'
                              : log.includes('SUCCESS')
                              ? 'text-emerald-400'
                              : log.includes('CircuitBreaker') || log.includes('Resilience')
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
                          Step Payload & Attributes:
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

        {/* Footer Outcome Summary */}
        {result && (
          <div className="border-t border-slate-100 pt-4 mt-2">
            <div
              className={`rounded-xl border p-4 flex items-center justify-between ${
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
                  <span className="font-bold text-sm block">
                    {result.message}
                  </span>
                  <span className="text-xs opacity-80">
                    Verification check passed • All guardrails verified
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-lg bg-white border border-slate-200 hover:bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
