/**
 * AI Gateway — the single V2 entry point.
 *
 * Responsibilities: authenticate, bound the request, validate it,
 * assign a request id, rate-limit, normalize, and hand off to the
 * orchestrator. It is the ONLY place a user identity enters the pipeline.
 */

import { AgentError, isAgentError, logAgentDiagnostic, toAgentError } from "./errors";
import { AI_LIMITS } from "./limits";
import { createPrincipal, type Principal } from "./authorization";
import { gatewayRequestSchema } from "./schemas";

export interface GatewayIdentity {
  /** Resolves the authenticated user id, or null when not signed in. */
  resolveUserId(): Promise<string | null>;
}

/** Read a bounded JSON body. Oversized payloads are rejected outright. */
export async function readBoundedJson(
  request: Request,
  maxBytes = AI_LIMITS.MAX_REQUEST_BYTES,
): Promise<unknown> {
  const declared = request.headers.get("content-length");
  if (declared && Number(declared) > maxBytes) {
    throw new AgentError("validation", "That request was too large.", {
      status: 413,
      internal: "content-length exceeds limit",
    });
  }

  const text = await request.text();
  // Byte length, not character count — multi-byte input must not slip past.
  if (new TextEncoder().encode(text).length > maxBytes) {
    throw new AgentError("validation", "That request was too large.", {
      status: 413,
      internal: "body exceeds limit",
    });
  }
  if (!text.trim()) {
    throw new AgentError("validation", "That request couldn’t be understood.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new AgentError("validation", "That request couldn’t be understood.");
  }
}

export function newRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * Authenticate and build the principal.
 *
 * The client CANNOT influence this: any `user_id` in the request body is
 * rejected by the strict schema, and even if present it is never read.
 */
export async function authenticate(
  identity: GatewayIdentity,
  requestId: string,
): Promise<Principal> {
  let userId: string | null;
  try {
    userId = await identity.resolveUserId();
  } catch (error) {
    logAgentDiagnostic("auth", "auth");
    throw new AgentError("auth", "Your session has expired. Please log in again.", {
      cause: error,
    });
  }
  if (!userId) {
    throw new AgentError("auth", "Your session has expired. Please log in again.");
  }
  return createPrincipal(userId, requestId);
}

/** Validate and normalize the gateway request body. */
export function normalizeRequest(body: unknown): { message: string; surface: string } {
  const parsed = gatewayRequestSchema.safeParse(body);
  if (!parsed.success) {
    const tooLong = parsed.error.issues.some((i) => i.code === "too_big");
    throw new AgentError(
      "validation",
      tooLong
        ? "That message is too long. Please shorten it and try again."
        : "That request couldn’t be understood. Please rephrase and try again.",
    );
  }
  return { message: parsed.data.message, surface: parsed.data.surface || "planner" };
}

/** Convert any pipeline failure into a safe HTTP response body. */
export function errorResponse(error: unknown): {
  status: number;
  body: { error: string; errorClass: string };
} {
  const agentError = isAgentError(error) ? error : toAgentError(error);
  return {
    status: agentError.status,
    body: { error: agentError.publicMessage, errorClass: agentError.class },
  };
}
