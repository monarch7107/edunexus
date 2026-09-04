"use client";

import { useEffect, useState } from "react";
import { Link2, StickyNote } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { ResourceType } from "@/lib/types";
import { useApp } from "@/components/providers/app-data";

const URL_RE = /^https?:\/\/[^\s]+[.][^\s]+/i;

export function ResourceFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { subjects, createResource } = useApp();

  const [type, setType] = useState<ResourceType>("note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setType("note");
      setTitle("");
      setContent("");
      setUrl("");
      setSubjectId("");
      setErrors({});
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Give the resource a title.";
    if (type === "note" && !content.trim())
      next.content = "Write the note content.";
    if (type === "link") {
      if (!url.trim()) next.url = "Paste the link URL.";
      else if (!URL_RE.test(url.trim()))
        next.url = "Enter a valid URL starting with http:// or https://";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await createResource({
        title,
        resource_type: type,
        content: type === "note" ? content : "",
        resource_url: type === "link" ? url.trim() : "",
        subject_id: subjectId || null,
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
      title="Save a learning resource"
      description="Keep personal notes and useful links tied to your subjects."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType("note")}
            aria-pressed={type === "note"}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              type === "note"
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <StickyNote className="h-4 w-4" /> Note
          </button>
          <button
            type="button"
            onClick={() => setType("link")}
            aria-pressed={type === "link"}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              type === "link"
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <Link2 className="h-4 w-4" /> Link
          </button>
        </div>

        <Field label="Title" htmlFor="resource-title" required>
          <Input
            id="resource-title"
            placeholder={
              type === "note" ? "e.g. OS deadlock cheat sheet" : "e.g. DBMS normalization video"
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            invalid={Boolean(errors.title)}
            autoFocus
          />
          {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
        </Field>

        <Field label="Subject" htmlFor="resource-subject">
          <Select
            id="resource-subject"
            placeholder="No subject"
            options={subjects.map((s) => ({
              value: s.id,
              label: s.code ? `${s.code} — ${s.name}` : s.name,
            }))}
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          />
        </Field>

        {type === "note" ? (
          <Field label="Note" htmlFor="resource-content" required>
            <Textarea
              id="resource-content"
              placeholder="Write your note, formulas, key points…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[130px]"
            />
            {errors.content && (
              <p className="text-xs text-red-600">{errors.content}</p>
            )}
          </Field>
        ) : (
          <Field label="URL" htmlFor="resource-url" required>
            <Input
              id="resource-url"
              type="url"
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              invalid={Boolean(errors.url)}
            />
            {errors.url && <p className="text-xs text-red-600">{errors.url}</p>}
          </Field>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Save resource
          </Button>
        </div>
      </form>
    </Modal>
  );
}
