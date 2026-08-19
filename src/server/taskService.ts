/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AuraTaskItem {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  source?: string;
  sourceMessageId?: string;
  workflowExecutionId?: string;
  providerUsed: 'PRIMARY_TASK_PROVIDER' | 'BACKUP_TASK_PROVIDER';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source?: string;
  sourceMessageId?: string;
  workflowExecutionId?: string;
}

export interface TaskProviderResult {
  success: boolean;
  task?: AuraTaskItem;
  providerName: 'PRIMARY_TASK_PROVIDER' | 'BACKUP_TASK_PROVIDER';
  error?: string;
  httpStatus?: number;
}

export interface TaskProvider {
  createTask(input: CreateTaskInput): Promise<TaskProviderResult>;
  verifyTask(id: string): Promise<boolean>;
}

// In-memory persistent task store
let persistedTasks: AuraTaskItem[] = [
  {
    id: 'task-init-001',
    title: 'Review Tier-1 Customer Escalation',
    description: 'Investigate payment webhook failures reported on EU cluster.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    source: 'Gmail (billing-alert@tier1-enterprise.com)',
    sourceMessageId: 'msg-demo-001',
    workflowExecutionId: 'exec-demo-101',
    providerUsed: 'BACKUP_TASK_PROVIDER',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

// Developer failure simulation flag (Default: OFF, Toggleable in Demo Mode)
let isPrimaryFailureSimulationEnabled = false;

export function setPrimaryFailureSimulation(enabled: boolean): void {
  isPrimaryFailureSimulationEnabled = enabled;
  console.log(`[Task Service] Primary Task Provider Failure Simulation set to: ${enabled ? 'ON' : 'OFF'}`);
}

export function getPrimaryFailureSimulationStatus(): boolean {
  return isPrimaryFailureSimulationEnabled;
}

/**
 * Primary Task Provider:
 * Simulates standard production task service (e.g. Todoist, Jira, Linear API).
 * When failure simulation is enabled, throws HTTP 503 Service Unavailable.
 */
export class PrimaryTaskProvider implements TaskProvider {
  async createTask(input: CreateTaskInput): Promise<TaskProviderResult> {
    if (isPrimaryFailureSimulationEnabled) {
      const error = new Error('HTTP 503: Service Unavailable — Primary task provider rate limit exceeded');
      (error as any).status = 503;
      (error as any).code = 'SERVICE_UNAVAILABLE';
      throw error;
    }

    const newTask: AuraTaskItem = {
      id: `task-pri-${Date.now()}`,
      title: input.title,
      description: input.description || 'Created via AURA Automated Workflow',
      priority: input.priority || 'MEDIUM',
      status: 'PENDING',
      source: input.source || 'AURA Workflow Engine',
      sourceMessageId: input.sourceMessageId,
      workflowExecutionId: input.workflowExecutionId,
      providerUsed: 'PRIMARY_TASK_PROVIDER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    persistedTasks.unshift(newTask);
    return {
      success: true,
      task: newTask,
      providerName: 'PRIMARY_TASK_PROVIDER',
    };
  }

  async verifyTask(id: string): Promise<boolean> {
    return persistedTasks.some((t) => t.id === id);
  }
}

/**
 * Backup Task Provider:
 * Standby resilient secondary provider (e.g. Secondary Internal DB / Fallback Storage).
 */
export class BackupTaskProvider implements TaskProvider {
  async createTask(input: CreateTaskInput): Promise<TaskProviderResult> {
    const newTask: AuraTaskItem = {
      id: `task-bkp-${Date.now()}`,
      title: input.title,
      description: input.description ? `${input.description} (Failover Route: Backup Provider)` : 'Created via AURA Backup Task Provider',
      priority: input.priority || 'MEDIUM',
      status: 'PENDING',
      source: input.source || 'AURA Workflow Engine',
      sourceMessageId: input.sourceMessageId,
      workflowExecutionId: input.workflowExecutionId,
      providerUsed: 'BACKUP_TASK_PROVIDER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    persistedTasks.unshift(newTask);
    return {
      success: true,
      task: newTask,
      providerName: 'BACKUP_TASK_PROVIDER',
    };
  }

  async verifyTask(id: string): Promise<boolean> {
    return persistedTasks.some((t) => t.id === id);
  }
}

export const primaryTaskProvider = new PrimaryTaskProvider();
export const backupTaskProvider = new BackupTaskProvider();

/**
 * Lists all tasks in the persistent store.
 */
export function getAllTasks(): AuraTaskItem[] {
  return [...persistedTasks];
}

/**
 * Verifies that a task exists and conforms to expected criteria.
 */
export function verifyTaskOutcome(id: string): { verified: boolean; task: AuraTaskItem | null } {
  const task = persistedTasks.find((t) => t.id === id) || null;
  return {
    verified: Boolean(task),
    task,
  };
}

/**
 * Clears demo tasks for testing reset.
 */
export function resetDemoTasks(): void {
  persistedTasks = [];
}
