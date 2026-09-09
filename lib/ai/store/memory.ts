/**
 * In-memory implementations of the V2 ports.
 *
 * Used by (a) unit/integration tests and (b) demo mode, where V1 stores
 * academic data in the browser's localStorage and no server database
 * exists. Ownership is enforced explicitly on every read and write so the
 * security tests exercise the same code path shape as Supabase + RLS.
 */

import type { StudySession, Subject, Task } from "../../types";
import { RepoError } from "../../repo/errors";
import type {
  AgentActionRecord,
  AgentApprovalRecord,
  AgentRunRecord,
  ChangeItemRecord,
  ChangeSetRecord,
  ChangeSetStatus,
  SessionWritePayload,
} from "../types";
import type { AcademicPort, AgentStore } from "./types";

let counter = 0;
function newId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Drop the internal owner column before handing a row to callers. */
function stripOwner(row: ChangeItemRecord & { user_id: string }): ChangeItemRecord {
  const copy: Partial<ChangeItemRecord & { user_id?: string }> = { ...row };
  delete copy.user_id;
  return copy as ChangeItemRecord;
}

export class MemoryAcademicPort implements AcademicPort {
  subjects: Subject[] = [];
  tasks: Task[] = [];
  sessions: StudySession[] = [];

  constructor(seed?: {
    subjects?: Subject[];
    tasks?: Task[];
    sessions?: StudySession[];
  }) {
    this.subjects = seed?.subjects ?? [];
    this.tasks = seed?.tasks ?? [];
    this.sessions = seed?.sessions ?? [];
  }

  async listSubjects(userId: string): Promise<Subject[]> {
    return this.subjects.filter((s) => s.user_id === userId);
  }

  async listTasks(userId: string): Promise<Task[]> {
    return this.tasks.filter((t) => t.user_id === userId);
  }

  async listSessions(userId: string): Promise<StudySession[]> {
    return this.sessions.filter((s) => s.user_id === userId);
  }

  async getSession(userId: string, id: string): Promise<StudySession | null> {
    // Ownership is part of the lookup: another user's row reads as absent.
    return this.sessions.find((s) => s.id === id && s.user_id === userId) ?? null;
  }

  async createSession(
    userId: string,
    payload: SessionWritePayload,
  ): Promise<StudySession> {
    const ts = nowIso();
    const session: StudySession = {
      id: newId("ses"),
      user_id: userId,
      subject_id: payload.subject_id,
      title: payload.title,
      planned_date: payload.planned_date,
      duration_minutes: payload.duration_minutes,
      status: "planned",
      completed_at: null,
      created_at: ts,
      updated_at: ts,
    };
    this.sessions.push(session);
    return session;
  }

  async updateSession(
    userId: string,
    id: string,
    payload: SessionWritePayload,
  ): Promise<StudySession> {
    const session = this.sessions.find((s) => s.id === id && s.user_id === userId);
    if (!session) throw new RepoError("not-found", "Study session not found");
    session.subject_id = payload.subject_id;
    session.title = payload.title;
    session.planned_date = payload.planned_date;
    session.duration_minutes = payload.duration_minutes;
    session.updated_at = nowIso();
    return session;
  }

  async deleteSession(userId: string, id: string): Promise<void> {
    const index = this.sessions.findIndex((s) => s.id === id && s.user_id === userId);
    if (index === -1) throw new RepoError("not-found", "Study session not found");
    this.sessions.splice(index, 1);
  }
}

export class MemoryAgentStore implements AgentStore {
  runs: AgentRunRecord[] = [];
  actions: AgentActionRecord[] = [];
  changeSets: ChangeSetRecord[] = [];
  changeItems: (ChangeItemRecord & { user_id: string })[] = [];
  approvals: AgentApprovalRecord[] = [];

  async createRun(
    run: Omit<AgentRunRecord, "id" | "started_at"> & { id?: string },
  ): Promise<AgentRunRecord> {
    const record: AgentRunRecord = {
      ...run,
      id: run.id ?? newId("run"),
      started_at: nowIso(),
    };
    this.runs.push(record);
    return record;
  }

