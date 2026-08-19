/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from './config.ts';

export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: string;
}

export async function signInWithGoogle(): Promise<FirebaseAuthUser> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      providerId: user.providerId,
    };
  } catch (error: any) {
    console.warn('[Firebase Auth] Popup error, trying redirect:', error);
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, googleAuthProvider);
    }
    throw error;
  }
}

export async function logOutFromFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeToFirebaseAuthState(
  callback: (user: FirebaseAuthUser | null) => void
): () => void {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        providerId: user.providerId,
      });
    } else {
      callback(null);
    }
  });
}
