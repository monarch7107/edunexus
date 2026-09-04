"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  ListChecks,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TaskCard } from "@/components/academics/task-card";
import { TaskFormModal } from "@/components/academics/task-form-modal";
import { SessionFormModal } from "@/components/planner/session-form-modal";
import { SubjectFormModal } from "@/components/academics/subject-form-modal";
import { ResourceFormModal } from "@/components/learning/resource-form-modal";
import { StudySessionCard } from "@/components/planner/study-session-card";
import { AiRecommendationCard } from "@/components/dashboard/ai-recommendation-card";
import { useApp } from "@/components/providers/app-data";
import {
  dayKey,
  dueState,
  greeting,
  minutesToLabel,
  rankTasks,
  todayKey,
} from "@/lib/utils";
import type { Task as TaskModel } from "@/lib/types";

export default function DashboardPage() {
  const { profile, subjects, tasks, sessions, resources, loading } = useApp();
  const [taskModal, setTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskModel | null>(null);
  const [sessionModal, setSessionModal] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [resourceModal, setResourceModal] = useState(false);

  const openNewTask = () => {
    setEditingTask(null);
    setTaskModal(true);
  };

  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects]
  );

  const stats = useMemo(() => {
    const pending = tasks.filter((t) => t.status === "pending");
    const completed = tasks.length - pending.length;
    const overdue = pending.filter((t) => dueState(t.due_date) === "overdue");
    const dueToday = pending.filter((t) => dueState(t.due_date) === "today");
    const upcoming = rankTasks(pending).slice(0, 5);
    const tk = todayKey();
    const todaysSessions = sessions
      .filter((s) => s.status === "planned" && dayKey(s.planned_date) === tk)
      .sort((a, b) => a.planned_date.localeCompare(b.planned_date));
    const studyMinutes = sessions
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.duration_minutes, 0);
    const completionPct = tasks.length
      ? Math.round((completed / tasks.length) * 100)
      : 0;
    return {
      pending: pending.length,
      completed,
      overdue,
      dueToday,
      upcoming,
      todaysSessions,
      studyMinutes,
      completionPct,
    };
  }, [tasks, sessions]);

  if (loading) return <LoadingState label="Loading your dashboard…" />;

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const hasData = subjects.length > 0 || tasks.length > 0;

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={
          stats.overdue.length > 0
            ? `You have ${stats.overdue.length} overdue task${stats.overdue.length > 1 ? "s" : ""} and ${stats.dueToday.length} due today.`
            : stats.dueToday.length > 0
              ? `You have ${stats.dueToday.length} task${stats.dueToday.length > 1 ? "s" : ""} due today — you've got this.`
              : "Here's your academic day at a glance."
        }
        action={
          <div className="hidden gap-2 sm:flex">
            <Button size="sm" onClick={openNewTask}>
              <Plus className="h-4 w-4" /> Task
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSessionModal(true)}>
              <Plus className="h-4 w-4" /> Study session
            </Button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <ListChecks className="h-4 w-4" /> Pending
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.pending}</p>
          <p className="text-xs text-slate-500">tasks to complete</p>
        </Card>
        <Card className={stats.overdue.length ? "border-red-200 bg-red-50/50" : ""}>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <AlertTriangle className="h-4 w-4 text-red-500" /> Overdue
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {stats.overdue.length}
          </p>
          <p className="text-xs text-slate-500">needs attention</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Completed
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {stats.completed}
          </p>
          <p className="text-xs text-slate-500">{stats.completionPct}% of all tasks</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Clock className="h-4 w-4 text-brand-600" /> Study time
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {minutesToLabel(stats.studyMinutes)}
          </p>
          <p className="text-xs text-slate-500">sessions completed</p>
        </Card>
      </div>

      {!hasData ? (
        <div className="mt-6">
          <EmptyState
            icon={<CalendarDays className="h-10 w-10" />}
            title="Let's build your workspace"
            description="Add your subjects first, then tasks with deadlines, plan study sessions, and save learning resources."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={() => setSubjectModal(true)}>
                  <Plus className="h-4 w-4" /> Add subjects
                </Button>
                <Button size="sm" variant="outline" onClick={openNewTask}>
                  <Plus className="h-4 w-4" /> Add a task
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSessionModal(true)}>
                  <Plus className="h-4 w-4" /> Plan study
                </Button>
                <Button size="sm" variant="outline" onClick={() => setResourceModal(true)}>
                  <Plus className="h-4 w-4" /> Save resource
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Left column: work */}
          <div className="space-y-6 lg:col-span-2">
            {/* Overdue alert */}
            {stats.overdue.length > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    {stats.overdue.length} overdue task{stats.overdue.length > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-red-700">
                    {stats.overdue.slice(0, 3).map((t) => t.title).join(", ")}
                    {stats.overdue.length > 3 ? "…" : ""}
                  </p>
                </div>
              </div>
            )}

            <Card>
              <CardHeader
                title="Priority tasks"
                icon={<ListChecks className="h-4 w-4 text-brand-600" />}
                action={
                  <Link
                    href="/academics"
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-brand-600 hover:underline"
                  >
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              {stats.upcoming.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  All caught up 🎉 Add new tasks from the Academics page.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.upcoming.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      subject={t.subject_id ? subjectMap.get(t.subject_id) : undefined}
                      onEdit={() => {
                        setEditingTask(t);
                        setTaskModal(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Today's study sessions"
                icon={<CalendarDays className="h-4 w-4 text-brand-600" />}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSessionModal(true)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Plan
                  </Button>
                }
              />
              {stats.todaysSessions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  Nothing planned for today. Even a 30-minute session helps.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.todaysSessions.map((s) => (
                    <StudySessionCard key={s.id} session={s} subject={s.subject_id ? subjectMap.get(s.subject_id) : undefined} />
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right column: AI + progress */}
          <div className="space-y-6">
            <AiRecommendationCard />

            <Card>
              <CardHeader
                title="Subject progress"
                action={
                  <Link
                    href="/academics"
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    Manage
                  </Link>
                }
              />
              {subjects.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Add subjects to see progress here.
                </p>
              ) : (
                <ul className="space-y-3">
                  {subjects.slice(0, 6).map((s) => {
                    const st = tasks.filter((t) => t.subject_id === s.id);
                    const done = st.filter((t) => t.status === "completed").length;
                    const pct = st.length ? (done / st.length) * 100 : 0;
                    return (
                      <li key={s.id}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-medium text-slate-700">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: s.color }}
                              aria-hidden
                            />
                            {s.code || s.name}
                          </span>
                          <span className="text-slate-500">
                            {done}/{st.length} · {Math.round(pct)}%
                          </span>
                        </div>
                        <ProgressBar
                          value={pct}
                          barClassName="bg-slate-700"
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Quick actions" />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={openNewTask}>
                  <Plus className="h-3.5 w-3.5" /> Task
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSessionModal(true)}>
                  <Plus className="h-3.5 w-3.5" /> Session
                </Button>
                <Button variant="outline" size="sm" onClick={() => setResourceModal(true)}>
                  <Plus className="h-3.5 w-3.5" /> Resource
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSubjectModal(true)}>
                  <Plus className="h-3.5 w-3.5" /> Subject
                </Button>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                {resources.length} resource{resources.length === 1 ? "" : "s"} saved
              </p>
            </Card>
          </div>
        </div>
      )}

      <TaskFormModal
        open={taskModal}
        onClose={() => setTaskModal(false)}
        editing={editingTask}
      />
      <SessionFormModal
        open={sessionModal}
        onClose={() => setSessionModal(false)}
      />
      <SubjectFormModal
        open={subjectModal}
        onClose={() => setSubjectModal(false)}
        editing={null}
      />
      <ResourceFormModal
        open={resourceModal}
        onClose={() => setResourceModal(false)}
      />
    </>
  );
}
