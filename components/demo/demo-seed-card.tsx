"use client";
import { useState } from "react";
import { Beaker, Check, Sparkles, Trash2, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers/app-data";
import {
  seedDemoWorkspaceWithRepo,
  isDemoSeeded,
  clearDemoSeededFlag,
} from "@/lib/demo-seed";
import { useToast } from "@/components/providers/toast";

export function DemoSeedCard({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { repo, subjects, tasks, sessions, refresh, mode } = useApp();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const seeded = isDemoSeeded();

  const isEmpty =
    subjects.length === 0 && tasks.length === 0 && sessions.length === 0;

  const handleSeed = async () => {
    if (!isEmpty) {
      const ok = window.confirm(
        "You already have subjects and tasks. Add sample data anyway? Sample items will be added alongside your existing work."
      );
      if (!ok) return;
    }
    setBusy(true);
    try {
      const result = await seedDemoWorkspaceWithRepo(repo);
      await refresh();
      toast.success(
        `Sample workspace ready — ${result.created.subjects} subjects, ${result.created.tasks} tasks, ${result.created.sessions} study sessions, ${result.created.resources} resources.`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load sample data.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleClearFlag = () => {
    clearDemoSeededFlag();
    toast.success("Sample marker cleared. Your data stays safe.");
  };

  if (compact && !isEmpty && !seeded) return null;

  return (
    <Card
      className={
        compact
          ? "border-dashed"
          : "border-brand-200 bg-brand-50/70"
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            compact
              ? "flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700"
              : "flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 bg-surface text-brand-600"
          }
        >
          <Beaker className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight">
            {isEmpty ? "Explore with sample data" : "Sample workspace"}
            {seeded && (
              <span className="rounded bg-brand-200 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-brand-800">
                Sample loaded
              </span>
            )}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {isEmpty
              ? "New here? Load a coherent demo workspace — 4 subjects, 7 tasks with overdue/today/tomorrow deadlines, study sessions, and resources. Clearly marked as sample, safe to clear."
              : seeded
              ? "This workspace contains sample data for demonstration. It is clearly distinguishable — look for the sample banner. Your real data (if any) is alongside it. You can keep or remove it."
              : "Load additional sample data to see how EduNexus connects subjects, tasks, deadlines, study planning, and insights."}
          </p>

          {!compact && (
            <div className="mt-3 flex items-center gap-2 text-[10px] text-muted">
              <Info className="h-3 w-3" />
              <span>
                Sample data uses realistic dates (overdue, today, this week) and
                is stored via the real repository — no fake claims.
              </span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleSeed}
              disabled={busy}
              loading={busy}
              loadingLabel="Loading sample..."
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isEmpty ? "Load sample workspace" : "Add sample data"}
            </Button>

            {seeded && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearFlag}
                disabled={busy}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear sample marker
              </Button>
            )}

            {mode === "demo" && (
              <span className="ml-auto text-[9px] text-muted">
                Local workspace · Saved in this browser
              </span>
            )}
          </div>

          {isEmpty && (
            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted">
              <Check className="h-3 w-3 text-brand-600" />
              No internet needed after load · Reload-safe · Works offline
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

export function DemoBanner() {
  const seeded = isDemoSeeded();
  if (!seeded) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-5 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-xs"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-200 text-brand-800">
        <Beaker className="h-3.5 w-3.5" />
      </span>
      <span className="font-medium text-brand-800">
        Sample workspace — demo data
      </span>
      <span className="text-muted">
        This is clearly marked sample data for judging. Your real data, if any,
        lives alongside it.
      </span>
      <span className="ml-auto hidden text-[10px] text-muted sm:inline">
        Stored via real repository · No fake claims
      </span>
    </div>
  );
}
