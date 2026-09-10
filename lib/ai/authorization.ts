import { AiError } from "./errors";
import { AI_LIMITS, type AgentType } from "./types";
import type { ToolDefinition, ToolExecContext } from "./tools/types";
import { memoryStore } from "./memory-store";

export function authorizeTool(
  ctx: ToolExecContext,
  tool: ToolDefinition | undefined,
  toolName: string,
): ToolDefinition {
  if (!ctx.userId) throw new AiError("auth", "Not authenticated.", 401);
  if (!tool) throw new AiError("permission", `Unknown tool: ${toolName}`, 403);
  if (!tool.allowedAgents.includes(ctx.agentType as AgentType)) {
    throw new AiError("permission", `Agent cannot call ${toolName}.`, 403);
  }
  if (ctx.toolCallCount >= AI_LIMITS.maxToolCallsPerRun) {
    throw new AiError("permission", "Tool call limit exceeded.", 403);
  }
  if (tool.requiresApproval && !ctx.approved) {
    throw new AiError("approval", "Write tools require student approval.", 403);
  }
  return tool;
}

export function assertOwnedSession(userId: string, sessionId: string) {
  const session = memoryStore.getSession(userId, sessionId);
  if (!session) {
    throw new AiError("not_found", "Study session not found or not owned.", 404);
  }
  return session;
}

export async function assertOwnedSessionAsync(userId: string, sessionId: string) {
  const { getSessionStore } = await import("./persist");
  const found = await getSessionStore().get(userId, sessionId);
  if (!found) {
    throw new AiError("not_found", "Study session not found or not owned.", 404);
  }
  return found;
}

export function assertOwnedSubject(userId: string, subjectId: string | null) {
  if (!subjectId) return;
  const ctx = memoryStore.getAcademic(userId);
  if (!ctx.subjects.some((s) => s.id === subjectId)) {
    throw new AiError("not_found", "Subject not found or not owned.", 404);
  }
}

export function rejectClientUserId(body: unknown) {
  if (
    body &&
    typeof body === "object" &&
    "user_id" in body &&
    (body as { user_id?: unknown }).user_id
  ) {
    throw new AiError("validation", "user_id is not accepted from the client.", 400);
  }
}
