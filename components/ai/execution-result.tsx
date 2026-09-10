"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";
import type { GatewayResponse } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

export function ExecutionResult({ response }: { response: GatewayResponse }) {
  const a = response.activity;
  const verified = response.status === "completed";
  const executed = a?.executed ?? 0;
  const verifiedCount = a?.verified ?? 0;
  const total = a?.proposed ?? response.changes.length;
  return (
    <div className="space-y-3 text-xs" role="status">
      <p className="text-[13px] font-semibold leading-relaxed text-ink">
        {response.summary}
      </p>
      {a && (
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2">
            {executed === total ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <CircleAlert className="size-4 shrink-0 text-amber-600" aria-hidden />
            )}
            <span className={cn(executed === total ? "text-ink" : "text-amber-800")}>
              Executing approved changes — {executed}/{total} applied
            </span>
          </li>
          <li className="flex items-center gap-2">
            {verified ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <CircleAlert className="size-4 shrink-0 text-amber-600" aria-hidden />
            )}
            <span className={cn(verified ? "text-ink" : "text-amber-800")}>
              Verifying database state — {verifiedCount}/{total} verified
              {!verified && total > 0 ? " (state re-read from the database)" : ""}
            </span>
          </li>
        </ul>
      )}
      {a && (
        <p className="text-[11px] text-muted">
          Planning Agent · {a.proposed} proposed · {a.approved} approved ·{" "}
          {a.executed} executed · {a.verified} verified
        </p>
      )}
    </div>
  );
}
