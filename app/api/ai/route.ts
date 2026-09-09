import { NextResponse } from "next/server";
import {
  authenticate,
  errorResponse,
  newRequestId,
  normalizeRequest,
  readBoundedJson,
} from "@/lib/ai/gateway";
import { createServerRuntime } from "@/lib/ai/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai — the single V2 AI entry point.
 *
 * Pipeline: authenticate → bound → validate → rate-limit → orchestrate.
 * Returns a structured plan awaiting approval; NOTHING is written to the
 * student's academic data by this endpoint.
 */
export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? newRequestId();
  try {
    // Bound the body before parsing anything.
    const body = await readBoundedJson(request);
    const normalized = normalizeRequest(body);

    const { identity, orchestrator } = createServerRuntime();
    // Identity comes from the session — never from the body.
    const principal = await authenticate(identity, requestId);

    const result = await orchestrator.proposePlan(principal, normalized);
    return NextResponse.json(result, { headers: { "x-request-id": requestId } });
  } catch (error) {
    const { status, body } = errorResponse(error);
    return NextResponse.json(body, {
      status,
      headers: { "x-request-id": requestId },
    });
  }
}
