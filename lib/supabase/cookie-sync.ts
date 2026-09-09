import type { CookieOptions } from "@supabase/ssr";

/**
 * SSR cookie propagation (Step 9 / RC3).
 *
 * Supabase refreshes the auth session during `getUser()`, reporting every
 * cookie write through the `setAll` callback. Those updates must reach:
 *   1. the downstream request (so later server reads see the fresh session),
 *   2. the outgoing response — including redirect responses, which are
 *      separate objects that would otherwise drop the refreshed cookies,
 *   3. logout/session-clearing flows, where the update is an empty value
 *      with an expired max-age (options must be preserved verbatim).
 *
 * This helper records every update (in order, so multiple changes all
 * propagate) and can replay them onto any response.
 */
export interface CookieUpdate {
  name: string;
  value: string;
  options: CookieOptions;
}

interface CookieReader {
  getAll: () => { name: string; value: string }[];
}

interface RequestCookieWriter {
  set: (name: string, value: string) => unknown;
}

interface CookieWriter {
  set: (name: string, value: string, options?: CookieOptions) => void;
}

interface CookieResponse {
  cookies: CookieWriter;
}

export interface CookieSync {
  getAll: () => { name: string; value: string }[];
  setAll: (updates: CookieUpdate[]) => void;
  /** Replay every recorded update onto `response` (order preserved). */
  applyTo: (response: CookieResponse) => void;
  pending: () => CookieUpdate[];
}

export function createCookieSync(
  requestCookies: CookieReader & RequestCookieWriter,
): CookieSync {
  const recorded: CookieUpdate[] = [];
  return {
    getAll() {
      return requestCookies.getAll();
    },
    setAll(updates: CookieUpdate[]) {
      for (const update of updates) {
        recorded.push(update);
        // Keep the in-flight request in sync so downstream server reads
        // observe the refreshed session immediately.
        requestCookies.set(update.name, update.value);
      }
    },
    applyTo(response: CookieResponse) {
      for (const update of recorded) {
        response.cookies.set(update.name, update.value, update.options);
      }
    },
    pending() {
      return [...recorded];
    },
  };
}
