/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SUPPORTED_TRIGGERS,
  SUPPORTED_CONDITIONS,
  SUPPORTED_ACTIONS,
  SUPPORTED_RECOVERY_STRATEGIES,
  SUPPORTED_VERIFICATION_TYPES,
} from '../workflow/capabilityRegistry.ts';
import {
  Layers,
  RotateCw,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const CapabilitiesRegistryModal: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'triggers' | 'conditions' | 'actions' | 'recovery' | 'verification'>('triggers');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              AURA Capability Registry
            </h1>
            <p className="text-xs text-slate-500">
              Controlled registry of verified primitives that Grok is authorized to orchestrate
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-slate-700 space-y-1">
          <p className="font-bold text-indigo-900">
            🛡️ AI Safety Architecture Guardrail:
          </p>
          <p className="text-slate-600">
            Grok is constrained to synthesize workflows using strictly registered capabilities. Arbitrary executable code generation and <code className="text-indigo-700 font-bold">eval()</code> are structurally prohibited.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('triggers')}
          className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'triggers'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Triggers ({Object.keys(SUPPORTED_TRIGGERS).length})
        </button>

        <button
          onClick={() => setActiveSubTab('conditions')}
          className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'conditions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Conditions ({Object.keys(SUPPORTED_CONDITIONS).length})
        </button>

        <button
          onClick={() => setActiveSubTab('actions')}
          className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'actions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Actions ({Object.keys(SUPPORTED_ACTIONS).length})
        </button>

        <button
          onClick={() => setActiveSubTab('recovery')}
          className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'recovery'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Recovery Strategies ({Object.keys(SUPPORTED_RECOVERY_STRATEGIES).length})
        </button>

        <button
          onClick={() => setActiveSubTab('verification')}
          className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'verification'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Verification Types ({Object.keys(SUPPORTED_VERIFICATION_TYPES).length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TRIGGERS */}
        {activeSubTab === 'triggers' &&
          Object.values(SUPPORTED_TRIGGERS).map((t) => (
            <div
              key={t.type}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-600 uppercase">
                  {t.type}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {t.category}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{t.label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t.description}
              </p>
              {t.requiredPermission && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <Lock className="h-3 w-3 text-slate-400" />
                  <span>Requires: {t.requiredPermission.label}</span>
                </div>
              )}
            </div>
          ))}

        {/* CONDITIONS */}
        {activeSubTab === 'conditions' &&
          Object.values(SUPPORTED_CONDITIONS).map((c) => (
            <div
              key={c.type}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-orange-600 uppercase">
                  {c.type}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {c.category}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{c.label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {c.description}
              </p>
            </div>
          ))}

        {/* ACTIONS */}
        {activeSubTab === 'actions' &&
          Object.values(SUPPORTED_ACTIONS).map((a) => (
            <div
              key={a.type}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-600 uppercase">
                  {a.type}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {a.category}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{a.label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {a.description}
              </p>
              {a.requiredPermission && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <Lock className="h-3 w-3 text-slate-400" />
                  <span>Requires: {a.requiredPermission.label}</span>
                </div>
              )}
            </div>
          ))}

        {/* RECOVERY */}
        {activeSubTab === 'recovery' &&
          Object.entries(SUPPORTED_RECOVERY_STRATEGIES).map(([key, strat]) => (
            <div
              key={key}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-600 uppercase">
                  {key}
                </span>
                <RotateCw className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">{strat.label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {strat.description}
              </p>
            </div>
          ))}

        {/* VERIFICATION */}
        {activeSubTab === 'verification' &&
          Object.entries(SUPPORTED_VERIFICATION_TYPES).map(([key, ver]) => (
            <div
              key={key}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-600 uppercase">
                  {key}
                </span>
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">{ver.label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {ver.description}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
};
