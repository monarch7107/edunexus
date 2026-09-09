/**
 * Best-effort durable audit writes.
 * DEMO: memory + optional file snapshot (not production).
 * SUPABASE: insert/update via the authenticated server client.
 * Failures never authorize extra writes; they only affect audit durability.
 */
import { agentPersistenceMode } from "./persistence-mode";
import { memoryStore } from "./memory-store";
import type { AgentRunRecord, ChangeSetRecord } from "./types";

export async function persistAgentRun(run: AgentRunRecord): Promise<void> {
  memoryStore.runs.set(run.id, run);
  if (agentPersistenceMode() !== "supabase") return;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    await supabase.from("agent_runs").upsert({
      id: run.id,
      user_id: run.user_id,
      agent_type: run.agent_type,
      intent: run.intent,
      status: run.status,
      started_at: run.started_at,
      completed_at: run.completed_at,
      error_class: run.error_class,
      input_summary: run.input_summary.slice(0, 400),
      output_summary: run.output_summary.slice(0, 400),
      metadata: run.metadata,
      request_id: run.request_id,
    });
  } catch {
    /* Audit write is best-effort; academic tools remain the source of truth. */
  }
}

export async function persistChangeSetAudit(set: ChangeSetRecord): Promise<void> {
  memoryStore.saveChangeSet(set);
  if (agentPersistenceMode() !== "supabase") return;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    await supabase.from("change_sets").upsert({
      id: set.id,
      agent_run_id: set.agent_run_id,
      user_id: set.user_id,
      title: set.title,
      reason: set.reason,
      status: set.status,
      created_at: set.created_at,
      expires_at: set.expires_at,
      proposal_hash: set.hash,
    });
    for (const item of set.items) {
      await supabase.from("change_items").upsert({
        id: item.id,
        change_set_id: item.change_set_id,
        user_id: item.user_id,
        operation: item.operation,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        payload: item.payload,
        previous_state: item.previous_state,
        status: item.status,
        error: item.error,
      });
    }
  } catch {
    /* best-effort */
  }
}

export async function loadChangeSetFromDurable(
  id: string,
  userId: string,
): Promise<ChangeSetRecord | null> {
  const local = memoryStore.getChangeSet(id, userId);
  if (local) return local;
  if (agentPersistenceMode() !== "supabase") return null;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: set, error } = await supabase
      .from("change_sets")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !set) return null;
    const { data: items } = await supabase
      .from("change_items")
      .select("*")
      .eq("change_set_id", id)
      .eq("user_id", userId);
    const record: ChangeSetRecord = {
      id: set.id,
      agent_run_id: set.agent_run_id,
      user_id: set.user_id,
      title: set.title,
      reason: set.reason,
      status: set.status,
      created_at: set.created_at,
      expires_at: set.expires_at,
      items: (items ?? []).map((i: Record<string, unknown>) => ({
        id: String(i.id),
        change_set_id: String(i.change_set_id),
        user_id: String(i.user_id),
        operation: i.operation as ChangeSetRecord["items"][number]["operation"],
        entity_type: String(i.entity_type),
        entity_id: (i.entity_id as string) ?? null,
        payload: (i.payload as Record<string, unknown>) ?? {},
        previous_state: (i.previous_state as Record<string, unknown>) ?? null,
        status: String(i.status),
        error: (i.error as string) ?? null,
      })),
      hash: String(set.proposal_hash ?? ""),
    };
    memoryStore.saveChangeSet(record);
    return record;
  } catch {
    return null;
  }
}
