"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  Loader2,
  Check,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/states";
import { useQuietMotion } from "@/components/ui/motion";
import { dueBadge } from "@/lib/utils";
import type { RecommendationResult } from "@/lib/types";
import { buildSnapshot, fetchRecommendation } from "@/lib/ai";
import { useApp } from "@/components/providers/app-data";
import { useToast } from "@/components/providers/toast";

export function AiRecommendationCard() {
  const { profile, subjects, tasks, sessions, repo } = useApp();
  const toast = useToast();
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const quiet = useQuietMotion();
  async function generate() {
    setLoading(true);
    setFailed(false);
    try {
      const snapshot = buildSnapshot(profile, subjects, tasks, sessions);
      const res = await fetchRecommendation(snapshot);
      setResult(res);
      void repo
        .saveRecommendation(
          "study_priority",
          snapshot as unknown as Record<string, unknown>,
          JSON.stringify(res),
        )
        .catch(() => {
          /* Non-critical recommendation history. */
        });
    } catch {
      setFailed(true);
      toast.error(
        "Your study recommendation isn’t available right now. Your workspace is unaffected.",
      );
    } finally {
      setLoading(false);
    }
  }
  const state = loading
    ? "loading"
    : failed
      ? "failed"
      : result
        ? "result"
        : "idle";
  return (
    <section
      className="relative overflow-hidden rounded-xl border border-brand-200 bg-brand-50/70 p-5 sm:p-6"
      aria-labelledby="ai-title"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600" />
          <h2 id="ai-title" className="text-xs font-bold tracking-tight">
            A little intelligent guidance
          </h2>
        </div>
        <span className="rounded-md border border-brand-200 bg-surface/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-brand-700">
          Nexus AI
        </span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={state}
          initial={{ opacity: 0, y: quiet ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: quiet ? 0 : 0.18 }}
        >
          {state === "idle" && (
            <>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-200 bg-surface text-brand-600">
                <Lightbulb className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="max-w-[220px] text-[23px] font-bold leading-snug tracking-[-.05em]">
                Big plans.
                <br />A clear next step.
              </h3>
              <p className="mb-5 mt-3 text-xs leading-[1.8] text-slate-600">
                {tasks.length
                  ? "Let’s turn your workload into a focused study plan, built around your subjects, deadlines, and priorities."
                  : "Add a task to your workspace. Then get a study plan built around what actually matters to you."}
              </p>
              <Button
                className="w-full"
                disabled={!tasks.length}
                onClick={generate}
              >
                <Sparkles className="h-3.5 w-3.5" /> Generate my study plan{" "}
                <ArrowUpRight className="ml-auto h-3.5 w-3.5" />
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-muted">
                <Check className="h-2.5 w-2.5" />
                Your real data. No guesswork.
              </p>
            </>
          )}
          {state === "loading" && (
            <div role="status" aria-live="polite" className="py-2">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-200 bg-surface">
                <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
              </div>
              <h3 className="text-base font-bold">Connecting the dots…</h3>
              <p className="mb-6 mt-2 text-xs leading-relaxed text-muted">
                Reviewing your tasks, deadlines, and study activity to find your
                next best step.
              </p>
              <div className="space-y-3">
                <Skeleton className="h-3 w-full !bg-brand-100" />
                <Skeleton className="h-3 w-4/5 !bg-brand-100" />
                <Skeleton className="h-3 w-3/5 !bg-brand-100" />
              </div>
              <p className="mt-5 text-[10px] text-muted">
                Waiting for your recommendation. No changes are being made to
                your tasks.
              </p>
            </div>
          )}
          {state === "failed" && (
            <div>
              <AlertTriangle className="mb-3 h-6 w-6 text-amber-700" />
              <h3 className="text-sm font-bold">
                A brief pause, not a setback.
              </h3>
              <p className="mb-5 mt-2 text-xs leading-relaxed text-muted">
                We couldn’t generate your plan. Your work is safe—please try
                again.
              </p>
              <Button size="sm" variant="outline" onClick={generate}>
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </Button>
            </div>
          )}
          {state === "result" && result && (
            <div className="space-y-4">
              <div>
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-brand-200 bg-surface px-2 py-1 text-[9px] font-semibold text-brand-700">
                  <Sparkles className="h-2.5 w-2.5" />
                  {result.source === "ai"
                    ? "AI-generated guidance"
                    : "Smart rules · No AI service used"}
                </span>
                <p className="text-[13px] font-semibold leading-relaxed">
                  {result.summary}
                </p>
              </div>
              {result.plan.length > 0 && (
                <ol className="space-y-3">
                  {result.plan.map((step, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 text-xs leading-relaxed text-slate-600"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-200/60 text-[9px] font-bold text-brand-800">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              )}
              {result.items.length > 0 && (
                <div className="space-y-2 border-t border-brand-200 pt-4">
                  <p className="eyebrow mb-3 text-[8px]">Your priorities</p>
                  {result.items.map((item, i) => (
                    <div
                      key={`${item.task_id}-${i}`}
                      className="rounded-lg border border-brand-100 bg-surface/80 p-3"
                    >
                      <p className="text-xs font-semibold">{item.title}</p>
                      <p className="mt-1 text-[10px] leading-relaxed text-muted">
                        {item.reason}
                      </p>
                      {item.due_date && (
                        <span className="mt-2 inline-block text-[9px] font-medium text-brand-700">
                          {dueBadge(item.due_date).label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-brand-200 pt-3">
                <p className="mb-3 text-[9px] leading-relaxed text-muted">
                  Based on your data when generated. A suggestion, not a change
                  to your schedule.
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  variant="outline"
                  onClick={generate}
                >
                  <RefreshCw className="h-3 w-3" /> Refresh my plan{" "}
                  <ArrowRight className="ml-auto h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
