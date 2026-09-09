/**
 * Approval lifecycle.
 *
 * A ChangeSet is only executable while a *live* approval exists whose
 * fingerprint still matches the change set's current contents. Editing any
 * item changes the fingerprint, which silently invalidates the previous
 * approval — a stale approval can never execute.
 */

import { createHash } from "crypto";
import { AgentError } from "./errors";
import { AI_LIMITS } from "./limits";
import type {
  AgentApprovalRecord,
  ChangeItemRecord,
  ChangeSetRecord,
} from "./types";

/**
 * Stable fingerprint of the executable content of a change set.
 * Deliberately covers exactly what execution depends on: the operation,
 * the target row, and the payload. Cosmetic fields are excluded.
 */
export function fingerprintChangeItems(
  items: Pick<ChangeItemRecord, "id" | "operation" | "entity_type" | "entity_id" | "payload">[],
): string {
  const canonical = items
    .map((item) =>
      JSON.stringify({
        id: item.id,
        operation: item.operation,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        payload: {
          subject_id: item.payload.subject_id ?? null,
          title: item.payload.title,
          planned_date: item.payload.planned_date,
          duration_minutes: item.payload.duration_minutes,
        },
      }),
    )
    .sort()
    .join("|");
  return createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

export function approvalExpiry(from: Date = new Date()): string {
  return new Date(from.getTime() + AI_LIMITS.APPROVAL_TTL_MS).toISOString();
}

export function isExpired(expiresAt: string | null, now: Date = new Date()): boolean {
  if (!expiresAt) return false;
  const time = new Date(expiresAt).getTime();
  if (Number.isNaN(time)) return false;
  return time <= now.getTime();
}

export interface ApprovalCheck {
  changeSet: ChangeSetRecord;
  approval: AgentApprovalRecord | null;
  items: ChangeItemRecord[];
  now?: Date;
}

/**
 * Assert a change set may execute right now.
 * Rejects: missing approval, rejected approval, expired approval,
 * expired change set, and — critically — an approval whose fingerprint no
 * longer matches the current items.
 */
export function assertExecutable(check: ApprovalCheck): {
  approval: AgentApprovalRecord;
  approvedItems: ChangeItemRecord[];
} {
  const now = check.now ?? new Date();
  const { changeSet, approval, items } = check;

  if (changeSet.status === "executed" || changeSet.status === "verified") {
    throw new AgentError("approval", "These changes have already been applied.", {
      internal: `change set ${changeSet.id} already ${changeSet.status}`,
    });
  }
  if (changeSet.status === "rejected") {
    throw new AgentError("approval", "These changes were rejected.", {
      internal: `change set ${changeSet.id} rejected`,
    });
  }
  if (isExpired(changeSet.expires_at, now)) {
    throw new AgentError(
      "approval",
      "This plan has expired. Please ask for a fresh plan.",
      { internal: `change set ${changeSet.id} expired` },
    );
  }
  if (!approval) {
    throw new AgentError(
      "approval",
      "These changes need your approval before they can run.",
      { internal: `no approval for change set ${changeSet.id}` },
    );
  }
  if (approval.status === "rejected" || approval.status === "pending") {
    throw new AgentError(
      "approval",
      "These changes need your approval before they can run.",
      { internal: `approval ${approval.id} status ${approval.status}` },
    );
  }
  if (approval.status === "expired" || isExpired(approval.expires_at, now)) {
    throw new AgentError(
      "approval",
      "That approval has expired. Please review the changes again.",
      { internal: `approval ${approval.id} expired` },
    );
  }

  // Stale-approval defence: contents must be byte-identical to what the
  // student actually saw and approved.
  const current = fingerprintChangeItems(items);
  if (current !== approval.change_fingerprint) {
    throw new AgentError(
      "approval",
      "These changes were edited after they were approved. Please review and approve them again.",
      { internal: `fingerprint mismatch on change set ${changeSet.id}` },
    );
  }

  const approvedItems = items.filter((i) => i.status === "approved");
  if (approvedItems.length === 0) {
    throw new AgentError("approval", "No changes were approved, so nothing ran.", {
      internal: `change set ${changeSet.id} has no approved items`,
    });
  }
  return { approval, approvedItems };
}
