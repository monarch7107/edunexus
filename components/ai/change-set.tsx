"use client";

import { useState } from "react";
import { ArrowRight, Check, Pencil, Plus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { ChangeView } from "@/lib/ai/types";

const OPERATION_META: Record<
  ChangeView["operation"],
  { icon: typeof Plus; tone: string; verb: string }
> = {
  create: { icon: Plus, tone: "text-emerald-600 bg-emerald-50", verb: "Create" },
  move: { icon: ArrowRight, tone: "text-sky-600 bg-sky-50", verb: "Move" },
  update: { icon: RefreshCw, tone: "text-amber-600 bg-amber-50", verb: "Update" },
  delete: { icon: X, tone: "text-red-600 bg-red-50", verb: "Delete" },
};

const STATUS_LABEL: Partial<Record<ChangeView["status"], string>> = {
  executed: "Applied",
  verified: "Verified",
  failed: "Failed",
  skipped: "Skipped",
  rejected: "Rejected",
  approved: "Approved",
};

/** The proposed-changes list. Every change is shown; nothing is hidden. */
export function ChangeSetList({
  changes,
  reason,
  editable,
  selectable,
  selected,
  onToggle,
  onEdit,
  busy,
}: {
  changes: ChangeView[];
  reason?: string;
  editable?: boolean;
  selectable?: boolean;
  selected?: Set<string>;
  onToggle?: (id: string) => void;
  onEdit?: (
    itemId: string,
    payload: { title?: string; planned_date?: string; duration_minutes?: number },
  ) => Promise<void> | void;
  busy?: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
        AI proposed changes
      </p>

      <ul className="space-y-2">
        {changes.map((change) => {
          const meta = OPERATION_META[change.operation];
          const Icon = meta.icon;
          const isSelected = !selectable || selected?.has(change.id);
          const isEditing = editingId === change.id;

          return (
            <li
              key={change.id}
              className={cn(
                "rounded-xl border p-3 transition",
                change.status === "verified"
                  ? "border-emerald-200 bg-emerald-50/50"
                  : change.status === "failed"
                    ? "border-red-200 bg-red-50/50"
                    : isSelected
                      ? "border-line bg-surface"
                      : "border-line bg-slate-50/70 opacity-60",
              )}
            >
              <div className="flex items-start gap-3">
                {selectable && (
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 accent-current"
                    checked={Boolean(isSelected)}
                    onChange={() => onToggle?.(change.id)}
                    disabled={busy}
                    aria-label={`Include change: ${change.label}`}
                  />
                )}
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    meta.tone,
                  )}
                  aria-hidden
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold leading-snug">
                    {change.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">{change.detail}</p>
                  {change.reason && (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                      {change.reason}
                    </p>
                  )}
                  {change.error && (
                    <p className="mt-1.5 text-[11px] font-medium text-red-700">
                      {change.error}
                    </p>
                  )}

                  {isEditing && onEdit && (
                    <EditRow
                      change={change}
                      busy={busy}
                      onCancel={() => setEditingId(null)}
                      onSave={async (payload) => {
                        await onEdit(change.id, payload);
                        setEditingId(null);
                      }}
                    />
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {STATUS_LABEL[change.status] && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        change.status === "verified"
                          ? "bg-emerald-100 text-emerald-700"
                          : change.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {STATUS_LABEL[change.status]}
                    </span>
                  )}
                  {editable && !isEditing && (
                    <button
                      type="button"
                      className="icon-button h-7 w-7"
                      aria-label={`Edit change: ${change.label}`}
                      onClick={() => setEditingId(change.id)}
                      disabled={busy}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {reason && (
        <div className="rounded-xl border border-line bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            Why?
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed">{reason}</p>
        </div>
      )}
    </div>
  );
}

function EditRow({
  change,
  busy,
  onSave,
  onCancel,
}: {
  change: ChangeView;
  busy?: boolean;
  onSave: (payload: {
    title?: string;
    planned_date?: string;
    duration_minutes?: number;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(change.payload.title);
  const [date, setDate] = useState(change.payload.planned_date);
  const [minutes, setMinutes] = useState(String(change.payload.duration_minutes));
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-line bg-slate-50 p-2.5">
      <p className="text-[10px] font-semibold text-muted">
        Editing invalidates the current approval — you’ll review again.
      </p>
      <Input
        className="!min-h-9 !text-xs"
        aria-label="Session title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex gap-2">
        <Input
          type="date"
          className="!min-h-9 !text-xs"
          aria-label="Planned date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input
          type="number"
          min={15}
          max={240}
          step={15}
          className="!min-h-9 !text-xs"
          aria-label="Duration in minutes"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
      </div>
      {error && <p className="text-[11px] text-red-700">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={busy}
          onClick={async () => {
            const parsedMinutes = Number(minutes);
            if (!title.trim()) return setError("A title is required.");
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError("Pick a valid date.");
            if (
              !Number.isFinite(parsedMinutes) ||
              parsedMinutes < 15 ||
              parsedMinutes > 240
            ) {
              return setError("Duration must be between 15 and 240 minutes.");
            }
            setError(null);
            await onSave({
              title: title.trim(),
              planned_date: date,
              duration_minutes: Math.round(parsedMinutes),
            });
          }}
        >
          <Check className="h-3 w-3" /> Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
