import type {
  Profile,
  RecommendationResult,
  StudySession,
  Subject,
  Task,
} from "./types";

/** Browser-side bound: the UI must never wait indefinitely. */
export const AI_REQUEST_TIMEOUT_MS = 25000;

export interface Snapshot {
  goals?: string;
  subjects: { id: string; name: string; code: string }[];
  tasks: Task[];
  sessions: {
    subject_id: string | null;
    planned_date: string;
    duration_minutes: number;
    status: string;
  }[];
  studyMinutesCompleted: number;
}

export function buildSnapshot(
  profile: Profile | null,
  subjects: Subject[],
  tasks: Task[],
  sessions: StudySession[]
): Snapshot {
  return {
    goals: profile?.goals ?? "",
    subjects: subjects.map((s) => ({ id: s.id, name: s.name, code: s.code })),
    tasks: tasks.map((t) => ({
      id: t.id,
      subject_id: t.subject_id,
      title: t.title,
      task_type: t.task_type,
      priority: t.priority,
      due_date: t.due_date,
      status: t.status,
    })) as Task[],
    sessions: sessions.map((s) => ({
      subject_id: s.subject_id,
      planned_date: s.planned_date,
      duration_minutes: s.duration_minutes,
      status: s.status,
    })),
    studyMinutesCompleted: sessions
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.duration_minutes, 0),
  };
}

/** Validate the API response shape before the UI touches it. */
export function validateRecommendationResult(
  raw: unknown
): RecommendationResult | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r.source !== "ai" && r.source !== "fallback") return null;
  if (typeof r.summary !== "string" || !r.summary.trim()) return null;
  if (!Array.isArray(r.plan) || !r.plan.every((x) => typeof x === "string")) {
    return null;
  }
  if (
    !Array.isArray(r.items) ||
    !r.items.every(
      (i) =>
        typeof i === "object" &&
        i !== null &&
        typeof (i as Record<string, unknown>).title === "string"
    )
  ) {
    return null;
  }
  if (typeof r.generated_at !== "string") return null;
  return raw as RecommendationResult;
}

export async function fetchRecommendation(
  snapshot: Snapshot,
  options?: { timeoutMs?: number }
): Promise<RecommendationResult> {
  const timeoutMs = options?.timeoutMs ?? AI_REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error("Could not generate a recommendation right now.");
    }
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      throw new Error("The recommendation arrived damaged. Please try again.");
    }
    const result = validateRecommendationResult(data);
    if (!result) {
      throw new Error("The recommendation arrived damaged. Please try again.");
    }
    return result;
  } catch (error) {
    if ((error as Error | null)?.name === "AbortError") {
      throw new Error(
        "The recommendation request timed out. Please try again."
      );
    }
    throw error instanceof Error
      ? error
      : new Error("Could not generate a recommendation right now.");
  } finally {
    clearTimeout(timer);
  }
}
