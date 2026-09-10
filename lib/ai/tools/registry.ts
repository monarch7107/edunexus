import type { ToolDefinition, ToolExecContext } from "./types";
import {
  createStudySession,
  deleteStudySession,
  getStudySessions,
  getSubjects,
  getTasks,
  updateStudySession,
} from "./sessions";
import { authorizeTool } from "../authorization";
import { memoryStore } from "../memory-store";
import { agentPersistenceMode } from "../persistence-mode";
import type { AgentActionRecord } from "../types";

const tools: ToolDefinition[] = [
  getSubjects,
  getTasks,
  getStudySessions,
  createStudySession,
  updateStudySession,
  deleteStudySession,
];

const byName = new Map(tools.map((t) => [t.name, t]));

export function getTool(name: string): ToolDefinition | undefined {
  return byName.get(name);
}

export function listTools(): ToolDefinition[] {
  return tools;
}

export async function invokeTool<T = unknown>(
  name: string,
  ctx: ToolExecContext,
  input: unknown,
): Promise<T> {
  const tool = authorizeTool(ctx, getTool(name), name);
  const validated = tool.validateInput(input);
  ctx.toolCallCount += 1;
  const result = await tool.execute(ctx, validated);
  const action = memoryStore.addAction({
    agent_run_id: ctx.agentRunId ?? "",
    user_id: ctx.userId,
    agent_type: ctx.agentType,
    tool_name: name,
    action_type: tool.requiresApproval ? "write" : "read",
    target_type: "study_session",
    target_id:
      typeof (input as { id?: string })?.id === "string"
        ? (input as { id: string }).id
        : typeof (result as { id?: string })?.id === "string"
          ? (result as { id: string }).id
          : null,
    input_summary: name,
    status: "executed",
    requires_approval: tool.requiresApproval,
    approved_at: tool.requiresApproval ? new Date().toISOString() : null,
    executed_at: new Date().toISOString(),
    verified_at: null,
    error_class: null,
    mutation_id: ctx.mutationId ?? null,
  });
  void persistAction(action);
  return result as T;
}

/** Best-effort durable audit of tool actions (idempotency ledger in Supabase). */
async function persistAction(action: AgentActionRecord) {
  if (agentPersistenceMode() !== "supabase") return;
  if (!action.agent_run_id) return; // FK requires the run row to exist
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    await supabase.from("agent_actions").upsert({
      id: action.id,
      agent_run_id: action.agent_run_id || null,
      user_id: action.user_id,
      agent_type: action.agent_type,
      tool_name: action.tool_name,
      action_type: action.action_type,
      target_type: action.target_type,
      target_id: action.target_id,
      input_summary: action.input_summary.slice(0, 400),
      status: action.status,
      requires_approval: action.requires_approval,
      approved_at: action.approved_at,
      executed_at: action.executed_at,
      verified_at: action.verified_at,
      error_class: action.error_class,
      mutation_id: action.mutation_id,
    }, { onConflict: "id" });
  } catch {
    /* best-effort audit; academic writes already landed */
  }
}
