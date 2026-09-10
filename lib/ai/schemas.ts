import { createHash } from "node:crypto";
import type { AcademicContext, ChangeOperation, GatewayRequest, ProposedChange } from "./types";
import { AI_LIMITS } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseGatewayBody(
  raw: unknown,
  byteLength: number,
): { ok: true; request: GatewayRequest } | { ok: false; error: string } {
  if (byteLength > AI_LIMITS.maxBodyBytes) {
    return { ok: false, error: "Request too large." };
  }
  if (!isRecord(raw)) return { ok: false, error: "Invalid request body." };
  if (typeof raw.user_id === "string") {
    return { ok: false, error: "user_id is not accepted from the client." };
  }
  if (typeof raw.message !== "string" || !raw.message.trim()) {
    return { ok: false, error: "Message is required." };
  }
  if (raw.message.length > 2000) {
    return { ok: false, error: "Message is too long." };
  }
  const snapshot = raw.snapshot === undefined ? undefined : parseSnapshot(raw.snapshot);
  if (raw.snapshot !== undefined && !snapshot) {
    return { ok: false, error: "Invalid academic snapshot." };
  }
  return {
    ok: true,
    request: {
      message: raw.message.trim(),
      surface: typeof raw.surface === "string" ? raw.surface : undefined,
      snapshot: snapshot ?? undefined,
    },
  };
}

export function parseSnapshot(raw: unknown): AcademicContext | null {
  if (!isRecord(raw)) return null;
  const subjects: AcademicContext["subjects"] = [];
  const tasks: AcademicContext["tasks"] = [];
  const sessions: AcademicContext["sessions"] = [];
  const subjectsRaw = raw.subjects === undefined ? [] : raw.subjects;
  const tasksRaw = raw.tasks === undefined ? [] : raw.tasks;
  const sessionsRaw = raw.sessions === undefined ? [] : raw.sessions;
  if (!Array.isArray(subjectsRaw) || !Array.isArray(tasksRaw) || !Array.isArray(sessionsRaw)) {
    return null;
  }
  for (const s of subjectsRaw) {
    if (!isRecord(s) || typeof s.id !== "string" || !s.id.trim()) return null;
    subjects.push({
      id: s.id,
      name: typeof s.name === "string" ? s.name : "",
      code: typeof s.code === "string" ? s.code : "",
    });
  }
  for (const t of tasksRaw) {
    if (!isRecord(t) || typeof t.id !== "string" || typeof t.title !== "string") return null;
    tasks.push({
      id: t.id,
      subject_id: typeof t.subject_id === "string" ? t.subject_id : null,
      title: t.title,
      task_type: typeof t.task_type === "string" ? t.task_type : "other",
      priority: typeof t.priority === "string" ? t.priority : "medium",
      due_date: typeof t.due_date === "string" ? t.due_date : null,
      status: typeof t.status === "string" ? t.status : "pending",
    });
  }
  for (const s of sessionsRaw) {
    if (
      !isRecord(s) ||
      typeof s.id !== "string" ||
      typeof s.title !== "string" ||
      typeof s.planned_date !== "string" ||
      typeof s.duration_minutes !== "number"
    ) {
      return null;
    }
    sessions.push({
      id: s.id,
      subject_id: typeof s.subject_id === "string" ? s.subject_id : null,
      title: s.title,
      planned_date: s.planned_date,
      duration_minutes: s.duration_minutes,
      status: typeof s.status === "string" ? s.status : "planned",
    });
  }
  return {
    subjects,
    tasks,
    sessions,
    goals: typeof raw.goals === "string" ? raw.goals : "",
  };
}

const OPS: ChangeOperation[] = ["create", "update", "delete", "move"];

export function parseAgentPlanJson(
  raw: unknown,
): { ok: true; summary: string; evidence: string[]; changes: ProposedChange[] } | { ok: false; error: string } {
  if (!isRecord(raw)) return { ok: false, error: "malformed" };
  if (typeof raw.summary !== "string" || !raw.summary.trim()) {
    return { ok: false, error: "malformed summary" };
  }
  if (!Array.isArray(raw.evidence) || !raw.evidence.every((e) => typeof e === "string")) {
    return { ok: false, error: "malformed evidence" };
  }
  if (!Array.isArray(raw.changes)) return { ok: false, error: "malformed changes" };
  if (raw.changes.length > AI_LIMITS.maxProposedChanges) {
    return { ok: false, error: "too many changes" };
  }
  const changes: ProposedChange[] = [];
  for (const c of raw.changes) {
    if (!isRecord(c)) return { ok: false, error: "malformed change" };
    if (!OPS.includes(c.operation as ChangeOperation)) {
      return { ok: false, error: "unknown operation" };
    }
    if (c.entity !== "study_session") return { ok: false, error: "unsupported entity" };
    const op = c.operation as ChangeOperation;
    if ((op === "update" || op === "delete" || op === "move") && typeof c.entity_id !== "string") {
      return { ok: false, error: "unknown entity id" };
    }
    const payload = isRecord(c.payload) ? c.payload : {};
    changes.push({
      operation: op,
      entity: "study_session",
      entity_id: typeof c.entity_id === "string" ? c.entity_id : null,
      payload,
      label: typeof c.label === "string" ? c.label : `${op} study session`,
    });
  }
  return {
    ok: true,
    summary: raw.summary.slice(0, 600),
    evidence: raw.evidence.map(String).slice(0, 12),
    changes,
  };
}

/**
 * Canonical key-ordered serialization so the same content always produces
 * the same digest, regardless of object key insertion order.
 */
function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(record[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * Proposal fingerprint. This is a real SHA-256 digest of the change items,
 * so an approval can only authorize exactly the content it was issued for.
 */
export function hashChangeSet(items: { operation: string; entity_id: string | null; payload: unknown }[]): string {
  const source = canonicalize(
    items.map((i) => ({ o: i.operation, id: i.entity_id, p: i.payload })),
  );
  return createHash("sha256").update(source, "utf8").digest("hex");
}

/** Deterministic idempotency key for one change item of one change set. */
export function mutationIdForItem(changeSetId: string, itemId: string): string {
  return createHash("sha256").update(`${changeSetId}:${itemId}`, "utf8").digest("hex");
}

export function isoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value);
}
