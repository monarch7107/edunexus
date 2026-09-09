/**
 * Deterministic authorization for every agent action.
 *
 * NOTHING here consults the model. The principal is built once, from the
 * authenticated server session, and is the only source of `userId` in the
 * entire pipeline. An AI-supplied `user_id` is not merely ignored — the
 * types make it impossible to supply one.
 */

import { AgentError } from "./errors";
import { AI_LIMITS } from "./limits";
import type { AgentType } from "./types";
import type { AcademicPort } from "./store/types";

/**
 * The authenticated actor. Constructed ONLY by the gateway from the
 * server-side session (or by tests). Treat as a capability token.
 */
export interface Principal {
  readonly userId: string;
  readonly requestId: string;
}

export function createPrincipal(userId: string, requestId: string): Principal {
  if (!userId || typeof userId !== "string") {
    throw new AgentError("auth", "Your session has expired. Please log in again.");
  }
  return Object.freeze({ userId, requestId });
}

/** Per-run budget: bounds tool calls so a loop cannot hammer the database. */
export class RunBudget {
  private toolCalls = 0;
  private iterations = 0;

  consumeToolCall(toolName: string): void {
    this.toolCalls += 1;
    if (this.toolCalls > AI_LIMITS.MAX_TOOL_CALLS) {
      throw new AgentError(
        "permission",
        "The assistant tried to do too much at once. Nothing was changed.",
        { internal: `tool call budget exceeded at ${toolName}` },
      );
    }
  }

  consumeIteration(): void {
    this.iterations += 1;
    if (this.iterations > AI_LIMITS.MAX_AGENT_ITERATIONS) {
      throw new AgentError("permission", "The assistant took too many steps.", {
        internal: "iteration budget exceeded",
      });
    }
  }

  get usedToolCalls(): number {
    return this.toolCalls;
  }
}

/**
 * Assert that an agent is permitted to use a tool.
 * `allowedAgents` is declared statically on each tool; the model cannot
 * influence this list.
 */
export function assertAgentAllowed(
  agent: AgentType,
  toolName: string,
  allowedAgents: readonly AgentType[],
): void {
  if (!allowedAgents.includes(agent)) {
    throw new AgentError(
      "permission",
      "That action isn’t allowed. Your workspace is unaffected.",
      { internal: `agent ${agent} may not call ${toolName}` },
    );
  }
}

/**
 * Assert that a write is covered by a live approval.
 * Called immediately before execution, never earlier — so an approval that
 * expires between review and execution still blocks the write.
 */
export function assertApproved(options: {
  requiresApproval: boolean;
  approvalGranted: boolean;
  approvalExpiresAt: string | null;
  now?: Date;
}): void {
  if (!options.requiresApproval) return;
  if (!options.approvalGranted) {
    throw new AgentError(
      "approval",
      "These changes need your approval before they can run.",
      { internal: "write attempted without approval" },
    );
  }
  const now = options.now ?? new Date();
  if (
    options.approvalExpiresAt &&
    new Date(options.approvalExpiresAt).getTime() <= now.getTime()
  ) {
    throw new AgentError(
      "approval",
      "That approval has expired. Please review the changes again.",
      { internal: "approval expired" },
    );
  }
}

/**
 * Verify a referenced study session exists AND belongs to the principal.
 * A row owned by somebody else is indistinguishable from a missing row,
 * so this never leaks the existence of another student's data.
 */
export async function assertSessionOwnership(
  principal: Principal,
  academic: AcademicPort,
  sessionId: string,
): Promise<void> {
  const session = await academic.getSession(principal.userId, sessionId);
  if (!session) {
    throw new AgentError(
      "not_found",
      "Some of the items referenced no longer exist. Please refresh and try again.",
      { internal: `session ${sessionId} not found for principal` },
    );
  }
}

/** In-process rate limiter. Bounded, per user, best-effort. */
const runHistory = new Map<string, number[]>();

export function assertWithinRateLimit(userId: string, now = Date.now()): void {
  const window = AI_LIMITS.RATE_LIMIT_WINDOW_MS;
  const history = (runHistory.get(userId) ?? []).filter((t) => now - t < window);
  if (history.length >= AI_LIMITS.RATE_LIMIT_RUNS) {
    throw new AgentError("rate_limit", "A few too many requests. Please wait a moment and try again.");
  }
  history.push(now);
  runHistory.set(userId, history);
  // Keep the map from growing without bound in a long-lived server process.
  if (runHistory.size > 5000) {
    for (const [key, times] of runHistory) {
      if (times.every((t) => now - t >= window)) runHistory.delete(key);
    }
  }
}

/** Test helper — clears the in-process limiter. */
export function resetRateLimit(): void {
  runHistory.clear();
}
