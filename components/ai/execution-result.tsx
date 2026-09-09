"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationResult } from "@/lib/ai/types";

/**
 * Honest outcome reporting.
 *
 * Success is only claimed when every approved change was executed AND
 * verified against the database. Anything less is shown as a partial
 * result with the real counts.
 */
export function ExecutionResultPanel({ result }: { result: VerificationResult }) {
  const ok = result.fullyVerified;

  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border p-3.5",
        ok ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        {ok ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        )}
        <p
          className={cn(
            "text-[13px] font-semibold leading-snug",
            ok ? "text-emerald-900" : "text-amber-900",
          )}
        >
          {result.message}
        </p>
      </div>

      <dl className="grid grid-cols-4 gap-2 border-t border-current/10 pt-3 text-center">
        <Stat label="Proposed" value={result.proposed} />
        <Stat label="Approved" value={result.approved} />
        <Stat label="Executed" value={result.executed} />
        <Stat label="Verified" value={result.verified} />
      </dl>

      {result.failed > 0 && (
        <p className="text-[11px] font-medium text-red-700">
          {result.failed} {result.failed === 1 ? "change" : "changes"} could not be
          applied. Nothing else was affected.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="font-display text-lg font-bold">{value}</dd>
      <dt className="mt-0.5 text-[9px] uppercase tracking-wider text-muted">{label}</dt>
    </div>
  );
}
