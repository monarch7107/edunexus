"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Library,
  ChartNoAxesCombined,
  UserRound,
  LogOut,
  ChevronDown,
  ArrowUpRight,
  Sprout,
  Loader2,
  CircleHelp,
} from "lucide-react";
import { Logo } from "./logo";
import { cn, initials } from "@/lib/utils";
import { APP_NAV } from "@/lib/constants";
import { useApp } from "@/components/providers/app-data";
import { ProgressBar } from "@/components/ui/progress-bar";

export const NAV_ICONS = {
  "layout-dashboard": LayoutDashboard,
  "book-open": BookOpen,
  "calendar-days": CalendarDays,
  bookmark: Library,
  "bar-chart-3": ChartNoAxesCombined,
  "user-round": UserRound,
} as const;
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user, mode, tasks, signOut } = useApp();
  const [leaving, setLeaving] = useState(false);
  const complete = tasks.filter((t) => t.status === "completed").length;
  const pct = tasks.length ? Math.round((complete / tasks.length) * 100) : 0;
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col overflow-y-auto overscroll-contain border-r border-line bg-surface lg:flex xl:w-[248px]">
      <Link
        href="/dashboard"
        className="px-6 pb-8 pt-7"
        aria-label="EduNexus dashboard"
      >
        <Logo />
      </Link>
      <Link
        href="/profile"
        className="mx-4 mb-7 flex items-center gap-3 rounded-lg border border-line bg-canvas p-3 transition-colors hover:border-brand-300"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-100 text-brand-700">
          <BookOpen className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold">
            My workspace
          </span>
          <span className="mt-0.5 block truncate text-[10px] text-muted">
            {profile?.course
              ? `${profile.course}${profile.semester ? ` · Semester ${profile.semester}` : ""}`
              : "Your academic home"}
          </span>
        </span>
        <ChevronDown className="h-3 w-3 text-muted" />
      </Link>
      <nav className="flex-1 px-4" aria-label="Main navigation">
        <p className="eyebrow mb-3 px-3">Workspace</p>
        <div className="space-y-1.5">
          {APP_NAV.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-medium transition-all",
                  active
                    ? "bg-brand-50 font-semibold text-brand-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-ink",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-transform group-hover:-translate-y-px",
                    active && "text-brand-600",
                  )}
                  strokeWidth={active ? 2 : 1.7}
                  aria-hidden
                />
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-600" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="mx-4 mb-5 mt-8 rounded-xl border border-brand-100 bg-brand-50/70 p-4">
        <Sprout className="mb-3 h-5 w-5 text-brand-600" />
        <p className="font-display text-xs font-bold">
          Small steps. Big possibilities.
        </p>
        <p className="mb-4 mt-1.5 text-[11px] leading-relaxed text-muted">
          {tasks.length
            ? `${complete} of ${tasks.length} tasks complete. Keep growing at your own pace.`
            : "Your next chapter starts with one small step."}
        </p>
        {tasks.length > 0 ? (
          <ProgressBar value={pct} label="Overall task completion" />
        ) : (
          <Link href="/academics" className="text-link text-[11px]">
            Build your study space <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="px-6 pb-4">
        <Link
          href="/profile#workspace"
          className="flex items-center gap-2 text-[11px] text-muted transition-colors hover:text-brand-600"
        >
          <CircleHelp className="h-3.5 w-3.5" />
          {mode === "demo"
            ? "Local workspace · About your data"
            : "Your data & preferences"}
        </Link>
      </div>
      <div className="flex items-center gap-2.5 border-t border-line px-5 py-4">
        <Link
          href="/profile"
          aria-label="Open your profile"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-brand-100 font-display text-xs font-bold text-brand-800"
        >
          {initials(profile?.full_name || user?.email || "S")}
        </Link>
        <Link href="/profile" className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">
            {profile?.full_name || "Your profile"}
          </p>
          <p className="mt-1 truncate text-[10px] text-muted">
            {profile?.branch || user?.email}
          </p>
        </Link>
        <button
          className="icon-button -mr-2"
          aria-label="Sign out"
          title="Sign out"
          disabled={leaving}
          onClick={async () => {
            setLeaving(true);
            try {
              await signOut();
              router.push("/login");
            } catch {
              /* Provider shows error. */
            } finally {
              setLeaving(false);
            }
          }}
        >
          {leaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
