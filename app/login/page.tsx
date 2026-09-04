"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthScreen } from "@/components/auth/auth-screen";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useApp } from "@/components/providers/app-data";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch {
      // toast already shown by provider
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Log in to your EduNexus workspace."
      footer={
        <>
          New to EduNexus?{" "}
          <Link href="/register" className="font-medium text-brand-600 hover:underline">
            Create an account
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

        <Field label="Password" htmlFor="password" required>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={Boolean(errors.password)}
          />
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password}</p>
          )}
        </Field>

        <Button type="submit" className="w-full" loading={busy}>
          Log in
        </Button>
      </form>
    </AuthScreen>
  );
}
