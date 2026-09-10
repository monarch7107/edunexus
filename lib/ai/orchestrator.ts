import { uid } from "@/lib/utils";
import { uuidv4 } from "@/lib/uuid";
import { planningAgent, recognizeIntent, validatePlanAgainstContext } from "./agents/planning";
import { fallbackOptimizeSchedule } from "./fallback";
import { createPendingApproval } from "./approvals";
import { hashChangeSet, mutationIdForItem } from "./schemas";
import { memoryStore } from "./memory-store";
import { persistAgentRun, persistChangeSetAudit, loadChangeSetFromDurable } from "./audit-persist";
import { invokeTool } from "./tools/registry";
import { verifyChangeItems } from "./verification";
import { AiError } from "./errors";
import { agentPersistenceMode } from "./persistence-mode";
import { getSessionStore } from "./persist";
import type {
  AcademicContext,
  AgentPlan,
  ChangeItemRecord,
  ChangeSetRecord,
  GatewayRequest,
  GatewayResponse,
} from "./types";
import type { ToolExecContext } from "./tools/types";

export interface OrchestratorAuth {
  userId: string;
}

async function toContext(
  snapshot: GatewayRequest["snapshot"],
  userId: string,
): Promise<AcademicContext> {
  // Supabase: the server reads the real workspace — the client snapshot is a
  // demo/offline convenience, never the authority for agent reasoning.
  if (agentPersistenceMode() === "supabase") {
    const { loadAcademicContextServer } = await import("./server-context");
    const ctx = await loadAcademicContextServer(userId);
    memoryStore.setAcademic(userId, ctx);
    return ctx;
  }
  const stored = memoryStore.getAcademic(userId);
  const snap: AcademicContext = {
    subjects: snapshot?.subjects ?? stored.subjects,
    tasks: snapshot?.tasks ?? stored.tasks,
    sessions: snapshot?.sessions ?? stored.sessions,
    goals: snapshot?.goals ?? stored.goals,
  };
  memoryStore.setAcademic(userId, snap);
  return snap;
}

async function changeSetFromPlan(
  runId: string,
  userId: string,
  plan: AgentPlan,
): Promise<ChangeSetRecord> {
  const items: ChangeItemRecord[] = plan.changes.map((c) => ({
    id: uuidv4(),
    change_set_id: "",
    user_id: userId,
    operation: c.operation,
    entity_type: c.entity,
    entity_id: c.entity_id,
    payload: { ...c.payload, label: c.label },
    previous_state: null,
    status: "pending",
    error: null,
  }));
  const set: ChangeSetRecord = {
    id: uuidv4(),
    agent_run_id: runId,
    user_id: userId,
    title: "Optimize my study schedule",
    reason: plan.summary,
    status: "pending",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    items,
    hash: hashChangeSet(items),
  };
  items.forEach((i) => {
    i.change_set_id = set.id;
  });
  memoryStore.saveChangeSet(set);
  await persistChangeSetAudit(set);
  return set;
}

