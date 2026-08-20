/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Workflow,
  TriggerType,
  ActionType,
} from '../workflow/types.ts';
import {
  ArrowDown,
  Sparkles,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  RotateCw,
  ShieldCheck,
  CheckSquare,
  Bell,
  Database,
  Globe,
  CornerDownRight,
  Info,
  Layers,
  Zap,
} from 'lucide-react';

interface WorkflowVisualizationProps {
  workflow: Workflow;
}

export const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({ workflow }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>('trigger');

  const getTriggerIcon = (type: TriggerType) => {
    switch (type) {
      case 'EMAIL_RECEIVED':
        return <Mail className="h-4 w-4 text-indigo-600" />;
      case 'TEXT_RECEIVED':
        return <MessageSquare className="h-4 w-4 text-emerald-600" />;
      case 'SCHEDULE':
        return <Clock className="h-4 w-4 text-indigo-600" />;
      case 'CALENDAR_EVENT':
        return <Calendar className="h-4 w-4 text-indigo-600" />;
      case 'FORM_SUBMITTED':
        return <FileText className="h-4 w-4 text-indigo-600" />;
      case 'MANUAL':
      default:
        return <User className="h-4 w-4 text-indigo-600" />;
    }
  };

  const getActionIcon = (type: ActionType) => {
    switch (type) {
      case 'CREATE_TASK':
        return <CheckSquare className="h-4 w-4 text-emerald-600" />;
      case 'SEND_NOTIFICATION':
        return <Bell className="h-4 w-4 text-indigo-600" />;
      case 'SEND_EMAIL':
        return <Mail className="h-4 w-4 text-sky-600" />;
      case 'SEND_TEXT':
        return <MessageSquare className="h-4 w-4 text-emerald-600" />;
      case 'CREATE_CALENDAR_EVENT':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'SAVE_DATA':
        return <Database className="h-4 w-4 text-indigo-600" />;
      case 'CALL_WEBHOOK':
        return <Globe className="h-4 w-4 text-orange-600" />;
      default:
        return <Sparkles className="h-4 w-4 text-indigo-600" />;
    }
  };

  // Node details generator
  const getNodeDetails = () => {
    if (!selectedNode) return null;

    if (selectedNode === 'goal') {
      return {
        title: 'Human Goal Intent',
        type: 'ROOT_INTENT',
        description: workflow.goal,
        properties: {
          'Understood Goal': workflow.explainability.understoodIntent,
          'Confidence': `${Math.round(workflow.confidence * 100)}% (${workflow.confidenceLevel})`,
          'Safety Classification': `${workflow.risk.level} Risk`,
        },
      };
    }

    if (selectedNode === 'trigger') {
      return {
        title: `Trigger Node (${workflow.trigger.type})`,
        type: workflow.trigger.type,
        description: workflow.trigger.description,
        properties: {
          'Event Listener': workflow.trigger.type,
          'Payload Filter': workflow.conditions?.length ? 'Filtered by active conditions' : 'Accepts all incoming payloads',
          'Execution Mode': 'Event-driven webhook/polling listener',
        },
      };
    }

    if (selectedNode === 'conditions') {
      return {
        title: 'Evaluation & Semantic Guardrails',
        type: 'GUARDRAILS',
        description: 'Conditions evaluated sequentially before dispatching actions.',
        properties: {
          'Active Rules': workflow.conditions?.map((c) => c.description).join('; ') || 'None',
          'Failure Handling': 'If conditions evaluate to false, execution is halted gracefully.',
        },
      };
    }

    if (selectedNode.startsWith('action-')) {
      const actionId = selectedNode.replace('action-', '');
      const action = workflow.actions.find((a) => a.id === actionId) || workflow.actions[0];
      return {
        title: `Action: ${action.type}`,
        type: action.type,
        description: action.description,
        properties: {
          'Action ID': action.id,
          'Priority': action.priority || 'MEDIUM',
          'Target Integration': action.type.toLowerCase().replace('_', ' '),
          'Approval Gated': workflow.approvalRequired ? 'Yes (Manual Gate)' : 'Automatic',
        },
      };
    }

    if (selectedNode === 'recovery') {
      return {
        title: `Self-Healing Recovery: ${workflow.recovery.strategy}`,
        type: workflow.recovery.strategy,
        description: workflow.recovery.description || 'Automatic resilience policy',
        properties: {
          'Strategy': workflow.recovery.strategy,
          'Max Retry Attempts': workflow.recovery.retryCount || 2,
          'Failover Target': workflow.recovery.fallback || 'None (Alert on exhaustion)',
          'Circuit Breaker': 'Enabled (Halts cascading service failures)',
        },
      };
    }

    if (selectedNode === 'verification') {
      return {
        title: `Outcome Verification: ${workflow.verification.type}`,
        type: workflow.verification.type,
        description: workflow.verification.description,
        properties: {
          'Verification Type': workflow.verification.type,
          'Confirmation Method': 'Direct remote target state query and cryptographic receipt',
          'Status': 'Required for terminal completion',
        },
      };
    }

    return null;
  };

  const activeNodeInfo = getNodeDetails();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-700 tracking-wider uppercase font-mono">
              Execution Flow Graph
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any node in the graph to inspect its parameters, guardrails, and schema
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Validated Safe</span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visual Graph Diagram Column */}
          <div className="lg:col-span-7 flex flex-col items-center space-y-3">
            {/* 1. User Goal Root Node */}
            <div
              onClick={() => setSelectedNode('goal')}
              className={`w-full cursor-pointer rounded-xl border p-4 transition-all text-center ${
                selectedNode === 'goal'
                  ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200'
                  : 'border-indigo-200 bg-indigo-50/30 hover:border-indigo-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold font-mono text-indigo-700 uppercase tracking-wider mb-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>Human Goal</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 font-sans">
                "{workflow.goal}"
              </p>
            </div>

            {/* Connector */}
            <div className="flex flex-col items-center text-slate-400">
              <div className="h-4 w-px bg-slate-300" />
              <ArrowDown className="h-4 w-4 text-slate-400 -my-1" />
            </div>

            {/* 2. Trigger Node */}
            <div
              onClick={() => setSelectedNode('trigger')}
              className={`w-full cursor-pointer rounded-xl border p-4 transition-all ${
                selectedNode === 'trigger'
                  ? 'border-indigo-500 bg-white ring-2 ring-indigo-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2 bg-indigo-50 border border-indigo-100">
                    {getTriggerIcon(workflow.trigger.type)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold font-mono text-indigo-600 uppercase tracking-wider block">
                      TRIGGER • {workflow.trigger.type}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {workflow.trigger.description}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Listener
                </span>
              </div>
            </div>

            {/* Connector */}
            <div className="flex flex-col items-center text-slate-400">
              <div className="h-4 w-px bg-slate-300" />
              <ArrowDown className="h-4 w-4 text-slate-400 -my-1" />
            </div>

            {/* 3. Conditions Node (if any) */}
            {workflow.conditions && workflow.conditions.length > 0 && (
              <>
                <div
                  onClick={() => setSelectedNode('conditions')}
                  className={`w-full cursor-pointer rounded-xl border p-4 transition-all ${
                    selectedNode === 'conditions'
                      ? 'border-orange-400 bg-orange-50/40 ring-2 ring-orange-200'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold font-mono text-orange-600 uppercase tracking-wider">
                      EVALUATION / GUARDRAILS
                    </span>
                    <span className="text-[10px] font-bold font-mono text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                      {workflow.conditions.length} Condition{workflow.conditions.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {workflow.conditions.map((cond, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="font-mono text-orange-500 font-bold shrink-0">◇</span>
                        <span>{cond.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connector */}
                <div className="flex flex-col items-center text-slate-400">
                  <div className="h-4 w-px bg-slate-300" />
                  <ArrowDown className="h-4 w-4 text-slate-400 -my-1" />
                </div>
              </>
            )}

            {/* 4. Actions Pipeline */}
            <div className="w-full space-y-2.5">
              {workflow.actions.map((action, idx) => (
                <div
                  key={action.id}
                  onClick={() => setSelectedNode(`action-${action.id}`)}
                  className={`w-full cursor-pointer rounded-xl border p-4 transition-all ${
                    selectedNode === `action-${action.id}`
                      ? 'border-emerald-500 bg-white ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg p-2 bg-emerald-50 border border-emerald-100">
                        {getActionIcon(action.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold font-mono text-emerald-700 uppercase tracking-wider">
                            ACTION {idx + 1} • {action.type}
                          </span>
                          {action.priority && (
                            <span className={`text-[9px] font-bold font-mono uppercase px-1.5 py-0.2 rounded ${
                              action.priority === 'HIGH' || action.priority === 'CRITICAL'
                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {action.priority} Priority
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-slate-800">
                          {action.description}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 5. Resilience / Recovery Subgraph */}
            {workflow.recovery.enabled && (
              <div
                onClick={() => setSelectedNode('recovery')}
                className={`w-full cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedNode === 'recovery'
                    ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200'
                    : 'border-indigo-200 bg-indigo-50/30 hover:border-indigo-400'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-indigo-800">
                    <RotateCw className="h-3.5 w-3.5 text-indigo-600" />
                    <span className="uppercase tracking-wider">Self-Healing & Recovery Branch</span>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {workflow.recovery.strategy}
                  </span>
                </div>

                <div className="text-xs space-y-2 text-slate-700 font-mono">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <span className="text-slate-400">├──</span>
                    <span className="font-bold text-[10px] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      ON SUCCESS
                    </span>
                    <span className="text-slate-600 font-sans font-medium">Proceed directly to Verification</span>
                  </div>

                  <div className="space-y-1.5 pl-0 text-orange-700">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">└──</span>
                      <span className="font-bold text-[10px] bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                        ON FAILURE
                      </span>
                      <span className="text-slate-600 font-sans font-medium">Trigger Resilience Policy</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Connector */}
            <div className="flex flex-col items-center text-slate-400">
              <div className="h-4 w-px bg-slate-300" />
              <ArrowDown className="h-4 w-4 text-slate-400 -my-1" />
            </div>

            {/* 6. Verification Node */}
            <div
              onClick={() => setSelectedNode('verification')}
              className={`w-full cursor-pointer rounded-xl border p-4 transition-all ${
                selectedNode === 'verification'
                  ? 'border-indigo-500 bg-white ring-2 ring-indigo-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2 bg-indigo-50 border border-indigo-100">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold font-mono text-indigo-700 uppercase tracking-wider block">
                      OUTCOME VERIFICATION • {workflow.verification.type}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {workflow.verification.description}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Node Inspector Detail Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-20 rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-600">
                    Node Inspector
                  </h4>
                </div>
                {activeNodeInfo && (
                  <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                    {activeNodeInfo.type}
                  </span>
                )}
              </div>

              {activeNodeInfo ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm mb-0.5">
                      {activeNodeInfo.title}
                    </h5>
                    <p className="text-slate-600 font-sans leading-relaxed">
                      {activeNodeInfo.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200 font-mono">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Node Properties & Safeguards:
                    </span>
                    {Object.entries(activeNodeInfo.properties).map(([key, val]) => (
                      <div key={key} className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          {key}
                        </span>
                        <span className="text-slate-800 font-medium text-xs">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Select any node in the graph to inspect properties.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
