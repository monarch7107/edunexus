/**
 * Post-execution verification.
 *
 * The database — not the model, and not the tool's return value — is the
 * source of truth. Every executed item is re-read from storage and its
 * actual state compared against the expected state. An item is only
 * `verified` when the two match.
 */

import type { StudySession } from "../types";
import type { AcademicPort } from "./store/types";
import type {
  ActionStatus,
  ChangeItemRecord,
  SessionWritePayload,
} from "./types";

export interface ItemVerification {
  itemId: string;
  status: ActionStatus;
  matched: boolean;
  reason: string | null;
}

/** Compare a stored session against the payload we intended to write. */
export function sessionMatches(
  actual: StudySession | null,
  expected: SessionWritePayload,
): boolean {
  if (!actual) return false;
  return (
    actual.title === expected.title &&
    actual.planned_date === expected.planned_date &&
    actual.duration_minutes === expected.duration_minutes &&
    (actual.subject_id ?? null) === (expected.subject_id ?? null)
  );
}

/**
 * Re-read every executed item and confirm the expected state.
 * Items that were never executed stay untouched.
 */
export async function verifyChangeItems(
  userId: string,
  academic: AcademicPort,
  items: ChangeItemRecord[],
): Promise<ItemVerification[]> {
  const results: ItemVerification[] = [];

  for (const item of items) {
    if (item.status !== "executed") {
      results.push({
        itemId: item.id,
        status: item.status,
        matched: false,
        reason: item.status === "failed" ? "Execution failed." : null,
      });
      continue;
    }

    if (!item.entity_id) {
      results.push({
        itemId: item.id,
        status: "failed",
        matched: false,
        reason: "No record id was returned for this change.",
      });
      continue;
    }

    let actual: StudySession | null = null;
    try {
      actual = await academic.getSession(userId, item.entity_id);
    } catch {
      results.push({
        itemId: item.id,
        status: "executed",
        matched: false,
        reason: "The saved record could not be re-read for verification.",
      });
      continue;
    }

    if (item.operation === "delete") {
      const gone = actual === null;
      results.push({
        itemId: item.id,
        status: gone ? "verified" : "executed",
        matched: gone,
        reason: gone ? null : "The record still exists after deletion.",
      });
      continue;
    }

    const matched = sessionMatches(actual, item.payload);
    results.push({
      itemId: item.id,
      status: matched ? "verified" : "executed",
      matched,
      reason: matched ? null : "The saved record does not match the approved change.",
    });
  }

  return results;
}

/** Roll per-item verification up into an honest change-set outcome. */
export function summarizeVerification(input: {
  proposed: number;
  approved: number;
  executed: number;
  failed: number;
  verified: number;
}): { fullyVerified: boolean; message: string } {
  const { approved, executed, failed, verified } = input;
  const fullyVerified = approved > 0 && verified === approved && failed === 0;

  if (fullyVerified) {
    return {
      fullyVerified: true,
      message: `Your schedule has been reorganized. ${verified} of ${approved} approved ${
        approved === 1 ? "change" : "changes"
      } applied and verified.`,
    };
  }

  if (executed === 0 && failed > 0) {
    return {
      fullyVerified: false,
      message:
        "We couldn’t apply the requested changes. Your schedule was not updated — your existing work is safe.",
    };
  }

  return {
    fullyVerified: false,
    message: `We couldn’t fully verify the requested changes. Your schedule may not have been updated completely (${verified} of ${approved} verified${
      failed > 0 ? `, ${failed} failed` : ""
    }).`,
  };
}
