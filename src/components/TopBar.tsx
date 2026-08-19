/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Activity, Layers, Plus, Terminal, FlaskConical } from 'lucide-react';

interface TopBarProps {
  activeTab: 'studio' | 'automations' | 'logs' | 'capabilities' | 'tests';
  setActiveTab: (tab: 'studio' | 'automations' | 'logs' | 'capabilities' | 'tests') => void;
  onNewGoalClick: () => void;
  activeAutomationsCount: number;
  logsCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onNewGoalClick,
  activeAutomationsCount,
  logsCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0F172A] text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Zone (Single line, strictly one element contract) */}
        <button
          onClick={() => setActiveTab('studio')}
          className="flex items-center gap-3 text-left group focus-visible:outline-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold text-base shadow-sm group-hover:bg-indigo-400 transition-colors">
            A
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight text-white">AURA</span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wide border border-slate-700">
              Workflow OS
            </span>
          </div>
        </button>

        {/* Navigation Zone */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'studio'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('automations')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'automations'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Automations</span>
            {activeAutomationsCount > 0 && (
              <span className="ml-1 rounded-full bg-slate-800 px-1.5 py-0.2 text-[11px] font-mono text-indigo-300 border border-slate-700">
                {activeAutomationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Logs</span>
            {logsCount > 0 && (
              <span className="ml-1 rounded-full bg-slate-800 px-1.5 py-0.2 text-[11px] font-mono text-emerald-400 border border-slate-700">
                {logsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('capabilities')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'capabilities'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Capabilities</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'tests'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FlaskConical className="h-4 w-4 text-emerald-400" />
            <span>Tests</span>
          </button>
        </nav>

        {/* Actions Zone */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-bold text-emerald-400 uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>System Online</span>
          </div>

          <button
            onClick={onNewGoalClick}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Goal</span>
          </button>
        </div>
      </div>
    </header>
  );
};
