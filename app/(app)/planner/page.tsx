"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCheck,
  Clock3,
  Plus,
  Search,
  Sun,
  Target,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { Input } from "@/components/ui/field";
import { AnimatedList, Reveal } from "@/components/ui/motion";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressRing } from "@/components/ui/progress-bar";
import { SessionFormModal } from "@/components/planner/session-form-modal";
import { ScheduleCopilot } from "@/components/ai/copilot";
import { StudySessionCard } from "@/components/planner/study-session-card";
import { WeekStrip, weekStart } from "@/components/planner/week-strip";
import { useApp } from "@/components/providers/app-data";
import { dayKey, minutesToLabel, todayKey } from "@/lib/utils";
import type { StudySession } from "@/lib/types";

export default function PlannerPage() {
  const { sessions, subjects, loading } = useApp();
  const params = useSearchParams();
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(todayKey());
  const [week, setWeek] = useState(weekStart(todayKey()));
  const [view, setView] = useState<"agenda" | "day">("day");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "planned" | "completed">("all");
  useEffect(() => {
    setSearch(params?.get("search") || "");
    if (params?.get("search")) setView("agenda");
  }, [params]);
  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );
  const complete = sessions.filter((s) => s.status === "completed");
  const planned = sessions.filter((s) => s.status === "planned");
  const minutes = complete.reduce((sum, s) => sum + s.duration_minutes, 0);
  const counts = sessions.reduce<Record<string, number>>((acc, s) => {
    const key = dayKey(s.planned_date);
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const groups = useMemo(() => {
    const filtered = sessions
      .filter(
        (s) =>
          (view !== "day" || dayKey(s.planned_date) === selected) &&
          (status === "all" || s.status === status) &&
          s.title.toLowerCase().includes(search.trim().toLowerCase()),
      )
      .sort((a, b) => a.planned_date.localeCompare(b.planned_date));
    const result: Record<string, StudySession[]> = {};
    filtered.forEach((s) => {
      const key = dayKey(s.planned_date) || s.planned_date;
      (result[key] ||= []).push(s);
    });
    return result;
  }, [sessions, view, selected, status, search]);
  const todayMinutes = sessions
    .filter((s) => dayKey(s.planned_date) === todayKey())
    .reduce((sum, s) => sum + s.duration_minutes, 0);
  const todayDone = complete
    .filter((s) => dayKey(s.planned_date) === todayKey())
    .reduce((sum, s) => sum + s.duration_minutes, 0);
  if (loading) return <LoadingState label="Preparing your study planner…" />;
  return (
    <>
      <PageHeader
        eyebrow="Less someday. More today."
        title="Make time for your future."
        description="A thoughtful plan turns a busy week into a little room to grow."
        action={
          <Button onClick={() => setModal(true)}>
            <Plus className="h-4 w-4" /> Plan study session
          </Button>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Sessions ahead"
          value={planned.length}
          detail="Time set aside for your goals"
          Icon={CalendarDays}
        />
        <StatCard
          label="Sessions completed"
          value={complete.length}
          detail="Every focused session counts"
          Icon={CheckCheck}
          index={1}
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="Time well spent"
            value={minutesToLabel(minutes)}
            detail="Total completed study time"
            Icon={Clock3}
            tone="sky"
            index={2}
          />
        </div>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.8fr_1fr]">
        <div className="min-w-0 space-y-5">
          <Reveal>
            <Card>
              <CardHeader
                title="Your week, with intention"
                description="Pick a day to see its sessions, or explore your full agenda."
              />
              <WeekStrip
                start={week}
                selected={selected}
                counts={counts}
                onSelect={(day) => {
                  setSelected(day);
                  setView("day");
                }}
                onWeekChange={(date) => {
                  setWeek(date);
                  setSelected(date);
                  setView("day");
                }}
              />
            </Card>
          </Reveal>
          <Reveal>
            <Card>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="section-title">Your study agenda</h2>
                <div className="segmented">
                  <button
                    className="segment"
                    aria-pressed={view === "agenda"}
                    onClick={() => setView("agenda")}
                  >
                    All dates
                  </button>
                  <button
                    className="segment"
                    aria-pressed={view === "day"}
                    onClick={() => setView("day")}
                  >
                    Selected day
                  </button>
                </div>
              </div>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[150px] flex-1">
                  <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-muted" />
                  <Input
                    className="!min-h-10 pl-9 pr-8 !text-xs"
                    aria-label="Search study sessions"
                    placeholder="Find a session…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      className="icon-button absolute right-1 top-1 h-8 w-7"
                      aria-label="Clear session search"
                      onClick={() => setSearch("")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="segmented">
                  {(["all", "planned", "completed"] as const).map((s) => (
                    <button
                      key={s}
                      className="segment !px-2.5 !text-[10px] capitalize"
                      aria-pressed={status === s}
                      onClick={() => setStatus(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {Object.keys(groups).length ? (
                <AnimatedList className="space-y-6">
                  {Object.entries(groups).map(([date, items]) => (
                    <div key={date}>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-[11px] font-semibold">
                          {date === todayKey()
                            ? "Today"
                            : new Date(`${date}T12:00:00`).toLocaleDateString(
                                undefined,
                                {
                                  weekday: "long",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                        </span>
                        <span className="h-px flex-1 bg-line" />
                        <span className="text-[9px] text-muted">
                          {minutesToLabel(
                            items.reduce(
                              (sum, s) => sum + s.duration_minutes,
                              0,
                            ),
                          )}{" "}
                          scheduled
                        </span>
                      </div>
                      <AnimatedList className="space-y-2.5">
                        {items.map((session) => (
                          <StudySessionCard
                            key={session.id}
                            session={session}
                            subject={subjectMap.get(session.subject_id || "")}
                          />
                        ))}
                      </AnimatedList>
                    </div>
                  ))}
                </AnimatedList>
              ) : (
                <EmptyState
                  compact
                  icon={<CalendarDays className="h-6 w-6" />}
                  title={
                    search || status !== "all"
                      ? "No sessions in this view."
                      : "Your time. A little more intentional."
                  }
                  description={
                    search || status !== "all"
                      ? "Try another keyword or show all session statuses."
                      : "Even 30 minutes can move you forward. Choose a subject, make a plan, and give yourself a little focus."
                  }
                  action={
                    search || status !== "all" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearch("");
                          setStatus("all");
                        }}
                      >
                        Clear filters
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setModal(true)}>
                        <Plus className="h-3.5 w-3.5" /> Plan your first session
                      </Button>
                    )
                  }
                />
              )}
            </Card>
          </Reveal>
        </div>
        <div className="min-w-0 space-y-5">
          <Reveal delay={0.06}>
            <ScheduleCopilot />
          </Reveal>
          <Reveal delay={0.08}>
            <Card className="!border-brand-200 !bg-brand-50/70">
              <div className="mb-5 flex items-center gap-2">
                <Sun className="h-4 w-4 text-brand-600" />
                <h2 className="section-title">A little focus, today</h2>
              </div>
              <div className="my-6 flex justify-center">
                <ProgressRing
                  size={122}
                  stroke={8}
                  value={todayMinutes ? (todayDone / todayMinutes) * 100 : 0}
                  label="Today’s planned study time completed"
                />
              </div>
              <div className="grid grid-cols-2 divide-x divide-brand-200 text-center">
                <div>
                  <p className="font-display text-lg font-bold">
                    {minutesToLabel(todayDone)}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    Completed today’s plan
                  </p>
                </div>
                <div>
                  <p className="font-display text-lg font-bold">
                    {minutesToLabel(todayMinutes)}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    Planned for today
                  </p>
                </div>
              </div>
              <p className="mt-6 border-t border-brand-200 pt-4 text-center text-xs leading-relaxed text-muted">
                {todayMinutes
                  ? "Steady progress beats a perfect plan. One session at a time."
                  : "Make a little time for the things you want to understand better."}
              </p>
            </Card>
          </Reveal>
          <Reveal delay={0.1}>
            <Card>
              <CardHeader
                title="Set yourself up for focus"
                icon={<Target className="h-4 w-4 text-brand-600" />}
              />
              <ol className="space-y-5">
                {[
                  [
                    "Start small",
                    "A 25–45 minute session is a good place to begin.",
                  ],
                  [
                    "Pick one thing",
                    "Give each session a clear subject or topic.",
                  ],
                  [
                    "Make space to recharge",
                    "A short break can help you return with a clearer mind.",
                  ],
                ].map(([title, text], i) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-muted">
                      0{i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold">{title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">
                        {text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href="/insights"
                className="text-link mt-6 border-t border-line pt-4 text-[11px]"
              >
                See your study patterns <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
          </Reveal>
        </div>
      </div>
      <SessionFormModal
        open={modal}
        onClose={() => setModal(false)}
        defaultDate={selected}
      />
    </>
  );
}
