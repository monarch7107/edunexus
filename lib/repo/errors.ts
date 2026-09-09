/**
 * Categorized repository errors (Step 9 / RC2).
 *
 * The UI must be able to distinguish "nothing there" (expected absence)
 * from "something broke" (backend failure), and must never mistake an
 * authentication/session failure for "no user". Every repo implementation
 * throws {@link RepoError} so callers can branch on `code` instead of
 * string-matching raw database messages.
 */
export type RepoErrorCode =
  | "not-found" // expected absence of a specific row (safe to surface/ignore)
  | "auth" // session expired, invalid credentials, identity failure
  | "forbidden" // RLS / policy / permission denial
  | "validation" // invalid input rejected by the app or the database
  | "backend" // database / storage failure
  | "network"; // connectivity / transient failure (retryable)

export class RepoError extends Error {
  readonly code: RepoErrorCode;

  constructor(code: RepoErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options as ErrorOptions | undefined);
    this.name = "RepoError";
    this.code = code;
  }
}

export function isRepoError(error: unknown): error is RepoError {
  return error instanceof RepoError;
}

/** Preserve categorized errors; wrap anything else as `fallback`. */
export function asRepoError(error: unknown, fallback: RepoErrorCode): RepoError {
  if (isRepoError(error)) return error;
  const message = error instanceof Error ? error.message : String(error);
  return new RepoError(fallback, message || "Repository operation failed.", {
    cause: error,
  });
}

interface SupabaseLikeError {
  message?: string;
  code?: string;
  status?: number;
}

/**
 * Map a Supabase/PostgREST/Auth error shape to a stable category.
 * RLS and ownership checks stay server-side — this only labels failures.
 */
export function classifySupabaseError(error: SupabaseLikeError | null | undefined): RepoErrorCode {
  if (!error) return "backend";
  const code = String(error.code ?? "").toUpperCase();
  const status = typeof error.status === "number" ? error.status : undefined;
  const message = String(error.message ?? "").toLowerCase();

  // Identity / session / credential failures — never "no user". Checked
  // before the not-found rule so "User not found" stays an auth failure.
  if (
    status === 401 ||
    /jwt|token expired|session.*(expired|invalid|missing)|not signed in|invalid login|invalid.*credentials|email not confirmed|user not found|invalid password/.test(
      message,
    )
  ) {
    return "auth";
  }

  // No rows returned where exactly one was expected (.single()).
  if (code === "PGRST116" || /no rows|not found/.test(message)) return "not-found";

  // RLS / policy denials.
  if (
    status === 403 ||
    code === "42501" ||
    /permission denied|insufficient_privilege|row-level|row level security|\brls\b|policy|forbidden|not authorized|not allowed/.test(
      message,
    )
  ) {
    return "forbidden";
  }

  // Rejected input: check / not-null / FK violations, duplicates, bad requests.
  if (
    status === 400 ||
    status === 422 ||
    code === "22P02" ||
    code.startsWith("23") ||
    /already (exists|registered)|duplicate|violates .*constraint|check constraint|null value|invalid input|invalid.*(email|password|uuid|date)|required/.test(
      message,
    )
  ) {
    return "validation";
  }

  // Connectivity / transient.
  if (
    /fetch failed|failed to fetch|network|econ|etimedout|econnreset|socket|offline|timeout|temporarily unavailable|service unavailable|^5\d\d/.test(
      message,
    ) ||
    (status !== undefined && status >= 500)
  ) {
    return "network";
  }

  return "backend";
}

/** Build a categorized error from a Supabase failure, keeping its message. */
export function toRepoError(
  error: SupabaseLikeError | null | undefined,
  fallbackMessage = "Database operation failed.",
): RepoError {
  const code = classifySupabaseError(error);
  const message =
    error && typeof error.message === "string" && error.message.trim()
      ? error.message
      : fallbackMessage;
  return new RepoError(code, message, { cause: error ?? undefined });
}
