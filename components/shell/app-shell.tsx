"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "@/components/providers/app-data";
import { LoadingState } from "@/components/ui/states";
import { Sidebar } from "./sidebar";
import { MobileNavigation } from "./mobile-navigation";
import { Logo } from "./logo";

/**
 * Client-side route guard + authenticated layout.
 * Middleware also protects these routes server-side (Supabase session or the
 * demo session cookie), so this is defense-in-depth, not the only check.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const onboarded = Boolean(profile && profile.onboarded);
    if (!onboarded && pathname !== "/onboarding") {
      router.replace("/onboarding");
    } else if (onboarded && pathname === "/onboarding") {
      router.replace("/dashboard");
    }
  }, [loading, user, profile, pathname, router]);

  if (loading || !user) {
    return <LoadingState label="Preparing your workspace…" />;
  }

  const onboarded = Boolean(profile && profile.onboarded);
  if (!onboarded && pathname !== "/onboarding") {
    return <LoadingState label="Finishing your setup…" />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      {/* Mobile top bar */}
      <div className="sticky top-0 z-20 flex h-14 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <Logo />
      </div>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </div>
      </main>

      <MobileNavigation />
    </div>
  );
}
