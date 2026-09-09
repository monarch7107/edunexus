import { NextResponse } from "next/server";
import {
  authenticate,
  errorResponse,
  newRequestId,
  readBoundedJson,
} from "@/lib/ai/gateway";
import { AgentError } from "@/lib/ai/errors";
import { editRequestSchema } from "@/lib/ai/schemas";
import { createServerRuntime } from "@/lib/ai/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/edit — student edits a proposed change before approving.
 * Editing invalidates any prior approval (fingerprint changes).
 */
export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? newRequestId();
  try {
    const body = await readBoundedJson(request);
    const parsed = editRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new AgentError("validation", "Those edits couldn’t be applied. Please check them.");
    }

    const { identity, orchestrator } = createServerRuntime();
    const principal = await authenticate(identity, requestId);

    const result = await orchestrator.editChangeItem(principal, parsed.data);
    return NextResponse.json(result, { headers: { "x-request-id": requestId } });
  } catch (error) {
    const { status, body } = errorResponse(error);
    return NextResponse.json(body, {
      status,
      headers: { "x-request-id": requestId },
    });
  }
}
