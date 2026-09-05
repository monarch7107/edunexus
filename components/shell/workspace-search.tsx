"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Search,
  Command,
  BookOpen,
  CheckSquare,
  Library,
  CalendarDays,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/field";
import { useApp } from "@/components/providers/app-data";
import { APP_NAV } from "@/lib/constants";
import { NAV_ICONS } from "./sidebar";

export function WorkspaceSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { subjects, tasks, resources, sessions } = useApp();
  const router = useRouter();
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // Don’t stack the command palette on an in-progress form dialog.
        if (document.querySelector('[role="dialog"]') && !open) return;
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q)
      return APP_NAV.map((item) => ({
        id: item.href,
        title: item.label,
        label: "Go to page",
        href: item.href,
        Icon: NAV_ICONS[item.icon],
      }));
    return [
      ...subjects.map((s) => ({
        id: s.id,
        title: s.name,
        label: "Subject",
        href: `/academics?subject=${encodeURIComponent(s.id)}`,
        Icon: BookOpen,
      })),
      ...tasks.map((t) => ({
        id: t.id,
        title: t.title,
        label: "Task",
        href: `/academics?search=${encodeURIComponent(t.title)}`,
        Icon: CheckSquare,
      })),
      ...sessions.map((s) => ({
        id: s.id,
        title: s.title,
        label: "Study session",
        href: `/planner?search=${encodeURIComponent(s.title)}`,
        Icon: CalendarDays,
      })),
      ...resources.map((r) => ({
        id: r.id,
        title: r.title,
        label: "Resource",
        href: `/learning?search=${encodeURIComponent(r.title)}`,
        Icon: Library,
      })),
    ]
      .filter((r) => r.title.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, subjects, tasks, resources, sessions]);
  return (
    <>
      <button
        className="group flex h-9 items-center gap-2.5 rounded-lg text-xs text-muted transition-colors hover:text-ink sm:min-w-[230px] sm:border sm:border-line sm:bg-canvas sm:px-3"
        onClick={() => {
          setQuery("");
          setOpen(true);
        }}
        aria-label="Search your workspace"
      >
        <Search className="h-[17px] w-[17px]" />
        <span className="hidden sm:inline">Search your workspace…</span>
        <kbd className="ml-auto hidden items-center gap-0.5 rounded border border-line bg-surface px-1.5 py-0.5 font-sans text-[10px] sm:flex">
          <Command className="h-2.5 w-2.5" /> K
        </kbd>
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Find your focus"
        description="Search subjects, tasks, study sessions, and resources."
      >
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted" />
          <Input
            aria-label="Search all workspace items"
            placeholder="What are you looking for?"
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <p className="eyebrow mb-2 mt-5">
          {query ? `${results.length} results` : "Jump to"}
        </p>
        <div className="max-h-[45vh] space-y-1 overflow-y-auto">
          {results.length ? (
            results.map((r) => (
              <button
                key={`${r.label}-${r.id}`}
                onClick={() => {
                  setOpen(false);
                  router.push(r.href);
                }}
                className="group flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-brand-50"
              >
                <r.Icon className="h-4 w-4 shrink-0 text-brand-600" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {r.title}
                  </span>
                  <span className="text-[10px] text-muted">{r.label}</span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted group-hover:text-brand-600" />
              </button>
            ))
          ) : (
            <div className="py-8 text-center">
              <Search className="mx-auto mb-3 h-6 w-6 text-muted" />
              <p className="text-sm font-semibold">No matches just yet</p>
              <p className="mt-1 text-xs text-muted">
                Try a different title or a shorter keyword.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
