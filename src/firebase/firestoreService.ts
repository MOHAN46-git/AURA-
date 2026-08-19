/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './config.ts';
import { Workflow } from '../workflow/types.ts';

export async function syncWorkflowToFirestore(workflow: Workflow): Promise<boolean> {
  try {
    const docRef = doc(db, 'workflows', workflow.id);
    await setDoc(docRef, {
      ...workflow,
      syncedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Failed to sync workflow to cloud:', err);
    return false;
  }
}

export async function fetchWorkflowsFromFirestore(): Promise<Workflow[]> {
  try {
    const q = query(collection(db, 'workflows'), orderBy('updatedAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const workflows: Workflow[] = [];
    snapshot.forEach((d) => {
      workflows.push(d.data() as Workflow);
    });
    return workflows;
  } catch (err) {
    console.warn('[Firestore] Failed to fetch workflows from cloud:', err);
    return [];
  }
}

export async function deleteWorkflowFromFirestore(workflowId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'workflows', workflowId));
    return true;
  } catch (err) {
    console.warn('[Firestore] Failed to delete workflow from cloud:', err);
    return false;
  }
}

export async function syncTaskToFirestore(task: any): Promise<boolean> {
  try {
    const docRef = doc(db, 'tasks', task.id);
    await setDoc(docRef, {
      ...task,
      syncedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Failed to sync task to cloud:', err);
    return false;
  }
}

export async function syncExecutionLogToFirestore(log: any): Promise<boolean> {
  try {
    const docRef = doc(db, 'execution_logs', log.id);
    await setDoc(docRef, {
      ...log,
      syncedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Failed to sync execution log to cloud:', err);
    return false;
  }
}
