/**
 * Deterministic schedule analysis.
 *
 * Two jobs:
 *  1. Produce `findings` — conflicts and coverage gaps computed from real
 *     rows. These are facts, not model output, and they anchor the prompt
 *     so the LLM has evidence instead of an invitation to invent.
 *  2. Produce a rule-based plan used verbatim when the AI is unavailable.
 *
 * Prioritization order (spec §Fallback):
 *   overdue → due soon → upcoming exam → high priority → remaining workload
 */

import type { StudySession } from "../../types";
import { AI_LIMITS } from "../limits";
import type {
  AgentContext,
  AgentPlan,
  ProposedChange,
  ScheduleFinding,
} from "../types";

/** yyyy-mm-dd arithmetic that never crosses a timezone boundary. */
export function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
  date.setDate(date.getDate() + delta);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const a = Date.UTC(fy, (fm ?? 1) - 1, fd ?? 1);
  const b = Date.UTC(ty, (tm ?? 1) - 1, td ?? 1);
  return Math.round((b - a) / 86400000);
}

/** Local calendar day for a stored due_date (date or datetime). */
export function dueDay(value: string | null): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

/**
 * Rank pending tasks: overdue first, then nearest deadline, then exams,
 * then priority. Mirrors the V1 ordering students already see.
 */
export function rankPendingTasks(tasks: AgentContext["tasks"], today: string) {
  return tasks
    .filter((t) => t.status === "pending")
    .map((t) => {
      const day = dueDay(t.due_date);
      const distance = day ? daysBetween(today, day) : Number.POSITIVE_INFINITY;
      return { task: t, day, distance };
    })
    .sort((a, b) => {
      const aOverdue = a.distance < 0 ? 0 : 1;
      const bOverdue = b.distance < 0 ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      if (a.distance !== b.distance) return a.distance - b.distance;
      const aExam = a.task.task_type === "exam" ? 0 : 1;
      const bExam = b.task.task_type === "exam" ? 0 : 1;
      if (aExam !== bExam) return aExam - bExam;
      return (
        (PRIORITY_RANK[a.task.priority] ?? 1) - (PRIORITY_RANK[b.task.priority] ?? 1)
      );
    });
}

export function minutesByDay(
  sessions: Pick<StudySession, "planned_date" | "duration_minutes" | "status">[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (s.status === "completed") continue;
    map.set(s.planned_date, (map.get(s.planned_date) ?? 0) + s.duration_minutes);
  }
  return map;
}

/**
 * Compute conflicts and coverage gaps. Every finding cites real data —
 * if the data doesn't support a claim, no finding is produced.
 */
export function analyzeSchedule(input: {
  today: string;
  tasks: AgentContext["tasks"];
  sessions: AgentContext["sessions"];
  subjects: AgentContext["subjects"];
}): ScheduleFinding[] {
  const { today, tasks, sessions, subjects } = input;
  const findings: ScheduleFinding[] = [];
  const subjectName = new Map(subjects.map((s) => [s.id, s.code || s.name]));
  const perDay = minutesByDay(sessions);

  // 1. Overloaded days — more planned study than a person can sustain.
  for (const [day, minutes] of [...perDay.entries()].sort()) {
    if (day < today) continue;
    if (minutes > AI_LIMITS.MAX_DAILY_MINUTES) {
      findings.push({
        kind: "overloaded_day",
        date: day,
        detail: `${day} has ${minutes} minutes of study already planned, beyond a sustainable day.`,
      });
    }
  }

  const ranked = rankPendingTasks(tasks, today);
  const horizonEnd = addDays(today, 14);

  // Sessions already covering a subject before a given day.
  const coverage = (subjectId: string | null, byDay: string) =>
    sessions.filter(
      (s) =>
        s.status !== "completed" &&
        s.planned_date >= today &&
        s.planned_date <= byDay &&
        (subjectId === null || s.subject_id === subjectId),
    );

  for (const { task, day, distance } of ranked) {
    // 2. Overdue work.
    if (day && distance < 0) {
      findings.push({
        kind: "overdue_task",
        date: day,
        subject_id: task.subject_id,
        detail: `“${task.title}” was due ${day} and is still pending.`,
      });
      continue;
    }
    if (!day || day > horizonEnd) continue;

    // 3. Upcoming exams with no revision booked.
    const covering = coverage(task.subject_id, day);
    if (task.task_type === "exam" && covering.length === 0) {
      findings.push({
        kind: "uncovered_exam",
        date: day,
        subject_id: task.subject_id,
        detail: `Exam “${task.title}”${
          task.subject_id ? ` (${subjectName.get(task.subject_id) ?? "subject"})` : ""
        } is on ${day} with no revision session planned before it.`,
      });
    } else if (
      task.task_type !== "exam" &&
      task.priority === "high" &&
      covering.length === 0
    ) {
      // 4. High-priority deliverables with no study time booked.
      findings.push({
        kind: "uncovered_task",
        date: day,
        subject_id: task.subject_id,
        detail: `High-priority “${task.title}” is due ${day} with no study time booked.`,
      });
    }
  }

  // 5. Completely empty days immediately before a deadline cluster.
  const deadlineDays = new Set(
    ranked
      .map((r) => r.day)
      .filter((d): d is string => Boolean(d) && d! >= today && d! <= horizonEnd),
  );
  for (const deadline of [...deadlineDays].sort()) {
    const prior = addDays(deadline, -1);
    if (prior < today) continue;
    if (!perDay.has(prior) && !perDay.has(deadline)) {
      findings.push({
        kind: "empty_day_before_deadline",
        date: prior,
        detail: `${prior} is free, the day before a ${deadline} deadline.`,
      });
    }
  }

  return findings.slice(0, 12);
}

