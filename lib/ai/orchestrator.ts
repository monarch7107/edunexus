/**
 * Orchestrator — coordinates the agentic pipeline.
 *
 * It never performs arbitrary database writes: every mutation of student
 * academic data goes through the Tool Registry, and every mutation is
 * gated on a live approval. Its own writes are limited to the V2 audit
 * tables (runs / actions / change sets / items / approvals).
 */

import { AgentError, logAgentDiagnostic, toAgentError } from "./errors";
import { AI_LIMITS } from "./limits";
import { RunBudget, assertWithinRateLimit, type Principal } from "./authorization";
import {
  approvalExpiry,
  assertExecutable,
  fingerprintChangeItems,
  isExpired,
} from "./approvals";
import { summarizeVerification, verifyChangeItems } from "./verification";
import { invokeTool } from "./tools/registry";
import { PlanningAgent, toChangeView, type PlanningAgentOptions } from "./agents/planning";
import type { Agent, AgentRuntime } from "./agents/types";
import type { AcademicPort, AgentStore } from "./store/types";
import type { StudySession } from "../types";
import type {
  ActionStatus,
  AgentRunResponse,
  ChangeItemRecord,
  ChangeView,
  ExecutionResult,
  Intent,
  VerificationResult,
} from "./types";

// ── Intent recognition ───────────────────────────────────────────────────────

const SCHEDULE_KEYWORDS = [
  "schedule",
  "study plan",
  "studyplan",
  "timetable",
  "time table",
  "plan my",
  "planner",
  "revision",
  "revise",
  "exam",
  "exams",
  "optimi", // optimise / optimize
  "reorganize",
  "reorganise",
  "rearrange",
  "free time",
  "my week",
  "next week",
  "fix my",
  "prepare",
];

/**
 * Deterministic, keyword-based intent detection.
 *
 * Intent selection is NOT delegated to the model: routing decides which
 * tools become reachable, so it stays server-controlled. Slice 1 knows a
 * single intent, and anything unrecognised is refused rather than guessed.
 */
export function detectIntent(message: string): Intent | null {
  const text = message.toLowerCase();
  if (SCHEDULE_KEYWORDS.some((k) => text.includes(k))) return "optimize_schedule";
  return null;
}

