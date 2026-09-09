/**
 * Demo Seed — coherent sample workspace for SIH judges.
 *
 * This data is:
 * - Clearly marked as sample (banner + localStorage flag)
 * - Dynamically dated relative to today so overdue/today/tomorrow always make sense
 * - Fully functional through the real repository interface (no fake claims)
 * - Safe to clear without losing real user data (seeded items can be removed)
 *
 * Usage: call seedDemoWorkspace(appData) after user is onboarded.
 * The function creates subjects first, then tasks/sessions/resources linked to them.
 */

import { toDateInput } from "./utils";
import type {
  ResourceInput,
  SessionInput,
  Subject,
  SubjectInput,
  TaskInput,
} from "./types";

export const DEMO_SEEDED_FLAG = "edunexus_demo_seeded";
export const DEMO_SEEDED_AT = "edunexus_demo_seeded_at";

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateInput(d);
}

function isoDateTimeFromDateInput(dateInput: string): string {
  // Store as end-of-day ISO so dueState and ranking work consistently
  // with the existing date handling (see lib/dates.ts tests)
  const dt = new Date(`${dateInput}T23:59:00`);
  return dt.toISOString();
}

export interface DemoTaskSeed {
  subjectName: string;
  title: string;
  description: string;
  task_type: TaskInput["task_type"];
  priority: TaskInput["priority"];
  due_date: string | null;
}
export interface DemoSessionSeed {
  subjectName: string;
  title: string;
  planned_date: string;
  duration_minutes: number;
}
export interface DemoResourceSeed {
  subjectName: string;
  title: string;
  content?: string;
  resource_url?: string;
  resource_type: ResourceInput["resource_type"];
}
export interface DemoSeedPayload {
  subjects: SubjectInput[];
  tasks: DemoTaskSeed[];
  sessions: DemoSessionSeed[];
  resources: DemoResourceSeed[];
}

export function getDemoSeedPayload(): DemoSeedPayload {
  return {
    subjects: [
      { name: "Data Structures", code: "CS 201", color: "#3b62f6" },
      { name: "Database Systems", code: "CS 204", color: "#0ea5e9" },
      { name: "Operating Systems", code: "CS 301", color: "#f59e0b" },
      { name: "Computer Networks", code: "CS 302", color: "#8b5cf6" },
    ],
    tasks: [
      {
        subjectName: "Data Structures",
        title: "Submit DSA assignment - Linked Lists",
        description:
          "Complete implementation of singly and doubly linked lists with test cases. Review lecture notes from Week 3.",
        task_type: "assignment",
        priority: "high",
        due_date: isoDateTimeFromDateInput(dateOffset(-2)), // overdue
      },
      {
        subjectName: "Database Systems",
        title: "DBMS lab report - Normalization",
        description:
          "Write lab report covering 1NF, 2NF, 3NF with examples from the university database schema.",
        task_type: "assignment",
        priority: "high",
        due_date: isoDateTimeFromDateInput(dateOffset(0)), // today
      },
      {
        subjectName: "Operating Systems",
        title: "OS exam preparation - Process Scheduling",
        description:
          "Revise FCFS, SJF, Round Robin, Priority scheduling. Practice numerical problems.",
        task_type: "exam",
        priority: "high",
        due_date: isoDateTimeFromDateInput(dateOffset(1)), // tomorrow
      },
      {
        subjectName: "Computer Networks",
        title: "CN project proposal",
        description:
          "Draft proposal for campus network simulation project. Include objectives and timeline.",
        task_type: "project",
        priority: "medium",
        due_date: isoDateTimeFromDateInput(dateOffset(3)),
      },
      {
        subjectName: "Database Systems",
        title: "Read DBMS chapter 5 - Transactions",
        description:
          "Focus on ACID properties, concurrency control, and recovery mechanisms.",
        task_type: "reading",
        priority: "medium",
        due_date: isoDateTimeFromDateInput(dateOffset(5)),
      },
      {
        subjectName: "Data Structures",
        title: "Practice Trees - BST & AVL",
        description:
          "Solve 5 problems on BST insertion/deletion and AVL rotations from the practice set.",
        task_type: "assignment",
        priority: "low",
        due_date: isoDateTimeFromDateInput(dateOffset(7)),
      },
      {
        subjectName: "Operating Systems",
        title: "Complete OS notes - Deadlocks",
        description:
          "Organize notes on deadlock conditions, prevention, avoidance, and Banker's algorithm.",
        task_type: "reading",
        priority: "medium",
        due_date: null,
      },
    ],
    sessions: [
      {
        subjectName: "Data Structures",
        title: "DSA revision - Linked Lists",
        planned_date: dateOffset(-1),
        duration_minutes: 60,
      },
      {
        subjectName: "Database Systems",
        title: "SQL practice - Joins",
        planned_date: dateOffset(0),
        duration_minutes: 45,
      },
      {
        subjectName: "Operating Systems",
        title: "OS numerical - Scheduling",
        planned_date: dateOffset(1),
        duration_minutes: 90,
      },
      {
        subjectName: "Computer Networks",
        title: "CN theory - OSI model",
        planned_date: dateOffset(2),
        duration_minutes: 30,
      },
    ],
    resources: [
      {
        subjectName: "Data Structures",
        title: "DSA - Trees & Graphs notes",
        content:
          "BST: left < root < right. Inorder gives sorted order. AVL: balance factor -1,0,1. Rotations: LL, RR, LR, RL. Graph: BFS uses queue, DFS uses stack/recursion. Dijkstra for shortest path.",
        resource_type: "note",
      },
      {
        subjectName: "Database Systems",
        title: "DBMS textbook - Chapter 4",
        content: "",
        resource_url: "https://example.com/dbms-textbook-ch4.pdf",
        resource_type: "link",
      },
      {
        subjectName: "Operating Systems",
        title: "OS - Deadlock summary",
        content:
          "Deadlock 4 conditions: Mutual exclusion, Hold & wait, No preemption, Circular wait. Prevention: break one condition. Avoidance: Banker's algorithm. Detection & recovery: wait-for graph.",
        resource_type: "note",
      },
      {
        subjectName: "Computer Networks",
        title: "CN - Topologies reference",
        content: "",
        resource_url: "https://example.com/cn-topologies.pdf",
        resource_type: "link",
      },
    ],
  };
}

