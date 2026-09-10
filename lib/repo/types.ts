import type {
  AuthUser,
  Profile,
  ProfileInput,
  Resource,
  ResourceInput,
  StudySession,
  SessionInput,
  Subject,
  SubjectInput,
  Task,
  TaskInput,
  AiRecommendation,
} from "../types";

/**
 * One interface, two implementations:
 *  - SupabaseRepo: Postgres + Auth + RLS (production)
 *  - DemoRepo:     browser localStorage (zero-config demo / local dev)
 * Every page/hook talks only to this interface.
 */
export interface Repo {
  readonly mode: "supabase" | "demo";

  // auth
  signUp(email: string, password: string): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  getUser(): Promise<AuthUser | null>;

  // profile
  getProfile(): Promise<Profile | null>;
  upsertProfile(input: ProfileInput): Promise<Profile>;

  // subjects
  listSubjects(): Promise<Subject[]>;
  createSubject(input: SubjectInput): Promise<Subject>;
  updateSubject(id: string, input: Partial<SubjectInput>): Promise<Subject>;
  deleteSubject(id: string): Promise<void>;

  // tasks
  listTasks(): Promise<Task[]>;
  createTask(input: TaskInput): Promise<Task>;
  updateTask(id: string, input: Partial<TaskInput>): Promise<Task>;
  setTaskStatus(id: string, completed: boolean): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // study sessions
  listSessions(): Promise<StudySession[]>;
  createSession(input: SessionInput): Promise<StudySession>;
  updateSession(id: string, input: Partial<SessionInput>): Promise<StudySession>;
  setSessionStatus(id: string, completed: boolean): Promise<StudySession>;
  deleteSession(id: string): Promise<void>;

  // resources
  listResources(): Promise<Resource[]>;
  createResource(input: ResourceInput): Promise<Resource>;
  deleteResource(id: string): Promise<void>;

  // ai recommendations (best-effort history)
  listRecommendations(): Promise<AiRecommendation[]>;
  saveRecommendation(
    recommendation_type: string,
    input_snapshot: Record<string, unknown>,
    output_text: string
  ): Promise<void>;
}
