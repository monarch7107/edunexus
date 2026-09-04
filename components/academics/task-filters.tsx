"use client";

import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import type { Subject } from "@/lib/types";

export interface TaskFilterState {
  search: string;
  subjectId: string; // "" = all
  status: string; // "" = all, pending, completed
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
    <div className="grid gap-3 sm:grid-cols-[1fr_180px_160px]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          aria-label="Search tasks"
          placeholder="Search tasks…"
          className="pl-9"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <Select
        aria-label="Filter by subject"
        placeholder="All subjects"
        options={subjects.map((s) => ({
          value: s.id,
          label: s.code || s.name,
        }))}
        value={filters.subjectId}
        onChange={(e) => onChange({ ...filters, subjectId: e.target.value })}
      />
      <Select
        aria-label="Filter by status"
        placeholder="All statuses"
        options={[
          { value: "pending", label: "Pending" },
          { value: "completed", label: "Completed" },
        ]}
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
      />
    </div>
  );
}