export interface SeedDeps {
  subjects: Subject[];
  createSubject: (input: SubjectInput) => Promise<Subject | void>;
  createTask: (input: TaskInput) => Promise<unknown>;
  createSession: (input: SessionInput) => Promise<unknown>;
  createResource: (input: ResourceInput) => Promise<unknown>;
  listSubjects?: () => Promise<Subject[]>;
}

/**
 * Seed the workspace using the real repository interface.
 * Returns the created subjects for linking.
 * Idempotent guard: caller should check if workspace already has data and confirm.
 */
export async function seedDemoWorkspace(deps: SeedDeps): Promise<{
  subjects: Subject[];
  created: { subjects: number; tasks: number; sessions: number; resources: number };
}> {
  const payload = getDemoSeedPayload();

  // 1. Create subjects first (or reuse existing matching names)
  const subjectMap = new Map<string, Subject>();
  deps.subjects.forEach((s) => subjectMap.set(s.name.toLowerCase(), s));

  const createdSubjects: Subject[] = [];
  let subjectsCreated = 0;

  for (const subj of payload.subjects) {
    const existing = subjectMap.get(subj.name.toLowerCase());
    if (existing) {
      createdSubjects.push(existing);
    } else {
      const created = (await deps.createSubject(subj)) as Subject | void;
      if (created && typeof created === "object" && "id" in created) {
        createdSubjects.push(created as Subject);
        subjectMap.set(subj.name.toLowerCase(), created as Subject);
      }
      subjectsCreated++;
    }
  }

  // If createSubject didn't return entities (app-data wrapper returns void),
  // refresh the subject list via listSubjects if available, or via repo directly
  if (subjectsCreated > 0 && deps.listSubjects) {
    try {
      const fresh = await deps.listSubjects();
      fresh.forEach((s) => subjectMap.set(s.name.toLowerCase(), s));
      // rebuild createdSubjects from fresh list for the seeded names
      createdSubjects.length = 0;
      for (const subj of payload.subjects) {
        const found = fresh.find(
          (s) => s.name.toLowerCase() === subj.name.toLowerCase()
        );
        if (found) createdSubjects.push(found);
      }
    } catch {}
  }

  const getSubjectId = (name: string): string | null => {
    return subjectMap.get(name.toLowerCase())?.id ?? null;
  };

  let tasksCreated = 0;
  for (const t of payload.tasks) {
    const subject_id = getSubjectId(t.subjectName);
    await deps.createTask({
      subject_id,
      title: t.title,
      description: t.description,
      task_type: t.task_type,
      priority: t.priority,
      due_date: t.due_date,
    });
    tasksCreated++;
  }

  let sessionsCreated = 0;
  for (const s of payload.sessions) {
    const subject_id = getSubjectId(s.subjectName);
    await deps.createSession({
      subject_id,
      title: s.title,
      planned_date: s.planned_date,
      duration_minutes: s.duration_minutes,
    });
    sessionsCreated++;
  }

  let resourcesCreated = 0;
  for (const r of payload.resources) {
    const subject_id = getSubjectId(r.subjectName);
    await deps.createResource({
      subject_id,
      title: r.title,
      content: r.content ?? "",
      resource_url: r.resource_url ?? "",
      resource_type: r.resource_type,
    });
    resourcesCreated++;
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DEMO_SEEDED_FLAG, "1");
      localStorage.setItem(DEMO_SEEDED_AT, new Date().toISOString());
    } catch {}
  }

  return {
    subjects: createdSubjects,
    created: {
      subjects: subjectsCreated,
      tasks: tasksCreated,
      sessions: sessionsCreated,
      resources: resourcesCreated,
    },
  };
}

