/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuditEventReceipt } from '../../src/workflow/executionEngine.ts';

export interface TestResultItem {
  id: string;
  name: string;
  category: 'unit' | 'integration' | 'golden';
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: string[];
  auditEvents?: AuditEventReceipt[];
}

export interface TestSuiteSummary {
  suiteName: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResultItem[];
}

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new AssertionError(`Assertion Failed: ${message}`);
  }
}

export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new AssertionError(
      `${message ? message + ' ' : ''}Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
    );
  }
}

export function assertTrue(condition: boolean, message?: string): void {
  assertEqual(condition, true, message || 'Expected true');
}

export function assertFalse(condition: boolean, message?: string): void {
  assertEqual(condition, false, message || 'Expected false');
}

export function assertIncludes<T>(array: T[], item: T, message?: string): void {
  if (!array.includes(item)) {
    throw new AssertionError(
      `${message ? message + ' ' : ''}Expected array to include ${JSON.stringify(item)}, but it was missing.`
    );
  }
}

/**
 * Asserts strict chronological order among event types in an audit receipt stream.
 * e.g. assertEventOrder(events, ['ACTION_FAILED', 'FAILURE_CLASSIFIED', 'RETRY_1_STARTED', 'FALLBACK_SELECTED', 'GOAL_ACHIEVED'])
 */
export function assertEventOrder(events: AuditEventReceipt[], expectedSequence: string[]): void {
  const eventTypes = events.map((e) => e.eventType || e.type);
  let lastIndex = -1;

  for (const expectedType of expectedSequence) {
    const currentIndex = eventTypes.indexOf(expectedType as any, lastIndex + 1);
    if (currentIndex === -1) {
      throw new AssertionError(
        `Audit trail is missing expected event "${expectedType}" after position ${lastIndex}. Full event stream: [${eventTypes.join(' -> ')}]`
      );
    }
    lastIndex = currentIndex;
  }
}

export type TestFunction = () => Promise<void> | void;

export interface TestCase {
  id: string;
  name: string;
  category: 'unit' | 'integration' | 'golden';
  fn: TestFunction;
}
