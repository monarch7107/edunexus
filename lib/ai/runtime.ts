/**
 * Server-side runtime wiring.
 *
 * Supabase mode is the production path. In demo mode V1 keeps academic
 * data in the browser's localStorage, so there is no server database to
 * act on; the gateway reports that clearly instead of pretending.
 */

import { createClient } from "../supabase/server";
import { AgentError } from "./errors";
import { Orchestrator } from "./orchestrator";
import type { GatewayIdentity } from "./gateway";
import { SupabaseAcademicPort, SupabaseAgentStore } from "./store/supabase";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export interface ServerRuntime {
  identity: GatewayIdentity;
  orchestrator: Orchestrator;
}

/**
 * Build the request-scoped runtime.
 * Throws a configuration error in demo mode: the agent pipeline requires a
 * server-side database it can verify against.
 */
export function createServerRuntime(): ServerRuntime {
  if (!isSupabaseConfigured) {
    throw new AgentError(
      "config",
      "The study assistant needs the Supabase backend. It isn’t available in demo mode.",
      { internal: "supabase not configured" },
    );
  }

  const supabase = createClient();
  const identity: GatewayIdentity = {
    async resolveUserId() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user?.id ?? null;
    },
  };

  const orchestrator = new Orchestrator({
    academic: new SupabaseAcademicPort(supabase),
    store: new SupabaseAgentStore(supabase),
  });

  return { identity, orchestrator };
}
