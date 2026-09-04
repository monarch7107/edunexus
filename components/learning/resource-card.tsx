"use client";

import { useState } from "react";
import { ExternalLink, Link2, StickyNote, Trash2 } from "lucide-react";
import type { Resource, Subject } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useApp } from "@/components/providers/app-data";

export function ResourceCard({
  resource,
  subject,
}: {
  resource: Resource;
  subject?: Subject;
}) {
  const { deleteResource } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isLink = resource.resource_type === "link";

  return (
    <div className="card flex flex-col p-4">
      <div className="flex items-start gap-3">
        <span
          className={
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg " +
            (isLink ? "bg-sky-100 text-sky-600" : "bg-amber-100 text-amber-600")
          }
        >
          {isLink ? <Link2 className="h-4 w-4" /> : <StickyNote className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
          {subject && (
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: subject.color }}
                aria-hidden
              />
              {subject.code || subject.name}
            </p>
          )}
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          aria-label="Delete resource"
          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {!isLink && resource.content && (
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600 line-clamp-6">
          {resource.content}
        </p>
      )}

      {isLink && resource.resource_url && (
        <a
          href={resource.resource_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 break-all text-sm font-medium text-brand-600 hover:underline"
        >
          Open link <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteResource(resource.id)}
        title="Delete resource?"
        message={`"${resource.title}" will be permanently removed.`}
      />
    </div>
  );
}
