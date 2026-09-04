import type { Repo } from "./types";
import { createClient } from "../supabase/client";
import type {
  AiRecommendation,
  AuthUser,
  Profile,
  ProfileInput,
  Resource,
  ResourceInput,
  SessionInput,
  StudySession,
  Subject,
  SubjectInput,
  Task,
  TaskInput,
} from "../types";

// ── Supabase backend: Postgres + Auth. RLS policies (see /supabase/schema.sql)
//    guarantee every user can only read/write their own rows. ─────────────────

type ProfileRow = Omit<Profile, "onboarded">;

function toProfile(row: ProfileRow): Profile {
  return { ...row, onboarded: Boolean(row.full_name) };
}

export class SupabaseRepo implements Repo {
  readonly mode = "supabase" as const;
  private client = createClient();

  async signUp(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.client.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Sign up failed. Please try again.");
    return { id: data.user.id, email: data.user.email ?? email };
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Sign in failed. Please try again.");
    return { id: data.user.id, email: data.user.email ?? email };
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  async getUser(): Promise<AuthUser | null> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    return user ? { id: user.id, email: user.email ?? "" } : null;
  }

  async getProfile(): Promise<Profile | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as ProfileRow | null) ? toProfile(data as ProfileRow) : null;
  }

  async upsertProfile(input: ProfileInput): Promise<Profile> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) throw new Error("Not signed in");
    const row = {
      id: user.id,
      full_name: input.full_name.trim(),
      course: input.course.trim(),
      branch: input.branch.trim(),
      semester: input.semester,
      year_of_study: input.year_of_study,
      goals: input.goals.trim(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await this.client
      .from("profiles")
      .upsert(row, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toProfile(data as ProfileRow);
  }

  async listSubjects(): Promise<Subject[]> {
    const { data, error } = await this.client
      .from("subjects")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as Subject[]) ?? [];
  }

  async createSubject(input: SubjectInput): Promise<Subject> {
    const { data, error } = await this.client
      .from("subjects")
      .insert({
        name: input.name.trim(),
        code: input.code?.trim() ?? "",
        color: input.color ?? "#3b62f6",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as Subject;
  }

  async updateSubject(
    id: string,
    input: Partial<SubjectInput>
  ): Promise<Subject> {
    const { data, error } = await this.client
      .from("subjects")
      .update({
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.code !== undefined ? { code: input.code.trim() } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as Subject;
  }

  async deleteSubject(id: string): Promise<void> {
    // Detach children first (FKs are ON DELETE SET NULL), then delete.
    await this.client.from("tasks").update({ subject_id: null }).eq("subject_id", id);
    await this.client.from("study_sessions").update({ subject_id: null }).eq("subject_id", id);
    await this.client.from("resources").update({ subject_id: null }).eq("subject_id", id);
    const { error } = await this.client.from("subjects").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async listTasks(): Promise<Task[]> {
    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Task[]) ?? [];
  }

  async createTask(input: TaskInput): Promise<Task> {
    const { data, error } = await this.client
      .from("tasks")
      .insert({
        subject_id: input.subject_id,
        title: input.title.trim(),
        description: input.description?.trim() ?? "",
        task_type: input.task_type,
        priority: input.priority,
        due_date: input.due_date,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as Task;
  }

  async updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
    const { data, error } = await this.client
      .from("tasks")
      .update({
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description.trim() }
          : {}),
        ...(input.task_type !== undefined ? { task_type: input.task_type } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.due_date !== undefined ? { due_date: input.due_date } : {}),
        ...(input.subject_id !== undefined ? { subject_id: input.subject_id } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as Task;
  }

  async setTaskStatus(id: string, completed: boolean): Promise<Task> {
    const { data, error } = await this.client
      .from("tasks")
      .update({
        status: completed ? "completed" : "pending",
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as Task;
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await this.client.from("tasks").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async listSessions(): Promise<StudySession[]> {
    const { data, error } = await this.client
      .from("study_sessions")
      .select("*")
      .order("planned_date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as StudySession[]) ?? [];
  }

  async createSession(input: SessionInput): Promise<StudySession> {
    const { data, error } = await this.client
      .from("study_sessions")
      .insert({
        subject_id: input.subject_id,
        title: input.title.trim(),
        planned_date: input.planned_date,
        duration_minutes: input.duration_minutes,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as StudySession;
  }

  async setSessionStatus(
    id: string,
    completed: boolean
  ): Promise<StudySession> {
    const { data, error } = await this.client
      .from("study_sessions")
      .update({
        status: completed ? "completed" : "planned",
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as StudySession;
  }

  async deleteSession(id: string): Promise<void> {
    const { error } = await this.client
      .from("study_sessions")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async listResources(): Promise<Resource[]> {
    const { data, error } = await this.client
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Resource[]) ?? [];
  }

  async createResource(input: ResourceInput): Promise<Resource> {
    const { data, error } = await this.client
      .from("resources")
      .insert({
        subject_id: input.subject_id,
        title: input.title.trim(),
        content: input.content?.trim() ?? "",
        resource_url: input.resource_url?.trim() ?? "",
        resource_type: input.resource_type,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as Resource;
  }

  async deleteResource(id: string): Promise<void> {
    const { error } = await this.client.from("resources").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async listRecommendations(): Promise<AiRecommendation[]> {
    const { data, error } = await this.client
      .from("ai_recommendations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return (data as AiRecommendation[]) ?? [];
  }

  async saveRecommendation(
    recommendation_type: string,
    input_snapshot: Record<string, unknown>,
    output_text: string
  ): Promise<void> {
    await this.client.from("ai_recommendations").insert({
      recommendation_type,
      input_snapshot,
      output_text,
    });
  }
}
