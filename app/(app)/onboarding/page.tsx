"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useApp } from "@/components/providers/app-data";

const SEMESTERS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(i + 1),
  label: `Year ${i + 1}`,
}));

export default function OnboardingPage() {
  const router = useRouter();
  const { saveProfile, profile } = useApp();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [course, setCourse] = useState(profile?.course ?? "");
  const [branch, setBranch] = useState(profile?.branch ?? "");
  const [semester, setSemester] = useState(
    profile?.semester ? String(profile.semester) : ""
  );
  const [year, setYear] = useState(
    profile?.year_of_study ? String(profile.year_of_study) : ""
  );
  const [goals, setGoals] = useState(profile?.goals ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function finish(skipGoals = false) {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = "Tell us your name.";
    if (!course.trim()) next.course = "Enter your course, e.g. B.Tech.";
    if (!branch.trim()) next.branch = "Enter your branch, e.g. CSE.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await saveProfile({
        full_name: fullName,
        course,
        branch,
        semester: semester ? Number(semester) : null,
        year_of_study: year ? Number(year) : null,
        goals: skipGoals ? "" : goals,
        onboarded: true,
      });
      router.push("/dashboard");
    } catch {
      // toast handled by provider
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Let's set up your workspace"
        description="A few details so EduNexus can tailor your dashboard. You can change these later in Profile."
      />

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            finish();
          }}
          className="space-y-5"
          noValidate
        >
          <Field label="Full name" htmlFor="fullName" required>
            <Input
              id="fullName"
              placeholder="e.g. Priya Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              invalid={Boolean(errors.fullName)}
              autoComplete="name"
            />
            {errors.fullName && (
              <p className="text-xs text-red-600">{errors.fullName}</p>
            )}
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Course" htmlFor="course" required>
              <Input
                id="course"
                placeholder="e.g. B.Tech, B.Sc, B.Com"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                invalid={Boolean(errors.course)}
              />
              {errors.course && (
                <p className="text-xs text-red-600">{errors.course}</p>
              )}
            </Field>

            <Field label="Branch" htmlFor="branch" required>
              <Input
                id="branch"
                placeholder="e.g. Computer Science"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                invalid={Boolean(errors.branch)}
              />
              {errors.branch && (
                <p className="text-xs text-red-600">{errors.branch}</p>
              )}
            </Field>

            <Field label="Semester" htmlFor="semester">
              <Select
                id="semester"
                placeholder="Select semester"
                options={SEMESTERS}
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              />
            </Field>

            <Field label="Year of study" htmlFor="year">
              <Select
                id="year"
                placeholder="Select year"
                options={YEARS}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </Field>
          </div>

          <Field
            label="Academic goals (optional)"
            htmlFor="goals"
            hint="e.g. Improve CGPA to 8.5, finish DBMS project early, revise OS weekly."
          >
            <Textarea
              id="goals"
              placeholder="What do you want to achieve this semester?"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => finish(true)}
            >
              Skip goals for now
            </Button>
            <Button type="submit" loading={busy}>
              Finish setup
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
