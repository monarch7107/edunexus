import { memoryStore } from "./memory-store";
import type { AcademicSession, ChangeItemRecord } from "./types";

export interface ItemVerification {
  itemId: string;
  ok: boolean;
  expected?: Partial<AcademicSession>;
  actual?: AcademicSession | null;
}

export interface SessionReader {
  get(userId: string, id: string): Promise<AcademicSession | null>;
}

/**
 * Re-reads the durable store after a mutation. In Supabase mode the reader is
 * the RLS-backed server client, so verification reflects the database, never
 * just the tool's own response.
 */
export async function verifyChangeItems(
  userId: string,
  items: ChangeItemRecord[],
  createdByItem: Map<string, string>,
  reader: SessionReader,
): Promise<ItemVerification[]> {
  const checks: ItemVerification[] = [];
  for (const item of items) {
    if (item.operation === "create") {
      const id = createdByItem.get(item.id);
      const actual = id ? await reader.get(userId, id) : null;
      const ok = Boolean(actual);
      if (ok && actual) markVerified(userId, item, actual.id);
      checks.push({ itemId: item.id, ok, actual });
      continue;
    }
    if (item.operation === "delete") {
      const actual = item.entity_id ? await reader.get(userId, item.entity_id) : null;
      const ok = item.entity_id ? !actual : false;
      checks.push({ itemId: item.id, ok, actual });
      continue;
    }
    const id = item.entity_id;
    const actual = id ? await reader.get(userId, id) : null;
    if (!actual) {
      checks.push({ itemId: item.id, ok: false, actual: null });
      continue;
    }
    const date = item.payload.planned_date;
    const title = item.payload.title;
    const duration = item.payload.duration_minutes;
    const subjectId = item.payload.subject_id;
    const ok =
      (typeof date !== "string" || actual.planned_date.slice(0, 10) === String(date).slice(0, 10)) &&
      (typeof title !== "string" || actual.title === title) &&
      (typeof duration !== "number" || actual.duration_minutes === duration) &&
      (subjectId === undefined || actual.subject_id === subjectId);
    if (ok) markVerified(userId, item, actual.id);
    checks.push({ itemId: item.id, ok, actual });
  }
  return checks;
}

function markVerified(userId: string, _item: ChangeItemRecord, targetId: string) {
  memoryStore.actions
    .filter((a) => a.user_id === userId && a.target_id === targetId)
    .forEach((a) => {
      a.verified_at = new Date().toISOString();
      a.status = "verified";
    });
}
