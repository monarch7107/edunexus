import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it, beforeEach } from "vitest";
import { memoryStore } from "@/lib/ai/memory-store";
import { handleGetChangeSet } from "@/lib/ai/gateway";
import { runOrchestrator } from "@/lib/ai/orchestrator";
import { agentPersistenceMode } from "@/lib/ai/persistence-mode";
import type { AcademicContext } from "@/lib/ai/types";

const USER_A = "user-a";
const USER_B = "user-b";

function ctx(): AcademicContext {
  return {
    goals: "",
    subjects: [{ id: "sub-phy", name: "Physics", code: "PHY" }],
    tasks: [
      {
        id: "t1",
        subject_id: "sub-phy",
        title: "Exam",
        task_type: "exam",
        priority: "high",
        due_date: "2099-12-15",
        status: "pending",
      },
    ],
    sessions: [],
  };
}

describe("RLS policy source", () => {
  it("requires auth.uid() = user_id on every V2 table", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/v2_agentic.sql"), "utf8");
    for (const table of [
      "agent_runs",
      "agent_actions",
      "change_sets",
      "change_items",
      "agent_approvals",
    ]) {
      expect(sql).toContain(`enable row level security`);
      expect(sql).toMatch(new RegExp(table));
    }
    expect(sql).toContain("auth.uid() = user_id");
  });

  it("step 19 migration is additive only", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/v2_agentic_step19.sql"), "utf8");
    expect(sql.toLowerCase()).not.toMatch(/\bdrop table\b/);
    expect(sql.toLowerCase()).not.toMatch(/\btruncate\b/);
    expect(sql).toContain("add column if not exists");
  });
});

describe("persistence mode", () => {
  it("is demo when supabase env is unset", () => {
    expect(agentPersistenceMode()).toBe("demo");
  });
});

describe("reload + cross-user isolation", () => {
  beforeEach(() => memoryStore.reset());

  it("owner can reload a pending change set", async () => {
    const orch = await runOrchestrator(
      { userId: USER_A },
      { message: "Fix my study schedule", snapshot: ctx() },
      {
        planFn: async () => ({
          summary: "Add physics",
          evidence: [],
          conflicts: [],
          source: "ai",
          changes: [
            {
              operation: "create",
              entity: "study_session",
              entity_id: null,
              payload: {
                title: "Physics revision",
                subject_id: "sub-phy",
                planned_date: "2099-12-14",
                duration_minutes: 60,
              },
              label: "Create Physics revision",
            },
          ],
        }),
      },
    );
    const got = await handleGetChangeSet({
      userId: USER_A,
      changeSetId: orch.changeSetId,
    });
    expect(got.status).toBe(200);
    const body = got.body as { changeSetId: string };
    expect(body.changeSetId).toBe(orch.changeSetId);
  });

  it("user B cannot load user A change set", async () => {
    const orch = await runOrchestrator(
      { userId: USER_A },
      { message: "Fix my study schedule", snapshot: ctx() },
      {
        planFn: async () => ({
          summary: "x",
          evidence: [],
          conflicts: [],
          source: "ai",
          changes: [
            {
              operation: "create",
              entity: "study_session",
              entity_id: null,
              payload: {
                title: "Secret",
                subject_id: "sub-phy",
                planned_date: "2099-12-14",
                duration_minutes: 45,
              },
              label: "x",
            },
          ],
        }),
      },
    );
    const got = await handleGetChangeSet({
      userId: USER_B,
      changeSetId: orch.changeSetId,
    });
    expect(got.status).toBe(404);
  });

  it("unauthenticated reload is rejected", async () => {
    const got = await handleGetChangeSet({ userId: null, changeSetId: "x" });
    expect(got.status).toBe(401);
  });
});
