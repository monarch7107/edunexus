"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import type { AcademicSignals } from "@/lib/intelligence";
import { workloadCopy } from "@/lib/intelligence";

export function AIInsightCard({ signals }: { signals: AcademicSignals }) {
  const copy = workloadCopy(signals.workload);
  return (
    <Card className="relative overflow-hidden !border-[rgb(var(--gold)/0.35)] bg-surface">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: "rgb(var(--gold))" }}
      />
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-600" />
        <p className="eyebrow text-[9px] !text-brand-700">Academic intelligence</p>
      </div>
      <h2 className="font-display text-lg font-bold tracking-[-.03em]">
        {copy.title} week
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-muted">{copy.detail}</p>
      <ul className="mt-4 space-y-1.5 text-[11px] text-muted">
        <li>✓ {signals.pendingTasks} priorities in your task list</li>
        <li>✓ {signals.overdueTasks} overdue · {signals.examTasks7d} exams in 7 days</li>
        {signals.subjectAttention[0] && (
          <li>✓ {signals.subjectAttention[0].name} needs attention — {signals.subjectAttention[0].reason}</li>
        )}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        <ButtonLink href="/planner" size="sm">
          Review schedule
        </ButtonLink>
        <Link href="/academics" className="text-link text-[11px]">
          Review priorities
        </Link>
      </div>
    </Card>
  );
}
