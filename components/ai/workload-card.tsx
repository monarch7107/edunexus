"use client";

import { Scale } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import type { AcademicSignals } from "@/lib/intelligence";
import { workloadCopy } from "@/lib/intelligence";
import { minutesToLabel } from "@/lib/utils";

export function WorkloadCard({ signals }: { signals: AcademicSignals }) {
  const copy = workloadCopy(signals.workload);
  return (
    <Card>
      <CardHeader
        title="Upcoming workload"
        icon={<Scale className="h-4 w-4 text-brand-600" />}
        description="Rule-based estimate from tasks, exams, and planned sessions you already logged."
      />
      <p className="font-display text-2xl font-bold tracking-[-.04em]">{copy.title}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{copy.detail}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
        <div>
          <dt className="text-muted">Planned this week</dt>
          <dd className="mt-0.5 font-semibold">{minutesToLabel(signals.plannedMinutes7d)}</dd>
        </div>
        <div>
          <dt className="text-muted">High-priority pending</dt>
          <dd className="mt-0.5 font-semibold">{signals.highPriorityPending}</dd>
        </div>
      </dl>
    </Card>
  );
}
