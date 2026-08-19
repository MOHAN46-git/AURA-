/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  Activity,
  Layers,
  Plus,
  Terminal,
  FlaskConical,
  CheckSquare,
  Zap,
  Power,
  ShieldAlert,
  Flame,
  Cloud,
} from 'lucide-react';
import { FirebaseAuthUser } from '../firebase/authService.ts';

interface TopBarProps {
  activeTab: 'studio' | 'automations' | 'tasks' | 'logs' | 'capabilities' | 'tests';
  setActiveTab: (tab: 'studio' | 'automations' | 'tasks' | 'logs' | 'capabilities' | 'tests') => void;
  onNewGoalClick: () => void;
  onOpenGoogleIntegrations: () => void;
  activeAutomationsCount: number;
  tasksCount?: number;
  logsCount?: number;
  googleConnected?: boolean;
  isKillSwitchActive?: boolean;
  onToggleKillSwitch?: () => void;
  isDemoMode?: boolean;
  failureSimulationActive?: boolean;
  firebaseUser?: FirebaseAuthUser | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onNewGoalClick,
  onOpenGoogleIntegrations,
  activeAutomationsCount,
  tasksCount = 0,
  logsCount = 0,
  googleConnected = true,
  isKillSwitchActive = false,
  onToggleKillSwitch,
  isDemoMode = true,
  failureSimulationActive = false,
  firebaseUser,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0F172A] text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
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

          {/* Firebase Cloud Sync Badge */}
          <div className="hidden xl:flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-amber-500/20">
            <Flame className="h-3 w-3 text-amber-400" />
            <span>project1-4506</span>
          </div>

          {isDemoMode && (
            <span className="hidden lg:inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
              DEMO MODE
            </span>
          )}
        </div>

        {/* Navigation Zone */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
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
            className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'automations'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Automations</span>
            {activeAutomationsCount > 0 && (
              <span className="ml-1 rounded-full bg-slate-800 px-1.5 py-0.2 text-[11px] font-mono text-indigo-300 border border-slate-700">
                {activeAutomationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="h-4 w-4 text-emerald-400" />
            <span>Tasks</span>
            {tasksCount > 0 && (
              <span className="ml-1 rounded-full bg-slate-800 px-1.5 py-0.2 text-[11px] font-mono text-emerald-400 border border-slate-700">
                {tasksCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
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
            className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'capabilities'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span className="hidden md:inline">Capabilities</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'tests'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FlaskConical className="h-4 w-4 text-emerald-400" />
            <span className="hidden md:inline">Tests</span>
          </button>
        </nav>

        {/* Actions Zone */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Google & Firebase Integrations Quick Button */}
          <button
            onClick={onOpenGoogleIntegrations}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-2xs"
            title="Google & Firebase Cloud Status"
          >
            <span className={`h-2 w-2 rounded-full ${googleConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="hidden sm:inline">{firebaseUser?.email ? firebaseUser.email.split('@')[0] : 'Google & Firebase'}</span>
          </button>

          {/* Emergency Kill Switch */}
          {onToggleKillSwitch && (
            <button
              onClick={onToggleKillSwitch}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all shadow-2xs border ${
                isKillSwitchActive
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-rose-950 hover:text-rose-300'
              }`}
              title={isKillSwitchActive ? 'Automations are HALTED. Click to resume.' : 'Emergency stop for all automations'}
            >
              <Power className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isKillSwitchActive ? 'LOCKED' : 'Kill Switch'}</span>
            </button>
          )}

          <button
            onClick={onNewGoalClick}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Goal</span>
          </button>
        </div>
      </div>
    </header>
  );
};
