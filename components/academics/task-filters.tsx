"use client";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import type { Subject } from "@/lib/types";
export interface TaskFilterState {
  search: string;
  subjectId: string;
  status: string;
  priority: string;
}
export function TaskFilters({
  filters,
  onChange,
  subjects,
}: {
  filters: TaskFilterState;
  onChange: (next: TaskFilterState) => void;
  subjects: Subject[];
}) {
  return (
    <div className="grid items-center gap-2.5 sm:grid-cols-[1fr_160px_145px]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        <Input
          aria-label="Search tasks"
          placeholder="Find a task…"
          className="!min-h-10 pl-9 pr-9 !text-xs"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
        {filters.search && (
          <button
            className="icon-button absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            aria-label="Clear task search"
            onClick={() => onChange({ ...filters, search: "" })}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <Select
        aria-label="Filter by subject"
        className="!min-h-10 !text-xs"
        placeholder="All subjects"
        options={subjects.map((s) => ({
          value: s.id,
          label: s.code || s.name,
        }))}
        value={filters.subjectId}
        onChange={(e) => onChange({ ...filters, subjectId: e.target.value })}
      />
      <div className="relative">
        <SlidersHorizontal className="pointer-events-none absolute left-3 top-3 z-10 h-3.5 w-3.5 text-muted" />
        <Select
          aria-label="Filter by priority"
          className="!min-h-10 pl-9 !text-xs"
          placeholder="All priorities"
          options={[
            { value: "high", label: "High priority" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low priority" },
          ]}
          value={filters.priority}
          onChange={(e) => onChange({ ...filters, priority: e.target.value })}
        />
      </div>
    </div>
  );
}
