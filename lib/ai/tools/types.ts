import type { z } from "zod";
import type { AgentType, ChangeOperation } from "../types";
import type { Principal, RunBudget } from "../authorization";
import type { AcademicPort } from "../store/types";

/**
 * Execution context supplied by the server to every tool call.
 *
 * The `principal` originates from the authenticated session. Agents
 * receive tool *invokers*, never this context, so an agent cannot forge
 * an identity.
 */
export interface ToolContext {
  principal: Principal;
  academic: AcademicPort;
  budget: RunBudget;
  agent: AgentType;
  /** Set once the student has approved; required for write tools. */
  approval?: { granted: boolean; expiresAt: string | null };
}

export interface ToolDefinition<Input, Output> {
  name: string;
  description: string;
  inputSchema: z.ZodType<Input>;
  outputSchema: z.ZodType<Output>;
  /** Static allowlist — the model cannot extend it. */
  allowedAgents: readonly AgentType[];
  /** Write tools set this; enforced immediately before execution. */
  requiresApproval: boolean;
  kind: "read" | "write";
  /** The operation recorded in the audit trail. */
  operation: ChangeOperation | "read";
  targetType: string;
  execute(input: Input, context: ToolContext): Promise<Output>;
}

/** Any tool, for registry storage. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyToolDefinition = ToolDefinition<any, any>;
