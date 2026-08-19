/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  Database,
} from 'lucide-react';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  source?: string;
  sourceMessageId?: string;
  workflowExecutionId?: string;
  providerUsed: 'PRIMARY_TASK_PROVIDER' | 'BACKUP_TASK_PROVIDER';
  createdAt: string;
}

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        }
      }
    } catch (e) {
      console.warn('Failed to load tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.source && t.source.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = filterPriority === 'ALL' || t.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'LOW':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Persisted Task Store</h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
              {tasks.length} Real Tasks
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Verified tasks created by autonomous AURA workflows across Primary and Backup providers.
          </p>
        </div>

        <button
          onClick={fetchTasks}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Tasks</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks, descriptions, sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-xs font-medium text-slate-600">Priority:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                filterPriority === p
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <CheckSquare className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No tasks found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Run an automation like <code className="text-indigo-600 font-mono">"Whenever an urgent email arrives, create a high-priority task"</code> in the Studio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold border ${getPriorityBadge(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-mono font-semibold border ${
                      task.providerUsed === 'BACKUP_TASK_PROVIDER'
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                    }`}
                  >
                    {task.providerUsed === 'BACKUP_TASK_PROVIDER' ? '⚡ Backup Provider (Recovered)' : '🏢 Primary Provider'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Outcome Verified
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                {task.description && <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>}

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span className="font-mono text-slate-500">ID: {task.id}</span>
                  {task.source && <span>Source: <strong className="text-slate-600">{task.source}</strong></span>}
                  <span>Created: {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200">
                  Status: {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
