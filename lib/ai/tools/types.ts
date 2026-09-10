import type { AgentType } from "../types";

export interface ToolDefinition {
  name: string;
  description: string;
  allowedAgents: AgentType[];
  requiresApproval: boolean;
  validateInput: (input: unknown) => unknown;
  execute: (ctx: ToolExecContext, input: unknown) => Promise<unknown>;
}

export interface ToolExecContext {
  userId: string;
  agentType: AgentType;
  approved: boolean;
  toolCallCount: number;
  /** Agent run the action belongs to (durable audit). */
  agentRunId?: string;
  /** Deterministic per change-item key used for idempotent execution. */
  mutationId?: string;
}

export interface SessionWriteInput {
  id?: string;
  title?: string;
  subject_id?: string | null;
  planned_date?: string;
  duration_minutes?: number;
}
