/**
 * Registered tools — the ONLY sanctioned path from an agent to student data.
 *
 * Each tool declares its own schemas, its agent allowlist and whether it
 * needs approval. None of them accepts a `user_id`: the identity always
 * comes from `context.principal`, which the model never sees.
 */

import { z } from "zod";
import type { StudySession, Subject, Task } from "../../types";
import { sessionPayloadSchema } from "../schemas";
import { assertSessionOwnership } from "../authorization";
import type { ToolDefinition } from "./types";

const emptyInput = z.object({}).strip();

const subjectShape = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  code: z.string(),
  color: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

const taskShape = z.object({
  id: z.string(),
  user_id: z.string(),
  subject_id: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  task_type: z.string(),
  priority: z.string(),
  due_date: z.string().nullable(),
  status: z.string(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const sessionShape = z.object({
  id: z.string(),
  user_id: z.string(),
  subject_id: z.string().nullable(),
  title: z.string(),
  planned_date: z.string(),
  duration_minutes: z.number(),
  status: z.string(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// ── READ tools ───────────────────────────────────────────────────────────────

export const getSubjectsTool: ToolDefinition<Record<string, never>, Subject[]> = {
  name: "getSubjects",
  description: "List the authenticated student's subjects.",
  inputSchema: emptyInput as unknown as z.ZodType<Record<string, never>>,
  outputSchema: z.array(subjectShape) as unknown as z.ZodType<Subject[]>,
  allowedAgents: ["planning"],
  requiresApproval: false,
  kind: "read",
  operation: "read",
  targetType: "subject",
  async execute(_input, context) {
    return context.academic.listSubjects(context.principal.userId);
  },
};

export const getTasksTool: ToolDefinition<Record<string, never>, Task[]> = {
  name: "getTasks",
  description: "List the authenticated student's tasks, including deadlines.",
  inputSchema: emptyInput as unknown as z.ZodType<Record<string, never>>,
  outputSchema: z.array(taskShape) as unknown as z.ZodType<Task[]>,
  allowedAgents: ["planning"],
  requiresApproval: false,
  kind: "read",
  operation: "read",
  targetType: "task",
  async execute(_input, context) {
    return context.academic.listTasks(context.principal.userId);
  },
};

export const getStudySessionsTool: ToolDefinition<
  Record<string, never>,
  StudySession[]
> = {
  name: "getStudySessions",
  description: "List the authenticated student's planned and completed study sessions.",
  inputSchema: emptyInput as unknown as z.ZodType<Record<string, never>>,
  outputSchema: z.array(sessionShape) as unknown as z.ZodType<StudySession[]>,
  allowedAgents: ["planning"],
  requiresApproval: false,
  kind: "read",
  operation: "read",
  targetType: "study_session",
  async execute(_input, context) {
    return context.academic.listSessions(context.principal.userId);
  },
};

// ── WRITE tools (all require approval) ───────────────────────────────────────

export type CreateSessionInput = z.infer<typeof sessionPayloadSchema>;

export const createStudySessionTool: ToolDefinition<CreateSessionInput, StudySession> = {
  name: "createStudySession",
  description: "Create a new study session for the authenticated student.",
  inputSchema: sessionPayloadSchema as unknown as z.ZodType<CreateSessionInput>,
  outputSchema: sessionShape as unknown as z.ZodType<StudySession>,
  allowedAgents: ["planning"],
  requiresApproval: true,
  kind: "write",
  operation: "create",
  targetType: "study_session",
  async execute(input, context) {
    return context.academic.createSession(context.principal.userId, {
      subject_id: input.subject_id ?? null,
      title: input.title,
      planned_date: input.planned_date,
      duration_minutes: input.duration_minutes,
    });
  },
};

const updateSessionInputSchema = z
  .object({
    id: z.string().min(1).max(64),
    payload: sessionPayloadSchema,
  })
  .strip();

export type UpdateSessionInput = z.infer<typeof updateSessionInputSchema>;

export const updateStudySessionTool: ToolDefinition<UpdateSessionInput, StudySession> = {
  name: "updateStudySession",
  description:
    "Update an existing study session (title, subject, date or duration) owned by the student.",
  inputSchema: updateSessionInputSchema as unknown as z.ZodType<UpdateSessionInput>,
  outputSchema: sessionShape as unknown as z.ZodType<StudySession>,
  allowedAgents: ["planning"],
  requiresApproval: true,
  kind: "write",
  operation: "update",
  targetType: "study_session",
  async execute(input, context) {
    // Ownership re-checked at execution time, not just at planning time.
    await assertSessionOwnership(context.principal, context.academic, input.id);
    return context.academic.updateSession(context.principal.userId, input.id, {
      subject_id: input.payload.subject_id ?? null,
      title: input.payload.title,
      planned_date: input.payload.planned_date,
      duration_minutes: input.payload.duration_minutes,
    });
  },
};

const deleteSessionInputSchema = z.object({ id: z.string().min(1).max(64) }).strip();

export type DeleteSessionInput = z.infer<typeof deleteSessionInputSchema>;

/**
 * Present for completeness of the registry, but NOT reachable by the
 * planning agent in slice 1: `allowedAgents` is empty, so any attempt to
 * invoke it — however the request was phrased — is denied. The first
 * vertical slice deliberately prefers create/update over destruction.
 */
export const deleteStudySessionTool: ToolDefinition<DeleteSessionInput, { id: string }> = {
  name: "deleteStudySession",
  description: "Delete a study session owned by the student. Not enabled for any agent yet.",
  inputSchema: deleteSessionInputSchema as unknown as z.ZodType<DeleteSessionInput>,
  outputSchema: z.object({ id: z.string() }),
  allowedAgents: [],
  requiresApproval: true,
  kind: "write",
  operation: "delete",
  targetType: "study_session",
  async execute(input, context) {
    await assertSessionOwnership(context.principal, context.academic, input.id);
    await context.academic.deleteSession(context.principal.userId, input.id);
    return { id: input.id };
  },
};
