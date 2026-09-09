/**
 * Zod schemas — the single validation boundary between "the model said so"
 * and "the server accepted it".
 *
 * Nothing the model returns is trusted. Malformed output, unknown
 * operations, unsupported entities and oversized plans are all rejected
 * here before any authorization or execution logic runs.
 */

import { z } from "zod";
import { AI_LIMITS } from "./limits";

// ── Gateway request ──────────────────────────────────────────────────────────

/**
 * The client may send ONLY a message and a surface hint. There is
 * deliberately no `user_id` field: the authenticated identity is resolved
 * server-side and a client-supplied id would be ignored even if sent.
 */
export const gatewayRequestSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, "Message is required.")
      .max(AI_LIMITS.MAX_MESSAGE_CHARS),
    surface: z.string().trim().max(64).optional().default("planner"),
  })
  .strict();

export type GatewayRequest = z.infer<typeof gatewayRequestSchema>;

export const approvalRequestSchema = z
  .object({
    runId: z.string().min(1).max(64),
    changeSetId: z.string().min(1).max(64),
    decision: z.enum(["approve_all", "approve_selected", "reject"]),
    /** Item ids to approve when decision is `approve_selected`. */
    itemIds: z.array(z.string().min(1).max(64)).max(AI_LIMITS.MAX_PROPOSED_CHANGES).optional(),
  })
  .strict();

export const editRequestSchema = z
  .object({
    runId: z.string().min(1).max(64),
    changeSetId: z.string().min(1).max(64),
    itemId: z.string().min(1).max(64),
    payload: z
      .object({
        title: z.string().trim().min(1).max(160).optional(),
        planned_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be yyyy-mm-dd.")
          .optional(),
        duration_minutes: z
          .number()
          .int()
          .min(AI_LIMITS.MIN_SESSION_MINUTES)
          .max(AI_LIMITS.MAX_SESSION_MINUTES)
          .optional(),
      })
      .strict(),
  })
  .strict();

// ── Model output ─────────────────────────────────────────────────────────────

/**
 * Payload for a proposed study_session write. `subject_id` is validated
 * against the student's real subjects later (schema can only check shape).
 */
export const sessionPayloadSchema = z
  .object({
    subject_id: z.string().min(1).max(64).nullable().optional().default(null),
    title: z.string().trim().min(1).max(160),
    planned_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "planned_date must be yyyy-mm-dd."),
    duration_minutes: z.coerce
      .number()
      .int()
      .min(AI_LIMITS.MIN_SESSION_MINUTES)
      .max(AI_LIMITS.MAX_SESSION_MINUTES),
  })
  .strip();

/**
 * A single proposed change. Unknown operations and unsupported entities
 * fail here — the enums are closed by design.
 */
export const proposedChangeSchema = z
  .object({
    operation: z.enum(["create", "update", "delete", "move"]),
    entity: z.literal("study_session"),
    entity_id: z.string().min(1).max(64).nullable().optional().default(null),
    payload: z.record(z.unknown()).default({}),
    reason: z.string().trim().max(240).optional(),
  })
  .strip();

/** The complete structured plan we require from the model. */
export const agentPlanSchema = z
  .object({
    summary: z.string().trim().min(1).max(400),
    evidence: z.array(z.string().trim().min(1).max(240)).max(8).default([]),
    changes: z
      .array(proposedChangeSchema)
      .max(
        AI_LIMITS.MAX_PROPOSED_CHANGES,
        `A plan may propose at most ${AI_LIMITS.MAX_PROPOSED_CHANGES} changes.`,
      )
      .default([]),
  })
  .strip();

export type RawAgentPlan = z.infer<typeof agentPlanSchema>;

/**
 * Parse a model completion into a structured plan.
 * Returns `null` on any malformed output — the caller falls back to the
 * deterministic planner rather than guessing at intent.
 */
export function parseModelPlan(
  content: string,
): { ok: true; plan: RawAgentPlan } | { ok: false; reason: string } {
  if (content.length > AI_LIMITS.MAX_MODEL_OUTPUT_CHARS) {
    return { ok: false, reason: "output_too_large" };
  }
  const json = extractJsonObject(content);
  if (!json) return { ok: false, reason: "no_json" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }

  const result = agentPlanSchema.safeParse(parsed);
  if (!result.success) return { ok: false, reason: "schema_rejected" };
  return { ok: true, plan: result.data };
}

/**
 * Pull the first balanced top-level JSON object out of a completion,
 * tolerating markdown fences and stray prose around it (but never
 * inferring actions from prose).
 */
export function extractJsonObject(content: string): string | null {
  const text = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}
