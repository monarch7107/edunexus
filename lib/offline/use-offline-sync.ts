"use client";

/**
 * Browser glue between the typed offline queue and the sync engine.
 *
 * Responsibilities:
 *   - expose `online` + `pending`/`conflict` counts for the connectivity UI;
 *   - when the connection returns (or the tab regains focus), flush the current
 *     account's queue through `syncQueue`, then refresh the workspace.
 *
 * It NEVER enqueues or flushes AI planning, and it only ever acts on the
 * signed-in user's own queue (RLS is the real gate; this is defence in depth).
 */
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/components/providers/app-data";
import {
  clearSynced,
  loadQueue,
  mutationsForUser,
  saveQueue,
  type Connectivity,
} from "./queue";
import { syncQueue, type SyncDeps } from "./sync";

export interface OfflineSyncState {
  online: boolean;
  state: Connectivity;
  pending: number;
  conflicts: number;
  syncNow: () => Promise<void>;
}

export function useOfflineSync(): OfflineSyncState {
  const app = useApp();
  const userId = app.user?.id ?? "";
  const [online, setOnline] = useState(true);
  const [state, setState] = useState<Connectivity>("online");
  const [pending, setPending] = useState(0);
  const [conflicts, setConflicts] = useState(0);

  const recount = useCallback(() => {
    if (!userId) {
      setPending(0);
      setConflicts(0);
      return;
    }
    const q = loadQueue(userId);
    setPending(q.filter((i) => i.status === "pending").length);
    setConflicts(q.filter((i) => i.status === "conflict" || i.status === "failed").length);
  }, [userId]);

  const buildDeps = useCallback((): SyncDeps => {
    const repo = app.repo;
    return {
      createTask: (input) => repo.createTask(input),
      updateTask: (id, input) => repo.updateTask(id, input),
      setTaskStatus: (id, completed) => repo.setTaskStatus(id, completed),
      createSession: (input) => repo.createSession(input),
      deleteSession: (id) => repo.deleteSession(id),
      async currentState(kind, id) {
        // Read the live server value for the entity so conflicts are detected.
        if (kind === "deleteSession") {
          const s = (await repo.listSessions()).find((x) => x.id === id);
          return s ? { title: s.title, planned_date: s.planned_date, status: s.status } : null;
        }
        const t = (await repo.listTasks()).find((x) => x.id === id);
        return t ? { title: t.title, status: t.status, priority: t.priority } : null;
      },
    };
  }, [app.repo]);

  const syncNow = useCallback(async () => {
    if (!userId || typeof navigator !== "undefined" && !navigator.onLine) return;
    const mine = mutationsForUser(userId).filter((i) => i.status === "pending");
    if (mine.length === 0) return;
    setState("syncing");
    try {
      const result = await syncQueue(userId, loadQueue(userId), buildDeps());
      // Persist the post-sync queue (synced removed; conflicts/failures kept).
      const syncedSet = new Set(result.synced);
      const merged = loadQueue(userId)
        .map((i) => (syncedSet.has(i.id) ? { ...i, status: "synced" as const } : i))
        .map((i) => result.remaining.find((r) => r.id === i.id) ?? i);
      saveQueue(userId, merged);
      clearSynced(userId, merged);
      await app.refresh();
    } finally {
      recount();
      setState(hasIssues(userId) ? "error" : "online");
    }
  }, [userId, buildDeps, app, recount]);

  useEffect(() => {
    const update = () => {
      const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;
      setOnline(isOnline);
      recount();
      if (isOnline) {
        // Reflect connectivity immediately (error if anything still needs
        // attention, otherwise online), then flush any queued mutations.
        setState(hasIssues(userId) ? "error" : "online");
        void syncNow();
      } else {
        setState("offline");
      }
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener("focus", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("focus", update);
    };
  }, [recount, syncNow]);

  return { online, state, pending, conflicts, syncNow };
}

/** True when the current queue has any conflict/failed item needing attention. */
function hasIssues(userId: string): boolean {
  return loadQueue(userId).some((i) => i.status === "conflict" || i.status === "failed");
}
