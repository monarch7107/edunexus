"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Plus, Clock } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { SessionFormModal } from "@/components/planner/session-form-modal";
import { StudySessionCard } from "@/components/planner/study-session-card";
import { useApp } from "@/components/providers/app-data";
import { dayKey, minutesToLabel, todayKey } from "@/lib/utils";
import type { StudySession } from "@/lib/types";

function Group({
  title,
  sessions,
  subjectMap,
  empty,
}: {
  title: string;
  sessions: StudySession[];
  subjectMap: Map<string, { name: string; code: string; color: string }>;
  empty?: string;
}) {
  if (sessions.length === 0 && empty) {
    return (
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          {empty}
        </p>
      </div>
    );
  }
  if (sessions.length === 0) return null;
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-slate-900">
        {title} ({sessions.length})
      </h2>
      <div className="space-y-3">
        {sessions.map((s) => (
          <StudySessionCard
            key={s.id}
            session={s}
            subject={
              s.subject_id
                ? subjectMap.get(s.subject_id)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

export default function PlannerPage() {
  const { sessions, subjects, loading } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  const subjectMap = useMemo(
    () =>
      new Map(
        subjects.map((s) => [s.id, { name: s.name, code: s.code, color: s.color }])
      ),
    [subjects]
  );

  const { today, upcoming, missed, completed } = useMemo(() => {
    const tk = todayKey();
    const planned = sessions
      .filter((s) => s.status === "planned")
      .sort((a, b) => a.planned_date.localeCompare(b.planned_date));
    return {
      today: planned.filter((s) => dayKey(s.planned_date) === tk),
      upcoming: planned.filter((s) => dayKey(s.planned_date)! > tk),
      missed: planned.filter((s) => dayKey(s.planned_date)! < tk),
      completed: sessions
        .filter((s) => s.status === "completed")
        .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")),
    };
  }, [sessions]);

  const plannedMinutes = sessions
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  if (loading) return <LoadingState label="Loading your planner…" />;

  return (
    <>
      <PageHeader
        title="Study planner"
        description="Plan focused study sessions and check them off as you go."
        action={
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-4 w-4" /> Plan session
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Planned
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {today.length + upcoming.length + missed.length}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Completed sessions
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {completed.length}
          </p>
        </Card>
        <Card>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Clock className="h-3.5 w-3.5" /> Study time logged
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {minutesToLabel(plannedMinutes)}
          </p>
        </Card>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-8 w-8" />}
          title="No study sessions planned"
          description="Break your studying into focused sessions — pick a subject, a duration and a date."
          action={
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> Plan your first session
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <Group
            title="Today"
            sessions={today}
            subjectMap={subjectMap}
            empty="Nothing planned for today — add a quick revision session."
          />
          <Group
            title="Upcoming"
            sessions={upcoming}
            subjectMap={subjectMap}
          />
          <Group
            title="Missed / reschedule"
            sessions={missed}
            subjectMap={subjectMap}
          />
          <Group
            title="Completed"
            sessions={completed}
            subjectMap={subjectMap}
          />
        </div>
      )}

      <SessionFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
