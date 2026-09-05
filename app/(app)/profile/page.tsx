"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Database,
  GraduationCap,
  LogOut,
  Monitor,
  Palette,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/motion";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ThemeOptions } from "@/components/theme/theme-picker";
import { useTheme } from "@/components/providers/theme";
import { useApp } from "@/components/providers/app-data";
import { cn, initials } from "@/lib/utils";
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
  const { reduceMotion, setReduceMotion } = useTheme();
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
  const [confirmOut, setConfirmOut] = useState(false);
  const dirty =
    fullName !== (profile?.full_name || "") ||
    course !== (profile?.course || "") ||
    branch !== (profile?.branch || "") ||
    semester !== (profile?.semester ? String(profile.semester) : "") ||
    year !== (profile?.year_of_study ? String(profile.year_of_study) : "") ||
    goals !== (profile?.goals || "");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = "Tell us what to call you.";
    if (!course.trim()) next.course = "Add your course, such as B.Tech.";
    if (!branch.trim()) next.branch = "Add your branch or field of study.";
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
      setFullName(fullName.trim());
      setCourse(course.trim());
      setBranch(branch.trim());
      setGoals(goals.trim());
    } catch {
      /* Provider shows friendly error. */
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <LoadingState label="Opening your workspace settings…" />;
  return (
    <>
      <PageHeader
        eyebrow="Your space. Your way."
        title="A workspace that feels like you."
        description="Your academic details, personal goals, and a little room to make it your own."
      />
      <div className="grid items-start gap-6 xl:grid-cols-[260px_1fr]">
        <Reveal>
          <div className="space-y-4 xl:sticky xl:top-24">
            <div className="card overflow-hidden">
              <div className="subtle-grid h-20 border-b border-brand-200 bg-brand-100/70" />
              <div className="px-5 pb-5">
                <div className="-mt-8 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-surface bg-brand-200 font-display text-xl font-bold text-brand-900">
                  {initials(profile?.full_name || "S")}
                </div>
                <h2 className="text-lg font-bold tracking-tight">
                  {profile?.full_name || "Your profile"}
                </h2>
                <p className="mt-1 break-all text-[11px] text-muted">
                  {user?.email}
                </p>
                <div className="mt-5 space-y-3 border-t border-line pt-4">
                  <p className="flex items-center gap-2 text-[11px] text-muted">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {profile?.course || "Your course"} ·{" "}
                    {profile?.branch || "Your branch"}
                  </p>
                  {profile?.semester && (
                    <p className="flex items-center gap-2 text-[11px] text-muted">
                      <BookOpen className="h-3.5 w-3.5" />
                      Semester {profile.semester}
                      {profile.year_of_study
                        ? ` · Year ${profile.year_of_study}`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <nav aria-label="Settings sections" className="card p-2">
              {[
                {
                  href: "#details",
                  label: "Profile & academics",
                  Icon: UserRound,
                },
                {
                  href: "#appearance",
                  label: "Appearance & preferences",
                  Icon: Palette,
                },
                {
                  href: "#workspace",
                  label: "Workspace & data",
                  Icon: Database,
                },
              ].map(({ href, label, Icon }) => (
                <a
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-3 text-[11px] font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  <ArrowUpRight className="ml-auto h-3 w-3 text-muted" />
                </a>
              ))}
            </nav>
            <div className="hidden rounded-xl bg-brand-50/60 p-5 xl:block">
              <Sprout className="mb-3 h-5 w-5 text-brand-600" />
              <p className="font-display text-xs font-bold">
                You’re a work in progress.
                <br />
                In the best possible way.
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Goals change. Interests grow. Your workspace can grow with you.
              </p>
            </div>
          </div>
        </Reveal>
        <div className="min-w-0 space-y-6">
          <Reveal delay={0.04}>
            <Card id="details">
              <CardHeader
                title="Your academic chapter"
                description="A few details that make your workspace more personal."
                icon={<GraduationCap className="h-4 w-4 text-brand-600" />}
              />
              <form onSubmit={save} className="space-y-5" noValidate>
                <Field label="Full name" htmlFor="p-name" required>
                  <Input
                    id="p-name"
                    value={fullName}
                    autoComplete="name"
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
                  <Field
                    label="Branch / field of study"
                    htmlFor="p-branch"
                    required
                  >
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
                <Field
                  label="The goals you’re growing toward"
                  htmlFor="p-goals"
                  hint="Big ambitions or small intentions. What would make this semester meaningful?"
                >
                  <Textarea
                    id="p-goals"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="e.g. Get comfortable with algorithms, build a consistent study habit…"
                  />
                </Field>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <p className="flex items-center gap-1.5 text-[10px] text-muted">
                    {dirty ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{" "}
                        You have unsaved changes
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3 text-brand-600" /> Your
                        details are up to date
                      </>
                    )}
                  </p>
                  <Button
                    type="submit"
                    disabled={!dirty}
                    loading={busy}
                    loadingLabel="Saving changes…"
                  >
                    <Save className="h-3.5 w-3.5" /> Save changes
                  </Button>
                </div>
              </form>
            </Card>
          </Reveal>
          <Reveal>
            <Card id="appearance">
              <CardHeader
                title="Set the atmosphere"
                description="A comfortable space helps you focus. These preferences save automatically on this device."
                icon={<Palette className="h-4 w-4 text-brand-600" />}
              />
              <ThemeOptions detailed />
              <div className="mt-6 border-t border-line pt-5">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <h3 className="flex items-center gap-2 text-xs font-semibold">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-muted" /> A
                      quieter workspace
                    </h3>
                    <p
                      id="motion-help"
                      className="mt-2 max-w-sm text-[11px] leading-relaxed text-muted"
                    >
                      Reduce movement and transitions. Your device’s
                      reduced-motion preference is always respected.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={reduceMotion}
                    aria-label="Reduce workspace motion"
                    aria-describedby="motion-help"
                    onClick={() => setReduceMotion(!reduceMotion)}
                    className={cn(
                      "relative flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors",
                      reduceMotion
                        ? "border-brand-500 bg-brand-600"
                        : "border-slate-300 bg-slate-200",
                    )}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 rounded-full bg-surface shadow-sm transition-transform",
                        reduceMotion && "translate-x-5",
                      )}
                    />
                  </button>
                </div>
              </div>
            </Card>
          </Reveal>
          <Reveal>
            <Card id="workspace">
              <CardHeader
                title="Your workspace & your data"
                description="A clear picture of where your work lives."
                icon={<ShieldCheck className="h-4 w-4 text-brand-600" />}
              />
              <div className="flex items-start gap-3 rounded-lg border border-line bg-slate-50 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-brand-600">
                  {mode === "demo" ? (
                    <Monitor className="h-4 w-4" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                </span>
                <div>
                  <h3 className="text-xs font-bold">
                    {mode === "demo"
                      ? "Local workspace · This browser only"
                      : "Connected workspace · Supabase"}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">
                    {mode === "demo"
                      ? "Your work is saved in this browser, not to an online account. Refreshing won’t lose it, but clearing browser data will. Use the same browser to return to your workspace."
                      : "Your academic data is saved to your connected Supabase project. Authenticated access and row-level security protect your own records."}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-line p-4">
                <FileStorageNote />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
                <div>
                  <p className="text-xs font-semibold">Take a little break.</p>
                  <p className="mt-1 text-[11px] text-muted">
                    Your saved work will be here when you return.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setConfirmOut(true)}>
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </Button>
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
      <ConfirmDialog
        open={confirmOut}
        onClose={() => setConfirmOut(false)}
        danger={false}
        title="See you again soon?"
        message={
          dirty
            ? "You have unsaved profile changes. Save them before signing out if you’d like to keep them. All previously saved academic work will stay in your workspace."
            : "You’ll be signed out of this workspace. Your saved subjects, tasks, notes, and study plans will stay right where you left them."
        }
        confirmLabel="Sign out"
        onConfirm={async () => {
          await signOut();
          router.push("/login");
        }}
      />
    </>
  );
}
function FileStorageNote() {
  return (
    <>
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
      <div>
        <p className="text-xs font-semibold">File storage is not connected</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          You can preview files locally and save hosted-document links. Direct
          uploads require a secure storage connection and aren’t currently
          enabled.
        </p>
      </div>
    </>
  );
}
