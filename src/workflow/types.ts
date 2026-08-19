/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TriggerType =
  | 'EMAIL_RECEIVED'
  | 'SCHEDULE'
  | 'MANUAL'
  | 'CALENDAR_EVENT'
  | 'FORM_SUBMITTED';

export type ConditionType =
  | 'EMAIL_URGENT'
  | 'SENDER_MATCH'
  | 'SEMANTIC_MATCH'
  | 'KEYWORD_MATCH'
  | 'TIME_MATCH'
  | 'AVAILABILITY'
  | 'PRIORITY_MATCH';

export type ActionType =
  | 'CREATE_TASK'
  | 'SEND_NOTIFICATION'
  | 'SEND_EMAIL'
  | 'CREATE_CALENDAR_EVENT'
  | 'GENERATE_SUMMARY'
  | 'SAVE_DATA'
  | 'CALL_WEBHOOK';

export type RecoveryStrategyType =
  | 'NONE'
  | 'RETRY'
  | 'FALLBACK'
  | 'RETRY_THEN_FALLBACK'
  | 'REQUEST_USER';

export type VerificationType =
  | 'TASK_EXISTS'
  | 'EMAIL_SENT'
  | 'EVENT_EXISTS'
  | 'DATA_SAVED'
  | 'WEBHOOK_SUCCESS'
  | 'USER_CONFIRMATION';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TriggerDefinition {
  type: TriggerType;
  description: string;
  config?: Record<string, unknown>;
}

export interface ConditionDefinition {
  type: ConditionType;
  value?: string;
  description: string;
  field?: string;
}

export interface ActionDefinition {
  id: string;
  type: ActionType;
  description: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  target?: string;
  config?: Record<string, unknown>;
}

export interface RiskEvaluation {
  level: RiskLevel;
  reason: string;
  factors?: string[];
  deterministicOverride?: boolean;
}

export interface RecoveryConfig {
  enabled: boolean;
  strategy: RecoveryStrategyType;
  retryCount?: number;
  fallback?: string;
  description?: string;
}

export interface VerificationConfig {
  type: VerificationType;
  description: string;
  target?: string;
}

export interface ExplainabilityDetails {
  understoodIntent: string;
  planSteps: string[];
  actionJustification: string;
  failureModes: string[];
  recoveryExplanation: string;
  verificationExplanation: string;
}

export interface CapabilityRequirement {
  id: string;
  category: string;
  permission: string;
  label: string;
  description: string;
  granted?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  goal: string;
  rawPrompt?: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  clarificationNeeded?: string;
  trigger: TriggerDefinition;
  conditions: ConditionDefinition[];
  actions: ActionDefinition[];
  risk: RiskEvaluation;
  approvalRequired: boolean;
  recovery: RecoveryConfig;
  verification: VerificationConfig;
  explainability: ExplainabilityDetails;
  requiredCapabilities: CapabilityRequirement[];
  createdAt: string;
  updatedAt?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'SIMULATED';
  executionCount?: number;
  lastRunStatus?: 'SUCCESS' | 'RECOVERED' | 'FAILED';
}

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
  unsupportedValue?: string;
  supportedAlternatives?: string[];
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  sanitizedWorkflow?: Workflow;
}

export interface SimulationStep {
  id: string;
  phase: 'TRIGGER' | 'CONDITION' | 'ACTION' | 'RECOVERY' | 'FALLBACK' | 'VERIFICATION';
  title: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'RECOVERED' | 'SKIPPED';
  durationMs?: number;
  logs: string[];
  details?: Record<string, unknown>;
}

export interface SimulationResult {
  id: string;
  workflowId: string;
  status: 'SUCCESS' | 'RECOVERED' | 'FAILED' | 'BLOCKED';
  totalDurationMs: number;
  steps: SimulationStep[];
  startedAt: string;
  completedAt: string;
  recoveryTriggered: boolean;
  verificationPassed: boolean;
  message: string;
}

export interface GenerationState {
  stage: 'IDLE' | 'UNDERSTANDING' | 'PLANNING' | 'VALIDATING' | 'READY' | 'CLARIFICATION' | 'UNSUPPORTED' | 'ERROR';
  message: string;
  error?: string;
  clarificationQuestion?: string;
  unsupportedDetails?: {
    item: string;
    category: string;
    suggestion: string;
  };
}
