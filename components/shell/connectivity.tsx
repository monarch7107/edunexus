"use client";

import { useOfflineSync } from "@/lib/offline/use-offline-sync";

/**
 * Honest connectivity + sync indicator.
 *
 * Shows one of: Synced · Offline (saved locally) · Syncing · N pending ·
 * needs attention (conflict/failure, with a Retry action). It never claims
 * "fully offline" — AI planning and private data loads still require a
 * connection; only the supported local mutations are queued.
 */
export function ConnectivityBar() {
  const { online, state, pending, conflicts, syncNow } = useOfflineSync();

  let label: string;
  let tone: string;
  if (!online || state === "offline") {
    label = "Offline — changes saved locally";
    tone = "text-amber-600 dark:text-amber-400";
  } else if (state === "syncing") {
    label = "Syncing changes…";
    tone = "text-brand-600 dark:text-brand-300";
  } else if (conflicts > 0 || state === "error") {
    label = conflicts === 1 ? "1 change needs attention" : `${conflicts} changes need attention`;
    tone = "text-rose-600 dark:text-rose-400";
  } else if (pending > 0) {
    label = pending === 1 ? "1 change pending" : `${pending} changes pending`;
    tone = "text-muted";
  } else {
    label = "Synced";
    tone = "text-muted";
  }

  const showRetry = online && (conflicts > 0 || pending > 0) && state !== "syncing";

  return (
    <div className="hidden items-center gap-2 sm:flex" role="status" aria-live="polite">
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${
          !online || state === "offline"
            ? "bg-amber-500"
            : conflicts > 0 || state === "error"
              ? "bg-rose-500"
              : state === "syncing"
                ? "bg-brand-500 animate-pulse"
                : "bg-emerald-500"
        }`}
      />
      <span className={`text-[10px] ${tone}`} data-connectivity={state}>
        {label}
      </span>
      {showRetry ? (
        <button
          type="button"
          onClick={() => void syncNow()}
          className="text-[10px] font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-300"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
