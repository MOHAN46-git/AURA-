/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { EXAMPLE_GOALS, ExampleGoal } from '../data/exampleGoals.ts';
import { GenerationState } from '../workflow/types.ts';
import {
  Sparkles,
  Mic,
  MicOff,
  ArrowRight,
  RotateCw,
  AlertCircle,
  X,
  Volume2,
  Radio,
  Command,
  Play,
  Check,
} from 'lucide-react';

interface GoalInputProps {
  onGenerate: (goalText: string) => Promise<void>;
  generationState: GenerationState;
  currentGoalText: string;
  setCurrentGoalText: (text: string) => void;
}

const VOICE_PRESETS = [
  {
    label: 'Urgent Email with Backup Failover',
    speech:
      'Whenever I receive an urgent customer email, create a high-priority task, notify me, and make sure the task gets created even if my primary task service fails.',
  },
  {
    label: 'Monday Weekly Executive Briefing',
    speech:
      'Every Monday at 9 AM, summarize all active team projects from Notion, compile key blockers, and send an executive digest to Slack.',
  },
  {
    label: 'Smart Conflict-Free Calendar Booking',
    speech:
      'When a VIP client requests a meeting via email, check my Google Calendar for open 45-minute afternoon windows and draft a confirmation invite.',
  },
  {
    label: 'Texting Command & SMS Task Failover',
    speech:
      'Whenever I receive an urgent text message or SMS, create a high-priority task, text me a confirmation, and failover to my backup task provider if needed.',
  },
  {
    label: 'தமிழ் குறுஞ்செய்தி கட்டளை (Tamil SMS)',
    speech:
      'அவசர குறுஞ்செய்தி வரும்போது, பணியை உருவாக்கி எனக்கு குறுஞ்செய்தி மூலம் உறுதிப்படுத்தவும்.',
  },
  {
    label: 'தமிழ் அவசர மின்னஞ்சல் (Tamil Voice)',
    speech:
      'அவசர வாடிக்கையாளர் மின்னஞ்சல் வரும்போது, உயர் முன்னுரிமை பணியை உருவாக்கி எனக்கு உடனடியாக தெரிவிக்கவும்.',
  },
];

