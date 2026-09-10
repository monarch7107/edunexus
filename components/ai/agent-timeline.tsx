"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentRunStatus } from "@/lib/ai/types";

const STAGES = [
  "Understanding request",
  "Analyzing academic context",
  "Planning Agent activated",
  "Checking conflicts",
  "Preparing proposal",
  "Awaiting approval",
  "Executing approved changes",
  "Verifying database state",
] as const;

/**
 * Maps a terminal/live run status to the furthest stage reached.
 * `null` means no run yet — the timeline renders upcoming stages only.
 */
export function stageIndexForStatus(status: AgentRunStatus | null): number | null {
  switch (status) {
    case null:
      return null;
    case "queued":
      return 0;
    case "running":
      return 2;
    case "waiting_approval":
      return 5;
    case "executing":
      return 6;
    case "completed":
      return 8;
    case "failed":
    case "cancelled":
      return 5;
    default:
      return null;
  }
}

export function AgentTimeline({
  status = null,
  progressStep = null,
  className,
}: {
  status?: AgentRunStatus | null;
  /** 0-based live step while a request is in flight (before a run exists). */
  progressStep?: number | null;
  className?: string;
}) {
  const reached = stageIndexForStatus(status);
  const active =
    progressStep !== null && reached === null ? progressStep : reached;
  const failed = status === "failed" || status === "cancelled";
  // Execution stages only become relevant once the student approves.
  const visible =
    status === "executing" || status === "completed"
      ? STAGES
      : STAGES.slice(0, 6);

  return (
    <ol aria-label="Planning Agent progress" className={cn("flex flex-col gap-3", className)}>
      {visible.map((stage, index) => {
        const done =
          active !== null &&
          (index < active || (status === "completed" && index < visible.length));
        const current =
          active !== null && index === active && status !== "completed";
        return (
          <li
            key={stage}
            aria-current={current ? "step" : undefined}
            className="flex items-center gap-3 text-sm"
          >
            <span
              aria-hidden
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full",
                done &&
                  "bg-brand-600 text-on-accent",
                current && !failed && "border-2 border-brand-600 bg-brand-50 text-brand-700",
                current && failed && "border-2 border-red-400 bg-red-50 text-red-700",
                !done && !current && "border border-line text-muted",
              )}
            >
              {done ? (
                <Check className="size-3.5" strokeWidth={2.5} />
              ) : current ? (
                <span
                  className={cn(
                    "size-2 rounded-full",
                    failed ? "bg-red-500" : "animate-pulse bg-brand-600",
                  )}
                />
              ) : (
                <span className="size-1.5 rounded-full bg-slate-300" />
              )}
            </span>
            <span
              className={cn(
                "text-[13px]",
                done || current ? "font-medium text-ink" : "text-muted",
              )}
            >
              {stage}
            </span>
            {current && (
              <span className="ml-auto shrink-0 text-[11px] text-muted">
                {failed
                  ? status === "cancelled"
                    ? "Stopped"
                    : "Needs attention"
                  : "In progress"}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
