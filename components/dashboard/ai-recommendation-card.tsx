"use client";

import { useState } from "react";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ListOrdered,
  Zap,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  async function generate() {
    setLoading(true);
    setFailed(false);
    try {
      const snapshot = buildSnapshot(profile, subjects, tasks, sessions);
      const res = await fetchRecommendation(snapshot);
      setResult(res);
      // Best-effort history (never blocks the UI).
      try {
        await repo.saveRecommendation(
          "study_priority",
          snapshot as unknown as Record<string, unknown>,
          JSON.stringify(res)
        );
      } catch {
        /* history is non-critical */
      }
    } catch {
      setFailed(true);
      toast.error("Recommendation unavailable. Your workspace is unaffected.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-brand-200 bg-gradient-to-b from-brand-50/70 to-white">
      <CardHeader
        title="AI study priority"
        icon={<Sparkles className="h-4 w-4 text-brand-600" />}
        action={
          result && !loading ? (
            <Button variant="outline" size="sm" onClick={generate}>
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </Button>
          ) : undefined
        }
      />

      {!result && !loading && !failed && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Get a prioritized study plan based on your tasks, deadlines,
            subjects and study history. Works even without AI — smart
            rules kick in automatically.
          </p>
          <Button onClick={generate} size="sm">
            <Zap className="h-4 w-4" /> Generate my study plan
          </Button>
        </div>
      )}

      {loading && (
        <div className="space-y-2 py-2">
          <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-slate-200" />
          <p className="pt-2 text-xs text-slate-500">
            Analysing your academic data…
          </p>
        </div>
      )}

      {failed && !loading && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Recommendation service is unavailable. The rest of EduNexus keeps
            working — try again in a moment.
          </span>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-slate-900">{result.summary}</p>
            <Badge
              className={
                result.source === "ai"
                  ? "bg-brand-100 text-brand-700"
                  : "bg-slate-100 text-slate-600"
              }
            >
              {result.source === "ai" ? "AI-generated" : "Smart rules"}
            </Badge>
          </div>

          {result.plan.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Suggested plan
              </p>
              <ul className="space-y-1.5">
                {result.plan.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.items.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <ListOrdered className="h-3.5 w-3.5" /> Prioritized tasks
              </p>
              <ul className="space-y-2">
                {result.items.map((item, i) => {
                  const badge = dueBadge(item.due_date);
                  return (
                    <li
                      key={`${item.task_id ?? "new"}-${i}`}
                      className="rounded-lg border border-slate-200 bg-white p-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800">
                          {item.title}
                        </p>
                        <Badge className={badge.className}>{badge.label}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{item.reason}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
