export type AgentType = "planning";
export type Intent = "optimize_schedule";

export type AgentRunStatus =
  | "queued"
  | "running"
  | "waiting_approval"
  | "executing"
  | "completed"
  | "failed"
  | "cancelled";

export type ChangeSetStatus =
  | "pending"
  | "approved"
  | "partially_approved"
  | "rejected"
  | "expired"
  | "executed"
  | "verified"
  | "failed";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "partially_approved"
  | "rejected"
  | "expired";

export type ChangeOperation = "create" | "update" | "delete" | "move";

export type AiErrorClass =
  | "config"
  | "auth"
  | "validation"
  | "permission"
  | "not_found"
  | "timeout"
  | "provider"
  | "malformed"
  | "tool"
  | "database"
  | "approval"
  | "verification"
  | "network";

export interface AcademicSubject {
  id: string;
  name: string;
  code: string;
}

export interface AcademicTask {
  id: string;
  subject_id: string | null;
  title: string;
  task_type: string;
  priority: string;
  due_date: string | null;
  status: string;
}

export interface AcademicSession {
  id: string;
  subject_id: string | null;
  title: string;
  planned_date: string;
  duration_minutes: number;
  status: string;
}

export interface AcademicContext {
  subjects: AcademicSubject[];
  tasks: AcademicTask[];
  sessions: AcademicSession[];
  goals: string;
}

export interface ProposedChange {
  operation: ChangeOperation;
  entity: "study_session";
  entity_id: string | null;
  payload: Record<string, unknown>;
  label: string;
}

export interface AgentPlan {
  summary: string;
  evidence: string[];
  conflicts: string[];
  changes: ProposedChange[];
  source: "ai" | "fallback";
}

export interface ChangeItemRecord {
  id: string;
  change_set_id: string;
  user_id: string;
  operation: ChangeOperation;
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, unknown>;
  previous_state: Record<string, unknown> | null;
  status: string;
  error: string | null;
}

export interface ChangeSetRecord {
  id: string;
  agent_run_id: string;
  user_id: string;
  title: string;
  reason: string;
  status: ChangeSetStatus;
  created_at: string;
  expires_at: string | null;
  items: ChangeItemRecord[];
  hash: string;
}

export interface AgentRunRecord {
  id: string;
  user_id: string;
  agent_type: AgentType;
  intent: Intent;
  status: AgentRunStatus;
  started_at: string;
  completed_at: string | null;
  error_class: AiErrorClass | null;
  input_summary: string;
  output_summary: string;
  metadata: Record<string, unknown>;
  request_id: string;
}

export interface ApprovalRecord {
  id: string;
  agent_run_id: string;
  change_set_id: string;
  user_id: string;
  status: ApprovalStatus;
  reviewed_at: string | null;
  expires_at: string | null;
  change_set_hash: string;
}

export interface AgentActionRecord {
  id: string;
  agent_run_id: string;
  user_id: string;
  agent_type: AgentType;
  tool_name: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  input_summary: string;
  status: string;
  requires_approval: boolean;
  approved_at: string | null;
  executed_at: string | null;
  verified_at: string | null;
  error_class: string | null;
}

export interface GatewayRequest {
  message: string;
  surface?: string;
  snapshot?: Partial<AcademicContext>;
}

export interface GatewayResponse {
  runId: string;
  status: AgentRunStatus;
  agent: AgentType;
  intent: Intent | null;
  summary: string;
  evidence: string[];
  conflicts: string[];
  changeSetId: string | null;
  changes: Array<{
    id: string;
    operation: ChangeOperation;
    entity: string;
    entity_id: string | null;
    label: string;
    payload: Record<string, unknown>;
  }>;
  source: "ai" | "fallback";
  fallbackNotice?: string;
  error?: string;
  errorClass?: AiErrorClass;
  activity?: {
    proposed: number;
    approved: number;
    executed: number;
    verified: number;
  };
}

export const AI_LIMITS = {
  maxBodyBytes: 32_768,
  maxOutputChars: 8_000,
  maxAgentIterations: 3,
  maxToolCallsPerRun: 10,
  maxProposedChanges: 10,
  providerTimeoutMs: 15_000,
  approvalTtlMs: 30 * 60 * 1000,
} as const;
