/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Workflow, GenerationState, SimulationResult } from './workflow/types.ts';
import { INITIAL_MOCK_AUTOMATIONS } from './data/mockAutomations.ts';
import { generateClientWorkflow } from './workflow/clientFallback.ts';
import { TopBar } from './components/TopBar.tsx';
import { GoalInput } from './components/GoalInput.tsx';
import { WorkflowPreview } from './components/WorkflowPreview.tsx';
import { SimulationTimeline } from './components/SimulationTimeline.tsx';
import { EditWorkflowModal } from './components/EditWorkflowModal.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ExecutionLogsView, ExecutionLogEntry } from './components/ExecutionLogsView.tsx';
import { CapabilitiesRegistryModal } from './components/CapabilitiesRegistryModal.tsx';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Zap,
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'aura_workflows_v1';
const LOGS_STORAGE_KEY = 'aura_logs_v1';

const INITIAL_LOGS: ExecutionLogEntry[] = [
  {
    id: 'exec-101',
    workflowId: 'wf-urgent-email-01',
    workflowName: 'Urgent Customer Email Handler',
    triggerType: 'EMAIL_RECEIVED',
    status: 'SUCCESS',
    durationMs: 380,
    timestamp: 'Today, 10:42 AM',
    details: 'Customer payload identified as urgent. Task created in Todoist and notification sent.',
    logs: [
      '[10:42:01] Ingested webhook: Email subject "URGENT: Production API 500 error on checkout"',
      '[10:42:01] Condition check: isUrgent=true, sender=tier1_client (PASS)',
      '[10:42:02] Executed action: CREATE_TASK (Priority: HIGH)',
      '[10:42:02] Verified: Task #9482 verified active in Todoist API',
      '[10:42:02] Sent desktop & mobile push notification',
    ],
  },
  {
    id: 'exec-102',
    workflowId: 'wf-urgent-email-01',
    workflowName: 'Urgent Customer Email Handler',
    triggerType: 'EMAIL_RECEIVED',
    status: 'RECOVERED',
    durationMs: 740,
    timestamp: 'Today, 08:15 AM',
    details: 'Primary task service returned HTTP 503. AURA automatically failed over to backup task provider.',
    recoveryNote: 'CircuitBreaker → Backup Provider',
    logs: [
      '[08:15:00] Ingested webhook: Email subject "Urgent: Payment webhook failure"',
      '[08:15:00] Evaluated semantic intent: Urgent customer issue',
      '[08:15:01] Attempt 1 CREATE_TASK on Primary Provider failed (HTTP 503 Service Unavailable)',
      '[08:15:01] Exponential backoff retry (Attempt 2) failed (HTTP 503)',
      '[08:15:02] Triggering Resilience Policy: Failover to BACKUP_TASK_PROVIDER',
      '[08:15:02] Backup provider task created successfully (Receipt: #BK-8291)',
      '[08:15:02] Outcome verified and notification alert dispatched',
    ],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'automations' | 'logs' | 'capabilities'>('studio');
  const [workflows, setWorkflows] = useState<Workflow[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved workflows from localStorage:', e);
    }
    return INITIAL_MOCK_AUTOMATIONS;
  });

  const [logs, setLogs] = useState<ExecutionLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(LOGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved logs:', e);
    }
    return INITIAL_LOGS;
  });

  const [executionCount, setExecutionCount] = useState<number>(142 + INITIAL_LOGS.length);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [currentGoalText, setCurrentGoalText] = useState('');
  const [generationState, setGenerationState] = useState<GenerationState>({
    stage: 'IDLE',
    message: 'Ready for delegation',
  });

  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Save to localStorage whenever workflows change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(workflows));
    } catch (e) {
      console.error('Failed to persist workflows:', e);
    }
  }, [workflows]);

  // Save logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to persist logs:', e);
    }
  }, [logs]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleGenerate = async (goalText: string) => {
    const cleanGoal = goalText.trim();
    if (!cleanGoal) return;

    // Stage 1: Understanding
    setGenerationState({
      stage: 'UNDERSTANDING',
      message: 'AURA is understanding your goal and intent...',
    });

    try {
      // Stage 2: Planning
      await new Promise((r) => setTimeout(r, 400));
      setGenerationState({
        stage: 'PLANNING',
        message: 'AURA is designing the safest execution plan...',
      });

      let wf: Workflow | null = null;

      try {
        const response = await fetch('/api/generate-workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: cleanGoal }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.workflow) {
            wf = data.workflow;
          }
        }
      } catch (netErr) {
        console.warn('Backend API endpoint fallback engaged:', netErr);
      }

      // Stage 3: Validating
      setGenerationState({
        stage: 'VALIDATING',
        message: 'Checking capabilities, permissions, and guardrails...',
      });
      await new Promise((r) => setTimeout(r, 300));

      if (!wf) {
        // Direct resilient fallback
        wf = generateClientWorkflow(cleanGoal);
      }

      setCurrentWorkflow(wf);

      if (wf.confidenceLevel === 'LOW') {
        setGenerationState({
          stage: 'CLARIFICATION',
          message: 'AURA requires more information before proceeding safely.',
          clarificationQuestion: wf.clarificationNeeded,
        });
      } else {
        setGenerationState({
          stage: 'READY',
          message: 'Workflow plan ready for review.',
        });
      }
    } catch (err: any) {
      console.error('Workflow generation failed:', err);
      setGenerationState({
        stage: 'ERROR',
        message: 'Generation failed safely.',
        error: err?.message || 'Could not compile workflow. Please try rephrasing your goal.',
      });
    }
  };

  const handleActivateWorkflow = (wf: Workflow) => {
    const updated: Workflow = {
      ...wf,
      status: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    };

    setWorkflows((prev) => {
      const idx = prev.findIndex((w) => w.id === updated.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });

    setCurrentWorkflow(updated);
    showToast(`Workflow "${updated.name}" is now active in your fleet.`);
  };

  const handleToggleStatus = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const nextStatus = w.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
          showToast(`Workflow "${w.name}" set to ${nextStatus}.`, 'info');
          return { ...w, status: nextStatus };
        }
        return w;
      })
    );

    if (currentWorkflow && currentWorkflow.id === id) {
      setCurrentWorkflow((prev) =>
        prev ? { ...prev, status: prev.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : null
      );
    }
  };

  const handleDeleteWorkflow = (id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    if (currentWorkflow && currentWorkflow.id === id) {
      setCurrentWorkflow(null);
    }
    showToast('Automation removed from fleet.', 'info');
  };

  const handleRunWorkflow = (workflow: Workflow) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const isRecovered = workflow.recovery.enabled && Math.random() > 0.6;
    const duration = isRecovered ? Math.floor(Math.random() * 300 + 400) : Math.floor(Math.random() * 200 + 150);

    const newLog: ExecutionLogEntry = {
      id: `exec-${Date.now().toString().slice(-6)}`,
      workflowId: workflow.id,
      workflowName: workflow.name,
      triggerType: workflow.trigger.type,
      status: isRecovered ? 'RECOVERED' : 'SUCCESS',
      durationMs: duration,
      timestamp: `Today, ${timestamp}`,
      details: isRecovered
        ? `Primary provider experienced latency. Self-healing resilience failover engaged to ${workflow.recovery.fallback || 'backup target'}.`
        : `Autonomous execution completed. Verified: ${workflow.verification.description}.`,
      recoveryNote: isRecovered ? 'Self-Healing Failover' : undefined,
      logs: [
        `[${timestamp}] Ingested event trigger: ${workflow.trigger.description}`,
        `[${timestamp}] Evaluated guardrails: ${workflow.conditions?.length || 0} conditions passed`,
        ...workflow.actions.map((a) => `[${timestamp}] Executed action: ${a.description} (Priority: ${a.priority || 'MEDIUM'})`),
        ...(isRecovered ? [`[${timestamp}] Resilience policy engaged: Executed fallback ${workflow.recovery.fallback || 'provider'}`] : []),
        `[${timestamp}] Confirmed verification: ${workflow.verification.description}`,
      ],
    };

    setLogs((prev) => [newLog, ...prev]);
    setExecutionCount((c) => c + 1);
    showToast(`Dispatched live test for "${workflow.name}". Outcome: ${newLog.status}`, 'success');
  };

  const handleNewGoalClick = () => {
    setActiveTab('studio');
    setCurrentWorkflow(null);
    setCurrentGoalText('');
    setGenerationState({ stage: 'IDLE', message: 'Ready for delegation' });
  };

  const isCurrentActive = Boolean(
    currentWorkflow &&
      workflows.some((w) => w.id === currentWorkflow.id && w.status === 'ACTIVE')
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewGoalClick={handleNewGoalClick}
        activeAutomationsCount={workflows.filter((w) => w.status === 'ACTIVE').length}
        logsCount={logs.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm shadow-xl animate-in fade-in slide-in-from-bottom-5">
            {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
            {toast.type === 'info' && <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />}
            <span className="font-semibold text-slate-800">{toast.message}</span>
          </div>
        )}

        {/* Tab 1: Studio */}
        {activeTab === 'studio' && (
          <div className="space-y-8">
            {!currentWorkflow ? (
              <div className="space-y-12">
                <GoalInput
                  onGenerate={handleGenerate}
                  generationState={generationState}
                  currentGoalText={currentGoalText}
                  setCurrentGoalText={setCurrentGoalText}
                />

                {/* Active Automations Summary Section on Home */}
                <div className="max-w-4xl mx-auto space-y-4 pt-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-indigo-600" />
                      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 font-mono">
                        Active Fleet ({workflows.filter((w) => w.status === 'ACTIVE').length} Running)
                      </h2>
                    </div>

                    <button
                      onClick={() => setActiveTab('automations')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      View All Automations →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {workflows.slice(0, 2).map((wf) => (
                      <div
                        key={wf.id}
                        onClick={() => {
                          setCurrentWorkflow(wf);
                        }}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {wf.status}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {wf.trigger.type}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">
                          {wf.name}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          "{wf.goal}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <button
                  onClick={() => setCurrentWorkflow(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>← Delegate Another Goal</span>
                </button>

                <WorkflowPreview
                  workflow={currentWorkflow}
                  onSimulateClick={() => setIsSimulationOpen(true)}
                  onEditClick={() => setIsEditModalOpen(true)}
                  onActivateClick={handleActivateWorkflow}
                  isActivated={isCurrentActive}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Automations Dashboard Fleet */}
        {activeTab === 'automations' && (
          <DashboardView
            workflows={workflows}
            onSelectWorkflow={(wf) => {
              setCurrentWorkflow(wf);
              setActiveTab('studio');
            }}
            onSimulateWorkflow={(wf) => {
              setCurrentWorkflow(wf);
              setIsSimulationOpen(true);
            }}
            onToggleStatus={handleToggleStatus}
            onDeleteWorkflow={handleDeleteWorkflow}
            onNewGoalClick={handleNewGoalClick}
            onRunWorkflow={handleRunWorkflow}
            executionCount={executionCount}
          />
        )}

        {/* Tab 3: Execution Logs */}
        {activeTab === 'logs' && (
          <ExecutionLogsView
            workflows={workflows}
            logs={logs}
            onTriggerTestRun={handleRunWorkflow}
            onClearLogs={() => {
              setLogs([]);
              showToast('Execution history cleared.', 'info');
            }}
          />
        )}

        {/* Tab 4: Capability Registry */}
        {activeTab === 'capabilities' && <CapabilitiesRegistryModal />}
      </main>

      {/* Simulation Modal Runner */}
      {isSimulationOpen && currentWorkflow && (
        <SimulationTimeline
          workflow={currentWorkflow}
          onClose={() => setIsSimulationOpen(false)}
          onSimulationComplete={(result: SimulationResult) => {
            if (result.status === 'SUCCESS' || result.status === 'RECOVERED') {
              showToast(`Simulation passed with status: ${result.status}`);
            }
          }}
        />
      )}

      {/* Conversational "Edit with AURA" Modal */}
      {isEditModalOpen && currentWorkflow && (
        <EditWorkflowModal
          workflow={currentWorkflow}
          onClose={() => setIsEditModalOpen(false)}
          onWorkflowUpdated={(updatedWf) => {
            setCurrentWorkflow(updatedWf);
            setWorkflows((prev) =>
              prev.map((w) => (w.id === updatedWf.id ? updatedWf : w))
            );
            showToast('Workflow modified and re-verified by AURA.');
          }}
        />
      )}
    </div>
  );
}
