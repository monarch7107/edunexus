import type { StudySession, Subject, Task } from "@/lib/types";
import { MemoryAcademicPort, MemoryAgentStore } from "@/lib/ai/store/memory";
import { Orchestrator } from "@/lib/ai/orchestrator";
import { createPrincipal } from "@/lib/ai/authorization";
import { localToday } from "@/lib/ai/agents/planning";
import { addDays } from "@/lib/ai/agents/schedule-logic";

export const TODAY = localToday();
export const day = (offset: number) => addDays(TODAY, offset);

export function subject(over: Partial<Subject> & { id: string; user_id: string }): Subject {
  return {
    name: "Physics",
    code: "PH 101",
    color: "#3b62f6",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

export function task(over: Partial<Task> & { id: string; user_id: string }): Task {
  return {
    subject_id: null,
    title: "Task",
    description: "",
    task_type: "assignment",
    priority: "medium",
    due_date: null,
    status: "pending",
    completed_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

export function session(
  over: Partial<StudySession> & { id: string; user_id: string },
): StudySession {
  return {
    subject_id: null,
    title: "Study session",
    planned_date: TODAY,
    duration_minutes: 60,
    status: "planned",
    completed_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

/** A workspace with three exams next week and no revision booked. */
export function examWorkspace(userId = "user-a") {
  const subjects = [
    subject({ id: "sub-physics", user_id: userId, name: "Physics", code: "PH 101" }),
    subject({ id: "sub-dbms", user_id: userId, name: "Database Systems", code: "CS 204" }),
    subject({ id: "sub-maths", user_id: userId, name: "Mathematics", code: "MA 201" }),
  ];
  const tasks = [
    task({
      id: "task-physics",
      user_id: userId,
      subject_id: "sub-physics",
      title: "Physics unit test",
      task_type: "exam",
      priority: "high",
      due_date: `${day(5)}T23:59:00.000Z`,
    }),
    task({
      id: "task-dbms",
      user_id: userId,
      subject_id: "sub-dbms",
      title: "DBMS mid-semester exam",
      task_type: "exam",
      priority: "high",
      due_date: `${day(6)}T23:59:00.000Z`,
    }),
    task({
      id: "task-maths",
      user_id: userId,
      subject_id: "sub-maths",
      title: "Mathematics quiz",
      task_type: "exam",
      priority: "medium",
      due_date: `${day(7)}T23:59:00.000Z`,
    }),
  ];
  const sessions = [
    session({
      id: "ses-existing",
      user_id: userId,
      subject_id: "sub-physics",
      title: "Old physics reading",
      planned_date: day(9),
      duration_minutes: 45,
    }),
  ];
  return { subjects, tasks, sessions };
}

export interface Harness {
  academic: MemoryAcademicPort;
  store: MemoryAgentStore;
  orchestrator: Orchestrator;
  principal: ReturnType<typeof createPrincipal>;
}

/**
 * Build a fully wired pipeline backed by in-memory ports.
 * `completion` injects a deterministic "model" so tests never depend on a
 * live LLM.
 */
export function harness(options?: {
  userId?: string;
  seed?: { subjects?: Subject[]; tasks?: Task[]; sessions?: StudySession[] };
  completion?: (system: string, user: string) => Promise<string | null>;
  now?: () => Date;
  store?: MemoryAgentStore;
  academic?: MemoryAcademicPort;
}): Harness {
  const userId = options?.userId ?? "user-a";
  const academic = options?.academic ?? new MemoryAcademicPort(options?.seed);
  const store = options?.store ?? new MemoryAgentStore();
  const orchestrator = new Orchestrator({
    academic,
    store,
    planning: options?.completion ? { completion: options.completion } : undefined,
    now: options?.now,
  });
  return {
    academic,
    store,
    orchestrator,
    principal: createPrincipal(userId, `req-${userId}`),
  };
}

/** A canned model completion proposing `changes`. */
export function modelPlan(changes: unknown[], summary = "Proposed schedule improvements.") {
  return JSON.stringify({
    summary,
    evidence: ["Three exams fall within the next week."],
    changes,
  });
}

export function createChange(over?: Record<string, unknown>) {
  return {
    operation: "create",
    entity: "study_session",
    entity_id: null,
    payload: {
      subject_id: "sub-physics",
      title: "Physics revision",
      planned_date: day(3),
      duration_minutes: 60,
    },
    reason: "Revision before the Physics exam.",
    ...over,
  };
}
