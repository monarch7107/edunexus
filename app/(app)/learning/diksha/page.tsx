"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import {
  type DikshaResource,
  SAMPLE_DIKSHA_RESOURCES,
  DIKSHA_DEMO_PROVIDER_LABEL,
} from "@/lib/government/diksha";

export default function DikshaPage() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [resources, setResources] = useState<DikshaResource[]>(SAMPLE_DIKSHA_RESOURCES);
  const [loading, setLoading] = useState(false);

  const fetchDiksha = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (subject) params.set("subject", subject);
      const res = await fetch(`/api/government/diksha?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResources(data.items || []);
      }
    } catch (err) {
      console.error("DIKSHA fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [query, subject]);

  useEffect(() => {
    fetchDiksha();
  }, [fetchDiksha]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Government Content / Ministry of Education"
        title="DIKSHA & NCERT Curriculum Gateway"
        description="Search standardized, official textbook content, lesson plans, and interactive modules from DIKSHA (Digital Infrastructure for Knowledge Sharing)."
        action={
          <Link href="/learning" className="inline-flex items-center gap-1.5 text-xs text-link font-medium">
            <ArrowLeft className="size-3.5" /> Back to My Learning Library
          </Link>
        }
      />

      {/* Attribution Banner */}
      <div className="rounded-xl border border-brand-200 bg-brand-50/70 p-4">
        <div className="flex items-start gap-3">
          <GraduationCap className="size-5 shrink-0 text-brand-700 mt-0.5" />
          <div className="text-xs text-slate-700 space-y-1">
            <p className="font-semibold text-brand-900">
              Official Indian Curriculum Alignment (NCF-2023 · NCERT · CBSE)
            </p>
            <p className="text-muted leading-relaxed">
              Curriculum resources are served through the AIESES DIKSHA Sunbird adapter. All content is licensed under{" "}
              <strong>CC-BY-NC-SA 4.0</strong> by the National Council of Educational Research and Training (NCERT), Ministry of Education, Govt. of India.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[10px] text-muted">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="size-3" /> Active Adapter: {DIKSHA_DEMO_PROVIDER_LABEL}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchDiksha()}
              placeholder="Search NCERT topics, chapters, concepts..."
              className="pl-9 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            {["", "Mathematics", "Computer Science", "Physics", "Chemistry"].map((sub) => (
              <button
                key={sub}
                onClick={() => setSubject(sub)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  subject === sub
                    ? "bg-brand-600 text-white"
                    : "bg-canvas text-slate-700 hover:bg-slate-100 border border-line"
                }`}
              >
                {sub || "All Subjects"}
              </button>
            ))}
            <Button size="sm" onClick={fetchDiksha} loading={loading}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resource Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((item) => (
          <Card key={item.id} className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge variant="outline" className="border-brand-200 bg-brand-50 text-brand-700">
                  {item.contentType}
                </Badge>
                <span className="text-[10px] font-semibold text-muted uppercase">
                  {item.gradeLevel}
                </span>
              </div>
              <h3 className="font-display text-sm font-bold text-ink leading-snug">
                {item.title}
              </h3>
              <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-3">
                {item.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.medium.map((m) => (
                  <span key={m} className="text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
              <span className="text-[10px] text-muted truncate max-w-[150px]">
                {item.attribution.publisher.split("(")[0]}
              </span>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-link font-medium hover:underline"
              >
                Open in DIKSHA <ExternalLink className="size-3" />
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
