import type { Repo } from "./types";
import { RepoError, toRepoError } from "./errors";
import { createClient } from "../supabase/client";
import { isOnboarded, validateOnboarding } from "../profile";
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
  // Completion requires name + course + branch (see lib/profile.ts) — a
  // partial/legacy full_name alone must not count as onboarded.
  return { ...row, onboarded: isOnboarded(row) };
}

export class SupabaseRepo implements Repo {
  readonly mode = "supabase" as const;
  private client = createClient();

  /**
   * Resolve the signed-in user id. Auth/session failures throw a categorized
   * `auth` error — they are never reported as "no user".
   */
  private async requireUserId(): Promise<string> {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser();
    if (error) throw toRepoError(error, "Could not verify your session.");
    if (!user) throw new RepoError("auth", "Not signed in");
    return user.id;
  }

  async signUp(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.client.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) throw toRepoError(error, "Sign up failed. Please try again.");
    if (!data.user) {
      // Email confirmation may be required, or the request was throttled —
      // either way this is an auth outcome, not a silent success.
      throw new RepoError(
        "auth",
        "Sign up needs verification. Please check your email, then log in.",
      );
    }
    return { id: data.user.id, email: data.user.email ?? email };
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw toRepoError(error, "Sign in failed. Please try again.");
    if (!data.user)
      throw new RepoError("auth", "Sign in failed. Please try again.");
    return { id: data.user.id, email: data.user.email ?? email };
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw toRepoError(error, "Sign out failed. Please try again.");
  }

  async getUser(): Promise<AuthUser | null> {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser();
    // An error here means the session could not be verified (expired token,
    // network failure, …) — that is an auth failure, not "signed out".
    if (error) throw toRepoError(error, "Could not verify your session.");
    return user ? { id: user.id, email: user.email ?? "" } : null;
  }

  async getProfile(): Promise<Profile | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .maybeSingle();
    if (error) throw toRepoError(error, "Could not load your profile.");
    // No row yet is expected absence (e.g. brand-new account) — not a failure.
    return (data as ProfileRow | null) ? toProfile(data as ProfileRow) : null;
  }

  async upsertProfile(input: ProfileInput): Promise<Profile> {
    const fieldErrors = validateOnboarding(input);
    if (Object.keys(fieldErrors).length > 0) {
      throw new RepoError(
        "validation",
        "Name, course, and branch are required to complete onboarding.",
      );
    }
    const userId = await this.requireUserId();
    const row = {
      id: userId,
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
    if (error) throw toRepoError(error, "Could not save your profile.");
    return toProfile(data as ProfileRow);
  }

  async listSubjects(): Promise<Subject[]> {
    const { data, error } = await this.client
      .from("subjects")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw toRepoError(error, "Could not load your subjects.");
    return (data as Subject[]) ?? [];
  }

  async createSubject(input: SubjectInput): Promise<Subject> {
    if (!input.name?.trim()) {
      throw new RepoError("validation", "Subject name is required.");
    }
    const user_id = await this.requireUserId();
    const { data, error } = await this.client
      .from("subjects")
      .insert({
        user_id,
        name: input.name.trim(),
        code: input.code?.trim() ?? "",
        color: input.color ?? "#3b62f6",
      })
      .select("*")
      .single();
    if (error) throw toRepoError(error, "Could not create the subject.");
    return data as Subject;
  }

  async updateSubject(
    id: string,
    input: Partial<SubjectInput>,
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
    // Zero matching rows surface as PGRST116 → categorized `not-found`.
    if (error) throw toRepoError(error, "Could not update the subject.");
    return data as Subject;
  }

  async deleteSubject(id: string): Promise<void> {
    // Detach children first (FKs are ON DELETE SET NULL), then delete.
    // Detach failures are surfaced — silently orphaning student work is worse.
    const detachTasks = await this.client
      .from("tasks")
      .update({ subject_id: null })
      .eq("subject_id", id);
    if (detachTasks.error)
      throw toRepoError(detachTasks.error, "Could not delete the subject.");
    const detachSessions = await this.client
      .from("study_sessions")
      .update({ subject_id: null })
      .eq("subject_id", id);
    if (detachSessions.error)
      throw toRepoError(detachSessions.error, "Could not delete the subject.");
    const detachResources = await this.client
      .from("resources")
      .update({ subject_id: null })
      .eq("subject_id", id);
    if (detachResources.error)
      throw toRepoError(detachResources.error, "Could not delete the subject.");
    const { data, error } = await this.client
      .from("subjects")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw toRepoError(error, "Could not delete the subject.");
    if (!data || data.length === 0) {
      throw new RepoError("not-found", "Subject not found");
    }
  }

  async listTasks(): Promise<Task[]> {
    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw toRepoError(error, "Could not load your tasks.");
    return (data as Task[]) ?? [];
  }

  async createTask(input: TaskInput): Promise<Task> {
    if (!input.title?.trim()) {
      throw new RepoError("validation", "Task title is required.");
    }
    const user_id = await this.requireUserId();
    const { data, error } = await this.client
      .from("tasks")
      .insert({
        user_id,
        subject_id: input.subject_id,
        title: input.title.trim(),
        description: input.description?.trim() ?? "",
        task_type: input.task_type,
        priority: input.priority,
        due_date: input.due_date,
      })
      .select("*")
      .single();
    if (error) throw toRepoError(error, "Could not create the task.");
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
    if (error) throw toRepoError(error, "Could not update the task.");
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
    if (error) throw toRepoError(error, "Could not update the task.");
    return data as Task;
  }

  async deleteTask(id: string): Promise<void> {
    const { data, error } = await this.client
      .from("tasks")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw toRepoError(error, "Could not delete the task.");
    if (!data || data.length === 0) {
      throw new RepoError("not-found", "Task not found");
    }
  }

  async listSessions(): Promise<StudySession[]> {
    const { data, error } = await this.client
      .from("study_sessions")
      .select("*")
      .order("planned_date", { ascending: true });
    if (error) throw toRepoError(error, "Could not load your study sessions.");
    return (data as StudySession[]) ?? [];
  }

  async createSession(input: SessionInput): Promise<StudySession> {
    if (!input.title?.trim()) {
      throw new RepoError("validation", "Session title is required.");
    }
    const user_id = await this.requireUserId();
    const { data, error } = await this.client
      .from("study_sessions")
      .insert({
        user_id,
        subject_id: input.subject_id,
        title: input.title.trim(),
        planned_date: input.planned_date,
        duration_minutes: input.duration_minutes,
      })
      .select("*")
      .single();
    if (error) throw toRepoError(error, "Could not plan the study session.");
    return data as StudySession;
  }

  async setSessionStatus(
    id: string,
    completed: boolean,
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
    if (error) throw toRepoError(error, "Could not update the study session.");
    return data as StudySession;
  }

  async deleteSession(id: string): Promise<void> {
    const { data, error } = await this.client
      .from("study_sessions")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw toRepoError(error, "Could not delete the study session.");
    if (!data || data.length === 0) {
      throw new RepoError("not-found", "Study session not found");
    }
  }

  async listResources(): Promise<Resource[]> {
    const { data, error } = await this.client
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw toRepoError(error, "Could not load your resources.");
    return (data as Resource[]) ?? [];
  }

  async createResource(input: ResourceInput): Promise<Resource> {
    if (!input.title?.trim()) {
      throw new RepoError("validation", "Resource title is required.");
    }
    const user_id = await this.requireUserId();
    const { data, error } = await this.client
      .from("resources")
      .insert({
        user_id,
        subject_id: input.subject_id,
        title: input.title.trim(),
        content: input.content?.trim() ?? "",
        resource_url: input.resource_url?.trim() ?? "",
        resource_type: input.resource_type,
      })
      .select("*")
      .single();
    if (error) throw toRepoError(error, "Could not save the resource.");
    return data as Resource;
  }

  async deleteResource(id: string): Promise<void> {
    const { data, error } = await this.client
      .from("resources")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw toRepoError(error, "Could not delete the resource.");
    if (!data || data.length === 0) {
      throw new RepoError("not-found", "Resource not found");
    }
  }

  async listRecommendations(): Promise<AiRecommendation[]> {
    const { data, error } = await this.client
      .from("ai_recommendations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw toRepoError(error, "Could not load recommendations.");
    return (data as AiRecommendation[]) ?? [];
  }

  async saveRecommendation(
    recommendation_type: string,
    input_snapshot: Record<string, unknown>,
    output_text: string,
  ): Promise<void> {
    const user_id = await this.requireUserId();
    const { error } = await this.client.from("ai_recommendations").insert({
      user_id,
      recommendation_type,
      input_snapshot,
      output_text,
    });
    // Callers treat history as best-effort and catch this explicitly; the
    // repo itself must not silently swallow a failed write.
    if (error) throw toRepoError(error, "Could not save the recommendation.");
  }
}
