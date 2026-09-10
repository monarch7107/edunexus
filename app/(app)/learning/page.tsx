"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  FileText,
  Grid2X2,
  Library,
  Link2,
  List,
  Plus,
  Search,
  StickyNote,
  UploadCloud,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { AnimatedList, Reveal } from "@/components/ui/motion";
import { ResourceFormModal } from "@/components/learning/resource-form-modal";
import { ResourceCard } from "@/components/learning/resource-card";
import { useApp } from "@/components/providers/app-data";
import { resourceKind } from "@/lib/resources";
import { cn } from "@/lib/utils";
export default function LearningPage() {
  const { resources, subjects, loading } = useApp();
  const params = useSearchParams();
  const [modal, setModal] = useState(false);
  const [entry, setEntry] = useState<"note" | "link" | "file">("note");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [type, setType] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("recent");
  useEffect(() => {
    setSearch(params?.get("search") || "");
    setSubjectFilter(params?.get("subject") || "");
  }, [params]);
  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );
  const filtered = useMemo(
    () =>
      resources
        .filter(
          (r) =>
            (!subjectFilter || r.subject_id === subjectFilter) &&
            (!type ||
              (type === "document"
                ? ["document", "image"].includes(resourceKind(r))
                : resourceKind(r) === type)) &&
            `${r.title} ${r.content} ${r.resource_url}`
              .toLowerCase()
              .includes(search.toLowerCase().trim()),
        )
        .sort((a, b) =>
          sort === "title"
            ? a.title.localeCompare(b.title)
            : b.created_at.localeCompare(a.created_at),
        ),
    [resources, subjectFilter, type, search, sort],
  );
  const notes = resources.filter((r) => resourceKind(r) === "note").length;
  const links = resources.filter((r) => resourceKind(r) === "link").length;
  const documents = resources.length - notes - links;
  const add = (kind: typeof entry = "note") => {
    setEntry(kind);
    setModal(true);
  };
  const clear = () => {
    setSearch("");
    setSubjectFilter("");
    setType("");
  };
  if (loading) return <LoadingState label="Opening your learning library…" />;
  return (
    <>
      <PageHeader
        eyebrow="A home for your aha! moments"
        title="Knowledge, within reach."
        description="Keep the useful, the inspiring, and the worth-remembering in one place."
        action={
          <>
            <Button variant="outline" onClick={() => add("file")}>
              <UploadCloud className="h-3.5 w-3.5" /> Choose file
            </Button>
            <Button onClick={() => add()}>
              <Plus className="h-3.5 w-3.5" /> Add resource
            </Button>
          </>
        }
      />
      <Reveal>
        <section className="relative mb-7 flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-xl border border-brand-200 bg-brand-50/70 px-6 py-7">
          <div className="max-w-md">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold text-brand-700">
              <Library className="h-4 w-4" /> Your personal learning library
            </div>
            <h2 className="text-[24px] font-bold tracking-[-.04em]">
              Good ideas deserve a place to stay.
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Save a lecture note, a helpful video, or a link to your study
              documents. Connect them to your subjects, find them when you need
              them.
            </p>
          </div>
          <div className="flex gap-8 pr-3 text-center">
            <div>
              <p className="font-display text-3xl font-bold tracking-tight">
                {resources.length}
              </p>
              <p className="mt-1 text-[10px] text-muted">Resources collected</p>
            </div>
            <div className="border-l border-brand-200 pl-8">
              <p className="font-display text-3xl font-bold tracking-tight">
                {
                  new Set(resources.map((r) => r.subject_id).filter(Boolean))
                    .size
                }
              </p>
              <p className="mt-1 text-[10px] text-muted">Subjects connected</p>
            </div>
          </div>
        </section>
      </Reveal>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {[
            {
              value: "",
              label: "All resources",
              Icon: Library,
              count: resources.length,
            },
            { value: "note", label: "Notes", Icon: StickyNote, count: notes },
            { value: "link", label: "Links", Icon: Link2, count: links },
            {
              value: "document",
              label: "Documents",
              Icon: FileText,
              count: documents,
            },
          ].map((tab) => (
            <button
              key={tab.value}
              aria-pressed={type === tab.value}
              onClick={() => setType(tab.value)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[11px] font-medium transition-colors",
                type === tab.value
                  ? "border-brand-200 bg-brand-50 text-brand-700"
                  : "border-transparent text-muted hover:bg-slate-100",
              )}
            >
              <tab.Icon className="h-3.5 w-3.5" />
              {tab.label}
              <span className="ml-1 text-[9px] opacity-70">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="segmented">
          <button
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
            className="segment !px-2"
          >
            <Grid2X2 className="h-3.5 w-3.5" />
          </button>
          <button
            aria-label="List view"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            className="segment !px-2"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mb-5 grid gap-2.5 sm:grid-cols-[1fr_170px_150px]">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-muted" />
          <Input
            aria-label="Search resources"
            className="pl-9 pr-9 !text-xs"
            placeholder="Search your collection…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="icon-button absolute right-1 top-1 h-9 w-7"
              aria-label="Clear resource search"
              onClick={() => setSearch("")}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <Select
          aria-label="Filter resources by subject"
          className="!text-xs"
          placeholder="All subjects"
          options={subjects.map((s) => ({
            value: s.id,
            label: s.code || s.name,
          }))}
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        />
        <Select
          aria-label="Sort resources"
          className="!text-xs"
          options={[
            { value: "recent", label: "Newest first" },
            { value: "title", label: "Title A–Z" },
          ]}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <p role="status" aria-live="polite" className="text-[10px] text-muted">
          {filtered.length} {filtered.length === 1 ? "resource" : "resources"}{" "}
          in this view
        </p>
        {(search || subjectFilter || type) && (
          <button className="text-link text-[10px]" onClick={clear}>
            Clear filters <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {filtered.length ? (
        <AnimatedList
          className={
            view === "grid"
              ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              : "space-y-3"
          }
          itemClassName="h-full"
        >
          {filtered.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              subject={subjectMap.get(resource.subject_id || "")}
              list={view === "list"}
            />
          ))}
        </AnimatedList>
      ) : (
        <EmptyState
          icon={<Library className="h-6 w-6" />}
          title={
            resources.length
              ? "No matches in this corner of your library."
              : "Your collection starts with one good idea."
          }
          description={
            resources.length
              ? "Try a different keyword, resource type, or subject to find what you’re looking for."
              : "Keep a note from class, a link you’ll come back to, or a document that makes a tough topic click."
          }
          action={
            <Button onClick={resources.length ? clear : () => add()} size="sm">
              {resources.length
                ? "Explore all resources"
                : "Save your first resource"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          }
        />
      )}
      <Reveal>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5">
          <div className="flex items-start gap-3">
            <UploadCloud className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
            <div>
              <p className="text-xs font-semibold">
                Have a PDF, document, or image?
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Preview it locally, or save a hosted document link. Direct file
                uploads aren’t connected yet.
              </p>
            </div>
          </div>
          <button onClick={() => add("link")} className="text-link text-[11px]">
            Save a document link <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </Reveal>
      <ResourceFormModal
        open={modal}
        onClose={() => setModal(false)}
        initialType={entry}
      />
    </>
  );
}
