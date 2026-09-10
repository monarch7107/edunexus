"use client";

import { MailCheck } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthScreen } from "@/components/auth/auth-screen";
import { Button } from "@/components/ui/button";
import { Field, Input, PasswordInput } from "@/components/ui/field";
import { useApp } from "@/components/providers/app-data";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, repo } = useApp();
  const [checkEmail, setCheckEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!EMAIL_RE.test(email.trim()))
      next.email = "Enter a valid email address.";
    if (password.length < 8)
      next.password = "Password must be at least 8 characters.";
    if (confirm !== password) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await signUp(email, password);
      const currentUser = await repo.getUser();
      if (currentUser) router.push("/onboarding");
      else setCheckEmail(true);
    } catch {
      // toast already shown by provider
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      title="Your next chapter starts here."
      subtitle="Create your own little corner of clarity. Big possibilities ahead."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-600 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      {checkEmail ? (
        <div
          role="status"
          className="rounded-xl border border-brand-200 bg-brand-50 p-6 text-center"
        >
          <MailCheck className="mx-auto mb-4 h-8 w-8 text-brand-600" />
          <h2 className="text-lg font-bold">One more small step.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Check the inbox for{" "}
            <strong className="break-all text-ink">{email}</strong> and confirm
            your email. Then log in to set up your workspace.
          </p>
          <Link href="/login" className="text-link mt-5">
            Go to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Field label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              invalid={Boolean(errors.email)}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email}</p>
            )}
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            required
            hint="At least 8 characters."
          >
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              invalid={Boolean(errors.password)}
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password}</p>
            )}
          </Field>

          <Field label="Confirm password" htmlFor="confirm" required>
            <PasswordInput
              id="confirm"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              invalid={Boolean(errors.confirm)}
            />
            {errors.confirm && (
              <p className="text-xs text-red-600">{errors.confirm}</p>
            )}
          </Field>

          <Button
            type="submit"
            className="mt-2 w-full"
            size="lg"
            loading={busy}
            loadingLabel="Creating your account…"
          >
            Create account
          </Button>
        </form>
      )}
    </AuthScreen>
  );
}
