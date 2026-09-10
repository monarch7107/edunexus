"use client";

import type { GatewayResponse } from "@/lib/ai/types";
import { Input } from "@/components/ui/field";

export function ChangeSetView({
  response,
  editing,
  onChange,
}: {
  response: GatewayResponse;
  editing?: boolean;
  onChange?: (next: GatewayResponse) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        AI proposed changes
      </p>
      <ul className="space-y-2">
        {response.changes.map((c, index) => (
          <li
            key={c.id}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-xs"
          >
            <span className="font-semibold text-brand-700">
              {c.operation === "create" ? "+" : c.operation === "move" ? "↻" : "✎"}
            </span>{" "}
            {c.label}
            {editing && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Input
                  aria-label={`Edit title for ${c.label}`}
                  className="!min-h-9 !text-[11px]"
                  value={String(c.payload.title ?? "")}
                  onChange={(e) => {
                    const changes = response.changes.map((item, i) =>
                      i === index
                        ? {
                            ...item,
                            payload: { ...item.payload, title: e.target.value },
                          }
                        : item,
                    );
                    onChange?.({ ...response, changes });
                  }}
                />
                <Input
                  type="date"
                  aria-label={`Edit date for ${c.label}`}
                  className="!min-h-9 !text-[11px]"
                  value={String(c.payload.planned_date ?? "").slice(0, 10)}
                  onChange={(e) => {
                    const changes = response.changes.map((item, i) =>
                      i === index
                        ? {
                            ...item,
                            payload: {
                              ...item.payload,
                              planned_date: e.target.value,
                            },
                          }
                        : item,
                    );
                    onChange?.({ ...response, changes });
                  }}
                />
              </div>
            )}
          </li>
        ))}
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
