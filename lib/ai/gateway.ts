import { parseGatewayBody } from "./schemas";
import { rejectClientUserId } from "./authorization";
import { executeApprovedChangeSet, runOrchestrator } from "./orchestrator";
import { assertExecutableApproval } from "./approvals";
import { editChangeSet } from "./edit-changeset";
import { AiError, isAiError } from "./errors";
import { memoryStore } from "./memory-store";
import { loadChangeSetFromDurable } from "./audit-persist";
import { configureSessionStore } from "./persist";
import type { GatewayRequest, GatewayResponse } from "./types";

const rateBuckets = new Map<string, { count: number; reset: number }>();

function rateLimit(userId: string) {
  const now = Date.now();
  const bucket = rateBuckets.get(userId);
  if (!bucket || bucket.reset < now) {
    rateBuckets.set(userId, { count: 1, reset: now + 60_000 });
    return;
  }
  bucket.count += 1;
  if (bucket.count > 20) {
    throw new AiError("validation", "Too many requests. Please wait a moment.", 429);
  }
}

export async function handleAiGateway(opts: {
  userId: string | null;
  rawBody: unknown;
  byteLength: number;
}): Promise<{ status: number; body: GatewayResponse | { error: string } }> {
  if (!opts.userId) {
    return { status: 401, body: { error: "Unauthorized." } };
  }
  try {
    configureSessionStore();
    rejectClientUserId(opts.rawBody);
    const parsed = parseGatewayBody(opts.rawBody, opts.byteLength);
    if (!parsed.ok) {
      const status = parsed.error === "Request too large." ? 413 : 400;
      return { status, body: { error: parsed.error } };
    }
    rateLimit(opts.userId);
    const body = await runOrchestrator({ userId: opts.userId }, parsed.request);
    return { status: 200, body };
  } catch (error) {
    if (isAiError(error)) {
      return { status: error.httpStatus, body: { error: error.message } };
    }
    return { status: 500, body: { error: "We couldn’t finish that action." } };
  }
}

export async function handleApproval(opts: {
  userId: string | null;
  rawBody: unknown;
}): Promise<{ status: number; body: GatewayResponse | { error: string } }> {
  if (!opts.userId) return { status: 401, body: { error: "Unauthorized." } };
  try {
    configureSessionStore();
    rejectClientUserId(opts.rawBody);
    const body = opts.rawBody as {
      changeSetId?: string;
      decision?: string;
    };
    if (!body?.changeSetId || (body.decision !== "approved" && body.decision !== "rejected")) {
      return { status: 400, body: { error: "Invalid approval request." } };
    }
    let existing = memoryStore.getChangeSet(body.changeSetId, opts.userId);
    if (!existing) existing = await loadChangeSetFromDurable(body.changeSetId, opts.userId);
    if (body.decision === "approved" && existing?.status === "verified") {
      const result = await executeApprovedChangeSet(opts.userId, existing.id);
      return { status: 200, body: result };
    }
    const set = assertExecutableApproval(
      opts.userId,
      body.changeSetId,
      body.decision,
    );
    if (body.decision === "rejected") {
      memoryStore.setRunStatus(set.agent_run_id, opts.userId, "cancelled");
      return {
        status: 200,
        body: {
          runId: set.agent_run_id,
          status: "cancelled",
          agent: "planning",
          intent: "optimize_schedule",
          summary: "Changes rejected. Nothing was modified.",
          evidence: [],
          conflicts: [],
          changeSetId: set.id,
          changes: [],
          source: "fallback",
        },
      };
    }
    const result = await executeApprovedChangeSet(opts.userId, set.id);
    return { status: 200, body: result };
  } catch (error) {
    if (isAiError(error)) {
      return { status: error.httpStatus, body: { error: error.message } };
    }
    return { status: 500, body: { error: "We couldn’t finish that action." } };
  }
}

export async function handleEditChangeSet(opts: {
  userId: string | null;
  rawBody: unknown;
}): Promise<{ status: number; body: GatewayResponse | { error: string } }> {
  if (!opts.userId) return { status: 401, body: { error: "Unauthorized." } };
  try {
    configureSessionStore();
    rejectClientUserId(opts.rawBody);
    const body = opts.rawBody as {
      changeSetId?: string;
      edits?: { id: string; payload: Record<string, unknown> }[];
    };
    if (!body?.changeSetId || !Array.isArray(body.edits)) {
      return { status: 400, body: { error: "Invalid edit request." } };
    }
    if (!memoryStore.getChangeSet(body.changeSetId, opts.userId)) {
      await loadChangeSetFromDurable(body.changeSetId, opts.userId);
    }
    const result = editChangeSet(opts.userId, body.changeSetId, body.edits);
    return { status: 200, body: result };
  } catch (error) {
    if (isAiError(error)) {
      return { status: error.httpStatus, body: { error: error.message } };
    }
    return { status: 500, body: { error: "We couldn’t finish that action." } };
  }
}

export async function handleGetChangeSet(opts: {
  userId: string | null;
  changeSetId: string | null;
}): Promise<{ status: number; body: GatewayResponse | { error: string } }> {
  if (!opts.userId) return { status: 401, body: { error: "Unauthorized." } };
  if (!opts.changeSetId) return { status: 400, body: { error: "Missing change set." } };
  configureSessionStore();
  const set = await loadChangeSetFromDurable(opts.changeSetId, opts.userId);
  if (!set) return { status: 404, body: { error: "Change set not found." } };
  const run = memoryStore.getRun(set.agent_run_id, opts.userId);
  return {
    status: 200,
    body: {
      runId: set.agent_run_id,
      status: run?.status ?? "waiting_approval",
      agent: "planning",
      intent: "optimize_schedule",
      summary: set.reason,
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
    },
  };
}

export type { GatewayRequest, GatewayResponse };
