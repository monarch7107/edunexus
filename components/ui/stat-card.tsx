import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./progress-bar";
import { Reveal } from "./motion";
export function StatCard({
  label,
  value,
  detail,
  Icon,
  tone = "brand",
  progress,
  index = 0,
}: {
  label: string;
  value: string | number;
  detail: string;
  Icon: LucideIcon;
  tone?: "brand" | "amber" | "red" | "sky";
  progress?: number;
  index?: number;
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-600",
    sky: "bg-sky-50 text-sky-600",
  };
  return (
    <Reveal delay={index * 0.04} className="h-full">
      <div className="card card-interactive h-full p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-muted">{label}</span>
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              tones[tone],
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.7} />
          </span>
        </div>
        <p className="mt-2 font-display text-[29px] font-bold leading-tight tracking-[-.06em] sm:text-[31px]">
          {value}
        </p>
        <p className="mt-2 text-[10px] text-muted">{detail}</p>
        {progress !== undefined && (
          <ProgressBar className="mt-4 h-1" value={progress} label={label} />
        )}
      </div>
    </Reveal>
  );
}
