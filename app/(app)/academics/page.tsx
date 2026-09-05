"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCheck,
  ListTodo,
  Plus,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { AnimatedList, Reveal } from "@/components/ui/motion";
import { SubjectCard } from "@/components/academics/subject-card";
import { SubjectFormModal } from "@/components/academics/subject-form-modal";
import { TaskCard } from "@/components/academics/task-card";
import { TaskFormModal } from "@/components/academics/task-form-modal";
import {
  TaskFilters,
  type TaskFilterState,
} from "@/components/academics/task-filters";
import { useApp } from "@/components/providers/app-data";
import { dueState, cn } from "@/lib/utils";
import type { Subject, Task } from "@/lib/types";
const EMPTY_FILTERS: TaskFilterState = {
  search: "",
  subjectId: "",
  status: "",
  priority: "",
};
export default function AcademicsPage() {
  const { subjects, tasks, loading } = useApp();
  const query = useSearchParams();
  const [subjectModal, setSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [taskModal, setTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<TaskFilterState>(EMPTY_FILTERS);
  useEffect(() => {
    setFilters({
      search: query.get("search") || "",
      subjectId: query.get("subject") || "",
      status: query.get("status") || "",
      priority: "",
    });
  }, [query]);
  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );
  const filteredTasks = useMemo(() => {
    const q = filters.search.toLowerCase().trim();
    return tasks
      .filter((t) => !filters.subjectId || t.subject_id === filters.subjectId)
      .filter(
        (t) =>
          !filters.status ||
          (filters.status === "overdue"
            ? t.status === "pending" && dueState(t.due_date) === "overdue"
            : t.status === filters.status),
      )
      .filter((t) => !filters.priority || t.priority === filters.priority)
      .filter(
        (t) => !q || `${t.title} ${t.description}`.toLowerCase().includes(q),
      )
      .sort((a, b) =>
        a.status !== b.status
          ? a.status === "pending"
            ? -1
            : 1
          : (a.due_date || "9999").localeCompare(b.due_date || "9999"),
      );
  }, [tasks, filters]);
  const completed = tasks.filter((t) => t.status === "completed").length;
  const overdue = tasks.filter(
    (t) => t.status === "pending" && dueState(t.due_date) === "overdue",
  ).length;
  const addSubject = () => {
    setEditingSubject(null);
    setSubjectModal(true);
  };
  const addTask = () => {
    setEditingTask(null);
    setTaskModal(true);
  };
  if (loading) return <LoadingState label="Getting your academics ready…" />;
  return (
    <>
      <PageHeader
        eyebrow="A place for every moving part"
        title="Your academics, in order."
        description="Bring your subjects together. Turn your to-dos into done."
        action={
          <>
            <Button variant="outline" onClick={addSubject}>
              <Plus className="h-3.5 w-3.5" /> Add subject
            </Button>
            <Button onClick={addTask}>
              <Plus className="h-3.5 w-3.5" /> Add task
            </Button>
          </>
        }
      />
      <div className="mb-7 flex flex-wrap gap-x-6 gap-y-2 border-b border-line pb-5 text-[11px] text-muted">
        <span className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-brand-600" />
          <strong className="text-ink">{subjects.length}</strong> subjects
        </span>
        <span className="flex items-center gap-2">
          <ListTodo className="h-3.5 w-3.5 text-amber-700" />
          <strong className="text-ink">{tasks.length - completed}</strong> tasks
          to do
        </span>
        <span className="flex items-center gap-2">
          <CheckCheck className="h-3.5 w-3.5 text-brand-600" />
          <strong className="text-ink">{completed}</strong> small wins
        </span>
        <span className="ml-auto hidden text-[10px] italic sm:inline">
          A little structure. A lot less stress.
        </span>
      </div>
      <section aria-labelledby="subjects-heading" className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="subjects-heading" className="section-title">
            Your subjects{" "}
            <span className="ml-1.5 font-sans text-xs font-normal text-muted">
              {subjects.length}
            </span>
          </h2>
          {filters.subjectId && (
            <button
              className="text-link text-[10px]"
              onClick={() => setFilters((f) => ({ ...f, subjectId: "" }))}
            >
              <X className="h-3 w-3" /> Clear subject selection
            </button>
          )}
        </div>
        {!subjects.length ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title="Every great semester starts somewhere."
            description="Add your first subject to connect your assignments, study sessions, and learning resources."
            action={
              <Button onClick={addSubject} size="sm">
                <Plus className="h-3.5 w-3.5" /> Add your first subject
              </Button>
            }
          />
        ) : (
          <AnimatedList
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            itemClassName="h-full"
          >
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                tasks={tasks}
                selected={filters.subjectId === subject.id}
                onSelect={() =>
                  setFilters((f) => ({
                    ...f,
                    subjectId: f.subjectId === subject.id ? "" : subject.id,
                  }))
                }
                onEdit={() => {
                  setEditingSubject(subject);
                  setSubjectModal(true);
                }}
              />
            ))}
            <button
              key="add-subject"
              className="group flex h-full min-h-[205px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/30 p-5 text-muted transition-colors hover:border-brand-400 hover:bg-brand-50"
              onClick={addSubject}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface">
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              </span>
              <span className="text-xs font-medium">
                Make room for a new subject
              </span>
              <span className="text-[10px]">Keep your semester connected</span>
            </button>
          </AnimatedList>
        )}
      </section>
      <Reveal>
        <Card id="tasks">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-title">From to-do to done</h2>
              <p className="mt-1 text-xs text-muted">
                {filters.subjectId
                  ? `Tasks for ${subjectMap.get(filters.subjectId)?.name || "your selected subject"}`
                  : "All your assignments, exams, and next steps."}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="!text-brand-600"
              onClick={addTask}
            >
              <Plus className="h-3.5 w-3.5" /> New task
            </Button>
          </div>
          <div className="mb-5 flex flex-wrap gap-1 border-b border-line">
            {[
              { label: "All tasks", value: "", count: tasks.length },
              {
                label: "To do",
                value: "pending",
                count: tasks.length - completed,
              },
              { label: "Completed", value: "completed", count: completed },
              { label: "Overdue", value: "overdue", count: overdue },
            ].map((tab) => (
              <button
                key={tab.value}
                aria-pressed={filters.status === tab.value}
                onClick={() => setFilters((f) => ({ ...f, status: tab.value }))}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 pb-3 pt-1 text-[11px] font-medium transition-colors",
                  filters.status === tab.value
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-muted hover:text-ink",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px]",
                    filters.status === tab.value
                      ? "bg-brand-50"
                      : "bg-slate-100",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <TaskFilters
            filters={filters}
            onChange={setFilters}
            subjects={subjects}
          />
          <div className="mb-3 mt-5 flex items-center justify-between">
            <p
              role="status"
              aria-live="polite"
              className="text-[10px] text-muted"
            >
              {filteredTasks.length}{" "}
              {filteredTasks.length === 1 ? "task" : "tasks"}
              {Object.values(filters).some(Boolean)
                ? " matching your view"
                : " · Pending first, then nearest deadline"}
            </p>
            {Object.values(filters).some(Boolean) && (
              <button
                className="text-link text-[10px]"
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                Reset filters <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {filteredTasks.length ? (
            <AnimatedList className="space-y-2.5">
              {filteredTasks.map((task) => (
                <TaskCard
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
              icon={
                tasks.length ? (
                  <CheckCheck className="h-6 w-6" />
                ) : (
                  <ListTodo className="h-6 w-6" />
                )
              }
              title={
                tasks.length
                  ? "A clear view. Nothing here just yet."
                  : "What’s your next small step?"
              }
              description={
                tasks.length
                  ? "No tasks match this view. Try another subject, status, or keyword."
                  : "Add something you’re working toward. Set a deadline, choose a priority, and take it one step at a time."
              }
              action={
                <Button
                  size="sm"
                  variant={tasks.length ? "outline" : "primary"}
                  onClick={
                    tasks.length ? () => setFilters(EMPTY_FILTERS) : addTask
                  }
                >
                  {tasks.length ? "Show all tasks" : "Add your first task"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              }
            />
          )}
        </Card>
      </Reveal>
      <SubjectFormModal
        open={subjectModal}
        onClose={() => setSubjectModal(false)}
        editing={editingSubject}
      />
      <TaskFormModal
        open={taskModal}
        onClose={() => setTaskModal(false)}
        editing={editingTask}
        defaultSubjectId={filters.subjectId}
      />
    </>
  );
}