export async function runOrchestrator(
  auth: OrchestratorAuth,
  request: GatewayRequest,
  opts?: { planFn?: (ctx: AcademicContext, message: string) => Promise<AgentPlan> },
): Promise<GatewayResponse> {
  const intent = recognizeIntent(request.message);
  const run = memoryStore.createRun({
    user_id: auth.userId,
    agent_type: "planning",
    intent: intent ?? "optimize_schedule",
    status: "running",
    error_class: null,
    input_summary: request.message.slice(0, 200),
    output_summary: "",
    metadata: { surface: request.surface ?? "planner" },
    request_id: uid(),
  });
  await persistAgentRun(run);

  if (!intent || !planningAgent.canHandle(intent)) {
    memoryStore.setRunStatus(run.id, auth.userId, "failed", {
      error_class: "validation",
      output_summary: "Unsupported intent",
    });
    return {
      runId: run.id,
      status: "failed",
      agent: "planning",
      intent: null,
      summary: "I can help optimize your study schedule. Try: “Fix my study schedule for next week.”",
      evidence: [],
      conflicts: [],
      changeSetId: null,
      changes: [],
      source: "fallback",
      error: "Unsupported intent",
      errorClass: "validation",
    };
  }

  const context = await toContext(request.snapshot, auth.userId);
  const toolCtx: ToolExecContext = {
    userId: auth.userId,
    agentType: "planning",
    approved: false,
    toolCallCount: 0,
    agentRunId: run.id,
  };
  await invokeTool("getSubjects", toolCtx, {});
  await invokeTool("getTasks", toolCtx, {});
  await invokeTool("getStudySessions", toolCtx, {});

  let plan: AgentPlan;
  try {
    plan = opts?.planFn
      ? await opts.planFn(context, request.message)
      : await planningAgent.plan(context, request.message);
    plan = validatePlanAgainstContext(plan, context);
  } catch (error) {
    if (error instanceof AiError && error.className === "malformed") {
      memoryStore.setRunStatus(run.id, auth.userId, "failed", {
        error_class: "malformed",
      });
      throw error;
    }
    plan = fallbackOptimizeSchedule(context);
  }

  if (!plan.changes.length) {
    memoryStore.setRunStatus(run.id, auth.userId, "completed", {
      output_summary: plan.summary,
      completed_at: new Date().toISOString(),
    });
    return {
      runId: run.id,
      status: "completed",
      agent: "planning",
      intent,
      summary: plan.summary,
      evidence: plan.evidence,
      conflicts: plan.conflicts,
      changeSetId: null,
      changes: [],
      source: plan.source,
      fallbackNotice:
        plan.source === "fallback"
          ? "AI is temporarily unavailable. Here's a rule-based recommendation."
          : undefined,
    };
  }

  const set = await changeSetFromPlan(run.id, auth.userId, plan);
  createPendingApproval(set);
  memoryStore.setRunStatus(run.id, auth.userId, "waiting_approval", {
    output_summary: plan.summary,
  });

  return {
    runId: run.id,
    status: "waiting_approval",
    agent: "planning",
    intent,
    summary: plan.summary,
    evidence: plan.evidence,
    conflicts: plan.conflicts,
    changeSetId: set.id,
    changes: set.items.map((i) => ({
      id: i.id,
      operation: i.operation,
      entity: i.entity_type,
      entity_id: i.entity_id,
      label: String(i.payload.label ?? i.operation),
      payload: i.payload,
    })),
    source: plan.source,
    fallbackNotice:
      plan.source === "fallback"
        ? "AI is temporarily unavailable. Here's a rule-based recommendation."
        : undefined,
    activity: { proposed: set.items.length, approved: 0, executed: 0, verified: 0 },
  };
}

function alreadyExecutedResponse(
  userId: string,
  set: ChangeSetRecord,
): GatewayResponse {
  const run = memoryStore.getRun(set.agent_run_id, userId);
  const executed = set.items.filter((i) => i.status === "executed" || i.status === "verified").length;
  const verified = set.status === "verified" ? set.items.length : executed;
  return {
    runId: set.agent_run_id,
    status: set.status === "verified" ? "completed" : "failed",
    agent: "planning",
    intent: run?.intent ?? "optimize_schedule",
    summary:
      set.status === "verified"
        ? "These changes were already applied and verified. Nothing was duplicated."
        : "This change set was already processed. Nothing new was written.",
    evidence: [],
    conflicts: [],
    changeSetId: set.id,
    changes: set.items.map((i) => ({
      id: i.id,
      operation: i.operation,
      entity: i.entity_type,
      entity_id: i.entity_id,
      label: String(i.payload.label ?? i.operation),
      payload: i.payload,
    })),
    source: "fallback",
    activity: {
      proposed: set.items.length,
      approved: set.items.length,
      executed,
      verified,
    },
  };
}

/** In-process guard: never run the same change set concurrently. */
const inFlight = new Set<string>();

/**
 * Look up a previously executed mutation. Memory ledger first (same process);
 * in Supabase mode the durable agent_actions row is the cross-restart ledger.
 */
async function findExecutedMutation(
  userId: string,
  mutationId: string,
): Promise<{ target_id: string | null; status: string } | null> {
  const local = memoryStore.getExecutedMutation(mutationId);
  if (local) return { target_id: local.targetId, status: local.status };
  if (agentPersistenceMode() !== "supabase") return null;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data } = await supabase
      .from("agent_actions")
      .select("target_id,status")
      .eq("user_id", userId)
      .eq("mutation_id", mutationId)
      .maybeSingle();
    if (data && (data.status === "executed" || data.status === "verified")) {
      return { target_id: (data.target_id as string | null) ?? null, status: data.status };
    }
    if (data && (data.status === "pending" || data.status === "approved")) {
      return { target_id: null, status: "in_progress" };
    }
    return null;
  } catch {
    return null;
  }
}

