"use client";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { Task } from "@/lib/types";
import { useApp } from "@/components/providers/app-data";
export function TaskStatusToggle({ task }: { task: Task }) {
  const { setTaskStatus } = useApp();
  const [busy, setBusy] = useState(false);
  const done = task.status === "completed";
  return (
    <button
      type="button"
      className="check-toggle disabled:opacity-60"
      disabled={busy}
      aria-busy={busy}
      aria-pressed={done}
      aria-label={
        done
          ? `Mark "${task.title}" as pending`
          : `Mark "${task.title}" as complete`
      }
      onClick={async () => {
        setBusy(true);
        try {
          await setTaskStatus(task.id, !done);
        } catch {
          /* Error toast is handled by provider. */
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? (
        <Loader2
          className={`h-3.5 w-3.5 animate-spin ${done ? "text-on-accent" : "text-brand-600"}`}
        />
      ) : done ? (
        <Check className="check-draw h-3.5 w-3.5" aria-hidden />
      ) : null}
    </button>
  );
}
