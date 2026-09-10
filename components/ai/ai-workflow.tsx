"use client";

import { useState } from "react";
import { ArrowRight, Check, Clock3, Edit3, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const stages = ["Understanding request", "Analyzing academic context", "Planning schedule", "Checking conflicts", "Preparing changes", "Awaiting approval"];

export function AgentTimeline({ active = 4 }: { active?: number }) {
  return <div className="flex flex-col gap-3" aria-label="AI workflow progress">
    {stages.map((stage, index) => {
      const complete = index < active;
      return <div key={stage} className="flex items-center gap-3 text-sm">
        <span className={complete ? "flex size-6 items-center justify-center rounded-full bg-success text-success-foreground" : index === active ? "flex size-6 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary" : "flex size-6 items-center justify-center rounded-full border border-border text-muted-foreground"}>
          {complete ? <Check className="size-3.5" /> : index === active ? <span className="size-2 rounded-full bg-primary" /> : <span className="size-1.5 rounded-full bg-muted-foreground/40" />}
        </span>
        <span className={complete || index === active ? "font-medium text-foreground" : "text-muted-foreground"}>{stage}</span>
        {index === active && <span className="ml-auto text-xs text-muted-foreground">In progress</span>}
      </div>;
    })}
  </div>;
}

const changes = [
  { op: "MOVE SESSION", entity: "Database Management Systems", current: "Wed · 6:00 PM", proposed: "Tue · 7:00 PM", reason: "Upcoming assessment and available study capacity." },
  { op: "CREATE SESSION", entity: "Mathematics problem set", current: "Not scheduled", proposed: "Thu · 5:30 PM", reason: "A focused 60-minute block fits before your deadline." },
  { op: "PRIORITIZE TASK", entity: "Normalization assignment", current: "Medium priority", proposed: "High priority", reason: "Due in 3 days with two dependent tasks." },
  { op: "REMOVE SESSION", entity: "Computer Networks review", current: "Fri · 6:00 PM", proposed: "Removed", reason: "Conflicts with your accounting report deadline." },
];

export function ChangeSet() {
  const [decision, setDecision] = useState<"idle" | "approved" | "rejected">("idle");
  const [editing, setEditing] = useState(false);
  return <Card className="overflow-hidden border-primary/20 shadow-lg shadow-primary/5">
    <CardHeader title="AI proposes 4 changes" description="Review each action before anything is written to your workspace." action={<Badge variant="outline">Medium impact</Badge>} />
    <CardContent className="flex flex-col gap-3">
      {changes.map((change) => <div key={change.entity} className="rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="secondary">{change.op}</Badge><span className="text-xs text-muted-foreground">Planning Agent</span></div>
        <h4 className="mt-3 font-semibold">{change.entity}</h4>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Current state</p><p className="mt-1 text-muted-foreground">{change.current}</p></div><div><p className="text-xs uppercase tracking-wider text-primary">Proposed state</p><p className="mt-1 font-medium">{change.proposed}</p></div></div>
        <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground"><span className="font-medium text-foreground">Why:</span> {change.reason}</p>
      </div>)}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" /> Editing invalidates this approval.</p>
        {decision === "idle" ? <div className="flex gap-2"><Button variant="outline" onClick={() => setEditing(true)}><Edit3 data-icon="inline-start" />Edit proposal</Button><Button variant="outline" onClick={() => setDecision("rejected")}><X data-icon="inline-start" />Reject</Button><Button onClick={() => setDecision("approved")}><Check data-icon="inline-start" />Approve changes</Button></div> : <Badge className="px-3 py-1">{decision === "approved" ? "Approved · Ready to execute" : "Proposal rejected"}</Badge>}
      </div>
      {editing && <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm"><span className="font-medium">Proposal editing is ready.</span> Adjustments will require a fresh review before execution. <button className="ml-2 font-semibold text-primary" onClick={() => setEditing(false)}>Done</button></div>}
    </CardContent>
  </Card>;
}

export function AICommandBox({ onOptimize }: { onOptimize?: () => void }) {
  return <Card className="border-primary/20 bg-primary text-primary-foreground shadow-xl shadow-primary/15"><CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-primary-foreground/70"><Sparkles className="size-4" /> AI command center</div><h3 className="mt-2 text-xl font-semibold tracking-tight">What should we help you decide next?</h3><p className="mt-1 max-w-xl text-sm leading-relaxed text-primary-foreground/75">Ask for a recommendation. EduNexus will explain its context, propose changes, and keep you in control.</p></div><Button variant="secondary" className="shrink-0" onClick={onOptimize}>Optimize my schedule <ArrowRight data-icon="inline-end" /></Button></CardContent></Card>;
}

export function WorkflowPreview() { return <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><Card><CardHeader title="Planning Agent" description="Transparent, read-only analysis" /><CardContent><AgentTimeline /></CardContent></Card><ChangeSet /></div>; }
