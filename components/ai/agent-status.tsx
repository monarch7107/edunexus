"use client";

import { motion } from "framer-motion";
import { Check, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { useQuietMotion } from "@/components/ui/motion";
import { cn } from "@/lib/utils";
import type { AgentRunStatus, ScheduleFinding } from "@/lib/ai/types";

export type CopilotPhase =
  | "idle"
  | "understanding"
  | "gathering"
  | "planning"
  | "waiting_approval"
  | "executing"
  | "verifying"
  | "done"
  | "failed";

const PHASE_ORDER: CopilotPhase[] = [
  "understanding",
  "gathering",
  "planning",
  "waiting_approval",
  "executing",
  "verifying",
  "done",
];

const PHASE_LABEL: Record<CopilotPhase, string> = {
  idle: "",
  understanding: "Understanding your request",
  gathering: "Gathering your academic context",
  planning: "Planning Agent analyzing your schedule",
  waiting_approval: "Waiting for your approval",
  executing: "Applying approved changes",
  verifying: "Verifying against your saved data",
  done: "Done",
  failed: "Stopped",
};

function phaseIndex(phase: CopilotPhase): number {
  const i = PHASE_ORDER.indexOf(phase);
  return i === -1 ? -1 : i;
}

/** Live progress trail for one agent run. */
export function AgentStatus({
  phase,
  analyzed,
  findings,
  proposedCount,
  fallback,
  error,
}: {
  phase: CopilotPhase;
  analyzed?: { subjects: number; tasks: number; sessions: number } | null;
  findings?: ScheduleFinding[];
  proposedCount?: number;
  fallback?: boolean;
  error?: string | null;
}) {
  const quiet = useQuietMotion();
  if (phase === "idle") return null;
  const current = phaseIndex(phase);

  return (
    <div className="space-y-3" role="status" aria-live="polite">
      {PHASE_ORDER.slice(0, 3).map((step, i) => {
        const state =
          phase === "failed" && i === current
            ? "failed"
            : current > i || phase === "done"
              ? "complete"
              : current === i
                ? "active"
                : "pending";
        if (state === "pending") return null;
        return (
          <motion.div
            key={step}
            initial={{ opacity: quiet ? 1 : 0, y: quiet ? 0 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: quiet ? 0 : 0.25 }}
            className="flex items-center gap-2.5 text-[13px]"
          >
            <StepIcon state={state} />
            <span className={cn(state === "complete" ? "text-muted" : "font-medium")}>
              {PHASE_LABEL[step]}
              {state === "active" && "…"}
            </span>
          </motion.div>
        );
      })}

      {analyzed && current >= 1 && (
        <div className="ml-6 space-y-1 text-[12px] text-muted">
          <p>✓ Reviewed {analyzed.subjects} subjects</p>
          <p>✓ Reviewed {analyzed.tasks} tasks</p>
          <p>✓ Reviewed {analyzed.sessions} study sessions</p>
        </div>
      )}

      {findings && findings.length > 0 && current >= 2 && (
        <motion.div
          initial={{ opacity: quiet ? 1 : 0 }}
          animate={{ opacity: 1 }}
          className="ml-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
        >
          <p className="text-[12px] font-semibold text-amber-800">
            {findings.length} {findings.length === 1 ? "issue" : "issues"} detected
          </p>
          <ul className="mt-1.5 space-y-1">
            {findings.slice(0, 4).map((f, i) => (
              <li key={i} className="text-[11px] leading-relaxed text-amber-900">
                • {f.detail}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {typeof proposedCount === "number" && proposedCount > 0 && current >= 3 && (
        <p className="ml-6 text-[13px] font-semibold">
          {proposedCount} {proposedCount === 1 ? "change" : "changes"} proposed
        </p>
      )}

      {fallback && (
        <div className="ml-6 flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" aria-hidden />
          <p className="text-[11px] leading-relaxed text-sky-900">
            AI is temporarily unavailable. Here’s a rule-based recommendation
            generated from your deadlines and sessions.
          </p>
        </div>
      )}

      {(phase === "executing" || phase === "verifying") && (
        <div className="flex items-center gap-2.5 text-[13px]">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600" aria-hidden />
          <span className="font-medium">{PHASE_LABEL[phase]}…</span>
        </div>
      )}

      {phase === "failed" && error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" aria-hidden />
          <p className="text-[12px] leading-relaxed text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}

function StepIcon({ state }: { state: "complete" | "active" | "failed" }) {
  if (state === "failed") {
    return <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600" aria-hidden />;
  }
  if (state === "active") {
    return <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-600" aria-hidden />;
  }
  return <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />;
}

/** Small pill for the persisted run status. */
export function RunStatusBadge({ status }: { status: AgentRunStatus }) {
  const styles: Record<AgentRunStatus, string> = {
    queued: "bg-slate-100 text-slate-600",
    running: "bg-sky-100 text-sky-700",
    waiting_approval: "bg-amber-100 text-amber-800",
    executing: "bg-sky-100 text-sky-700",
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    cancelled: "bg-slate-100 text-slate-600",
  };
  const label: Record<AgentRunStatus, string> = {
    queued: "Queued",
    running: "Running",
    waiting_approval: "Waiting for approval",
    executing: "Executing",
    completed: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
        styles[status],
      )}
    >
      {label[status]}
    </span>
  );
}
