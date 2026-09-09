"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  Clock3,
  Library,
  ListTodo,
  Plus,
  Sprout,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { ProgressBar, ProgressRing } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { AnimatedList, Reveal } from "@/components/ui/motion";
import { TaskCard } from "@/components/academics/task-card";
import { TaskFormModal } from "@/components/academics/task-form-modal";
import { SessionFormModal } from "@/components/planner/session-form-modal";
import { SubjectFormModal } from "@/components/academics/subject-form-modal";
import { ResourceFormModal } from "@/components/learning/resource-form-modal";
import { StudySessionCard } from "@/components/planner/study-session-card";
import { AiRecommendationCard } from "@/components/dashboard/ai-recommendation-card";
import { DemoSeedCard, DemoBanner } from "@/components/demo/demo-seed-card";
import { StudyChart } from "@/components/insights/study-chart";
import { WeekStrip, weekStart } from "@/components/planner/week-strip";
import { useApp } from "@/components/providers/app-data";
import {
  dayKey,
  dueState,
  greeting,
  minutesToLabel,
  rankTasks,
  todayKey,
} from "@/lib/utils";
import type { Task } from "@/lib/types";

export default function DashboardPage() {
  const { profile, subjects, tasks, sessions, resources, loading } = useApp();
  const [taskModal, setTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sessionModal, setSessionModal] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [resourceModal, setResourceModal] = useState(false);
  const [taskView, setTaskView] = useState<"priority" | "today">("priority");
  const [selectedDay, setSelectedDay] = useState(todayKey());
  const [week, setWeek] = useState(weekStart(todayKey()));
  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );
  const stats = useMemo(() => {
    const pending = tasks.filter((t) => t.status === "pending");
    const completed = tasks.length - pending.length;
    const overdue = pending.filter((t) => dueState(t.due_date) === "overdue");
    const dueToday = pending.filter((t) => dueState(t.due_date) === "today");
    const studyMinutes = sessions
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.duration_minutes, 0);
    return {
      pending,
      completed,
      overdue,
      dueToday,
      studyMinutes,
      completionPct: tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0,
    };
  }, [tasks, sessions]);
  const visibleTasks = (
    taskView === "today" ? rankTasks(stats.dueToday) : rankTasks(tasks)
  ).slice(0, 4);
  const daySessions = sessions.filter(
    (s) => dayKey(s.planned_date) === selectedDay,
  );
  const counts = sessions.reduce<Record<string, number>>((acc, s) => {
    const day = dayKey(s.planned_date);
    if (day) acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const openTask = () => {
    setEditingTask(null);
    setTaskModal(true);
  };
  if (loading) return <LoadingState label="Loading your academic overview…" />;
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const isEmpty =
    subjects.length === 0 && tasks.length === 0 && sessions.length === 0;
  return (
    <>
      <DemoBanner />
      {isEmpty && (
        <Reveal>
          <div className="mb-6">
            <DemoSeedCard />
          </div>
        </Reveal>
      )}
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        title={`${greeting()}, ${firstName}.`}
        description="A little focus today. A little closer to your goals."
        action={
          <Button onClick={openTask}>
            <Plus className="h-4 w-4" /> Add task
          </Button>
        }
      />
      <Reveal className="hidden sm:block">
        <section className="relative mb-6 flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-xl border border-brand-200 bg-brand-50 px-5 py-6 sm:px-7">
          <div className="relative z-10 max-w-[65%] sm:max-w-[70%]">
            <div className="mb-2 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[.14em] text-brand-700">
              <Sprout className="h-3.5 w-3.5" />
              Your academic command center
            </div>
            <h2 className="text-xl font-bold tracking-[-.04em] sm:text-[25px]">
              {stats.pending.length
                ? "Good things take a little focus."
                : stats.completed
                  ? "Look at you making progress."
                  : "A fresh space for big possibilities."}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {stats.dueToday.length
                ? `You have ${stats.dueToday.length} ${stats.dueToday.length === 1 ? "task" : "tasks"} due today. Let’s make a little room for progress.`
                : tasks.length
                  ? `${stats.completed} tasks behind you. ${stats.pending.length} next steps ahead. You’ve got this.`
                  : "Bring your subjects, plans, and ideas together. Let’s make this semester yours."}
            </p>
            {!subjects.length && (
              <button
                className="text-link mt-4 text-[11px]"
                onClick={() => setSubjectModal(true)}
              >
                Start with your first subject{" "}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <ProgressRing value={stats.completionPct} size={82} stroke={6} />
            <div className="hidden sm:block">
              <p className="text-xs font-semibold">Your overall progress</p>
              <p className="mt-1.5 text-[10px] text-muted">
                {stats.completed} of {tasks.length} tasks complete
              </p>
            </div>
          </div>
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-80 w-80 rounded-full border-[35px] border-brand-200/25"
          />
        </section>
      </Reveal>
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Tasks to do"
          value={String(stats.pending.length).padStart(2, "0")}
          detail={
            stats.dueToday.length
              ? `${stats.dueToday.length} due today · You’ve got this`
              : "A clear view of what’s next"
          }
          Icon={ListTodo}
          index={0}
        />
        <StatCard
          label="Tasks completed"
          value={String(stats.completed).padStart(2, "0")}
          detail={`${stats.completionPct}% of your academic to-dos`}
          Icon={CheckCheck}
          index={1}
        />
        <StatCard
          label="Needs attention"
          value={String(stats.overdue.length).padStart(2, "0")}
          detail={
            stats.overdue.length
              ? "Overdue tasks · Take the next step"
              : "No overdue tasks. A clear horizon."
          }
          Icon={AlertTriangle}
          tone={stats.overdue.length ? "red" : "amber"}
          index={2}
        />
        <StatCard
          label="Time well spent"
          value={minutesToLabel(stats.studyMinutes)}
          detail={`${sessions.filter((s) => s.status === "completed").length} study sessions completed`}
          Icon={Clock3}
          tone="sky"
          index={3}
        />
      </div>
      <Reveal delay={0.04}>
        <div className="mb-6 grid grid-cols-2 items-center gap-2 rounded-xl border border-line bg-surface p-3 sm:flex sm:flex-wrap sm:px-5">
          <span className="eyebrow mr-3 hidden text-[9px] sm:inline">
            Make your next move
          </span>
          {[
            {
              label: "Add subject",
              Icon: BookOpen,
              action: () => setSubjectModal(true),
            },
            { label: "Add task", Icon: Plus, action: openTask },
            {
              label: "Plan study",
              Icon: CalendarDays,
              action: () => setSessionModal(true),
            },
            {
              label: "Add resource",
              Icon: Library,
              action: () => setResourceModal(true),
            },
          ].map(({ label, Icon, action }) => (
            <Button
              key={label}
              variant="ghost"
              size="sm"
              onClick={action}
              className="w-full !text-[11px] sm:w-auto sm:flex-none"
            >
              <Icon className="h-3.5 w-3.5 text-brand-600" />
              {label}
            </Button>
          ))}
        </div>
      </Reveal>
      <div className="grid items-start gap-5 xl:grid-cols-[1.75fr_1fr]">
        <div className="min-w-0 space-y-5">
          <Reveal delay={0.05}>
            <Card>
              <CardHeader
                title="One priority at a time"
                description="The next small steps that make a big difference."
                action={
                  <Link href="/academics" className="text-link">
                    All tasks <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="segmented">
                  <button
                    className="segment"
                    aria-pressed={taskView === "priority"}
                    onClick={() => setTaskView("priority")}
                  >
                    Up next{" "}
                    <span className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[9px]">
                      {stats.pending.length}
                    </span>
                  </button>
                  <button
                    className="segment"
                    aria-pressed={taskView === "today"}
                    onClick={() => setTaskView("today")}
                  >
                    Due today
                  </button>
                </div>
                {stats.overdue.length > 0 && (
                  <Link
                    href="/academics?status=overdue"
                    className="flex items-center gap-1 text-[10px] text-red-600"
                  >
                    <span className="h-1 w-1 rounded-full bg-red-500" />
                    {stats.overdue.length} overdue
                  </Link>
                )}
              </div>
              {visibleTasks.length ? (
                <AnimatedList className="space-y-2">
                  {visibleTasks.map((task) => (
                    <TaskCard
                      compact
                      key={task.id}
                      task={task}
                      subject={subjectMap.get(task.subject_id || "")}
                      onEdit={() => {
                        setEditingTask(task);
                        setTaskModal(true);
                      }}
                    />
                  ))}
                </AnimatedList>
              ) : (
                <EmptyState
                  compact
                  icon={<Check className="h-6 w-6" />}
                  title={
                    tasks.length
                      ? "A little breathing room."
                      : "Your next win starts here."
                  }
                  description={
                    taskView === "today"
                      ? "Nothing is due today. Make some progress on what’s next, or give yourself a well-earned break."
                      : "Add an assignment, an exam, or a reading. Give your next goal a clear, achievable step."
                  }
                  action={
                    <Button size="sm" variant="outline" onClick={openTask}>
                      <Plus className="h-3.5 w-3.5" /> Add a task
                    </Button>
                  }
                />
              )}
            </Card>
          </Reveal>
          <Reveal delay={0.07}>
            <Card>
              <CardHeader
                title="Find your study rhythm"
                action={
                  <Link href="/planner" className="text-link">
                    Open planner <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <WeekStrip
                compact
                start={week}
                selected={selectedDay}
                onSelect={setSelectedDay}
                onWeekChange={(date) => {
                  setWeek(date);
                  setSelectedDay(date);
                }}
                counts={counts}
              />
              <div className="mb-3 mt-5 flex items-center justify-between">
                <p className="text-[10px] font-semibold text-muted">
                  {selectedDay === todayKey()
                    ? "On your plan today"
                    : new Date(`${selectedDay}T12:00:00`).toLocaleDateString(
                        undefined,
                        { weekday: "long", month: "short", day: "numeric" },
                      )}
                </p>
                <button
                  className="text-link text-[10px]"
                  onClick={() => setSessionModal(true)}
                >
                  <Plus className="h-3 w-3" /> Plan a session
                </button>
              </div>
              {daySessions.length ? (
                <AnimatedList className="space-y-2">
                  {daySessions.map((session) => (
                    <StudySessionCard
                      compact
                      key={session.id}
                      session={session}
                      subject={subjectMap.get(session.subject_id || "")}
                    />
                  ))}
                </AnimatedList>
              ) : (
                <button
                  className="group flex w-full items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-left transition-colors hover:border-brand-400 hover:bg-brand-50"
                  onClick={() => setSessionModal(true)}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-brand-600">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-xs font-medium">
                      A little space to focus.
                    </span>
                    <span className="mt-1 block text-[10px] text-muted">
                      No sessions planned for this day. Let’s make time.
                    </span>
                  </span>
                  <Plus className="ml-auto h-4 w-4 shrink-0 text-muted transition-transform group-hover:rotate-90" />
                </button>
              )}
            </Card>
          </Reveal>
          <Reveal>
            <Card>
              <CardHeader
                title="Your subjects, moving forward"
                action={
                  <Link href="/academics" className="text-link">
                    View all <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              {subjects.length ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {subjects.slice(0, 4).map((subject) => {
                    const related = tasks.filter(
                      (t) => t.subject_id === subject.id,
                    );
                    const done = related.filter(
                      (t) => t.status === "completed",
                    ).length;
                    const pct = related.length
                      ? (done / related.length) * 100
                      : 0;
                    return (
                      <Link
                        href={`/academics?subject=${subject.id}`}
                        key={subject.id}
                        className="group rounded-lg border border-line p-3 transition-colors hover:border-brand-300"
                      >
                        <div className="mb-3 flex items-center gap-2.5">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: `${subject.color}15` }}
                          >
                            <BookOpen
                              className="h-3.5 w-3.5"
                              style={{ color: subject.color }}
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-semibold group-hover:text-brand-600">
                              {subject.name}
                            </p>
                            <p className="mt-0.5 text-[9px] text-muted">
                              {subject.code || `${related.length} tasks`}
                            </p>
                          </div>
                        </div>
                        <ProgressBar
                          value={pct}
                          color={subject.color}
                          label={`${subject.name} progress`}
                        />
                        <p className="mt-2 flex justify-between text-[9px] text-muted">
                          <span>
                            {done} of {related.length} complete
                          </span>
                          <span>{Math.round(pct)}%</span>
                        </p>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  compact
                  icon={<BookOpen className="h-6 w-6" />}
                  title="Give your semester some structure."
                  description="Subjects connect your tasks, sessions, and resources. Start with the one you’re studying next."
                  action={
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSubjectModal(true)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add subject
                    </Button>
                  }
                />
              )}
            </Card>
          </Reveal>
        </div>
        <div className="min-w-0 space-y-5">
          <Reveal delay={0.1}>
            <AiRecommendationCard />
          </Reveal>
          <Reveal delay={0.12}>
            <Card>
              <CardHeader
                title="Your learning, in motion"
                action={
                  <Link
                    href="/insights"
                    aria-label="View all study insights"
                    className="text-link"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                }
              />
              <StudyChart compact sessions={sessions} />
            </Card>
          </Reveal>
          <Reveal>
            <Card>
              <CardHeader
                title="Keep your goals in sight"
                icon={<Target className="h-4 w-4 text-brand-600" />}
              />
              {profile?.goals ? (
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                  {profile.goals}
                </p>
              ) : (
                <p className="text-xs leading-relaxed text-muted">
                  What would make this semester meaningful? A little intention
                  can guide a lot of progress.
                </p>
              )}
              <Link href="/profile" className="text-link mt-4 text-[10px]">
                {profile?.goals
                  ? "Revisit your goals"
                  : "Set your academic goals"}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Card>
          </Reveal>
          <Reveal>
            <Link
              href="/learning"
              className="card group flex items-center gap-3 p-5 transition-colors hover:border-brand-300"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Library className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-xs font-semibold">
                  A growing collection of ideas
                </span>
                <span className="mt-1 block text-[10px] text-muted">
                  {resources.length} resources in your library
                </span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted transition-transform group-hover:-translate-y-0.5" />
            </Link>
          </Reveal>
        </div>
      </div>
      <TaskFormModal
        open={taskModal}
        onClose={() => setTaskModal(false)}
        editing={editingTask}
      />
      <SessionFormModal
        open={sessionModal}
        onClose={() => setSessionModal(false)}
        defaultDate={selectedDay}
      />
      <SubjectFormModal
        open={subjectModal}
        onClose={() => setSubjectModal(false)}
      />
      <ResourceFormModal
        open={resourceModal}
        onClose={() => setResourceModal(false)}
      />
    </>
  );
}
