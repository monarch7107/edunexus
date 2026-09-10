/**
 * Live academic intelligence — deterministic, evidence-only.
 * Mirrors python/features/academic_features.py so the UI never depends on
 * an experimental sklearn model or FastAPI.
 */
import type { StudySession, Subject, Task } from "./types";
import { dayKey, dueState, todayKey } from "./utils";

export type WorkloadLabel = "manageable" | "heavy" | "overloaded";

export interface AcademicSignals {
  pendingTasks: number;
  overdueTasks: number;
  examTasks7d: number;
  highPriorityPending: number;
  completionRate: number;
  plannedMinutes7d: number;
  completedMinutes7d: number;
  sessionCompletionRate: number;
  activeSubjects: number;
  workload: WorkloadLabel;
  evidence: string[];
  subjectAttention: { id: string; name: string; reason: string }[];
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function computeAcademicSignals(
  subjects: Subject[],
  tasks: Task[],
  sessions: StudySession[],
): AcademicSignals {
  const today = todayKey();
  const horizon = addDays(today, 7);
  const pending = tasks.filter((t) => t.status === "pending");
  const completed = tasks.filter((t) => t.status === "completed");
  const overdue = pending.filter((t) => dueState(t.due_date) === "overdue");
  const exams = pending.filter((t) => {
    if (t.task_type !== "exam") return false;
    const d = dayKey(t.due_date);
    return Boolean(d && d >= today && d <= horizon);
  });
  const high = pending.filter((t) => t.priority === "high");
  const weekSessions = sessions.filter((s) => {
    const d = dayKey(s.planned_date);
    return Boolean(d && d >= today && d <= horizon);
  });
  const plannedMinutes = weekSessions.reduce((n, s) => n + s.duration_minutes, 0);
  const doneSessions = sessions.filter((s) => s.status === "completed");
  const completedMinutes = doneSessions.reduce((n, s) => n + s.duration_minutes, 0);
  const sessRate = sessions.length
    ? doneSessions.length / sessions.length
    : 0;
  const completionRate = tasks.length ? completed.length / tasks.length : 0;

  let workload: WorkloadLabel = "manageable";
  if (overdue.length >= 3 || (exams.length >= 2 && pending.length >= 6) || plannedMinutes > 20 * 60) {
    workload = "overloaded";
  } else if (overdue.length >= 1 || exams.length >= 1 || pending.length >= 5 || plannedMinutes > 10 * 60) {
    workload = "heavy";
  }

  const evidence: string[] = [];
  evidence.push(`${pending.length} pending task${pending.length === 1 ? "" : "s"}`);
  evidence.push(`${overdue.length} overdue`);
  evidence.push(`${exams.length} exam${exams.length === 1 ? "" : "s"} in the next 7 days`);
  evidence.push(`${weekSessions.length} planned session${weekSessions.length === 1 ? "" : "s"} this week`);

  const subjectAttention: AcademicSignals["subjectAttention"] = [];
  for (const subject of subjects) {
    const related = pending.filter((t) => t.subject_id === subject.id);
    const ov = related.filter((t) => dueState(t.due_date) === "overdue").length;
    const recentStudy = sessions.some(
      (s) => s.subject_id === subject.id && s.status === "completed",
    );
    if (ov > 0) {
      subjectAttention.push({
        id: subject.id,
        name: subject.name,
        reason: `${ov} overdue task${ov === 1 ? "" : "s"}`,
      });
    } else if (related.some((t) => t.task_type === "exam") && !recentStudy) {
      subjectAttention.push({
        id: subject.id,
        name: subject.name,
        reason: "Upcoming exam with no completed study session yet",
      });
    }
  }

  return {
    pendingTasks: pending.length,
    overdueTasks: overdue.length,
    examTasks7d: exams.length,
    highPriorityPending: high.length,
    completionRate,
    plannedMinutes7d: plannedMinutes,
    completedMinutes7d: completedMinutes,
    sessionCompletionRate: sessRate,
    activeSubjects: subjects.length,
    workload,
    evidence,
    subjectAttention: subjectAttention.slice(0, 3),
  };
}

export function workloadCopy(label: WorkloadLabel): { title: string; detail: string } {
  if (label === "overloaded") {
    return {
      title: "Overloaded",
      detail: "Several overdue items or a very dense plan. Protect time for the highest-risk work first.",
    };
  }
  if (label === "heavy") {
    return {
      title: "Heavy week",
      detail: "Deadlines or exams are close. A focused plan will help more than adding new work.",
    };
  }
  return {
    title: "Manageable",
    detail: "Based on pending tasks, exams, and planned study time currently in your workspace.",
  };
}
