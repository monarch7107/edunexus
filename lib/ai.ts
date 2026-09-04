import type {
  Profile,
  RecommendationResult,
  StudySession,
  Subject,
  Task,
} from "./types";

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

export async function fetchRecommendation(
  snapshot: Snapshot
): Promise<RecommendationResult> {
  const res = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot),
  });
  if (!res.ok) {
    throw new Error("Could not generate a recommendation right now.");
  }
  return (await res.json()) as RecommendationResult;
}
