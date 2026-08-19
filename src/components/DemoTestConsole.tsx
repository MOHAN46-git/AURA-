/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ALL_AURA_TESTS,
  runAllAuraTests,
} from '../../tests/runAllTests.ts';
import { TestResultItem, TestSuiteSummary } from '../../tests/helpers/testHarness.ts';
import { executeWorkflowEngine, EngineExecutionResult } from '../workflow/executionEngine.ts';
import {
  GOLDEN_HACKATHON_WORKFLOW,
  NORMAL_EXECUTION_WORKFLOW,
  HIGH_RISK_WORKFLOW,
  UNSUPPORTED_CAPABILITY_WORKFLOW,
} from '../../tests/fixtures/workflows.ts';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Terminal,
  Activity,
  Check,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const DemoTestConsole: React.FC = () => {
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [testResults, setTestResults] = useState<TestResultItem[]>([]);
  const [summary, setSummary] = useState<TestSuiteSummary | null>(null);
  const [interactiveRunning, setInteractiveRunning] = useState<string | null>(null);
  const [interactiveResult, setInteractiveResult] = useState<EngineExecutionResult | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  const handleRunAllTests = async () => {
    setIsRunningAll(true);
    setTestResults([]);
    setSummary(null);
    setInteractiveResult(null);

    try {
      const res = await runAllAuraTests((item) => {
        setTestResults((prev) => [...prev, item]);
      });
      setSummary(res);
    } catch (err) {
      console.error('Test execution failed:', err);
    } finally {
      setIsRunningAll(false);
    }
  };

  const runScenario = async (
    scenarioId: string,
    workflow: any,
    options: any
  ) => {
    setInteractiveRunning(scenarioId);
    setInteractiveResult(null);

    try {
      const res = await executeWorkflowEngine(workflow, {
        ...options,
        stepDelayMs: 250, // Smooth visual progression
      });
      setInteractiveResult(res);
    } catch (err) {
      console.error('Scenario error:', err);
    } finally {
      setInteractiveRunning(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold">
                <Terminal className="h-4 w-4" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                AURA Automated Test Harness & Verification Suite
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Comprehensive unit & integration test runner verifying workflow schemas, capability registries, failure classifications, exponential retries, autonomous fallback routing, and outcome verifications.
            </p>
          </div>

          <button
            onClick={handleRunAllTests}
            disabled={isRunningAll || Boolean(interactiveRunning)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-sm shrink-0 ${
              isRunningAll
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-100 active:scale-98'
            }`}
          >
            {isRunningAll ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin" />
                <span>Running Test Suite...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Run All 11 Automated Tests</span>
              </>
            )}
          </button>
        </div>

        {/* Quality Gates Summary Badge Bar */}
        {summary && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                summary.failed === 0
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {summary.failed === 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )}
                <span>
                  {summary.passed} / {summary.total} Tests Passed ({summary.durationMs}ms)
                </span>
              </div>

              <span className="text-[11px] font-mono text-slate-500">
                Quality Gate: {summary.failed === 0 ? 'MILESTONE-2 READY' : 'FAILURES DETECTED'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span>Real Module Execution • Zero Mock Text</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Scenario Buttons Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-indigo-600" />
          <span>Interactive Milestone 2 Test Scenarios</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {/* Scenario 1: Golden Hackathon Path */}
          <button
            onClick={() =>
              runScenario('golden-recovery', GOLDEN_HACKATHON_WORKFLOW, {
                primaryTaskServiceFailure: true,
                retryCount: 2,
                fallbackAvailable: true,
              })
            }
            disabled={Boolean(interactiveRunning) || isRunningAll}
            className="flex flex-col text-left p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-400 transition-all group"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <span>⭐ Golden Hackathon Test</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-100">
                Primary Outage → Failover
              </span>
            </div>
            <p className="text-[11px] text-slate-600 line-clamp-2">
              Primary Failure (503) → Diagnose → Retry 1 → Retry 2 → Backup Task Provider → Verify → Goal Achieved.
            </p>
          </button>

          {/* Scenario 2: Normal Path */}
          <button
            onClick={() =>
              runScenario('normal-path', NORMAL_EXECUTION_WORKFLOW, {
                primaryTaskServiceFailure: false,
              })
            }
            disabled={Boolean(interactiveRunning) || isRunningAll}
            className="flex flex-col text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-xs font-bold text-slate-800">
                Normal Execution Path
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                Direct
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Trigger accepted → semantic condition evaluated → action dispatch → verify → goal achieved.
            </p>
          </button>

          {/* Scenario 3: No Fallback Safe Stop */}
          <button
            onClick={() =>
              runScenario('no-fallback', GOLDEN_HACKATHON_WORKFLOW, {
                primaryTaskServiceFailure: true,
                retryCount: 2,
                fallbackAvailable: false,
              })
            }
            disabled={Boolean(interactiveRunning) || isRunningAll}
            className="flex flex-col text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-xs font-bold text-slate-800">
                Missing Fallback Safe Stop
              </span>
              <span className="text-[10px] font-mono text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                Safe Halt
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Primary failure → retries exhaust → no approved fallback → execution safely blocked without false success.
            </p>
          </button>

          {/* Scenario 4: Verification Failure */}
          <button
            onClick={() =>
              runScenario('verification-failure', NORMAL_EXECUTION_WORKFLOW, {
                primaryTaskServiceFailure: false,
                forceVerificationFailure: true,
              })
            }
            disabled={Boolean(interactiveRunning) || isRunningAll}
            className="flex flex-col text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-xs font-bold text-slate-800">
                Outcome Verification Failure
              </span>
              <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                Separation
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Action returns 200 OK, but target store check fails. AURA cleanly reports OUTCOME_UNVERIFIED.
            </p>
          </button>

          {/* Scenario 5: High-Risk Approval */}
          <button
            onClick={() =>
              runScenario('high-risk-approval', HIGH_RISK_WORKFLOW, {})
            }
            disabled={Boolean(interactiveRunning) || isRunningAll}
            className="flex flex-col text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-xs font-bold text-slate-800">
                High-Risk Human Approval
              </span>
              <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                Gatekeeper
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Confidential mass broadcast pauses before action dispatch with WAITING_FOR_APPROVAL.
            </p>
          </button>

          {/* Scenario 6: Unsupported Capability */}
          <button
            onClick={() =>
              runScenario('unsupported-cap', UNSUPPORTED_CAPABILITY_WORKFLOW, {})
            }
            disabled={Boolean(interactiveRunning) || isRunningAll}
            className="flex flex-col text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-xs font-bold text-slate-800">
                Unsupported Capability
              </span>
              <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                Rejected
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Unauthorized action (TRANSFER_MONEY) rejected at pre-flight boundary with VALIDATION_FAILED.
            </p>
          </button>
        </div>
      </div>

      {/* Interactive Scenario Live Output Console */}
      {interactiveResult && (
        <div className="rounded-2xl border border-slate-200 bg-[#0F172A] p-5 text-slate-300 shadow-xl space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase">
                Scenario Live Execution Trail • {interactiveResult.executionId}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                interactiveResult.goalAchieved
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : interactiveResult.executionStatus === 'WAITING_FOR_APPROVAL'
                  ? 'bg-purple-950 text-purple-400 border border-purple-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}
            >
              STATUS: {interactiveResult.executionStatus}
            </span>
          </div>

          <div className="space-y-1.5 text-xs max-h-64 overflow-y-auto pr-1">
            {interactiveResult.auditEvents.map((evt) => (
              <div key={evt.id} className="flex items-start gap-2 text-slate-300">
                <span className="text-[10px] text-slate-500 shrink-0">
                  [{evt.timestamp.split('T')[1]?.slice(0, 8) || evt.timestamp}]
                </span>
                <span
                  className={`text-[10px] font-bold shrink-0 ${
                    evt.status === 'ERROR'
                      ? 'text-rose-400'
                      : evt.status === 'WARN'
                      ? 'text-orange-400'
                      : evt.status === 'SUCCESS'
                      ? 'text-emerald-400'
                      : 'text-indigo-400'
                  }`}
                >
                  [{evt.eventType}]
                </span>
                <span className="text-slate-300">{evt.message}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] flex items-center justify-between text-slate-400">
            <span>Duration: {interactiveResult.totalDurationMs}ms</span>
            <span>Retries: {interactiveResult.retriesAttempted} | Fallback: {interactiveResult.fallbackExecuted ? 'Yes' : 'No'} | Verified: {interactiveResult.verificationPassed ? 'Yes' : 'No'}</span>
          </div>
        </div>
      )}

      {/* Automated Tests List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-indigo-600" />
            <span>Complete Test Suite ({ALL_AURA_TESTS.length} Specifications)</span>
          </h3>

          <span className="text-[11px] font-mono text-slate-400">
            Automated Lifecycle Validation
          </span>
        </div>

        <div className="space-y-2">
          {ALL_AURA_TESTS.map((test, idx) => {
            const result = testResults.find((r) => r.id === test.id);
            const isExpanded = expandedTest === test.id;

            return (
              <div
                key={test.id}
                className={`rounded-xl border p-3 transition-all ${
                  result
                    ? result.passed
                      ? 'border-slate-200 bg-slate-50/50'
                      : 'border-rose-200 bg-rose-50/30'
                    : 'border-slate-100 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 shadow-2xs">
                      {result ? (
                        result.passed ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        )
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">
                          #{idx + 1}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold font-mono uppercase px-1.5 py-0.2 rounded border ${
                            test.category === 'golden'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : test.category === 'integration'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {test.category}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {test.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {result && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {result.durationMs}ms
                      </span>
                    )}

                    {result?.error && (
                      <button
                        onClick={() => setExpandedTest(isExpanded ? null : test.id)}
                        className="text-xs text-rose-600 font-bold hover:underline"
                      >
                        {isExpanded ? 'Hide' : 'Details'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Error trace expansion */}
                {isExpanded && result?.error && (
                  <div className="mt-2.5 rounded-lg bg-[#0F172A] p-3 text-xs font-mono text-rose-400">
                    <p>{result.error}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
