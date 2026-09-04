"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Bookmark,
  BarChart3,
  UserRound,
  LogOut,
  FlaskConical,
} from "lucide-react";
import { Logo } from "./logo";
import { cn, initials } from "@/lib/utils";
import { APP_NAV } from "@/lib/constants";
import { useApp } from "@/components/providers/app-data";
import { useRouter } from "next/navigation";

const ICONS = {
  "layout-dashboard": LayoutDashboard,
  "book-open": BookOpen,
  "calendar-days": CalendarDays,
  bookmark: Bookmark,
  "bar-chart-3": BarChart3,
  "user-round": UserRound,
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user, mode, signOut } = useApp();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="px-5 pb-4 pt-6">
        <Link href="/dashboard" aria-label="EduNexus home">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
        {APP_NAV.map((item) => {
          const Icon = ICONS[item.icon as keyof typeof ICONS];
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-slate-200 p-4">
        {mode === "demo" && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
            <FlaskConical className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              Demo mode — data is stored in this browser. Connect Supabase for
              production.
            </span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {initials(profile?.full_name || user?.email || "?")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {profile?.full_name || "Student"}
            </p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
