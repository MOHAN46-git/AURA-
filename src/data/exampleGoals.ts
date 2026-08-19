/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExampleGoal {
  id: string;
  title: string;
  goal: string;
  tag: string;
  isPrimaryDemo?: boolean;
  expectedOutcome: string;
}

export const EXAMPLE_GOALS: ExampleGoal[] = [
  {
    id: 'demo-primary',
    title: 'Urgent Customer Email & Resilient Task Failover',
    goal: 'Whenever I receive an urgent customer email, create a high-priority task, notify me, and make sure the task gets created even if my primary task service fails.',
    tag: 'Hackathon Demo ★',
    isPrimaryDemo: true,
    expectedOutcome: 'Zero-downtime task creation with auto-retry and failover to backup provider.',
  },
  {
    id: 'demo-2',
    title: 'Urgent Email Alert & Task',
    goal: 'Whenever I receive an urgent customer email, create a high-priority task and notify me.',
    tag: 'Triage & Alerts',
    expectedOutcome: 'Classifies urgent customer messages and dispatches instant push notification.',
  },
  {
    id: 'demo-3',
    title: 'Monday Weekly Briefing',
    goal: 'Every Monday morning, prepare a summary of my project updates.',
    tag: 'Executive Summary',
    expectedOutcome: 'Scheduled synthesis of Jira, GitHub, and doc updates at 9:00 AM.',
  },
  {
    id: 'demo-4',
    title: 'Conflict-Free Calendar Booking',
    goal: 'Schedule a meeting tomorrow afternoon without conflicting with anything already on my calendar.',
    tag: 'Smart Scheduling',
    expectedOutcome: 'Evaluates free/busy windows and reserves optimal 45m discussion slot.',
  },
  {
    id: 'demo-5',
    title: 'Multi-Tier Task Failover',
    goal: 'If task creation fails, retry twice and then use my backup task service.',
    tag: 'Fault-Tolerance',
    expectedOutcome: 'Exponential backoff retry with automatic failover route.',
  },
  {
    id: 'demo-6',
    title: 'Strict External Email Approval Gate',
    goal: 'Never send external emails without asking me first.',
    tag: 'Safety Guardrail',
    expectedOutcome: 'Enforces human-in-the-loop review policy before outbound SMTP dispatch.',
  },
  {
    id: 'demo-tamil-1',
    title: 'அவசர மின்னஞ்சல் & பணி உருவாக்கம் (Tamil Triage)',
    goal: 'அவசர வாடிக்கையாளர் மின்னஞ்சல் வரும்போது, உயர் முன்னுரிமை பணியை உருவாக்கி எனக்கு உடனடியாக தெரிவிக்கவும்.',
    tag: 'தமிழ் NLP ★',
    expectedOutcome: 'Processes Tamil intent: detects urgent email, creates high-priority task, and sends push notification.',
  },
  {
    id: 'demo-tamil-2',
    title: 'திங்கட்கிழமை திட்ட அறிக்கை (Monday Tamil Summary)',
    goal: 'ஒவ்வொரு திங்கட்கிழமையும் காலை 9 மணிக்கு எனது திட்டங்களின் சுருக்கத்தை உருவாக்கி அனுப்பவும்.',
    tag: 'தமிழ் Schedule',
    expectedOutcome: 'Schedules weekly Monday 9 AM summary in Tamil NLP.',
  },
];
