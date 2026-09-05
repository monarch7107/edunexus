"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQuietMotion } from "./motion";
export function ProgressBar({
  value,
  className,
  barClassName,
  color,
  label = "Progress",
}: {
  value: number;
  className?: string;
  barClassName?: string;
  color?: string;
  label?: string;
}) {
  const pct = Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : 0;
  const quiet = useQuietMotion();
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-slate-100",
        className,
      )}
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={cn(
          "h-full w-full origin-left rounded-full",
          !barClassName && !color && "bg-brand-600",
          barClassName,
        )}
        initial={false}
        animate={{ scaleX: pct / 100 }}
        transition={{ duration: quiet ? 0 : 0.5 }}
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
export function ProgressRing({
  value,
  size = 100,
  label = "Completion",
  stroke = 7,
}: {
  value: number;
  size?: number;
  label?: string;
  stroke?: number;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circle = 2 * Math.PI * radius;
  const quiet = useQuietMotion();
  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${Math.round(pct)}%`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--slate-100))"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--brand-600))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circle}
          initial={false}
          animate={{ strokeDashoffset: circle * (1 - pct / 100) }}
          transition={{ duration: quiet ? 0 : 0.7 }}
        />
      </svg>
      <span className="absolute font-display text-xl font-bold tracking-tighter">
        {Math.round(pct)}
        <span className="text-xs text-muted">%</span>
      </span>
    </div>
  );
}
