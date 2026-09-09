"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import {
  createRefreshCoordinator,
  refreshFailureSummary,
  settleRefresh,
  type RefreshCoordinator,
} from "@/lib/workspace-refresh";
import { useToast } from "./toast";
import { friendlyError } from "@/lib/errors";
import { isolateAccount } from "@/lib/offline/queue";

/** Outcome of one workspace refresh round. */
export interface RefreshOutcome {
  /** True when a newer round superseded this one — its results were dropped. */
  stale: boolean;
  /** Dataset keys that failed to load (`[]` when everything is current). */
  failed: string[];
}

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
  /** True while a non-initial refresh round is in flight. */
  refreshing: boolean;
  error: string | null;
  /** Per-dataset refresh failures, keyed by dataset (`{}`). */
  datasetErrors: Record<string, string>;
  /**
   * Set when a write succeeded but the follow-up refresh failed: the UI
   * must show this explicitly instead of pretending everything is current.
   */
  syncWarning: string | null;
  refresh: () => Promise<RefreshOutcome>;
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
  updateSession: (id: string, input: Partial<SessionInput>) => Promise<void>;
  setSessionStatus: (id: string, completed: boolean) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  // resources
  createResource: (input: ResourceInput) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

function emptyWorkspace() {
  return {
    profile: null as Profile | null,
    subjects: [] as Subject[],
    tasks: [] as Task[],
    sessions: [] as StudySession[],
    resources: [] as Resource[],
    recommendations: [] as AiRecommendation[],
  };
}

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datasetErrors, setDatasetErrors] = useState<Record<string, string>>({});
  const [syncWarning, setSyncWarning] = useState<string | null>(null);

  const coordinatorRef = useRef<RefreshCoordinator | null>(null);
  if (!coordinatorRef.current) {
    coordinatorRef.current = createRefreshCoordinator();
  }
  const prevUserIdRef = useRef<string | null>(null);
  const firstLoadRef = useRef(true);

  const clearWorkspace = useCallback(() => {
    const empty = emptyWorkspace();
    setProfile(empty.profile);
    setSubjects(empty.subjects);
    setTasks(empty.tasks);
    setSessions(empty.sessions);
    setResources(empty.resources);
    setRecommendations(empty.recommendations);
  }, []);

  const refresh = useCallback(async (): Promise<RefreshOutcome> => {
    const coordinator = coordinatorRef.current as RefreshCoordinator;
    const token = coordinator.begin();
    setRefreshing(true);
    try {
      let current: AuthUser | null;
      try {
        current = await repo.getUser();
      } catch (e) {
        // Session read failed (expired token, network, …): keep the existing
        // workspace data rather than wiping it, and say so explicitly.
        if (coordinator.isStale(token)) return { stale: true, failed: [] };
        setError(friendlyError(e));
        return { stale: false, failed: ["session"] };
      }
      if (coordinator.isStale(token)) return { stale: true, failed: [] };

      if (!current) {
        prevUserIdRef.current = null;
        setUser(null);
        clearWorkspace();
        setError(null);
        setDatasetErrors({});
        setSyncWarning(null);
        return { stale: false, failed: [] };
      }

      if (
        prevUserIdRef.current !== null &&
        prevUserIdRef.current !== current.id
      ) {
        // Account changed: drop the previous user's data immediately so it
        // can never leak into the new session, even briefly.
        isolateAccount(prevUserIdRef.current, current.id);
        clearWorkspace();
        setDatasetErrors({});
        setSyncWarning(null);
      }
      prevUserIdRef.current = current.id;
      setUser(current);

      const settled = await settleRefresh(coordinator, token, {
        profile: () => repo.getProfile(),
        subjects: () => repo.listSubjects(),
        tasks: () => repo.listTasks(),
        sessions: () => repo.listSessions(),
        resources: () => repo.listResources(),
        recommendations: () => repo.listRecommendations(),
      });
      // Superseded rounds are discarded whole: older responses must never
      // overwrite newer state.
      if (settled.stale) return { stale: true, failed: [] };

      // Each successful dataset updates independently — one failed read no
      // longer blocks the rest.
      const { values, failed } = settled;
      if (!failed.includes("profile")) setProfile(values.profile ?? null);
      if (!failed.includes("subjects")) setSubjects(values.subjects ?? []);
      if (!failed.includes("tasks")) setTasks(values.tasks ?? []);
      if (!failed.includes("sessions")) setSessions(values.sessions ?? []);
      if (!failed.includes("resources")) setResources(values.resources ?? []);
      if (!failed.includes("recommendations")) {
        setRecommendations(values.recommendations ?? []);
      }

      if (failed.length > 0) {
        const summary = refreshFailureSummary(failed);
        setError(summary);
        const detail: Record<string, string> = {};
        for (const key of failed) detail[key] = summary;
        setDatasetErrors(detail);
      } else {
        setError(null);
        setDatasetErrors({});
        setSyncWarning(null);
      }
      return { stale: false, failed };
    } finally {
      if (!coordinator.isStale(token)) {
        setRefreshing(false);
        if (firstLoadRef.current) {
          firstLoadRef.current = false;
          setLoading(false);
        }
      }
    }
  }, [repo, clearWorkspace]);

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
      } catch (e) {
        // The write itself failed: nothing was saved, so surface the error
        // and never claim success. No retry here — retrying writes could
        // create duplicates.
        toast.error(friendlyError(e));
        throw e;
      }
      // The write succeeded. A failed follow-up refresh must neither look
      // like a failed write nor silently pretend everything is current.
      const outcome = await refresh();
      if (outcome.stale) {
        // A newer refresh round is already in flight and owns warning state.
        if (okMessage) toast.success(okMessage);
        return;
      }
      if (outcome.failed.length > 0) {
        const warning =
          "Saved, but some workspace data couldn’t be refreshed just now. Retry to bring everything current — your change is safe.";
        setSyncWarning(warning);
        toast.warning(warning);
        return;
      }
      if (okMessage) toast.success(okMessage);
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
      refreshing,
      error,
      datasetErrors,
      syncWarning,
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
          isolateAccount(prevUserIdRef.current, null);
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
      updateSession: (id, input) =>
        run(async () => {
          await repo.updateSession(id, input);
        }, "Study session updated."),
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
      refreshing,
      error,
      datasetErrors,
      syncWarning,
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
