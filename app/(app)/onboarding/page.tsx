"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  Sprout,
  Target,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useQuietMotion } from "@/components/ui/motion";
import { useApp } from "@/components/providers/app-data";
import { cn } from "@/lib/utils";
const SEMESTERS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(i + 1),
  label: `Year ${i + 1}`,
}));
const GOALS = [
  "Build a consistent study habit",
  "Stay ahead of deadlines",
  "Understand my subjects better",
  "Make more time for revision",
];
export default function OnboardingPage() {
  const router = useRouter();
  const { saveProfile, profile } = useApp();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [course, setCourse] = useState(profile?.course || "");
  const [branch, setBranch] = useState(profile?.branch || "");
  const [semester, setSemester] = useState(
    profile?.semester ? String(profile.semester) : "",
  );
  const [year, setYear] = useState(
    profile?.year_of_study ? String(profile.year_of_study) : "",
  );
  const [goals, setGoals] = useState(profile?.goals || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const quiet = useQuietMotion();
  function next() {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Tell us what to call you.";
    if (!course.trim()) e.course = "Add your course, such as B.Tech.";
    if (!branch.trim()) e.branch = "Add your branch or field of study.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep(1);
  }
  async function finish(skipGoals = false) {
    if (!fullName.trim() || !course.trim() || !branch.trim()) {
      setStep(0);
      next();
      return;
    }
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
      /* Provider displays error, so onboarding remains retryable. */
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-[970px]">
      <div className="mb-8 flex items-center justify-center gap-3 text-[10px] font-medium text-muted">
        <span
          className={cn(
            "flex items-center gap-2",
            step === 0 && "text-brand-700",
          )}
        >
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full",
              step === 0
                ? "bg-brand-600 text-on-accent"
                : "bg-brand-100 text-brand-700",
            )}
          >
            {step > 0 ? <Check className="h-3 w-3" /> : "1"}
          </span>
          Your academic chapter
        </span>
        <span className="h-px w-10 bg-line" />
        <span
          className={cn(
            "flex items-center gap-2",
            step === 1 && "text-brand-700",
          )}
        >
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full",
              step === 1 ? "bg-brand-600 text-on-accent" : "bg-slate-100",
            )}
          >
            2
          </span>
          Your bigger picture
        </span>
      </div>
      <div className="grid overflow-hidden rounded-2xl border border-line bg-surface shadow-lifted lg:grid-cols-[.8fr_1.2fr]">
        <div className="relative overflow-hidden border-b border-brand-200 bg-brand-50 p-7 sm:p-10 lg:border-b-0 lg:border-r">
          <span className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-200 bg-surface text-brand-600">
            <Sprout className="h-6 w-6" />
          </span>
          <p className="eyebrow mb-3 text-brand-600">A little introduction</p>
          <h1 className="text-[32px] font-bold leading-tight tracking-[-.05em]">
            {step === 0 ? (
              <>
                Let’s make
                <br />
                this space yours.
              </>
            ) : (
              <>
                Every goal starts
                <br />
                with a little intent.
              </>
            )}
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            {step === 0
              ? "You bring the curiosity. We’ll help you bring it all together. Tell us a little about your academic life."
              : "A good workspace keeps the bigger picture in view. What would you like to grow toward this semester?"}
          </p>
          <div className="mt-9 hidden space-y-4 border-t border-brand-200 pt-6 text-[11px] text-slate-600 lg:block">
            {[
              [BookOpen, "A home for your subjects"],
              [GraduationCap, "Plans built around your studies"],
              [Target, "Your progress, in perspective"],
            ].map(([Icon, text], i) => {
              const I = Icon as typeof BookOpen;
              return (
                <p key={i} className="flex items-center gap-2.5">
                  <I className="h-4 w-4 text-brand-600" />
                  {text as string}
                </p>
              );
            })}
          </div>
          <p className="mt-8 text-[10px] text-muted">
            You can always change these details in your profile.
          </p>
        </div>
        <div className="min-w-0 p-6 sm:p-9">
          <AnimatePresence mode="wait" initial={false}>
            <motion.form
              key={step}
              initial={{ opacity: 0, x: quiet ? 0 : 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: quiet ? 0 : -8 }}
              transition={{ duration: quiet ? 0 : 0.18 }}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (step === 0) next();
                else void finish();
              }}
              className="space-y-5"
            >
              <div className="mb-6">
                <h2 className="text-lg font-bold tracking-tight">
                  {step === 0
                    ? "First, a few little details."
                    : `What’s ahead, ${fullName.split(" ")[0] || "you"}?`}
                </h2>
                <p className="mt-1.5 text-xs text-muted">
                  {step === 0
                    ? "Nothing complicated. Just the essentials."
                    : "Choose an intention or write your own. This part is optional."}
                </p>
              </div>
              {step === 0 ? (
                <>
                  <Field label="Full name" htmlFor="fullName" required>
                    <Input
                      id="fullName"
                      placeholder="What should we call you?"
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
                        placeholder="e.g. B.Tech, B.Sc"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        invalid={Boolean(errors.course)}
                      />
                      {errors.course && (
                        <p className="text-xs text-red-600">{errors.course}</p>
                      )}
                    </Field>
                    <Field label="Branch / field" htmlFor="branch" required>
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
                  <div className="flex justify-end border-t border-line pt-5">
                    <Button type="submit">
                      A little about your goals{" "}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="grid gap-2"
                    role="group"
                    aria-label="Suggested academic goals"
                  >
                    {GOALS.map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() =>
                          setGoals((current) =>
                            current.includes(goal)
                              ? current
                                  .split("\n")
                                  .filter((line) => line !== goal)
                                  .join("\n")
                              : [current, goal].filter(Boolean).join("\n"),
                          )
                        }
                        aria-pressed={goals.split("\n").includes(goal)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 text-left text-xs transition-colors",
                          goals.split("\n").includes(goal)
                            ? "border-brand-400 bg-brand-50 text-brand-700"
                            : "border-line text-muted hover:bg-slate-50",
                        )}
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded border border-current">
                          {goals.split("\n").includes(goal) && (
                            <Check className="h-3 w-3" />
                          )}
                        </span>
                        {goal}
                      </button>
                    ))}
                  </div>
                  <Field label="Make it personal" htmlFor="goals">
                    <Textarea
                      id="goals"
                      placeholder="What would make this semester meaningful to you?"
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                    />
                  </Field>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setStep(0)}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </Button>
                    <Button
                      type="submit"
                      loading={busy}
                      loadingLabel="Making space for you…"
                    >
                      Let’s begin <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void finish(true)}
                    className="w-full text-center text-[10px] text-muted underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    I’ll think about my goals later
                  </button>
                </>
              )}
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
      <p className="mt-6 text-center text-[10px] text-muted">
        A fresh start. A clearer mind. Your EduNexus workspace.
      </p>
    </div>
  );
}
