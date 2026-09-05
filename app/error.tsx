"use client";
import { ErrorState } from "@/components/ui/states";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-24">
      <ErrorState
        message="This page couldn’t open just now. Your saved work is safe. Try loading it again."
        onRetry={reset}
      />
    </main>
  );
}
