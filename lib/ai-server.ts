import type {
  RecommendationItem,
  RecommendationResult,
  Subject,
  Task,
  TaskPriority,
  TaskType,
} from "./types";
import { dueState, minutesToLabel, rankTasks, taskTypeLabel } from "./utils";

/**
 * AI recommendation reliability (Step 9 / RC6).
 *
 * This module is imported ONLY by the server route (and unit tests) — never
 * by browser bundles. Provider keys, prompts, and failure diagnostics stay
 * server-side. On any provider failure the route falls back to the
 * deterministic student-specific recommendation below.
 */

/** Bound for the provider call — comfortably under the browser timeout. */
export const AI_PROVIDER_TIMEOUT_MS = 15000;

/** Server-side failure classes. Logged, never sent to the browser. */
export type AiFailureClass =
  | "config"
  | "auth"
  | "validation"
  | "timeout"
  | "http"
  | "network"
  | "format";

export interface ValidatedTask {
  id: string;
  subject_id: string | null;
  title: string;
  task_type: TaskType;
  priority: TaskPriority;
  due_date: string | null;
  status: "pending" | "completed";
}

export interface ValidatedSnapshot {
  goals: string;
  subjects: Pick<Subject, "id" | "name" | "code">[];
  tasks: ValidatedTask[];
  sessions: {
    subject_id: string | null;
    planned_date: string;
    duration_minutes: number;
    status: string;
  }[];
  studyMinutesCompleted: number;
}

const TASK_TYPES: TaskType[] = ["assignment", "exam", "project", "reading", "other"];
const PRIORITIES: TaskPriority[] = ["high", "medium", "low"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Validate the student snapshot before it is used for generation. Unknown
 * shapes are rejected (route answers 400) instead of reaching the provider.
 */
export function validateSnapshot(
  input: unknown,
): { ok: true; snapshot: ValidatedSnapshot } | { ok: false; error: string } {
  if (!isRecord(input)) return { ok: false, error: "Invalid request body." };

  const goals = input.goals === undefined ? "" : input.goals;
  if (typeof goals !== "string") return { ok: false, error: "Invalid request body." };

  const subjectsRaw = input.subjects === undefined ? [] : input.subjects;
  if (!Array.isArray(subjectsRaw)) return { ok: false, error: "Invalid request body." };
  const subjects: ValidatedSnapshot["subjects"] = [];
  for (const s of subjectsRaw) {
    if (!isRecord(s) || typeof s.id !== "string" || !s.id.trim()) {
      return { ok: false, error: "Invalid request body." };
    }
    subjects.push({
      id: s.id,
      name: asString(s.name),
      code: asString(s.code),
    });
  }

  const tasksRaw = input.tasks === undefined ? [] : input.tasks;
  if (!Array.isArray(tasksRaw)) return { ok: false, error: "Invalid request body." };
  const tasks: ValidatedTask[] = [];
  for (const t of tasksRaw) {
    if (
      !isRecord(t) ||
      typeof t.id !== "string" ||
      !t.id.trim() ||
      typeof t.title !== "string" ||
      !t.title.trim() ||
      (t.status !== "pending" && t.status !== "completed")
    ) {
      return { ok: false, error: "Invalid request body." };
    }
    const taskType = TASK_TYPES.includes(t.task_type as TaskType)
      ? (t.task_type as TaskType)
      : "other";
    const priority = PRIORITIES.includes(t.priority as TaskPriority)
      ? (t.priority as TaskPriority)
      : "medium";
    tasks.push({
      id: t.id,
      subject_id: typeof t.subject_id === "string" ? t.subject_id : null,
      title: t.title,
      task_type: taskType,
      priority,
      due_date: typeof t.due_date === "string" ? t.due_date : null,
      status: t.status,
    });
  }

  const sessionsRaw = input.sessions === undefined ? [] : input.sessions;
  if (!Array.isArray(sessionsRaw)) return { ok: false, error: "Invalid request body." };
  const sessions: ValidatedSnapshot["sessions"] = [];
  for (const s of sessionsRaw) {
    if (
      !isRecord(s) ||
      typeof s.planned_date !== "string" ||
      typeof s.duration_minutes !== "number" ||
      !Number.isFinite(s.duration_minutes) ||
      s.duration_minutes < 0 ||
      typeof s.status !== "string"
    ) {
      return { ok: false, error: "Invalid request body." };
    }
    sessions.push({
      subject_id: typeof s.subject_id === "string" ? s.subject_id : null,
      planned_date: s.planned_date,
      duration_minutes: s.duration_minutes,
      status: s.status,
    });
  }

  const mins = input.studyMinutesCompleted === undefined ? 0 : input.studyMinutesCompleted;
  if (typeof mins !== "number" || !Number.isFinite(mins) || mins < 0) {
    return { ok: false, error: "Invalid request body." };
  }

  return {
    ok: true,
    snapshot: { goals, subjects, tasks, sessions, studyMinutesCompleted: mins },
  };
}

/**
 * Validate a provider response AND verify every task reference against the
 * validated snapshot:
 *  - unknown `task_id`s are nulled (never surface dangling references);
 *  - references to completed tasks are nulled (recommendations target
 *    pending work);
 *  - items linked to a real pending task inherit that task's actual
 *    `subject_id`/`due_date` so the provider cannot hallucinate deadlines.
 * Returns `null` when the response shape is unusable (caller falls back).
 */
export function sanitizeAiResponse(
  raw: unknown,
  snapshot: ValidatedSnapshot,
): RecommendationResult | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.summary !== "string" || !raw.summary.trim()) return null;
  if (!Array.isArray(raw.plan) || !raw.plan.every((x) => typeof x === "string")) {
    return null;
  }
  if (!Array.isArray(raw.items)) return null;

  const pendingById = new Map(snapshot.tasks.filter((t) => t.status === "pending").map((t) => [t.id, t]));
  const knownSubjects = new Set(snapshot.subjects.map((s) => s.id));

  const items: RecommendationItem[] = raw.items
    .filter(
      (i): i is Record<string, unknown> =>
        isRecord(i) && typeof i.title === "string" && Boolean(i.title.trim()),
    )
    .slice(0, 6)
    .map((i) => {
      const claimedId = typeof i.task_id === "string" ? i.task_id : null;
      // Reject unknown ids and completed-task references.
      const real = claimedId ? pendingById.get(claimedId) ?? null : null;
      const task_id = real ? real.id : null;
      const claimedSubject = typeof i.subject_id === "string" ? i.subject_id : null;
      return {
        task_id,
        title: String(i.title).slice(0, 160),
        reason:
          typeof i.reason === "string"
            ? i.reason.slice(0, 240)
            : "Suggested based on your academic data.",
        // Real task data wins over anything the provider invented.
        subject_id: real
          ? real.subject_id
          : claimedSubject && knownSubjects.has(claimedSubject)
            ? claimedSubject
            : null,
        due_date: real ? real.due_date : null,
      };
    });

  return {
    source: "ai",
    summary: raw.summary.slice(0, 400),
    plan: raw.plan.map((p) => String(p).slice(0, 240)).slice(0, 6),
    items,
    generated_at: new Date().toISOString(),
  };
}

