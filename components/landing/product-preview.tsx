"use client";
import { useState } from "react";
import {
  BookOpen,
  LayoutDashboard,
  CalendarDays,
  Library,
  ChartNoAxesCombined,
  Search,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  Check,
  Clock3,
  ArrowRight,
  Command,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ProgressBar, ProgressRing } from "@/components/ui/progress-bar";
import { Logo } from "@/components/shell/logo";
import { cn } from "@/lib/utils";

const INITIAL_TASKS = [
  {
    title: "Finish the DBMS assignment",
    subject: "Database Systems",
    due: "Today",
    color: "#829969",
    done: false,
  },
  {
    title: "Revise chapter 04: Optics",
    subject: "Applied Physics",
    due: "Tomorrow",
    color: "#b498ca",
    done: false,
  },
  {
    title: "Read: The design of algorithms",
    subject: "Computer Science",
    due: "Completed",
    color: "#bd9166",
    done: true,
  },
];
export function ProductPreview({ compact = false }: { compact?: boolean }) {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [view, setView] = useState<"tasks" | "plan">("tasks");
  const completed = tasks.filter((t) => t.done).length;
  return (
    <div className={cn("relative", compact && "pointer-events-none")}>
      <div className="relative overflow-hidden rounded-xl border border-slate-300/70 bg-surface shadow-[0_18px_65px_-25px_rgb(var(--shadow)/0.25)]">
        <div className="flex h-10 items-center justify-between border-b border-line bg-slate-50 px-4">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-1.5 w-1.5 rounded-full bg-[#d9a6a0]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#d6c699]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#abc19c]" />
          </div>
          <span className="flex items-center gap-1.5 text-[9px] text-muted">
            <BookOpen className="h-2.5 w-2.5" /> Your academic workspace
          </span>
          <span className="w-8" />
        </div>
        <div className="flex">
          <aside
            className="flex w-12 shrink-0 flex-col items-center gap-6 border-r border-line py-5 sm:w-[60px]"
            aria-hidden
          >
            <Logo
              withText={false}
              iconClassName="h-7 w-7 rounded-lg [&_svg]:h-4 [&_svg]:w-4"
            />
            {[
              LayoutDashboard,
              BookOpen,
              CalendarDays,
              Library,
              ChartNoAxesCombined,
            ].map((Icon, i) => (
              <span
                key={i}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md",
                  i === 0 ? "bg-brand-100 text-brand-700" : "text-slate-400",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
            ))}
            <span className="mt-auto flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-[9px] font-bold text-brand-700">
              AS
            </span>
          </aside>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between border-b border-line px-4 py-3 text-[9px] text-muted sm:px-6">
              <span>
                Workspace <span className="mx-2 text-slate-300">/</span>
                <span className="text-ink">Overview</span>
              </span>
              <span className="flex gap-2" aria-hidden>
                <Search className="h-3 w-3" />
                <Command className="h-3 w-3" />
              </span>
            </div>
            <div className="bg-canvas p-4 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-2">
                <div>
                  <p className="mb-1.5 text-[8px] font-medium uppercase tracking-widest text-muted">
                    A fresh day. A fresh start.
                  </p>
                  <h3 className="text-base font-bold tracking-tight sm:text-[20px]">
                    You’ve got this, Alex{" "}
                    <span aria-hidden className="text-brand-500">
                      ✳
                    </span>
                  </h3>
                  <p className="mt-1 text-[9px] text-muted">
                    A little focus today goes a long way.
                  </p>
                </div>
                <span className="hidden rounded-md border border-line bg-surface px-2.5 py-1.5 text-[8px] text-muted sm:inline-flex">
                  Your semester, at a glance
                </span>
              </div>
              <div className="mb-4 grid grid-cols-3 gap-2.5">
                {[
                  {
                    icon: BookOpen,
                    label: "My subjects",
                    value: "06",
                    sub: "Connected & organized",
                  },
                  {
                    icon: Check,
                    label: "Tasks completed",
                    value: `0${completed}`,
                    sub: `of ${tasks.length} priorities`,
                  },
                  {
                    icon: Clock3,
                    label: "Focus time",
                    value: "4h 30m",
                    sub: "This week",
                  },
                ].map(({ icon: Icon, label, value, sub }) => (
                  <div
                    key={label}
                    className="rounded-lg border border-line bg-surface p-3"
                  >
                    <span className="mb-2.5 flex items-center justify-between text-[8px] text-muted">
                      {label}
                      <Icon className="hidden h-3 w-3 text-brand-500 sm:block" />
                    </span>
                    <p className="font-display text-lg font-bold tracking-tight sm:text-xl">
                      {value}
                    </p>
                    <p className="mt-1 text-[7px] text-muted">{sub}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-[1.65fr_1fr]">
                <div className="rounded-lg border border-line bg-surface p-3.5">
                  <div className="mb-3.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold">
                      Make room for progress
                    </span>
                    <ArrowUpRight className="h-3 w-3 text-muted" />
                  </div>
                  <div className="mb-3 flex gap-3 border-b border-line text-[8px]">
                    <button
                      onClick={() => setView("tasks")}
                      aria-pressed={view === "tasks"}
                      className={cn(
                        "border-b-2 pb-2 font-medium transition-colors",
                        view === "tasks"
                          ? "border-brand-600 text-brand-700"
                          : "border-transparent text-muted",
                      )}
                    >
                      Today’s priorities
                    </button>
                    <button
                      onClick={() => setView("plan")}
                      aria-pressed={view === "plan"}
                      className={cn(
                        "border-b-2 pb-2 font-medium transition-colors",
                        view === "plan"
                          ? "border-brand-600 text-brand-700"
                          : "border-transparent text-muted",
                      )}
                    >
                      Study plan
                    </button>
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={view}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                    >
                      {view === "tasks" ? (
                        <div className="space-y-3.5">
                          {tasks.map((task, i) => (
                            <div
                              key={task.title}
                              className="flex items-start gap-2.5"
                            >
                              <button
                                type="button"
                                aria-label={`${task.done ? "Uncheck" : "Complete"} preview task: ${task.title}`}
                                aria-pressed={task.done}
                                onClick={() =>
                                  setTasks((ts) =>
                                    ts.map((t, j) =>
                                      i === j ? { ...t, done: !t.done } : t,
                                    ),
                                  )
                                }
                                className={cn(
                                  "mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-all hover:scale-110",
                                  task.done
                                    ? "border-brand-600 bg-brand-600 text-on-accent"
                                    : "border-slate-300",
                                )}
                              >
                                <Check
                                  className={cn(
                                    "h-2.5 w-2.5",
                                    !task.done && "opacity-0",
                                  )}
                                />
                              </button>
                              <span className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    "block text-[9px] font-medium leading-relaxed",
                                    task.done && "text-muted line-through",
                                  )}
                                >
                                  {task.title}
                                </span>
                                <span className="mt-1 flex items-center gap-1 text-[7px] text-muted">
                                  <span
                                    className="h-1 w-1 rounded-full"
                                    style={{ background: task.color }}
                                  />
                                  {task.subject}
                                </span>
                              </span>
                              {!task.done && (
                                <span className="hidden rounded bg-amber-50 px-1 py-0.5 text-[6px] text-amber-700 xl:block">
                                  {task.due}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="rounded-md border-l-2 border-brand-400 bg-brand-50 p-2.5">
                            <p className="text-[9px] font-semibold">
                              A focused start
                            </p>
                            <p className="mt-1 text-[8px] text-muted">
                              Database Systems · 45 minutes
                            </p>
                          </div>
                          <div className="rounded-md border-l-2 border-[#b89ccd] bg-slate-50 p-2.5">
                            <p className="text-[9px] font-semibold">
                              Make time for revision
                            </p>
                            <p className="mt-1 text-[8px] text-muted">
                              Applied Physics · 30 minutes
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <p className="mt-4 border-t border-line pt-2.5 text-[7px] text-muted">
                    {view === "tasks"
                      ? "Try checking a task. Small wins add up."
                      : "Intentional time. Meaningful progress."}
                  </p>
                </div>
                <div className="hidden rounded-lg border border-line bg-surface p-3.5 sm:block">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold">Your momentum</span>
                    <ChevronDown className="h-3 w-3 text-muted" />
                  </div>
                  <div className="flex justify-center py-2">
                    <ProgressRing
                      value={(completed / tasks.length) * 100}
                      size={83}
                      stroke={6}
                      label="Preview task progress"
                    />
                  </div>
                  <p className="mb-3 text-center text-[8px] text-muted">
                    Every step counts.
                  </p>
                  <div
                    className="flex h-10 items-end justify-between gap-1.5"
                    aria-hidden
                  >
                    {[30, 55, 42, 85, 65, 95, 45].map((height, i) => (
                      <div
                        key={i}
                        style={{ height: `${height}%` }}
                        className={cn(
                          "flex-1 rounded-t-sm",
                          i === 5 ? "bg-brand-500" : "bg-brand-200/60",
                        )}
                      />
                    ))}
                  </div>
                  <div className="mt-1.5 flex justify-between text-[6px] text-muted">
                    <span>MON</span>
                    <span>SUN</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[9px] font-semibold">
                    Your next best step, a little clearer.
                  </p>
                  <p className="mt-0.5 text-[8px] leading-relaxed text-muted">
                    {tasks.find((t) => !t.done)?.title ||
                      "All priorities complete. Make time to recharge."}
                  </p>
                </div>
                <ArrowRight className="ml-auto h-3 w-3 shrink-0 text-brand-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {!compact && (
        <div className="absolute -bottom-5 -left-5 hidden w-[184px] rounded-xl border border-line bg-surface p-3.5 shadow-lifted lg:block">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Check className="h-3 w-3" />
            </span>
            <span className="text-[10px] font-semibold">
              A little closer to your goals
            </span>
          </div>
          <ProgressBar
            value={(completed / tasks.length) * 100}
            label="Preview completed priorities"
          />
          <p className="mt-2 text-[8px] text-muted">
            {completed} of {tasks.length} priorities complete. Keep going.
          </p>
        </div>
      )}
    </div>
  );
}
