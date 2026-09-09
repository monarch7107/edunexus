import { beforeEach, describe, expect, test, vi } from "vitest";
import { detectIntent, selectAgent } from "@/lib/ai/orchestrator";
import {
  agentPlanSchema,
  extractJsonObject,
  gatewayRequestSchema,
  parseModelPlan,
} from "@/lib/ai/schemas";
import { AI_LIMITS } from "@/lib/ai/limits";
import { PlanningAgent } from "@/lib/ai/agents/planning";
import { AgentError, toAgentError, repoCodeToAgentClass } from "@/lib/ai/errors";
import { RepoError } from "@/lib/repo/errors";
import { resetRateLimit } from "@/lib/ai/authorization";
import {
  analyzeSchedule,
  buildFallbackPlan,
  rankPendingTasks,
} from "@/lib/ai/agents/schedule-logic";
import { day, examWorkspace, TODAY } from "./helpers";

vi.spyOn(console, "warn").mockImplementation(() => {});
beforeEach(() => resetRateLimit());

describe("intent recognition", () => {
  test("recognizes schedule optimization phrasings", () => {
    const phrases = [
      "I have three exams next week. Fix my study schedule.",
      "Optimize my week",
      "Can you rearrange my timetable?",
      "I need more revision time before my exams",
      "plan my study sessions",
    ];
    for (const p of phrases) expect(detectIntent(p)).toBe("optimize_schedule");
  });

  test("refuses unrelated requests instead of guessing", () => {
    expect(detectIntent("What is the capital of France?")).toBeNull();
    expect(detectIntent("write me a poem")).toBeNull();
    expect(detectIntent("")).toBeNull();
  });
});

describe("agent routing", () => {
  test("routes optimize_schedule to the planning agent", () => {
    const agent = selectAgent("optimize_schedule");
    expect(agent.name).toBe("planning");
    expect(agent.canHandle("optimize_schedule")).toBe(true);
  });

  test("planning agent declines intents it does not own", () => {
    const agent = new PlanningAgent();
    // Future intents are not implemented — canHandle must be honest.
    expect(agent.canHandle("prioritize_tasks" as never)).toBe(false);
  });
});

describe("gateway request schema", () => {
  test("accepts a valid request", () => {
    const parsed = gatewayRequestSchema.parse({ message: "fix my schedule" });
    expect(parsed.surface).toBe("planner");
  });

  test("rejects a client-supplied user_id (strict schema)", () => {
    const result = gatewayRequestSchema.safeParse({
      message: "fix my schedule",
      user_id: "victim-user",
    });
    expect(result.success).toBe(false);
  });

  test("rejects empty and oversized messages", () => {
    expect(gatewayRequestSchema.safeParse({ message: "" }).success).toBe(false);
    expect(
      gatewayRequestSchema.safeParse({
        message: "x".repeat(AI_LIMITS.MAX_MESSAGE_CHARS + 1),
      }).success,
    ).toBe(false);
  });
});

describe("structured AI output validation", () => {
  test("accepts a well-formed plan", () => {
    const parsed = parseModelPlan(
      JSON.stringify({
        summary: "ok",
        evidence: ["exam on the 10th"],
        changes: [
          {
            operation: "create",
            entity: "study_session",
            entity_id: null,
            payload: { title: "Revision", planned_date: "2026-09-10", duration_minutes: 60 },
          },
        ],
      }),
    );
    expect(parsed.ok).toBe(true);
  });

  test("tolerates markdown fences around the JSON", () => {
    const raw = '```json\n{"summary":"ok","evidence":[],"changes":[]}\n```';
    expect(parseModelPlan(raw).ok).toBe(true);
    expect(extractJsonObject(raw)).toContain('"summary"');
  });

  test("rejects malformed / non-JSON output", () => {
    expect(parseModelPlan("I think you should study more.").ok).toBe(false);
    expect(parseModelPlan("{ not json ").ok).toBe(false);
    expect(parseModelPlan("").ok).toBe(false);
  });

  test("rejects unknown operations", () => {
    const result = agentPlanSchema.safeParse({
      summary: "x",
      changes: [{ operation: "drop_table", entity: "study_session", payload: {} }],
    });
    expect(result.success).toBe(false);
  });

  test("rejects unsupported entities", () => {
    const result = agentPlanSchema.safeParse({
      summary: "x",
      changes: [{ operation: "delete", entity: "profiles", payload: {} }],
    });
    expect(result.success).toBe(false);
  });

  test("rejects plans exceeding the change limit", () => {
    const changes = Array.from({ length: AI_LIMITS.MAX_PROPOSED_CHANGES + 1 }, () => ({
      operation: "create",
      entity: "study_session",
      payload: {},
    }));
    expect(agentPlanSchema.safeParse({ summary: "x", changes }).success).toBe(false);
  });

  test("rejects output beyond the size limit", () => {
    const huge = JSON.stringify({
      summary: "x".repeat(AI_LIMITS.MAX_MODEL_OUTPUT_CHARS + 10),
      changes: [],
    });
    const parsed = parseModelPlan(huge);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.reason).toBe("output_too_large");
  });
});

