/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { classifyFailure } from '../../src/workflow/executionEngine.ts';
import { assert, assertEqual, assertTrue, assertFalse } from '../helpers/testHarness.ts';

export async function testFailureClassification(): Promise<void> {
  // 1. TIMEOUT classification
  const timeoutDiag = classifyFailure('EXTERNAL_GATEWAY', 'NETWORK_TIMEOUT: Socket hangup');
  assertEqual(timeoutDiag.code, 'TIMEOUT');
  assertEqual(timeoutDiag.httpStatus, 408);
  assertTrue(timeoutDiag.retryable, 'TIMEOUT should be retryable');
  assertEqual(timeoutDiag.recommendedAction, 'RETRY_WITH_BACKOFF');

  // 2. RATE_LIMIT classification
  const rateLimitDiag = classifyFailure('TASK_API', 'HTTP 429 Too Many Requests (Rate limit exceeded)');
  assertEqual(rateLimitDiag.code, 'RATE_LIMIT');
  assertEqual(rateLimitDiag.httpStatus, 429);
  assertTrue(rateLimitDiag.retryable, 'RATE_LIMIT should be retryable with backoff');
  assertEqual(rateLimitDiag.recommendedAction, 'RETRY_WITH_BACKOFF');

  // 3. SERVICE_UNAVAILABLE classification
  const serviceUnavailDiag = classifyFailure('PRIMARY_TASK_PROVIDER', '503 Service Unavailable');
  assertEqual(serviceUnavailDiag.code, 'SERVICE_UNAVAILABLE');
  assertEqual(serviceUnavailDiag.httpStatus, 503);
  assertTrue(serviceUnavailDiag.retryable, 'SERVICE_UNAVAILABLE should allow retries and fallback');
  assertEqual(serviceUnavailDiag.recommendedAction, 'ROUTE_TO_FALLBACK');

  // 4. AUTHENTICATION classification
  const authDiag = classifyFailure('CALENDAR_API', 'HTTP 401 Unauthorized token expired');
  assertEqual(authDiag.code, 'AUTHENTICATION');
  assertEqual(authDiag.httpStatus, 401);
  assertFalse(authDiag.retryable, 'AUTHENTICATION failure should not blindly retry');
  assertEqual(authDiag.recommendedAction, 'REFRESH_TOKEN');

  // 5. PERMISSION_DENIED classification
  const permDiag = classifyFailure('DATABASE_STORE', 'HTTP 403 Forbidden: PERMISSION_DENIED');
  assertEqual(permDiag.code, 'PERMISSION_DENIED');
  assertEqual(permDiag.httpStatus, 403);
  assertFalse(permDiag.retryable, 'PERMISSION_DENIED should not retry');
  assertEqual(permDiag.recommendedAction, 'HALT_AND_ALERT');

  // 6. INVALID_RESPONSE classification
  const invalidRespDiag = classifyFailure('WEBHOOK_SERVICE', 'INVALID_RESPONSE: Malformed JSON body');
  assertEqual(invalidRespDiag.code, 'INVALID_RESPONSE');
  assertFalse(invalidRespDiag.retryable, 'Malformed responses should route to fallback');
  assertEqual(invalidRespDiag.recommendedAction, 'ROUTE_TO_FALLBACK');

  // 7. MISSING_DATA classification
  const missingDataDiag = classifyFailure('FILE_STORE', 'HTTP 404 MISSING_DATA entity not found');
  assertEqual(missingDataDiag.code, 'MISSING_DATA');
  assertFalse(missingDataDiag.retryable, 'MISSING_DATA should halt');
  assertEqual(missingDataDiag.recommendedAction, 'HALT_AND_ALERT');

  // 8. AI_UNCERTAIN classification
  const aiUncertainDiag = classifyFailure('SEMANTIC_RESOLVER', 'AI_UNCERTAIN: Confidence 0.42');
  assertEqual(aiUncertainDiag.code, 'AI_UNCERTAIN');
  assertFalse(aiUncertainDiag.retryable, 'AI_UNCERTAIN should request user clarification');
  assertEqual(aiUncertainDiag.recommendedAction, 'REQUEST_USER_INTERVENTION');
}