/** System + user prompt. Every relevant record is included — nothing invented. */
export function buildAdvisorPrompt(snapshot: ValidatedSnapshot): {
  system: string;
  user: string;
} {
  const system = [
    "You are the EduNexus study advisor for university students in India.",
    "You receive the student's real academic data (tasks with deadlines/priority/status, subjects, study sessions, goals).",
    "Recommend what to study and work on over the next 3-5 days. Be concrete, brief and encouraging.",
    "Rules: use ONLY the provided data; never invent tasks; order items by urgency (overdue first, then nearest deadline, then high priority); cover exam preparation if exams are near.",
    'Respond with ONLY valid JSON, no markdown, in this shape:',
    '{"summary": string (1-2 sentences), "plan": string[] (3-5 short action steps), "items": [{"task_id": string|null (must match an id from the input tasks or null), "title": string, "reason": string}]}.',
  ].join(" ");
  return {
    system,
    user: `Student data:\n${JSON.stringify(snapshot).slice(0, 12000)}`,
  };
}

/**
 * Server-side diagnostic log. Records ONLY the failure class (+ HTTP status).
 * NEVER pass API keys, tokens, prompts, snapshots, or student data here.
 */
export function logAiDiagnostic(
  failure: AiFailureClass,
  detail?: { status?: number },
): void {
  const status = detail?.status !== undefined ? ` status=${detail.status}` : "";
  console.warn(`edunexus/recommend provider_failed class=${failure}${status}`);
}

export interface AiProviderDeps {
  fetchImpl?: typeof fetch;
  apiKey?: string | undefined;
  baseUrl?: string | undefined;
  model?: string | undefined;
  timeoutMs?: number | undefined;
}

export type AiProviderOutcome =
  | { ok: true; result: RecommendationResult }
  | { ok: false; failure: AiFailureClass };

/**
 * Call the AI provider with a bounded execution time and classified
 * failures. Every failure path is logged server-side (class only).
 */
