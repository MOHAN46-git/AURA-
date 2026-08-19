/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Workflow } from '../workflow/types.ts';
import { editClientWorkflow } from '../workflow/clientFallback.ts';
import {
  Send,
  X,
  RotateCw,
  Sliders,
} from 'lucide-react';

interface EditWorkflowModalProps {
  workflow: Workflow;
  onClose: () => void;
  onWorkflowUpdated: (updatedWorkflow: Workflow) => void;
}

export const EditWorkflowModal: React.FC<EditWorkflowModalProps> = ({
  workflow,
  onClose,
  onWorkflowUpdated,
}) => {
  const [instruction, setInstruction] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [history, setHistory] = useState<
    Array<{ type: 'user' | 'aura'; message: string; timestamp: string }>
  >([
    {
      type: 'aura',
      message: `I'm ready to modify "${workflow.name}". What adjustments would you like to make? (e.g. "Retry three times instead", "Require my approval first", "Set priority to HIGH")`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    'Retry three times instead of two',
    'Ask me for approval before executing',
    'Set task priority to HIGH',
    'Ensure backup task provider is configured',
    'Remove manual approval requirement',
  ];

  const handleSend = async (textToSend?: string) => {
    const promptText = (textToSend || instruction).trim();
    if (!promptText || isUpdating) return;

    const userMsg = {
      type: 'user' as const,
      message: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setHistory((prev) => [...prev, userMsg]);
    setInstruction('');
    setIsUpdating(true);

    try {
      let updatedWf: Workflow | null = null;

      try {
        const res = await fetch('/api/edit-workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentWorkflow: workflow,
            instruction: promptText,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.workflow) {
            updatedWf = data.workflow;
          }
        }
      } catch (networkErr) {
        console.warn('API route unavailable, using client-side rule modifier:', networkErr);
      }

      if (!updatedWf) {
        // Safe infallible fallback
        updatedWf = editClientWorkflow(workflow, promptText);
      }

      onWorkflowUpdated(updatedWf);
      setHistory((prev) => [
        ...prev,
        {
          type: 'aura' as const,
          message: `Updated workflow successfully. Verified capabilities and recalculated safety risk (${updatedWf.risk.level} risk).`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        {
          type: 'aura' as const,
          message: `Unable to apply change: ${err?.message || 'Unexpected issue'}. Please try rephrasing.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="relative flex flex-col w-full max-w-2xl h-[620px] max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Edit with AURA
              </h2>
              <p className="text-xs text-slate-400">
                Conversational goal and parameter refinement
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {history.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.type === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-mono text-slate-400">
                <span>{msg.type === 'user' ? 'You' : 'AURA'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                  msg.type === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none font-medium'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))}

          {isUpdating && (
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg w-fit">
              <RotateCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
              <span>AURA is refining the workflow schema...</span>
            </div>
          )}
        </div>

        {/* Quick prompt chips */}
        <div className="border-t border-slate-100 px-6 py-2.5 bg-white">
          <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
            Quick Adjustments:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((chip, cIdx) => (
              <button
                key={cIdx}
                onClick={() => handleSend(chip)}
                disabled={isUpdating}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-100 p-4 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Tell AURA how to modify this workflow..."
              disabled={isUpdating}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <button
              type="submit"
              disabled={isUpdating || !instruction.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-sm shadow-indigo-100 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Update</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
