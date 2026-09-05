"use client";
import { useState } from "react";
import { Pencil, Trash2, Flag, CalendarDays } from "lucide-react";
import type { Subject, Task } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TaskStatusToggle } from "./task-status-toggle";
import {
  priorityStyle,
  taskTypeLabel,
  cn,
  dueState,
  formatDue,
} from "@/lib/utils";
import { useApp } from "@/components/providers/app-data";
export function TaskCard({
  task,
  subject,
  onEdit,
  compact = false,
}: {
  task: Task;
  subject?: Subject;
  onEdit: () => void;
  compact?: boolean;
}) {
  const { deleteTask } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const done = task.status === "completed";
  const priority = priorityStyle(task.priority);
  const due = dueState(task.due_date);
  const urgent = !done && due === "overdue";
  return (
    <div
      className={cn(
        "task-row group",
        compact && "!px-3.5 !py-3.5",
        urgent && "!border-l-[3px] !border-l-red-400",
      )}
      data-completed={done}
    >
      <div className="pt-0.5">
        <TaskStatusToggle task={task} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
          <button
            className={cn(
              "min-w-0 max-w-full break-words text-left text-[12px] font-semibold leading-relaxed transition-colors hover:text-brand-600 sm:text-[13px]",
              done && "text-muted line-through",
            )}
            onClick={onEdit}
          >
            {task.title}
          </button>
          {!compact && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-muted">
              {taskTypeLabel(task.task_type)}
            </span>
          )}
        </div>
        {task.description && !compact && (
          <p
            className={cn(
              "mt-1 line-clamp-2 text-xs leading-relaxed text-muted",
              done && "line-through",
            )}
          >
            {task.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{
                backgroundColor: subject?.color || "rgb(var(--slate-300))",
              }}
            />
            {subject?.code || subject?.name || "Personal"}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1",
              urgent
                ? "text-red-600"
                : !done && due === "today"
                  ? "text-amber-700"
                  : "",
            )}
          >
            {!done && <CalendarDays className="h-2.5 w-2.5" />}
            {done
              ? "Completed"
              : due === "overdue"
                ? `Overdue · ${formatDue(task.due_date)}`
                : due === "today"
                  ? "Due today"
                  : due === "tomorrow"
                    ? "Due tomorrow"
                    : formatDue(task.due_date)}
          </span>
          {!done && (
            <span
              className={cn("inline-flex items-center gap-1", priority.color)}
            >
              <Flag className="h-2.5 w-2.5" />
              {priority.label}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-0.5 sm:flex-row">
        <button
          onClick={onEdit}
          aria-label={`Edit task ${task.title}`}
          className="icon-button h-7 w-7"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={() => setConfirmOpen(true)}
          aria-label={`Delete task ${task.title}`}
          className="icon-button h-7 w-7 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteTask(task.id)}
        title="Delete this task?"
        message={`“${task.title}” will be permanently removed. This can’t be undone.`}
      />
    </div>
  );
}
