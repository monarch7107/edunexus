/**
 * Durable persistence for agent audit rows.
 * Academic writes still go through authorized tools → memoryStore, then
 * optionally Supabase study_sessions when a server client is available.
 * Never called by the LLM. Never accepts client user_id.
 */
import { memoryStore } from "./memory-store";
import type { AcademicSession, ChangeSetRecord } from "./types";

export interface DurableSessionWriter {
  create(userId: string, session: AcademicSession): Promise<AcademicSession>;
  update(userId: string, session: AcademicSession): Promise<AcademicSession>;
  remove(userId: string, id: string): Promise<void>;
}

/** Default durable writer: the process store (demo / tests). */
export const memoryWriter: DurableSessionWriter = {
  async create(userId, session) {
    memoryStore.upsertSession(userId, session);
    return session;
  },
  async update(userId, session) {
    memoryStore.upsertSession(userId, session);
    return session;
  },
  async remove(userId, id) {
    memoryStore.deleteSession(userId, id);
  },
};

let writer: DurableSessionWriter = memoryWriter;

export function setSessionWriter(next: DurableSessionWriter) {
  writer = next;
}

export function getSessionWriter(): DurableSessionWriter {
  return writer;
}

export async function persistChangeSet(set: ChangeSetRecord) {
  memoryStore.saveChangeSet(set);
}