export async function executeApprovedChangeSet(
  userId: string,
  changeSetId: string,
): Promise<GatewayResponse> {
  let set = memoryStore.getChangeSet(changeSetId, userId);
  if (!set) {
    // Reload from durable storage so an approval is never duplicated after a
    // process restart, and identity stays server-bound.
    set = await loadChangeSetFromDurable(changeSetId, userId);
    if (!set) throw new AiError("not_found", "Change set not found.", 404);
  }
  if (set.status === "verified") return alreadyExecutedResponse(userId, set);
  if (set.status === "rejected" || set.status === "expired") {
    throw new AiError("approval", "This change set can no longer be executed.", 403);
  }
  if (inFlight.has(changeSetId)) {
    throw new AiError("approval", "This change set is already being processed.", 409);
  }
  inFlight.add(changeSetId);
  try {
    const run = memoryStore.getRun(set.agent_run_id, userId);
    memoryStore.setRunStatus(set.agent_run_id, userId, "executing");

    const toolCtx: ToolExecContext = {
      userId,
      agentType: "planning",
      approved: true,
      toolCallCount: 0,
      agentRunId: set.agent_run_id,
    };

    const created = new Map<string, string>();
    let executed = 0;
    let failed = 0;

    for (const item of set.items) {
      // Items already executed (partial retry) are skipped via the ledger.
      const mutationId = mutationIdForItem(set.id, item.id);
      const prior = await findExecutedMutation(userId, mutationId);
      if (prior) {
        if (prior.status === "in_progress") {
          failed += 1;
          item.status = "failed";
          item.error = "This change is already being processed.";
          continue;
        }
        if (item.operation === "create" && prior.target_id) {
          created.set(item.id, prior.target_id);
          item.entity_id = prior.target_id;
        }
        item.status = prior.status === "verified" ? "verified" : "executed";
        executed += 1;
        continue;
      }

      const itemCtx: ToolExecContext = { ...toolCtx, mutationId };
      try {
        if (item.operation === "create") {
          const session = await invokeTool<{ id: string }>("createStudySession", itemCtx, item.payload);
          created.set(item.id, session.id);
          item.entity_id = session.id;
          item.status = "executed";
        } else if (item.operation === "delete") {
          await invokeTool("deleteStudySession", itemCtx, { id: item.entity_id });
          item.status = "executed";
        } else {
          await invokeTool("updateStudySession", itemCtx, {
            id: item.entity_id,
            ...item.payload,
          });
          item.status = "executed";
        }
        memoryStore.recordExecutedMutation(mutationId, item.entity_id);
        executed += 1;
      } catch (error) {
        failed += 1;
        item.status = "failed";
        item.error = error instanceof Error ? error.message : "tool failure";
      }
    }

    // READ THE DATABASE AGAIN — never trust only the tool response.
    const reader = getSessionStore();
    const verifications = await verifyChangeItems(userId, set.items, created, reader);
    const verified = verifications.filter((v) => v.ok).length;
    const allVerified = verified === set.items.length && failed === 0;
    set.status = allVerified ? "verified" : failed === set.items.length ? "failed" : "executed";
    memoryStore.saveChangeSet(set);
    await persistChangeSetAudit(set);
    memoryStore.setRunStatus(set.agent_run_id, userId, allVerified ? "completed" : "failed", {
      completed_at: new Date().toISOString(),
      error_class: allVerified ? null : "verification",
      output_summary: allVerified
        ? "Schedule updated and verified."
        : "We couldn't fully verify the requested changes. Your schedule may not have been updated completely.",
    });

    return {
      runId: set.agent_run_id,
      status: allVerified ? "completed" : "failed",
      agent: "planning",
      intent: run?.intent ?? "optimize_schedule",
      summary: allVerified
        ? "Your schedule has been reorganized."
        : "We couldn't fully verify the requested changes. Your schedule may not have been updated completely.",
      evidence: [],
      conflicts: [],
      changeSetId: set.id,
      changes: set.items.map((i) => ({
        id: i.id,
        operation: i.operation,
        entity: i.entity_type,
        entity_id: i.entity_id,
        label: String(i.payload.label ?? i.operation),
        payload: i.payload,
      })),
      source: "fallback",
      activity: {
        proposed: set.items.length,
        approved: set.items.length,
        executed,
        verified,
      },
    };
  } finally {
    inFlight.delete(changeSetId);
  }
}