describe("error classification", () => {
  test("maps V1 repo codes onto agent classes", () => {
    expect(repoCodeToAgentClass("not-found")).toBe("not_found");
    expect(repoCodeToAgentClass("forbidden")).toBe("permission");
    expect(repoCodeToAgentClass("auth")).toBe("auth");
    expect(repoCodeToAgentClass("network")).toBe("network");
    expect(repoCodeToAgentClass("backend")).toBe("database");
  });

  test("preserves V1 RepoError categorization through the agent boundary", () => {
    const wrapped = toAgentError(new RepoError("forbidden", "RLS denial"));
    expect(wrapped.class).toBe("permission");
    expect(wrapped.status).toBe(403);
    // The raw database message must never reach the student.
    expect(wrapped.publicMessage).not.toContain("RLS");
  });

  test("assigns sensible HTTP statuses", () => {
    expect(new AgentError("auth", "x").status).toBe(401);
    expect(new AgentError("rate_limit", "x").status).toBe(429);
    expect(new AgentError("timeout", "x").status).toBe(504);
    expect(new AgentError("validation", "x").status).toBe(400);
  });
});

describe("deterministic schedule logic", () => {
  const ws = examWorkspace();
  const context = {
    today: TODAY,
    subjects: ws.subjects.map((s) => ({ id: s.id, name: s.name, code: s.code })),
    tasks: ws.tasks.map((t) => ({
      id: t.id,
      subject_id: t.subject_id,
      title: t.title,
      task_type: t.task_type,
      priority: t.priority,
      due_date: t.due_date,
      status: t.status,
    })),
    sessions: ws.sessions.map((s) => ({
      id: s.id,
      subject_id: s.subject_id,
      title: s.title,
      planned_date: s.planned_date,
      duration_minutes: s.duration_minutes,
      status: s.status,
    })),
    goals: "",
    findings: [],
  };

  test("detects exams with no revision booked", () => {
    const findings = analyzeSchedule(context);
    expect(findings.some((f) => f.kind === "uncovered_exam")).toBe(true);
  });

  test("ranks overdue work first", () => {
    const withOverdue = [
      ...context.tasks,
      {
        id: "t-overdue",
        subject_id: null,
        title: "Late lab report",
        task_type: "assignment" as const,
        priority: "low" as const,
        due_date: `${day(-3)}T23:59:00.000Z`,
        status: "pending" as const,
      },
    ];
    const ranked = rankPendingTasks(withOverdue, TODAY);
    expect(ranked[0].task.id).toBe("t-overdue");
  });

  test("fallback plan proposes revision sessions and is labelled fallback", () => {
    const plan = buildFallbackPlan({ ...context, findings: analyzeSchedule(context) });
    expect(plan.source).toBe("fallback");
    expect(plan.changes.length).toBeGreaterThan(0);
    // Every proposal must be a create for a real, owned subject.
    for (const change of plan.changes) {
      expect(change.entity).toBe("study_session");
      expect(change.operation).toBe("create");
      const subjectId = change.payload.subject_id as string | null;
      if (subjectId) {
        expect(ws.subjects.map((s) => s.id)).toContain(subjectId);
      }
    }
  });

  test("fallback respects the maximum change limit", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      id: `bulk-${i}`,
      subject_id: null,
      title: `Task ${i}`,
      task_type: "assignment" as const,
      priority: "high" as const,
      due_date: `${day(1 + (i % 10))}T23:59:00.000Z`,
      status: "pending" as const,
    }));
    const plan = buildFallbackPlan({ ...context, tasks: many, sessions: [] });
    expect(plan.changes.length).toBeLessThanOrEqual(AI_LIMITS.MAX_PROPOSED_CHANGES);
  });

  test("proposes nothing when every deadline is already covered", () => {
    const covered = {
      ...context,
      sessions: context.tasks.map((t, i) => ({
        id: `cov-${i}`,
        subject_id: t.subject_id,
        title: "Revision",
        planned_date: day(1),
        duration_minutes: 60,
        status: "planned" as const,
      })),
    };
    const plan = buildFallbackPlan(covered);
    expect(plan.changes).toHaveLength(0);
  });
});
