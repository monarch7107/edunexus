import { todayKey } from "@/lib/utils";
import type { AcademicContext, AgentPlan, ProposedChange } from "./types";

function dayKey(iso: string | null): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

function addDay(iso: string, n: number): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Rule-based schedule optimizer. Never claimed as LLM output. */
export function fallbackOptimizeSchedule(ctx: AcademicContext): AgentPlan {
  const today = todayKey();
  const pending = ctx.tasks.filter((t) => t.status === "pending");
  const overdue = pending.filter((t) => t.due_date && dayKey(t.due_date)! < today);
  const dueSoon = pending.filter((t) => {
    const d = dayKey(t.due_date);
    return d && d >= today && d <= addDay(today, 7);
  });
  const exams = pending.filter((t) => t.task_type === "exam");
  const sessions = ctx.sessions.filter((s) => s.status === "planned");
  const byDay = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const k = dayKey(s.planned_date) || s.planned_date;
    const list = byDay.get(k) ?? [];
    list.push(s);
    byDay.set(k, list);
  }

  const evidence: string[] = [];
  const conflicts: string[] = [];
  const changes: ProposedChange[] = [];

  evidence.push(`Reviewed ${ctx.subjects.length} subjects.`);
  evidence.push(`Reviewed ${pending.length} pending tasks.`);
  evidence.push(`Reviewed ${sessions.length} planned study sessions.`);

  for (const [day, list] of byDay) {
    const mins = list.reduce((n, s) => n + s.duration_minutes, 0);
    if (list.length > 3 || mins > 240) {
      conflicts.push(`${day} is overloaded (${list.length} sessions, ${mins} min).`);
      const move = list[list.length - 1];
      const next = addDay(day, 1);
      changes.push({
        operation: "move",
        entity: "study_session",
        entity_id: move.id,
        payload: { id: move.id, planned_date: next },
        label: `Move “${move.title}” ${day} → ${next}`,
      });
    }
  }

  const coveredSubjects = new Set(sessions.map((s) => s.subject_id).filter(Boolean));
  const focusTasks = [...overdue, ...exams, ...dueSoon].slice(0, 6);
  for (const task of focusTasks) {
    if (changes.length >= 8) break;
    const already = sessions.some(
      (s) =>
        s.subject_id &&
        s.subject_id === task.subject_id &&
        (dayKey(s.planned_date) ?? "") >= today,
    );
    if (already && coveredSubjects.has(task.subject_id)) continue;
    const subject = ctx.subjects.find((s) => s.id === task.subject_id);
    const date = task.due_date && dayKey(task.due_date)! > today ? addDay(dayKey(task.due_date)!, -1) : addDay(today, 1);
    changes.push({
      operation: "create",
      entity: "study_session",
      entity_id: null,
      payload: {
        title: `${subject?.name || task.title} revision`,
        subject_id: task.subject_id,
        planned_date: date < today ? addDay(today, 1) : date,
        duration_minutes: task.task_type === "exam" || task.priority === "high" ? 60 : 45,
      },
      label: `Create ${subject?.name || task.title} revision`,
    });
  }

  if (!changes.length && ctx.subjects[0]) {
    changes.push({
      operation: "create",
      entity: "study_session",
      entity_id: null,
      payload: {
        title: `${ctx.subjects[0].name} focused study`,
        subject_id: ctx.subjects[0].id,
        planned_date: addDay(today, 1),
        duration_minutes: 45,
      },
      label: `Create ${ctx.subjects[0].name} focused study`,
    });
  }

  const summary =
    changes.length === 0
      ? "No schedule changes are needed with the academic data available."
      : `Proposed ${changes.length} schedule adjustment${changes.length === 1 ? "" : "s"} based on overdue work, upcoming deadlines, and session load.`;

  return {
    summary,
    evidence,
    conflicts,
    changes: changes.slice(0, 10),
    source: "fallback",
  };
}
