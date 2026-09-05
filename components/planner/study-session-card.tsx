"use client";
import { useState } from "react";
import { Clock3, Trash2, Check, Loader2, BookOpen } from "lucide-react";
import type { StudySession } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { dayKey, formatDue, minutesToLabel, cn, todayKey } from "@/lib/utils";
import { useApp } from "@/components/providers/app-data";
type SubjectRef = { name: string; code: string; color: string };
export function StudySessionCard({
  session,
  subject,
  compact = false,
}: {
  session: StudySession;
  subject?: SubjectRef;
  compact?: boolean;
}) {
  const { setSessionStatus, deleteSession } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const done = session.status === "completed";
  const date = dayKey(session.planned_date);
  const isToday = date === todayKey();
  const missed = !done && Boolean(date && date < todayKey());
  return (
    <div
      className={cn(
        "card card-interactive relative flex items-start gap-3 overflow-hidden p-4",
        done && "!bg-slate-50/70",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-3 left-0 w-[3px] rounded-r-full"
        style={{ backgroundColor: subject?.color || "rgb(var(--brand-400))" }}
      />
      <button
        disabled={busy}
        aria-busy={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await setSessionStatus(session.id, !done);
          } catch {
            /* Provider shows error. */
          } finally {
            setBusy(false);
          }
        }}
        aria-pressed={done}
        aria-label={
          done
            ? `Mark ${session.title} as planned`
            : `Complete session ${session.title}`
        }
        className="check-toggle mt-0.5"
      >
        {busy ? (
          <Loader2
            className={`h-3.5 w-3.5 animate-spin ${done ? "text-on-accent" : "text-brand-600"}`}
          />
        ) : done ? (
          <Check className="check-draw h-3.5 w-3.5" />
        ) : (
          <BookOpen className="h-3 w-3 text-slate-400" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-xs font-semibold leading-relaxed sm:text-[13px]",
            done && "text-muted line-through",
          )}
        >
          {session.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" />
            {minutesToLabel(session.duration_minutes)}
          </span>
          {subject && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: subject.color }}
              />
              {subject.code || subject.name}
            </span>
          )}
          {!compact && (
            <span className={cn(isToday && !done && "text-brand-600")}>
              {formatDue(session.planned_date)}
            </span>
          )}
        </div>
        {!compact && (
          <span
            className={cn(
              "mt-2 inline-flex rounded-md px-2 py-0.5 text-[9px] font-medium",
              done
                ? "bg-emerald-50 text-emerald-700"
                : missed
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-muted",
            )}
          >
            {done
              ? "Session completed"
              : missed
                ? "Past date · Still planned"
                : isToday
                  ? "Planned for today"
                  : "Upcoming session"}
          </span>
        )}
      </div>
      <button
        onClick={() => setConfirmOpen(true)}
        aria-label={`Delete session ${session.title}`}
        className="icon-button -mr-1 h-7 w-7 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-3 w-3" />
      </button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteSession(session.id)}
        title="Delete study session?"
        message={`“${session.title}” will be removed from your planner. This can’t be undone.`}
      />
    </div>
  );
}
