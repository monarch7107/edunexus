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
  memoryStore.addAction({
    agent_run_id: "",
    user_id: ctx.userId,
    agent_type: ctx.agentType,
    tool_name: name,
    action_type: tool.requiresApproval ? "write" : "read",
    target_type: "study_session",
    target_id:
      typeof (input as { id?: string })?.id === "string" ? (input as { id: string }).id : null,
    input_summary: name,
    status: "executed",
    requires_approval: tool.requiresApproval,
    approved_at: tool.requiresApproval ? new Date().toISOString() : null,
    executed_at: new Date().toISOString(),
    verified_at: null,
    error_class: null,
  });
  return result as T;
}
