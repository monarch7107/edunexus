import type { AgentRunStatus, GatewayResponse } from "./types";

/**
 * On-device agent activity history.
 *
 * Records Planning Agent runs so the Approval Center and Agent Activity
 * screens can show what was proposed, approved, executed, and verified.
 * History is keyed per user id, so switching accounts never leaks one
 * student's agent history into another's. In Supabase mode the durable
 * server-side audit (`agent_runs`, `agent_actions`, …) remains the system of
 * record; this store is a device-local convenience mirror.
 */

export interface AgentHistoryEntry {
  runId: string;
  changeSetId: string | null;
  status: AgentRunStatus;
  summary: string;
  source: "ai" | "fallback";
  at: string;
  proposed: number;
  approved: number;
  executed: number;
  verified: number;
  conflicts: number;
}

const MAX_ENTRIES = 20;

function keyFor(userId: string): string {
  return `edunexus_ai_history_${userId}`;
}

function readStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function listAgentRuns(userId: string | null | undefined): AgentHistoryEntry[] {
  if (!userId) return [];
  const storage = readStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is AgentHistoryEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as AgentHistoryEntry).runId === "string",
    );
  } catch {
    return [];
  }
}

export function recordAgentRun(
  userId: string | null | undefined,
  response: GatewayResponse,
): AgentHistoryEntry | null {
  if (!userId) return null;
  const storage = readStorage();
  if (!storage) return null;
  const entry: AgentHistoryEntry = {
    runId: response.runId,
    changeSetId: response.changeSetId,
    status: response.status,
    summary: response.summary,
    source: response.source,
    at: new Date().toISOString(),
    proposed: response.activity?.proposed ?? response.changes.length,
    approved: response.activity?.approved ?? 0,
    executed: response.activity?.executed ?? 0,
    verified: response.activity?.verified ?? 0,
    conflicts: response.conflicts.length,
  };
  try {
    const existing = listAgentRuns(userId).filter((e) => e.runId !== entry.runId);
    storage.setItem(
      keyFor(userId),
      JSON.stringify([entry, ...existing].slice(0, MAX_ENTRIES)),
    );
    return entry;
  } catch {
    return null;
  }
}

export function clearAgentHistory(userId: string | null | undefined): void {
  if (!userId) return;
  try {
    readStorage()?.removeItem(keyFor(userId));
  } catch {
    // Clearing history is best-effort; a failure here must never break the UI.
  }
}
