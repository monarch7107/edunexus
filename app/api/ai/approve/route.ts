import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEMO_COOKIE } from "@/lib/session-cookie";
import { handleApproval } from "@/lib/ai/gateway";

export const runtime = "nodejs";

async function resolveUserId(): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user?.id ?? null;
    } catch {
      return null;
    }
  }
  if (cookies().has(DEMO_COOKIE)) return "demo-local-user";
  return null;
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const userId = await resolveUserId();
  const result = await handleApproval({ userId, rawBody: raw });
  return NextResponse.json(result.body, { status: result.status });
}
