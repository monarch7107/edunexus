"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { ChangeSetView } from "@/components/ai/change-set";
import { ApprovalPanel } from "@/components/ai/approval-panel";
import { ExecutionResult } from "@/components/ai/execution-result";
import { AgentStatus } from "@/components/ai/agent-status";
import { ActivityPanel } from "@/components/ai/activity-panel";
import { RunStatusBadge } from "@/components/ai/run-status-badge";
import { useApp } from "@/components/providers/app-data";
import { isSupabaseConfigured } from "@/lib/repo";
import type { GatewayResponse } from "@/lib/ai/types";
import {
  GatewayHttpError,
  applyVerifiedChangesLocally,
  decideChangeSet,
  editChangeSetItems,
  loadChangeSet,
} from "@/lib/ai/client";
import {
  listAgentRuns,
  recordAgentRun,
  type AgentHistoryEntry,
} from "@/lib/ai/activity-store";
import { cn } from "@/lib/utils";

export default function ApprovalsPage() {
  const {
    user,
    subjects,
    sessions,
    loading,
    refresh,
    createSession,
    updateSession,
    deleteSession,
  } = useApp();
  const [runs, setRuns] = useState<AgentHistoryEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<GatewayResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingSet, setLoadingSet] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const history = listAgentRuns(user?.id);
    setRuns(history);
    const awaiting = history.find(
      (r) => r.status === "waiting_approval" && r.changeSetId,
    );
    setSelectedId(awaiting?.changeSetId ?? history[0]?.changeSetId ?? null);
  }, [user?.id]);

  const reload = useCallback(
    async (changeSetId: string) => {
      setLoadingSet(true);
      setError(null);
      setEditing(false);
      try {
        const data = await loadChangeSet(changeSetId);
        setLoaded(data);
      } catch (e) {
        setLoaded(null);
        setError(
          e instanceof GatewayHttpError
            ? e.message
            : "We couldn’t connect. Please try again.",
        );
      } finally {
        setLoadingSet(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedId) void reload(selectedId);
    else setLoaded(null);
  }, [selectedId, reload]);

  function afterResponse(data: GatewayResponse) {
    setLoaded(data);
    setEditing(false);
    recordAgentRun(user?.id, data);
    setRuns(listAgentRuns(user?.id));
  }

  async function decide(decision: "approved" | "rejected") {
    if (!loaded?.changeSetId) return;
    setBusy(true);
    setError(null);
    try {
      const data = await decideChangeSet(loaded.changeSetId, decision);
      if (decision === "approved" && data.status === "completed") {
        if (!isSupabaseConfigured) {
          await applyVerifiedChangesLocally(data.changes, {
            createSession,
            updateSession,
            deleteSession,
          });
        }
        await refresh();
      }
      afterResponse(data);
    } catch (e) {
      setError(
        e instanceof GatewayHttpError
          ? e.message
          : "We couldn’t finish that action.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveEdits() {
    if (!loaded?.changeSetId) return;
    setBusy(true);
    setError(null);
    try {
      const data = await editChangeSetItems(
        loaded.changeSetId,
        loaded.changes.map((c) => ({ id: c.id, payload: c.payload })),
      );
      afterResponse(data);
    } catch (e) {
      setError(
        e instanceof GatewayHttpError
          ? e.message
          : "We couldn’t finish that action.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label="Opening your approval center…" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Intelligence / Approvals"
        title="Approval Center"
        description="Review each proposal before anything is written. Editing a proposal always requires a fresh approval."
        action={
          <ButtonLink href="/ai" size="sm" variant="outline">
            New proposal <ArrowRight className="size-3.5" aria-hidden />
          </ButtonLink>
        }
      />

      {runs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardCheck className="size-6" aria-hidden />}
            title="No proposals yet."
            description="When the Planning Agent proposes schedule changes, they will wait for you here — nothing runs without your decision."
            action={
              <ButtonLink href="/ai">
                Open AI Command Center <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[1fr_.85fr]">
          <Card className="min-w-0">
            <CardHeader
              title="Proposal review"
              description={
                loaded?.summary ||
                "Current state, proposed state, and the reason — for every change."
              }
              action={
                loaded ? <RunStatusBadge status={loaded.status} /> : undefined
              }
            />
            <CardContent className="!gap-4">
              {loadingSet && (
                <p className="text-xs text-muted" role="status">
                  Loading proposal…
                </p>
              )}
              {error && (
                <p className="text-xs text-red-700" role="alert">
                  {error}{" "}
                  {selectedId && (
                    <button
                      type="button"
                      className="font-semibold underline underline-offset-2"
                      onClick={() => void reload(selectedId)}
                    >
                      Try again
                    </button>
                  )}
                </p>
              )}
              {loaded && (
                <>
                  <AgentStatus status={loaded.status} />
                  <ActivityPanel response={loaded} />
                  {loaded.status === "waiting_approval" && (
                    <>
                      <ChangeSetView
                        response={loaded}
                        editing={editing}
                        onChange={(next) => setLoaded(next)}
                        sessions={sessions}
                        subjects={subjects}
                      />
                      {editing && (
                        <p className="text-[11px] text-amber-800" role="status">
                          Editing invalidates the previous proposal — you’ll review
                          the updated changes before anything can run.
                        </p>
                      )}
                      <ApprovalPanel
                        busy={busy}
                        editing={editing}
                        onApprove={() => decide("approved")}
                        onReject={() => decide("rejected")}
                        onEdit={() => setEditing(true)}
                        onSaveEdits={saveEdits}
                      />
                    </>
                  )}
                  {(loaded.status === "completed" ||
                    loaded.status === "failed" ||
                    loaded.status === "cancelled") && (
                    <ExecutionResult response={loaded} />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader
              title="Proposals"
              description="Newest first, on this device."
            />
            <CardContent className="!gap-2">
              <ul className="space-y-2">
                {runs
                  .filter((r) => r.changeSetId)
                  .map((run) => {
                    const active = run.changeSetId === selectedId;
                    return (
                      <li key={run.runId}>
                        <button
                          type="button"
                          aria-current={active ? "true" : undefined}
                          onClick={() => setSelectedId(run.changeSetId)}
                          className={cn(
                            "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                            active
                              ? "border-brand-300 bg-brand-50"
                              : "border-line bg-surface hover:border-slate-300 hover:bg-slate-50/60",
                          )}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-semibold">
                              {run.summary}
                            </span>
                            <RunStatusBadge status={run.status} />
                          </span>
                          <span className="mt-1 block text-[11px] text-muted">
                            {run.proposed} proposed · {run.executed} executed ·{" "}
                            {run.verified} verified ·{" "}
                            {new Date(run.at).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
              <p className="text-[11px] leading-relaxed text-muted">
                Prefer the full story?{" "}
                <Link href="/ai/activity" className="text-link">
                  Open Agent Activity <ArrowRight className="size-3 w-3" aria-hidden />
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
