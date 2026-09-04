"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { toDateInput } from "@/lib/utils";
import { useApp } from "@/components/providers/app-data";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120].map((m) => ({
  value: String(m),
  label: m < 60 ? `${m} minutes` : m === 60 ? "1 hour" : `${m / 60} hours`,
}));

export function SessionFormModal({
  open,
  onClose,
  defaultSubjectId,
}: {
  open: boolean;
  onClose: () => void;
  defaultSubjectId?: string | null;
}) {
  const { subjects, createSession } = useApp();

  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [plannedDate, setPlannedDate] = useState(toDateInput());
  const [duration, setDuration] = useState("45");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setSubjectId(defaultSubjectId ?? "");
      setPlannedDate(toDateInput());
      setDuration("45");
      setError("");
    }
  }, [open, defaultSubjectId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give your session a title, e.g. 'Revise OS deadlocks'.");
      return;
    }
    if (!plannedDate) {
      setError("Pick a planned date.");
      return;
    }
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
            invalid={Boolean(error)}
            autoFocus
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
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
              onChange={(e) => setPlannedDate(e.target.value)}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Plan session
          </Button>
        </div>
      </form>
    </Modal>
  );
}
