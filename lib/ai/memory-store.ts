import { uuidv4 } from "@/lib/uuid";
import type {
  AcademicContext,
  AcademicSession,
  AgentActionRecord,
  AgentRunRecord,
  AgentRunStatus,
  ApprovalRecord,
  ChangeSetRecord,
} from "./types";

/**
 * Process-local store used in tests and demo mode. Isolated per user_id.
 * Also keeps the execution ledger that makes repeated execution safe within
 * one process (Supabase mode mirrors the same guarantee in agent_actions).
 */
export class MemoryAgentStore {
  runs = new Map<string, AgentRunRecord>();
  actions: AgentActionRecord[] = [];
  changeSets = new Map<string, ChangeSetRecord>();
  approvals = new Map<string, ApprovalRecord>();
  academics = new Map<string, AcademicContext>();
  /** mutationId -> { targetId, status } for create items that already ran. */
  executedMutations = new Map<string, { targetId: string | null; status: string }>();

  reset() {
    this.runs.clear();
    this.actions = [];
    this.changeSets.clear();
    this.approvals.clear();
    this.academics.clear();
    this.executedMutations.clear();
  }

  recordExecutedMutation(mutationId: string, targetId: string | null) {
    this.executedMutations.set(mutationId, { targetId, status: "executed" });
  }

  getExecutedMutation(mutationId: string): { targetId: string | null; status: string } | null {
    return this.executedMutations.get(mutationId) ?? null;
  }

  setAcademic(userId: string, ctx: AcademicContext) {
    this.academics.set(userId, {
      subjects: [...ctx.subjects],
      tasks: [...ctx.tasks],
      sessions: ctx.sessions.map((s) => ({ ...s })),
      goals: ctx.goals,
    });
  }

  getAcademic(userId: string): AcademicContext {
    return (
      this.academics.get(userId) ?? {
        subjects: [],
        tasks: [],
        sessions: [],
        goals: "",
      }
    );
  }

  createRun(partial: Omit<AgentRunRecord, "id" | "started_at" | "completed_at"> & { id?: string }): AgentRunRecord {
    const run: AgentRunRecord = {
      ...partial,
      id: partial.id ?? uuidv4(),
      started_at: new Date().toISOString(),
      completed_at: null,
    };
    this.runs.set(run.id, run);
    return run;
  }

  getRun(id: string, userId: string): AgentRunRecord | null {
    const run = this.runs.get(id);
    if (!run || run.user_id !== userId) return null;
    return run;
  }

  updateRun(id: string, userId: string, patch: Partial<AgentRunRecord>): AgentRunRecord | null {
    const run = this.getRun(id, userId);
    if (!run) return null;
    Object.assign(run, patch);
    return run;
  }

  setRunStatus(id: string, userId: string, status: AgentRunStatus, extra?: Partial<AgentRunRecord>) {
    return this.updateRun(id, userId, { status, ...extra });
  }

  addAction(action: Omit<AgentActionRecord, "id">): AgentActionRecord {
    const row: AgentActionRecord = { ...action, id: uuidv4() };
    this.actions.push(row);
    return row;
  }

  listActions(runId: string, userId: string): AgentActionRecord[] {
    return this.actions.filter((a) => a.agent_run_id === runId && a.user_id === userId);
  }

  saveChangeSet(set: ChangeSetRecord) {
    this.changeSets.set(set.id, set);
  }

  getChangeSet(id: string, userId: string): ChangeSetRecord | null {
    const set = this.changeSets.get(id);
    if (!set || set.user_id !== userId) return null;
    return set;
  }

  saveApproval(row: ApprovalRecord) {
    this.approvals.set(row.id, row);
  }

  getApproval(id: string, userId: string): ApprovalRecord | null {
    const row = this.approvals.get(id);
    if (!row || row.user_id !== userId) return null;
    return row;
  }

  getApprovalForSet(changeSetId: string, userId: string): ApprovalRecord | null {
    for (const row of this.approvals.values()) {
      if (row.change_set_id === changeSetId && row.user_id === userId) return row;
    }
    return null;
  }

  upsertSession(userId: string, session: AcademicSession) {
    const ctx = this.getAcademic(userId);
    const idx = ctx.sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) ctx.sessions[idx] = session;
    else ctx.sessions.push(session);
    this.academics.set(userId, ctx);
  }

  deleteSession(userId: string, id: string): boolean {
    const ctx = this.getAcademic(userId);
    const next = ctx.sessions.filter((s) => s.id !== id);
    if (next.length === ctx.sessions.length) return false;
    ctx.sessions = next;
    this.academics.set(userId, ctx);
    return true;
  }

  getSession(userId: string, id: string): AcademicSession | null {
    return this.getAcademic(userId).sessions.find((s) => s.id === id) ?? null;
  }
}

/**
 * Global singleton. `next dev` lazy-compiles each route into its own module
 * instance; without this, the first request to a not-yet-compiled route
 * (e.g. /api/ai/approve right after /api/ai) sees an empty store. Production
 * builds share one process, and this also keeps demo state coherent there.
 */
const GLOBAL_STORE_KEY = "__edunexus_memory_agent_store__";
const globalWithStore = globalThis as typeof globalThis & {
  [GLOBAL_STORE_KEY]?: MemoryAgentStore;
};
export const memoryStore: MemoryAgentStore =
  globalWithStore[GLOBAL_STORE_KEY] ?? (globalWithStore[GLOBAL_STORE_KEY] = new MemoryAgentStore());