export async function runAiRecommendation(
  snapshot: ValidatedSnapshot,
  deps?: AiProviderDeps,
): Promise<AiProviderOutcome> {
  const apiKey = deps?.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    logAiDiagnostic("config");
    return { ok: false, failure: "config" };
  }

  const base = (deps?.baseUrl ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = deps?.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const timeoutMs = deps?.timeoutMs ?? AI_PROVIDER_TIMEOUT_MS;
  const fetchImpl = deps?.fetchImpl ?? fetch;
  const { system, user } = buildAdvisorPrompt(snapshot);

  let res: Response;
  try {
    res = await fetchImpl(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const name = (error as Error | null)?.name ?? "";
    if (name === "TimeoutError" || name === "AbortError") {
      logAiDiagnostic("timeout");
      return { ok: false, failure: "timeout" };
    }
    logAiDiagnostic("network");
    return { ok: false, failure: "network" };
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logAiDiagnostic("auth", { status: res.status });
      return { ok: false, failure: "auth" };
    }
    logAiDiagnostic("http", { status: res.status });
    return { ok: false, failure: "http" };
  }

  let content: string | undefined;
  try {
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    content = data.choices?.[0]?.message?.content ?? undefined;
    if (!content) throw new Error("empty completion");
    const parsed: unknown = JSON.parse(content);
    const result = sanitizeAiResponse(parsed, snapshot);
    if (!result) throw new Error("unusable completion");
    return { ok: true, result };
  } catch {
    logAiDiagnostic("format");
    return { ok: false, failure: "format" };
  }
}

// ── Deterministic fallback (spec §14): overdue → nearest deadline → priority ─
export function fallbackRecommendation(
  snap: Pick<
    ValidatedSnapshot,
    "goals" | "subjects" | "tasks" | "studyMinutesCompleted"
  >,
): RecommendationResult {
  const tasks = (snap.tasks ?? []) as (Task | ValidatedTask)[];
  const subjects = new Map((snap.subjects ?? []).map((s) => [s.id, s]));
  // rankTasks filters to pending internally; cast keeps the shared ordering.
  const ranked = rankTasks(tasks as Task[]).slice(0, 5);

  const overdue = ranked.filter((t) => dueState(t.due_date) === "overdue");
  const dueToday = ranked.filter((t) => dueState(t.due_date) === "today");

  const items: RecommendationItem[] = ranked.map((t) => {
    const subj = t.subject_id ? subjects.get(t.subject_id) : undefined;
    const state = dueState(t.due_date);
    const reason =
      state === "overdue"
        ? `Overdue — submit/finish this immediately${subj ? ` (${subj.code || subj.name})` : ""}.`
        : state === "today"
          ? `Due today — block time for it now${subj ? ` (${subj.code || subj.name})` : ""}.`
          : t.priority === "high"
            ? `High priority with the nearest deadline${subj ? ` (${subj.code || subj.name})` : ""}.`
            : `Next nearest deadline among your pending tasks${subj ? ` (${subj.code || subj.name})` : ""}.`;
    return {
      task_id: t.id,
      title: t.title,
      reason,
      subject_id: t.subject_id,
      due_date: t.due_date,
    };
  });

  const plan: string[] = [];
  if (overdue.length)
    plan.push(`Clear ${overdue.length} overdue task${overdue.length > 1 ? "s" : ""} first — they carry the biggest risk.`);
  if (dueToday.length)
    plan.push(`Finish ${dueToday.length} task${dueToday.length > 1 ? "s" : ""} due today before starting anything new.`);
  const top = ranked[0];
  if (top) {
    const subj = top.subject_id ? subjects.get(top.subject_id) : undefined;
    plan.push(
      `Then focus on "${top.title}"${subj ? ` for ${subj.code || subj.name}` : ""} (${taskTypeLabel(top.task_type)}, ${top.priority} priority).`,
    );
  }
  const mins = snap.studyMinutesCompleted ?? 0;
  plan.push(
    mins > 0
      ? `You have logged ${minutesToLabel(mins)} of study — keep a 45–60 minute session for the nearest exam/assignment.`
      : `Schedule at least one 45-minute study session today to build momentum.`,
  );
  if (snap.goals?.trim())
    plan.push(`Keep your semester goal in mind: “${snap.goals.trim().slice(0, 140)}”.`);

  const summary =
    ranked.length === 0
      ? "You have no pending tasks. Add upcoming assignments and exams, or plan a study session to get ahead."
      : `Focus on ${ranked.length} prioritized item${ranked.length > 1 ? "s" : ""}: ${
          overdue.length ? `${overdue.length} overdue, ` : ""
        }${dueToday.length ? `${dueToday.length} due today, ` : ""}then the nearest deadlines.`;

  return {
    source: "fallback",
    summary,
    plan,
    items,
    generated_at: new Date().toISOString(),
  };
}
