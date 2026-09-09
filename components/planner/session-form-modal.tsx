"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { toDateInput } from "@/lib/utils";
import { isValidCalendarDate } from "@/lib/dates";
import { useApp } from "@/components/providers/app-data";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120].map((m) => ({
  value: String(m),
  label: m < 60 ? `${m} minutes` : m === 60 ? "1 hour" : `${m / 60} hours`,
}));

export function SessionFormModal({
  open,
  onClose,
  defaultSubjectId,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  defaultSubjectId?: string | null;
  defaultDate?: string;
}) {
  const { subjects, createSession } = useApp();

  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [plannedDate, setPlannedDate] = useState(toDateInput());
  const [duration, setDuration] = useState("45");
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setSubjectId(defaultSubjectId ?? "");
      setPlannedDate(defaultDate || toDateInput());
      setDuration("45");
      setErrors({});
    }
  }, [open, defaultSubjectId, defaultDate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next: typeof errors = {};
    if (!title.trim())
      next.title = "Give your session a title, e.g. ‘Revise OS deadlocks’.";
    if (!plannedDate) next.date = "Pick a planned date for your session.";
    else if (!isValidCalendarDate(plannedDate))
      next.date = "That date doesn’t look valid. Pick a real calendar date.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await createSession({
        title,
        subject_id: subjectId || null,
        planned_date: plannedDate,
        duration_minutes: Number(duration),
      });
      onClose();
    } catch {
      // toast handled by provider
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      busy={busy}
      onClose={onClose}
      title="Plan a study session"
      description="Schedule focused time for a subject or topic."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Session title" htmlFor="session-title" required>
          <Input
            id="session-title"
            placeholder="e.g. Revise normalization (DBMS)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            invalid={Boolean(errors.title)}
          />
          {errors.title && (
            <p className="text-xs text-red-600">{errors.title}</p>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject" htmlFor="session-subject">
            <Select
              id="session-subject"
              placeholder="No subject"
              options={subjects.map((s) => ({
                value: s.id,
                label: s.code ? `${s.code} — ${s.name}` : s.name,
              }))}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            />
          </Field>

          <Field label="Duration" htmlFor="session-duration">
            <Select
              id="session-duration"
              options={DURATION_OPTIONS}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </Field>

          <Field label="Planned date" htmlFor="session-date" required>
            <Input
              id="session-date"
              type="date"
              value={plannedDate}
              invalid={Boolean(errors.date)}
              onChange={(e) => setPlannedDate(e.target.value)}
            />
            {errors.date && (
              <p className="text-xs text-red-600">{errors.date}</p>
            )}
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" loading={busy} loadingLabel="Saving…">
            Plan session
          </Button>
        </div>
      </form>
    </Modal>
  );
}
