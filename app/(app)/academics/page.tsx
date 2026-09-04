"use client";

import { useMemo, useState } from "react";
import { BookOpen, ListChecks, Plus } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { SubjectCard } from "@/components/academics/subject-card";
import { SubjectFormModal } from "@/components/academics/subject-form-modal";
import { TaskCard } from "@/components/academics/task-card";
import { TaskFormModal } from "@/components/academics/task-form-modal";
import { TaskFilters, type TaskFilterState } from "@/components/academics/task-filters";
import { useApp } from "@/components/providers/app-data";
import type { Subject, Task } from "@/lib/types";

export default function AcademicsPage() {
  const { subjects, tasks, loading } = useApp();
  const [subjectModal, setSubjectModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<TaskFilterState>({
    search: "",
    subjectId: "",
    status: "",
  });

  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects]
  );

  const filteredTasks = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return tasks
      .filter((t) => (filters.subjectId ? t.subject_id === filters.subjectId : true))
      .filter((t) => (filters.status ? t.status === filters.status : true))
      .filter((t) =>
        q
          ? t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q)
          : true
      )
      .sort((a, b) => {
        // pending first, then by due date
        if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
        const da = a.due_date ?? "9999";
        const db = b.due_date ?? "9999";
        return da < db ? -1 : da > db ? 1 : 0;
      });
  }, [tasks, filters]);

  if (loading) return <LoadingState label="Loading your academics…" />;

  return (
    <>
      <PageHeader
        title="Academics"
        description="Manage your subjects and every task tied to them."
        action={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingSubject(null);
                setSubjectModal(true);
              }}
            >
              <Plus className="h-4 w-4" /> Subject
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingTask(null);
                setTaskModal(true);
              }}
            >
              <Plus className="h-4 w-4" /> Task
            </Button>
          </>
        }
      />

      {/* Subjects */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Your subjects ({subjects.length})
        </h2>
        {subjects.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-8 w-8" />}
            title="No subjects yet"
            description="Add your current subjects first — tasks, study sessions and resources attach to them."
            action={
              <Button
                size="sm"
                onClick={() => {
                  setEditingSubject(null);
                  setSubjectModal(true);
                }}
              >
                <Plus className="h-4 w-4" /> Add your first subject
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <SubjectCard
                key={s.id}
                subject={s}
                tasks={tasks}
                onEdit={() => {
                  setEditingSubject(s);
                  setSubjectModal(true);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Tasks */}
      <section className="mt-8">
        <Card>
          <CardHeader
            title={`Tasks (${filteredTasks.length})`}
            icon={<ListChecks className="h-4 w-4 text-brand-600" />}
          />
          <div className="mb-4">
            <TaskFilters filters={filters} onChange={setFilters} subjects={subjects} />
          </div>

          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="h-8 w-8" />}
              title={tasks.length === 0 ? "No tasks yet" : "No tasks match your filters"}
              description={
                tasks.length === 0
                  ? "Add assignments, exams, projects and readings — set deadlines and priorities."
                  : "Try clearing the search or filters."
              }
              action={
                tasks.length === 0 ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingTask(null);
                      setTaskModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4" /> Add your first task
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((t) => (
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
      </section>

      <SubjectFormModal
        open={subjectModal}
        onClose={() => setSubjectModal(false)}
        editing={editingSubject}
      />
      <TaskFormModal
        open={taskModal}
        onClose={() => setTaskModal(false)}
        editing={editingTask}
      />
    </>
  );
}
