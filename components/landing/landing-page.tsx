"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  Command,
  Layers3,
  Library,
  Menu,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/shell/logo";
import { ButtonLink } from "@/components/ui/button";
import { ThemePicker } from "@/components/theme/theme-picker";
import { Reveal } from "@/components/ui/motion";
import { ProductPreview } from "./product-preview";
import { cn } from "@/lib/utils";

const FAQS = [
  [
    "What can I do with EduNexus?",
    "Organize your subjects and assignments, track deadlines, plan study sessions, collect notes and helpful links, and understand your academic progress—all in one connected workspace.",
  ],
  [
    "How do smart study recommendations work?",
    "EduNexus uses your own tasks, deadlines, subjects, and study history to suggest a focused plan. When an AI service is unavailable, transparent smart rules prioritize overdue work, upcoming deadlines, and task priority.",
  ],
  [
    "Where is my work saved?",
    "In a connected workspace, your data is saved with Supabase and protected by authenticated access. Without a configured backend, EduNexus runs in local mode and saves your work only in your current browser. Your workspace settings clearly show which mode you’re using.",
  ],
  [
    "Can I add my study documents?",
    "You can save a link to a hosted PDF, document, or image alongside your notes. The file picker lets you preview local files, but direct uploads are not available until secure file storage is connected. EduNexus never marks a file as uploaded when it hasn’t been.",
  ],
];
export function LandingPage() {
  const [menu, setMenu] = useState(false);
  return (
    <div className="overflow-x-clip bg-surface">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-brand-600 p-3 text-sm text-on-accent focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-[82px] max-w-[1380px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="EduNexus home">
            <Logo />
          </Link>
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-8 text-[12px] font-medium text-slate-600 md:flex"
          >
            <a
              href="#features"
              className="transition-colors hover:text-brand-600"
            >
              The workspace
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-brand-600"
            >
              How it works
            </a>
            <a
              href="#questions"
              className="transition-colors hover:text-brand-600"
            >
              Good to know
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemePicker />
            <Link
              href="/login"
              className="hidden text-xs font-semibold transition-colors hover:text-brand-600 sm:inline"
            >
              Log in
            </Link>
            <ButtonLink
              href="/register"
              size="sm"
              className="hidden sm:inline-flex"
            >
              Get started <ArrowUpRight className="h-3.5 w-3.5" />
            </ButtonLink>
            <button
              className="icon-button md:hidden"
              aria-label={menu ? "Close navigation" : "Open navigation"}
              aria-expanded={menu}
              onClick={() => setMenu((v) => !v)}
            >
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menu && (
          <nav
            aria-label="Mobile site navigation"
            className="space-y-1 border-t border-line px-5 py-4 md:hidden"
          >
            {[
              ["#features", "The workspace"],
              ["#how-it-works", "How it works"],
              ["#questions", "Good to know"],
              ["/login", "Log in"],
              ["/register", "Get started"],
            ].map(([href, title]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenu(false)}
                className="block rounded-lg p-3 text-sm hover:bg-brand-50"
              >
                {title}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main id="main-content">
        <section className="relative border-b border-line bg-canvas">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_70%_40%,rgb(var(--brand-100)/0.7),transparent_70%)]"
          />
          <div className="relative mx-auto grid max-w-[1380px] items-center gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[.91fr_1.22fr] lg:gap-12 lg:px-12 lg:pb-24 lg:pt-[86px]">
            <Reveal>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.13em] text-brand-700">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> A
                brighter way to student
              </div>
              <h1 className="max-w-[580px] font-display text-[47px] font-extrabold leading-[1.12] tracking-[-.065em] sm:text-[64px] lg:text-[62px] xl:text-[70px]">
                Less overwhelm.
                <br />
                More{" "}
                <span className="relative text-brand-600">
                  possibility.
                  <svg
                    viewBox="0 0 310 12"
                    className="absolute -bottom-2 left-0 h-3 w-full text-brand-300"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M3 7c85-7 180-8 302-2"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
              <p className="mt-8 max-w-[405px] text-[15px] leading-[1.85] text-slate-600">
                Everything you need to manage and improve your education, in one
                place. Meet the student workspace that turns big goals into
                everyday progress.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <ButtonLink href="/register" size="lg">
                  Create your workspace <ArrowUpRight className="h-4 w-4" />
                </ButtonLink>
                <a
                  href="#workspace"
                  className="text-link gap-2 py-3 text-xs text-slate-700"
                >
                  Take a closer look <ArrowDownRight className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-7 flex items-center gap-4 text-[10px] text-muted">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-brand-600" /> No card required
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>Made for your next chapter</span>
              </div>
            </Reveal>
            <Reveal delay={0.12} className="relative">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="eyebrow text-[8px] tracking-[.2em]">
                  One space. A clearer mind.
                </span>
                <span className="flex items-center gap-1 text-[8px] text-muted">
                  <Command className="h-2.5 w-2.5" /> Designed around you
                </span>
              </div>
              <ProductPreview />
              <p className="mt-9 text-center text-[9px] text-muted">
                Interactive product preview · Sample data, real possibilities
              </p>
            </Reveal>
          </div>
          <div className="mx-auto grid max-w-[1380px] grid-cols-2 gap-y-6 border-t border-line px-5 py-7 sm:px-8 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:px-12">
            <p className="eyebrow col-span-2 self-center text-[9px] leading-relaxed lg:col-span-1">
              From your first lecture
              <br />
              to your next big leap.
            </p>
            {[
              { Icon: Layers3, text: "Everything, connected" },
              { Icon: Target, text: "Your goals, within reach" },
              { Icon: ShieldCheck, text: "A space you can trust" },
            ].map(({ Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2.5 text-[11px] font-medium text-slate-600"
              >
                <Icon className="h-[17px] w-[17px] text-brand-600" />
                {text}
              </div>
            ))}
          </div>
        </section>
        <section
          id="features"
          className="mx-auto max-w-[1380px] px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
        >
          <Reveal>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow mb-3 text-brand-600">
                  Your academic life, beautifully in sync
                </p>
                <h2 className="text-3xl font-bold leading-tight tracking-[-.05em] sm:text-[39px]">
                  Many moving parts.
                  <br />
                  One thoughtful workspace.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted">
                Less switching tabs. More connecting the dots.
                <br />
                All the right tools, working together for you.
              </p>
            </div>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                Icon: BookOpen,
                title: "Bring order to your academics.",
                text: "Subjects, assignments, exams, and deadlines. Give everything a place, so nothing slips through.",
                tone: "bg-brand-50",
                type: "academics",
                link: "Find your structure",
              },
              {
                Icon: CalendarDays,
                title: "Make time for what matters.",
                text: "Turn ‘I should study’ into a plan. Build focused sessions around your subjects and your life.",
                tone: "bg-amber-50",
                type: "planner",
                link: "Find your rhythm",
              },
              {
                Icon: Library,
                title: "Keep your knowledge close.",
                text: "Your notes, useful links, and learning materials. An organized library that grows with you.",
                tone: "bg-sky-50",
                type: "learning",
                link: "Build your library",
              },
            ].map(({ Icon, title, text, tone, type, link }, index) => (
              <Reveal delay={index * 0.05} key={title}>
                <article className="card card-interactive flex h-full flex-col overflow-hidden !rounded-xl !shadow-none">
                  <div
                    className={cn(
                      "relative flex h-48 items-center justify-center overflow-hidden border-b border-line p-7",
                      tone,
                    )}
                  >
                    {type === "academics" ? (
                      <div className="w-full max-w-[255px] rounded-lg border border-line bg-surface p-4 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-brand-600" />
                          <span className="text-[11px] font-semibold">
                            Computer Science
                          </span>
                          <span className="ml-auto rounded bg-brand-50 px-1.5 py-1 text-[8px] text-brand-700">
                            CS 201
                          </span>
                        </div>
                        {[
                          "Data structures assignment",
                          "Algorithms revision",
                        ].map((title, i) => (
                          <div
                            key={title}
                            className="mt-2.5 flex items-center gap-2 text-[9px] text-muted"
                          >
                            <span
                              className={cn(
                                "flex h-3 w-3 items-center justify-center rounded border",
                                i === 0
                                  ? "border-brand-500 bg-brand-500 text-white"
                                  : "border-slate-300",
                              )}
                            >
                              {i === 0 && <Check className="h-2 w-2" />}
                            </span>
                            {title}
                          </div>
                        ))}
                        <div className="mt-4 h-1 rounded-full bg-slate-100">
                          <div className="h-full w-2/3 rounded-full bg-brand-400" />
                        </div>
                      </div>
                    ) : type === "planner" ? (
                      <div className="w-full max-w-[255px] rounded-lg border border-line bg-surface p-4 shadow-sm">
                        <div className="mb-3 flex justify-between text-[8px] text-muted">
                          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                            <span
                              key={i}
                              className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-full",
                                i === 2 && "bg-brand-600 text-on-accent",
                              )}
                            >
                              {day}
                            </span>
                          ))}
                        </div>
                        <div className="rounded-md border-l-2 border-brand-500 bg-brand-50 p-3">
                          <p className="text-[10px] font-semibold">
                            Your moment to focus
                          </p>
                          <p className="mt-1 text-[8px] text-muted">
                            Physics revision · 45 minutes
                          </p>
                        </div>
                        <span className="mt-3 block text-[8px] text-muted">
                          A little intention goes a long way.
                        </span>
                      </div>
                    ) : (
                      <div className="relative flex w-full max-w-[255px] gap-3">
                        <div className="w-1/2 -rotate-6 rounded-lg border border-line bg-surface p-4 shadow-sm">
                          <div className="mb-5 h-8 w-7 rounded bg-amber-100 p-1.5">
                            <div className="mb-1 h-0.5 bg-amber-500/30" />
                            <div className="h-0.5 bg-amber-500/30" />
                          </div>
                          <p className="text-[10px] font-semibold">
                            Aha! moments
                          </p>
                          <p className="mt-2 text-[8px] text-muted">
                            Your own notes
                          </p>
                        </div>
                        <div className="mt-6 w-1/2 rotate-6 rounded-lg border border-line bg-surface p-4 shadow-sm">
                          <Library className="mb-5 h-8 w-7 text-sky-600" />
                          <p className="text-[10px] font-semibold">
                            Worth keeping
                          </p>
                          <p className="mt-2 text-[8px] text-muted">
                            Links & references
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <span className="mb-4 text-brand-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="max-w-[250px] text-xl font-bold leading-snug tracking-[-.04em]">
                      {title}
                    </h3>
                    <p className="mb-6 mt-3 text-xs leading-[1.8] text-muted">
                      {text}
                    </p>
                    <Link href="/register" className="text-link mt-auto">
                      {link}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Reveal>
              <div className="card card-interactive flex h-full items-start gap-4 p-6 !shadow-none">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold tracking-tight">
                    A smarter sense of direction.
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    Personalized study priorities based on your real workload.
                    Not more to do—just a clearer idea of what comes next.
                  </p>
                  <span className="mt-3 inline-block text-[9px] font-medium uppercase tracking-widest text-brand-600">
                    AI guidance + dependable smart rules
                  </span>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <div className="card card-interactive flex h-full items-start gap-4 p-6 !shadow-none">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <ChartNoAxesCombined className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold tracking-tight">
                    See how far you’ve come.
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    Turn completed tasks and focused hours into a meaningful
                    picture of your progress. Small wins deserve to be seen.
                  </p>
                  <span className="mt-3 inline-block text-[9px] font-medium uppercase tracking-widest text-brand-600">
                    Real activity. Meaningful insights.
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
        <section id="how-it-works" className="bg-[#203e2f] text-[#f5f5e9]">
          <div className="mx-auto max-w-[1380px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="mb-4 text-[9px] font-bold uppercase tracking-[.2em] text-[#b4c6a5]">
                    A better day starts with a little clarity
                  </p>
                  <h2 className="text-3xl font-semibold leading-tight tracking-[-.045em] sm:text-[40px]">
                    Not another thing to manage.
                    <br />A better way to manage everything.
                  </h2>
                </div>
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#6a856b]">
                  <ArrowDownRight className="h-6 w-6 text-[#c0d6af]" />
                </span>
              </div>
            </Reveal>
            <div className="mt-14 grid gap-9 md:grid-cols-3">
              {[
                {
                  title: "Make it yours.",
                  text: "Set up your profile, add your subjects, and bring your semester into one clear view.",
                },
                {
                  title: "Find your focus.",
                  text: "Plan your study time, tackle the next priority, and keep your resources close at hand.",
                },
                {
                  title: "Grow, a little every day.",
                  text: "Check things off. Notice your progress. Adjust your rhythm. You’re building something good.",
                },
              ].map(({ title, text }, i) => (
                <Reveal key={title} delay={i * 0.06}>
                  <div className="border-t border-[#536c58] pt-5">
                    <span className="font-display text-xs text-[#b4c6a5]">
                      0{i + 1}
                    </span>
                    <h3 className="mt-5 text-lg font-semibold tracking-tight">
                      {title}
                    </h3>
                    <p className="mt-3 max-w-xs text-xs leading-[1.85] text-[#c3cec3]">
                      {text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
        <section
          id="workspace"
          className="border-b border-line bg-canvas px-5 py-20 sm:px-8"
        >
          <Reveal>
            <div className="mx-auto max-w-xl text-center">
              <p className="eyebrow mb-4 text-brand-600">
                Built for real student life
              </p>
              <h2 className="text-3xl font-bold tracking-[-.05em] sm:text-[40px]">
                Your big picture.
                <br />
                And your next small step.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
                A command center that puts today’s priorities, your progress,
                and your learning in perspective.
              </p>
            </div>
          </Reveal>
          <Reveal className="mx-auto mt-10 max-w-[850px]">
            <ProductPreview />
            <p className="mt-9 text-center text-[10px] text-muted">
              Explore the sample: switch views and check off a priority. Your
              real workspace starts fresh.
            </p>
          </Reveal>
          <div className="mt-7 text-center">
            <ButtonLink href="/register" size="lg">
              Make it your own <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </section>
        <section
          id="questions"
          className="mx-auto grid max-w-[1190px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-20"
        >
          <Reveal>
            <p className="eyebrow mb-4 text-brand-600">A little more clarity</p>
            <h2 className="text-3xl font-bold tracking-[-.05em]">
              Good questions.
              <br />
              Straight answers.
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Know your workspace before you make it yours.
            </p>
          </Reveal>
          <div className="divide-y divide-line border-y border-line">
            {FAQS.map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  {question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 pr-5 text-xs leading-[1.9] text-muted">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </section>
        <section className="mx-auto mb-16 max-w-[1284px] px-5 sm:px-8">
          <Reveal>
            <div className="subtle-grid rounded-2xl border border-brand-200 bg-brand-50 px-6 py-14 text-center">
              <span className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 bg-surface text-brand-600">
                <Zap className="h-5 w-5" />
              </span>
              <h2 className="text-3xl font-bold tracking-[-.05em] sm:text-[40px]">
                Your next chapter looks bright.
              </h2>
              <p className="mb-7 mt-4 text-sm text-muted">
                Bring your goals. We’ll help you find your way.
              </p>
              <ButtonLink href="/register" size="lg">
                Let’s make progress <ArrowUpRight className="h-4 w-4" />
              </ButtonLink>
              <p className="mt-4 text-[10px] text-muted">
                One workspace. All your possibilities.
              </p>
            </div>
          </Reveal>
        </section>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-6 px-5 py-8 sm:px-8 lg:px-12">
          <div>
            <Link href="/" aria-label="EduNexus home">
              <Logo />
            </Link>
            <p className="mt-2 text-[10px] text-muted">
              Made for the way you learn.
            </p>
          </div>
          <div className="flex gap-6 text-xs text-muted">
            <a href="#features" className="hover:text-brand-600">
              The workspace
            </a>
            <Link href="/login" className="hover:text-brand-600">
              Log in
            </Link>
            <Link href="/register" className="hover:text-brand-600">
              Get started
            </Link>
          </div>
          <p className="text-[10px] text-muted">
            © {new Date().getFullYear()} EduNexus. Keep growing.
          </p>
        </div>
      </footer>
    </div>
  );
}
