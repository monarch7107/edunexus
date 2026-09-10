"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flag,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AICommandBox } from "@/components/ai/ai-workflow";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { LoadingState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/motion";
import { AiRecommendationCard } from "@/components/dashboard/ai-recommendation-card";
import { DemoBanner, DemoSeedCard } from "@/components/demo/demo-seed-card";
import { useApp } from "@/components/providers/app-data";
import { listAgentRuns, type AgentHistoryEntry } from "@/lib/ai/activity-store";
import {
  dayKey,
  dueBadge,
  dueState,
  formatDue,
  greeting,
  minutesToLabel,
  rankTasks,
  todayKey,
  toDateInput,
} from "@/lib/utils";

function EmptyPriorities() {
  return (
    <div className="rounded-lg border border-dashed border-line px-4 py-6 text-center">
      <p className="text-sm font-medium text-ink">Nothing is waiting on you.</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Add a task to see your priorities ranked by deadline and importance.
      </p>
      <ButtonLink href="/academics" size="sm" variant="outline" className="mt-4">
        Go to Academics <ArrowRight className="size-3.5" aria-hidden />
      </ButtonLink>
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile, subjects, tasks, sessions, loading } = useApp();
  const [lastRun, setLastRun] = useState<AgentHistoryEntry | null>(null);
  useEffect(() => {
    setLastRun(listAgentRuns(user?.id)[0] ?? null);
  }, [user?.id]);

  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );
  const pending = useMemo(
    () => tasks.filter((t) => t.status === "pending"),
    [tasks],
  );
  const priorities = useMemo(() => rankTasks(pending).slice(0, 4), [pending]);
  const overdue = useMemo(
    () => pending.filter((t) => dueState(t.due_date) === "overdue"),
    [pending],
  );
  const todaySessions = useMemo(
    () =>
      sessions
        .filter((s) => dayKey(s.planned_date) === todayKey())
        .sort((a, b) => a.planned_date.localeCompare(b.planned_date)),
    [sessions],
  );
  const week = useMemo(() => {
    const now = new Date();
    const start = toDateInput(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
    );
    const end = todayKey();
    const inWindow = sessions.filter((s) => {
      const key = dayKey(s.planned_date);
      return key !== null && key >= start && key <= end;
    });
    const planned = inWindow.reduce((n, s) => n + s.duration_minutes, 0);
    const done = inWindow
      .filter((s) => s.status === "completed")
      .reduce((n, s) => n + s.duration_minutes, 0);
    const activeDays = new Set(
      inWindow.filter((s) => s.status === "completed").map((s) => dayKey(s.planned_date)),
    ).size;
    return {
      planned,
      done,
      pct: planned ? Math.round((done / planned) * 100) : 0,
      sessions: inWindow.length,
      subjects: new Set(inWindow.map((s) => s.subject_id).filter(Boolean)).size,
      consistency: Math.round((activeDays / 7) * 100),
    };
  }, [sessions]);
  const momentum = tasks.length
    ? Math.round(
        (tasks.filter((t) => t.status === "completed").length / tasks.length) * 100,
      )
    : 0;
  const nextMilestone = useMemo(() => {
    const dated = pending.filter((t) => dayKey(t.due_date));
    if (!dated.length) return null;
    return [...dated].sort((a, b) =>
      String(a.due_date).localeCompare(String(b.due_date)),
    )[0];
  }, [pending]);
  const completedMinutes = useMemo(
    () =>
      sessions
        .filter((s) => s.status === "completed")
        .reduce((n, s) => n + s.duration_minutes, 0),
    [sessions],
  );

  if (loading) return <LoadingState label="Opening your dashboard…" />;

  const firstName = (profile?.full_name || "there").split(" ")[0];
  const isEmpty =
    subjects.length === 0 && tasks.length === 0 && sessions.length === 0;
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-6">
      <DemoBanner />

      <section
        aria-labelledby="dashboard-title"
        className="flex flex-col gap-5 rounded-2xl border border-brand-800 bg-brand-900 px-5 py-6 text-white shadow-xl shadow-brand-900/10 dark:border-white/10 dark:bg-[#0f1b33] sm:px-7 sm:py-7 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="max-w-2xl">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1">
              <Sparkles className="size-3.5" aria-hidden /> Academic command center
            </span>
            <span className="text-white/70">{todayLabel}</span>
          </div>
          <h1
            id="dashboard-title"
            className="text-balance font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            {greeting()}, {firstName}.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
            {isEmpty
              ? "Your workspace is ready. Load the sample workspace or add your first subject to begin."
              : `Your academic context is in focus — ${pending.length} open ${pending.length === 1 ? "task" : "tasks"}, ${todaySessions.length} ${todaySessions.length === 1 ? "session" : "sessions"} planned today${overdue.length ? `, and ${overdue.length} needing attention` : ""}.`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gold text-[#12214d]">
            <TrendingUp className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-xs text-white/70">Task momentum</p>
            <p className="font-semibold text-white">{momentum}% complete</p>
          </div>
        </div>
      </section>

      <AICommandBox
        summary={
          isEmpty
            ? "Add your subjects and deadlines, then ask EduNexus to reason over them — every proposal stays under your control."
            : `EduNexus sees ${subjects.length} ${subjects.length === 1 ? "subject" : "subjects"}, ${pending.length} open ${pending.length === 1 ? "task" : "tasks"}, and ${sessions.filter((s) => s.status === "planned").length} planned sessions. Ask for a recommendation — you approve every change.`
        }
      />

      {isEmpty ? (
        <Reveal>
          <DemoSeedCard />
        </Reveal>
      ) : (
        <DemoSeedCard compact />
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Academic overview">
        <StatCard
          label="Planned this week"
          value={minutesToLabel(week.planned)}
          detail={`${minutesToLabel(week.done)} completed`}
          Icon={Clock3}
        />
        <StatCard
          label="Open tasks"
          value={pending.length}
          detail={
            overdue.length
              ? `${overdue.length} need${overdue.length === 1 ? "s" : ""} attention`
              : tasks.length
                ? "All clear — nothing overdue"
                : "Add your first task to begin"
          }
          Icon={Flag}
          tone={overdue.length ? "red" : "brand"}
          index={1}
        />
        <StatCard
          label="Time well spent"
          value={minutesToLabel(completedMinutes)}
          detail="Total completed study time"
          Icon={TrendingUp}
          tone="sky"
          index={2}
        />
        <StatCard
          label="Next milestone"
          value={nextMilestone ? formatDue(nextMilestone.due_date) : "—"}
          detail={
            nextMilestone
              ? nextMilestone.title.length > 42
                ? `${nextMilestone.title.slice(0, 42)}…`
                : nextMilestone.title
              : "No upcoming deadlines"
          }
          Icon={CalendarDays}
          tone="amber"
          index={3}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Card>
          <CardHeader
            title="Today's priorities"
            description="Ranked by deadline, then priority — the same order your AI guidance uses."
            action={
              <Link href="/academics" className="text-link">
                View all <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            }
          />
          <CardContent className="!gap-3">
            {priorities.length ? (
              priorities.map((task) => {
                const badge = dueBadge(task.due_date);
                return (
                  <div key={task.id} className="task-row">
                    <span
                      aria-hidden
                      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-line"
                    >
                      <CheckCircle2 className="size-3.5 text-muted" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <p className="mt-1 truncate text-xs text-muted">
                        {task.subject_id
                          ? subjectMap.get(task.subject_id)?.name ?? "No subject"
                          : "No subject"}
                      </p>
                    </div>
                    <Badge variant="outline" className={badge.className}>
                      {badge.label}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <EmptyPriorities />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Weekly progress"
            description="Your completed study time against the plan."
            action={
              <Link href="/insights" className="text-link">
                Insights <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            }
          />
          <CardContent className="!gap-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-display text-4xl font-bold tracking-tight">
                  {week.pct}%
                </p>
                <p className="mt-1 text-xs text-muted">
                  {minutesToLabel(week.done)} of {minutesToLabel(week.planned)}{" "}
                  complete
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                Last 7 days
              </Badge>
            </div>
            <ProgressBar value={week.pct} label="Weekly study progress" />
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <p className="font-display text-base font-bold">{week.sessions}</p>
                <p className="mt-1 text-muted">sessions</p>
              </div>
              <div>
                <p className="font-display text-base font-bold">{week.subjects}</p>
                <p className="mt-1 text-muted">subjects</p>
              </div>
              <div>
                <p className="font-display text-base font-bold">{week.consistency}%</p>
                <p className="mt-1 text-muted">consistency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-5 lg:grid-cols-2" aria-label="Study plan and guidance">
        <Card>
          <CardHeader
            title="Today's study sessions"
            description="Your plan for today, from your planner."
            action={
              <Link href="/planner" className="text-link">
                Open planner <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            }
          />
          <CardContent className="!gap-3">
            {todaySessions.length ? (
              todaySessions.slice(0, 4).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 rounded-lg border border-line p-3"
                >
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full bg-brand-600"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{session.title}</p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {session.subject_id
                        ? (subjectMap.get(session.subject_id)?.name ?? "Study session")
                        : "Study session"}{" "}
                      · {minutesToLabel(session.duration_minutes)}
                      {session.status === "completed" ? " · Completed" : ""}
                    </p>
                  </div>
                  <Link
                    href="/planner"
                    className="shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-800"
                  >
                    Open
                  </Link>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-line px-4 py-6 text-center">
                <p className="text-sm font-medium text-ink">
                  Nothing scheduled today.
                </p>
                <p className="mt-1 text-xs text-muted">
                  Plan a session — or ask the Planning Agent to propose one.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <ButtonLink href="/planner" size="sm" variant="outline">
                    Open planner
                  </ButtonLink>
                  <ButtonLink href="/ai" size="sm">
                    Ask the planner <ArrowRight className="size-3.5" aria-hidden />
                  </ButtonLink>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <AiRecommendationCard />
      </section>

      <Card>
        <CardHeader
          title="Planning Agent"
          description="Read-only analysis until you approve. The LLM reasons — it never authorizes itself."
          action={
            lastRun ? (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                Last run: {lastRun.verified}/{lastRun.proposed} verified
              </Badge>
            ) : (
              <Badge variant="outline">Context ready</Badge>
            )
          }
        />
        <CardContent className="!gap-4">
          <div className="grid gap-3 text-center text-xs sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 px-3 py-3">
              <p className="font-display text-xl font-bold">{subjects.length}</p>
              <p className="mt-1 text-muted">subjects in context</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-3">
              <p className="font-display text-xl font-bold">{pending.length}</p>
              <p className="mt-1 text-muted">open tasks in context</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-3">
              <p className="font-display text-xl font-bold">
                {sessions.filter((s) => s.status === "planned").length}
              </p>
              <p className="mt-1 text-muted">planned sessions</p>
            </div>
          </div>
          {lastRun && (
            <p className="text-xs leading-relaxed text-muted">
              <span className="font-semibold text-ink">Latest activity: </span>
              {lastRun.summary} ({lastRun.proposed} proposed · {lastRun.approved}{" "}
              approved · {lastRun.executed} executed · {lastRun.verified} verified)
            </p>
          )}
          <div>
            <ButtonLink href="/ai">
              Open AI Command Center <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
