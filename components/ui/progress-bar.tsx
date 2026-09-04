import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number; // 0–100
  className?: string;
  barClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full bg-brand-600 transition-all", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
