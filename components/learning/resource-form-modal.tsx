"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  FileText,
  Link2,
  LockKeyhole,
  Plus,
  StickyNote,
  UploadCloud,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FileDropzone } from "./file-dropzone";
import { cn } from "@/lib/utils";
import { safeResourceUrl } from "@/lib/resources";
import { useApp } from "@/components/providers/app-data";
type EntryType = "note" | "link" | "file";
export function ResourceFormModal({
  open,
  onClose,
  initialType = "note",
}: {
  open: boolean;
  onClose: () => void;
  initialType?: EntryType;
}) {
  const { subjects, createResource } = useApp();
  const [type, setType] = useState<EntryType>(initialType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setType(initialType);
      setTitle("");
      setContent("");
      setUrl("");
      setSubjectId("");
      setFile(null);
      setErrors({});
    } else setFile(null);
  }, [open, initialType]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (type === "file" || busy) return;
    const next: Record<string, string> = {};
    if (!title.trim())
      next.title = "Give this resource a name so it’s easy to find.";
    if (type === "note" && !content.trim())
      next.content = "Add a little knowledge to your note.";
    if (type === "link" && !safeResourceUrl(url.trim()))
      next.url = "Enter a valid link starting with https:// or http://.";
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
      /* Provider displays error without claiming success. */
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open={open}
      busy={busy}
      onClose={onClose}
      title="A little knowledge worth keeping."
      description="Add a note, save a useful link, or preview a study document."
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <fieldset>
          <legend className="sr-only">Resource type</legend>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "note", label: "Write a note", Icon: StickyNote },
              { value: "link", label: "Save a link", Icon: Link2 },
              { value: "file", label: "Choose a file", Icon: FileText },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                disabled={busy}
                onClick={() => {
                  setType(value as EntryType);
                  setErrors({});
                }}
                aria-pressed={type === value}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border px-2 py-3 text-[10px] font-medium transition-all",
                  type === value
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-line text-muted hover:bg-slate-50",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        {type === "file" ? (
          <>
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3.5">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="text-xs font-semibold text-amber-800">
                  Direct uploads aren’t connected yet.
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                  Preview a file on your device. It won’t be uploaded or saved
                  to your library. You can still save a link to a hosted
                  document.
                </p>
              </div>
            </div>
            <FileDropzone file={file} onChange={setFile} />
            <button
              type="button"
              className="text-link text-[11px]"
              onClick={() => {
                if (!title && file) setTitle(file.name.replace(/\.[^.]+$/, ""));
                setType("link");
              }}
            >
              Use a document link instead <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <p className="text-[10px] leading-relaxed text-muted">
              Files stay on your device. Closing this dialog clears the
              selection. Secure file storage must be connected before uploads
              can be enabled.
            </p>
          </>
        ) : (
          <>
            <Field label="Resource title" htmlFor="resource-title" required>
              <Input
                id="resource-title"
                placeholder={
                  type === "note"
                    ? "e.g. The key ideas from today’s lecture"
                    : "e.g. A great guide to data structures"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                invalid={Boolean(errors.title)}
              />
              {errors.title && (
                <p className="text-xs text-red-600">{errors.title}</p>
              )}
            </Field>
            <Field label="Connect to a subject" htmlFor="resource-subject">
              <Select
                id="resource-subject"
                placeholder="Personal library · No subject"
                options={subjects.map((s) => ({
                  value: s.id,
                  label: s.code ? `${s.code} — ${s.name}` : s.name,
                }))}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              />
            </Field>
            {type === "note" ? (
              <Field label="Your note" htmlFor="resource-content" required>
                <Textarea
                  id="resource-content"
                  className="min-h-[150px]"
                  placeholder="Ideas, formulas, questions, and those little aha! moments…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  aria-invalid={Boolean(errors.content) || undefined}
                />
                {errors.content && (
                  <p className="text-xs text-red-600">{errors.content}</p>
                )}
              </Field>
            ) : (
              <Field
                label="Resource link"
                htmlFor="resource-url"
                required
                hint="A website, video, or hosted PDF, document, or image. Make sure you have access to the link."
              >
                <Input
                  id="resource-url"
                  type="url"
                  placeholder="https://…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  invalid={Boolean(errors.url)}
                />
                {errors.url && (
                  <p className="text-xs text-red-600">{errors.url}</p>
                )}
              </Field>
            )}
          </>
        )}
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          {type === "file" ? (
            <Button disabled title="No secure file storage is configured">
              <UploadCloud className="h-3.5 w-3.5" /> Upload unavailable
            </Button>
          ) : (
            <Button
              type="submit"
              loading={busy}
              loadingLabel="Saving resource…"
            >
              <Plus className="h-3.5 w-3.5" /> Save resource
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
