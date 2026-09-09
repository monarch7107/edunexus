/** Hard safety bounds for every V2 agent run. Enforced server-side only. */
export const AI_LIMITS = {
  /** Max accepted request body (bytes) at the gateway. */
  MAX_REQUEST_BYTES: 8 * 1024,
  /** Max student message length (characters). */
  MAX_MESSAGE_CHARS: 1000,
  /** Max model completion size (characters) before we reject it. */
  MAX_MODEL_OUTPUT_CHARS: 20000,
  /** Max reasoning iterations per run. */
  MAX_AGENT_ITERATIONS: 3,
  /** Max tool invocations per run (reads + writes). */
  MAX_TOOL_CALLS: 10,
  /** Max changes a single plan may propose. */
  MAX_PROPOSED_CHANGES: 10,
  /** Provider deadline (ms). */
  PROVIDER_TIMEOUT_MS: 15000,
  /** How long an approval window stays valid (ms). */
  APPROVAL_TTL_MS: 15 * 60 * 1000,
  /** Max runs per user per rolling window. */
  RATE_LIMIT_RUNS: 12,
  RATE_LIMIT_WINDOW_MS: 60 * 1000,
  /** Bounds for a proposed study session. */
  MIN_SESSION_MINUTES: 15,
  MAX_SESSION_MINUTES: 240,
  /** A session may only be scheduled within this horizon from today. */
  MAX_SCHEDULE_HORIZON_DAYS: 60,
  MAX_SCHEDULE_PAST_DAYS: 0,
  /** Max total minutes an agent may schedule on a single day. */
  MAX_DAILY_MINUTES: 600,
} as const;
