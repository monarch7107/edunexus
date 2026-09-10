"use client";

import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Entry point to the real Planning Agent flow. It never fabricates a
 * proposal inline — it routes the student to the AI Command Center, where
 * the gateway-connected Copilot proposes a change set for approval.
 */
export function AICommandBox({
  summary,
  actionLabel = "Optimize my schedule",
}: {
  /** Honest one-line description of the student's current context. */
  summary?: string;
  actionLabel?: string;
}) {
  return (
    <Card className="border-brand-800 bg-brand-900 text-white shadow-xl shadow-brand-900/10 dark:border-white/10 dark:bg-[#0f1b33]">
      <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-white/70">
            <Sparkles className="size-4" aria-hidden /> AI command center
          </div>
          <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-white">
            What should we help you decide next?
          </h3>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/85">
            {summary ??
              "Ask for a recommendation. EduNexus will explain its context, propose changes, and keep you in control."}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/70">
            <ShieldCheck className="size-3.5" aria-hidden />
            Nothing is written until you approve. Changes are verified against the database.
          </p>
        </div>
        <ButtonLink
          href="/ai"
          variant="secondary"
          className="shrink-0 border border-white/20 !bg-white !text-[#12214d] hover:!bg-white/90"
        >
          {actionLabel} <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      </CardContent>
    </Card>
  );
}
