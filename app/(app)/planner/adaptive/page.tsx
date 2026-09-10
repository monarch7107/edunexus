"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { ScheduleCopilot } from "@/components/ai/copilot";
import { RunStatusBadge } from "@/components/ai/run-status-badge";
import { useApp } from "@/components/providers/app-data";
import type { GatewayResponse } from "@/lib/ai/types";
import { dayKey, minutesToLabel, todayKey } from "@/lib/utils";

function formatDay(value: string): string {
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return parsed.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function AdaptivePlannerPage() {
  const { subjects, sessions, loading } = useApp();
  const [proposal, setProposal] = useState<GatewayResponse | null>(null);

  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );
  const upcoming = useMemo(
    () =>
      sessions
        .filter((s) => {
          const key = dayKey(s.planned_date);
          return s.status === "planned" && key !== null && key >= todayKey();
        })
        .sort((a, b) => a.planned_date.localeCompare(b.planned_date))
        .slice(0, 6),
    [sessions],
  );

  if (loading) return <LoadingState label="Opening your adaptive planner…" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Planner / Adaptive"
        title="A plan that responds to your week"
        description="Compare your current commitments with a proposed plan — then approve, edit, or reject before anything changes."
        action={
          <ButtonLink href="/planner" size="sm" variant="outline">
            Back to planner <ArrowRight className="size-3.5" aria-hidden />
          </ButtonLink>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Current plan"
            description="Your existing schedule, read from your study sessions."
            action={
              <span className="text-[11px] font-medium text-muted">
                {upcoming.length} upcoming
              </span>
            }
          />
          <CardContent className="!gap-2.5">
            {upcoming.length ? (
              upcoming.map((session) => (
                <div
                  key={session.id}
                  className="rounded-lg border border-line px-3.5 py-3"
                >
                  <p className="text-sm font-semibold">{session.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDay(session.planned_date)} ·{" "}
                    {minutesToLabel(session.duration_minutes)}
                    {session.subject_id
                      ? ` · ${subjectMap.get(session.subject_id)?.name ?? "Study session"}`
                      : ""}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                compact
                icon={<CalendarDays className="size-6" aria-hidden />}
                title="No upcoming sessions."
                description="Plan a session — or ask the Planning Agent to propose a week for you."
                action={
                  <Link href="/planner" className="text-link">
                    Open planner <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-5">
          <ScheduleCopilot surface="adaptive" onResponse={setProposal} />
          <Card className="border-brand-200 bg-brand-50/60">
            <CardHeader
              title="Proposed plan"
              description={
                proposal
                  ? "Mirrored live from the Planning Agent's current proposal."
                  : "Run the Planning Agent to see its proposal mirrored here."
              }
              action={
                proposal ? (
                  <RunStatusBadge status={proposal.status} />
                ) : undefined
              }
            />
            <CardContent className="!gap-2.5">
              {proposal && proposal.changes.length > 0 ? (
                proposal.changes.map((change) => (
                  <div
                    key={change.id}
                    className="rounded-lg border border-brand-200 bg-surface px-3.5 py-3"
                  >
                    <p className="text-sm font-semibold">{change.label}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      {typeof change.payload.planned_date === "string" &&
                      change.payload.planned_date
                        ? formatDay(change.payload.planned_date)
                        : "Unscheduled"}
                      {typeof change.payload.duration_minutes === "number"
                        ? ` · ${minutesToLabel(change.payload.duration_minutes)}`
                        : ""}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs leading-relaxed text-muted">
                  {proposal
                    ? "This run proposed no changes — your current plan already looks balanced."
                    : "Nothing proposed yet. The proposal will appear here alongside the approval controls above."}
                </p>
              )}
              {proposal?.summary && (
                <p className="border-t border-brand-200 pt-3 text-[11px] leading-relaxed text-muted">
                  <span className="font-semibold text-ink">Why: </span>
                  {proposal.summary}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
