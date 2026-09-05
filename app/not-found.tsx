import { ArrowLeft, BookOpen } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/shell/logo";
export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas p-6">
      <Logo />
      <main className="mx-auto max-w-md py-24 text-center">
        <BookOpen className="mx-auto mb-6 h-10 w-10 text-brand-600" />
        <p className="eyebrow mb-3">A little detour · 404</p>
        <h1 className="text-3xl font-bold tracking-tight">
          Let’s find your way back.
        </h1>
        <p className="mb-7 mt-4 text-sm leading-relaxed text-muted">
          This page isn’t in your workspace. The link may have changed, but
          there’s still plenty to explore.
        </p>
        <ButtonLink href="/">
          <ArrowLeft className="h-4 w-4" /> Back to EduNexus
        </ButtonLink>
      </main>
    </div>
  );
}
