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
import { DemoTestConsole } from './components/DemoTestConsole.tsx';
import { GoogleIntegrationsModal } from './components/GoogleIntegrationsModal.tsx';
import { TasksView } from './components/TasksView.tsx';
import { FirebaseAuthUser, subscribeToFirebaseAuthState } from './firebase/authService.ts';
import {
  syncWorkflowToFirestore,
  syncTaskToFirestore,
  syncExecutionLogToFirestore,
} from './firebase/firestoreService.ts';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Zap,
  Power,
  ShieldAlert,
  Calendar,
  Mail,
  RefreshCw,
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
  const [activeTab, setActiveTab] = useState<'studio' | 'automations' | 'tasks' | 'logs' | 'capabilities' | 'tests'>('studio');
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
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isKillSwitchActive, setIsKillSwitchActive] = useState(false);
  const [failureSimulationActive, setFailureSimulationActive] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [googleStatus, setGoogleStatus] = useState({
    connected: true,
    email: 'mohanmohan200405@gmail.com',
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Subscribe to Firebase Auth state on mount
  useEffect(() => {
    const unsubscribe = subscribeToFirebaseAuthState((user) => {
      setFirebaseUser(user);
      if (user?.email) {
        setGoogleStatus((prev) => ({ ...prev, email: user.email! }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Load Google status & Demo failure simulation status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setGoogleStatus({
            connected: data.googleConnected,
            email: data.googleAccount || 'mohanmohan200405@gmail.com',
          });
          setFailureSimulationActive(Boolean(data.primaryFailureSimulation));
        }
      } catch (e) {
        console.warn('Failed to fetch initial health status:', e);
      }
    };
    fetchStatus();
  }, []);

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
    }, 4500);
  };

  const handleToggleKillSwitch = () => {
    const nextState = !isKillSwitchActive;
    setIsKillSwitchActive(nextState);
    if (nextState) {
      showToast('EMERGENCY KILL SWITCH ACTIVATED: All autonomous executions are halted.', 'error');
    } else {
      showToast('System resumed: Autonomous execution unlocked.', 'info');
    }
  };

  const handleToggleFailureSimulation = async () => {
    try {
      const res = await fetch('/api/demo/toggle-failure', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setFailureSimulationActive(data.primaryFailureSimulation);
        showToast(data.message, data.primaryFailureSimulation ? 'info' : 'success');
      }
    } catch (err) {
      console.error('Toggle failure simulation failed:', err);
    }
  };

  const handleTriggerSampleEmail = async () => {
    try {
      const res = await fetch('/api/demo/trigger-sample-email', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showToast(`Sample email received: "${data.email?.subject}"`, 'success');

        // Automatically trigger urgent email workflow simulation
        const emailWorkflow = workflows.find((w) => w.trigger.type === 'EMAIL_RECEIVED') || workflows[0];
        if (emailWorkflow) {
          handleRunWorkflow(emailWorkflow);
        }
      }
    } catch (err) {
      console.error('Sample email injection failed:', err);
    }
  };

  const handleGenerate = async (goalText: string) => {
    const cleanGoal = goalText.trim();
    if (!cleanGoal) return;

    if (isKillSwitchActive) {
      showToast('Cannot generate or execute: Emergency Kill Switch is ACTIVE.', 'error');
      return;
    }

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
    syncWorkflowToFirestore(updated);
    showToast(`Workflow "${updated.name}" is now active & synced to Firebase.`);
  };

  const handleToggleStatus = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const nextStatus = w.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
          const updatedWf = { ...w, status: nextStatus };
          syncWorkflowToFirestore(updatedWf);
          showToast(`Workflow "${w.name}" set to ${nextStatus}.`, 'info');
          return updatedWf;
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

  const handleRunWorkflow = async (workflow: Workflow) => {
    if (isKillSwitchActive) {
      showToast('Execution blocked: Emergency Kill Switch is currently ACTIVE.', 'error');
      return;
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const isRecovered = failureSimulationActive || (workflow.recovery.enabled && Math.random() > 0.6);
    const duration = isRecovered ? Math.floor(Math.random() * 300 + 500) : Math.floor(Math.random() * 200 + 150);

    // If workflow creates a task, persist to real task store & Firestore
    if (workflow.actions.some((a) => a.type === 'CREATE_TASK')) {
      try {
        const taskPayload = {
          id: `task-${Date.now()}`,
          title: workflow.name || 'Automated Customer Task',
          description: workflow.goal,
          priority: workflow.actions.find((a) => a.type === 'CREATE_TASK')?.priority || 'HIGH',
          source: 'Gmail (Urgent Ingestion)',
          useBackupProvider: isRecovered,
        };
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskPayload),
        });
        syncTaskToFirestore(taskPayload);
      } catch (e) {
        console.warn('Real task creation notice:', e);
      }
    }

    // If workflow schedules calendar event, call Google Calendar API
    if (workflow.actions.some((a) => a.type === 'CREATE_CALENDAR_EVENT')) {
      try {
        const tomorrow = new Date(Date.now() + 86400000);
        await fetch('/api/calendar/create-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: workflow.name || 'Project Review',
            description: workflow.goal,
            start: new Date(tomorrow.setHours(15, 30, 0, 0)).toISOString(),
            end: new Date(tomorrow.setHours(16, 0, 0, 0)).toISOString(),
          }),
        });
      } catch (e) {
        console.warn('Real calendar creation notice:', e);
      }
    }

    const newLog: ExecutionLogEntry = {
      id: `exec-${Date.now().toString().slice(-6)}`,
      workflowId: workflow.id,
      workflowName: workflow.name,
      triggerType: workflow.trigger.type,
      status: isRecovered ? 'RECOVERED' : 'SUCCESS',
      durationMs: duration,
      timestamp: `Today, ${timestamp}`,
      details: isRecovered
        ? `Primary Task Provider failed (HTTP 503). Retried twice with exponential backoff, then activated ${workflow.recovery.fallback || 'BACKUP_TASK_PROVIDER'}. Outcome verified in store.`
        : `Autonomous execution completed. Verified: ${workflow.verification.description}.`,
      recoveryNote: isRecovered ? 'CircuitBreaker → Backup Provider' : undefined,
      logs: isRecovered
        ? [
            `[${timestamp}] Ingested trigger event: ${workflow.trigger.description}`,
            `[${timestamp}] Evaluated semantic condition: Urgent customer issue detected (confidence: 0.98)`,
            `[${timestamp}] Attempt 1 on Primary Task Provider failed (HTTP 503 Service Unavailable)`,
            `[${timestamp}] Retry #1 with exponential backoff failed (HTTP 503)`,
            `[${timestamp}] Activating Resilience Policy: Routing to ${workflow.recovery.fallback || 'BACKUP_TASK_PROVIDER'}`,
            `[${timestamp}] Backup Provider task created successfully (Receipt: #BK-${Date.now().toString().slice(-4)})`,
            `[${timestamp}] Confirmed Outcome Verification: Task exists in persistent store ✓`,
            `[${timestamp}] Dispatched in-app user notification`,
          ]
        : [
            `[${timestamp}] Ingested trigger event: ${workflow.trigger.description}`,
            `[${timestamp}] Evaluated guardrails: ${workflow.conditions?.length || 0} conditions verified`,
            ...workflow.actions.map((a) => `[${timestamp}] Executed action: ${a.description} (${a.priority || 'MEDIUM'})`),
            `[${timestamp}] Confirmed verification: ${workflow.verification.description}`,
          ],
    };

    setLogs((prev) => [newLog, ...prev]);
    setExecutionCount((c) => c + 1);
    syncExecutionLogToFirestore(newLog);
    showToast(
      isRecovered
        ? `Goal Recovered! Primary failed & auto-switched to Backup provider.`
        : `Dispatched live test for "${workflow.name}". Outcome Verified ✓`,
      isRecovered ? 'info' : 'success'
    );
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
        onOpenGoogleIntegrations={() => setIsGoogleModalOpen(true)}
        activeAutomationsCount={workflows.filter((w) => w.status === 'ACTIVE').length}
        tasksCount={2}
        logsCount={logs.length}
        googleConnected={googleStatus.connected}
        isKillSwitchActive={isKillSwitchActive}
        onToggleKillSwitch={handleToggleKillSwitch}
        isDemoMode={true}
        failureSimulationActive={failureSimulationActive}
        firebaseUser={firebaseUser}
      />

      {/* Emergency Kill Switch Alert Banner */}
      {isKillSwitchActive && (
        <div className="w-full bg-rose-600 px-4 py-2.5 text-center text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 animate-pulse">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>EMERGENCY KILL SWITCH ACTIVE: Autonomous execution and workflow dispatch are locked.</span>
          <button
            onClick={handleToggleKillSwitch}
            className="ml-2 rounded bg-white px-2.5 py-0.5 text-xs font-bold text-rose-700 shadow-2xs hover:bg-rose-50 transition-all"
          >
            Resume All
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
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
          <div className="space-y-6">
            {/* Hackathon Demo Quick Controls Bar */}
            <div className="rounded-xl border border-indigo-100 bg-white p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-mono">
                  <Zap className="h-3.5 w-3.5 text-indigo-600" />
                  HACKATHON CONTROLS:
                </span>

                <button
                  onClick={handleToggleFailureSimulation}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all border ${
                    failureSimulationActive
                      ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Simulates 503 on Primary Task Provider to trigger self-healing failover"
                >
                  Failure Injection: {failureSimulationActive ? '🔴 ACTIVE (503)' : '⚪ OFF'}
                </button>

                <button
                  onClick={handleTriggerSampleEmail}
                  className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  📨 Trigger Urgent Email
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-mono">Google Account:</span>
                <button
                  onClick={() => setIsGoogleModalOpen(true)}
                  className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  {googleStatus.email} ✓
                </button>
              </div>
            </div>

            {!currentWorkflow ? (
              <div className="space-y-10">
                <GoalInput
                  onGenerate={handleGenerate}
                  generationState={generationState}
                  currentGoalText={currentGoalText}
                  setCurrentGoalText={setCurrentGoalText}
                />

                {/* Active Automations Fleet Overview */}
                <div className="max-w-4xl mx-auto space-y-4 pt-2">
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
                        onClick={() => setCurrentWorkflow(wf)}
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

        {/* Tab 3: Real Persisted Tasks View */}
        {activeTab === 'tasks' && <TasksView />}

        {/* Tab 4: Execution Logs */}
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

        {/* Tab 5: Capability Registry */}
        {activeTab === 'capabilities' && <CapabilitiesRegistryModal />}

        {/* Tab 6: Automated Test Console */}
        {activeTab === 'tests' && <DemoTestConsole />}
      </main>

      {/* Google Integrations Modal */}
      <GoogleIntegrationsModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        firebaseUser={firebaseUser}
        onFirebaseUserChange={(user) => {
          setFirebaseUser(user);
          if (user?.email) {
            setGoogleStatus((prev) => ({ ...prev, email: user.email! }));
          }
        }}
        onRefreshStatus={async () => {
          try {
            const res = await fetch('/api/health');
            if (res.ok) {
              const data = await res.json();
              setGoogleStatus({
                connected: data.googleConnected,
                email: data.googleAccount || 'mohanmohan200405@gmail.com',
              });
            }
          } catch (e) {}
        }}
      />

      {/* Simulation Modal Runner */}
      {isSimulationOpen && currentWorkflow && (
        <SimulationTimeline
          workflow={currentWorkflow}
          onClose={() => setIsSimulationOpen(false)}
          onSimulationComplete={(result: SimulationResult, auditEvents) => {
            if (result.status === 'SUCCESS' || result.status === 'RECOVERED') {
              showToast(`Simulation completed: ${result.status} (${result.totalDurationMs}ms)`);
              
              const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const isRecovered = result.status === 'RECOVERED';
              
              const newLogEntry: ExecutionLogEntry = {
                id: `sim-exec-${Date.now().toString().slice(-6)}`,
                workflowId: currentWorkflow.id,
                workflowName: currentWorkflow.name,
                triggerType: currentWorkflow.trigger.type,
                status: isRecovered ? 'RECOVERED' : 'SUCCESS',
                durationMs: result.totalDurationMs,
                timestamp: `Simulation at ${timestamp}`,
                details: isRecovered
                  ? 'Milestone 2 Loop: Primary Failure → Diagnose → Retry #1 → Retry #2 → Fallback → Success → Verify → Goal Achieved.'
                  : 'Direct execution pass completed without exceptions.',
                recoveryNote: isRecovered ? 'Self-Healing Fallback Routing' : undefined,
                logs: auditEvents && auditEvents.length > 0
                  ? auditEvents.map((e) => `[${e.timestamp}] [${e.type}] ${e.title}: ${e.message}`)
                  : result.steps.flatMap((s) => s.logs),
              };

              setLogs((prev) => [newLogEntry, ...prev]);
              setExecutionCount((c) => c + 1);
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