/** Preferred study slot lengths by task type. */
function durationFor(taskType: string, priority: string): number {
  if (taskType === "exam") return 90;
  if (priority === "high") return 60;
  return 45;
}

/**
 * Deterministic planner. Used when the provider is unavailable or its
 * output is unusable. Produces the SAME structured shape as the AI path so
 * the rest of the pipeline is identical — only `source` differs.
 */
export function buildFallbackPlan(context: AgentContext): AgentPlan {
  const { today, tasks, sessions, subjects } = context;
  const subjectName = new Map(subjects.map((s) => [s.id, s.code || s.name]));
  const ranked = rankPendingTasks(tasks, today);
  const perDay = minutesByDay(sessions);
  const changes: ProposedChange[] = [];
  const evidence: string[] = [];

  const dayLoad = new Map(perDay);
  const capacityLeft = (day: string) =>
    AI_LIMITS.MAX_DAILY_MINUTES - (dayLoad.get(day) ?? 0);

  /** First day at/after `from` (and before `before`) with room to study. */
  function findSlot(from: string, before: string | null, minutes: number): string | null {
    let day = from < today ? today : from;
    for (let i = 0; i < AI_LIMITS.MAX_SCHEDULE_HORIZON_DAYS; i += 1) {
      if (before && day > before) return null;
      if (capacityLeft(day) >= minutes) return day;
      day = addDays(day, 1);
    }
    return null;
  }

  for (const { task, day, distance } of ranked) {
    if (changes.length >= AI_LIMITS.MAX_PROPOSED_CHANGES) break;
    // Only schedule work that is dated and inside a useful horizon.
    if (!day) continue;
    if (distance > 14) continue;

    const subjectLabel = task.subject_id
      ? subjectName.get(task.subject_id) ?? "your subject"
      : "General";
    const covering = sessions.filter(
      (s) =>
        s.status !== "completed" &&
        s.planned_date >= today &&
        s.planned_date <= day &&
        s.subject_id === task.subject_id,
    );
    if (covering.length > 0) continue;

    const minutes = durationFor(task.task_type, task.priority);
    // Exams get revision the day before where possible; overdue work today.
    const preferredStart =
      distance < 0 ? today : task.task_type === "exam" ? addDays(day, -1) : today;
    const slot = findSlot(preferredStart, day, minutes);
    if (!slot) continue;

    dayLoad.set(slot, (dayLoad.get(slot) ?? 0) + minutes);
    const kind = task.task_type === "exam" ? "revision" : "study";
    changes.push({
      operation: "create",
      entity: "study_session",
      entity_id: null,
      payload: {
        subject_id: task.subject_id,
        title: `${subjectLabel} ${kind}: ${task.title}`.slice(0, 160),
        planned_date: slot,
        duration_minutes: minutes,
      },
      reason:
        distance < 0
          ? `“${task.title}” is overdue — this books time to clear it.`
          : task.task_type === "exam"
            ? `Revision before the ${day} exam “${task.title}”.`
            : `Study time before “${task.title}” is due on ${day}.`,
    });
    evidence.push(
      distance < 0
        ? `“${task.title}” was due ${day} and is still pending.`
        : `“${task.title}” is due ${day} with no study session covering ${subjectLabel}.`,
    );
  }

  const summary = changes.length
    ? `Booked ${changes.length} study ${
        changes.length === 1 ? "session" : "sessions"
      } against your nearest deadlines, starting with anything overdue.`
    : ranked.length === 0
      ? "You have no pending tasks with deadlines, so there is nothing to reschedule right now."
      : "Your upcoming deadlines already have study sessions covering them — no changes needed.";

  return {
    source: "fallback",
    summary,
    evidence: evidence.slice(0, 8),
    changes,
  };
}
