"use client";
import { useState } from "react";
import {
  ArrowUpRight,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  StickyNote,
  Trash2,
} from "lucide-react";
import type { Resource, Subject } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { resourceKind, safeResourceUrl } from "@/lib/resources";
import { useApp } from "@/components/providers/app-data";
import { cn } from "@/lib/utils";
const KINDS = {
  note: {
    Icon: StickyNote,
    label: "Study note",
    tone: "bg-amber-50 text-amber-700",
  },
  link: { Icon: Link2, label: "Saved link", tone: "bg-sky-50 text-sky-600" },
  document: {
    Icon: FileText,
    label: "Document link",
    tone: "bg-brand-50 text-brand-600",
  },
  image: {
    Icon: ImageIcon,
    label: "Image link",
    tone: "bg-brand-50 text-brand-600",
  },
};
export function ResourceCard({
  resource,
  subject,
  list = false,
}: {
  resource: Resource;
  subject?: Subject;
  list?: boolean;
}) {
  const { deleteResource } = useApp();
  const [confirm, setConfirm] = useState(false);
  const [reading, setReading] = useState(false);
  const kind = resourceKind(resource);
  const { Icon, label, tone } = KINDS[kind];
  const url = safeResourceUrl(resource.resource_url);
  const domain = url ? new URL(url).hostname.replace(/^www\./, "") : "";
  const updated = resource.updated_at !== resource.created_at;
  const date = new Date(
    updated ? resource.updated_at : resource.created_at,
  ).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <article
      className={cn(
        "card card-interactive group flex h-full overflow-hidden",
        list ? "flex-row items-start gap-4 p-4" : "flex-col",
      )}
    >
      {!list && (
        <div
          className={cn(
            "relative flex h-[138px] items-center justify-center overflow-hidden border-b border-line p-5",
            tone,
          )}
        >
          {kind === "note" ? (
            <div className="h-28 w-4/5 translate-y-5 rotate-[-3deg] overflow-hidden rounded-t-lg border border-line bg-surface px-4 py-3 shadow-sm">
              <p className="text-[9px] font-semibold text-ink">
                {resource.title}
              </p>
              <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-[8px] leading-relaxed text-muted">
                {resource.content}
              </p>
            </div>
          ) : kind === "link" ? (
            <div className="w-4/5 rounded-lg border border-line bg-surface p-4 shadow-sm">
              <span className="mb-3 flex items-center gap-1 text-[7px] text-muted">
                <span className="mr-1 flex gap-0.5">
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                </span>
                {domain}
              </span>
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-50">
                  <ExternalLink className="h-4 w-4 text-sky-600" />
                </span>
                <span className="line-clamp-2 text-[9px] font-medium text-ink">
                  {resource.title}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-16 -rotate-6 flex-col items-center justify-center rounded-md border border-line bg-surface shadow-sm">
                <Icon className="h-7 w-7" />
                <span className="mt-2 text-[8px] font-bold">
                  {kind === "document"
                    ? new URL(url!).pathname.split(".").pop()?.toUpperCase()
                    : "IMAGE"}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold">
                  {kind === "document"
                    ? "Knowledge, on hand."
                    : "A different perspective."}
                </p>
                <p className="mt-1 text-[9px] text-muted">Hosted resource</p>
              </div>
            </div>
          )}
          <span className="absolute right-3 top-3 rounded border border-line bg-surface/90 px-1.5 py-0.5 text-[8px] font-medium text-muted">
            {label}
          </span>
        </div>
      )}
      {list && (
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            tone,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className={cn("flex min-w-0 flex-1 flex-col", !list && "p-5")}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-[9px] font-medium text-muted">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{
                backgroundColor: subject?.color || "rgb(var(--slate-400))",
              }}
            />
            <span className="truncate">
              {subject?.name || "Personal library"}
            </span>
          </span>
          {list && <span className="text-[9px] text-muted">{label}</span>}
        </div>
        <h3 className="text-sm font-bold leading-relaxed tracking-tight">
          {kind === "note" ? (
            <button
              className="text-left transition-colors hover:text-brand-600"
              onClick={() => setReading(true)}
            >
              {resource.title}
            </button>
          ) : url ? (
            <a
              className="transition-colors hover:text-brand-600"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {resource.title}
            </a>
          ) : (
            resource.title
          )}
        </h3>
        {!list && (
          <p className="mb-4 mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted">
            {kind === "note"
              ? resource.content
              : domain || "This saved URL can’t be opened safely."}
          </p>
        )}
        <div
          className={cn(
            "mt-auto flex items-center justify-between gap-2",
            !list && "border-t border-line pt-3",
            list && "pt-2",
          )}
        >
          <span className="text-[9px] text-muted">
            {updated ? "Updated" : "Added"} {date}
          </span>
          <div className="flex items-center gap-2">
            {kind === "note" ? (
              <button
                className="text-link text-[10px]"
                onClick={() => setReading(true)}
              >
                Read note <ArrowUpRight className="h-3 w-3" />
              </button>
            ) : (
              url && (
                <a
                  className="text-link text-[10px]"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open{" "}
                  {kind === "document"
                    ? "document"
                    : kind === "image"
                      ? "image"
                      : "link"}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              )
            )}
            <button
              onClick={() => setConfirm(true)}
              className="icon-button h-7 w-7 hover:bg-red-50 hover:text-red-600"
              aria-label={`Delete resource ${resource.title}`}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
      <Modal
        open={reading}
        onClose={() => setReading(false)}
        title={resource.title}
        description={`${subject?.name || "Personal library"} · Study note · ${updated ? "Updated" : "Added"} ${date}`}
        size="lg"
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-[1.9] text-slate-700">
          {resource.content}
        </p>
        <div className="mt-6 flex justify-end border-t border-line pt-4">
          <Button variant="outline" onClick={() => setReading(false)}>
            Back to library
          </Button>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => deleteResource(resource.id)}
        title="Remove this resource?"
        message={`“${resource.title}” will be removed from your library. ${kind === "note" ? "This note can’t be recovered." : "The original linked file or website won’t be changed."}`}
      />
    </article>
  );
}
