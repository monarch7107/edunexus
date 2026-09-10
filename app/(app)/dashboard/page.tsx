"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, ListTodo, Sparkles, Target } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useApp } from "@/components/providers/app-data";
import { AICommandBox, AgentTimeline, ChangeSet } from "@/components/ai/ai-workflow";

export default function DashboardPage() {
  const { profile, subjects, tasks, sessions, loading } = useApp();
  if (loading) return <LoadingState label="Preparing your academic overview…" />;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const pending = tasks.filter((task) => task.status !== "completed");
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const upcoming = pending.slice(0, 3);
  return <div className="flex flex-col gap-6">
    <PageHeader eyebrow="Tuesday, 10 September 2026" title={`Good morning, ${firstName}.`} description="Here is the clearest next step for your academic week." action={<ButtonLink href="/planner"><CalendarDays data-icon="inline-start" />Open planner</ButtonLink>} />
    <AICommandBox onOptimize={() => document.getElementById("schedule-proposal")?.scrollIntoView({ behavior: "smooth" })} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Academic overview">
      {[{ label: "Academic progress", value: `${tasks.length ? Math.round((completed / tasks.length) * 100) : 0}%`, detail: `${completed} of ${tasks.length} tasks complete`, icon: Target }, { label: "Today’s priorities", value: String(pending.length).padStart(2, "0"), detail: "Tasks still in motion", icon: ListTodo }, { label: "Study time", value: `${Math.round(sessions.filter((s) => s.status === "completed").reduce((sum, s) => sum + s.duration_minutes, 0) / 60)}h`, detail: "Completed sessions", icon: Clock3 }, { label: "Subjects in focus", value: String(subjects.length).padStart(2, "0"), detail: "Your current semester", icon: CheckCircle2 }].map(({ label, value, detail, icon: Icon }) => <Card key={label}><CardContent className="flex items-start justify-between p-5"><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><span className="rounded-md bg-primary/10 p-2.5 text-primary"><Icon className="size-4" /></span></CardContent></Card>)}
    </section>
    <div className="grid items-start gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <Card><CardHeader title="Today’s priorities" description="A focused view of what moves your week forward." action={<Link className="text-sm font-medium text-primary" href="/academics">View all <ArrowUpRight className="ml-1 inline size-3.5" /></Link>} /><CardContent className="flex flex-col gap-3">{upcoming.length ? upcoming.map((task) => <div key={task.id} className="flex items-center gap-3 rounded-lg border border-border p-4"><span className="size-2 rounded-full bg-primary" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{task.due_date ? `Due ${task.due_date}` : "No deadline set"}</p></div><Badge variant={task.priority === "high" ? "destructive" : "secondary"}>{task.priority}</Badge></div>) : <p className="py-8 text-center text-sm text-muted-foreground">Your priorities are clear. Add a task when you are ready.</p>}</CardContent></Card>
      <Card><CardHeader title="Academic pulse" description="Evidence from your workspace, not a prediction." /><CardContent className="flex flex-col gap-5"><div><div className="mb-2 flex justify-between text-sm"><span>Task completion</span><span className="font-medium">{tasks.length ? Math.round((completed / tasks.length) * 100) : 0}%</span></div><ProgressBar value={tasks.length ? (completed / tasks.length) * 100 : 0} label="Task completion" /></div><div className="rounded-lg border border-warning/30 bg-warning/10 p-4"><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-warning" /> Contextual suggestion</div><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your Tuesday schedule has limited available study time. I can reorganize sessions around upcoming deadlines.</p><Button className="mt-4" size="sm" onClick={() => document.getElementById("schedule-proposal")?.scrollIntoView({ behavior: "smooth" })}>Review suggestion</Button></div></CardContent></Card>
    </div>
    <section id="schedule-proposal" className="scroll-mt-24"><div className="mb-4"><p className="eyebrow">Signature workflow</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Optimize my study schedule</h2><p className="mt-1 text-sm text-muted-foreground">A transparent proposal: read context, review changes, then decide.</p></div><div className="grid gap-5 lg:grid-cols-[.72fr_1.28fr]"><Card><CardHeader title="Agent activity" description="Planning Agent · read-only analysis" /><CardContent><AgentTimeline /></CardContent></Card><ChangeSet /></div></section>
  </div>;
}
