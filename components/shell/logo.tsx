import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  iconClassName,
  withText = true,
}: {
  className?: string;
  iconClassName?: string;
  withText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white",
          iconClassName
        )}
      >
        <GraduationCap className="h-5 w-5" />
      </span>
      {withText && (
        <span className="text-lg font-bold tracking-tight text-slate-900">
          Edu<span className="text-brand-600">Nexus</span>
        </span>
      )}
    </span>
  );
}