export function selectAgent(intent: Intent, options?: PlanningAgentOptions): Agent {
  const agents: Agent[] = [new PlanningAgent(options)];
  const agent = agents.find((a) => a.canHandle(intent));
  if (!agent) {
    throw new AgentError("unsupported", "The assistant can’t help with that yet.", {
      internal: `no agent for intent ${intent}`,
    });
  }
  return agent;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export interface OrchestratorDeps {
  academic: AcademicPort;
  store: AgentStore;
  planning?: PlanningAgentOptions;
  /** Test seam. */
  now?: () => Date;
}

export class Orchestrator {
  constructor(private deps: OrchestratorDeps) {}

  private now(): Date {
    return this.deps.now?.() ?? new Date();
  }

  private runtime(principal: Principal, budget: RunBudget): AgentRuntime {
    return {
      principal,
      academic: this.deps.academic,
      store: this.deps.store,
      budget,
    };
  }

  /**
   * Phase 1 — understand, plan, validate, and propose.
   * Produces a ChangeSet in `pending` state. NOTHING is written to the
   * student's academic data in this phase.
   */
  async proposePlan(
    principal: Principal,
    request: { message: string; surface: string },
  ): Promise<AgentRunResponse> {
    assertWithinRateLimit(principal.userId, this.now().getTime());

    const intent = detectIntent(request.message);
    if (!intent) {
      throw new AgentError(
        "unsupported",
        "I can help you optimize your study schedule. Try: “I have three exams next week — fix my study schedule.”",
        { internal: "intent not recognized" },
      );
    }

    const budget = new RunBudget();
    budget.consumeIteration();
    const agent = selectAgent(intent, this.deps.planning);
    const runtime = this.runtime(principal, budget);

    // Audit the run from the very beginning.
    const run = await this.deps.store.createRun({
      user_id: principal.userId,
      agent_type: agent.name,
      intent,
      status: "running",
      completed_at: null,
      error_class: null,
      // Only a bounded, non-sensitive summary of the request is stored.
      input_summary: request.message.slice(0, 200),
      output_summary: "",
      metadata: { surface: request.surface },
      request_id: principal.requestId,
    });

    try {
      const input = {
        message: request.message,
        intent,
        surface: request.surface,
        runId: run.id,
        requestId: principal.requestId,
      };

      const context = await agent.buildContext(input, runtime);
      const plan = await agent.plan(context, input);
      const validated = await agent.validate(plan, context, runtime);

      // No changes worth proposing — complete the run honestly.
      if (validated.changes.length === 0) {
        await this.deps.store.updateRun(principal.userId, run.id, {
          status: "completed",
          completed_at: this.now().toISOString(),
          output_summary: validated.summary.slice(0, 400),
        });
        return {
          runId: run.id,
          status: "completed",
          agent: agent.name,
          intent,
          summary: validated.summary,
          source: validated.source,
          fallback: validated.source === "fallback",
          evidence: validated.evidence,
          findings: context.findings,
          changeSetId: null,
          changes: [],
          expiresAt: null,
          analyzed: {
            subjects: context.subjects.length,
            tasks: context.tasks.length,
            sessions: context.sessions.length,
          },
        };
      }

      const expiresAt = approvalExpiry(this.now());
      const changeSet = await this.deps.store.createChangeSet({
        agent_run_id: run.id,
        user_id: principal.userId,
        title: "Optimize my study schedule",
        reason: validated.reason,
        status: "pending",
        expires_at: expiresAt,
      });

      const items = await this.deps.store.createChangeItems(
        changeSet.id,
        principal.userId,
        validated.changes.map((change) => ({
          operation: change.operation,
          entity_type: change.entity,
          entity_id: change.entity_id,
          payload: change.payload,
          previous_state: change.previous_state,
          status: "pending" as ActionStatus,
          error: null,
          label: change.label,
          detail: change.detail,
          reason: change.reason,
        })),
      );

      // One pending approval record accompanies the pending change set.
      await this.deps.store.createApproval({
        agent_run_id: run.id,
        change_set_id: changeSet.id,
        user_id: principal.userId,
        status: "pending",
        reviewed_at: null,
        expires_at: expiresAt,
        change_fingerprint: fingerprintChangeItems(items),
      });

      await this.deps.store.updateRun(principal.userId, run.id, {
        status: "waiting_approval",
        output_summary: validated.summary.slice(0, 400),
      });

      return {
        runId: run.id,
        status: "waiting_approval",
        agent: agent.name,
        intent,
        summary: validated.summary,
        source: validated.source,
        fallback: validated.source === "fallback",
        evidence: validated.evidence,
        findings: context.findings,
        changeSetId: changeSet.id,
        changes: items.map(toChangeView),
        expiresAt,
        analyzed: {
          subjects: context.subjects.length,
          tasks: context.tasks.length,
          sessions: context.sessions.length,
        },
      };
    } catch (error) {
      const agentError = toAgentError(error);
      logAgentDiagnostic("propose", agentError.class, { runId: run.id });
      await this.deps.store.updateRun(principal.userId, run.id, {
        status: "failed",
        completed_at: this.now().toISOString(),
        error_class: agentError.class,
      });
      throw agentError;
    }
  }

  /** Load a change set the caller owns, or fail closed. */
  private async requireChangeSet(principal: Principal, changeSetId: string) {
    const changeSet = await this.deps.store.getChangeSet(principal.userId, changeSetId);
    // Another user's change set is indistinguishable from a missing one.
    if (!changeSet) {
      throw new AgentError("not_found", "Those proposed changes are no longer available.", {
        internal: `change set ${changeSetId} not visible to principal`,
      });
    }
    return changeSet;
  }

  /**
   * Phase 2a — student edits an item.
   * Any edit invalidates the existing approval by changing the fingerprint.
   */
  async editChangeItem(
    principal: Principal,
    input: {
      runId: string;
      changeSetId: string;
      itemId: string;
      payload: { title?: string; planned_date?: string; duration_minutes?: number };
    },
  ): Promise<AgentRunResponse> {
    const changeSet = await this.requireChangeSet(principal, input.changeSetId);
    if (changeSet.status === "executed" || changeSet.status === "verified") {
      throw new AgentError("approval", "These changes have already been applied.");
    }

    const items = await this.deps.store.listChangeItems(principal.userId, input.changeSetId);
    const item = items.find((i) => i.id === input.itemId);
    if (!item) {
      throw new AgentError("not_found", "That proposed change no longer exists.");
    }

    const payload = {
      ...item.payload,
      ...(input.payload.title !== undefined ? { title: input.payload.title } : {}),
      ...(input.payload.planned_date !== undefined
        ? { planned_date: input.payload.planned_date }
        : {}),
      ...(input.payload.duration_minutes !== undefined
        ? { duration_minutes: input.payload.duration_minutes }
        : {}),
    };

    await this.deps.store.updateChangeItem(principal.userId, input.itemId, {
      payload,
      status: "pending",
      label:
        item.operation === "create"
          ? `Create ${payload.title}`
          : item.operation === "move"
            ? `Move ${payload.title}`
            : `Update ${payload.title}`,
      detail: `${payload.planned_date} · ${payload.duration_minutes} min`,
    });

    // Reset every item and the set itself back to pending review.
    for (const other of items) {
      if (other.id !== input.itemId && other.status !== "pending") {
        await this.deps.store.updateChangeItem(principal.userId, other.id, {
          status: "pending",
        });
      }
    }
    await this.deps.store.updateChangeSetStatus(principal.userId, input.changeSetId, "pending");

    // Invalidate the stale approval explicitly AND via the fingerprint.
    const approval = await this.deps.store.getApprovalForChangeSet(
      principal.userId,
      input.changeSetId,
    );
    const refreshed = await this.deps.store.listChangeItems(
      principal.userId,
      input.changeSetId,
    );
    if (approval) {
      await this.deps.store.updateApproval(principal.userId, approval.id, {
        status: "pending",
        reviewed_at: null,
        change_fingerprint: fingerprintChangeItems(refreshed),
      });
    }
    await this.deps.store.updateRun(principal.userId, input.runId, {
      status: "waiting_approval",
    });

    const run = await this.deps.store.getRun(principal.userId, input.runId);
    return {
      runId: input.runId,
      status: "waiting_approval",
      agent: "planning",
      intent: "optimize_schedule",
      summary: run?.output_summary || changeSet.reason,
      source: "ai",
      fallback: false,
      evidence: [],
      findings: [],
      changeSetId: changeSet.id,
      changes: refreshed.map(toChangeView),
      expiresAt: changeSet.expires_at,
      analyzed: { subjects: 0, tasks: 0, sessions: 0 },
    };
  }

  /** Phase 2b — student rejects the plan. Nothing executes, ever. */
  async rejectChangeSet(
    principal: Principal,
    input: { runId: string; changeSetId: string },
  ): Promise<{ status: "rejected" }> {
    const changeSet = await this.requireChangeSet(principal, input.changeSetId);
    await this.deps.store.updateChangeSetStatus(principal.userId, changeSet.id, "rejected");
    const approval = await this.deps.store.getApprovalForChangeSet(
      principal.userId,
      changeSet.id,
    );
    if (approval) {
      await this.deps.store.updateApproval(principal.userId, approval.id, {
        status: "rejected",
        reviewed_at: this.now().toISOString(),
      });
    }
    const items = await this.deps.store.listChangeItems(principal.userId, changeSet.id);
    for (const item of items) {
      await this.deps.store.updateChangeItem(principal.userId, item.id, {
        status: "rejected",
      });
    }
    await this.deps.store.updateRun(principal.userId, input.runId, {
      status: "cancelled",
      completed_at: this.now().toISOString(),
    });
    return { status: "rejected" };
  }

  /**
   * Phase 3 — approve, execute, verify.
   *
   * Approval is recorded first, then execution runs strictly against the
   * approved items, then the database is re-read to verify. Success is
   * only ever reported after verification.
   */
  async approveAndExecute(
    principal: Principal,
    input: {
      runId: string;
      changeSetId: string;
      decision: "approve_all" | "approve_selected";
      itemIds?: string[];
    },
  ): Promise<VerificationResult> {
    const changeSet = await this.requireChangeSet(principal, input.changeSetId);
    const run = await this.deps.store.getRun(principal.userId, input.runId);
    if (!run || run.id !== changeSet.agent_run_id) {
      throw new AgentError("not_found", "That assistant run is no longer available.");
    }

    // Terminal states are final. This guard runs BEFORE any status is
    // rewritten below, so an already-executed or rejected set can never be
    // revived into a second execution (which would duplicate rows).
    if (
      changeSet.status === "executed" ||
      changeSet.status === "verified" ||
      changeSet.status === "failed"
    ) {
      throw new AgentError("approval", "These changes have already been applied.", {
        internal: `change set ${changeSet.id} already ${changeSet.status}`,
      });
    }
    if (changeSet.status === "rejected") {
      throw new AgentError("approval", "These changes were rejected.", {
        internal: `change set ${changeSet.id} rejected`,
      });
    }
    if (changeSet.status === "expired") {
      throw new AgentError(
        "approval",
        "This plan has expired. Please ask for a fresh plan.",
        { internal: `change set ${changeSet.id} expired` },
      );
    }

    const now = this.now();
    if (isExpired(changeSet.expires_at, now)) {
      await this.deps.store.updateChangeSetStatus(principal.userId, changeSet.id, "expired");
      throw new AgentError(
        "approval",
        "This plan has expired. Please ask for a fresh plan.",
        { internal: `change set ${changeSet.id} expired at approval time` },
      );
    }

    const items = await this.deps.store.listChangeItems(principal.userId, changeSet.id);
    if (items.length === 0) {
      throw new AgentError("not_found", "Those proposed changes are no longer available.");
    }

    // Mark the student's decision per item.
    const selected = new Set(input.itemIds ?? []);
    const approveAll = input.decision === "approve_all";
    let approvedCount = 0;
    for (const item of items) {
      const approved = approveAll || selected.has(item.id);
      if (approved) approvedCount += 1;
      await this.deps.store.updateChangeItem(principal.userId, item.id, {
        status: approved ? "approved" : "skipped",
      });
    }
    if (approvedCount === 0) {
      throw new AgentError("approval", "No changes were selected, so nothing ran.");
    }

    const reviewedAt = now.toISOString();
    const current = await this.deps.store.listChangeItems(principal.userId, changeSet.id);
    const fingerprint = fingerprintChangeItems(current);

    let approval = await this.deps.store.getApprovalForChangeSet(
      principal.userId,
      changeSet.id,
    );
    const approvalStatus = approvedCount === items.length ? "approved" : "partially_approved";
    if (approval) {
      // The fingerprint recorded here is the one execution will re-check.
      await this.deps.store.updateApproval(principal.userId, approval.id, {
        status: approvalStatus,
        reviewed_at: reviewedAt,
        change_fingerprint: fingerprint,
      });
      approval = { ...approval, status: approvalStatus, reviewed_at: reviewedAt, change_fingerprint: fingerprint };
    } else {
      approval = await this.deps.store.createApproval({
        agent_run_id: run.id,
        change_set_id: changeSet.id,
        user_id: principal.userId,
        status: approvalStatus,
        reviewed_at: reviewedAt,
        expires_at: changeSet.expires_at,
        change_fingerprint: fingerprint,
      });
    }

    await this.deps.store.updateChangeSetStatus(
      principal.userId,
      changeSet.id,
      approvalStatus === "approved" ? "approved" : "partially_approved",
    );

    // Final gate before any write touches the database.
    const refreshedSet = await this.requireChangeSet(principal, changeSet.id);
    const { approvedItems } = assertExecutable({
      changeSet: refreshedSet,
      approval,
      items: current,
      now,
    });

    await this.deps.store.updateRun(principal.userId, run.id, { status: "executing" });

    const execution = await this.executeApproved(principal, {
      runId: run.id,
      changeSetId: changeSet.id,
      approvalExpiresAt: approval.expires_at,
      items: approvedItems,
    });

    return this.verifyExecution(principal, {
      runId: run.id,
      changeSetId: changeSet.id,
      proposed: items.length,
      approved: approvedItems.length,
      execution,
    });
  }

  /**
   * Execute approved items one by one through registered write tools.
   *
   * Postgres has no cross-statement transaction available through
   * PostgREST here, so atomicity is not claimed: each item's real outcome
   * is recorded individually and partial execution is reported honestly.
   */
  private async executeApproved(
    principal: Principal,
    input: {
      runId: string;
      changeSetId: string;
      approvalExpiresAt: string | null;
      items: ChangeItemRecord[];
    },
  ): Promise<ExecutionResult> {
    const budget = new RunBudget();
    const results: ExecutionResult["items"] = [];
    let executed = 0;
    let failed = 0;

    for (const item of input.items) {
      const action = await this.deps.store.recordAction({
        agent_run_id: input.runId,
        user_id: principal.userId,
        agent_type: "planning",
        tool_name:
          item.operation === "create" ? "createStudySession" : "updateStudySession",
        action_type: item.operation,
        target_type: item.entity_type,
        target_id: item.entity_id,
        input_summary: item.label.slice(0, 200),
        status: "approved",
        requires_approval: true,
        approved_at: this.now().toISOString(),
        executed_at: null,
        verified_at: null,
        error_class: null,
      });

      const toolContext = {
        principal,
        academic: this.deps.academic,
        budget,
        agent: "planning" as const,
        // Approval is re-asserted inside the registry for every call.
        approval: { granted: true, expiresAt: input.approvalExpiresAt },
      };

      try {
        let entityId: string | null = item.entity_id;
        if (item.operation === "create") {
          const created = await invokeTool<unknown, StudySession>(
            "createStudySession",
            item.payload,
            toolContext,
          );
          entityId = created.id;
        } else {
          const updated = await invokeTool<unknown, StudySession>(
            "updateStudySession",
            { id: item.entity_id, payload: item.payload },
            toolContext,
          );
          entityId = updated.id;
        }

        executed += 1;
        await this.deps.store.updateChangeItem(principal.userId, item.id, {
          status: "executed",
          entity_id: entityId,
          error: null,
        });
        await this.deps.store.updateAction(principal.userId, action.id, {
          status: "executed",
          executed_at: this.now().toISOString(),
          target_id: entityId,
        });
        results.push({ id: item.id, status: "executed", entity_id: entityId, error: null });
      } catch (error) {
        const agentError = toAgentError(error, "tool");
        logAgentDiagnostic("execute", agentError.class, { runId: input.runId });
        failed += 1;
        await this.deps.store.updateChangeItem(principal.userId, item.id, {
          status: "failed",
          error: agentError.publicMessage,
        });
        await this.deps.store.updateAction(principal.userId, action.id, {
          status: "failed",
          error_class: agentError.class,
        });
        results.push({
          id: item.id,
          status: "failed",
          entity_id: item.entity_id,
          error: agentError.publicMessage,
        });
      }
    }

    return {
      runId: input.runId,
      changeSetId: input.changeSetId,
      items: results,
      executed,
      failed,
    };
  }

  /** Re-read the database and report only what is actually true. */
  private async verifyExecution(
    principal: Principal,
    input: {
      runId: string;
      changeSetId: string;
      proposed: number;
      approved: number;
      execution: ExecutionResult;
    },
  ): Promise<VerificationResult> {
    const items = await this.deps.store.listChangeItems(principal.userId, input.changeSetId);
    const relevant = items.filter((i) => i.status === "executed" || i.status === "failed");
    const verifications = await verifyChangeItems(
      principal.userId,
      this.deps.academic,
      relevant,
    );

    let verified = 0;
    for (const result of verifications) {
      if (result.status === "verified") {
        verified += 1;
        await this.deps.store.updateChangeItem(principal.userId, result.itemId, {
          status: "verified",
          error: null,
        });
      } else if (result.reason && result.status === "executed") {
        await this.deps.store.updateChangeItem(principal.userId, result.itemId, {
          error: result.reason,
        });
      }
    }

    // Mark the matching actions verified.
    const actions = await this.deps.store.listActions(principal.userId, input.runId);
    const finalItems = await this.deps.store.listChangeItems(
      principal.userId,
      input.changeSetId,
    );
    const verifiedTargets = new Set(
      finalItems.filter((i) => i.status === "verified").map((i) => i.entity_id),
    );
    for (const action of actions) {
      if (action.action_type !== "read" && verifiedTargets.has(action.target_id)) {
        await this.deps.store.updateAction(principal.userId, action.id, {
          status: "verified",
          verified_at: this.now().toISOString(),
        });
      }
    }

    const summary = summarizeVerification({
      proposed: input.proposed,
      approved: input.approved,
      executed: input.execution.executed,
      failed: input.execution.failed,
      verified,
    });

    const changeSetStatus = summary.fullyVerified
      ? "verified"
      : input.execution.executed > 0
        ? "executed"
        : "failed";
    await this.deps.store.updateChangeSetStatus(
      principal.userId,
      input.changeSetId,
      changeSetStatus,
    );
    await this.deps.store.updateRun(principal.userId, input.runId, {
      status: summary.fullyVerified ? "completed" : "failed",
      completed_at: this.now().toISOString(),
      error_class: summary.fullyVerified ? null : "verification",
      output_summary: summary.message.slice(0, 400),
    });

    return {
      runId: input.runId,
      changeSetId: input.changeSetId,
      status: changeSetStatus,
      verified,
      proposed: input.proposed,
      approved: input.approved,
      executed: input.execution.executed,
      failed: input.execution.failed,
      fullyVerified: summary.fullyVerified,
      message: summary.message,
      items: finalItems.map(toChangeView),
    };
  }

  /** Agent activity feed for the UI. */
  async getActivity(principal: Principal, runId: string): Promise<{
    run: Awaited<ReturnType<AgentStore["getRun"]>>;
    actions: Awaited<ReturnType<AgentStore["listActions"]>>;
    changes: ChangeView[];
  }> {
    const run = await this.deps.store.getRun(principal.userId, runId);
    if (!run) {
      throw new AgentError("not_found", "That assistant run is no longer available.");
    }
    const actions = await this.deps.store.listActions(principal.userId, runId);
    return { run, actions, changes: [] };
  }
}

export { AI_LIMITS };
