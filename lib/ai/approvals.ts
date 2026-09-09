import { uid } from "@/lib/utils";
import { AiError } from "./errors";
import { hashChangeSet } from "./schemas";
import { memoryStore } from "./memory-store";
import { AI_LIMITS, type ApprovalRecord, type ChangeSetRecord } from "./types";

export function createPendingApproval(set: ChangeSetRecord): ApprovalRecord {
  const row: ApprovalRecord = {
    id: uid(),
    agent_run_id: set.agent_run_id,
    change_set_id: set.id,
    user_id: set.user_id,
    status: "pending",
    reviewed_at: null,
    expires_at: new Date(Date.now() + AI_LIMITS.approvalTtlMs).toISOString(),
    change_set_hash: set.hash,
  };
  memoryStore.saveApproval(row);
  return row;
}

export function assertExecutableApproval(
  userId: string,
  changeSetId: string,
  decision: "approved" | "rejected",
  editedHash?: string,
): ChangeSetRecord {
  const set = memoryStore.getChangeSet(changeSetId, userId);
  if (!set) throw new AiError("not_found", "Change set not found.", 404);
  if (set.user_id !== userId) throw new AiError("permission", "Not allowed.", 403);
  const approval = memoryStore.getApprovalForSet(changeSetId, userId);
  if (!approval) throw new AiError("approval", "No approval record.", 403);
  if (approval.expires_at && new Date(approval.expires_at).getTime() < Date.now()) {
    approval.status = "expired";
    set.status = "expired";
    throw new AiError("approval", "Approval has expired.", 403);
  }
  const currentHash = hashChangeSet(set.items);
  if (editedHash && editedHash !== currentHash) {
    approval.status = "pending";
    throw new AiError("approval", "Change set was modified; previous approval is invalid.", 403);
  }
  if (currentHash !== approval.change_set_hash) {
    throw new AiError("approval", "Change set was modified; previous approval is invalid.", 403);
  }
  if (decision === "rejected") {
    approval.status = "rejected";
    approval.reviewed_at = new Date().toISOString();
    set.status = "rejected";
    return set;
  }
  if (set.status !== "pending" && set.status !== "approved") {
    throw new AiError("approval", "Change set cannot be executed.", 403);
  }
  approval.status = "approved";
  approval.reviewed_at = new Date().toISOString();
  set.status = "approved";
  return set;
}
