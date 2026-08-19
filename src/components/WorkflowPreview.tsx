/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Workflow } from '../workflow/types.ts';
import { ConfidenceIndicator } from './ConfidenceIndicator.tsx';
import { RiskBadge } from './RiskBadge.tsx';
import { CapabilityBadge } from './CapabilityBadge.tsx';
import { WorkflowVisualization } from './WorkflowVisualization.tsx';
import { checkApprovalPolicy } from '../policy/approvalEngine.ts';
import {
  Sparkles,
  Play,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ShieldCheck,
  FileCheck,
  HelpCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface WorkflowPreviewProps {
  workflow: Workflow;
  onSimulateClick: () => void;
  onEditClick: () => void;
  onActivateClick: (workflow: Workflow) => void;
  onRunLive?: (workflow: Workflow) => void;
  isActivated?: boolean;
}

export const WorkflowPreview: React.FC<WorkflowPreviewProps> = ({
  workflow,
  onSimulateClick,
  onEditClick,
  onActivateClick,
  onRunLive,
  isActivated = false,
}) => {
  const [explainTab, setExplainTab] = useState<'plan' | 'graph' | 'explainability'>('plan');
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const approvalStatus = checkApprovalPolicy(workflow);

  const handleActivate = () => {
    if (workflow.approvalRequired || workflow.risk.level === 'HIGH' || workflow.risk.level === 'CRITICAL') {
      setShowApprovalModal(true);
    } else {
      onActivateClick(workflow);
    }
  };

  const confirmActivation = () => {
    setShowApprovalModal(false);
    onActivateClick(workflow);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card with Top Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                AURA Plan • {workflow.id}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {workflow.name}
            </h1>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onRunLive && (
              <button
                onClick={() => onRunLive(workflow)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm whitespace-nowrap"
                title="Execute actions live (send real email, calendar booking, task creation)"
              >
                <Zap className="h-4 w-4 fill-current" />
                <span>Run Live Test</span>
              </button>
            )}

            <button
              onClick={onSimulateClick}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs whitespace-nowrap"
            >
              <Play className="h-4 w-4 text-indigo-600" />
              <span>Simulate Workflow</span>
            </button>

            <button
              onClick={onEditClick}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs whitespace-nowrap"
            >
              <Sliders className="h-4 w-4 text-slate-500" />
              <span>Edit with AURA</span>
            </button>

            <button
              onClick={handleActivate}
              disabled={isActivated}
              className={`flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs sm:text-sm font-bold text-white transition-all whitespace-nowrap shadow-md ${
                isActivated
                  ? 'bg-emerald-600 cursor-default shadow-emerald-100'
                  : workflow.approvalRequired || workflow.risk.level === 'HIGH' || workflow.risk.level === 'CRITICAL'
                  ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-100'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-100'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {isActivated
                  ? 'Active in Fleet'
                  : workflow.approvalRequired || workflow.risk.level === 'HIGH' || workflow.risk.level === 'CRITICAL'
                  ? 'Review & Approve'
                  : 'Approve & Activate'}
              </span>
            </button>
          </div>
        </div>

        {/* User Goal & Understood Intent */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Your Goal
            </span>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              "{workflow.goal}"
            </p>
          </div>

          <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-4">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
              What AURA Understood
            </span>
            <p className="text-sm font-semibold text-indigo-950 leading-relaxed">
              {workflow.explainability.understoodIntent}
            </p>
          </div>
        </div>

        {/* Key Guardrail Metrics Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          {/* Confidence */}
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Confidence Score
            </span>
            <ConfidenceIndicator
              confidence={workflow.confidence}
              level={workflow.confidenceLevel}
              clarificationNeeded={workflow.clarificationNeeded}
            />
          </div>

          {/* Risk Evaluation */}
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Safety Risk Classification
            </span>
            <RiskBadge risk={workflow.risk} showDetails={false} />
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
              {workflow.risk.reason}
            </p>
          </div>

          {/* Approval Policy */}
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Execution Policy
            </span>
            <div
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${
                approvalStatus.badgeVariant === 'safe'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-orange-50 text-orange-700 border-orange-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${approvalStatus.badgeVariant === 'safe' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
              <span>{approvalStatus.badgeLabel}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
              {approvalStatus.blockReason || 'Deterministic policy allows automatic dispatch.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Navigation View Switcher */}
      <div className="flex items-center border-b border-slate-200 gap-2 pb-0">
        <button
          onClick={() => setExplainTab('plan')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            explainTab === 'plan'
              ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck className="h-4 w-4" />
          <span>AURA's Plan ({workflow.explainability.planSteps.length} Steps)</span>
        </button>

        <button
          onClick={() => setExplainTab('graph')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            explainTab === 'graph'
              ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Execution Graph & Branching</span>
        </button>

        <button
          onClick={() => setExplainTab('explainability')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            explainTab === 'explainability'
              ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Decision Transparency (6 Questions)</span>
        </button>
      </div>

      {/* 3. Tab Content: Plan with Numbered Timeline & Side Cards */}
      {explainTab === 'plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Numbered Step Sequence Column */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Execution Steps Sequence
              </span>
              <span className="text-xs font-mono text-slate-400 font-bold">
                {workflow.explainability.planSteps.length} VERIFIED NODES
              </span>
            </div>

            <div className="space-y-6">
              {workflow.explainability.planSteps.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  {/* Number Circle & Connecting Line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        idx === 0
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-50'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    {idx < workflow.explainability.planSteps.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-200 my-1" />
                    )}
                  </div>

                  <div className="pb-4 flex-1">
                    <p className="text-sm font-bold text-slate-800">
                      Step {idx + 1}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-sans">
                      {step}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Recovery, Capabilities, Verification */}
          <div className="space-y-4">
            {/* Recovery Logic Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Recovery Logic
              </p>
              <div className="text-xs text-slate-700">
                <p className="font-bold text-sm text-slate-900">
                  {workflow.recovery.strategy}
                </p>
                <p className="text-slate-500 mt-1">
                  {workflow.recovery.description || 'Auto-retry with verified fallback service.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-2 bg-slate-50 p-2 rounded border border-slate-100">
                  {workflow.explainability.recoveryExplanation}
                </p>
              </div>
            </div>

            {/* Outcome Verification Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Outcome Verification
              </p>
              <div className="text-xs text-slate-700">
                <p className="font-bold text-sm text-slate-900">
                  Type: {workflow.verification.type}
                </p>
                <p className="text-slate-500 mt-1">
                  {workflow.verification.description}
                </p>
                <p className="text-[11px] text-slate-400 mt-2 bg-slate-50 p-2 rounded border border-slate-100">
                  {workflow.explainability.verificationExplanation}
                </p>
              </div>
            </div>

            {/* Capabilities Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Required Capabilities
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {workflow.requiredCapabilities.map((cap) => (
                  <CapabilityBadge key={cap.id} capability={cap} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tab Content: Visual Flow Graph */}
      {explainTab === 'graph' && (
        <WorkflowVisualization workflow={workflow} />
      )}

      {/* 3. Tab Content: Deep Explainability */}
      {explainTab === 'explainability' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              AURA Decision Transparency
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured plain-English justifications for this automation plan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Q1 */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1.5 font-mono">
                1. What did AURA understand?
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {workflow.explainability.understoodIntent}
              </p>
            </div>

            {/* Q2 */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1.5 font-mono">
                2. What will AURA do?
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Execute {workflow.actions.length} action{workflow.actions.length > 1 ? 's' : ''} sequentially: {workflow.actions.map((a) => a.description).join(', ')}.
              </p>
            </div>

            {/* Q3 */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1.5 font-mono">
                3. Why are these actions necessary?
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {workflow.explainability.actionJustification}
              </p>
            </div>

            {/* Q4 */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <h4 className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1.5 font-mono">
                4. What could fail?
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-700">
                {workflow.explainability.failureModes.map((fm, idx) => (
                  <li key={idx}>{fm}</li>
                ))}
              </ul>
            </div>

            {/* Q5 */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1.5 font-mono">
                5. What will AURA do if something fails?
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {workflow.explainability.recoveryExplanation}
              </p>
            </div>

            {/* Q6 */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5 font-mono">
                6. How will AURA know the goal succeeded?
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {workflow.explainability.verificationExplanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Review & Approve Confirmation Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 border border-orange-100 text-orange-600 font-bold">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Review & Authorization Gate
                </h3>
                <p className="text-xs text-slate-400">
                  AURA Safety Governance Policy
                </p>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 space-y-2">
              <p>
                This workflow is categorized as <strong className="text-orange-600">{workflow.risk.level} RISK</strong> because:
              </p>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-slate-800 text-xs font-mono">
                {workflow.risk.reason}
              </div>
              <p className="text-xs text-slate-400">
                By approving this workflow, you authorize AURA to activate this automation and enforce all defined guardrails.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmActivation}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white transition-colors shadow-md shadow-indigo-100"
              >
                Confirm & Activate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
