"use client";

import { useEffect, useState } from "react";
import { ArrowRight, History } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { RunStatusBadge } from "@/components/ai/run-status-badge";
import { useApp } from "@/components/providers/app-data";
import { listAgentRuns, type AgentHistoryEntry } from "@/lib/ai/activity-store";

function Counts({ run }: { run: AgentHistoryEntry }) {
  const cells: [number, string][] = [
    [run.proposed, "Proposed"],
    [run.approved, "Approved"],
    [run.executed, "Executed"],
    [run.verified, "Verified"],
  ];
  return (
    <div className="grid grid-cols-4 gap-2" aria-label="Change counts">
      {cells.map(([value, label]) => (
        <div key={label} className="rounded-lg bg-slate-50 px-2 py-2.5 text-center">
          <p className="font-display text-base font-bold leading-none">{value}</p>
          <p className="mt-1.5 text-[10px] font-medium text-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function ActivityPage() {
  const { user, loading } = useApp();
  const [runs, setRuns] = useState<AgentHistoryEntry[]>([]);
  useEffect(() => {
    setRuns(listAgentRuns(user?.id));
  }, [user?.id]);

  if (loading) return <LoadingState label="Opening agent activity…" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Intelligence / Activity"
        title="Agent Activity"
        description="A transparent record of what the Planning Agent read, proposed, and verified — newest first."
        action={
          <ButtonLink href="/ai" size="sm" variant="outline">
            New run <ArrowRight className="size-3.5" aria-hidden />
          </ButtonLink>
        }
      />

      {runs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<History className="size-6" aria-hidden />}
            title="No agent activity yet."
            description="Each Planning Agent run is recorded here with its proposal, your decision, and the verification outcome."
            action={
              <ButtonLink href="/ai">
                Open AI Command Center <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[1.4fr_1fr]">
          <div className="min-w-0 space-y-4">
            {runs.map((run) => (
              <Card key={run.runId}>
                <CardHeader
                  title="Planning Agent"
                  description={new Date(run.at).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  action={<RunStatusBadge status={run.status} />}
                />
                <CardContent className="!gap-3">
                  <p className="text-sm font-medium leading-relaxed">{run.summary}</p>
                  <Counts run={run} />
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                    <span className="rounded-md border border-line bg-surface px-1.5 py-0.5 font-medium">
                      {run.source === "ai" ? "AI reasoning" : "Smart rules"}
                    </span>
                    {run.conflicts > 0 && (
                      <span>
                        {run.conflicts} conflict{run.conflicts === 1 ? "" : "s"} detected
                      </span>
                    )}
                    {run.changeSetId && run.status === "waiting_approval" && (
                      <ButtonLink href="/ai/approvals" size="sm" variant="outline">
                        Review proposal <ArrowRight className="size-3 w-3" aria-hidden />
                      </ButtonLink>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="min-w-0">
            <Card>
              <CardHeader
                title="How to read this log"
                description="Every number traces back to a verified step."
              />
              <CardContent className="!gap-3">
                {[
                  ["Proposed", "Changes the agent suggested after reading your workspace."],
                  ["Approved", "Changes you explicitly approved. Nothing else can run."],
                  ["Executed", "Approved changes the authorized tools applied."],
                  ["Verified", "Changes confirmed by re-reading the database — the only count that lets us say “done”."],
                ].map(([term, detail]) => (
                  <div key={term} className="rounded-lg border border-line px-3 py-2.5">
                    <p className="text-xs font-bold">{term}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">{detail}</p>
                  </div>
                ))}
                <p className="text-[11px] leading-relaxed text-muted">
                  This log lives on this device. In a connected workspace the
                  server also keeps a durable audit trail. You can clear this
                  device log anytime from Profile → AI &amp; privacy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
