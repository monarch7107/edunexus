"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, toDateInput, todayKey } from "@/lib/utils";
export function weekStart(date: string) {
  const d = new Date(`${date}T12:00:00`);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return toDateInput(d);
}
export function offsetDate(date: string, offset: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return toDateInput(d);
}
export function WeekStrip({
  start,
  selected,
  onSelect,
  onWeekChange,
  counts = {},
  compact = false,
}: {
  start: string;
  selected: string;
  onSelect: (date: string) => void;
  onWeekChange: (date: string) => void;
  counts?: Record<string, number>;
  compact?: boolean;
}) {
  const date = new Date(`${start}T12:00:00`);
  const end = new Date(`${offsetDate(start, 6)}T12:00:00`);
  const crossesYear = date.getFullYear() !== end.getFullYear();
  const monthLabel =
    date.getMonth() === end.getMonth()
      ? date.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : `${date.toLocaleDateString(undefined, { month: "short", ...(crossesYear ? ({ year: "numeric" } as const) : {}) })} – ${end.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold">{monthLabel}</h3>
        <div className="flex gap-1">
          <button
            className="icon-button h-7 w-7"
            aria-label="Previous week"
            onClick={() => onWeekChange(offsetDate(start, -7))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            className="rounded-md px-2 text-[10px] font-semibold text-brand-600 transition-colors hover:bg-brand-50"
            onClick={() => {
              onWeekChange(weekStart(todayKey()));
              onSelect(todayKey());
            }}
          >
            Today
          </button>
          <button
            className="icon-button h-7 w-7"
            aria-label="Next week"
            onClick={() => onWeekChange(offsetDate(start, 7))}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }, (_, i) => {
          const key = offsetDate(start, i);
          const day = new Date(`${key}T12:00:00`);
          const active = key === selected;
          const today = key === todayKey();
          return (
            <button
              key={key}
              aria-pressed={active}
              aria-label={`${day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}, ${counts[key] || 0} sessions`}
              onClick={() => onSelect(key)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border text-[9px] transition-all active:scale-95",
                compact ? "min-h-[67px]" : "min-h-[88px]",
                active
                  ? "border-brand-600 bg-brand-600 text-on-accent shadow-sm"
                  : today
                    ? "border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100"
                    : "border-line bg-surface text-muted hover:border-brand-300 hover:bg-slate-50",
              )}
            >
              <span>
                {day
                  .toLocaleDateString(undefined, { weekday: "short" })
                  .slice(0, 3)}
              </span>
              <span
                className={cn(
                  "font-display font-bold",
                  compact ? "text-sm" : "text-xl",
                )}
              >
                {day.getDate()}
              </span>
              <span
                aria-hidden
                className={cn(
                  "h-1 w-1 rounded-full",
                  counts[key]
                    ? active
                      ? "bg-current"
                      : "bg-brand-500"
                    : "opacity-0",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
