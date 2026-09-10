"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  History,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { ScheduleCopilot } from "@/components/ai/copilot";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/components/providers/app-data";
import { listAgentRuns, type AgentHistoryEntry } from "@/lib/ai/activity-store";

const GUARANTEES = [
  {
    title: "The LLM reasons — it never authorizes itself",
    detail:
      "The Planning Agent can only use six approved tools. It cannot touch the database directly, invent permissions, or choose which student it acts for.",
  },
  {
    title: "Every meaningful change needs your approval",
    detail:
      "Proposals arrive as a change set with current state, proposed state, and reasons. Approve, edit, or reject — editing always requires a fresh review.",
  },
  {
    title: "Success is verified, never assumed",
    detail:
      "After execution the system re-reads the database and compares expected changes with actual state before confirming anything.",
  },
];

export default function AIPage() {
  const { user, subjects, tasks, sessions } = useApp();
  const [runs, setRuns] = useState<AgentHistoryEntry[]>([]);
  useEffect(() => {
    setRuns(listAgentRuns(user?.id));
  }, [user?.id]);

  const pending = tasks.filter((t) => t.status === "pending").length;
  const planned = sessions.filter((s) => s.status === "planned").length;
  const awaiting = runs.filter((r) => r.status === "waiting_approval");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Intelligence"
        title="AI command center"
        description="Ask EduNexus to reason over your academic context. You approve every meaningful change."
        action={
          <Link href="/ai/approvals" className="text-link">
            <ClipboardCheck className="size-3.5" aria-hidden /> Approval Center
            {awaiting.length > 0 && (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-800"
              >
                {awaiting.length} awaiting
              </Badge>
            )}
          </Link>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0">
          <ScheduleCopilot
            surface="ai"
            onResponse={() => setRuns(listAgentRuns(user?.id))}
          />
        </div>

        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader
              title="Your context, at a glance"
              description="What the Planning Agent will read. Read tools need no approval."
            />
            <CardContent className="!gap-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-slate-50 px-2 py-3">
                  <p className="font-display text-xl font-bold">{subjects.length}</p>
                  <p className="mt-1 text-muted">subjects</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-3">
                  <p className="font-display text-xl font-bold">{pending}</p>
                  <p className="mt-1 text-muted">open tasks</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-3">
                  <p className="font-display text-xl font-bold">{planned}</p>
                  <p className="mt-1 text-muted">sessions</p>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-muted">
                Only your own workspace is ever read — ownership is enforced by
                the server session and row-level security, never by the model.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Kept under your control"
              description="Three guarantees, enforced by architecture — not promises."
              icon={<ShieldCheck className="size-4 text-brand-600" aria-hidden />}
            />
            <CardContent className="!gap-4">
              {GUARANTEES.map((g) => (
                <div key={g.title} className="flex gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                  <div>
                    <p className="text-xs font-semibold leading-snug">{g.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">
                      {g.detail}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Recent agent activity"
              description="Latest Planning Agent runs on this device."
              action={
                <Link href="/ai/activity" className="text-link">
                  View all <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              }
              icon={<History className="size-4 text-brand-600" aria-hidden />}
            />
            <CardContent className="!gap-3">
              {runs.length ? (
                runs.slice(0, 3).map((run) => (
                  <div
                    key={run.runId}
                    className="rounded-lg border border-line px-3 py-2.5"
                  >
                    <p className="truncate text-xs font-semibold">{run.summary}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      {run.proposed} proposed · {run.approved} approved ·{" "}
                      {run.executed} executed · {run.verified} verified
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs leading-relaxed text-muted">
                  No runs yet. Ask the Planning Agent to optimize your schedule —
                  every run will be recorded here with its verification outcome.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
