"use client";

import { Badge } from "@/components/ui/badge";
import type { AgentRunStatus } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

const META: Record<AgentRunStatus, { label: string; tone: string }> = {
  queued: { label: "Queued", tone: "" },
  running: { label: "Running", tone: "border-ai-line bg-ai-soft text-ai" },
  waiting_approval: {
    label: "Awaiting approval",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
  },
  executing: { label: "Executing", tone: "border-ai-line bg-ai-soft text-ai" },
  completed: {
    label: "Verified",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  failed: { label: "Needs attention", tone: "border-red-200 bg-red-50 text-red-700" },
  cancelled: { label: "Rejected", tone: "" },
};

export function RunStatusBadge({ status }: { status: AgentRunStatus }) {
  const meta = META[status] ?? META.queued;
  return (
    <Badge variant="outline" className={cn(meta.tone)}>
      {meta.label}
    </Badge>
  );
}
