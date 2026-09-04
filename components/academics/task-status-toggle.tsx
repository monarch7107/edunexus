"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { useApp } from "@/components/providers/app-data";

export function TaskStatusToggle({ task }: { task: Task }) {
  const { setTaskStatus } = useApp();
  const done = task.status === "completed";

  return (
    <button
      onClick={() => setTaskStatus(task.id, !done)}
      aria-pressed={done}
      aria-label={done ? `Mark "${task.title}" as pending` : `Mark "${task.title}" as complete`}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
        done
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-slate-300 bg-white hover:border-brand-500 hover:bg-brand-50"
      )}
    >
      {done && <Check className="h-3.5 w-3.5" aria-hidden />}
    </button>
  );
}
