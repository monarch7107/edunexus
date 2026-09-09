"use client";

import { Check, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Explicit approval gate. No write can happen without a deliberate click
 * here — the server independently re-verifies the approval before it
 * touches the database.
 */
export function ApprovalPanel({
  count,
  selectedCount,
  expiresAt,
  busy,
  onApproveAll,
  onApproveSelected,
  onReject,
}: {
  count: number;
  selectedCount: number;
  expiresAt: string | null;
  busy?: boolean;
  onApproveAll: () => void;
  onApproveSelected: () => void;
  onReject: () => void;
}) {
  const partial = selectedCount > 0 && selectedCount < count;

  return (
    <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/70 p-3.5">
      <div className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <p className="text-[11px] leading-relaxed text-muted">
          Nothing is saved until you approve. Every approved change is applied
          through a permission check and then verified against your data.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={onApproveAll}
          loading={busy}
          loadingLabel="Applying…"
          disabled={count === 0}
        >
          <Check className="h-3.5 w-3.5" /> Approve all ({count})
        </Button>
        {partial && (
          <Button size="sm" variant="outline" onClick={onApproveSelected} disabled={busy}>
            Approve selected ({selectedCount})
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onReject} disabled={busy}>
          <X className="h-3.5 w-3.5" /> Reject
        </Button>
      </div>

      {expiresAt && (
        <p className="text-[10px] text-muted">
          This plan expires at{" "}
          {new Date(expiresAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
          . After that you’ll need a fresh plan.
        </p>
      )}
    </div>
  );
}
