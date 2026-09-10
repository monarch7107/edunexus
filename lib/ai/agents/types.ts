import type { AcademicContext, AgentPlan, Intent } from "../types";

export interface AgentInput {
  userId: string;
  message: string;
  intent: Intent;
  context: AcademicContext;
}

export interface PlanningAgent {
  name: "planning";
  canHandle(intent: Intent): boolean;
  buildContext(input: AgentInput): Promise<AcademicContext>;
  plan(context: AcademicContext, message: string): Promise<AgentPlan>;
  validate(plan: AgentPlan, context: AcademicContext): AgentPlan;
}
