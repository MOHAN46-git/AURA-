/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Workflow, SimulationResult, SimulationStep } from './types.ts';
import { executeWorkflowEngine, ExecutionOptions, AuditEventReceipt } from './executionEngine.ts';

export interface SimulationOptions extends ExecutionOptions {}

/**
 * Executes a simulated workflow run using the Milestone 2 Deterministic Execution Engine.
 */
export async function runSimulation(
  workflow: Workflow,
  options: SimulationOptions = {}
): Promise<SimulationResult> {
  return executeWorkflowEngine(workflow, options);
}

export type { AuditEventReceipt };
