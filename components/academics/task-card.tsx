"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Subject, Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TaskStatusToggle } from "./task-status-toggle";
import { DeadlineBadge } from "./deadline-badge";
import { priorityStyle, taskTypeLabel, cn } from "@/lib/utils";
import { useApp } from "@/components/providers/app-data";

export function TaskCard({
  task,
  subject,
  onEdit,
}: {
  task: Task;
  subject?: Subject;
  onEdit: () => void;
}) {
  const { deleteTask } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const done = task.status === "completed";
  const pri = priorityStyle(task.priority);

  return (
    <div className="card flex items-start gap-3 p-4">
      <div className="pt-0.5">
        <TaskStatusToggle task={task} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "text-sm font-medium text-slate-900",
              done && "text-slate-400 line-through"
            )}
          >
            {task.title}
          </p>
          <Badge className={cn(pri.bg, pri.color)}>{pri.label} priority</Badge>
          <Badge className="bg-slate-100 text-slate-600">
            {taskTypeLabel(task.task_type)}
          </Badge>
        </div>

        {task.description && (
          <p
            className={cn(
              "mt-1 line-clamp-2 text-xs text-slate-500",
              done && "line-through"
            )}
          >
            {task.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {subject ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: subject.color }}
                aria-hidden
              />
              {subject.code || subject.name}
            </span>
          ) : (
            <span className="text-xs text-slate-400">No subject</span>
          )}
          <span aria-hidden className="text-slate-300">
            ·
          </span>
          <DeadlineBadge task={task} />
        </div>
      </div>

      <div className="flex shrink-0 gap-1">
        <button
          onClick={onEdit}
          aria-label={`Edit task ${task.title}`}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => setConfirmOpen(true)}
          aria-label={`Delete task ${task.title}`}
          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteTask(task.id)}
        title="Delete task?"
        message={`"${task.title}" will be permanently removed.`}
      />
    </div>
  );
}
