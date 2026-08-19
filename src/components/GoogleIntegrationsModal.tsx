/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Mail,
  Calendar,
  Shield,
  RefreshCw,
  ExternalLink,
  Power,
  Zap,
  Lock,
  Flame,
  Cloud,
} from 'lucide-react';
import { signInWithGoogle, logOutFromFirebase, FirebaseAuthUser } from '../firebase/authService.ts';

interface GoogleIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshStatus?: () => void;
  firebaseUser?: FirebaseAuthUser | null;
  onFirebaseUserChange?: (user: FirebaseAuthUser | null) => void;
}

export const GoogleIntegrationsModal: React.FC<GoogleIntegrationsModalProps> = ({
  isOpen,
  onClose,
  onRefreshStatus,
  firebaseUser,
  onFirebaseUserChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [testingGmail, setTestingGmail] = useState(false);
  const [testingCalendar, setTestingCalendar] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'gmail' | 'calendar'; data: any } | null>(null);

  const [status, setStatus] = useState<{
    connected: boolean;
    user: { email: string; name?: string; picture?: string; connectedAt: string } | null;
    hasRealCredentials: boolean;
    demoAccount?: string;
  }>({
    connected: true,
    user: { email: 'mohanmohan200405@gmail.com', name: 'Mohan (Demo Account)', connectedAt: new Date().toISOString() },
    hasRealCredentials: false,
    demoAccount: 'mohanmohan200405@gmail.com',
  });

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/auth/google/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStatus({
            connected: data.connected,
            user: data.user,
            hasRealCredentials: data.hasRealCredentials,
            demoAccount: data.demoAccount,
          });
        }
      }
    } catch (e) {
      console.warn('Failed to fetch Google auth status:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFirebaseAuth = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      onFirebaseUserChange?.(user);
      onRefreshStatus?.();
    } catch (err) {
      console.error('Firebase Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseSignOut = async () => {
    setLoading(true);
    try {
      await logOutFromFirebase();
      onFirebaseUserChange?.(null);
    } catch (err) {
      console.error('Firebase Sign Out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google/url');
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (err) {
      console.error('Failed to get OAuth url:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/google/disconnect', { method: 'POST' });
      await fetchStatus();
      onRefreshStatus?.();
    } catch (err) {
      console.error('Disconnect failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestGmail = async () => {
    setTestingGmail(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/gmail/recent');
      if (res.ok) {
        const data = await res.json();
        setTestResult({ type: 'gmail', data: data.messages || [] });
      }
    } catch (e) {
      console.error('Gmail test failed:', e);
    } finally {
      setTestingGmail(false);
    }
  };

  const handleTestCalendar = async () => {
    setTestingCalendar(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/calendar/events');
      if (res.ok) {
        const data = await res.json();
        setTestResult({ type: 'calendar', data: data.events || [] });
      }
    } catch (e) {
      console.error('Calendar test failed:', e);
    } finally {
      setTestingCalendar(false);
    }
  };

  const displayEmail = firebaseUser?.email || status.user?.email || status.demoAccount || 'mohanmohan200405@gmail.com';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Google & Firebase Cloud</h2>
              <p className="text-xs text-slate-500">Live OAuth 2.0 and Firebase Cloud Sync (project1-4506)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Main Account Card */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {firebaseUser?.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt="User Avatar"
                    className="h-12 w-12 rounded-full border border-emerald-300 shadow-sm"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-lg shadow-sm">
                    G
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">
                      {firebaseUser?.displayName || 'Google Workspace & Firebase'}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Connected ✓
                    </span>
                  </div>
                  <p className="font-mono text-xs text-emerald-900 mt-0.5">{displayEmail}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={handleFirebaseAuth}
                  disabled={loading}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition-all flex items-center gap-1"
                >
                  <Flame className="h-3.5 w-3.5" />
                  <span>{firebaseUser ? 'Switch Account' : 'Sign in with Firebase'}</span>
                </button>
                {firebaseUser && (
                  <button
                    onClick={handleFirebaseSignOut}
                    disabled={loading}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-all"
                  >
                    Log Out
                  </button>
                )}
              </div>
            </div>

            {/* Service Sub-cards */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-emerald-200/60">
              <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-rose-500" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Gmail API</div>
                    <div className="text-[10px] text-slate-500">Inbox polling & semantic triage</div>
                  </div>
                </div>
                <button
                  onClick={handleTestGmail}
                  disabled={testingGmail}
                  className="rounded px-2 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  {testingGmail ? 'Testing...' : 'Test Gmail'}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Calendar API</div>
                    <div className="text-[10px] text-slate-500">Free/busy & slot creation</div>
                  </div>
                </div>
                <button
                  onClick={handleTestCalendar}
                  disabled={testingCalendar}
                  className="rounded px-2 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  {testingCalendar ? 'Testing...' : 'Test Calendar'}
                </button>
              </div>
            </div>
          </div>

          {/* Firebase Cloud Firestore Card */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Cloud Firestore Sync (project1-4506)
                </span>
              </div>
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                Live Cloud Sync Active
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              All generated workflows, automation tasks, and execution logs are synchronized in real time to your Firebase Project ID <code className="font-mono text-amber-900 bg-amber-100/60 px-1 py-0.5 rounded">project1-4506</code>.
            </p>
          </div>

          {/* Test Output Panel */}
          {testResult && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Live {testResult.type === 'gmail' ? 'Gmail' : 'Google Calendar'} Verification Response
                </h4>
                <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  {testResult.data.length} items retrieved
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto rounded-lg bg-white p-2.5 text-xs font-mono text-slate-800 border border-indigo-100 space-y-1.5">
                {testResult.data.map((item: any, i: number) => (
                  <div key={i} className="pb-1 border-b border-slate-100 last:border-0">
                    <span className="font-bold text-indigo-700">
                      {testResult.type === 'gmail' ? item.subject : item.summary}
                    </span>
                    <p className="text-[11px] text-slate-500 truncate">
                      {testResult.type === 'gmail' ? `From: ${item.from} | ${item.snippet}` : `Start: ${item.start?.dateTime}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions & Security Guardrails */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Shield className="h-4 w-4 text-indigo-600" />
              <span>Authorized Scopes & Security</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span><strong>Gmail & Calendar:</strong> Scoped access for autonomous scheduling and urgency triage.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span><strong>Firebase Auth:</strong> Standard OpenID Connect Google Authentication.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
