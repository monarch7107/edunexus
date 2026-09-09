/**
 * Tool Registry — the enforcement point.
 *
 * Every invocation passes, in order:
 *   1. authenticated user check
 *   2. tool exists check
 *   3. agent permission check
 *   4. input schema validation
 *   5. budget check
 *   6. approval validation (writes only)
 *   7. resource ownership + business rules (inside the tool)
 * …and only then executes. Output is schema-checked on the way back.
 *
 * There is no code path from an agent to `AcademicPort` that bypasses this.
 */

import { AgentError, toAgentError } from "../errors";
import { assertAgentAllowed, assertApproved } from "../authorization";
import type { AnyToolDefinition, ToolContext, ToolDefinition } from "./types";
import {
  createStudySessionTool,
  deleteStudySessionTool,
  getStudySessionsTool,
  getSubjectsTool,
  getTasksTool,
  updateStudySessionTool,
} from "./sessions";

const TOOLS: AnyToolDefinition[] = [
  getSubjectsTool,
  getTasksTool,
  getStudySessionsTool,
  createStudySessionTool,
  updateStudySessionTool,
  deleteStudySessionTool,
];

const REGISTRY = new Map<string, AnyToolDefinition>(TOOLS.map((t) => [t.name, t]));

export function getTool(name: string): AnyToolDefinition | undefined {
  return REGISTRY.get(name);
}

export function listTools(): AnyToolDefinition[] {
  return [...REGISTRY.values()];
}

/** Tools an agent is allowed to see. Used for prompts and diagnostics. */
export function listToolsForAgent(agent: string): AnyToolDefinition[] {
  return listTools().filter((t) =>
    (t.allowedAgents as readonly string[]).includes(agent),
  );
}

/**
 * Invoke a registered tool under full authorization.
 * Throws `AgentError` on any policy failure; never partially applies.
 */
export async function invokeTool<Input, Output>(
  toolName: string,
  input: unknown,
  context: ToolContext,
): Promise<Output> {
  // 1. Authenticated user.
  if (!context.principal?.userId) {
    throw new AgentError("auth", "Your session has expired. Please log in again.");
  }

  // 2. Tool must be registered.
  const tool = REGISTRY.get(toolName) as ToolDefinition<Input, Output> | undefined;
  if (!tool) {
    throw new AgentError("permission", "That action isn’t available.", {
      internal: `unknown tool ${toolName}`,
    });
  }

  // 3. Agent permission (static allowlist).
  assertAgentAllowed(context.agent, tool.name, tool.allowedAgents);

  // 4. Input schema validation.
  const parsed = tool.inputSchema.safeParse(input);
  if (!parsed.success) {
    throw new AgentError("validation", "That action had invalid details, so it was skipped.", {
      internal: `input rejected for ${tool.name}`,
    });
  }

  // 5. Per-run budget.
  context.budget.consumeToolCall(tool.name);

  // 6. Approval — evaluated at execution time so expiry is caught late.
  assertApproved({
    requiresApproval: tool.requiresApproval,
    approvalGranted: context.approval?.granted ?? false,
    approvalExpiresAt: context.approval?.expiresAt ?? null,
  });

  // 7. Execute (ownership + business rules live inside the tool).
  let output: Output;
  try {
    output = await tool.execute(parsed.data, context);
  } catch (error) {
    const agentError = toAgentError(error, "tool");
    throw agentError;
  }

  const validatedOutput = tool.outputSchema.safeParse(output);
  if (!validatedOutput.success) {
    throw new AgentError("tool", "That change couldn’t be confirmed.", {
      internal: `output rejected for ${tool.name}`,
    });
  }
  return validatedOutput.data;
}
