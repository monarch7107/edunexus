"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flag,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { AICommandBox, WorkflowPreview } from "@/components/ai/ai-workflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

const priorities = [
  { title: "Complete DBMS normalization assignment", subject: "Database Management Systems", due: "Due tomorrow", tone: "warning" },
  { title: "Review networking notes", subject: "Computer Networks", due: "45 min planned", tone: "info" },
  { title: "Prepare mathematics problem set", subject: "Mathematics", due: "Due Friday", tone: "default" },
];

const sessions = [
  { subject: "Database Management Systems", time: "4:30 PM", duration: "60 min", color: "bg-brand-600" },
  { subject: "Mathematics", time: "6:00 PM", duration: "45 min", color: "bg-gold" },
  { subject: "Computer Networks", time: "7:15 PM", duration: "30 min", color: "bg-slate-500" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-5 rounded-2xl border border-brand-800 bg-brand-900 px-5 py-6 text-on-accent shadow-xl shadow-brand-900/10 sm:px-7 sm:py-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-brand-100">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-300/30 bg-brand-800/50 px-2.5 py-1"><Sparkles className="size-3.5" /> Academic command center</span>
            <span className="text-brand-200">Tuesday, 10 September</span>
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Good morning, Alex.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-brand-100 sm:text-base">Your academic context is in focus. You have three priority items today and a clear path to stay ahead this week.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-brand-300/20 bg-brand-800/50 px-4 py-3 text-sm">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gold text-brand-900"><TrendingUp className="size-5" /></div>
          <div><p className="text-xs text-brand-200">Weekly momentum</p><p className="font-semibold">78% on track</p></div>
        </div>
      </section>

      <AICommandBox onOptimize={() => document.getElementById("planning-agent")?.scrollIntoView({ behavior: "smooth", block: "start" })} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Academic overview">
        {[
          { label: "Study streak", value: "12 days", detail: "Best in the last month", icon: Target },
          { label: "Planned this week", value: "8h 30m", detail: "6h 40m completed", icon: Clock3 },
          { label: "Open tasks", value: "7", detail: "2 need attention", icon: Flag },
          { label: "Next milestone", value: "3 days", detail: "DBMS internal assessment", icon: CalendarDays },
        ].map(({ label, value, detail, icon: Icon }) => (
          <Card key={label} className="card-interactive">
            <CardContent className="flex items-start justify-between gap-3 p-5"><div><p className="eyebrow">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><Icon className="size-5 text-brand-600" /></CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Card>
          <CardHeader title="Today&apos;s priorities" description="A focused view of what moves your week forward." action={<Link href="/tasks" className="text-link">View all <ArrowRight className="size-3.5" /></Link>} />
          <CardContent className="flex flex-col gap-3">
            {priorities.map((priority) => <div key={priority.title} className="task-row"><span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-line"><CheckCircle2 className="size-3.5 text-muted-foreground" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{priority.title}</p><p className="mt-1 text-xs text-muted-foreground">{priority.subject}</p></div><Badge variant="outline" className={priority.tone === "warning" ? "border-warning-line bg-warning-soft text-warning" : priority.tone === "info" ? "border-info-line bg-info-soft text-info" : ""}>{priority.due}</Badge></div>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Weekly progress" description="Your completed study time against the plan." action={<Link href="/insights" className="text-link">Insights <ArrowRight className="size-3.5" /></Link>} />
          <CardContent className="flex flex-col gap-5"><div className="flex items-end justify-between"><div><p className="text-4xl font-semibold tracking-tight">78%</p><p className="mt-1 text-xs text-muted-foreground">6h 40m of 8h 30m complete</p></div><Badge variant="outline" className="border-success-line bg-success-soft text-success">+12% this week</Badge></div><ProgressBar value={78} label="Weekly study progress" /><div className="grid grid-cols-3 gap-3 text-center text-xs"><div><p className="font-semibold">4</p><p className="mt-1 text-muted-foreground">sessions</p></div><div><p className="font-semibold">3</p><p className="mt-1 text-muted-foreground">subjects</p></div><div><p className="font-semibold">92%</p><p className="mt-1 text-muted-foreground">consistency</p></div></div></CardContent>
        </Card>
      </div>

      <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]" aria-label="Study plan">
        <Card><CardHeader title="Next study sessions" description="Your plan for today." action={<Link href="/planner" className="text-link">Open planner <ArrowRight className="size-3.5" /></Link>} /><CardContent className="flex flex-col gap-3">{sessions.map((session) => <div key={session.subject} className="flex items-center gap-3 rounded-lg border border-line p-3"><span className={`size-2.5 shrink-0 rounded-full ${session.color}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{session.subject}</p><p className="mt-1 text-xs text-muted-foreground">{session.time} · {session.duration}</p></div><Button variant="ghost" size="sm">Start</Button></div>)}</CardContent></Card>
        <Card id="planning-agent"><CardHeader title="Planning Agent" description="Read-only analysis based on your current workspace." action={<Badge variant="outline" className="border-success-line bg-success-soft text-success">Context ready</Badge>} /><CardContent><WorkflowPreview /></CardContent></Card>
      </section>
    </div>
  );
}
