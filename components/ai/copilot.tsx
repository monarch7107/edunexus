"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { useApp } from "@/components/providers/app-data";
import type { GatewayResponse } from "@/lib/ai/types";
import { AgentStatus } from "./agent-status";
import { ChangeSetView } from "./change-set";
import { ApprovalPanel } from "./approval-panel";
import { ExecutionResult } from "./execution-result";

const STEPS = [
  "Understanding your request…",
  "Gathering academic context…",
  "Planning Agent analyzing your schedule…",
];

export function ScheduleCopilot() {
  const {
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
  const [response, setResponse] = useState<GatewayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState(false);

  async function submit() {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOfflineNotice(true);
      setError(null);
      return;
    }
    setOfflineNotice(false);
    setBusy(true);
    setError(null);
    setResponse(null);
    setEditing(false);
    setStep(STEPS[0]);
    try {
      await new Promise((r) => setTimeout(r, 200));
      setStep(STEPS[1]);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          surface: "planner",
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
        }),
      });
      setStep(STEPS[2]);
      const data = (await res.json()) as GatewayResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not plan your schedule.");
        return;
      }
      setResponse(data);
    } catch {
      setError("We couldn’t connect. Please try again.");
    } finally {
      setBusy(false);
      setStep(null);
    }
  }

  async function applyToWorkspace(data: GatewayResponse) {
    for (const c of data.changes) {
      const p = c.payload;
      if (c.operation === "create") {
        await createSession({
          title: String(p.title ?? c.label),
          subject_id: typeof p.subject_id === "string" ? p.subject_id : null,
          planned_date: String(p.planned_date ?? "").slice(0, 10),
          duration_minutes:
            typeof p.duration_minutes === "number" ? p.duration_minutes : 45,
        }).catch(() => undefined);
      } else if ((c.operation === "update" || c.operation === "move") && c.entity_id) {
        await updateSession(c.entity_id, {
          title: typeof p.title === "string" ? p.title : undefined,
          planned_date:
            typeof p.planned_date === "string" ? p.planned_date.slice(0, 10) : undefined,
          duration_minutes:
            typeof p.duration_minutes === "number" ? p.duration_minutes : undefined,
          subject_id: typeof p.subject_id === "string" ? p.subject_id : undefined,
        }).catch(() => undefined);
      } else if (c.operation === "delete" && c.entity_id) {
        await deleteSession(c.entity_id).catch(() => undefined);
      }
    }
    await refresh();
  }

  async function decide(decision: "approved" | "rejected") {
    if (!response?.changeSetId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeSetId: response.changeSetId, decision }),
      });
      const data = (await res.json()) as GatewayResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Approval failed.");
        return;
      }
      if (decision === "approved" && data.status === "completed") {
        await applyToWorkspace(data);
      }
      setResponse(data);
      setEditing(false);
    } catch {
      setError("We couldn’t finish that action.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdits() {
    if (!response?.changeSetId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/changeset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeSetId: response.changeSetId,
          edits: response.changes.map((c) => ({ id: c.id, payload: c.payload })),
        }),
      });
      const data = (await res.json()) as GatewayResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save edits.");
        return;
      }
      setResponse(data);
      setEditing(false);
    } catch {
      setError("We couldn’t finish that action.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="relative overflow-hidden !border-[rgb(var(--gold)/0.28)] !bg-brand-50/50">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: "rgb(var(--gold))" }}
      />
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-600" />
        <h2 className="section-title">Optimize my week</h2>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-muted">
        Planning Agent proposes a change set. Nothing is written until you approve. The LLM cannot authorize itself.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          aria-label="Schedule request"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="!text-xs"
        />
        <Button size="sm" onClick={submit} loading={busy} loadingLabel="Planning…">
          Optimize
        </Button>
      </div>
      {offlineNotice && (
        <p className="mt-3 text-[11px] text-amber-800" role="status">
          You’re offline. AI planning will be available when you reconnect. Changes will sync when you’re back online.
        </p>
      )}
      {step && <p className="mt-3 text-[11px] text-muted">{step}</p>}
      {error && (
        <p className="mt-3 text-[11px] text-red-700" role="alert">
          {error}
        </p>
      )}
      {response && (
        <div className="mt-4 space-y-3">
          <AgentStatus status={response.status} />
          {response.fallbackNotice && (
            <p className="text-[11px] text-amber-800">{response.fallbackNotice}</p>
          )}
          {response.evidence.length > 0 && (
            <ul className="space-y-1 text-[11px] text-muted">
              {response.evidence.map((e) => (
                <li key={e}>✓ {e}</li>
              ))}
            </ul>
          )}
          {response.conflicts.length > 0 && (
            <p className="text-[11px] font-semibold">
              {response.conflicts.length} conflict
              {response.conflicts.length === 1 ? "" : "s"} detected.
            </p>
          )}
          {response.status === "waiting_approval" && (
            <>
              <ChangeSetView
                response={response}
                editing={editing}
                onChange={(next) => setResponse(next)}
              />
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
