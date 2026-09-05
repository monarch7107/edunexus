"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ChevronRight, Circle, GraduationCap } from "lucide-react";
import { useApp } from "@/components/providers/app-data";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { PageTransition } from "@/components/ui/motion";
import { ThemePicker } from "@/components/theme/theme-picker";
import { Sidebar } from "./sidebar";
import { MobileNavigation } from "./mobile-navigation";
import { Logo } from "./logo";
import { WorkspaceSearch } from "./workspace-search";
import { APP_NAV } from "@/lib/constants";
import { initials } from "@/lib/utils";

/** Existing client guard complements the unchanged server middleware. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, error, refresh, mode } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (loading || error) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const onboarded = Boolean(profile?.onboarded);
    if (!onboarded && pathname !== "/onboarding") router.replace("/onboarding");
    else if (onboarded && pathname === "/onboarding")
      router.replace("/dashboard");
  }, [loading, user, profile, pathname, router, error]);
  if (error && (!user || !profile))
    return (
      <main className="mx-auto max-w-2xl p-6 pt-24">
        <ErrorState message={error} onRetry={() => void refresh()} />
      </main>
    );
  if (loading || !user)
    return <LoadingState label="Preparing your workspace…" />;
  if (!profile?.onboarded && pathname !== "/onboarding")
    return <LoadingState label="Finishing your setup…" />;
  if (pathname === "/onboarding")
    return (
      <div className="min-h-screen bg-canvas">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link href="/" aria-label="EduNexus home">
            <Logo />
          </Link>
          <ThemePicker />
        </header>
        <main id="main-content" className="px-5 pb-16 pt-6">
          <PageTransition pageKey={pathname}>{children}</PageTransition>
        </main>
      </div>
    );
  const current =
    APP_NAV.find((item) => item.href === pathname)?.label || "Workspace";
  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-lg bg-brand-600 px-4 py-2 text-sm text-on-accent focus:translate-y-0"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="lg:pl-[232px] xl:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-line bg-surface px-5 sm:px-8">
          <div className="hidden items-center gap-2 text-[11px] text-muted lg:flex">
            <GraduationCap className="mr-1 h-4 w-4" />
            <span>My workspace</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-ink">{current}</span>
          </div>
          <Link
            href="/dashboard"
            aria-label="EduNexus dashboard"
            className="lg:hidden"
          >
            <Logo />
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <WorkspaceSearch />
            <span className="hidden h-5 w-px bg-line sm:block" />
            <ThemePicker />
            <Link
              href="/profile"
              aria-label="Open profile"
              className="hidden h-8 w-8 items-center justify-center rounded-full border border-brand-200 bg-brand-100 text-[11px] font-bold text-brand-700 sm:flex"
            >
              {initials(profile?.full_name || "S")}
            </Link>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1500px] px-5 pb-28 pt-7 outline-none sm:px-8 lg:pb-8 xl:px-9 xl:pt-8"
        >
          {error && (
            <div className="mb-5">
              <ErrorState message={error} onRetry={() => void refresh()} />
            </div>
          )}
          <PageTransition pageKey={pathname}>{children}</PageTransition>
          <footer className="mt-9 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5 text-[10px] text-muted">
            <span>Made for the way you learn.</span>
            <Link
              href="/profile#workspace"
              className="flex items-center gap-1.5 hover:text-brand-600"
            >
              <Circle className="h-1.5 w-1.5 fill-current text-brand-500" />
              {mode === "demo"
                ? "Local workspace · Saved in this browser"
                : "Connected to your workspace"}
            </Link>
          </footer>
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
