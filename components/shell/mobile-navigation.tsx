"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { NAV_ICONS } from "./sidebar";
export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-6 px-1">
        {APP_NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          const Icon = NAV_ICONS[icon];
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[68px] flex-col items-center justify-center gap-1 text-[9px] font-medium transition-colors",
                  active ? "text-brand-700" : "text-muted hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-10 items-center justify-center rounded-lg transition-colors",
                    active && "bg-brand-100",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
