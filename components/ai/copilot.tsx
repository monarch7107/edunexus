"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { useApp } from "@/components/providers/app-data";
import { isSupabaseConfigured } from "@/lib/repo";
import type { GatewayResponse } from "@/lib/ai/types";
import {
  GatewayHttpError,
  applyVerifiedChangesLocally,
  decideChangeSet,
  editChangeSetItems,
  requestPlan,
} from "@/lib/ai/client";
import { recordAgentRun } from "@/lib/ai/activity-store";
import { AgentStatus } from "./agent-status";
import { AgentTimeline } from "./agent-timeline";
import { ChangeSetView } from "./change-set";
import { ApprovalPanel } from "./approval-panel";
import { ExecutionResult } from "./execution-result";
import { ActivityPanel } from "./activity-panel";

const STEPS = [
  "Understanding your request…",
  "Gathering academic context…",
  "Planning Agent analyzing your schedule…",
];

export function ScheduleCopilot({
  onResponse,
  surface = "planner",
}: {
  /** Lets host pages (Adaptive Planner) mirror the live proposal. */
  onResponse?: (response: GatewayResponse | null) => void;
  /** Where the run was started — recorded in the run metadata. */
  surface?: string;
}) {
  const {
    user,
    subjects,
    tasks,
    sessions,
    profile,
    refresh,
    createSession,
    updateSession,
    deleteSession,
  } = useApp();
  const [message, setMessage] = useState(
    "I have three exams next week. Fix my study schedule.",
  );
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState<number | null>(null);
  const [response, setResponse] = useState<GatewayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState(false);

  function store(next: GatewayResponse | null) {
    setResponse(next);
    onResponse?.(next);
    if (next) recordAgentRun(user?.id, next);
  }

  async function submit() {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOfflineNotice(true);
      setError(null);
      return;
    }
    setOfflineNotice(false);
    setBusy(true);
    setError(null);
    store(null);
    setEditing(false);
    setStep(STEPS[0]);
    setProgressStep(0);
    try {
      await new Promise((r) => setTimeout(r, 200));
      setStep(STEPS[1]);
      setProgressStep(1);
      const data = await requestPlan({
        message,
        surface,
        snapshot: {
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
          })),
          sessions: sessions.map((s) => ({
            id: s.id,
            subject_id: s.subject_id,
            title: s.title,
            planned_date: s.planned_date,
            duration_minutes: s.duration_minutes,
            status: s.status,
          })),
        },
      });
      setStep(STEPS[2]);
      setProgressStep(2);
      store(data);
    } catch (e) {
      if (e instanceof GatewayHttpError) {
        setError(
          e.message === "We couldn’t finish that action."
            ? "Could not plan your schedule."
            : e.message,
        );
      } else {
        setError("We couldn’t connect. Please try again.");
      }
    } finally {
      setBusy(false);
      setStep(null);
      setProgressStep(null);
    }
  }

  async function decide(decision: "approved" | "rejected") {
    if (!response?.changeSetId) return;
    setBusy(true);
    setError(null);
    try {
      const data = await decideChangeSet(response.changeSetId, decision);
      if (decision === "approved" && data.status === "completed") {
        // Demo mode: server memory cannot reach the browser's localStorage, so
        // the UI applies the verified changes locally. Supabase mode: the
        // authorized tools already wrote through the RLS-backed server client;
        // applying again client-side would duplicate sessions.
        if (!isSupabaseConfigured) {
          await applyVerifiedChangesLocally(data.changes, {
            createSession,
            updateSession,
            deleteSession,
          });
        }
        await refresh();
      }
      store(data);
      setEditing(false);
    } catch (e) {
      if (e instanceof GatewayHttpError) {
        setError(
          e.message === "We couldn’t finish that action."
            ? "Approval failed."
            : e.message,
        );
      } else {
        setError("We couldn’t finish that action.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveEdits() {
    if (!response?.changeSetId) return;
    setBusy(true);
    setError(null);
    try {
      const data = await editChangeSetItems(
        response.changeSetId,
        response.changes.map((c) => ({ id: c.id, payload: c.payload })),
      );
      store(data);
      setEditing(false);
    } catch (e) {
      if (e instanceof GatewayHttpError) {
        setError(
          e.message === "We couldn’t finish that action."
            ? "Could not save edits."
            : e.message,
        );
      } else {
        setError("We couldn’t finish that action.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="relative overflow-hidden !border-[rgb(var(--gold)/0.28)] !bg-ai-soft/50">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: "rgb(var(--gold))" }}
      />
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-ai" />
        <h2 className="section-title">Optimize my week</h2>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-muted">
        Planning Agent proposes a change set. Nothing is written until you approve. The LLM cannot authorize itself.
      </p>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Input
          aria-label="Schedule request"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="!text-xs"
        />
        <Button
          size="sm"
          type="submit"
          loading={busy}
          loadingLabel="Planning…"
          className="shrink-0"
        >
          Optimize
        </Button>
      </form>
      {offlineNotice && (
        <p className="mt-3 text-[11px] text-amber-800" role="status">
          You’re offline. AI planning will be available when you reconnect. Changes will sync when you’re back online.
        </p>
      )}
      {(step || busy) && (
        <div className="mt-4">
          <AgentTimeline status={null} progressStep={progressStep ?? 0} />
          {step && (
            <p className="mt-3 text-[11px] text-muted" role="status">{step}</p>
          )}
        </div>
      )}
      {error && (
        <p className="mt-3 text-[11px] text-red-700" role="alert">
          {error}
        </p>
      )}
      {response && (
        <div className="mt-4 space-y-4">
          <AgentStatus status={response.status} />
          <AgentTimeline status={response.status} />
          {response.fallbackNotice && (
            <p className="text-[11px] text-amber-800">{response.fallbackNotice}</p>
          )}
          <ActivityPanel response={response} />
          {response.status === "waiting_approval" && (
            <>
              <ChangeSetView
                response={response}
                editing={editing}
                onChange={(next) => store(next)}
                sessions={sessions}
                subjects={subjects}
              />
              {editing && (
                <p className="text-[11px] text-amber-800" role="status">
                  Editing invalidates the previous proposal — you’ll review the updated changes before anything can run.
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
          {(response.status === "completed" ||
            response.status === "failed" ||
            response.status === "cancelled") && (
            <ExecutionResult response={response} />
          )}
        </div>
      )}
    </Card>
  );
}
