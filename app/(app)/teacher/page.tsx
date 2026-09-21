"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Layers,
  PieChart,
  Search,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  SAMPLE_TEACHER_CLASSES,
  SAMPLE_STUDENTS,
  SAMPLE_ASSESSMENTS,
  SAMPLE_SUBMISSIONS,
} from "@/lib/teacher/data";

export default function TeacherPortalPage() {
  const [tab, setTab] = useState<"students" | "assessments" | "submissions" | "analytics">("students");
  const [search, setSearch] = useState("");

  const filteredStudents = SAMPLE_STUDENTS.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      s.weakArea.toLowerCase().includes(search.toLowerCase()),
  );

  const atRiskCount = SAMPLE_STUDENTS.filter((s) => s.status === "at_risk").length;
  const avgCompletion = Math.round(
    SAMPLE_STUDENTS.reduce((acc, s) => acc + s.completionRate, 0) / SAMPLE_STUDENTS.length,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Educator & Faculty Portal"
        title="Teacher Command Center"
        description="Monitor student cohorts, inspect academic risk signals, manage assessments, grade submissions, and track class analytics."
        action={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-brand-300 bg-brand-50 text-brand-800">
              Instructor Mode Active
            </Badge>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Switch to Student View <ArrowRight className="size-3.5" />
            </Link>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Cohorts</span>
            <Layers className="size-4 text-brand-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold">{SAMPLE_TEACHER_CLASSES.length} Classes</p>
          <p className="mt-1 text-xs text-muted">100 total enrolled students</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Completion</span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-700">{avgCompletion}%</p>
          <p className="mt-1 text-xs text-muted">Across all assigned course modules</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Submissions</span>
            <ClipboardList className="size-4 text-sky-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold">{SAMPLE_SUBMISSIONS.length} Graded</p>
          <p className="mt-1 text-xs text-muted">100% on-time grading rate</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Early Warning</span>
            <AlertTriangle className="size-4 text-red-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-red-600">{atRiskCount} At Risk</p>
          <p className="mt-1 text-xs text-muted">Students needing intervention</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-2">
        <button
          onClick={() => setTab("students")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === "students" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="size-3.5" /> Students & Progress
        </button>
        <button
          onClick={() => setTab("assessments")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === "assessments" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BookOpen className="size-3.5" /> Assessments ({SAMPLE_ASSESSMENTS.length})
        </button>
        <button
          onClick={() => setTab("submissions")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === "submissions" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ClipboardList className="size-3.5" /> Submissions & Grading
        </button>
        <button
          onClick={() => setTab("analytics")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === "analytics" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <PieChart className="size-3.5" /> Class Analytics
        </button>
      </div>

      {/* Tab Contents */}
      {tab === "students" && (
        <Card>
          <CardHeader
            title="Class Roster & Student Progress"
            description="Track assignment progress, weekly logged study hours, and early-warning risk detection."
            action={
              <div className="relative w-56">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by student or skill..."
                  className="w-full rounded-md border border-line bg-canvas py-1 pl-8 pr-3 text-xs focus:outline-none"
                />
              </div>
            }
          />
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-line text-muted">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Roll No</th>
                  <th className="p-3">Completion Rate</th>
                  <th className="p-3">Pending Tasks</th>
                  <th className="p-3">7d Study Time</th>
                  <th className="p-3">Identified Weak Area</th>
                  <th className="p-3">Risk Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-ink">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-muted font-normal">{s.email}</div>
                    </td>
                    <td className="p-3 font-mono text-muted">{s.rollNo}</td>
                    <td className="p-3 w-40">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{s.completionRate}%</span>
                        <div className="w-20">
                          <ProgressBar value={s.completionRate} label="Rate" />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{s.tasksPending} tasks</td>
                    <td className="p-3 font-medium">{Math.round(s.studyMinutes7d / 60)}h {s.studyMinutes7d % 60}m</td>
                    <td className="p-3 text-amber-700 font-medium">{s.weakArea}</td>
                    <td className="p-3">
                      {s.status === "on_track" && (
                        <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800">
                          On Track
                        </Badge>
                      )}
                      {s.status === "needs_attention" && (
                        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                          Needs Review
                        </Badge>
                      )}
                      {s.status === "at_risk" && (
                        <Badge variant="outline" className="border-red-300 bg-red-50 text-red-800">
                          At Risk
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === "assessments" && (
        <div className="space-y-4">
          {SAMPLE_ASSESSMENTS.map((asm) => (
            <Card key={asm.id}>
              <CardHeader
                title={asm.title}
                description={`${asm.subject} (${asm.classCode}) · Due Date: ${asm.dueDate}`}
                action={
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-800">
                      {asm.submissionCount}/{asm.totalStudents} Submitted
                    </Badge>
                    <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800">
                      Total: {asm.totalMarks} Marks
                    </Badge>
                  </div>
                }
              />
              <CardContent className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Questions in Assessment ({asm.questions.length})
                </p>
                {asm.questions.map((q, idx) => (
                  <div key={q.id} className="rounded-lg border border-line bg-canvas p-3 text-xs space-y-2">
                    <p className="font-semibold text-ink">
                      Q{idx + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-muted">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`rounded px-2.5 py-1 border ${
                            oi === q.correctIndex
                              ? "border-emerald-400 bg-emerald-50 text-emerald-900 font-medium"
                              : "border-line bg-surface"
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}) {opt}
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted italic">
                      Correct Key: {String.fromCharCode(65 + q.correctIndex)} · {q.explanation}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "submissions" && (
        <Card>
          <CardHeader
            title="Student Submissions & Graded Responses"
            description="Review scores awarded, submission timestamps, and feedback."
          />
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-line text-muted">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Assessment</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Submitted At</th>
                  <th className="p-3">Feedback</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {SAMPLE_SUBMISSIONS.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-ink">{sub.studentName}</td>
                    <td className="p-3 max-w-[200px] truncate">{sub.assessmentTitle}</td>
                    <td className="p-3 font-bold text-ink">
                      {sub.score} / {sub.totalMarks}
                    </td>
                    <td className="p-3 text-muted">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                    <td className="p-3 text-muted italic max-w-xs">{sub.feedback}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800">
                        {sub.status.replace("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === "analytics" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader title="Cohort Mastery Distribution" description="Knowledge level clustering across active classes" />
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-emerald-700">Mastered (&gt;85% completion)</span>
                  <span>40% of class</span>
                </div>
                <ProgressBar value={40} label="Mastered" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-sky-700">Proficient (65% - 85%)</span>
                  <span>35% of class</span>
                </div>
                <ProgressBar value={35} label="Proficient" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-amber-700">Developing (40% - 65%)</span>
                  <span>15% of class</span>
                </div>
                <ProgressBar value={15} label="Developing" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-red-700">At Risk (&lt;40% completion)</span>
                  <span>10% of class</span>
                </div>
                <ProgressBar value={10} label="At Risk" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Weak Area Clustering" description="Topics where multiple students exhibit recurring errors" />
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-xs">
                <p className="font-semibold text-red-900">1. Skewed Binary Search Trees (CS201)</p>
                <p className="text-muted mt-0.5">3 students scored below 50% on tree balance edge cases.</p>
                <div className="mt-2 text-link font-medium">
                  → Recommended: Share DIKSHA Tree Balancing interactive module
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs">
                <p className="font-semibold text-amber-900">2. Critical Points & Continuity (MA102)</p>
                <p className="text-muted mt-0.5">2 students struggled with boundary conditions in calculus optimization.</p>
                <div className="mt-2 text-link font-medium">
                  → Recommended: Assign NCERT Chapter 5 practice question set
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
