/**
 * Server-side data ports for the V2 agent pipeline.
 *
 * Two separate concerns, deliberately kept apart:
 *
 *  - `AcademicPort` — the student's V1 academic rows (subjects/tasks/
 *    sessions). Only the Tool Registry is allowed to call it.
 *  - `AgentStore`   — the V2 audit/approval tables.
 *
 * EVERY method takes an explicit `userId` that the caller must have
 * obtained from the authenticated server session. Implementations
 * additionally scope each query by that id, so a bug upstream cannot leak
 * another student's rows even before RLS is considered.
 */

import type { StudySession, Subject, Task } from "../../types";
import type {
  ActionStatus,
  AgentActionRecord,
  AgentApprovalRecord,
  AgentRunRecord,
  AgentRunStatus,
  ApprovalStatus,
  ChangeItemRecord,
  ChangeSetRecord,
  ChangeSetStatus,
  SessionWritePayload,
} from "../types";

export interface AcademicPort {
  listSubjects(userId: string): Promise<Subject[]>;
  listTasks(userId: string): Promise<Task[]>;
  listSessions(userId: string): Promise<StudySession[]>;
  /** Returns null when the row does not exist OR is not owned by `userId`. */
  getSession(userId: string, id: string): Promise<StudySession | null>;
  createSession(userId: string, payload: SessionWritePayload): Promise<StudySession>;
  updateSession(
    userId: string,
    id: string,
    payload: SessionWritePayload,
  ): Promise<StudySession>;
  deleteSession(userId: string, id: string): Promise<void>;
}

export interface AgentStore {
  createRun(
    run: Omit<AgentRunRecord, "id" | "started_at"> & { id?: string },
  ): Promise<AgentRunRecord>;
  updateRun(
    userId: string,
    runId: string,
    patch: Partial<
      Pick<
        AgentRunRecord,
        "status" | "completed_at" | "error_class" | "output_summary" | "metadata"
      >
    >,
  ): Promise<void>;
  getRun(userId: string, runId: string): Promise<AgentRunRecord | null>;
  listRuns(userId: string, limit?: number): Promise<AgentRunRecord[]>;

  recordAction(
    action: Omit<AgentActionRecord, "id" | "created_at"> & { id?: string },
  ): Promise<AgentActionRecord>;
  updateAction(
    userId: string,
    actionId: string,
    patch: Partial<
      Pick<
        AgentActionRecord,
        "status" | "approved_at" | "executed_at" | "verified_at" | "error_class" | "target_id"
      >
    >,
  ): Promise<void>;
  listActions(userId: string, runId: string): Promise<AgentActionRecord[]>;

  createChangeSet(
    changeSet: Omit<ChangeSetRecord, "id" | "created_at"> & { id?: string },
  ): Promise<ChangeSetRecord>;
  getChangeSet(userId: string, id: string): Promise<ChangeSetRecord | null>;
  updateChangeSetStatus(
    userId: string,
    id: string,
    status: ChangeSetStatus,
  ): Promise<void>;

  createChangeItems(
    changeSetId: string,
    userId: string,
    items: Omit<ChangeItemRecord, "id" | "change_set_id">[],
  ): Promise<ChangeItemRecord[]>;
  listChangeItems(userId: string, changeSetId: string): Promise<ChangeItemRecord[]>;
  updateChangeItem(
    userId: string,
    itemId: string,
    patch: Partial<
      Pick<ChangeItemRecord, "status" | "error" | "entity_id" | "payload" | "label" | "detail">
    >,
  ): Promise<void>;

  createApproval(
    approval: Omit<AgentApprovalRecord, "id"> & { id?: string },
  ): Promise<AgentApprovalRecord>;
  getApprovalForChangeSet(
    userId: string,
    changeSetId: string,
  ): Promise<AgentApprovalRecord | null>;
  updateApproval(
    userId: string,
    approvalId: string,
    patch: Partial<
      Pick<AgentApprovalRecord, "status" | "reviewed_at" | "change_fingerprint">
    >,
  ): Promise<void>;
}

export type { ActionStatus, AgentRunStatus, ApprovalStatus, ChangeSetStatus };
