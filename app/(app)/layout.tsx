import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { LoadingState } from "@/components/ui/states";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingState label="Opening your workspace…" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
