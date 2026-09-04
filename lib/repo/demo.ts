import type { Repo } from "./types";
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
import { nowIso, uid } from "../utils";
import { clearDemoCookie, setDemoCookie } from "../session-cookie";

// ── Demo backend: localStorage. Zero-config, fully clickable, NOT for
//    production — set NEXT_PUBLIC_SUPABASE_* env vars to use Supabase. ────────

const USERS_KEY = "edunexus_demo_users";
const SESSION_KEY = "edunexus_demo_session";

interface DemoUser {
  id: string;
  email: string;
  passHash: string;
}

interface DemoDb {
  profile: Profile | null;
  subjects: Subject[];
  tasks: Task[];
  sessions: StudySession[];
  resources: Resource[];
  recommendations: AiRecommendation[];
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function hashPassword(pw: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(pw)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function emptyDb(): DemoDb {
  return {
    profile: null,
    subjects: [],
    tasks: [],
    sessions: [],
    resources: [],
    recommendations: [],
  };
}

export class DemoRepo implements Repo {
  readonly mode = "demo" as const;

  private dbKey(userId: string) {
    return `edunexus_db_${userId}`;
  }

  private currentUser(): AuthUser {
    const id = read<string | null>(SESSION_KEY, null);
    const users = read<DemoUser[]>(USERS_KEY, []);
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error("Not signed in");
    return { id: user.id, email: user.email };
  }

  private loadDb(): DemoDb {
    const { id } = this.currentUser();
    return read<DemoDb>(this.dbKey(id), emptyDb());
  }

  private saveDb(db: DemoDb) {
    const { id } = this.currentUser();
    write(this.dbKey(id), db);
  }

  async signUp(email: string, password: string): Promise<AuthUser> {
    const clean = email.trim().toLowerCase();
    const users = read<DemoUser[]>(USERS_KEY, []);
    if (users.some((u) => u.email === clean)) {
      throw new Error("An account with this email already exists.");
    }
    const user: DemoUser = {
      id: uid(),
      email: clean,
      passHash: await hashPassword(password),
    };
    users.push(user);
    write(USERS_KEY, users);
    write(SESSION_KEY, user.id);
    setDemoCookie();
    return { id: user.id, email: user.email };
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const clean = email.trim().toLowerCase();
    const users = read<DemoUser[]>(USERS_KEY, []);
    const user = users.find((u) => u.email === clean);
    if (!user || user.passHash !== (await hashPassword(password))) {
      throw new Error("Invalid email or password.");
    }
    write(SESSION_KEY, user.id);
    setDemoCookie();
    return { id: user.id, email: user.email };
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
    clearDemoCookie();
  }

  async getUser(): Promise<AuthUser | null> {
    const id = read<string | null>(SESSION_KEY, null);
    if (!id) return null;
    const users = read<DemoUser[]>(USERS_KEY, []);
    const user = users.find((u) => u.id === id);
    return user ? { id: user.id, email: user.email } : null;
  }

  async getProfile(): Promise<Profile | null> {
    return this.loadDb().profile;
  }

  async upsertProfile(input: ProfileInput): Promise<Profile> {
    const me = this.currentUser();
    const db = this.loadDb();
    const ts = nowIso();
    const profile: Profile = {
      id: me.id,
      full_name: input.full_name.trim(),
      course: input.course.trim(),
      branch: input.branch.trim(),
      semester: input.semester,
      year_of_study: input.year_of_study,
      goals: input.goals.trim(),
      onboarded: input.onboarded ?? true,
      created_at: db.profile?.created_at ?? ts,
      updated_at: ts,
    };
    db.profile = profile;
    this.saveDb(db);
    return profile;
  }

  async listSubjects(): Promise<Subject[]> {
    return this.loadDb().subjects;
  }

  async createSubject(input: SubjectInput): Promise<Subject> {
    const me = this.currentUser();
    const db = this.loadDb();
    const ts = nowIso();
    const subject: Subject = {
      id: uid(),
      user_id: me.id,
      name: input.name.trim(),
      code: input.code?.trim() ?? "",
      color: input.color ?? "#3b62f6",
      created_at: ts,
      updated_at: ts,
    };
    db.subjects.push(subject);
    this.saveDb(db);
    return subject;
  }

  async updateSubject(
    id: string,
    input: Partial<SubjectInput>
  ): Promise<Subject> {
    const db = this.loadDb();
    const s = db.subjects.find((x) => x.id === id);
    if (!s) throw new Error("Subject not found");
    if (input.name !== undefined) s.name = input.name.trim();
    if (input.code !== undefined) s.code = input.code.trim();
    if (input.color !== undefined) s.color = input.color;
    s.updated_at = nowIso();
    this.saveDb(db);
    return s;
  }

  async deleteSubject(id: string): Promise<void> {
    const db = this.loadDb();
    db.subjects = db.subjects.filter((s) => s.id !== id);
    // Detach children rather than silently deleting student work.
    db.tasks.forEach((t) => {
      if (t.subject_id === id) t.subject_id = null;
    });
    db.sessions.forEach((s) => {
      if (s.subject_id === id) s.subject_id = null;
    });
    db.resources.forEach((r) => {
      if (r.subject_id === id) r.subject_id = null;
    });
    this.saveDb(db);
  }

  async listTasks(): Promise<Task[]> {
    return this.loadDb().tasks;
  }

  async createTask(input: TaskInput): Promise<Task> {
    const me = this.currentUser();
    const db = this.loadDb();
    const ts = nowIso();
    const task: Task = {
      id: uid(),
      user_id: me.id,
      subject_id: input.subject_id,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      task_type: input.task_type,
      priority: input.priority,
      due_date: input.due_date,
      status: "pending",
      completed_at: null,
      created_at: ts,
      updated_at: ts,
    };
    db.tasks.push(task);
    this.saveDb(db);
    return task;
  }

  async updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
    const db = this.loadDb();
    const t = db.tasks.find((x) => x.id === id);
    if (!t) throw new Error("Task not found");
    if (input.title !== undefined) t.title = input.title.trim();
    if (input.description !== undefined) t.description = input.description.trim();
    if (input.task_type !== undefined) t.task_type = input.task_type;
    if (input.priority !== undefined) t.priority = input.priority;
    if (input.due_date !== undefined) t.due_date = input.due_date;
    if (input.subject_id !== undefined) t.subject_id = input.subject_id;
    t.updated_at = nowIso();
    this.saveDb(db);
    return t;
  }

  async setTaskStatus(id: string, completed: boolean): Promise<Task> {
    const db = this.loadDb();
    const t = db.tasks.find((x) => x.id === id);
    if (!t) throw new Error("Task not found");
    t.status = completed ? "completed" : "pending";
    t.completed_at = completed ? nowIso() : null;
    t.updated_at = nowIso();
    this.saveDb(db);
    return t;
  }

  async deleteTask(id: string): Promise<void> {
    const db = this.loadDb();
    db.tasks = db.tasks.filter((t) => t.id !== id);
    this.saveDb(db);
  }

  async listSessions(): Promise<StudySession[]> {
    return this.loadDb().sessions;
  }

  async createSession(input: SessionInput): Promise<StudySession> {
    const me = this.currentUser();
    const db = this.loadDb();
    const ts = nowIso();
    const session: StudySession = {
      id: uid(),
      user_id: me.id,
      subject_id: input.subject_id,
      title: input.title.trim(),
      planned_date: input.planned_date,
      duration_minutes: input.duration_minutes,
      status: "planned",
      completed_at: null,
      created_at: ts,
      updated_at: ts,
    };
    db.sessions.push(session);
    this.saveDb(db);
    return session;
  }

  async setSessionStatus(
    id: string,
    completed: boolean
  ): Promise<StudySession> {
    const db = this.loadDb();
    const s = db.sessions.find((x) => x.id === id);
    if (!s) throw new Error("Study session not found");
    s.status = completed ? "completed" : "planned";
    s.completed_at = completed ? nowIso() : null;
    s.updated_at = nowIso();
    this.saveDb(db);
    return s;
  }

  async deleteSession(id: string): Promise<void> {
    const db = this.loadDb();
    db.sessions = db.sessions.filter((s) => s.id !== id);
    this.saveDb(db);
  }

  async listResources(): Promise<Resource[]> {
    return this.loadDb().resources;
  }

  async createResource(input: ResourceInput): Promise<Resource> {
    const me = this.currentUser();
    const db = this.loadDb();
    const ts = nowIso();
    const resource: Resource = {
      id: uid(),
      user_id: me.id,
      subject_id: input.subject_id,
      title: input.title.trim(),
      content: input.content?.trim() ?? "",
      resource_url: input.resource_url?.trim() ?? "",
      resource_type: input.resource_type,
      created_at: ts,
      updated_at: ts,
    };
    db.resources.push(resource);
    this.saveDb(db);
    return resource;
  }

  async deleteResource(id: string): Promise<void> {
    const db = this.loadDb();
    db.resources = db.resources.filter((r) => r.id !== id);
    this.saveDb(db);
  }

  async listRecommendations(): Promise<AiRecommendation[]> {
    return this.loadDb().recommendations;
  }

  async saveRecommendation(
    recommendation_type: string,
    input_snapshot: Record<string, unknown>,
    output_text: string
  ): Promise<void> {
    const me = this.currentUser();
    const db = this.loadDb();
    db.recommendations.unshift({
      id: uid(),
      user_id: me.id,
      recommendation_type,
      input_snapshot,
      output_text,
      created_at: nowIso(),
    });
    db.recommendations = db.recommendations.slice(0, 20);
    this.saveDb(db);
  }
}
