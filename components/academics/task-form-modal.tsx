"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { TASK_PRIORITIES, TASK_TYPES } from "@/lib/constants";
import { toDateInput } from "@/lib/utils";
import type { Task, TaskPriority, TaskType } from "@/lib/types";
import { useApp } from "@/components/providers/app-data";

export function TaskFormModal({
  open,
  onClose,
  editing,
  defaultSubjectId,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Task | null;
  defaultSubjectId?: string | null;
}) {
  const { subjects, createTask, updateTask } = useApp();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("assignment");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? "");
    setDescription(editing?.description ?? "");
    setSubjectId(editing?.subject_id ?? defaultSubjectId ?? "");
    setTaskType(editing?.task_type ?? "assignment");
    setPriority(editing?.priority ?? "medium");
    setDueDate(editing?.due_date ? editing.due_date.slice(0, 10) : "");
    setError("");
  }, [open, editing, defaultSubjectId]);

  const subjectOptions = subjects.map((s) => ({
    value: s.id,
    label: s.code ? `${s.code} — ${s.name}` : s.name,
  }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }
    const payload = {
      subject_id: subjectId || null,
      title,
      description,
      task_type: taskType,
      priority,
      due_date: dueDate ? new Date(dueDate + "T23:59:00").toISOString() : null,
    };
    setBusy(true);
    try {
      if (editing) await updateTask(editing.id, payload);
      else await createTask(payload);
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
      title={
        editing
          ? "Refine your next step."
          : "One small step. A little progress."
      }
      description="Give your next assignment, exam, or idea a clear place in your plan."
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Title" htmlFor="task-title" required>
          <Input
            id="task-title"
            placeholder="e.g. Submit DBMS lab assignment 4"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            invalid={Boolean(error)}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </Field>

        <Field label="Description (optional)" htmlFor="task-desc">
          <Textarea
            id="task-desc"
            placeholder="Details, links, submission notes…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject" htmlFor="task-subject">
            <Select
              id="task-subject"
              placeholder="No subject"
              options={subjectOptions}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            />
          </Field>

          <Field label="Type" htmlFor="task-type">
            <Select
              id="task-type"
              options={TASK_TYPES}
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as TaskType)}
            />
          </Field>

          <Field label="Priority" htmlFor="task-priority">
            <Select
              id="task-priority"
              options={TASK_PRIORITIES.map((p) => ({
                value: p.value,
                label: p.label,
              }))}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            />
          </Field>

          <Field label="Due date" htmlFor="task-due">
            <Input
              id="task-due"
              type="date"
              min={toDateInput()}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
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
            {editing ? "Save changes" : "Add task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
