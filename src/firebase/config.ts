/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyCHzVQvhyUurobX3YIPAs-w_Ac0kiZRZ1g",
  authDomain: "project1-4506.firebaseapp.com",
  projectId: "project1-4506",
  storageBucket: "project1-4506.firebasestorage.app",
  messagingSenderId: "367992509924",
  appId: "1:367992509924:web:ca7f066ca79790b58d63f1"
};

// Singleton Firebase initialization
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Scopes for Google Workspace
googleAuthProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleAuthProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleAuthProvider.addScope('https://www.googleapis.com/auth/calendar.events');
googleAuthProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleAuthProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });
