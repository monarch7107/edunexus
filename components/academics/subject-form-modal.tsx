"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { SUBJECT_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Subject } from "@/lib/types";
import { useApp } from "@/components/providers/app-data";

export function SubjectFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Subject | null;
}) {
  const { createSubject, updateSubject } = useApp();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setCode(editing?.code ?? "");
      setColor(editing?.color ?? SUBJECT_COLORS[0]);
      setError("");
    }
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!name.trim()) {
      setError("Subject name is required.");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await updateSubject(editing.id, { name, code, color });
      } else {
        await createSubject({ name, code, color });
      }
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
          ? "A little update to your subject."
          : "Make room for a new subject."
      }
      description="Connect your tasks, study sessions, and resources around what you’re learning."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Subject name" htmlFor="subject-name" required>
          <Input
            id="subject-name"
            placeholder="e.g. Database Management Systems"
            value={name}
            onChange={(e) => setName(e.target.value)}
            invalid={Boolean(error)}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </Field>

        <Field label="Course code (optional)" htmlFor="subject-code">
          <Input
            id="subject-code"
            placeholder="e.g. CS301"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </Field>

        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {SUBJECT_COLORS.map((c, i) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Select ${["Indigo", "Sky", "Emerald", "Amber", "Coral", "Violet", "Rose", "Teal"][i]} subject color`}
                aria-pressed={color === c}
                className={cn(
                  "h-8 w-8 rounded-full ring-offset-2 transition-transform",
                  color === c && "ring-2 ring-slate-800 scale-110",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </Field>

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
            {editing ? "Save changes" : "Add subject"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
