"use client";

import type { GatewayResponse } from "@/lib/ai/types";

export function ExecutionResult({ response }: { response: GatewayResponse }) {
  const a = response.activity;
  return (
    <div className="space-y-2 text-xs">
      <p className="font-semibold">{response.summary}</p>
      {a && (
        <p className="text-muted">
          Planning Agent · {a.proposed} proposed · {a.approved} approved · {a.executed}{" "}
          executed · {a.verified} verified
        </p>
      )}
    </div>
  );
}
