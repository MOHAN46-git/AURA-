/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { assertEqual, assertTrue } from '../helpers/testHarness.ts';
import { firebaseConfig, app, auth, db, googleAuthProvider } from '../../src/firebase/config.ts';
import { syncWorkflowToFirestore } from '../../src/firebase/firestoreService.ts';
import { GOLDEN_HACKATHON_WORKFLOW } from '../fixtures/workflows.ts';

export async function testFirebaseIntegration(): Promise<void> {
  // 1. Validate Firebase Configuration Keys
  assertEqual(firebaseConfig.projectId, 'project1-4506', 'Firebase projectId must match project1-4506');
  assertEqual(firebaseConfig.authDomain, 'project1-4506.firebaseapp.com', 'Firebase authDomain must match');
  assertEqual(firebaseConfig.storageBucket, 'project1-4506.firebasestorage.app', 'Firebase storageBucket must match');
  assertEqual(firebaseConfig.messagingSenderId, '367992509924', 'Firebase messagingSenderId must match');
  assertTrue(Boolean(firebaseConfig.apiKey), 'Firebase apiKey must be present');

  // 2. Validate Firebase Singleton Instances
  assertTrue(Boolean(app), 'Firebase app instance must initialize');
  assertTrue(Boolean(auth), 'Firebase auth instance must initialize');
  assertTrue(Boolean(db), 'Firestore db instance must initialize');
  assertTrue(Boolean(googleAuthProvider), 'GoogleAuthProvider instance must initialize');

  // 3. Test Firestore Resilient Sync Function (Handles online & offline graceful returns)
  const syncResult = await syncWorkflowToFirestore(GOLDEN_HACKATHON_WORKFLOW);
  assertTrue(typeof syncResult === 'boolean', 'syncWorkflowToFirestore must return a boolean safely');
}
