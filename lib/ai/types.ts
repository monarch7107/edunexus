/**
 * EduNexus V2 — Agentic AI core types.
 *
 * Architectural rule enforced throughout this module:
 *
 *   THE LLM CAN REASON. THE LLM CANNOT AUTHORIZE ITSELF.
 *
 * The model never sees a user id, never reaches the database, and never
 * executes a tool. It returns a *proposal* which the server validates,
 * converts into a ChangeSet, and executes only after explicit student
 * approval — then verifies against the database (the source of truth).
 */

import type { StudySession, Subject, Task } from "../types";

// ── Agents & intents ─────────────────────────────────────────────────────────

/** V2 slice 1 ships a single agent. Future: task | learning | revision | … */
export type AgentType = "planning";

export const AGENT_TYPES: readonly AgentType[] = ["planning"] as const;

/** V2 slice 1 supports a single intent. */
export type Intent = "optimize_schedule";

export const INTENTS: readonly Intent[] = ["optimize_schedule"] as const;

/** Explicit run lifecycle. The UI renders these states directly. */
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

/** Entities an agent may propose writes against (slice 1: sessions only). */
export type ChangeEntity = "study_session";

export type ActionStatus =
  | "pending"
  | "approved"
  | "executed"
  | "verified"
  | "failed"
  | "rejected"
  | "skipped";

// ── Academic context handed to the agent ─────────────────────────────────────

/**
 * The ONLY academic facts an agent may reason over. Assembled server-side
 * from the authenticated user's own rows via read tools. Note there is no
 * `user_id` anywhere in this structure: the model never learns an identity.
 */
export interface AgentContext {
  /** Local calendar day (yyyy-mm-dd) the run is anchored to. */
  today: string;
  subjects: Pick<Subject, "id" | "name" | "code">[];
  tasks: Pick<
    Task,
    "id" | "subject_id" | "title" | "task_type" | "priority" | "due_date" | "status"
  >[];
  sessions: Pick<
    StudySession,
    "id" | "subject_id" | "title" | "planned_date" | "duration_minutes" | "status"
  >[];
  /** Student goals text, when the profile provides it. Untrusted data. */
  goals: string;
  /** Deterministic conflict/coverage findings computed by the server. */
  findings: ScheduleFinding[];
}

export interface ScheduleFinding {
  kind:
    | "overloaded_day"
    | "empty_day_before_deadline"
    | "uncovered_exam"
    | "uncovered_task"
    | "overdue_task";
  detail: string;
  /** Related date (yyyy-mm-dd) when meaningful. */
  date?: string;
  subject_id?: string | null;
}

export interface AgentInput {
  /** Raw student message. Treated strictly as DATA, never as instructions. */
  message: string;
  intent: Intent;
  surface: string;
  runId: string;
  requestId: string;
}

// ── Proposals (model output, pre-validation) ─────────────────────────────────

export interface ProposedChange {
  operation: ChangeOperation;
  entity: ChangeEntity;
  /** Existing row id for update/move/delete; null for create. */
  entity_id: string | null;
  payload: Record<string, unknown>;
  /** Short student-facing explanation of this single change. */
  reason?: string;
}

export interface AgentPlan {
  source: "ai" | "fallback";
  summary: string;
  evidence: string[];
  changes: ProposedChange[];
}

/** A plan whose every change passed schema, ownership and business rules. */
export interface ValidatedPlan {
  source: "ai" | "fallback";
  summary: string;
  evidence: string[];
  changes: ValidatedChange[];
  /** Human-readable rationale stored on the change set. */
  reason: string;
}

export interface ValidatedChange {
  operation: ChangeOperation;
  entity: ChangeEntity;
  entity_id: string | null;
  /** Normalized, type-safe payload ready for a registered tool. */
  payload: SessionWritePayload;
  previous_state: Record<string, unknown> | null;
  reason: string;
  /** Student-facing one-line label, e.g. "Create Physics revision". */
  label: string;
  detail: string;
}

/** Normalized payload for every study_session write operation. */
export interface SessionWritePayload {
  subject_id: string | null;
  title: string;
  planned_date: string;
  duration_minutes: number;
}

// ── Persistence records ──────────────────────────────────────────────────────

export interface AgentRunRecord {
  id: string;
  user_id: string;
  agent_type: AgentType;
  intent: Intent;
  status: AgentRunStatus;
  started_at: string;
  completed_at: string | null;
  error_class: string | null;
  input_summary: string;
  output_summary: string;
  metadata: Record<string, unknown>;
  request_id: string;
}

export interface AgentActionRecord {
  id: string;
  agent_run_id: string;
  user_id: string;
  agent_type: AgentType;
  tool_name: string;
  action_type: ChangeOperation | "read";
  target_type: string;
  target_id: string | null;
  input_summary: string;
  status: ActionStatus;
  requires_approval: boolean;
  approved_at: string | null;
  executed_at: string | null;
  verified_at: string | null;
  error_class: string | null;
  created_at: string;
}

export interface ChangeSetRecord {
  id: string;
  agent_run_id: string;
  user_id: string;
  title: string;
  reason: string;
  status: ChangeSetStatus;
  created_at: string;
  expires_at: string;
}

export interface ChangeItemRecord {
  id: string;
  change_set_id: string;
  operation: ChangeOperation;
  entity_type: ChangeEntity;
  entity_id: string | null;
  payload: SessionWritePayload;
  previous_state: Record<string, unknown> | null;
  status: ActionStatus;
  error: string | null;
  /** Student-facing copy (derived, stored for stable rendering). */
  label: string;
  detail: string;
  reason: string;
}

export interface AgentApprovalRecord {
  id: string;
  agent_run_id: string;
  change_set_id: string;
  user_id: string;
  status: ApprovalStatus;
  reviewed_at: string | null;
  expires_at: string;
  /**
   * Fingerprint of the change set contents at approval time. Any later edit
   * changes the fingerprint, which invalidates the stale approval.
   */
  change_fingerprint: string;
}

// ── API surface ──────────────────────────────────────────────────────────────

export interface ChangeView {
  id: string;
  operation: ChangeOperation;
  entity: ChangeEntity;
  entity_id: string | null;
  label: string;
  detail: string;
  reason: string;
  status: ActionStatus;
  payload: SessionWritePayload;
  error: string | null;
}

export interface AgentRunResponse {
  runId: string;
  status: AgentRunStatus;
  agent: AgentType;
  intent: Intent;
  summary: string;
  source: "ai" | "fallback";
  /** True when the deterministic planner produced this plan. */
  fallback: boolean;
  evidence: string[];
  findings: ScheduleFinding[];
  changeSetId: string | null;
  changes: ChangeView[];
  expiresAt: string | null;
  analyzed: { subjects: number; tasks: number; sessions: number };
}

export interface ExecutionResult {
  runId: string;
  changeSetId: string;
  /** Per-item outcome after tool execution (before verification). */
  items: {
    id: string;
    status: ActionStatus;
    entity_id: string | null;
    error: string | null;
  }[];
  executed: number;
  failed: number;
}

export interface VerificationResult {
  runId: string;
  changeSetId: string;
  status: ChangeSetStatus;
  verified: number;
  proposed: number;
  approved: number;
  executed: number;
  failed: number;
  /** True only when every approved item was executed AND verified. */
  fullyVerified: boolean;
  message: string;
  items: ChangeView[];
}
