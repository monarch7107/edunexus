/**
 * Browser-side client for the V2 AI gateway.
 *
 * Every response is shape-validated before the UI renders it — the UI
 * never parses AI prose to decide what happened.
 */

import type { AgentRunResponse, VerificationResult } from "./types";

export const AI_CLIENT_TIMEOUT_MS = 30000;

export class AiClientError extends Error {
  readonly errorClass: string;
  constructor(message: string, errorClass: string) {
    super(message);
    this.name = "AiClientError";
    this.errorClass = errorClass;
  }
}

async function post<T>(url: string, body: unknown, validate: (raw: unknown) => T): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_CLIENT_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if ((error as Error | null)?.name === "AbortError") {
      throw new AiClientError(
        "The assistant took too long to respond. Please try again.",
        "timeout",
      );
    }
    throw new AiClientError(
      "We couldn’t connect. Check your internet connection and try again.",
      "network",
    );
  } finally {
    clearTimeout(timer);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new AiClientError("The assistant’s response was unreadable.", "malformed");
  }

  if (!res.ok) {
    const payload = data as { error?: string; errorClass?: string } | null;
    throw new AiClientError(
      payload?.error || "We couldn’t finish that action. Your existing work is safe.",
      payload?.errorClass || "internal",
    );
  }

  try {
    return validate(data);
  } catch {
    throw new AiClientError("The assistant’s response was unreadable.", "malformed");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validate the run response before the UI trusts any field. */
export function validateRunResponse(raw: unknown): AgentRunResponse {
  if (!isRecord(raw)) throw new Error("not an object");
  if (typeof raw.runId !== "string" || typeof raw.status !== "string") {
    throw new Error("missing run fields");
  }
  if (typeof raw.summary !== "string") throw new Error("missing summary");
  if (!Array.isArray(raw.changes)) throw new Error("missing changes");
  return raw as unknown as AgentRunResponse;
}

export function validateVerificationResult(raw: unknown): VerificationResult {
  if (!isRecord(raw)) throw new Error("not an object");
  if (typeof raw.message !== "string" || typeof raw.fullyVerified !== "boolean") {
    throw new Error("missing verification fields");
  }
  if (!Array.isArray(raw.items)) throw new Error("missing items");
  return raw as unknown as VerificationResult;
}

export function requestPlan(message: string, surface = "planner") {
  return post("/api/ai", { message, surface }, validateRunResponse);
}

export function approvePlan(input: {
  runId: string;
  changeSetId: string;
  decision: "approve_all" | "approve_selected";
  itemIds?: string[];
}) {
  return post("/api/ai/approve", input, validateVerificationResult);
}

export function rejectPlan(input: { runId: string; changeSetId: string }) {
  return post("/api/ai/approve", { ...input, decision: "reject" }, (raw) => {
    if (!isRecord(raw) || raw.status !== "rejected") throw new Error("bad reject");
    return raw as { status: "rejected" };
  });
}

export function editChange(input: {
  runId: string;
  changeSetId: string;
  itemId: string;
  payload: { title?: string; planned_date?: string; duration_minutes?: number };
}) {
  return post("/api/ai/edit", input, validateRunResponse);
}