/**
 * Direct repo seeding — uses repo methods that return entities, so linking is exact.
 * Preferred for demo mode where we have direct repo access.
 */
export async function seedDemoWorkspaceWithRepo(repo: {
  listSubjects: () => Promise<Subject[]>;
  createSubject: (input: SubjectInput) => Promise<Subject>;
  createTask: (input: TaskInput) => Promise<unknown>;
  createSession: (input: SessionInput) => Promise<unknown>;
  createResource: (input: ResourceInput) => Promise<unknown>;
}): Promise<{
  subjects: Subject[];
  created: { subjects: number; tasks: number; sessions: number; resources: number };
}> {
  const payload = getDemoSeedPayload();
  const existing = await repo.listSubjects();
  const subjectMap = new Map<string, Subject>();
  existing.forEach((s) => subjectMap.set(s.name.toLowerCase(), s));

  const createdSubjects: Subject[] = [];
  let subjectsCreated = 0;

  for (const subj of payload.subjects) {
    const found = subjectMap.get(subj.name.toLowerCase());
    if (found) {
      createdSubjects.push(found);
    } else {
      const created = await repo.createSubject(subj);
      createdSubjects.push(created);
      subjectMap.set(subj.name.toLowerCase(), created);
      subjectsCreated++;
    }
  }

  const getSubjectId = (name: string): string | null =>
    subjectMap.get(name.toLowerCase())?.id ?? null;

  let tasksCreated = 0;
  for (const t of payload.tasks) {
    await repo.createTask({
      subject_id: getSubjectId(t.subjectName),
      title: t.title,
      description: t.description,
      task_type: t.task_type,
      priority: t.priority,
      due_date: t.due_date,
    });
    tasksCreated++;
  }

  let sessionsCreated = 0;
  for (const s of payload.sessions) {
    await repo.createSession({
      subject_id: getSubjectId(s.subjectName),
      title: s.title,
      planned_date: s.planned_date,
      duration_minutes: s.duration_minutes,
    });
    sessionsCreated++;
  }

  let resourcesCreated = 0;
  for (const r of payload.resources) {
    await repo.createResource({
      subject_id: getSubjectId(r.subjectName),
      title: r.title,
      content: r.content ?? "",
      resource_url: r.resource_url ?? "",
      resource_type: r.resource_type,
    });
    resourcesCreated++;
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DEMO_SEEDED_FLAG, "1");
      localStorage.setItem(DEMO_SEEDED_AT, new Date().toISOString());
    } catch {}
  }

  return {
    subjects: createdSubjects,
    created: {
      subjects: subjectsCreated,
      tasks: tasksCreated,
      sessions: sessionsCreated,
      resources: resourcesCreated,
    },
  };
}

export function isDemoSeeded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DEMO_SEEDED_FLAG) === "1";
  } catch {
    return false;
  }
}

export function clearDemoSeededFlag(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DEMO_SEEDED_FLAG);
    localStorage.removeItem(DEMO_SEEDED_AT);
  } catch {}
}
