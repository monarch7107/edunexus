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
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Home", Icon: LayoutDashboard },
  { href: "/academics", label: "Academics", Icon: BookOpen },
  { href: "/planner", label: "Planner", Icon: CalendarDays },
  { href: "/learning", label: "Learning", Icon: Bookmark },
  { href: "/insights", label: "Insights", Icon: BarChart3 },
  { href: "/profile", label: "Profile", Icon: UserRound },
];

export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-6">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                  active ? "text-brand-700" : "text-slate-500"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
