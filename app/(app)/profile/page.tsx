"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save, FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/states";
import { useApp } from "@/components/providers/app-data";

const SEMESTERS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(i + 1),
  label: `Year ${i + 1}`,
}));

export default function ProfilePage() {
  const router = useRouter();
  const { profile, user, mode, loading, saveProfile, signOut } = useApp();

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

  if (loading) return <LoadingState label="Loading your profile…" />;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = "Name is required.";
    if (!course.trim()) next.course = "Course is required.";
    if (!branch.trim()) next.branch = "Branch is required.";
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
        goals,
        onboarded: true,
      });
    } catch {
      // toast handled by provider
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="Your academic details and workspace settings."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Academic details" />
          <form onSubmit={save} className="space-y-5" noValidate>
            <Field label="Full name" htmlFor="p-name" required>
              <Input
                id="p-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                invalid={Boolean(errors.fullName)}
              />
              {errors.fullName && (
                <p className="text-xs text-red-600">{errors.fullName}</p>
              )}
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Course" htmlFor="p-course" required>
                <Input
                  id="p-course"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  invalid={Boolean(errors.course)}
                  placeholder="e.g. B.Tech"
                />
                {errors.course && (
                  <p className="text-xs text-red-600">{errors.course}</p>
                )}
              </Field>
              <Field label="Branch" htmlFor="p-branch" required>
                <Input
                  id="p-branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  invalid={Boolean(errors.branch)}
                  placeholder="e.g. Computer Science"
                />
                {errors.branch && (
                  <p className="text-xs text-red-600">{errors.branch}</p>
                )}
              </Field>
              <Field label="Semester" htmlFor="p-sem">
                <Select
                  id="p-sem"
                  placeholder="Select semester"
                  options={SEMESTERS}
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                />
              </Field>
              <Field label="Year of study" htmlFor="p-year">
                <Select
                  id="p-year"
                  placeholder="Select year"
                  options={YEARS}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Academic goals" htmlFor="p-goals">
              <Textarea
                id="p-goals"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="e.g. Finish DBMS project 3 days early, revise OS every weekend, CGPA 8.5+."
              />
            </Field>

            <div className="flex justify-end">
              <Button type="submit" loading={busy}>
                <Save className="h-4 w-4" /> Save changes
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Account" />
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Email
                </dt>
                <dd className="mt-0.5 break-all text-slate-800">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Backend
                </dt>
                <dd className="mt-0.5">
                  {mode === "supabase" ? (
                    <span className="font-medium text-emerald-700">
                      Supabase (Postgres + RLS)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-medium text-amber-700">
                      <FlaskConical className="h-4 w-4" /> Demo mode (local browser)
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </Card>

          {mode === "demo" && (
            <Card className="border-amber-200 bg-amber-50/60">
              <h3 className="text-sm font-semibold text-amber-900">
                About demo mode
              </h3>
              <p className="mt-1 text-sm text-amber-800">
                Your data is stored only in this browser. To use a real account
                system with a PostgreSQL database and row-level security, add
                the Supabase environment variables (see{" "}
                <code className="rounded bg-amber-100 px-1">.env.example</code>)
                and run the SQL in{" "}
                <code className="rounded bg-amber-100 px-1">
                  supabase/schema.sql
                </code>
                .
              </p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
