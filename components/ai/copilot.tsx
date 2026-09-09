"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { useQuietMotion } from "@/components/ui/motion";
import { useApp } from "@/components/providers/app-data";
import { useToast } from "@/components/providers/toast";
import {
  approvePlan,
  editChange,
  rejectPlan,
  requestPlan,
  AiClientError,
} from "@/lib/ai/client";
import type { AgentRunResponse, VerificationResult } from "@/lib/ai/types";
import { AgentStatus, type CopilotPhase } from "./agent-status";
import { ApprovalPanel } from "./approval-panel";
import { ChangeSetList } from "./change-set";
import { ExecutionResultPanel } from "./execution-result";

const EXAMPLE = "I have three exams next week. Fix my study schedule.";

/**
 * Study Copilot — the student-facing surface for the planning agent.
 *
 * Deliberately NOT a general chatbot: one focused workflow with an
 * explicit, inspectable approval step.
 */
export function Copilot() {
  const { mode, refresh } = useApp();
  const toast = useToast();
  const quiet = useQuietMotion();

  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState<CopilotPhase>("idle");
  const [run, setRun] = useState<AgentRunResponse | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const demoMode = mode === "demo";

  const reset = useCallback(() => {
    setRun(null);
    setResult(null);
    setError(null);
    setSelected(new Set());
    setPhase("idle");
  }, []);

  const start = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setBusy(true);
      setError(null);
      setResult(null);
      setRun(null);
      setPhase("understanding");

      try {
        // Brief, honest staging of the visible pipeline phases.
        await tick(quiet ? 0 : 350);
        setPhase("gathering");
        const response = await requestPlan(trimmed, "planner");
        setPhase("planning");
        await tick(quiet ? 0 : 250);

        setRun(response);
        setSelected(new Set(response.changes.map((c) => c.id)));
        setPhase(
          response.status === "waiting_approval" ? "waiting_approval" : "done",
        );
      } catch (e) {
        const message =
          e instanceof AiClientError
            ? e.message
            : "We couldn’t finish that action. Your existing work is safe.";
        setError(message);
        setPhase("failed");
      } finally {
        setBusy(false);
      }
    },
    [busy, quiet],
  );

  const approve = useCallback(
    async (decision: "approve_all" | "approve_selected") => {
      if (!run?.changeSetId || busy) return;
      setBusy(true);
      setError(null);
      setPhase("executing");
      try {
        await tick(quiet ? 0 : 250);
        const verification = await approvePlan({
          runId: run.runId,
          changeSetId: run.changeSetId,
          decision,
          itemIds: decision === "approve_selected" ? [...selected] : undefined,
        });
        setPhase("verifying");
        await tick(quiet ? 0 : 250);
        setResult(verification);
        setPhase(verification.fullyVerified ? "done" : "failed");
        // Bring the planner's own data in line with what was just written.
        await refresh();
        if (verification.fullyVerified) {
          toast.success("Your schedule has been reorganized.");
        } else {
          toast.warning(verification.message);
        }
      } catch (e) {
        const message =
          e instanceof AiClientError
            ? e.message
            : "We couldn’t apply those changes. Your existing work is safe.";
        setError(message);
        setPhase("failed");
        toast.error(message);
      } finally {
        setBusy(false);
      }
    },
    [busy, quiet, refresh, run, selected, toast],
  );

  const reject = useCallback(async () => {
    if (!run?.changeSetId || busy) return;
    setBusy(true);
    try {
      await rejectPlan({ runId: run.runId, changeSetId: run.changeSetId });
      toast.success("Plan rejected. Nothing was changed.");
      reset();
    } catch (e) {
      const message = e instanceof AiClientError ? e.message : "Couldn’t reject the plan.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }, [busy, run, reset, toast]);

  const edit = useCallback(
    async (
      itemId: string,
      payload: { title?: string; planned_date?: string; duration_minutes?: number },
    ) => {
      if (!run?.changeSetId || busy) return;
      setBusy(true);
      try {
        const updated = await editChange({
          runId: run.runId,
          changeSetId: run.changeSetId,
          itemId,
          payload,
        });
        setRun((prev) => (prev ? { ...prev, changes: updated.changes } : updated));
        setSelected(new Set(updated.changes.map((c) => c.id)));
        setPhase("waiting_approval");
        toast.success("Change updated. Please review and approve again.");
      } catch (e) {
        const message = e instanceof AiClientError ? e.message : "Couldn’t save that edit.";
        toast.error(message);
      } finally {
        setBusy(false);
      }
    },
    [busy, run, toast],
  );

  const changes = useMemo(() => run?.changes ?? [], [run]);
  const awaitingApproval = phase === "waiting_approval" && changes.length > 0;
  const selectedCount = useMemo(
    () => changes.filter((c) => selected.has(c.id)).length,
    [changes, selected],
  );

  return (
    <Card className="!border-brand-200 !bg-brand-50/40">
      <CardHeader
        title="Study Copilot"
        icon={<Wand2 className="h-4 w-4 text-brand-600" />}
        description="Ask the Planning Agent to reorganize your week. You approve every change."
      />

      {demoMode ? (
        <p className="rounded-lg border border-line bg-surface p-3 text-[12px] leading-relaxed text-muted">
          The Study Copilot needs the Supabase backend so every change can be
          saved and verified. It isn’t available in demo mode.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              className="!min-h-10 !text-xs"
              aria-label="Ask the study copilot"
              placeholder={EXAMPLE}
              value={message}
              disabled={busy}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") start(message);
              }}
            />
            <Button
              size="sm"
              className="shrink-0"
              loading={busy && phase !== "executing" && phase !== "verifying"}
              loadingLabel="Thinking…"
              onClick={() => start(message || EXAMPLE)}
            >
              <Sparkles className="h-3.5 w-3.5" /> Optimize my week
            </Button>
          </div>

          {phase === "idle" && (
            <button
              type="button"
              className="text-left text-[11px] text-muted underline-offset-2 hover:underline"
              onClick={() => {
                setMessage(EXAMPLE);
                start(EXAMPLE);
              }}
            >
              Try: “{EXAMPLE}”
            </button>
          )}

          <AnimatePresence mode="wait">
            {phase !== "idle" && (
              <motion.div
                key="pipeline"
                initial={{ opacity: quiet ? 1 : 0, y: quiet ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: quiet ? 0 : 0.3 }}
                className="space-y-4 border-t border-brand-200 pt-4"
              >
                <AgentStatus
                  phase={phase}
                  analyzed={run?.analyzed ?? null}
                  findings={run?.findings}
                  proposedCount={changes.length}
                  fallback={run?.fallback}
                  error={error}
                />

                {run && changes.length === 0 && phase === "done" && !result && (
                  <p className="rounded-lg border border-line bg-surface p-3 text-[12px] leading-relaxed">
                    {run.summary}
                  </p>
                )}

                {changes.length > 0 && !result && (
                  <ChangeSetList
                    changes={changes}
                    reason={run?.summary}
                    editable={awaitingApproval}
                    selectable={awaitingApproval}
                    selected={selected}
                    busy={busy}
                    onToggle={(id) =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      })
                    }
                    onEdit={edit}
                  />
                )}

                {awaitingApproval && (
                  <ApprovalPanel
                    count={changes.length}
                    selectedCount={selectedCount}
                    expiresAt={run?.expiresAt ?? null}
                    busy={busy}
                    onApproveAll={() => approve("approve_all")}
                    onApproveSelected={() => approve("approve_selected")}
                    onReject={reject}
                  />
                )}

                {result && (
                  <>
                    <ExecutionResultPanel result={result} />
                    <ChangeSetList changes={result.items} />
                  </>
                )}

                {(result || phase === "failed") && (
                  <Button size="sm" variant="ghost" onClick={reset} disabled={busy}>
                    Start over
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
}

function tick(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
