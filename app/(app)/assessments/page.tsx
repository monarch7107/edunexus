"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileCode2,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SAMPLE_ASSESSMENTS, type TeacherAssessment } from "@/lib/teacher/data";

export default function StudentAssessmentsPage() {
  const [selectedAsm, setSelectedAsm] = useState<TeacherAssessment | null>(SAMPLE_ASSESSMENTS[0]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  function handleSelectOption(questionId: string, optionIndex: number) {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  function handleSubmitAssessment() {
    if (!selectedAsm) return;
    let correctCount = 0;
    for (const q of selectedAsm.questions) {
      if (userAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    }
    const finalScore = Math.round((correctCount / selectedAsm.questions.length) * selectedAsm.totalMarks);
    setScore(finalScore);
    setSubmitted(true);
  }

  function handleReset() {
    setUserAnswers({});
    setSubmitted(false);
    setScore(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Core Learning / Assessments"
        title="Knowledge Assessments & Quizzes"
        description="Verify your subject mastery, test conceptual understanding, and receive targeted EduAdapt recommendations based on your mistakes."
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Assessment selector */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Available Assessments ({SAMPLE_ASSESSMENTS.length})
          </span>
          {SAMPLE_ASSESSMENTS.map((asm) => (
            <button
              key={asm.id}
              onClick={() => {
                setSelectedAsm(asm);
                handleReset();
              }}
              className={`w-full text-left rounded-lg p-3 text-xs transition-colors border ${
                selectedAsm?.id === asm.id
                  ? "border-brand-500 bg-brand-50 text-brand-900 font-semibold"
                  : "border-line bg-surface hover:bg-slate-50 text-ink"
              }`}
            >
              <p className="font-semibold">{asm.title}</p>
              <div className="mt-1 flex items-center justify-between text-[10px] text-muted font-normal">
                <span>{asm.subject}</span>
                <span>{asm.totalMarks} Marks</span>
              </div>
            </button>
          ))}
        </div>

        {/* Assessment questions & submission */}
        {selectedAsm && (
          <div className="space-y-4">
            <Card>
              <CardHeader
                title={selectedAsm.title}
                description={`${selectedAsm.subject} · Due by ${selectedAsm.dueDate}`}
                action={
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-brand-200 bg-brand-50 text-brand-700">
                      {selectedAsm.questions.length} Questions
                    </Badge>
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                      {selectedAsm.totalMarks} Total Marks
                    </Badge>
                  </div>
                }
              />
              <CardContent className="space-y-6">
                {selectedAsm.questions.map((q, idx) => {
                  const selectedOpt = userAnswers[q.id];
                  const isCorrect = selectedOpt === q.correctIndex;

                  return (
                    <div key={q.id} className="rounded-xl border border-line bg-canvas p-4 text-xs space-y-3">
                      <p className="font-semibold text-sm text-ink">
                        Q{idx + 1}. {q.question}
                      </p>

                      <div className="space-y-2">
                        {q.options.map((opt, oi) => {
                          const isSelected = selectedOpt === oi;
                          let optStyle = "border-line bg-surface text-ink hover:border-brand-300";
                          if (isSelected) {
                            optStyle = "border-brand-500 bg-brand-50 text-brand-900 font-semibold";
                          }
                          if (submitted) {
                            if (oi === q.correctIndex) {
                              optStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold";
                            } else if (isSelected && !isCorrect) {
                              optStyle = "border-red-500 bg-red-50 text-red-900";
                            }
                          }

                          return (
                            <button
                              key={oi}
                              disabled={submitted}
                              onClick={() => handleSelectOption(q.id, oi)}
                              className={`w-full flex items-center justify-between rounded-lg p-3 text-left border transition-colors ${optStyle}`}
                            >
                              <span>
                                {String.fromCharCode(65 + oi)}) {opt}
                              </span>
                              {submitted && oi === q.correctIndex && (
                                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                              )}
                              {submitted && isSelected && !isCorrect && (
                                <AlertCircle className="size-4 text-red-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {submitted && (
                        <div className="mt-2 rounded-lg bg-slate-100 p-2.5 text-[11px] text-muted">
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex items-center justify-between border-t border-line pt-4">
                  {!submitted ? (
                    <Button
                      onClick={handleSubmitAssessment}
                      disabled={Object.keys(userAnswers).length === 0}
                    >
                      <Target className="size-3.5 mr-1" /> Submit Assessment
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={handleReset}>
                      <RotateCcw className="size-3.5 mr-1" /> Retake Practice Quiz
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Score & Adaptive Recommendation Card */}
            {submitted && score !== null && (
              <Card className="border-brand-300 bg-brand-50/50">
                <CardHeader
                  title={`Your Score: ${score} / ${selectedAsm.totalMarks}`}
                  description={
                    score >= selectedAsm.totalMarks * 0.75
                      ? "Outstanding performance! You have mastered these foundational concepts."
                      : "Good effort! EduAdapt detected specific weak concepts to reinforce."
                  }
                />
                <CardContent className="space-y-4">
                  <ProgressBar
                    value={Math.round((score / selectedAsm.totalMarks) * 100)}
                    label="Score Percentage"
                  />

                  <div className="pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                      Adaptive Recommendations based on this score
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href="/learning/diksha"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-surface px-3 py-1.5 text-xs text-brand-700 font-medium hover:bg-brand-50 transition-colors"
                      >
                        <BookOpen className="size-3.5 text-brand-600" /> Review in DIKSHA Curriculum
                      </Link>
                      <Link
                        href="/workspace"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-surface px-3 py-1.5 text-xs text-brand-700 font-medium hover:bg-brand-50 transition-colors"
                      >
                        <FileCode2 className="size-3.5 text-brand-600" /> Open Code & Notes in Workspace
                      </Link>
                      <Link
                        href="/ai/tutor"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-surface px-3 py-1.5 text-xs text-brand-700 font-medium hover:bg-brand-50 transition-colors"
                      >
                        <Sparkles className="size-3.5 text-brand-600" /> Ask AI Tutor to Explain Mistakes
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
