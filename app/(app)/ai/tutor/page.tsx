"use client";

import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/components/providers/app-data";
import type { TutorMode, TutorResponse } from "@/lib/ai/tutor";

const TUTOR_MODES: {
  id: TutorMode;
  label: string;
  icon: typeof MessageSquare;
  description: string;
}[] = [
  { id: "explain", label: "Explain Concept", icon: BookOpen, description: "Structured, rigorous explanation" },
  { id: "explain_simply", label: "Explain Simply", icon: Lightbulb, description: "Intuitive analogy / ELI5" },
  { id: "give_example", label: "Give Example", icon: Wand2, description: "Worked, step-by-step example" },
  { id: "practice_question", label: "Practice Challenge", icon: Target, description: "Active-recall practice problem" },
  { id: "ask", label: "Ask a Question", icon: HelpCircle, description: "Direct conceptual Q&A" },
  { id: "next_action", label: "Recommend Action", icon: Sparkles, description: "Targeted next study steps" },
];

export default function AITutorPage() {
  const { subjects } = useApp();
  const [mode, setMode] = useState<TutorMode>("explain");
  const [topic, setTopic] = useState("Calculus: Fundamental Theorem");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<TutorResponse | null>(null);

  async function handleAskTutor(overrideMode?: TutorMode, overrideTopic?: string) {
    const selectedMode = overrideMode || mode;
    const selectedTopic = overrideTopic || topic;
    if (!selectedTopic.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic,
          mode: selectedMode,
          question: question.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data: TutorResponse = await res.json();
        setResponse(data);
      }
    } catch (err) {
      console.error("AI Tutor query failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Intelligence / AI Layer"
        title="AI Pedagogical Tutor"
        description="Active learning guidance with 6 tutoring modes. Built with verified fallbacks so you never hit a dead end."
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Mode & Topic Selector */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Tutoring Mode" description="Choose how you want to learn" />
            <CardContent className="space-y-2">
              {TUTOR_MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMode(m.id);
                      if (response) handleAskTutor(m.id);
                    }}
                    className={`w-full flex items-start gap-3 rounded-lg p-2.5 text-left text-xs transition-colors border ${
                      active
                        ? "border-brand-500 bg-brand-50 text-brand-900 font-semibold"
                        : "border-transparent hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Icon className={`size-4 shrink-0 mt-0.5 ${active ? "text-brand-600" : "text-muted"}`} />
                    <div>
                      <p>{m.label}</p>
                      <p className="text-[10px] text-muted font-normal">{m.description}</p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {subjects.length > 0 && (
            <Card>
              <CardHeader title="Quick Topics" description="From your active subjects" />
              <CardContent className="space-y-1.5">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setTopic(s.name);
                      handleAskTutor(mode, s.name);
                    }}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded hover:bg-slate-50 text-slate-600 truncate"
                  >
                    • {s.name}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Input & Response Viewer */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Topic or Concept
                  </label>
                  <Input
                    placeholder="e.g. Calculus, Data Structures, Binary Search, Thermodynamics..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                {mode === "ask" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Specific Question
                    </label>
                    <Input
                      placeholder="e.g. Why is the derivative of sin(x) equal to cos(x)?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                    />
                  </div>
                )}

                <Button
                  onClick={() => handleAskTutor()}
                  loading={loading}
                  loadingLabel="Reasoning..."
                  className="w-full sm:w-auto"
                >
                  <Sparkles className="size-3.5 mr-1.5" /> Start Tutoring Session
                </Button>
              </div>

              {response && (
                <div className="mt-6 border-t border-line pt-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-ink">
                      {response.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={
                        response.source === "openai"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : "border-sky-300 bg-sky-50 text-sky-800"
                      }
                    >
                      {response.source === "openai"
                        ? "Live AI Guidance"
                        : "Deterministic Fallback Engine"}
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-line bg-canvas p-5 text-sm leading-relaxed text-ink whitespace-pre-wrap font-sans">
                    {response.content}
                  </div>

                  {response.suggestedFollowUps.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                        Suggested Follow-Up Learning
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {response.suggestedFollowUps.map((action, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (action.toLowerCase().includes("simply")) handleAskTutor("explain_simply");
                              else if (action.toLowerCase().includes("example")) handleAskTutor("give_example");
                              else if (action.toLowerCase().includes("practice")) handleAskTutor("practice_question");
                              else if (action.toLowerCase().includes("action")) handleAskTutor("next_action");
                              else handleAskTutor("explain");
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-slate-700 hover:border-brand-400 hover:text-brand-700 transition-colors"
                          >
                            <span>{action}</span>
                            <ArrowRight className="size-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
