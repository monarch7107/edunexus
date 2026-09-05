"use client";

import { dueBadge } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/types";

export function DeadlineBadge({
  task,
}: {
  task: Pick<Task, "due_date" | "status">;
}) {
  if (task.status === "completed") {
    return <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>;
  }
  const { label, className } = dueBadge(task.due_date);
  return <Badge className={className}>{label}</Badge>;
}
