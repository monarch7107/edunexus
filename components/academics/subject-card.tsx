"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Subject, Task } from "@/lib/types";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useApp } from "@/components/providers/app-data";

export function SubjectCard({
  subject,
  tasks,
  onEdit,
}: {
  subject: Subject;
  tasks: Task[];
  onEdit: () => void;
}) {
  const { deleteSubject } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const subjectTasks = tasks.filter((t) => t.subject_id === subject.id);
  const done = subjectTasks.filter((t) => t.status === "completed").length;
  const pct = subjectTasks.length ? (done / subjectTasks.length) * 100 : 0;

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="h-9 w-9 shrink-0 rounded-lg"
            style={{ backgroundColor: `${subject.color}22`, border: `1px solid ${subject.color}55` }}
            aria-hidden
          >
            <span
              className="mx-auto mt-2 block h-5 w-5 rounded"
              style={{ backgroundColor: subject.color }}
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {subject.name}
            </p>
            {subject.code && (
              <p className="text-xs text-slate-500">{subject.code}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onEdit}
            aria-label={`Edit ${subject.name}`}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            aria-label={`Delete ${subject.name}`}
            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>
            {done}/{subjectTasks.length} tasks done
          </span>
          <span>{Math.round(pct)}%</span>
        </div>
        <ProgressBar
          value={pct}
          barClassName="bg-slate-700"
          className="bg-slate-100"
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteSubject(subject.id)}
        title="Delete subject?"
        message={`"${subject.name}" will be removed. Its tasks, study sessions and resources will be kept but unlinked from the subject.`}
      />
    </div>
  );
}
