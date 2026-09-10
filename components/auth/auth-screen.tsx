"use client";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  Leaf,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/shell/logo";
import { ThemePicker } from "@/components/theme/theme-picker";
import { Reveal } from "@/components/ui/motion";
import { useApp } from "@/components/providers/app-data";
export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const { mode } = useApp();
  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-[1.02fr_1fr]">
      <aside className="relative hidden min-h-screen flex-col overflow-hidden border-r border-hero-line bg-hero p-12 text-hero-ink lg:flex xl:p-16">
        <Link href="/" aria-label="EduNexus home">
          <Logo
            className="[&>span:last-child]:!text-hero-ink"
            iconClassName="!bg-gold !text-on-gold"
          />
        </Link>
        <div className="relative z-10 my-auto max-w-lg py-16">
          <Reveal>
            <p className="mb-5 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.18em] text-hero-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" /> A
              brighter way to student
            </p>
            <h2 className="text-[44px] font-semibold leading-[1.18] tracking-[-.055em] xl:text-[52px]">
              Big dreams.
              <br />
              Small steps.
              <br />
              <span className="gradient-text">All in one place.</span>
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-[1.9] text-hero-muted">
              Your academic life has a lot of moving parts. Let’s bring them
              together—and make a little more room for possibility.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative mt-12 max-w-[365px]">
              <div
                aria-hidden
                className="absolute -right-4 -top-4 h-full w-full rotate-[4deg] rounded-xl border border-white/10 bg-white/5"
              />
              <div className="relative rounded-xl border border-white/15 bg-white/10 p-6 text-hero-ink backdrop-blur-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[.15em] text-hero-muted">
                      A little everyday progress
                    </p>
                    <h3 className="mt-1.5 text-base font-bold tracking-tight">
                      A calmer kind of productive.
                    </h3>
                  </div>
                  <Leaf className="h-6 w-6 text-gold" />
                </div>
                {[
                  {
                    Icon: BookOpen,
                    label: "Bring your subjects together",
                    sub: "Everything has its place.",
                  },
                  {
                    Icon: CalendarDays,
                    label: "Make time for focused learning",
                    sub: "A plan that works for you.",
                  },
                  {
                    Icon: Sparkles,
                    label: "See your next best step",
                    sub: "A little intelligent direction.",
                  },
                ].map(({ Icon, label, sub }, i) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 border-t border-white/10 py-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-gold">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold">{label}</p>
                      <p className="mt-1 text-[8px] text-hero-muted">{sub}</p>
                    </div>
                    {i === 2 ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-gold" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-gold" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
        <p className="relative z-10 text-[10px] text-hero-muted">
          Made for the way you learn. And the person you’re becoming.
        </p>
        <div
          aria-hidden
          className="absolute -bottom-32 -right-36 h-[490px] w-[490px] rounded-full border-[70px] border-white/[.04]"
        />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between px-5 py-5 sm:px-10 lg:justify-end">
          <Link href="/" aria-label="EduNexus home" className="lg:hidden">
            <Logo />
          </Link>
          <ThemePicker />
        </header>
        <main className="mx-auto flex w-full max-w-[445px] flex-1 flex-col justify-center px-6 pb-12 pt-4 sm:px-8">
          <Reveal>
            <Link
              href="/"
              className="mb-9 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted transition-colors hover:text-brand-600"
            >
              <ArrowLeft className="h-3 w-3" /> Back to a little possibility
            </Link>
            <div className="mb-7">
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-600">
                <BookOpen className="h-5 w-5" />
              </span>
              <h1 className="text-[30px] font-bold leading-tight tracking-[-.05em]">
                {title}
              </h1>
              <p className="mt-3 text-[13px] leading-relaxed text-muted">
                {subtitle}
              </p>
            </div>
            {children}
            <p className="mt-7 text-center text-xs text-muted">{footer}</p>
            {mode === "demo" && (
              <div className="mt-8 border-t border-line pt-5">
                <p className="text-center text-[10px] leading-relaxed text-muted">
                  <span className="font-semibold text-slate-600">
                    You’re in a local workspace.
                  </span>
                  <br />
                  Your account and academic data are saved in this browser only.
                </p>
              </div>
            )}
          </Reveal>
        </main>
        <p className="px-6 pb-6 text-center text-[9px] text-muted">
          A little more organized. A lot more you. © {new Date().getFullYear()}{" "}
          EduNexus
        </p>
      </div>
    </div>
  );
}
