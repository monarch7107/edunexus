"use client";

import type { GatewayResponse } from "@/lib/ai/types";
import type { StudySession, Subject } from "@/lib/types";
import { Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const OPERATION_META = {
  create: { sign: "+", label: "Create", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  update: { sign: "✎", label: "Update", tone: "border-sky-200 bg-sky-50 text-sky-700" },
  move: { sign: "↻", label: "Move", tone: "border-brand-200 bg-brand-50 text-brand-700" },
  delete: { sign: "−", label: "Remove", tone: "border-red-200 bg-red-50 text-red-700" },
} as const;

function formatDay(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 10) return null;
  const day = value.slice(0, 10);
  const parsed = new Date(`${day}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatMinutes(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function describeSession(
  session: StudySession | undefined,
  subjects: Map<string, Subject>,
): string {
  if (!session) return "Current session";
  const name = session.subject_id
    ? subjects.get(session.subject_id)?.name
    : undefined;
  const day = formatDay(session.planned_date) ?? session.planned_date;
  const mins = formatMinutes(session.duration_minutes);
  return [session.title, name, day, mins].filter(Boolean).join(" · ");
}

export function ChangeSetView({
  response,
  editing,
  onChange,
  sessions = [],
  subjects = [],
}: {
  response: GatewayResponse;
  editing?: boolean;
  onChange?: (next: GatewayResponse) => void;
  /** Current workspace sessions, used to show the "current state" honestly. */
  sessions?: StudySession[];
  subjects?: Subject[];
}) {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  function updatePayload(index: number, patch: Record<string, unknown>) {
    const changes = response.changes.map((item, i) =>
      i === index ? { ...item, payload: { ...item.payload, ...patch } } : item,
    );
    onChange?.({ ...response, changes });
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        AI proposed changes
      </p>
      <ul className="space-y-2.5">
        {response.changes.map((c, index) => {
          const meta = OPERATION_META[c.operation] ?? OPERATION_META.update;
          const current =
            c.operation === "create"
              ? "Not scheduled"
              : describeSession(
                  c.entity_id ? sessionMap.get(c.entity_id) : undefined,
                  subjectMap,
                );
          const proposedTitle =
            typeof c.payload.title === "string" && c.payload.title
              ? c.payload.title
              : c.label;
          const proposedBits = [
            proposedTitle,
            formatDay(c.payload.planned_date),
            formatMinutes(c.payload.duration_minutes),
          ].filter(Boolean) as string[];
          const reason =
            typeof c.payload.reason === "string" && c.payload.reason
              ? c.payload.reason
              : null;
          return (
            <li
              key={c.id}
              className="rounded-xl border border-line bg-surface px-3.5 py-3 text-xs shadow-card"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn("font-semibold", meta.tone)}>
                  <span aria-hidden>{meta.sign}</span> {meta.label}
                </Badge>
                <span className="text-[11px] font-medium text-muted">
                  Study session
                </span>
              </div>
              <p className="mt-2.5 text-[13px] font-semibold leading-snug text-ink">
                {c.label}
              </p>
              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                  <p className="text-[9px] font-bold uppercase tracking-[.14em] text-muted">
                    Current state
                  </p>
                  <p className="mt-1 leading-relaxed text-slate-600">{current}</p>
                </div>
                <div className="rounded-lg bg-brand-50 px-2.5 py-2">
                  <p className="text-[9px] font-bold uppercase tracking-[.14em] text-brand-700">
                    Proposed state
                  </p>
                  <p className="mt-1 font-medium leading-relaxed text-ink">
                    {proposedBits.join(" · ")}
                  </p>
                </div>
              </div>
              {reason && (
                <p className="mt-2 border-t border-line pt-2 text-[11px] leading-relaxed text-muted">
                  <span className="font-semibold text-ink">Why: </span>
                  {reason}
                </p>
              )}
              {editing && (
                <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                  <Input
                    aria-label={`Edit title for ${c.label}`}
                    className="!min-h-9 !text-[11px]"
                    value={String(c.payload.title ?? "")}
                    onChange={(e) =>
                      updatePayload(index, { title: e.target.value })
                    }
                  />
                  <Input
                    type="date"
                    aria-label={`Edit date for ${c.label}`}
                    className="!min-h-9 !text-[11px]"
                    value={String(c.payload.planned_date ?? "").slice(0, 10)}
                    onChange={(e) =>
                      updatePayload(index, { planned_date: e.target.value })
                    }
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {response.summary && (
        <p className="text-[11px] leading-relaxed text-muted">
          <span className="font-semibold text-ink">Why? </span>
          {response.summary}
        </p>
      )}
    </div>
  );
}
