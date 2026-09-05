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
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-600 text-on-accent",
          iconClassName,
        )}
      >
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 5.5c3.2-.8 5.8-.1 8 1.8 2.2-1.9 4.8-2.6 8-1.8v13c-3.2-.8-5.8-.1-8 1.8-2.2-1.9-4.8-2.6-8-1.8v-13Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 7.5v12M7 9.5l2 .5M15 10l2-.5M7 12.5l2 .5M15 13l2-.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="m17 1 .6 1.4L19 3l-1.4.6L17 5l-.6-1.4L15 3l1.4-.6L17 1Z"
            fill="currentColor"
          />
        </svg>
      </span>
      {withText && (
        <span className="font-display text-[21px] font-extrabold tracking-[-.065em] text-ink">
          edu<span className="font-semibold">nexus</span>
          <span className="text-brand-500">.</span>
        </span>
      )}
    </span>
  );
}
