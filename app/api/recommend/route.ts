import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fallbackRecommendation,
  logAiDiagnostic,
  runAiRecommendation,
  validateSnapshot,
} from "@/lib/recommendation-server";
import { readBoundedJson } from "@/lib/api/body";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Bounded body: reject oversized payloads with 413 before parsing (M1).
  const parsed = await readBoundedJson(request);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  const body = parsed.value;

  const validated = validateSnapshot(body);
  if (!validated.ok) {
    logAiDiagnostic("validation");
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const snap = validated.snapshot;

  // When Supabase is configured, only signed-in users may call this route.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
    } catch {
      // If auth verification fails, fail closed.
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  try {
    const ai = await runAiRecommendation(snap);
    // Provider failures are classified + logged server-side above; the
    // student always gets the deterministic student-specific fallback.
    if (ai.ok) return NextResponse.json(ai.result);
    return NextResponse.json(fallbackRecommendation(snap));
  } catch {
    // AI failure must never break the app — return the deterministic result.
    return NextResponse.json(fallbackRecommendation(snap));
  }
}
