/**
 * Server-side academic context loading.
 *
 * When Supabase is configured the Planning Agent must reason over data read
 * from the real database under the student's session — not over a snapshot
 * supplied by the browser. The snapshot from the client is ignored so a
 * forged context can never change what the agent sees; the server identity
 * is authoritative and RLS bounds every query.
 */
import { AiError } from "./errors";
import type { AcademicContext, AcademicSession, AcademicSubject, AcademicTask } from "./types";

interface SubjectRow {
  id: string;
  name: string;
  code: string | null;
}
interface TaskRow {
  id: string;
  subject_id: string | null;
  title: string;
  task_type: string | null;
  priority: string | null;
  due_date: string | null;
  status: string | null;
}
interface SessionRow {
  id: string;
  subject_id: string | null;
  title: string;
  planned_date: string;
  duration_minutes: number;
  status: string | null;
}
interface ProfileRow {
  goals: string | null;
}

export async function loadAcademicContextServer(userId: string): Promise<AcademicContext> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();

    const [{ data: profile }, { data: subjects }, { data: tasks }, { data: sessions }] =
      await Promise.all([
        supabase.from("profiles").select("goals").eq("id", userId).maybeSingle(),
        supabase
          .from("subjects")
          .select("id,name,code")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        supabase
          .from("tasks")
          .select("id,subject_id,title,task_type,priority,due_date,status")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("study_sessions")
          .select("id,subject_id,title,planned_date,duration_minutes,status")
          .eq("user_id", userId)
          .order("planned_date", { ascending: true }),
      ]);

    const subjectsOut: AcademicSubject[] = (subjects ?? []).map((s: SubjectRow) => ({
      id: s.id,
      name: s.name,
      code: s.code ?? "",
    }));
    const tasksOut: AcademicTask[] = (tasks ?? []).map((t: TaskRow) => ({
      id: t.id,
      subject_id: t.subject_id,
      title: t.title,
      task_type: t.task_type ?? "other",
      priority: t.priority ?? "medium",
      due_date: t.due_date ? String(t.due_date).slice(0, 10) : null,
      status: t.status ?? "pending",
    }));
    const sessionsOut: AcademicSession[] = (sessions ?? []).map((s: SessionRow) => ({
      id: s.id,
      subject_id: s.subject_id,
      title: s.title,
      planned_date: String(s.planned_date).slice(0, 10),
      duration_minutes: s.duration_minutes,
      status: s.status ?? "planned",
    }));

    return {
      subjects: subjectsOut,
      tasks: tasksOut,
      sessions: sessionsOut,
      goals: ((profile as ProfileRow | null)?.goals ?? "").slice(0, 2000),
    };
  } catch (error) {
    if (error instanceof AiError) throw error;
    throw new AiError("database", "Could not load your academic context.", 500);
  }
}
