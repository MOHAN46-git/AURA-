/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { assertEqual, assertTrue, assertFalse } from '../helpers/testHarness.ts';
import {
  getGoogleConnectionStatus,
  getGoogleOAuthUrl,
} from '../../src/server/googleAuthService.ts';
import {
  findAvailableSlot,
  createGoogleCalendarEvent,
  verifyGoogleCalendarEvent,
} from '../../src/server/googleCalendarService.ts';
import { classifyEmailSemantic } from '../../src/server/googleGmailService.ts';
import {
  primaryTaskProvider,
  backupTaskProvider,
  setPrimaryFailureSimulation,
  verifyTaskOutcome,
} from '../../src/server/taskService.ts';
import { explainExecutionAuditTrail } from '../../src/server/explanationService.ts';

export async function testGoogleAndTaskIntegration(): Promise<void> {
  // 1. Google OAuth Status & Scopes Check
  const authStatus = getGoogleConnectionStatus();
  assertTrue(authStatus.connected, 'Google service must be connected for demo');
  assertTrue(authStatus.scopes.some((s) => s.includes('calendar')), 'Must contain calendar scope');
  assertTrue(authStatus.scopes.some((s) => s.includes('gmail')), 'Must contain gmail scope');

  // 2. Google Calendar Conflict Slot Finder
  // Should resolve afternoon slot and avoid 14:00 - 15:00 conflict
  const slotRes = await findAvailableSlot(1, 30, 'afternoon');
  assertTrue(Boolean(slotRes.proposedSlot), 'Must propose an available slot');
  assertTrue(slotRes.proposedSlot!.durationMinutes === 30, 'Must match 30m duration');
  assertTrue(slotRes.hasConflict, 'Must detect existing 2-3 PM conflict on test schedule');

  // 3. Calendar Event Creation & Independent Verification
  const tomorrow = new Date(Date.now() + 86400000);
  const startStr = new Date(tomorrow.setHours(15, 30, 0, 0)).toISOString();
  const endStr = new Date(tomorrow.setHours(16, 0, 0, 0)).toISOString();

  const createdEvent = await createGoogleCalendarEvent({
    summary: 'Hackathon Project Review with Judges',
    description: 'Autonomous conflict-free scheduling test',
    start: startStr,
    end: endStr,
  });

  assertTrue(Boolean(createdEvent.id), 'Calendar event must return an ID');
  const verifyCalRes = await verifyGoogleCalendarEvent(createdEvent.id);
  assertTrue(verifyCalRes.verified, 'Independent outcome verification must confirm event existence');
  assertEqual(verifyCalRes.event?.summary, 'Hackathon Project Review with Judges');

  // 4. Gmail Semantic Urgency Classification
  const paymentEmail = classifyEmailSemantic(
    'Payment system unavailable',
    'Our team cannot process customer payments and the production service is currently down.'
  );
  assertTrue(paymentEmail.isUrgent, 'Payment outage must classify as urgent');
  assertEqual(paymentEmail.classification, 'URGENT_CUSTOMER_REQUEST');
  assertTrue(paymentEmail.confidence >= 0.9, 'Urgency confidence must be >= 0.90');

  const newsletterEmail = classifyEmailSemantic(
    'Weekly Engineering Digest #42',
    'Here are the top articles on system resilience and cloud automation this week.'
  );
  assertFalse(newsletterEmail.isUrgent, 'Newsletter must not classify as urgent');
  assertEqual(newsletterEmail.classification, 'NEWSLETTER');

  // 5. Normal Primary Task Creation & Verification
  setPrimaryFailureSimulation(false);
  const primaryRes = await primaryTaskProvider.createTask({
    title: 'Process VIP Customer Inquiry',
    priority: 'HIGH',
    source: 'Gmail',
  });
  assertTrue(primaryRes.success, 'Primary task creation must succeed when simulation is off');
  assertEqual(primaryRes.providerName, 'PRIMARY_TASK_PROVIDER');

  const taskVerifyRes = verifyTaskOutcome(primaryRes.task!.id);
  assertTrue(taskVerifyRes.verified, 'Task outcome must be independently verified in store');

  // 6. Resilient Failure Injection & Failover Route
  setPrimaryFailureSimulation(true);
  let primaryFailed = false;
  try {
    await primaryTaskProvider.createTask({
      title: 'Urgent Payment Incident Ticket',
      priority: 'CRITICAL',
    });
  } catch (err: any) {
    primaryFailed = true;
    assertEqual(err.status, 503, 'Primary failure must return HTTP 503');
    assertEqual(err.code, 'SERVICE_UNAVAILABLE', 'Primary failure code must be SERVICE_UNAVAILABLE');
  }
  assertTrue(primaryFailed, 'Primary task provider must throw simulated 503 failure');

  // Execute Fallback Route to Backup Provider
  const backupRes = await backupTaskProvider.createTask({
    title: 'Urgent Payment Incident Ticket',
    priority: 'CRITICAL',
    source: 'Gmail (Failover Route)',
  });
  assertTrue(backupRes.success, 'Backup provider must successfully create task');
  assertEqual(backupRes.providerName, 'BACKUP_TASK_PROVIDER');

  // Reset simulation state
  setPrimaryFailureSimulation(false);

  // 7. Natural Language Execution Explainer
  const auditEvents: any[] = [
    {
      id: 'e1',
      sequence: 1,
      timestamp: new Date().toISOString(),
      eventType: 'PRIMARY_ACTION_FAILED',
      title: 'Primary Task Provider Failed',
      message: 'HTTP 503 Service Unavailable',
      status: 'ERROR',
    },
    {
      id: 'e2',
      sequence: 2,
      timestamp: new Date().toISOString(),
      eventType: 'FALLBACK_EXECUTED',
      title: 'Backup Task Provider Executed',
      message: 'Task created via Backup Provider',
      status: 'SUCCESS',
    },
    {
      id: 'e3',
      sequence: 3,
      timestamp: new Date().toISOString(),
      eventType: 'GOAL_ACHIEVED',
      title: 'Goal Achieved',
      message: 'Verified in persistent store',
      status: 'SUCCESS',
    },
  ];

  const explanation = explainExecutionAuditTrail(
    'Why did AURA use the backup provider?',
    auditEvents,
    'Urgent Email Handler'
  );
  assertTrue(explanation.evidenceBased, 'Explanation must be evidence-based');
  assertTrue(explanation.recoveryOccurred, 'Must detect that recovery occurred');
  assertTrue(explanation.summary.includes('Backup Provider') || explanation.summary.includes('backup provider'));
}
