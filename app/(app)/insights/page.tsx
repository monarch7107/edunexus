"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCheck,
  Clock3,
  Flag,
  ListTodo,
  Sprout,
  Target,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { ProgressBar, ProgressRing } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { Reveal } from "@/components/ui/motion";
import { StudyChart, studyDays } from "@/components/insights/study-chart";
import { WorkloadCard } from "@/components/ai/workload-card";
import { computeAcademicSignals } from "@/lib/intelligence";
import { useApp } from "@/components/providers/app-data";
import {
  dueState,
  formatDue,
  minutesToLabel,
  rankTasks,
  cn,
} from "@/lib/utils";
export default function InsightsPage() {
  const { profile, subjects, tasks, sessions, loading } = useApp();
  const [range, setRange] = useState(7);
  const stats = useMemo(() => {
    const pending = tasks.filter((t) => t.status === "pending");
    const completed = tasks.length - pending.length;
    const overdue = pending.filter((t) => dueState(t.due_date) === "overdue");
    const totalMinutes = sessions
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.duration_minutes, 0);
    const days = studyDays(sessions, range * 2);
    const previous = days
      .slice(0, range)
      .reduce((sum, d) => sum + d.minutes, 0);
    const current = days.slice(range).reduce((sum, d) => sum + d.minutes, 0);
    const activeDays = days.slice(range).filter((d) => d.minutes > 0).length;
    return {
      pending,
      completed,
      overdue,
      totalMinutes,
      completionPct: tasks.length ? (completed / tasks.length) * 100 : 0,
      current,
      previous,
      activeDays,
    };
  }, [tasks, sessions, range]);
  const signals = useMemo(
    () => computeAcademicSignals(subjects, tasks, sessions),
    [subjects, tasks, sessions],
  );
  if (loading)
    return <LoadingState label="Bringing your progress into perspective…" />;
  return (
    <>
      <PageHeader
        eyebrow="Small wins. A bigger picture."
        title="Look how far you’re growing."
        description="A thoughtful look at your progress, your patterns, and your possibilities."
        action={
          <div className="segmented">
            <button
              className="segment"
              aria-pressed={range === 7}
              onClick={() => setRange(7)}
            >
              Last 7 days
            </button>
            <button
              className="segment"
              aria-pressed={range === 14}
              onClick={() => setRange(14)}
            >
              Last 14 days
            </button>
          </div>
        }
      />
      {!tasks.length && !sessions.length && (
        <Reveal>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-200 bg-brand-50 p-5">
            <div className="flex items-start gap-3">
              <Sprout className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold">
                  Progress starts with a first step.
                </p>
                <p className="mt-1 text-xs text-muted">
                  Add tasks and complete study sessions. Your real story will
                  take shape right here.
                </p>
              </div>
            </div>
            <ButtonLink href="/academics" size="sm">
              Make a start <ArrowRight className="h-3.5 w-3.5" />
            </ButtonLink>
          </div>
        </Reveal>
      )}
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Task completion"
          value={`${Math.round(stats.completionPct)}%`}
          detail={`${stats.completed} of ${tasks.length} tasks · All time`}
          Icon={CheckCheck}
          index={0}
        />
        <StatCard
          label="Things to work toward"
          value={stats.pending.length}
          detail="Tasks still on your list"
          Icon={ListTodo}
          index={1}
        />
        <StatCard
          label="A little attention needed"
          value={stats.overdue.length}
          detail="Pending tasks past their deadline"
          Icon={AlertTriangle}
          tone={stats.overdue.length ? "red" : "amber"}
          index={2}
        />
        <StatCard
          label="Focused learning"
          value={minutesToLabel(stats.totalMinutes)}
          detail="All completed study sessions"
          Icon={Clock3}
          tone="sky"
          index={3}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Reveal>
          <Card className="h-full">
            <CardHeader
              title="Finding your rhythm"
              description={`Your completed study time, day by day · Last ${range} days`}
            />
            <StudyChart sessions={sessions} range={range} />
            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3 text-[10px] text-muted">
              <TrendingUp className="h-3.5 w-3.5 shrink-0 text-brand-600" />
              {stats.previous > 0
                ? `${stats.current >= stats.previous ? "+" : ""}${Math.round(((stats.current - stats.previous) / stats.previous) * 100)}% study time compared with the previous ${range} days.`
                : stats.current > 0
                  ? "You’ve started building your study rhythm. Keep making a little time."
                  : "A blank chart is a fresh start, not a setback."}
              <span className="ml-auto font-medium text-ink">
                {stats.activeDays}/{range} active days
              </span>
            </div>
          </Card>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="h-full">
            <CardHeader
              title="One step closer"
              description="Your all-time task completion"
            />
            <div className="flex justify-center py-4">
              <ProgressRing
                value={stats.completionPct}
                size={156}
                stroke={12}
                label="All-time task completion"
              />
            </div>
            <p className="mt-2 text-center text-xs font-medium">
              {stats.completed
                ? `${stats.completed} things you’ve already made happen.`
                : "Your first win is waiting."}
            </p>
            <div className="mt-6 space-y-3.5">
              {[
                {
                  label: "Completed",
                  value: stats.completed,
                  color: "bg-brand-500",
                },
                {
                  label: "Pending (not overdue)",
                  value: stats.pending.length - stats.overdue.length,
                  color: "bg-brand-200",
                },
                {
                  label: "Overdue",
                  value: stats.overdue.length,
                  color: "bg-red-400",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 text-xs"
                >
                  <span className={cn("h-2 w-2 rounded-full", item.color)} />
                  <span className="flex-1 text-muted">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      </div>
      <Reveal>
        <Card className="mt-5">
          <CardHeader
            title="Every subject has a story"
            description="Task progress and completed study time, all in perspective."
            action={
              <Link href="/academics" className="text-link">
                Your academics <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {subjects.length ? (
            <div>
              <div className="mb-2 hidden grid-cols-[1.2fr_1fr_100px_100px] gap-5 border-b border-line pb-3 text-[9px] font-semibold uppercase tracking-wider text-muted sm:grid">
                <span>Subject</span>
                <span>Task progress</span>
                <span className="text-right">Completed</span>
                <span className="text-right">Study time</span>
              </div>
              <div className="divide-y divide-line">
                {subjects.map((subject) => {
                  const related = tasks.filter(
                    (t) => t.subject_id === subject.id,
                  );
                  const done = related.filter(
                    (t) => t.status === "completed",
                  ).length;
                  const pct = related.length
                    ? (done / related.length) * 100
                    : 0;
                  const minutes = sessions
                    .filter(
                      (s) =>
                        s.subject_id === subject.id && s.status === "completed",
                    )
                    .reduce((sum, s) => sum + s.duration_minutes, 0);
                  return (
                    <div
                      key={subject.id}
                      className="grid items-center gap-3 py-4 sm:grid-cols-[1.2fr_1fr_100px_100px] sm:gap-5"
                    >
                      <Link
                        href={`/academics?subject=${subject.id}`}
                        className="group flex min-w-0 items-center gap-3"
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: `${subject.color}18` }}
                        >
                          <BookOpen
                            className="h-4 w-4"
                            style={{ color: subject.color }}
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold group-hover:text-brand-600">
                            {subject.name}
                          </span>
                          <span className="mt-1 block text-[9px] text-muted">
                            {subject.code || "Your subject"}
                          </span>
                        </span>
                      </Link>
                      <div className="flex items-center gap-3">
                        <ProgressBar
                          value={pct}
                          color={subject.color}
                          label={`${subject.name} task progress`}
                        />
                        <span className="w-7 shrink-0 text-right text-[10px] font-medium">
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-muted sm:text-right">
                        {done}
                        <span className="font-normal">
                          {" "}
                          / {related.length}
                          <span className="sm:hidden"> tasks complete</span>
                        </span>
                      </p>
                      <p className="text-[11px] font-medium text-muted sm:text-right">
                        <span className="sm:hidden">Study time: </span>
                        {minutesToLabel(minutes)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              compact
              icon={<BookOpen className="h-6 w-6" />}
              title="Let’s connect the dots."
              description="Add subjects to see where your effort is going and which topics could use a little more time."
              action={
                <ButtonLink size="sm" variant="outline" href="/academics">
                  Add a subject <ArrowRight className="h-3.5 w-3.5" />
                </ButtonLink>
              }
            />
          )}
        </Card>
      </Reveal>
      <div className="mt-5">
        <WorkloadCard signals={signals} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <CardHeader
              title="Where to put your energy"
              description="A breakdown of your pending task priorities."
              icon={<Flag className="h-4 w-4 text-brand-600" />}
            />
            <div className="space-y-5">
              {[
                {
                  priority: "high",
                  label: "High priority",
                  tone: "bg-red-400",
                  text: "text-red-600",
                },
                {
                  priority: "medium",
                  label: "Medium priority",
                  tone: "bg-amber-500",
                  text: "text-amber-700",
                },
                {
                  priority: "low",
                  label: "Low priority",
                  tone: "bg-brand-400",
                  text: "text-brand-600",
                },
              ].map((item) => {
                const count = stats.pending.filter(
                  (t) => t.priority === item.priority,
                ).length;
                return (
                  <div key={item.priority}>
                    <div className="mb-2 flex justify-between text-[11px]">
                      <span className={item.text}>{item.label}</span>
                      <span className="text-muted">{count} tasks</span>
                    </div>
                    <ProgressBar
                      value={
                        stats.pending.length
                          ? (count / stats.pending.length) * 100
                          : 0
                      }
                      barClassName={item.tone}
                      label={`${item.label} share of pending tasks`}
                    />
                  </div>
                );
              })}
            </div>
            <p className="mt-5 border-t border-line pt-4 text-[10px] leading-relaxed text-muted">
              A priority is a guide, not a pressure. Use deadlines and your
              energy to decide what comes next.
            </p>
          </Card>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="h-full">
            <CardHeader
              title="Your next best steps"
              description="Overdue first, then the nearest deadline and priority."
              action={
                <Link
                  href="/academics"
                  aria-label="Open all academic tasks"
                  className="text-link"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              }
            />
            {stats.pending.length ? (
              <ol className="space-y-4">
                {rankTasks(tasks)
                  .slice(0, 4)
                  .map((task, i) => (
                    <li key={task.id} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-muted">
                        0{i + 1}
                      </span>
                      <Link
                        href={`/academics?search=${encodeURIComponent(task.title)}`}
                        className="min-w-0 flex-1"
                      >
                        <p className="text-xs font-semibold hover:text-brand-600">
                          {task.title}
                        </p>
                        <p className="mt-1 text-[10px] capitalize text-muted">
                          {task.priority} priority · {formatDue(task.due_date)}
                        </p>
                      </Link>
                      {dueState(task.due_date) === "overdue" && (
                        <span className="rounded bg-red-50 px-1.5 py-1 text-[8px] text-red-600">
                          Overdue
                        </span>
                      )}
                    </li>
                  ))}
              </ol>
            ) : (
              <div className="py-9 text-center">
                <CheckCheck className="mx-auto mb-3 h-7 w-7 text-brand-500" />
                <p className="text-sm font-semibold">
                  Nothing hanging over your head.
                </p>
                <p className="mt-2 text-xs text-muted">
                  A little room to learn something new.
                </p>
              </div>
            )}
          </Card>
        </Reveal>
      </div>
      {profile?.goals && (
        <Reveal>
          <div className="mt-5 flex items-start gap-4 rounded-xl border border-brand-200 bg-brand-50/60 p-5">
            <Target className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <div className="min-w-0 flex-1">
              <p className="eyebrow mb-2 text-[9px] text-brand-700">
                The bigger picture · Your semester goals
              </p>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                {profile.goals}
              </p>
            </div>
            <Link
              href="/profile"
              aria-label="Edit your academic goals"
              className="text-link"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      )}
    </>
  );
}
