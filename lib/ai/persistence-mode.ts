/**
 * Explicit persistence mode. Demo process-memory/file must never be
 * described as production Supabase durability.
 */
export type PersistenceMode = "demo" | "supabase";

export function agentPersistenceMode(): PersistenceMode {
  return process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? "supabase"
    : "demo";
}

export function isSupabaseAgentPersist(): boolean {
  return agentPersistenceMode() === "supabase";
}