export const GoalInput: React.FC<GoalInputProps> = ({
  onGenerate,
  generationState,
  currentGoalText,
  setCurrentGoalText,
}) => {
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSimulatingVoice, setIsSimulatingVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const simIntervalRef = useRef<any>(null);

  // Global shortcut ⌘+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      !currentGoalText.trim() ||
      generationState.stage === 'UNDERSTANDING' ||
      generationState.stage === 'PLANNING' ||
      generationState.stage === 'VALIDATING'
    ) {
      return;
    }
    onGenerate(currentGoalText);
  };

  const handleExampleSelect = (ex: ExampleGoal) => {
    setCurrentGoalText(ex.goal);
    onGenerate(ex.goal);
  };

  // Simulate spoken streaming dictation
  const simulateSpokenDictation = (text: string) => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setIsListening(true);
    setIsSimulatingVoice(true);
    setSpeechError(null);
    setVoiceTranscript('');

    const words = text.split(' ');
    let currentIdx = 0;

    simIntervalRef.current = setInterval(() => {
      if (currentIdx < words.length) {
        currentIdx += 2;
        const slice = words.slice(0, currentIdx).join(' ');
        setVoiceTranscript(slice);
        setCurrentGoalText(slice);
      } else {
        clearInterval(simIntervalRef.current);
        setIsListening(false);
        setIsSimulatingVoice(false);
        setVoiceTranscript(text);
        setCurrentGoalText(text);
      }
    }, 120);
  };

  // Web Speech API Voice Recognition
  const startVoiceRecognition = () => {
    setSpeechError(null);
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setIsSimulatingVoice(false);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Direct simulation if Web Speech is not supported
      simulateSpokenDictation(VOICE_PRESETS[0].speech);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const text = final || interim;
        setVoiceTranscript(text);
        if (final) {
          setCurrentGoalText(final);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError(
            'Microphone access is restricted in this browser window. Click a simulated voice preset below or edit directly.'
          );
        } else {
          setSpeechError(`Voice capture status: ${event.error}. You can use the presets below.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start speech recognition:', err);
      setSpeechError('Microphone not accessible. You can use the instant voice presets below.');
      setIsListening(false);
    }
  };

  const stopVoiceRecognition = () => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
    setIsSimulatingVoice(false);
  };

  const handleVoiceDelegate = () => {
    const goalToRun = (voiceTranscript || currentGoalText).trim();
    if (goalToRun) {
      stopVoiceRecognition();
      setCurrentGoalText(goalToRun);
      setShowVoiceModal(false);
      onGenerate(goalToRun);
    }
  };

  const isGenerating =
    generationState.stage === 'UNDERSTANDING' ||
    generationState.stage === 'PLANNING' ||
    generationState.stage === 'VALIDATING';

  return (
    <div className="w-full space-y-6">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2.5 pt-2 pb-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3.5 py-1 text-xs font-semibold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span>Goal Delegation • Zero Node-Wiring Required</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          What do you want <span className="text-indigo-600">AURA</span> to accomplish?
        </h1>

        <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
          Describe any lifestyle or business automation in natural language. AURA interprets your intent, compiles safe guardrails, and automates resilient execution.
        </p>
      </div>

      {/* Input Box Card with subtle elevation & blur */}
      <div className="relative max-w-4xl mx-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-sm opacity-10" />
        <div className="relative rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
            <textarea
              ref={textareaRef}
              value={currentGoalText}
              onChange={(e) => setCurrentGoalText(e.target.value)}
              disabled={isGenerating}
              rows={3}
              placeholder="e.g. Whenever I receive an urgent customer email, create a high-priority task, notify me, and make sure the task gets created even if my primary task service fails."
              className="w-full resize-none border-none bg-transparent p-1 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 disabled:opacity-60 font-sans"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />

            {/* Bottom Toolbar inside card */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2">
                {/* Voice Mic Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowVoiceModal(true);
                    setVoiceTranscript(currentGoalText);
                    startVoiceRecognition();
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors shadow-2xs"
                  title="Voice Goal Delegation"
                >
                  <Mic className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Voice Goal</span>
                </button>

                <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 font-mono">
                  <Command className="h-3 w-3" />
                  <span>Press ⌘+K to focus</span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isGenerating || !currentGoalText.trim()}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-100"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span>Planning Workflow...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze & Plan</span>
                    <ArrowRight className="h-4 w-4 ml-0.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Generation Progress Pipeline State */}
      {isGenerating && (
        <div className="max-w-4xl mx-auto rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800">
              <RotateCw className="h-4 w-4 animate-spin text-indigo-600" />
              <span>{generationState.message}</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase">
              {generationState.stage}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium mt-3">
            <div
              className={`rounded-lg p-2.5 border transition-all ${
                generationState.stage === 'UNDERSTANDING'
                  ? 'border-indigo-500 bg-white text-indigo-700 font-bold shadow-sm'
                  : 'border-slate-200 bg-white/60 text-slate-400'
              }`}
            >
              1. Understanding Intent
            </div>
            <div
              className={`rounded-lg p-2.5 border transition-all ${
                generationState.stage === 'PLANNING'
                  ? 'border-indigo-500 bg-white text-indigo-700 font-bold shadow-sm'
                  : 'border-slate-200 bg-white/60 text-slate-400'
              }`}
            >
              2. Designing Plan
            </div>
            <div
              className={`rounded-lg p-2.5 border transition-all ${
                generationState.stage === 'VALIDATING'
                  ? 'border-indigo-500 bg-white text-indigo-700 font-bold shadow-sm'
                  : 'border-slate-200 bg-white/60 text-slate-400'
              }`}
            >
              3. Safety Guardrails
            </div>
          </div>
        </div>
      )}

      {/* Error state banner */}
      {generationState.stage === 'ERROR' && generationState.error && (
        <div className="max-w-4xl mx-auto rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Generation Safety Notice</span>
            <p className="text-rose-700">{generationState.error}</p>
          </div>
        </div>
      )}

      {/* Example Goal Suggestions Matrix */}
      <div className="max-w-4xl mx-auto space-y-2.5 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Try Example Goals:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {EXAMPLE_GOALS.map((ex) => (
            <button
              key={ex.id}
              onClick={() => handleExampleSelect(ex)}
              disabled={isGenerating}
              className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all bg-white hover:shadow-md ${
                ex.isPrimaryDemo
                  ? 'border-indigo-300 ring-1 ring-indigo-200 hover:border-indigo-500'
                  : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      ex.isPrimaryDemo
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {ex.tag}
                  </span>
                  <span className="text-xs text-slate-400 group-hover:text-indigo-600 font-medium">
                    Run →
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-indigo-600 line-clamp-2">
                  "{ex.goal}"
                </p>
              </div>

              <p className="text-[11px] text-slate-400 mt-2 line-clamp-1 border-t border-slate-50 pt-1.5">
                {ex.expectedOutcome}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Voice Modal with Live Speech Audio Feedback & Resilient Fallback */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold">
                  <Volume2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Voice Goal Delegation
                  </h3>
                  <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase">
                    Live Microphone & Audio Synthesizer
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  stopVoiceRecognition();
                  setShowVoiceModal(false);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Audio Waveform Indicator */}
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-center space-y-3">
              <div className="flex items-center justify-center gap-1.5 h-10">
                {isListening ? (
                  <>
                    <span className="w-1.5 h-4 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-8 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-10 bg-indigo-600 rounded-full animate-bounce" />
                    <span className="w-1.5 h-6 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.2s]" />
                    <span className="w-1.5 h-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.4s]" />
                  </>
                ) : (
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                    <Radio className="h-4 w-4 text-slate-400" />
                    <span>Microphone standby</span>
                  </div>
                )}
              </div>

              <p className="text-xs font-bold text-slate-800">
                {isListening
                  ? isSimulatingVoice
                    ? 'Simulating spoken voice dictation...'
                    : 'Listening to your speech...'
                  : 'Speak into your mic or select a preset below'}
              </p>

              {/* Spoken Transcript Area */}
              <div className="rounded-lg bg-white p-3 border border-slate-200 text-left">
                <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Transcribed Goal:
                </span>
                <textarea
                  value={voiceTranscript || currentGoalText}
                  onChange={(e) => {
                    setVoiceTranscript(e.target.value);
                    setCurrentGoalText(e.target.value);
                  }}
                  rows={3}
                  placeholder="Speak your goal or click an instant voice prompt below..."
                  className="w-full resize-none border-none bg-transparent p-0 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 font-sans"
                />
              </div>

              {/* Informative notice if hardware mic is restricted */}
              {speechError && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-left text-xs text-amber-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Sandbox Audio Fallback</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-normal">
                    {speechError}
                  </p>
                </div>
              )}
            </div>

            {/* Instant Spoken Voice Presets */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                Instant Spoken Voice Prompts:
              </span>
              <div className="space-y-1.5">
                {VOICE_PRESETS.map((vp, idx) => (
                  <button
                    key={idx}
                    onClick={() => simulateSpokenDictation(vp.speech)}
                    className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-left hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-xs group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                        <Play className="h-3 w-3 fill-current" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {vp.label}
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">
                          "{vp.speech}"
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-600 font-bold shrink-0 ml-2">
                      Speak 🎙️
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Bottom Controls */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              {isListening ? (
                <button
                  type="button"
                  onClick={stopVoiceRecognition}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <MicOff className="h-4 w-4" />
                  <span>Pause Mic</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startVoiceRecognition}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Mic className="h-4 w-4 text-indigo-600" />
                  <span>{speechError ? 'Retry Mic' : 'Resume Mic'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleVoiceDelegate}
                disabled={!(voiceTranscript || currentGoalText).trim()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white transition-colors shadow-md shadow-indigo-100 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>Delegate Goal →</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
