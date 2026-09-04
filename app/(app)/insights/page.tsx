"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  ListChecks,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/components/providers/app-data";
import {
  dayKey,
  dueState,
  formatDue,
  minutesToLabel,
  rankTasks,
  toDateInput,
  cn,
} from "@/lib/utils";

export default function InsightsPage() {
  const { profile, subjects, tasks, sessions, loading } = useApp();

  const stats = useMemo(() => {
    const pending = tasks.filter((t) => t.status === "pending");
    const completed = tasks.length - pending.length;
    const overdue = pending.filter((t) => dueState(t.due_date) === "overdue");
    const completionPct = tasks.length
      ? Math.round((completed / tasks.length) * 100)
      : 0;

    // Study minutes over the last 7 days (completed sessions).
    const days: { label: string; minutes: number; key: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toDateInput(d);
      days.push({
        key,
        label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
        minutes: sessions
          .filter(
            (s) => s.status === "completed" && dayKey(s.completed_at ?? s.planned_date) === key
          )
          .reduce((sum, s) => sum + s.duration_minutes, 0),
      });
    }
    const maxMinutes = Math.max(30, ...days.map((d) => d.minutes));
    const totalMinutes = sessions
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.duration_minutes, 0);

    return {
      pending: pending.length,
      completed,
      overdue,
      completionPct,
      days,
      maxMinutes,
      totalMinutes,
      recommendations: rankTasks(pending).slice(0, 5),
    };
  }, [tasks, sessions]);

  if (loading) return <LoadingState label="Loading your insights…" />;

  const hasData = tasks.length > 0 || sessions.length > 0;

  return (
    <>
      <PageHeader
        title="Insights"
        description="Your academic progress, study time and what needs attention."
      />

      {!hasData ? (
        <EmptyState
          icon={<BarChart3 className="h-8 w-8" />}
          title="Not enough data yet"
          description="Add tasks, mark them complete, and log study sessions — your insights will appear here."
          action={
            <Link
              href="/academics"
              className="inline-flex h-8 items-center rounded-lg bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700"
            >
              Go to Academics
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Top stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Completion
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {stats.completionPct}%
              </p>
              <p className="text-xs text-slate-500">
                {stats.completed}/{tasks.length} tasks
              </p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <AlertTriangle className="h-4 w-4 text-red-500" /> Overdue
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {stats.overdue.length}
              </p>
              <p className="text-xs text-slate-500">pending past deadline</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <ListChecks className="h-4 w-4" /> Pending
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {stats.pending}
              </p>
              <p className="text-xs text-slate-500">tasks remaining</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <Clock className="h-4 w-4 text-brand-600" /> Study time
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {minutesToLabel(stats.totalMinutes)}
              </p>
              <p className="text-xs text-slate-500">all logged sessions</p>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Study time chart */}
            <Card>
              <CardHeader title="Study time — last 7 days" />
              <div className="flex h-40 items-end justify-between gap-2">
                {stats.days.map((d) => (
                  <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[10px] font-medium text-slate-500">
                      {d.minutes > 0 ? `${d.minutes}m` : ""}
                    </span>
                    <div
                      className={cn(
                        "w-full rounded-t-md transition-all",
                        d.minutes > 0 ? "bg-brand-500" : "bg-slate-100"
                      )}
                      style={{
                        height: `${Math.max(6, (d.minutes / stats.maxMinutes) * 100)}%`,
                      }}
                      title={`${d.minutes} minutes`}
                    />
                    <span className="text-[11px] text-slate-500">{d.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Subject progress */}
            <Card>
              <CardHeader title="Progress by subject" />
              {subjects.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No subjects yet —{" "}
                  <Link href="/academics" className="text-brand-600 hover:underline">
                    add subjects
                  </Link>{" "}
                  to track progress.
                </p>
              ) : (
                <ul className="space-y-4">
                  {subjects.map((s) => {
                    const st = tasks.filter((t) => t.subject_id === s.id);
                    const done = st.filter((t) => t.status === "completed").length;
                    const pct = st.length ? (done / st.length) * 100 : 0;
                    return (
                      <li key={s.id}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 font-medium text-slate-700">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: s.color }}
                              aria-hidden
                            />
                            {s.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {done}/{st.length} done
                          </span>
                        </div>
                        <ProgressBar value={pct} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          {/* Priority recommendations (rule-based) */}
          <Card>
            <CardHeader
              title="Priority recommendations"
              icon={<AlertTriangle className="h-4 w-4 text-brand-600" />}
            />
            {stats.recommendations.length === 0 ? (
              <p className="text-sm text-slate-600">
                No pending tasks — great job staying on top of things. For
                AI-powered study plans, check the recommendation card on your{" "}
                <Link href="/dashboard" className="font-medium text-brand-600 hover:underline">
                  dashboard
                </Link>
                .
              </p>
            ) : (
              <ol className="space-y-2">
                {stats.recommendations.map((t, i) => {
                  const subj = t.subject_id
                    ? subjects.find((s) => s.id === t.subject_id)
                    : undefined;
                  const state = dueState(t.due_date);
                  return (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {t.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {subj ? `${subj.code || subj.name} · ` : ""}
                          {t.priority} priority
                        </p>
                      </div>
                      <Badge
                        className={
                          state === "overdue"
                            ? "bg-red-100 text-red-700"
                            : state === "today"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }
                      >
                        {formatDue(t.due_date)}
                      </Badge>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          {profile?.goals && (
            <Card>
              <CardHeader title="Your semester goal" />
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {profile.goals}
              </p>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
