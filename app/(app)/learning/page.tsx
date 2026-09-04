"use client";

import { useMemo, useState } from "react";
import { Bookmark, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { ResourceFormModal } from "@/components/learning/resource-form-modal";
import { ResourceCard } from "@/components/learning/resource-card";
import { useApp } from "@/components/providers/app-data";

export default function LearningPage() {
  const { resources, subjects, loading } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources
      .filter((r) => (subjectFilter ? r.subject_id === subjectFilter : true))
      .filter((r) => (typeFilter ? r.resource_type === typeFilter : true))
      .filter((r) =>
        q
          ? r.title.toLowerCase().includes(q) ||
            r.content.toLowerCase().includes(q) ||
            r.resource_url.toLowerCase().includes(q)
          : true
      );
  }, [resources, search, subjectFilter, typeFilter]);

  if (loading) return <LoadingState label="Loading your resources…" />;

  return (
    <>
      <PageHeader
        title="Learning resources"
        description="Your saved notes and useful links, organized by subject."
        action={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Save resource
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_180px_150px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            aria-label="Search resources"
            placeholder="Search notes and links…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          aria-label="Filter by subject"
          placeholder="All subjects"
          options={subjects.map((s) => ({ value: s.id, label: s.code || s.name }))}
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        />
        <Select
          aria-label="Filter by type"
          placeholder="All types"
          options={[
            { value: "note", label: "Notes" },
            { value: "link", label: "Links" },
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-8 w-8" />}
          title={resources.length === 0 ? "No resources saved" : "Nothing matches your search"}
          description={
            resources.length === 0
              ? "Save study notes and helpful links so everything you need is one click away."
              : "Try different keywords or clear the filters."
          }
          action={
            resources.length === 0 ? (
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" /> Save your first resource
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              subject={r.subject_id ? subjectMap.get(r.subject_id) : undefined}
            />
          ))}
        </div>
      )}

      <ResourceFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
