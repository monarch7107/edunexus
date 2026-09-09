import { memoryStore } from "./memory-store";
import type { AcademicSession, ChangeItemRecord } from "./types";

export interface ItemVerification {
  itemId: string;
  ok: boolean;
  expected?: Partial<AcademicSession>;
  actual?: AcademicSession | null;
}

export function verifyChangeItems(
  userId: string,
  items: ChangeItemRecord[],
  createdByItem: Map<string, string>,
): ItemVerification[] {
  return items.map((item) => {
    if (item.operation === "create") {
      const id = createdByItem.get(item.id);
      const actual = id ? memoryStore.getSession(userId, id) : null;
      const ok = Boolean(actual);
      if (ok && actual) {
        memoryStore.actions
          .filter((a) => a.user_id === userId && a.target_id === actual.id)
          .forEach((a) => {
            a.verified_at = new Date().toISOString();
            a.status = "verified";
          });
      }
      return { itemId: item.id, ok, actual };
    }
    if (item.operation === "delete") {
      const gone = item.entity_id ? !memoryStore.getSession(userId, item.entity_id) : false;
      return { itemId: item.id, ok: gone, actual: null };
    }
    const id = item.entity_id;
    const actual = id ? memoryStore.getSession(userId, id) : null;
    if (!actual) return { itemId: item.id, ok: false, actual: null };
    const date = item.payload.planned_date;
    const title = item.payload.title;
    const ok =
      (typeof date !== "string" || actual.planned_date.slice(0, 10) === String(date).slice(0, 10)) &&
      (typeof title !== "string" || actual.title === title);
    return { itemId: item.id, ok, actual };
  });
}
