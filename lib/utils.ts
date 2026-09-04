import { clsx, type ClassValue } from "clsx";
import { TASK_PRIORITIES, TASK_TYPE_LABEL } from "./constants";
import type { Task, TaskPriority } from "./types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Local yyyy-mm-dd for a Date (for <input type="date"> and day comparisons). */
export function toDateInput(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a stored due_date (date or datetime) to a local yyyy-mm-dd key. */
export function dayKey(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return toDateInput(d);
}

export function todayKey(): string {
  return toDateInput(new Date());
}

export type DueState = "overdue" | "today" | "tomorrow" | "this-week" | "later" | "none";

export function dueState(due: string | null): DueState {
  const key = dayKey(due);
  if (!key) return "none";
  const today = todayKey();
  if (key < today) return "overdue";
  if (key === today) return "today";
  const t = new Date();
  const tomorrow = toDateInput(new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1));
  if (key === tomorrow) return "tomorrow";
  const in7 = toDateInput(new Date(t.getFullYear(), t.getMonth(), t.getDate() + 7));
  if (key <= in7) return "this-week";
  return "later";
}

export function formatDue(due: string | null): string {
  const key = dayKey(due);
  if (!key) return "No due date";
  const d = new Date(key + "T12:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function dueBadge(due: string | null): { label: string; className: string } {
  switch (dueState(due)) {
    case "overdue":
      return { label: "Overdue", className: "bg-red-100 text-red-700" };
    case "today":
      return { label: "Due today", className: "bg-red-50 text-red-600 ring-1 ring-red-200" };
    case "tomorrow":
      return { label: "Due tomorrow", className: "bg-amber-100 text-amber-700" };
    case "this-week":
      return { label: "This week", className: "bg-sky-100 text-sky-700" };
    default:
      return { label: formatDue(due), className: "bg-slate-100 text-slate-600" };
  }
}

export function priorityStyle(p: TaskPriority) {
  return TASK_PRIORITIES.find((x) => x.value === p) ?? TASK_PRIORITIES[1];
}

export function taskTypeLabel(t: Task["task_type"]): string {
  return TASK_TYPE_LABEL[t] ?? "Other";
}

export function minutesToLabel(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Deterministic rule-based study priority — the AI fallback (spec §14). */
export function rankTasks(tasks: Task[]): Task[] {
  const rank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
  return [...tasks]
    .filter((t) => t.status === "pending")
    .sort((a, b) => {
      const sa = dueState(a.due_date);
      const sb = dueState(b.due_date);
      // 1) overdue first
      const ao = sa === "overdue" ? 0 : 1;
      const bo = sb === "overdue" ? 0 : 1;
      if (ao !== bo) return ao - bo;
      // 2) nearest deadline (no-deadline sinks to bottom)
      const da = a.due_date ? String(a.due_date) : "9999";
      const db = b.due_date ? String(b.due_date) : "9999";
      if (da !== db) return da < db ? -1 : 1;
      // 3) higher priority
      return rank[a.priority] - rank[b.priority];
    });
}
