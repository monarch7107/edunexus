import Link from "next/link";
import {
  ArrowRight,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Bookmark,
  BarChart3,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Logo } from "@/components/shell/logo";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Academics, organized",
    text: "Subjects, assignments, exams and projects in one place with deadlines and priorities.",
  },
  {
    icon: CalendarDays,
    title: "Study planner",
    text: "Plan focused study sessions by subject, date and duration — then mark them done.",
  },
  {
    icon: Bookmark,
    title: "Learning resources",
    text: "Save notes and useful links, linked to subjects, and search them instantly.",
  },
  {
    icon: BarChart3,
    title: "Progress insights",
    text: "Completion rates, overdue work, subject progress and study time at a glance.",
  },
  {
    icon: LayoutDashboard,
    title: "Unified dashboard",
    text: "Today's tasks, upcoming deadlines, overdue work and study sessions on one screen.",
  },
  {
    icon: Sparkles,
    title: "AI study priority",
    text: "Get a smart, data-driven study plan — with a reliable rule-based fallback.",
  },
];

const PROBLEMS = [
  "Jumping between 5+ apps for tasks, notes, links and schedules",
  "Missing deadlines because nothing shows what's due next",
  "No view of progress or where study time actually goes",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-slate-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link href="/register">
              <Button size="sm">
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(59,98,246,0.10),transparent)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <Sparkles className="h-3.5 w-3.5" />
            One workspace for your entire academic life
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Everything a student needs,{" "}
            <span className="text-brand-600">in one place.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            EduNexus unifies your subjects, assignments, deadlines, study
            sessions, learning resources and progress — so you stop
            juggling apps and start getting work done.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg">
                Start free — no setup needed
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                I already have an account
              </Button>
            </Link>
          </div>

          {/* Dashboard preview card */}
          <div className="mx-auto mt-14 max-w-4xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between text-left">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Good afternoon, Priya 👋
                    </p>
                    <p className="text-xs text-slate-500">
                      You have 3 tasks due this week and 1 overdue.
                    </p>
                  </div>
                  <span className="hidden rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 sm:inline">
                    1 overdue
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["DBMS Assignment", "Due tomorrow · High", "bg-red-50 text-red-700"],
                    ["Physics Unit 3", "Due Fri · Medium", "bg-amber-50 text-amber-700"],
                    ["Study: OS Revision", "Today · 45 min", "bg-brand-50 text-brand-700"],
                  ].map(([title, meta, chip]) => (
                    <div
                      key={title}
                      className="rounded-lg border border-slate-200 bg-white p-3 text-left"
                    >
                      <p className="text-sm font-medium text-slate-800">{title}</p>
                      <span
                        className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${chip}`}
                      >
                        {meta}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / solution */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              The problem students actually face
            </h2>
            <ul className="mt-6 space-y-4">
              {PROBLEMS.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <span className="text-sm text-slate-700">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              How EduNexus solves it
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                "One dashboard shows today's work, deadlines and overdue items",
                "Tasks and study sessions are grouped by your subjects",
                "Insights show completion, progress and study time",
                "AI suggests what to study next — and works even if AI is down",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <span className="text-sm text-slate-700">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Built for student life
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-600">
          Not a pile of random tools — a focused academic workspace.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/register">
            <Button size="lg">
              Create your workspace <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-xs text-slate-500">
            EduNexus · Smart India Hackathon · Everything academic, unified.
          </p>
        </div>
      </footer>
    </div>
  );
}
