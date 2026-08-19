/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SUPPORTED_TRIGGERS,
  SUPPORTED_ACTIONS,
  SUPPORTED_CONDITIONS,
  SUPPORTED_RECOVERY_STRATEGIES,
  SUPPORTED_VERIFICATION_TYPES,
  extractRequiredCapabilities,
  isCapabilitySupported,
} from '../../src/workflow/capabilityRegistry.ts';
import { assert, assertTrue, assertFalse } from '../helpers/testHarness.ts';
import { GOLDEN_HACKATHON_WORKFLOW } from '../fixtures/workflows.ts';

export async function testCapabilityRegistry(): Promise<void> {
  // 1. Check supported triggers
  assert(Boolean(SUPPORTED_TRIGGERS.EMAIL_RECEIVED), 'EMAIL_RECEIVED must be supported');
  assert(Boolean(SUPPORTED_TRIGGERS.SCHEDULE), 'SCHEDULE must be supported');
  assert(Boolean(SUPPORTED_TRIGGERS.CALENDAR_EVENT), 'CALENDAR_EVENT must be supported');
  assert(Boolean(SUPPORTED_TRIGGERS.MANUAL), 'MANUAL must be supported');

  // 2. Check supported actions
  assert(Boolean(SUPPORTED_ACTIONS.CREATE_TASK), 'CREATE_TASK must be supported');
  assert(Boolean(SUPPORTED_ACTIONS.SEND_NOTIFICATION), 'SEND_NOTIFICATION must be supported');
  assert(Boolean(SUPPORTED_ACTIONS.SEND_EMAIL), 'SEND_EMAIL must be supported');
  assert(Boolean(SUPPORTED_ACTIONS.GENERATE_SUMMARY), 'GENERATE_SUMMARY must be supported');
  assert(Boolean(SUPPORTED_ACTIONS.CALL_WEBHOOK), 'CALL_WEBHOOK must be supported');

  // 3. Verify unsupported capabilities are correctly flagged
  assertFalse(isCapabilitySupported('ACTIONS', 'TRANSFER_MONEY'), 'TRANSFER_MONEY must not be supported');
  assertFalse(isCapabilitySupported('ACTIONS', 'DELETE_DATABASE'), 'DELETE_DATABASE must not be supported');
  assertFalse(isCapabilitySupported('ACTIONS', 'EXECUTE_SHELL_COMMAND'), 'EXECUTE_SHELL_COMMAND must not be supported');
  assertFalse(isCapabilitySupported('TRIGGERS', 'QUANTUM_ENTANGLEMENT_PULSE'), 'Unknown triggers must not be supported');

  // 4. Capability extraction from workflow
  const capabilities = extractRequiredCapabilities(GOLDEN_HACKATHON_WORKFLOW);
  const permissions = capabilities.map((c) => c.permission);

  assertTrue(permissions.includes('email:read'), 'Must extract email:read permission for EMAIL_RECEIVED trigger');
  assertTrue(permissions.includes('tasks:create'), 'Must extract tasks:create permission for CREATE_TASK action');
  assertTrue(permissions.includes('notifications:send'), 'Must extract notifications:send permission for SEND_NOTIFICATION action');
}
