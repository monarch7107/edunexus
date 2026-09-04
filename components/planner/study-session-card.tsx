"use client";

import { useState } from "react";
import { Clock, Trash2, Check } from "lucide-react";
import type { StudySession } from "@/lib/types";

type SubjectRef = { name: string; code: string; color: string };
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { dayKey, formatDue, minutesToLabel, cn, todayKey } from "@/lib/utils";
import { useApp } from "@/components/providers/app-data";

export function StudySessionCard({
  session,
  subject,
}: {
  session: StudySession;
  subject?: SubjectRef;
}) {
  const { setSessionStatus, deleteSession } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const done = session.status === "completed";
  const isToday = dayKey(session.planned_date) === todayKey();

  return (
    <div className="card flex items-center gap-3 p-4">
      <button
        onClick={() => setSessionStatus(session.id, !done)}
        aria-pressed={done}
        aria-label={done ? "Mark session as planned" : "Mark session as completed"}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
          done
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-slate-300 bg-white hover:border-brand-500 hover:bg-brand-50"
        )}
      >
        <Check className="h-4 w-4" aria-hidden />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium text-slate-900",
            done && "text-slate-400 line-through"
          )}
        >
          {session.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {minutesToLabel(session.duration_minutes)}
          </span>
          <span aria-hidden>·</span>
          <span className={cn(isToday && !done && "font-semibold text-brand-700")}>
            {formatDue(session.planned_date)}
          </span>
          {subject && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: subject.color }}
                  aria-hidden
                />
                {subject.code || subject.name}
              </span>
            </>
          )}
        </div>
      </div>

      <button
        onClick={() => setConfirmOpen(true)}
        aria-label="Delete session"
        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteSession(session.id)}
        title="Delete study session?"
        message={`"${session.title}" will be removed from your planner.`}
      />
    </div>
  );
}
