/**
 * End-to-end pipeline tests.
 *
 * Student request → Gateway → Orchestrator → Planning Agent → read tools
 * → structured plan → validation → ChangeSet → approval → write tools
 * → repository → database → verification.
 *
 * A deterministic mock model stands in for the LLM, so these tests never
 * depend on an external provider.
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import { MemoryAcademicPort } from "@/lib/ai/store/memory";
import { resetRateLimit } from "@/lib/ai/authorization";
import { summarizeVerification, sessionMatches } from "@/lib/ai/verification";
import { AI_LIMITS } from "@/lib/ai/limits";
import { RepoError } from "@/lib/repo/errors";
import {
  createChange,
  day,
  examWorkspace,
  harness,
  modelPlan,
  session,
} from "./helpers";

vi.spyOn(console, "warn").mockImplementation(() => {});
beforeEach(() => resetRateLimit());

describe("full agentic workflow", () => {
  test("propose → approve → execute → verify updates the database", async () => {
    const plan = async () =>
      modelPlan(
        [
          createChange({
            payload: {
              subject_id: "sub-physics",
              title: "Physics revision",
              planned_date: day(3),
              duration_minutes: 60,
            },
          }),
          createChange({
            payload: {
              subject_id: "sub-dbms",
              title: "DBMS revision",
              planned_date: day(4),
              duration_minutes: 90,
            },
          }),
          {
            operation: "move",
            entity: "study_session",
            entity_id: "ses-existing",
            payload: {
              subject_id: "sub-physics",
              title: "Old physics reading",
              planned_date: day(2),
              duration_minutes: 45,
            },
            reason: "Moved earlier so it lands before the exam.",
          },
        ],
        "Three exams next week need revision coverage.",
      );

    const h = harness({ seed: examWorkspace(), completion: plan });

    // ── Phase 1: propose ────────────────────────────────────────────
    const proposal = await h.orchestrator.proposePlan(h.principal, {
      message: "I have three exams next week. Fix my study schedule.",
      surface: "planner",
    });

    expect(proposal.status).toBe("waiting_approval");
    expect(proposal.agent).toBe("planning");
    expect(proposal.intent).toBe("optimize_schedule");
    expect(proposal.source).toBe("ai");
    expect(proposal.changes).toHaveLength(3);
    expect(proposal.changeSetId).toBeTruthy();
    expect(proposal.analyzed.tasks).toBe(3);

    // Reads were audited.
    const readActions = await h.store.listActions("user-a", proposal.runId);
    expect(readActions.filter((a) => a.action_type === "read")).toHaveLength(3);

    // NOTHING has been written to academic data yet.
    expect(await h.academic.listSessions("user-a")).toHaveLength(1);

    // The run is parked awaiting approval.
    expect((await h.store.getRun("user-a", proposal.runId))?.status).toBe(
      "waiting_approval",
    );

    // ── Phase 2: approve + execute + verify ─────────────────────────
    const result = await h.orchestrator.approveAndExecute(h.principal, {
      runId: proposal.runId,
      changeSetId: proposal.changeSetId as string,
      decision: "approve_all",
    });

    expect(result.proposed).toBe(3);
    expect(result.approved).toBe(3);
    expect(result.executed).toBe(3);
    expect(result.verified).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.fullyVerified).toBe(true);
    expect(result.status).toBe("verified");
    expect(result.message).toMatch(/reorganized/i);

    // ── The database is the source of truth ─────────────────────────
    const sessions = await h.academic.listSessions("user-a");
    expect(sessions).toHaveLength(3); // 1 existing (moved) + 2 created
    expect(sessions.find((s) => s.title === "Physics revision")?.planned_date).toBe(day(3));
    expect(sessions.find((s) => s.title === "DBMS revision")?.duration_minutes).toBe(90);
    // The moved session kept its identity and changed its date.
    const moved = await h.academic.getSession("user-a", "ses-existing");
    expect(moved?.planned_date).toBe(day(2));

    // Audit trail is complete.
    const finalRun = await h.store.getRun("user-a", proposal.runId);
    expect(finalRun?.status).toBe("completed");
    expect(finalRun?.completed_at).toBeTruthy();
    const actions = await h.store.listActions("user-a", proposal.runId);
    const writes = actions.filter((a) => a.action_type !== "read");
    expect(writes).toHaveLength(3);
    expect(writes.every((a) => a.status === "verified")).toBe(true);
    expect(writes.every((a) => a.requires_approval)).toBe(true);
    expect(writes.every((a) => a.approved_at && a.executed_at && a.verified_at)).toBe(true);
  });

  test("rejecting a plan executes nothing", async () => {
    const h = harness({
      seed: examWorkspace(),
      completion: async () => modelPlan([createChange()]),
    });
    const proposal = await h.orchestrator.proposePlan(h.principal, {
      message: "fix my study schedule",
      surface: "planner",
    });

    await h.orchestrator.rejectChangeSet(h.principal, {
      runId: proposal.runId,
      changeSetId: proposal.changeSetId as string,
    });

    // Only the original session remains.
    expect(await h.academic.listSessions("user-a")).toHaveLength(1);
    expect((await h.store.getRun("user-a", proposal.runId))?.status).toBe("cancelled");
    const cs = await h.store.getChangeSet("user-a", proposal.changeSetId as string);
    expect(cs?.status).toBe("rejected");

    // A rejected change set can never be executed afterwards.
    await expect(
      h.orchestrator.approveAndExecute(h.principal, {
        runId: proposal.runId,
        changeSetId: proposal.changeSetId as string,
        decision: "approve_all",
      }),
    ).rejects.toMatchObject({ class: "approval" });
  });

  test("partial approval executes only the selected changes", async () => {
    const h = harness({
      seed: examWorkspace(),
      completion: async () =>
        modelPlan([
          createChange({ payload: { ...createChange().payload, title: "Keep me" } }),
          createChange({
            payload: { ...createChange().payload, title: "Skip me", planned_date: day(4) },
          }),
        ]),
    });
    const proposal = await h.orchestrator.proposePlan(h.principal, {
      message: "fix my study schedule",
      surface: "planner",
    });
    const keep = proposal.changes.find((c) => c.label.includes("Keep me"));
    expect(keep).toBeTruthy();

    const result = await h.orchestrator.approveAndExecute(h.principal, {
      runId: proposal.runId,
      changeSetId: proposal.changeSetId as string,
      decision: "approve_selected",
      itemIds: [keep!.id],
    });

    expect(result.approved).toBe(1);
    expect(result.verified).toBe(1);
    const titles = (await h.academic.listSessions("user-a")).map((s) => s.title);
    expect(titles).toContain("Keep me");
    expect(titles).not.toContain("Skip me");
  });

  test("editing a change invalidates the approval and requires re-approval", async () => {
    const h = harness({
      seed: examWorkspace(),
      completion: async () => modelPlan([createChange()]),
    });
    const proposal = await h.orchestrator.proposePlan(h.principal, {
      message: "fix my study schedule",
      surface: "planner",
    });
    const itemId = proposal.changes[0].id;

    // Approve, then edit — the edit resets everything to pending.
    const edited = await h.orchestrator.editChangeItem(h.principal, {
      runId: proposal.runId,
      changeSetId: proposal.changeSetId as string,
      itemId,
      payload: { duration_minutes: 120, title: "Longer physics revision" },
    });
    expect(edited.status).toBe("waiting_approval");
    expect(edited.changes[0].payload.duration_minutes).toBe(120);

    const approval = await h.store.getApprovalForChangeSet(
      "user-a",
      proposal.changeSetId as string,
    );
    expect(approval?.status).toBe("pending");

    // Re-approving executes the EDITED version, not the original.
    const result = await h.orchestrator.approveAndExecute(h.principal, {
      runId: proposal.runId,
      changeSetId: proposal.changeSetId as string,
      decision: "approve_all",
    });
    expect(result.fullyVerified).toBe(true);
    const saved = (await h.academic.listSessions("user-a")).find(
      (s) => s.title === "Longer physics revision",
    );
    expect(saved?.duration_minutes).toBe(120);
  });

  test("a change set cannot be executed twice", async () => {
    const h = harness({
      seed: examWorkspace(),
      completion: async () => modelPlan([createChange()]),
    });
    const proposal = await h.orchestrator.proposePlan(h.principal, {
      message: "fix my study schedule",
      surface: "planner",
    });
    await h.orchestrator.approveAndExecute(h.principal, {
      runId: proposal.runId,
      changeSetId: proposal.changeSetId as string,
      decision: "approve_all",
    });
    const countAfterFirst = (await h.academic.listSessions("user-a")).length;

    await expect(
      h.orchestrator.approveAndExecute(h.principal, {
        runId: proposal.runId,
        changeSetId: proposal.changeSetId as string,
        decision: "approve_all",
      }),
    ).rejects.toMatchObject({ class: "approval" });

    // No duplicate rows were created.
    expect(await h.academic.listSessions("user-a")).toHaveLength(countAfterFirst);
  });

  test("an expired plan cannot be approved", async () => {
    let clock = new Date("2026-09-09T10:00:00.000Z");
    const h = harness({
      seed: examWorkspace(),
      completion: async () => modelPlan([createChange()]),
      now: () => clock,
    });
    const proposal = await h.orchestrator.proposePlan(h.principal, {
      message: "fix my study schedule",
      surface: "planner",
    });

    // Jump past the approval TTL.
    clock = new Date(clock.getTime() + AI_LIMITS.APPROVAL_TTL_MS + 1000);

    await expect(
      h.orchestrator.approveAndExecute(h.principal, {
        runId: proposal.runId,
        changeSetId: proposal.changeSetId as string,
        decision: "approve_all",
      }),
    ).rejects.toMatchObject({ class: "approval" });
    expect(await h.academic.listSessions("user-a")).toHaveLength(1);
  });
});

describe("AI failure handling and fallback", () => {
  test("falls back to deterministic logic when the provider is unavailable", async () => {
    const h = harness({
      seed: examWorkspace(),
      // Simulate a provider outage.
      completion: async () => null,
    });
    const proposal = await h.orchestrator.proposePlan(h.principal, {
      message: "I have three exams next week. Fix my study schedule.",
      surface: "planner",
    });

    // Clearly labelled as rule-based, never passed off as the LLM.
    expect(proposal.source).toBe("fallback");
    expect(proposal.fallback).toBe(true);
    expect(proposal.changes.length).toBeGreaterThan(0);

    // The fallback plan flows through the SAME approval + verification path.
    const result = await h.orchestrator.approveAndExecute(h.principal, {
      runId: proposal.runId,
      changeSetId: proposal.changeSetId as string,
      decision: "approve_all",
    });
    expect(result.fullyVerified).toBe(true);
  });

  test("falls back when the model returns malformed output", async () => {
    const h = harness({
      seed: examWorkspace(),
      completion: async () => "Sure! Here are some ideas: study more, sleep less.",
    });
    const proposal = await h.orchestrator.proposePlan(h.principal, {
      message: "fix my study schedule",
      surface: "planner",
    });
    expect(proposal.source).toBe("fallback");
  });

  test("falls back when the model throws", async () => {
    const h = harness({
      seed: examWorkspace(),
      completion: async () => {
        throw new Error("provider exploded");
      },
    });
    const proposal = await h.orchestrator.proposePlan(h.principal, {
      message: "fix my study schedule",
      surface: "planner",
    });
    expect(proposal.source).toBe("fallback");
  });

  test("an unrecognized request is refused, not guessed at", async () => {
    const h = harness({ seed: examWorkspace() });
    await expect(
      h.orchestrator.proposePlan(h.principal, {
        message: "what is the capital of France?",
        surface: "planner",
      }),
    ).rejects.toMatchObject({ class: "unsupported" });
  });

  test("partial execution failure is reported honestly", async () => {
    const academic = new MemoryAcademicPort(examWorkspace());
    let calls = 0;
    // The second write fails at the database layer.
    const original = academic.createSession.bind(academic);
    academic.createSession = async (userId, payload) => {
      calls += 1;
      if (calls === 2) throw new RepoError("backend", "insert failed");
      return original(userId, payload);
    };

    const h = harness({
      academic,
      completion: async () =>
        modelPlan([
          createChange({ payload: { ...createChange().payload, title: "First" } }),
          createChange({
            payload: { ...createChange().payload, title: "Second", planned_date: day(4) },
          }),
        ]),
    });
    const proposal = await h.orchestrator.proposePlan(h.principal, {
      message: "fix my study schedule",
      surface: "planner",
    });
    const result = await h.orchestrator.approveAndExecute(h.principal, {
      runId: proposal.runId,
      changeSetId: proposal.changeSetId as string,
      decision: "approve_all",
    });

    // 1 of 2 succeeded — the result must NOT claim 2/2.
    expect(result.approved).toBe(2);
    expect(result.executed).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.verified).toBe(1);
    expect(result.fullyVerified).toBe(false);
    expect(result.message).toMatch(/couldn’t fully verify/i);
    expect((await h.store.getRun("user-a", proposal.runId))?.status).toBe("failed");
  });

  test("proposes nothing when the schedule is already covered", async () => {
    const ws = examWorkspace();
    // A revision session already exists for every exam.
    ws.sessions = ws.tasks.map((t, i) =>
      session({
        id: `cov-${i}`,
        user_id: "user-a",
        subject_id: t.subject_id,
        title: "Existing revision",
        planned_date: day(1),
      }),
    );
    const h = harness({ seed: ws, completion: async () => modelPlan([]) });
    const proposal = await h.orchestrator.proposePlan(h.principal, {
      message: "fix my study schedule",
      surface: "planner",
    });
    expect(proposal.changes).toHaveLength(0);
    expect(proposal.status).toBe("completed");
    expect(proposal.changeSetId).toBeNull();
  });
});

describe("verification logic", () => {
  test("detects a mismatch between expected and actual state", () => {
    const expected = {
      subject_id: null,
      title: "Physics revision",
      planned_date: "2026-09-10",
      duration_minutes: 60,
    };
    expect(
      sessionMatches(
        session({
          id: "s",
          user_id: "u",
          title: "Physics revision",
          planned_date: "2026-09-10",
          duration_minutes: 60,
        }),
        expected,
      ),
    ).toBe(true);
    // Wrong duration → not verified.
    expect(
      sessionMatches(
        session({
          id: "s",
          user_id: "u",
          title: "Physics revision",
          planned_date: "2026-09-10",
          duration_minutes: 45,
        }),
        expected,
      ),
    ).toBe(false);
    expect(sessionMatches(null, expected)).toBe(false);
  });

  test("never reports success unless every approved change verified", () => {
    expect(
      summarizeVerification({ proposed: 6, approved: 6, executed: 6, failed: 0, verified: 6 })
        .fullyVerified,
    ).toBe(true);
    const partial = summarizeVerification({
      proposed: 6,
      approved: 6,
      executed: 4,
      failed: 2,
      verified: 4,
    });
    expect(partial.fullyVerified).toBe(false);
    expect(partial.message).toMatch(/couldn’t fully verify/i);
    expect(partial.message).toContain("4 of 6");
  });

  test("reports a total failure clearly", () => {
    const none = summarizeVerification({
      proposed: 3,
      approved: 3,
      executed: 0,
      failed: 3,
      verified: 0,
    });
    expect(none.fullyVerified).toBe(false);
    expect(none.message).toMatch(/not updated|couldn’t apply/i);
  });
});
