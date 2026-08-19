/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { assertEqual, assertTrue } from '../helpers/testHarness.ts';
import { generateWorkflowFromGoal } from '../../src/server/geminiService.ts';
import { generateClientWorkflow } from '../../src/workflow/clientFallback.ts';

export async function testTamilNlpEngine(): Promise<void> {
  // 1. Test Tamil Urgent Triage Goal (Native Tamil Script)
  const tamilUrgentGoal =
    'அவசர வாடிக்கையாளர் மின்னஞ்சல் வரும்போது, உயர் முன்னுரிமை பணியை உருவாக்கி எனக்கு உடனடியாக தெரிவிக்கவும்.';
  
  const wf1 = await generateWorkflowFromGoal(tamilUrgentGoal);
  assertEqual(wf1.trigger.type, 'EMAIL_RECEIVED', 'Tamil email keyword must resolve to EMAIL_RECEIVED');
  assertTrue(wf1.actions.some((a) => a.type === 'CREATE_TASK'), 'Must generate CREATE_TASK for Tamil பணி');
  assertTrue(wf1.actions.some((a) => a.type === 'SEND_NOTIFICATION'), 'Must generate SEND_NOTIFICATION for Tamil தெரிவிக்கவும்');
  assertEqual(wf1.verification.type, 'TASK_EXISTS', 'Must verify task creation outcome');

  // 2. Test Tamil Scheduled Summary Goal (திங்கட்கிழமை / Monday)
  const tamilScheduleGoal =
    'ஒவ்வொரு திங்கட்கிழமையும் காலை 9 மணிக்கு எனது திட்டங்களின் சுருக்கத்தை உருவாக்கி அனுப்பவும்.';
  
  const wf2 = await generateWorkflowFromGoal(tamilScheduleGoal);
  assertEqual(wf2.trigger.type, 'SCHEDULE', 'Tamil திங்கள் must resolve to SCHEDULE trigger');
  assertTrue(wf2.actions.some((a) => a.type === 'GENERATE_SUMMARY'), 'Must generate GENERATE_SUMMARY for Tamil சுருக்கம்');

  // 3. Test Tanglish (Tamil in Latin script)
  const tanglishGoal = 'Avasaram customer email vantha udane oru task create panni arivippu anuppavum';
  const wf3 = generateClientWorkflow(tanglishGoal);
  assertEqual(wf3.trigger.type, 'EMAIL_RECEIVED', 'Tanglish email must resolve to EMAIL_RECEIVED');
  assertTrue(wf3.actions.some((a) => a.type === 'CREATE_TASK'), 'Tanglish task must resolve to CREATE_TASK');
}
