"use client";

import type { AgentRunStatus } from "@/lib/ai/types";

const LABELS: Record<AgentRunStatus, string> = {
  queued: "Queued",
  running: "Planning Agent analyzing…",
  waiting_approval: "Waiting for approval",
  executing: "Executing approved changes…",
  completed: "Verified",
  failed: "Needs attention",
  cancelled: "Cancelled",
};

export function AgentStatus({ status }: { status: AgentRunStatus }) {
  return (
    <p className="text-[11px] font-semibold text-brand-700" aria-live="polite">
      {LABELS[status]}
    </p>
  );
}
