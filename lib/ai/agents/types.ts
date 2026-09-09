import type {
  AgentContext,
  AgentInput,
  AgentPlan,
  AgentType,
  ExecutionResult,
  Intent,
  ValidatedPlan,
  VerificationResult,
} from "../types";
import type { Principal, RunBudget } from "../authorization";
import type { AcademicPort, AgentStore } from "../store/types";

/** Everything an agent is permitted to touch. No raw database client. */
export interface AgentRuntime {
  principal: Principal;
  academic: AcademicPort;
  store: AgentStore;
  budget: RunBudget;
}

/**
 * The agent contract. Note the deliberate asymmetry: an agent can
 * `plan` (reason) and `validate` (propose), but `execute` and `verify`
 * are only reachable after the orchestrator has obtained approval.
 */
export interface Agent {
  readonly name: AgentType;
  canHandle(intent: Intent): boolean;
  buildContext(input: AgentInput, runtime: AgentRuntime): Promise<AgentContext>;
  plan(context: AgentContext, input: AgentInput): Promise<AgentPlan>;
  validate(
    plan: AgentPlan,
    context: AgentContext,
    runtime: AgentRuntime,
  ): Promise<ValidatedPlan>;
  execute(
    plan: ValidatedPlan,
    runtime: AgentRuntime,
    options: { runId: string; changeSetId: string; approvalExpiresAt: string | null },
  ): Promise<ExecutionResult>;
  verify(result: ExecutionResult): Promise<VerificationResult>;
}
