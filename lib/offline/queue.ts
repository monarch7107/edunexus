/**
 * Minimal offline mutation queue.
 * Never stores secrets, API keys, or arbitrary SQL.
 * Queues are scoped to an account id so User B cannot flush User A's work.
 */
import { uid } from "@/lib/utils";

export type MutationKind =
  | "createTask"
  | "updateTask"
  | "setTaskStatus"
  | "createSession"
  | "deleteSession";

export type QueueStatus = "pending" | "conflict" | "failed" | "synced" | "needs_attention";

export interface QueuedMutation {
  id: string;
  userId: string;
  kind: MutationKind;
  payload: Record<string, unknown>;
  expected?: Record<string, unknown>;
  createdAt: string;
  status: QueueStatus;
  error?: string;
}

export const QUEUE_KEY = "edunexus_offline_queue";
export const QUEUE_OWNER_KEY = "edunexus_offline_queue_owner";

const KINDS: MutationKind[] = [
  "createTask",
  "updateTask",
  "setTaskStatus",
  "createSession",
  "deleteSession",
];

export function queueStorageKey(userId: string): string {
  return `${QUEUE_KEY}:${userId}`;
}

export function parseQueue(raw: unknown, userId?: string): QueuedMutation[] {
  if (!Array.isArray(raw)) return [];
  const out: QueuedMutation[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (typeof r.id !== "string" || !KINDS.includes(r.kind as MutationKind)) continue;
    if (!r.payload || typeof r.payload !== "object") continue;
    const owner = typeof r.userId === "string" ? r.userId : "";
    if (userId && owner && owner !== userId) continue;
    out.push({
      id: r.id,
      userId: owner,
      kind: r.kind as MutationKind,
      payload: r.payload as Record<string, unknown>,
      expected:
        r.expected && typeof r.expected === "object"
          ? (r.expected as Record<string, unknown>)
          : undefined,
      createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
      status: (r.status as QueueStatus) || "pending",
      error: typeof r.error === "string" ? r.error : undefined,
    });
  }
  return out;
}

export function loadQueue(userId: string): QueuedMutation[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = localStorage.getItem(queueStorageKey(userId));
    if (!raw) return [];
    return parseQueue(JSON.parse(raw), userId);
  } catch {
    return [];
  }
}

export function saveQueue(userId: string, items: QueuedMutation[]) {
  if (typeof window === "undefined" || !userId) return;
  localStorage.setItem(queueStorageKey(userId), JSON.stringify(items));
  localStorage.setItem(QUEUE_OWNER_KEY, userId);
}

export function enqueue(
  userId: string,
  kind: MutationKind,
  payload: Record<string, unknown>,
  expected?: Record<string, unknown>,
  mutationId?: string,
): QueuedMutation {
  const id = mutationId || uid();
  const existing = loadQueue(userId);
  const dup = existing.find((i) => i.id === id);
  if (dup) return dup;
  const item: QueuedMutation = {
    id,
    userId,
    kind,
    payload,
    expected,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  saveQueue(userId, [...existing, item]);
  return item;
}

export function isolateAccount(previousUserId: string | null, nextUserId: string | null) {
  if (typeof window === "undefined") return;
  if (previousUserId && previousUserId !== nextUserId) {
    /* Do not delete A's queue (they may log back in). Never expose it to B. */
    localStorage.setItem(QUEUE_OWNER_KEY, nextUserId ?? "");
  }
}

export function activeQueueOwner(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(QUEUE_OWNER_KEY);
}

export function mutationsForUser(userId: string): QueuedMutation[] {
  if (!userId) return [];
  return loadQueue(userId).filter((m) => m.userId === userId);
}

export function clearSynced(userId: string, items: QueuedMutation[]): QueuedMutation[] {
  const next = items.filter((i) => i.status !== "synced");
  saveQueue(userId, next);
  return next;
}

export function detectConflict(
  expected: Record<string, unknown> | undefined,
  current: Record<string, unknown> | null,
): boolean {
  if (!expected || !current) return false;
  for (const key of Object.keys(expected)) {
    if (current[key] !== expected[key]) return true;
  }
  return false;
}

export function cannotExecuteAs(actorId: string, mutation: QueuedMutation): boolean {
  return !mutation.userId || mutation.userId !== actorId;
}

export type Connectivity = "online" | "offline" | "syncing" | "error";

export function connectivityLabel(state: Connectivity, pending: number): string {
  if (state === "offline") return "Offline — changes saved locally";
  if (state === "syncing") return "Syncing changes…";
  if (state === "error") return "Some changes need attention";
  if (pending > 0) return "Changes synced";
  return "Synced";
}
