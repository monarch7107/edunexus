"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthScreen } from "@/components/auth/auth-screen";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useApp } from "@/components/providers/app-data";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length < 8)
      next.password = "Password must be at least 8 characters.";
    if (confirm !== password) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await signUp(email, password);
      router.push("/onboarding");
    } catch {
      // toast already shown by provider
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Start organizing your academic life in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Email" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@college.edu.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={Boolean(errors.email)}
          />
          {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          required
          hint="At least 8 characters."
        >
          <Input
            id="password"
            type="password"
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
          <Input
            id="confirm"
            type="password"
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

        <Button type="submit" className="w-full" loading={busy}>
          Create account
        </Button>
      </form>
    </AuthScreen>
  );
}
