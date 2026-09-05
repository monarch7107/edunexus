"use client";
import { AlertCircle, ArrowRight, BookOpen, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { Reveal } from "./motion";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton", className)} />;
}
export function LoadingState({
  label = "Preparing your workspace",
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className="mx-auto w-full max-w-7xl space-y-7 p-5 sm:p-8"
    >
      <span className="sr-only">{label}</span>
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-2/3 max-w-sm" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div className="card space-y-4 p-5" key={i}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2 w-4/5" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <div className="card space-y-5 p-6 md:col-span-2">
          <Skeleton className="mb-7 h-5 w-40" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-6 w-6 shrink-0" />
              <div className="w-full space-y-3">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="card space-y-5 p-6">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
}
export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Reveal>
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-5 text-center",
          compact ? "py-7" : "py-12 sm:py-14",
        )}
      >
        <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface text-brand-600 shadow-sm">
          <div
            aria-hidden
            className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-[3px] border-surface bg-brand-300"
          />
          {icon || <BookOpen className="h-6 w-6" />}
        </div>
        <h3 className="text-[15px] font-bold tracking-tight">{title}</h3>
        {description && (
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted">
            {description}
          </p>
        )}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </Reveal>
  );
}
export function ErrorState({
  message = "We couldn’t load your workspace. Your saved work is safe. Please try again.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Reveal>
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-8 text-center"
      >
        <AlertCircle className="h-8 w-8 text-red-600" />
        <h2 className="text-base font-bold">Let’s try that again</h2>
        <p className="max-w-md text-sm text-muted">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" /> Try again{" "}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </Reveal>
  );
}
