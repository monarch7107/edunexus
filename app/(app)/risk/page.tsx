"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { useApp } from "@/components/providers/app-data";
import { computeAcademicSignals, workloadCopy } from "@/lib/intelligence";
import { minutesToLabel } from "@/lib/utils";
import { useMemo } from "react";

export default function RiskPage() {
  const { subjects, tasks, sessions, loading } = useApp();
  const signals = useMemo(
    () => computeAcademicSignals(subjects, tasks, sessions),
    [subjects, tasks, sessions],
  );

  if (loading) return <LoadingState label="Reading your academic signals…" />;

  const isEmpty =
    subjects.length === 0 && tasks.length === 0 && sessions.length === 0;
  const copy = workloadCopy(signals.workload);
  const levelTone =
    signals.workload === "overloaded"
      ? "border-red-200 bg-red-50 text-red-700"
      : signals.workload === "heavy"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Academic risk"
        description="Evidence-based signals from your workload — rule-based observations, never fabricated predictions."
        action={
          <ButtonLink href="/ai" size="sm">
            Optimize my schedule <ArrowRight className="size-3.5" aria-hidden />
          </ButtonLink>
        }
      />

      {isEmpty ? (
        <Card>
          <EmptyState
            icon={<ShieldCheck className="size-6" aria-hidden />}
            title="Not enough signal yet."
            description="Add subjects, tasks with deadlines, and study sessions — risk signals are computed only from work you actually have."
            action={
              <ButtonLink href="/academics">
                Build your workspace <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-xl border ${levelTone}`}
              >
                <AlertTriangle className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="eyebrow">Workload risk</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
                  {copy.title}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                  {copy.detail}
                </p>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  {signals.evidence.map((e) => (
                    <li key={e} className="flex items-center gap-1.5">
                      <span aria-hidden className="size-1 rounded-full bg-brand-500" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-display text-2xl font-bold">{signals.overdueTasks}</p>
                <p className="mt-1 text-xs text-muted">overdue tasks</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-display text-2xl font-bold">{signals.examTasks7d}</p>
                <p className="mt-1 text-xs text-muted">exams in 7 days</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-display text-2xl font-bold">{signals.pendingTasks}</p>
                <p className="mt-1 text-xs text-muted">pending tasks</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-display text-2xl font-bold">
                  {minutesToLabel(signals.plannedMinutes7d)}
                </p>
                <p className="mt-1 text-xs text-muted">planned study time</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
              <ButtonLink href="/ai">
                Review schedule with AI <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/planner" variant="outline">
                Open planner
              </ButtonLink>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Subjects needing attention"
              description="Derived from overdue work and exams without completed study time."
            />
            <CardContent className="!gap-2.5">
              {signals.subjectAttention.length ? (
                signals.subjectAttention.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3.5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="mt-0.5 text-xs text-muted">{s.reason}</p>
                    </div>
                    <Link
                      href={`/academics?subject=${encodeURIComponent(s.id)}`}
                      className="text-link shrink-0"
                    >
                      View tasks <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs leading-relaxed text-muted">
                  No subject stands out right now. Overdue tasks or upcoming
                  exams without study time will surface here.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
