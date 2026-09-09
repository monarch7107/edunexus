import { uid } from "@/lib/utils";
import { AiError } from "../errors";
import { isoDate } from "../schemas";
import { memoryStore } from "../memory-store";
import { getSessionWriter } from "../persist";
import { assertOwnedSession, assertOwnedSubject } from "../authorization";
import type { AcademicSession } from "../types";
import type { ToolDefinition } from "./types";

function asSessionWrite(input: unknown) {
  if (!input || typeof input !== "object") throw new AiError("validation", "Invalid tool input.");
  return input as Record<string, unknown>;
}

export const getSubjects: ToolDefinition = {
  name: "getSubjects",
  description: "List the authenticated student's subjects.",
  allowedAgents: ["planning"],
  requiresApproval: false,
  validateInput: () => ({}),
  execute: async (ctx) => memoryStore.getAcademic(ctx.userId).subjects,
};

export const getTasks: ToolDefinition = {
  name: "getTasks",
  description: "List the authenticated student's tasks.",
  allowedAgents: ["planning"],
  requiresApproval: false,
  validateInput: () => ({}),
  execute: async (ctx) => memoryStore.getAcademic(ctx.userId).tasks,
};

export const getStudySessions: ToolDefinition = {
  name: "getStudySessions",
  description: "List the authenticated student's study sessions.",
  allowedAgents: ["planning"],
  requiresApproval: false,
  validateInput: () => ({}),
  execute: async (ctx) => memoryStore.getAcademic(ctx.userId).sessions,
};

export const createStudySession: ToolDefinition = {
  name: "createStudySession",
  description: "Create a study session for the authenticated student.",
  allowedAgents: ["planning"],
  requiresApproval: true,
  validateInput: asSessionWrite,
  execute: async (ctx, raw) => {
    const input = raw as Record<string, unknown>;
    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (!title) throw new AiError("validation", "Session title is required.");
    if (!isoDate(input.planned_date)) throw new AiError("validation", "Invalid planned_date.");
    const duration =
      typeof input.duration_minutes === "number" && input.duration_minutes > 0
        ? Math.min(input.duration_minutes, 240)
        : 45;
    const subject_id = typeof input.subject_id === "string" ? input.subject_id : null;
    assertOwnedSubject(ctx.userId, subject_id);
    const session: AcademicSession = {
      id: uid(),
      title,
      subject_id,
      planned_date: String(input.planned_date).slice(0, 10),
      duration_minutes: duration,
      status: "planned",
    };
    await getSessionWriter().create(ctx.userId, session);
    return session;
  },
};

export const updateStudySession: ToolDefinition = {
  name: "updateStudySession",
  description: "Update a study session owned by the authenticated student.",
  allowedAgents: ["planning"],
  requiresApproval: true,
  validateInput: asSessionWrite,
  execute: async (ctx, raw) => {
    const input = raw as Record<string, unknown>;
    const id = typeof input.id === "string" ? input.id : "";
    if (!id) throw new AiError("validation", "Session id is required.");
    const existing = assertOwnedSession(ctx.userId, id);
    const subject_id =
      input.subject_id === undefined
        ? existing.subject_id
        : typeof input.subject_id === "string"
          ? input.subject_id
          : null;
    assertOwnedSubject(ctx.userId, subject_id);
    if (input.planned_date !== undefined && !isoDate(input.planned_date)) {
      throw new AiError("validation", "Invalid planned_date.");
    }
    const next: AcademicSession = {
      ...existing,
      title: typeof input.title === "string" && input.title.trim() ? input.title.trim() : existing.title,
      subject_id,
      planned_date:
        typeof input.planned_date === "string"
          ? input.planned_date.slice(0, 10)
          : existing.planned_date,
      duration_minutes:
        typeof input.duration_minutes === "number" && input.duration_minutes > 0
          ? Math.min(input.duration_minutes, 240)
          : existing.duration_minutes,
    };
    await getSessionWriter().update(ctx.userId, next);
    return next;
  },
};

export const deleteStudySession: ToolDefinition = {
  name: "deleteStudySession",
  description: "Delete a study session owned by the authenticated student.",
  allowedAgents: ["planning"],
  requiresApproval: true,
  validateInput: asSessionWrite,
  execute: async (ctx, raw) => {
    const input = raw as Record<string, unknown>;
    const id = typeof input.id === "string" ? input.id : "";
    if (!id) throw new AiError("validation", "Session id is required.");
    assertOwnedSession(ctx.userId, id);
    memoryStore.deleteSession(ctx.userId, id);
    return { id };
  },
};
