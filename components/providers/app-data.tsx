"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getRepo, isSupabaseConfigured } from "@/lib/repo";
import type { Repo } from "@/lib/repo";
import type {
  AiRecommendation,
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
} from "@/lib/types";
import { useToast } from "./toast";
import { friendlyError } from "@/lib/errors";

interface AppDataValue {
  repo: Repo;
  mode: "supabase" | "demo";
  user: AuthUser | null;
  profile: Profile | null;
  subjects: Subject[];
  tasks: Task[];
  sessions: StudySession[];
  resources: Resource[];
  recommendations: AiRecommendation[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  // auth
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  // profile
  saveProfile: (input: ProfileInput) => Promise<void>;
  // subjects
  createSubject: (input: SubjectInput) => Promise<void>;
  updateSubject: (id: string, input: Partial<SubjectInput>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  // tasks
  createTask: (input: TaskInput) => Promise<void>;
  updateTask: (id: string, input: Partial<TaskInput>) => Promise<void>;
  setTaskStatus: (id: string, completed: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  // sessions
  createSession: (input: SessionInput) => Promise<void>;
  setSessionStatus: (id: string, completed: boolean) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  // resources
  createResource: (input: ResourceInput) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const repo = getRepo();
  const toast = useToast();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const u = await repo.getUser();
      setUser(u);
      if (!u) {
        setProfile(null);
        setSubjects([]);
        setTasks([]);
        setSessions([]);
        setResources([]);
        setRecommendations([]);
        setLoading(false);
        setError(null);
        return;
      }
      const [p, s, t, se, r, rec] = await Promise.all([
        repo.getProfile(),
        repo.listSubjects(),
        repo.listTasks(),
        repo.listSessions(),
        repo.listResources(),
        repo.listRecommendations(),
      ]);
      setProfile(p);
      setSubjects(s);
      setTasks(t);
      setSessions(se);
      setResources(r);
      setRecommendations(rec);
      setError(null);
    } catch {
      setError(
        "We couldn’t refresh your workspace. Your saved work is safe. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    refresh();
    // Re-check session when the tab regains focus (e.g. after sign-out elsewhere).
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const run = useCallback(
    async (fn: () => Promise<unknown>, okMessage?: string) => {
      try {
        await fn();
        await refresh();
        if (okMessage) toast.success(okMessage);
      } catch (e) {
        const message = friendlyError(e);
        toast.error(message);
        throw e;
      }
    },
    [refresh, toast],
  );

  const value = useMemo<AppDataValue>(
    () => ({
      repo,
      mode: isSupabaseConfigured ? "supabase" : "demo",
      user,
      profile,
      subjects,
      tasks,
      sessions,
      resources,
      recommendations,
      loading,
      error,
      refresh,
      signUp: (email, password) =>
        run(async () => {
          await repo.signUp(email, password);
        }, "Account created. Welcome to EduNexus!"),
      signIn: (email, password) =>
        run(async () => {
          await repo.signIn(email, password);
        }, "Welcome back!"),
      signOut: () =>
        run(async () => {
          await repo.signOut();
        }, "Signed out."),
      saveProfile: (input) =>
        run(async () => {
          await repo.upsertProfile(input);
        }, "Profile saved."),
      createSubject: (input) =>
        run(async () => {
          await repo.createSubject(input);
        }, "Subject added."),
      updateSubject: (id, input) =>
        run(async () => {
          await repo.updateSubject(id, input);
        }, "Subject updated."),
      deleteSubject: (id) =>
        run(async () => {
          await repo.deleteSubject(id);
        }, "Subject deleted."),
      createTask: (input) =>
        run(async () => {
          await repo.createTask(input);
        }, "Task added."),
      updateTask: (id, input) =>
        run(async () => {
          await repo.updateTask(id, input);
        }, "Task updated."),
      setTaskStatus: (id, completed) =>
        run(
          async () => {
            await repo.setTaskStatus(id, completed);
          },
          completed ? "Task completed. Nice work!" : "Task marked pending.",
        ),
      deleteTask: (id) =>
        run(async () => {
          await repo.deleteTask(id);
        }, "Task deleted."),
      createSession: (input) =>
        run(async () => {
          await repo.createSession(input);
        }, "Study session planned."),
      setSessionStatus: (id, completed) =>
        run(
          async () => {
            await repo.setSessionStatus(id, completed);
          },
          completed ? "Session completed!" : "Session moved back to planned.",
        ),
      deleteSession: (id) =>
        run(async () => {
          await repo.deleteSession(id);
        }, "Session deleted."),
      createResource: (input) =>
        run(async () => {
          await repo.createResource(input);
        }, "Resource saved."),
      deleteResource: (id) =>
        run(async () => {
          await repo.deleteResource(id);
        }, "Resource deleted."),
    }),
    [
      repo,
      user,
      profile,
      subjects,
      tasks,
      sessions,
      resources,
      recommendations,
      loading,
      error,
      refresh,
      run,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useApp(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useApp must be used within AppDataProvider");
  return ctx;
}
