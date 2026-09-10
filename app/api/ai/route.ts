import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEMO_COOKIE } from "@/lib/session-cookie";
import { handleAiGateway } from "@/lib/ai/gateway";
import { readBoundedJson } from "@/lib/api/body";

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
  const body = await readBoundedJson(request);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: body.status });
  }
  const userId = await resolveUserId();
  const result = await handleAiGateway({
    userId,
    rawBody: body.value,
    byteLength: body.byteLength,
  });
  return NextResponse.json(result.body, { status: result.status });
}
