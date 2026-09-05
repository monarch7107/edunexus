"use client";
import { useState } from "react";
import { BookOpen, Pencil, Trash2, ArrowUpRight } from "lucide-react";
import type { Subject, Task } from "@/lib/types";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useApp } from "@/components/providers/app-data";
import { cn, dueState } from "@/lib/utils";
export function SubjectCard({
  subject,
  tasks,
  onEdit,
  onSelect,
  selected = false,
}: {
  subject: Subject;
  tasks: Task[];
  onEdit: () => void;
  onSelect?: () => void;
  selected?: boolean;
}) {
  const { deleteSubject } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const related = tasks.filter((t) => t.subject_id === subject.id);
  const done = related.filter((t) => t.status === "completed").length;
  const overdue = related.filter(
    (t) => t.status === "pending" && dueState(t.due_date) === "overdue",
  ).length;
  const pct = related.length ? (done / related.length) * 100 : 0;
  return (
    <div
      className={cn(
        "card card-interactive relative h-full overflow-hidden p-5",
        selected && "!border-brand-500 !bg-brand-50/40",
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: subject.color }}
      />
      <div className="mb-4 flex items-center justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${subject.color}18` }}
        >
          <BookOpen
            className="h-[19px] w-[19px]"
            style={{ color: subject.color }}
          />
        </span>
        <div className="flex gap-0.5">
          <button
            onClick={onEdit}
            aria-label={`Edit ${subject.name}`}
            className="icon-button h-7 w-7"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            aria-label={`Delete ${subject.name}`}
            className="icon-button h-7 w-7 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-muted">
        {subject.code || "Your subject"}
      </p>
      <button
        onClick={onSelect || onEdit}
        className="group flex w-full items-start justify-between gap-2 text-left"
      >
        <h3 className="text-[15px] font-bold leading-snug tracking-tight">
          {subject.name}
        </h3>
        <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </button>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-[10px] text-muted">
          <span>
            {done} of {related.length} tasks complete
          </span>
          <span className="font-semibold text-ink">{Math.round(pct)}%</span>
        </div>
        <ProgressBar
          value={pct}
          color={subject.color}
          label={`${subject.name} task completion`}
        />
        <div className="mt-3 flex items-center justify-between text-[9px] text-muted">
          <span>{related.length - done} tasks remaining</span>
          {overdue > 0 && (
            <span className="text-red-600">{overdue} overdue</span>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteSubject(subject.id)}
        title="Delete this subject?"
        message={`“${subject.name}” will be removed. Your tasks, study sessions, and resources will be kept, just unlinked from this subject.`}
      />
    </div>
  );
}
