/**
 * Offline → online sync engine.
 *
 * Turns queued offline mutations into authorized server writes when the
 * connection returns. Design constraints (Step 21):
 *   - Only the fixed, safe MutationKind set is ever executed. No arbitrary SQL,
 *     URLs, code, or payloads — the switch below is the whole allowlist.
 *   - A mutation may only run for its own owner (RLS + app both enforce this);
 *     `cannotExecuteAs` guards the actor.
 *   - Before an update/delete, `expected` is compared against current server
 *     state; a mismatch is a CONFLICT and the server value is never overwritten.
 *   - AI planning is never queued or executed offline.
 *
 * This module is pure with respect to I/O: it takes a `SyncDeps` port, so it is
 * fully unit-testable without a browser or a live backend.
 */
import type { SessionInput, TaskInput } from "@/lib/types";
import {
  cannotExecuteAs,
  detectConflict,
  type MutationKind,
  type QueuedMutation,
} from "./queue";

/** The minimal repository surface the sync engine is allowed to touch. */
export interface SyncDeps {
  createTask(input: TaskInput): Promise<unknown>;
  updateTask(id: string, input: Partial<TaskInput>): Promise<unknown>;
  setTaskStatus(id: string, completed: boolean): Promise<unknown>;
  createSession(input: SessionInput): Promise<unknown>;
  deleteSession(id: string): Promise<unknown>;
  /** Current server snapshot for the entity a mutation targets (for conflict check). */
  currentState(kind: MutationKind, id: string): Promise<Record<string, unknown> | null>;
}

export interface SyncResult {
  synced: string[];
  conflicts: string[];
  failed: string[];
  /** The queue after syncing: synced items removed, conflicts/failures retained. */
  remaining: QueuedMutation[];
}

const CONFLICT_SENSITIVE: MutationKind[] = ["updateTask", "setTaskStatus", "deleteSession"];

/** The kinds that carry an existing entity id and therefore need conflict checks. */
function targetId(m: QueuedMutation): string | null {
  const id = m.payload?.id;
  return typeof id === "string" ? id : null;
}

/** Execute exactly one mutation. Throws on failure; never widens permissions. */
async function apply(deps: SyncDeps, m: QueuedMutation): Promise<void> {
  switch (m.kind) {
    case "createTask":
      await deps.createTask(m.payload as unknown as TaskInput);
      return;
    case "updateTask": {
      const id = targetId(m);
      if (!id) throw new Error("updateTask missing id");
      await deps.updateTask(id, (m.payload.input ?? {}) as Partial<TaskInput>);
      return;
    }
    case "setTaskStatus": {
      const id = targetId(m);
      if (!id) throw new Error("setTaskStatus missing id");
      await deps.setTaskStatus(id, Boolean(m.payload.completed));
      return;
    }
    case "createSession":
      await deps.createSession(m.payload as unknown as SessionInput);
      return;
    case "deleteSession": {
      const id = targetId(m);
      if (!id) throw new Error("deleteSession missing id");
      await deps.deleteSession(id);
      return;
    }
    default:
      // Exhaustiveness guard: an unknown kind is never executed.
      throw new Error(`Unsupported mutation kind: ${(m as QueuedMutation).kind}`);
  }
}

/**
 * Sync all pending mutations for `actorId`. Conflicts and failures are recorded
 * on the item and kept in the queue for the user to resolve; synced items are
 * dropped. Order is preserved so dependent edits apply in sequence.
 */
export async function syncQueue(
  actorId: string,
  items: QueuedMutation[],
  deps: SyncDeps,
): Promise<SyncResult> {
  const synced: string[] = [];
  const conflicts: string[] = [];
  const failed: string[] = [];
  const remaining: QueuedMutation[] = [];

  for (const item of items) {
    if (item.status === "synced") continue;

    // Never flush another account's mutation (defence in depth on top of RLS).
    if (cannotExecuteAs(actorId, item)) {
      failed.push(item.id);
      remaining.push({ ...item, status: "failed", error: "Belongs to another account." });
      continue;
    }

    // Conflict detection: compare the value we captured offline (`expected`)
    // against the current server value before overwriting anything.
    if (CONFLICT_SENSITIVE.includes(item.kind) && item.expected) {
      const id = targetId(item);
      let current: Record<string, unknown> | null = null;
      try {
        current = id ? await deps.currentState(item.kind, id) : null;
      } catch {
        current = null;
      }
      if (item.kind === "deleteSession" && current === null) {
        // Already gone on the server: the delete is effectively done.
        synced.push(item.id);
        continue;
      }
      if (current && detectConflict(item.expected, current)) {
        conflicts.push(item.id);
        remaining.push({
          ...item,
          status: "conflict",
          error: "Your offline change conflicts with the latest version.",
        });
        continue;
      }
    }

    try {
      await apply(deps, item);
      synced.push(item.id);
    } catch (e) {
      failed.push(item.id);
      remaining.push({
        ...item,
        status: "failed",
        error: e instanceof Error ? e.message : "Sync failed.",
      });
    }
  }

  return { synced, conflicts, failed, remaining };
}
