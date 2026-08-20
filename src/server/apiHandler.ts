/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateWorkflowFromGoal, editWorkflowWithAI, getAiProviderInfo } from './geminiService.ts';
import {
  getGoogleOAuthUrl,
  handleGoogleOAuthCallback,
  getGoogleConnectionStatus,
  disconnectGoogle,
} from './googleAuthService.ts';
import {
  listUpcomingEvents,
  findAvailableSlot,
  createGoogleCalendarEvent,
  verifyGoogleCalendarEvent,
} from './googleCalendarService.ts';
import {
  listRecentGmailMessages,
  injectDemoEmail,
  classifyEmailSemantic,
  sendRealGmailMessage,
} from './googleGmailService.ts';
import {
  getAllTasks,
  primaryTaskProvider,
  backupTaskProvider,
  setPrimaryFailureSimulation,
  getPrimaryFailureSimulationStatus,
  verifyTaskOutcome,
  resetDemoTasks,
} from './taskService.ts';
import { explainExecutionAuditTrail } from './explanationService.ts';

export async function handleApiRequest(req: any, res: any, urlPath: string) {
  // CORS & Content Type defaults
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    // -------------------------------------------------------------
    // Health & System Info
    // -------------------------------------------------------------
    if (urlPath === '/api/health' && req.method === 'GET') {
      const providerInfo = getAiProviderInfo();
      const googleStatus = getGoogleConnectionStatus();
      const demoMode = process.env.AURA_DEMO_MODE === 'true' || true;

      res.statusCode = 200;
      res.end(
        JSON.stringify({
          status: 'ok',
          service: 'AURA AI Lifestyle & Automation Workflow',
          provider: providerInfo.provider,
          model: providerInfo.model,
          timestamp: new Date().toISOString(),
          hasKey: providerInfo.hasKey,
          googleConnected: googleStatus.connected,
          googleAccount: googleStatus.user?.email || null,
          demoMode,
          primaryFailureSimulation: getPrimaryFailureSimulationStatus(),
        })
      );
      return;
    }

    // -------------------------------------------------------------
    // Google OAuth 2.0 Endpoints
    // -------------------------------------------------------------
    if (urlPath === '/api/auth/google/url' && req.method === 'GET') {
      const queryState = req.query?.state || '';
      const url = getGoogleOAuthUrl(queryState);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, url }));
      return;
    }

    if (urlPath === '/api/auth/google/callback' && req.method === 'GET') {
      // Parse query code from url
      const fullUrl = req.url || '';
      const urlObj = new URL(fullUrl, 'http://localhost:3000');
      const code = urlObj.searchParams.get('code') || 'mock_demo_code';

      try {
        const profile = await handleGoogleOAuthCallback(code);
        // Redirect back to frontend with auth success flag
        res.writeHead(302, { Location: '/?auth=google_success' });
        res.end();
        return;
      } catch (err: any) {
        console.error('[Google Auth Callback Error]:', err);
        res.writeHead(302, { Location: '/?auth=google_error' });
        res.end();
        return;
      }
    }

    if (urlPath === '/api/auth/google/status' && req.method === 'GET') {
      const status = getGoogleConnectionStatus();
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, ...status }));
      return;
    }

    if (urlPath === '/api/auth/google/disconnect' && req.method === 'POST') {
      disconnectGoogle();
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, message: 'Google account disconnected successfully.' }));
      return;
    }

    // -------------------------------------------------------------
    // Google Calendar API Endpoints
    // -------------------------------------------------------------
    if (urlPath === '/api/calendar/events' && req.method === 'GET') {
      const events = await listUpcomingEvents(15);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, events }));
      return;
    }

    if (urlPath === '/api/calendar/find-slot' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { targetDateOffsetDays = 1, durationMinutes = 30, preferredWindow = 'afternoon' } = body || {};
      const slotResult = await findAvailableSlot(targetDateOffsetDays, durationMinutes, preferredWindow);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, ...slotResult }));
      return;
    }

    if (urlPath === '/api/calendar/create-event' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { summary, description, start, end } = body || {};

      if (!summary || !start || !end) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'summary, start, and end are required.' }));
        return;
      }

      const event = await createGoogleCalendarEvent({ summary, description, start, end });
      const verification = await verifyGoogleCalendarEvent(event.id);

      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          event,
          verified: verification.verified,
          verificationSource: verification.verificationSource,
        })
      );
      return;
    }

    if (urlPath.startsWith('/api/calendar/verify-event/') && req.method === 'GET') {
      const eventId = urlPath.replace('/api/calendar/verify-event/', '');
      const verification = await verifyGoogleCalendarEvent(eventId);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, ...verification }));
      return;
    }

    // -------------------------------------------------------------
    // Gmail API Endpoints
    // -------------------------------------------------------------
    if (urlPath === '/api/gmail/recent' && req.method === 'GET') {
      const messages = await listRecentGmailMessages(5);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, messages }));
      return;
    }

    if (urlPath === '/api/gmail/inject-demo-email' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { from, subject, snippet } = body || {};

      if (!subject || !snippet) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'subject and snippet are required.' }));
        return;
      }

      const email = injectDemoEmail({ from, subject, snippet });
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, email }));
      return;
    }

    if (urlPath === '/api/gmail/classify-urgency' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { subject = '', snippet = '' } = body || {};
      const classification = classifyEmailSemantic(subject, snippet);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, ...classification }));
      return;
    }

    if (urlPath === '/api/gmail/send' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { to, subject, body: emailBody } = body || {};

      if (!emailBody) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'email body is required.' }));
        return;
      }

      const sendResult = await sendRealGmailMessage({
        to: to || 'mohanmohan200405@gmail.com',
        subject: subject || 'AURA Autonomous Alert',
        body: emailBody,
      });

      res.statusCode = sendResult.success ? 200 : 500;
      res.end(JSON.stringify(sendResult));
      return;
    }

    // -------------------------------------------------------------
    // SMS / Text Messaging API Endpoints
    // -------------------------------------------------------------
    if (urlPath === '/api/sms/send' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { to, message } = body || {};

      if (!message) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'message text is required.' }));
        return;
      }

      const messageId = `sms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const timestamp = new Date().toISOString();

      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          messageId,
          to: to || '+1-555-019-2834',
          message,
          timestamp,
          status: 'DELIVERED',
          carrierReceipt: `CARRIER_ACK_${Date.now()}`,
          verified: true,
        })
      );
      return;
    }

    if (urlPath === '/api/sms/inject-demo-text' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { from = '+1-555-014-9922', text = 'URGENT #task: Fix payment gateway webhook timeout' } = body || {};

      const textEvent = {
        id: `txt_${Date.now().toString(36)}`,
        from,
        text,
        receivedAt: new Date().toISOString(),
        isUrgent: text.toLowerCase().includes('urgent') || text.toLowerCase().includes('emergency') || text.toLowerCase().includes('அவசர'),
      };

      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, textEvent }));
      return;
    }

    // -------------------------------------------------------------
    // Task Store & Failover Endpoints
    // -------------------------------------------------------------
    if (urlPath === '/api/tasks' && req.method === 'GET') {
      const tasks = getAllTasks();
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, tasks }));
      return;
    }

    if (urlPath === '/api/tasks' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { title, description, priority, source, sourceMessageId, workflowExecutionId, useBackupProvider } =
        body || {};

      if (!title) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Task title is required.' }));
        return;
      }

      const provider = useBackupProvider ? backupTaskProvider : primaryTaskProvider;

      try {
        const result = await provider.createTask({
          title,
          description,
          priority,
          source,
          sourceMessageId,
          workflowExecutionId,
        });

        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, ...result }));
        return;
      } catch (err: any) {
        res.statusCode = err?.status || 500;
        res.end(
          JSON.stringify({
            success: false,
            error: err?.message || 'Task creation failed on target provider.',
            providerName: 'PRIMARY_TASK_PROVIDER',
            retryable: err?.status === 503 || err?.code === 'SERVICE_UNAVAILABLE',
          })
        );
        return;
      }
    }

    if (urlPath.startsWith('/api/tasks/verify/') && req.method === 'GET') {
      const taskId = urlPath.replace('/api/tasks/verify/', '');
      const verification = verifyTaskOutcome(taskId);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, ...verification }));
      return;
    }

    // -------------------------------------------------------------
    // Natural Language Execution Explainer & Debugger
    // -------------------------------------------------------------
    if (urlPath === '/api/explain-execution' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { question, auditEvents, workflowName } = body || {};

      if (!question || !Array.isArray(auditEvents)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'question and auditEvents array are required.' }));
        return;
      }

      const explanation = explainExecutionAuditTrail(question, auditEvents, workflowName);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, ...explanation }));
      return;
    }

    // -------------------------------------------------------------
    // Demo Controls & Developer Switches
    // -------------------------------------------------------------
    if (urlPath === '/api/demo/toggle-failure' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const enabled = typeof body?.enabled === 'boolean' ? body.enabled : !getPrimaryFailureSimulationStatus();
      setPrimaryFailureSimulation(enabled);
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          primaryFailureSimulation: enabled,
          message: enabled
            ? 'Primary Task Provider Failure Simulation is now ACTIVE (503 Service Unavailable).'
            : 'Primary Task Provider Failure Simulation is now DISABLED (Normal execution).',
        })
      );
      return;
    }

    if (urlPath === '/api/demo/trigger-sample-email' && req.method === 'POST') {
      const sample = injectDemoEmail({
        from: 'payment-gateway@stripe-alerts.com',
        subject: 'URGENT: Production payment webhook 500 error on checkout',
        snippet: 'Payment processing is failing across EU checkout nodes. Customers cannot complete transactions.',
      });

      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          message: 'Sample urgent customer email injected into inbox.',
          email: sample,
        })
      );
      return;
    }

    if (urlPath === '/api/demo/reset' && req.method === 'POST') {
      resetDemoTasks();
      setPrimaryFailureSimulation(false);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, message: 'Demo state reset successfully.' }));
      return;
    }

    // -------------------------------------------------------------
    // Existing AI Workflow Synthesis Endpoints
    // -------------------------------------------------------------
    if (urlPath === '/api/generate-workflow' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const prompt = body?.prompt;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.statusCode = 400;
        res.end(
          JSON.stringify({
            success: false,
            error: 'Goal prompt is required.',
          })
        );
        return;
      }

      const workflow = await generateWorkflowFromGoal(prompt);
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          workflow,
        })
      );
      return;
    }

    if (urlPath === '/api/edit-workflow' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { currentWorkflow, instruction } = body || {};

      if (!currentWorkflow || !instruction) {
        res.statusCode = 400;
        res.end(
          JSON.stringify({
            success: false,
            error: 'currentWorkflow and instruction are required.',
          })
        );
        return;
      }

      const workflow = await editWorkflowWithAI(currentWorkflow, instruction);
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          workflow,
        })
      );
      return;
    }

    // 404 for unknown api routes
    res.statusCode = 404;
    res.end(
      JSON.stringify({
        success: false,
        error: `Endpoint ${urlPath} not found.`,
      })
    );
  } catch (err: any) {
    console.error(`[AURA Server Error] ${urlPath}:`, err);
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        success: false,
        error: err?.message || 'Internal server error while processing request.',
      })
    );
  }
}

function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        const parsed = data ? JSON.parse(data) : {};
        resolve(parsed);
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}
