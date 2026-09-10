import type {
  AcademicContext,
  ChangeOperation,
  GatewayResponse,
} from "./types";

/**
 * Browser client for the V2 AI Gateway.
 *
 * Every AI surface (Copilot, AI Command Center, Approval Center, Adaptive
 * Planner) goes through these helpers — and therefore through the same
 * server path: AI Gateway → Orchestrator → Planning Agent → Tool Registry →
 * Authorization → Approval → Verification. There is intentionally no other
 * way for the UI to reach agent planning.
 */

export class GatewayHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "GatewayHttpError";
    this.status = status;
  }
}

async function postGateway(
  url: string,
  body: Record<string, unknown>,
): Promise<GatewayResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as GatewayResponse & { error?: string };
  if (!res.ok) {
    throw new GatewayHttpError(
      res.status,
      data.error || "We couldn’t finish that action.",
    );
  }
  return data;
}

export async function requestPlan(input: {
  message: string;
  surface: string;
  snapshot: {
    goals: string;
    subjects: AcademicContext["subjects"];
    tasks: AcademicContext["tasks"];
    sessions: AcademicContext["sessions"];
  };
}): Promise<GatewayResponse> {
  return postGateway("/api/ai", {
    message: input.message,
    surface: input.surface,
    snapshot: input.snapshot,
  });
}

export async function decideChangeSet(
  changeSetId: string,
  decision: "approved" | "rejected",
): Promise<GatewayResponse> {
  return postGateway("/api/ai/approve", { changeSetId, decision });
}

export async function editChangeSetItems(
  changeSetId: string,
  edits: { id: string; payload: Record<string, unknown> }[],
): Promise<GatewayResponse> {
  return postGateway("/api/ai/changeset", { changeSetId, edits });
}

export async function loadChangeSet(
  changeSetId: string,
): Promise<GatewayResponse> {
  const res = await fetch(
    `/api/ai/changeset?id=${encodeURIComponent(changeSetId)}`,
  );
  const data = (await res.json()) as GatewayResponse & { error?: string };
  if (!res.ok) {
    throw new GatewayHttpError(
      res.status,
      data.error || "We couldn’t load that proposal.",
    );
  }
  return data;
}

export interface WorkspaceWriter {
  createSession: (input: {
    title: string;
    subject_id: string | null;
    planned_date: string;
    duration_minutes: number;
  }) => Promise<unknown>;
  updateSession: (
    id: string,
    input: {
      title?: string;
      planned_date?: string;
      duration_minutes?: number;
      subject_id?: string;
    },
  ) => Promise<unknown>;
  deleteSession: (id: string) => Promise<unknown>;
}

/**
 * Demo-mode local apply for verified changes.
 *
 * The demo repository lives in the browser's localStorage, which the server
 * cannot reach — so after the server authorizes, executes, and *verifies* a
 * change set, the UI mirrors the verified outcome locally. In Supabase mode
 * the authorized server tools already wrote through RLS, so this must NOT
 * run there (it would duplicate sessions).
 */
export async function applyVerifiedChangesLocally(
  changes: GatewayResponse["changes"],
  writer: WorkspaceWriter,
): Promise<void> {
  for (const c of changes) {
    const p = c.payload;
    try {
      const op: ChangeOperation = c.operation;
      if (op === "create") {
        await writer.createSession({
          title: String(p.title ?? c.label),
          subject_id: typeof p.subject_id === "string" ? p.subject_id : null,
          planned_date: String(p.planned_date ?? "").slice(0, 10),
          duration_minutes:
            typeof p.duration_minutes === "number" ? p.duration_minutes : 45,
        });
      } else if ((op === "update" || op === "move") && c.entity_id) {
        await writer.updateSession(c.entity_id, {
          title: typeof p.title === "string" ? p.title : undefined,
          planned_date:
            typeof p.planned_date === "string"
              ? p.planned_date.slice(0, 10)
              : undefined,
          duration_minutes:
            typeof p.duration_minutes === "number"
              ? p.duration_minutes
              : undefined,
          subject_id: typeof p.subject_id === "string" ? p.subject_id : undefined,
        });
      } else if (op === "delete" && c.entity_id) {
        await writer.deleteSession(c.entity_id);
      }
    } catch {
      // One item failing locally must not stop the rest; the server-side
      // verification already reported the authoritative outcome.
    }
  }
}
