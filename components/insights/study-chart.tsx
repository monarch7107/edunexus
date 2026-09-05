"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuietMotion } from "@/components/ui/motion";
import type { StudySession } from "@/lib/types";
import { dayKey, minutesToLabel, toDateInput, cn } from "@/lib/utils";

export function studyDays(sessions: StudySession[], range = 7) {
  return Array.from({ length: range }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - range + 1 + i);
    const key = toDateInput(date);
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      date: date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      minutes: sessions
        .filter(
          (s) =>
            s.status === "completed" &&
            dayKey(s.completed_at ?? s.planned_date) === key,
        )
        .reduce((sum, s) => sum + s.duration_minutes, 0),
    };
  });
}
export function StudyChart({
  sessions,
  range = 7,
  compact = false,
}: {
  sessions: StudySession[];
  range?: number;
  compact?: boolean;
}) {
  const days = useMemo(() => studyDays(sessions, range), [sessions, range]);
  const [active, setActive] = useState<string | null>(null);
  const quiet = useQuietMotion();
  const max = Math.max(
    60,
    Math.ceil(Math.max(...days.map((d) => d.minutes)) / 60) * 60,
  );
  const total = days.reduce((sum, d) => sum + d.minutes, 0);
  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-2xl font-bold tracking-[-.05em]">
            {minutesToLabel(total)}
          </p>
          <p className="mt-1 text-[10px] text-muted">
            of focused learning in the last {range} days
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-[9px] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          Completed sessions
        </span>
      </div>
      <div
        className={cn(
          "relative flex gap-2",
          compact ? "h-[130px]" : "h-[190px]",
        )}
      >
        <div
          aria-hidden
          className="flex w-7 shrink-0 flex-col justify-between pb-7 text-[8px] text-muted"
        >
          <span>{minutesToLabel(max)}</span>
          <span>{minutesToLabel(max / 2)}</span>
          <span>0</span>
        </div>
        <div className="relative flex min-w-0 flex-1 items-end gap-1.5 pb-7 sm:gap-3">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-7 top-0 flex flex-col justify-between"
          >
            <div className="border-t border-dashed border-line" />
            <div className="border-t border-dashed border-line" />
            <div className="border-t border-line" />
          </div>
          {days.map((day, index) => (
            <div
              key={day.key}
              className="relative flex h-full min-w-0 flex-1 items-end justify-center"
            >
              <button
                aria-label={`${day.date}: ${minutesToLabel(day.minutes)} studied`}
                className="group relative flex h-full w-full max-w-12 flex-col items-center justify-end rounded-t-md outline-offset-2"
                onFocus={() => setActive(day.key)}
                onBlur={() => setActive(null)}
                onMouseEnter={() => setActive(day.key)}
                onMouseLeave={() => setActive(null)}
                onClick={() => setActive(active === day.key ? null : day.key)}
              >
                {active === day.key && (
                  <span
                    role="tooltip"
                    className="absolute -top-1 z-10 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-[9px] shadow-sm"
                  >
                    {minutesToLabel(day.minutes)}
                  </span>
                )}
                <motion.span
                  initial={false}
                  animate={{ scaleY: day.minutes ? day.minutes / max : 0.018 }}
                  transition={{
                    duration: quiet ? 0 : 0.6,
                    delay: quiet ? 0 : index * 0.018,
                  }}
                  className={cn(
                    "block h-full w-full origin-bottom rounded-t-[4px] transition-colors",
                    day.minutes
                      ? index === days.length - 1
                        ? "bg-brand-600 group-hover:bg-brand-500"
                        : "bg-brand-300 group-hover:bg-brand-500"
                      : "bg-slate-200",
                  )}
                />
                <span
                  aria-hidden
                  className="absolute -bottom-6 text-[8px] text-muted"
                >
                  {range > 7
                    ? index % 2 === 0
                      ? day.date.split(" ").slice(-1)
                      : ""
                    : day.label}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
      {!total && (
        <p className="mt-3 text-center text-[10px] text-muted">
          Complete a study session to see your activity take shape.
        </p>
      )}
    </div>
  );
}
