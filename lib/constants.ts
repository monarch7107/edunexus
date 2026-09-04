import type { TaskPriority, TaskType } from "./types";

export const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "assignment", label: "Assignment" },
  { value: "exam", label: "Exam" },
  { value: "project", label: "Project" },
  { value: "reading", label: "Reading" },
  { value: "other", label: "Other" },
];

export const TASK_PRIORITIES: {
  value: TaskPriority;
  label: string;
  color: string;
  bg: string;
}[] = [
  { value: "high", label: "High", color: "text-red-700", bg: "bg-red-100" },
  { value: "medium", label: "Medium", color: "text-amber-700", bg: "bg-amber-100" },
  { value: "low", label: "Low", color: "text-emerald-700", bg: "bg-emerald-100" },
];

export const SUBJECT_COLORS = [
  "#3b62f6", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
];

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  assignment: "Assignment",
  exam: "Exam",
  project: "Project",
  reading: "Reading",
  other: "Other",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const APP_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/academics", label: "Academics", icon: "book-open" },
  { href: "/planner", label: "Planner", icon: "calendar-days" },
  { href: "/learning", label: "Learning", icon: "bookmark" },
  { href: "/insights", label: "Insights", icon: "bar-chart-3" },
  { href: "/profile", label: "Profile", icon: "user-round" },
] as const;
