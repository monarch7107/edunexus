/**
 * V2 agent error handling.
 *
 * This does NOT introduce a second error system: it wraps the V1
 * `RepoError` categories (lib/repo/errors.ts) and adds only the failure
 * classes that are specific to agentic execution. `friendlyError` from
 * lib/errors.ts keeps working for repository failures; `agentErrorMessage`
 * handles the agent-specific ones.
 */

import { isRepoError, type RepoErrorCode } from "../repo/errors";

/**
 * Stable, loggable failure classes. These strings are persisted in
 * `agent_runs.error_class` / `agent_actions.error_class` and are safe to
 * store: they contain no student data and no secrets.
 */
export type AgentErrorClass =
  | "config" // provider not configured
  | "auth" // not signed in / session invalid
  | "validation" // bad request or bad model output shape
  | "permission" // agent/tool/ownership denial
  | "not_found" // referenced entity does not exist
  | "timeout" // provider exceeded the deadline
  | "provider" // provider returned an error status
  | "malformed" // provider output failed schema validation
  | "tool" // registered tool failed
  | "database" // repository/database failure
  | "approval" // missing, stale or expired approval
  | "verification" // post-execution state mismatch
  | "network" // connectivity failure
  | "rate_limit" // too many runs
  | "unsupported" // unknown intent / unsupported entity
  | "internal";

export class AgentError extends Error {
  readonly class: AgentErrorClass;
  /** HTTP status the gateway should answer with. */
  readonly status: number;
  /** Safe message for the browser. Never contains internals. */
  readonly publicMessage: string;

  constructor(
    errorClass: AgentErrorClass,
    publicMessage: string,
    options?: { status?: number; cause?: unknown; internal?: string },
  ) {
    super(options?.internal ?? publicMessage, { cause: options?.cause });
    this.name = "AgentError";
    this.class = errorClass;
    this.publicMessage = publicMessage;
    this.status = options?.status ?? defaultStatus(errorClass);
  }
}

function defaultStatus(errorClass: AgentErrorClass): number {
  switch (errorClass) {
    case "auth":
      return 401;
    case "permission":
      return 403;
    case "not_found":
      return 404;
    case "validation":
    case "unsupported":
    case "approval":
      return 400;
    case "rate_limit":
      return 429;
    case "timeout":
      return 504;
    default:
      return 500;
  }
}

export function isAgentError(error: unknown): error is AgentError {
  return error instanceof AgentError;
}

/** Map a V1 repository error category onto a V2 agent failure class. */
export function repoCodeToAgentClass(code: RepoErrorCode): AgentErrorClass {
  switch (code) {
    case "not-found":
      return "not_found";
    case "auth":
      return "auth";
    case "forbidden":
      return "permission";
    case "validation":
      return "validation";
    case "network":
      return "network";
    case "backend":
    default:
      return "database";
  }
}

/**
 * Normalize anything thrown inside the agent pipeline into an AgentError,
 * preserving V1 repository categorization when present.
 */
export function toAgentError(
  error: unknown,
  fallback: AgentErrorClass = "internal",
): AgentError {
  if (isAgentError(error)) return error;
  if (isRepoError(error)) {
    const cls = repoCodeToAgentClass(error.code);
    return new AgentError(cls, agentErrorMessage(cls), {
      cause: error,
      internal: error.message,
    });
  }
  const internal = error instanceof Error ? error.message : String(error);
  return new AgentError(fallback, agentErrorMessage(fallback), {
    cause: error,
    internal,
  });
}

/** Student-facing copy. Calm, honest, never blames the student. */
export function agentErrorMessage(cls: AgentErrorClass): string {
  switch (cls) {
    case "config":
      return "The study assistant isn’t configured right now. Your workspace is unaffected.";
    case "auth":
      return "Your session has expired. Please log in again.";
    case "validation":
      return "That request couldn’t be understood. Please rephrase and try again.";
    case "permission":
      return "That action isn’t allowed. Your workspace is unaffected.";
    case "not_found":
      return "Some of the items referenced no longer exist. Please refresh and try again.";
    case "timeout":
      return "The assistant took too long to respond. Please try again.";
    case "provider":
      return "The assistant is temporarily unavailable. Please try again shortly.";
    case "malformed":
      return "The assistant returned an unusable plan, so nothing was changed.";
    case "tool":
      return "One of the requested changes couldn’t be applied. Nothing else was affected.";
    case "database":
      return "We couldn’t save those changes. Your existing work is safe.";
    case "approval":
      return "This plan needs your approval again before it can run.";
    case "verification":
      return "We couldn’t fully verify the requested changes. Your schedule may not have been updated completely.";
    case "network":
      return "We couldn’t connect. Check your internet connection and try again.";
    case "rate_limit":
      return "A few too many requests. Please wait a moment and try again.";
    case "unsupported":
      return "The assistant can’t help with that yet.";
    case "internal":
    default:
      return "We couldn’t finish that action. Your existing work is safe. Please try again.";
  }
}

/**
 * Server-side diagnostic. Logs ONLY the failure class (mirrors the V1
 * `logAiDiagnostic` convention). Never pass prompts, keys or student data.
 */
export function logAgentDiagnostic(
  stage: string,
  cls: AgentErrorClass,
  detail?: { status?: number; runId?: string },
): void {
  const status = detail?.status !== undefined ? ` status=${detail.status}` : "";
  const run = detail?.runId ? ` run=${detail.runId}` : "";
  console.warn(`edunexus/ai ${stage} failed class=${cls}${status}${run}`);
}
