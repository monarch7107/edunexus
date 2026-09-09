import { hashChangeSet } from "./schemas";
import { memoryStore } from "./memory-store";
import { createPendingApproval } from "./approvals";
import { AiError } from "./errors";
import { isoDate } from "./schemas";
import type { ChangeItemRecord, GatewayResponse } from "./types";

function validateEditedPayload(item: ChangeItemRecord, payload: Record<string, unknown>) {
  if (item.entity_type !== "study_session") {
    throw new AiError("validation", "Only study sessions can be edited in this slice.");
  }
  if (payload.planned_date !== undefined && !isoDate(payload.planned_date)) {
    throw new AiError("validation", "Invalid planned_date.");
  }
  if (
    payload.duration_minutes !== undefined &&
    (typeof payload.duration_minutes !== "number" ||
      payload.duration_minutes <= 0 ||
      payload.duration_minutes > 240)
  ) {
    throw new AiError("validation", "Invalid duration.");
  }
}

/**
 * Apply student edits, invalidate any prior approval, and require a fresh one.
 */
export function editChangeSet(
  userId: string,
  changeSetId: string,
  edits: { id: string; payload: Record<string, unknown> }[],
): GatewayResponse {
  const set = memoryStore.getChangeSet(changeSetId, userId);
  if (!set) throw new AiError("not_found", "Change set not found.", 404);
  if (set.status === "executed" || set.status === "verified") {
    throw new AiError("approval", "Executed change sets cannot be edited.", 403);
  }

  for (const edit of edits) {
    const item = set.items.find((i) => i.id === edit.id);
    if (!item) throw new AiError("validation", "Unknown change item.", 400);
    validateEditedPayload(item, edit.payload);
    const nextPayload = { ...item.payload, ...edit.payload };
    if (typeof nextPayload.title === "string" && nextPayload.title.trim()) {
      nextPayload.label =
        item.operation === "create"
          ? `Create ${nextPayload.title.trim()}`
          : item.payload.label;
    }
    item.payload = nextPayload;
  }

  set.hash = hashChangeSet(set.items);
  set.status = "pending";
  memoryStore.saveChangeSet(set);

  const previous = memoryStore.getApprovalForSet(changeSetId, userId);
  if (previous) {
    previous.status = "pending";
    previous.change_set_hash = set.hash;
    previous.reviewed_at = null;
    previous.expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  } else {
    createPendingApproval(set);
  }
  memoryStore.setRunStatus(set.agent_run_id, userId, "waiting_approval");

  return {
    runId: set.agent_run_id,
    status: "waiting_approval",
    agent: "planning",
    intent: "optimize_schedule",
    summary: "Your edits need a fresh approval before anything is written.",
    evidence: ["Previous approval invalidated because the change set was modified."],
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
    activity: { proposed: set.items.length, approved: 0, executed: 0, verified: 0 },
  };
}
