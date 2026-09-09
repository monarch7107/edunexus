import { NextResponse } from "next/server";
import {
  authenticate,
  errorResponse,
  newRequestId,
  readBoundedJson,
} from "@/lib/ai/gateway";
import { AgentError } from "@/lib/ai/errors";
import { approvalRequestSchema } from "@/lib/ai/schemas";
import { createServerRuntime } from "@/lib/ai/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/approve — explicit student decision.
 *
 * This is the ONLY endpoint that can cause writes to academic data, and
 * only after the approval, fingerprint and ownership checks all pass.
 */
export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? newRequestId();
  try {
    const body = await readBoundedJson(request);
    const parsed = approvalRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new AgentError("validation", "That approval couldn’t be processed.");
    }

    const { identity, orchestrator } = createServerRuntime();
    const principal = await authenticate(identity, requestId);
    const input = parsed.data;

    if (input.decision === "reject") {
      const result = await orchestrator.rejectChangeSet(principal, {
        runId: input.runId,
        changeSetId: input.changeSetId,
      });
      return NextResponse.json(result, { headers: { "x-request-id": requestId } });
    }

    const result = await orchestrator.approveAndExecute(principal, {
      runId: input.runId,
      changeSetId: input.changeSetId,
      decision: input.decision,
      itemIds: input.itemIds,
    });
    return NextResponse.json(result, { headers: { "x-request-id": requestId } });
  } catch (error) {
    const { status, body } = errorResponse(error);
    return NextResponse.json(body, {
      status,
      headers: { "x-request-id": requestId },
    });
  }
}
