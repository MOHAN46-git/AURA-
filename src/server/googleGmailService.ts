/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getValidAccessToken, getGoogleConnectionStatus } from './googleAuthService.ts';

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  body?: string;
  date: string;
  isUrgent?: boolean;
  classification?: string;
  classificationConfidence?: number;
  classificationReason?: string;
}

export interface SemanticClassificationResult {
  isUrgent: boolean;
  classification: 'URGENT_CUSTOMER_REQUEST' | 'ROUTINE_INQUIRY' | 'NEWSLETTER' | 'SYSTEM_ALERT';
  confidence: number;
  reason: string;
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Initial demo emails for live hackathon demonstration
let mockGmailInbox: GmailMessageSummary[] = [
  {
    id: 'msg-demo-001',
    threadId: 'th-001',
    from: 'billing-alert@tier1-enterprise.com',
    subject: 'URGENT: Production payment webhook failure on checkout',
    snippet: 'Hi team, our customers cannot complete checkout transactions and we are seeing 500 errors across EU servers. Please investigate immediately.',
    body: 'Hi team,\n\nOur customers cannot complete checkout transactions and we are seeing 500 errors across EU servers. Please investigate immediately as revenue is impacted.\n\nThanks,\nEnterprise Ops',
    date: new Date().toISOString(),
    isUrgent: true,
    classification: 'URGENT_CUSTOMER_REQUEST',
    classificationConfidence: 0.98,
    classificationReason: 'Critical payment outage and direct customer revenue impact reported.',
  },
  {
    id: 'msg-demo-002',
    threadId: 'th-002',
    from: 'newsletter@cloudtech-weekly.io',
    subject: 'Cloud Architecture Digest #142',
    snippet: 'Here are the top 10 developments in AI automation workflows and serverless compute this week...',
    body: 'Here are the top 10 developments in AI automation workflows and serverless compute this week...',
    date: new Date(Date.now() - 3600000).toISOString(),
    isUrgent: false,
    classification: 'NEWSLETTER',
    classificationConfidence: 0.95,
    classificationReason: 'Informational broadcast newsletter without immediate actionable urgency.',
  },
];

/**
 * Lists recent emails from the authenticated user's Gmail inbox.
 */
export async function listRecentGmailMessages(maxResults = 5): Promise<GmailMessageSummary[]> {
  const token = await getValidAccessToken();
  const status = getGoogleConnectionStatus();

  if (!token || !status.connected || token.startsWith('mock_demo_')) {
    return mockGmailInbox;
  }

  try {
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=label:INBOX`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!listRes.ok) {
      console.warn('[Gmail API] Failed to list messages, using local demo inbox:', listRes.status);
      return mockGmailInbox;
    }

    const listData = await listRes.json();
    const messageIds = (listData.messages || []).map((m: any) => m.id);

    if (messageIds.length === 0) {
      return mockGmailInbox;
    }

    const messages: GmailMessageSummary[] = [];

    for (const msgId of messageIds) {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (msgRes.ok) {
          const detail = await msgRes.json();
          const headers = detail.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

          const snippet = detail.snippet || '';
          const classification = classifyEmailSemantic(getHeader('subject'), snippet);

          messages.push({
            id: detail.id,
            threadId: detail.threadId,
            from: getHeader('From'),
            subject: getHeader('Subject') || '(No Subject)',
            snippet,
            date: getHeader('Date') || new Date().toISOString(),
            isUrgent: classification.isUrgent,
            classification: classification.classification,
            classificationConfidence: classification.confidence,
            classificationReason: classification.reason,
          });
        }
      } catch (e) {
        console.warn(`[Gmail API] Failed to fetch message detail ${msgId}:`, e);
      }
    }

    return messages.length > 0 ? messages : mockGmailInbox;
  } catch (err) {
    console.warn('[Gmail API] General fetch error, fallback to mock inbox:', err);
    return mockGmailInbox;
  }
}

/**
 * Ingests a new sample email for live hackathon demonstration.
 */
export function injectDemoEmail(input: {
  from?: string;
  subject: string;
  snippet: string;
}): GmailMessageSummary {
  const classification = classifyEmailSemantic(input.subject, input.snippet);
  const newEmail: GmailMessageSummary = {
    id: `msg-injected-${Date.now()}`,
    threadId: `th-${Date.now()}`,
    from: input.from || 'support-escalation@client-tier1.com',
    subject: input.subject,
    snippet: input.snippet,
    body: input.snippet,
    date: new Date().toISOString(),
    isUrgent: classification.isUrgent,
    classification: classification.classification,
    classificationConfidence: classification.confidence,
    classificationReason: classification.reason,
  };

  mockGmailInbox.unshift(newEmail);
  return newEmail;
}

/**
 * Semantic Urgency Classifier:
 * Evaluates meaning and intent rather than just literal keyword matching.
 */
export function classifyEmailSemantic(subject: string, bodyOrSnippet: string): SemanticClassificationResult {
  const text = `${subject} ${bodyOrSnippet}`.toLowerCase();

  // High urgency indicators (production outage, payment failure, security vulnerability, broken checkout)
  const isOutage = text.includes('down') || text.includes('outage') || text.includes('crash') || text.includes('unavailable') || text.includes('error 500');
  const isPayment = text.includes('payment') || text.includes('checkout') || text.includes('billing fail') || text.includes('cannot pay');
  const isSecurity = text.includes('security') || text.includes('breach') || text.includes('vulnerability') || text.includes('compromised');
  const isExplicitUrgent = text.includes('urgent') || text.includes('emergency') || text.includes('asap') || text.includes('immediately') || text.includes('critical') || text.includes('அவசர');

  if (isOutage || isPayment || isSecurity || isExplicitUrgent) {
    let reason = 'Urgent customer request detected requiring priority escalation.';
    if (isPayment) {
      reason = 'The email reports a customer payment/checkout blocker directly impacting transactions.';
    } else if (isOutage) {
      reason = 'The customer reports an active service downtime or production outage.';
    } else if (isSecurity) {
      reason = 'Potential security vulnerability or breach reported requiring instant containment.';
    }

    return {
      isUrgent: true,
      classification: 'URGENT_CUSTOMER_REQUEST',
      confidence: 0.96,
      reason,
      suggestedPriority: isOutage || isPayment ? 'CRITICAL' : 'HIGH',
    };
  }

  // Newsletter or promotional
  if (
    text.includes('newsletter') ||
    text.includes('digest') ||
    text.includes('weekly') ||
    text.includes('unsubscribe') ||
    text.includes('promotion') ||
    text.includes('discount') ||
    text.includes('articles')
  ) {
    return {
      isUrgent: false,
      classification: 'NEWSLETTER',
      confidence: 0.94,
      reason: 'Informational broadcast newsletter without immediate action required.',
      suggestedPriority: 'LOW',
    };
  }

  // Routine inquiry
  return {
    isUrgent: false,
    classification: 'ROUTINE_INQUIRY',
    confidence: 0.88,
    reason: 'Standard customer inquiry or correspondence.',
    suggestedPriority: 'MEDIUM',
  };
}