  async updateRun(
    userId: string,
    runId: string,
    patch: Partial<AgentRunRecord>,
  ): Promise<void> {
    const run = this.runs.find((r) => r.id === runId && r.user_id === userId);
    if (!run) return;
    Object.assign(run, patch);
  }

  async getRun(userId: string, runId: string): Promise<AgentRunRecord | null> {
    return this.runs.find((r) => r.id === runId && r.user_id === userId) ?? null;
  }

  async listRuns(userId: string, limit = 20): Promise<AgentRunRecord[]> {
    return this.runs
      .filter((r) => r.user_id === userId)
      .sort((a, b) => b.started_at.localeCompare(a.started_at))
      .slice(0, limit);
  }

  async recordAction(
    action: Omit<AgentActionRecord, "id" | "created_at"> & { id?: string },
  ): Promise<AgentActionRecord> {
    const record: AgentActionRecord = {
      ...action,
      id: action.id ?? newId("act"),
      created_at: nowIso(),
    };
    this.actions.push(record);
    return record;
  }

  async updateAction(
    userId: string,
    actionId: string,
    patch: Partial<AgentActionRecord>,
  ): Promise<void> {
    const action = this.actions.find((a) => a.id === actionId && a.user_id === userId);
    if (!action) return;
    Object.assign(action, patch);
  }

  async listActions(userId: string, runId: string): Promise<AgentActionRecord[]> {
    return this.actions.filter((a) => a.user_id === userId && a.agent_run_id === runId);
  }

  async createChangeSet(
    changeSet: Omit<ChangeSetRecord, "id" | "created_at"> & { id?: string },
  ): Promise<ChangeSetRecord> {
    const record: ChangeSetRecord = {
      ...changeSet,
      id: changeSet.id ?? newId("cs"),
      created_at: nowIso(),
    };
    this.changeSets.push(record);
    return record;
  }

  async getChangeSet(userId: string, id: string): Promise<ChangeSetRecord | null> {
    return this.changeSets.find((c) => c.id === id && c.user_id === userId) ?? null;
  }

  async updateChangeSetStatus(
    userId: string,
    id: string,
    status: ChangeSetStatus,
  ): Promise<void> {
    const cs = this.changeSets.find((c) => c.id === id && c.user_id === userId);
    if (!cs) return;
    cs.status = status;
  }

  async createChangeItems(
    changeSetId: string,
    userId: string,
    items: Omit<ChangeItemRecord, "id" | "change_set_id">[],
  ): Promise<ChangeItemRecord[]> {
    const created = items.map((item) => ({
      ...item,
      id: newId("ci"),
      change_set_id: changeSetId,
      user_id: userId,
    }));
    this.changeItems.push(...created);
    return created.map(stripOwner);
  }

  async listChangeItems(
    userId: string,
    changeSetId: string,
  ): Promise<ChangeItemRecord[]> {
    return this.changeItems
      .filter((i) => i.change_set_id === changeSetId && i.user_id === userId)
      .map(stripOwner);
  }

  async updateChangeItem(
    userId: string,
    itemId: string,
    patch: Partial<ChangeItemRecord>,
  ): Promise<void> {
    const item = this.changeItems.find((i) => i.id === itemId && i.user_id === userId);
    if (!item) return;
    Object.assign(item, patch);
  }

  async createApproval(
    approval: Omit<AgentApprovalRecord, "id"> & { id?: string },
  ): Promise<AgentApprovalRecord> {
    const record: AgentApprovalRecord = {
      ...approval,
      id: approval.id ?? newId("apr"),
    };
    this.approvals.push(record);
    return record;
  }

  async getApprovalForChangeSet(
    userId: string,
    changeSetId: string,
  ): Promise<AgentApprovalRecord | null> {
    const matches = this.approvals.filter(
      (a) => a.change_set_id === changeSetId && a.user_id === userId,
    );
    return matches.length ? matches[matches.length - 1] : null;
  }

  async updateApproval(
    userId: string,
    approvalId: string,
    patch: Partial<AgentApprovalRecord>,
  ): Promise<void> {
    const approval = this.approvals.find((a) => a.id === approvalId && a.user_id === userId);
    if (!approval) return;
    Object.assign(approval, patch);
  }
}
