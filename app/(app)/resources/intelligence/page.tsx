"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Library, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { useApp } from "@/components/providers/app-data";
import { computeAcademicSignals } from "@/lib/intelligence";

export default function ResourceIntelligencePage() {
  const { subjects, tasks, sessions, resources, loading } = useApp();
  const signals = useMemo(
    () => computeAcademicSignals(subjects, tasks, sessions),
    [subjects, tasks, sessions],
  );
  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );
  const bySubject = useMemo(() => {
    const groups = new Map<string | null, typeof resources>();
    for (const r of resources) {
      const list = groups.get(r.subject_id) ?? [];
      list.push(r);
      groups.set(r.subject_id, list);
    }
    return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [resources]);

  if (loading) return <LoadingState label="Reading your resource library…" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Resources / Intelligence"
        title="Resources for your weak areas"
        description="Saved resources, connected to the subjects that need them. Recommendations are clearly separated from what you saved."
        action={
          <ButtonLink href="/learning" size="sm" variant="outline">
            Open library <ArrowRight className="size-3.5" aria-hidden />
          </ButtonLink>
        }
      />

      {signals.subjectAttention.length > 0 && (
        <Card className="border-brand-200 bg-brand-50/70">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
            <div>
              <p className="text-sm font-semibold">
                {signals.subjectAttention[0].name} needs attention —{" "}
                {signals.subjectAttention[0].reason}.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {resources.filter(
                  (r) => r.subject_id === signals.subjectAttention[0].id,
                ).length > 0
                  ? "Start with your saved resources for this subject below."
                  : "You have no saved resources for this subject yet — save notes or links from your library."}
              </p>
            </div>
          </div>
        </Card>
      )}

      {resources.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Library className="size-6" aria-hidden />}
            title="Your library is empty."
            description="Save notes and links per subject — this page will connect them to the subjects that need attention."
            action={
              <ButtonLink href="/learning">
                Go to Learning <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bySubject.map(([subjectId, items]) => {
            const subject = subjectId ? subjectMap.get(subjectId) : undefined;
            const needsAttention = signals.subjectAttention.some(
              (s) => s.id === subjectId,
            );
            return (
              <Card key={subjectId ?? "unsorted"}>
                <div className="flex items-center justify-between gap-2">
                  <BookOpen className="size-5 text-brand-600" aria-hidden />
                  <div className="flex gap-1.5">
                    <Badge variant="outline">Saved</Badge>
                    {needsAttention && (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-amber-800"
                      >
                        Needs attention
                      </Badge>
                    )}
                  </div>
                </div>
                <h2 className="mt-4 font-display text-base font-bold tracking-tight">
                  {subject?.name ?? "Unsorted resources"}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {items.length} saved {items.length === 1 ? "resource" : "resources"}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {items.slice(0, 4).map((item) => (
                    <li
                      key={item.id}
                      className="truncate rounded-md bg-slate-50 px-2.5 py-1.5 text-xs"
                    >
                      {item.title}
                    </li>
                  ))}
                  {items.length > 4 && (
                    <li className="text-[11px] text-muted">
                      +{items.length - 4} more in your library
                    </li>
                  )}
                </ul>
                <Link
                  href={
                    subjectId
                      ? `/learning?subject=${encodeURIComponent(subjectId)}`
                      : "/learning"
                  }
                  className="text-link mt-4"
                >
                  Open in Learning <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
