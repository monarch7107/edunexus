"use client";

import type { GatewayResponse } from "@/lib/ai/types";

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-center">
      <p className="font-display text-lg font-bold leading-none text-ink">{value}</p>
      <p className="mt-1.5 text-[10px] font-medium text-muted">{label}</p>
    </div>
  );
}

/**
 * Understandable agent audit: what the Planning Agent read, proposed, and
 * what actually happened after the student's decision.
 */
export function ActivityPanel({ response }: { response: GatewayResponse }) {
  const a = response.activity;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">
          Planning Agent activity
        </p>
        <span className="ml-auto rounded-md border border-line bg-surface px-1.5 py-0.5 text-[9px] font-semibold text-muted">
          {response.source === "ai" ? "AI reasoning" : "Smart rules"}
        </span>
      </div>
      {response.evidence.length > 0 && (
        <ul className="space-y-1 text-[11px] leading-relaxed text-muted">
          {response.evidence.map((e) => (
            <li key={e} className="flex gap-1.5">
              <span aria-hidden className="text-emerald-600">✓</span>
              <span>{e}</span>
            </li>
          ))}
        </ul>
      )}
      {response.conflicts.length > 0 && (
        <p className="text-[11px] font-semibold text-ink">
          {response.conflicts.length} conflict
          {response.conflicts.length === 1 ? "" : "s"} detected.
        </p>
      )}
      {a && (
        <div className="grid grid-cols-4 gap-2" aria-label="Change counts">
          <Stat value={a.proposed} label="Proposed" />
          <Stat value={a.approved} label="Approved" />
          <Stat value={a.executed} label="Executed" />
          <Stat value={a.verified} label="Verified" />
        </div>
      )}
    </div>
  );
}
