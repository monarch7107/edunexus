/**
 * Durable persistence for agentic academic writes.
 *
 * DEMO: writes go to the in-process store (memory) — honest demo only.
 * SUPABASE: writes go through the authenticated server client, so RLS enforces
 * auth.uid() = user_id and every operation is re-filtered by user_id on the
 * server. The model never chooses a user id; it comes from the session.
 *
 * Verification rereads the same store ("read the database again"), so a
 * success reported by the agent is checked against the durable source.
 */
import { AiError } from "./errors";
import { memoryStore } from "./memory-store";
import { agentPersistenceMode } from "./persistence-mode";
import type { AcademicSession } from "./types";

export interface DurableSessionWriter {
  create(userId: string, session: AcademicSession): Promise<AcademicSession>;
  update(userId: string, session: AcademicSession): Promise<AcademicSession>;
  remove(userId: string, id: string): Promise<void>;
}

export interface DurableSessionReader {
  get(userId: string, id: string): Promise<AcademicSession | null>;
  list(userId: string): Promise<AcademicSession[]>;
}

export interface DurableSessionStore extends DurableSessionWriter, DurableSessionReader {}

/** Default durable store: the process store (demo / tests). */
export const memoryStoreWriter: DurableSessionStore = {
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
  async get(userId, id) {
    return memoryStore.getSession(userId, id);
  },
  async list(userId) {
    return memoryStore.getAcademic(userId).sessions;
  },
};

let store: DurableSessionStore = memoryStoreWriter;

export function setSessionStore(next: DurableSessionStore) {
  store = next;
}

/** Test hook only — keeps the previous behaviour documented. */
export function setSessionWriter(next: DurableSessionWriter) {
  store = {
    ...memoryStoreWriter,
    create: (u, s) => next.create(u, s),
    update: (u, s) => next.update(u, s),
    remove: (u, id) => next.remove(u, id),
  };
}

export function getSessionStore(): DurableSessionStore {
  return store;
}

interface SupabaseRow {
  id: string;
  subject_id: string | null;
  title: string;
  planned_date: string;
  duration_minutes: number;
  status: string;
}

function toSession(row: SupabaseRow): AcademicSession {
  return {
    id: row.id,
    subject_id: row.subject_id,
    title: row.title,
    planned_date: String(row.planned_date).slice(0, 10),
    duration_minutes: row.duration_minutes,
    status: row.status,
  };
}

function dbError(action: string, message: string): AiError {
  return new AiError("database", `${message}`, 500);
}

/**
 * Supabase-backed store. The server client is created per call (fresh cookies),
 * so RLS always sees the signed-in user and no service-role key is involved.
 */
export const supabaseSessionStore: DurableSessionStore = {
  async create(userId, session) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = createClient();
      // Let Postgres generate the uuid; the agent-facing id is returned.
      const { data, error } = await supabase
        .from("study_sessions")
        .insert({
          user_id: userId,
          subject_id: session.subject_id,
          title: session.title,
          planned_date: session.planned_date.slice(0, 10),
          duration_minutes: session.duration_minutes,
          status: session.status,
        })
        .select("*")
        .single();
      if (error) throw dbError("create", "Could not save the study session.");
      const created = toSession(data as SupabaseRow);
      memoryStore.upsertSession(userId, created);
      return created;
    } catch (error) {
      if (error instanceof AiError) throw error;
      throw dbError("create", "Could not save the study session.");
    }
  },

  async update(userId, session) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("study_sessions")
        .update({
          subject_id: session.subject_id,
          title: session.title,
          planned_date: session.planned_date.slice(0, 10),
          duration_minutes: session.duration_minutes,
          status: session.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id)
        .eq("user_id", userId)
        .select("*")
        .single();
      if (error) throw dbError("update", "Could not update the study session.");
      const updated = toSession(data as SupabaseRow);
      memoryStore.upsertSession(userId, updated);
      return updated;
    } catch (error) {
      if (error instanceof AiError) throw error;
      throw dbError("update", "Could not update the study session.");
    }
  },

  async remove(userId, id) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("study_sessions")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id");
      if (error) throw dbError("delete", "Could not delete the study session.");
      if (!data || data.length === 0) {
        throw new AiError("not_found", "Study session not found or not owned.", 404);
      }
      memoryStore.deleteSession(userId, id);
    } catch (error) {
      if (error instanceof AiError) throw error;
      throw dbError("delete", "Could not delete the study session.");
    }
  },

  async get(userId, id) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw dbError("read", "Could not read study sessions.");
      return data ? toSession(data as SupabaseRow) : null;
    } catch (error) {
      if (error instanceof AiError) throw error;
      throw dbError("read", "Could not read study sessions.");
    }
  },

  async list(userId) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("planned_date", { ascending: true });
      if (error) throw dbError("read", "Could not read study sessions.");
      return (data as SupabaseRow[]).map(toSession);
    } catch (error) {
      if (error instanceof AiError) throw error;
      throw dbError("read", "Could not read study sessions.");
    }
  },
};

/** Idempotent: called once per process before gateway handlers run. */
let configured = false;
export function configureSessionStore() {
  if (configured) return getSessionStore();
  configured = true;
  if (agentPersistenceMode() === "supabase") {
    store = supabaseSessionStore;
  }
  return store;
}
