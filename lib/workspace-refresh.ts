/**
 * Race-safe workspace refresh coordinator (Step 9 / RC1).
 *
 * Guarantees:
 *  - Every refresh gets a monotonically increasing sequence token; only the
 *    latest token may commit results, so a slow older response can never
 *    overwrite newer state (A→refresh, B→refresh, B lands, A lands → A dropped).
 *  - Datasets settle independently (`allSettled`): one failed read must not
 *    prevent unrelated successful datasets from updating.
 *  - Failures are reported per dataset so the UI can show exactly what is
 *    stale and offer a retry, instead of a single opaque error.
 */
export type RefreshToken = number;

export interface SettledRefresh<T> {
  token: RefreshToken;
  stale: boolean;
  values: Partial<T>;
  failed: string[];
}

export function createRefreshCoordinator() {
  let sequence = 0;
  return {
    /** Start a refresh round and claim its token. */
    begin(): RefreshToken {
      sequence += 1;
      return sequence;
    },
    /** True when `token` no longer represents the latest round. */
    isStale(token: RefreshToken): boolean {
      return token !== sequence;
    },
    current(): RefreshToken {
      return sequence;
    },
  };
}

export type RefreshCoordinator = ReturnType<typeof createRefreshCoordinator>;

/**
 * Settle one refresh round. Returns `stale: true` (with no values) when a
 * newer round has begun since `token` was claimed — the caller must discard
 * the outcome entirely.
 */
export async function settleRefresh<T extends Record<string, unknown>>(
  coordinator: RefreshCoordinator,
  token: RefreshToken,
  loaders: { [K in keyof T]: () => Promise<T[K]> },
): Promise<SettledRefresh<T>> {
  const keys = Object.keys(loaders) as (keyof T)[];
  const outcomes = await Promise.allSettled(keys.map((k) => loaders[k]()));
  if (coordinator.isStale(token)) {
    return { token, stale: true, values: {}, failed: [] };
  }
  const values: Partial<T> = {};
  const failed: string[] = [];
  outcomes.forEach((outcome, index) => {
    const key = String(keys[index]);
    if (outcome.status === "fulfilled") {
      (values as Record<string, unknown>)[key] = outcome.value;
    } else {
      failed.push(key);
    }
  });
  return { token, stale: false, values, failed };
}

/** Human-readable summary naming the datasets that failed to refresh. */
export function refreshFailureSummary(failed: string[]): string {
  if (failed.length === 0) return "";
  const labels: Record<string, string> = {
    profile: "profile",
    subjects: "subjects",
    tasks: "tasks",
    sessions: "study sessions",
    resources: "resources",
    recommendations: "recommendations",
  };
  const named = failed.map((f) => labels[f] ?? f);
  if (named.length === 1) {
    return `We couldn’t refresh your ${named[0]}. Everything else is current — your saved work is safe.`;
  }
  const last = named[named.length - 1];
  return `We couldn’t refresh your ${named.slice(0, -1).join(", ")} and ${last}. Everything else is current — your saved work is safe.`;
}
