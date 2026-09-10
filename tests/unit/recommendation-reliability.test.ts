import { afterEach, describe, expect, test, vi } from "vitest";
import {
  buildAdvisorPrompt,
  fallbackRecommendation,
  runAiRecommendation,
  sanitizeAiResponse,
  validateSnapshot,
  type ValidatedSnapshot,
} from "@/lib/recommendation-server";
import { fetchRecommendation, validateRecommendationResult } from "@/lib/recommendation";

function snapshot(): ValidatedSnapshot {
  return {
    goals: "Master DBMS before October",
    subjects: [{ id: "s1", name: "Database Systems", code: "CS 204" }],
    tasks: [
      {
        id: "t1",
        subject_id: "s1",
        title: "Submit DBMS lab assignment 4",
        task_type: "assignment",
        priority: "high",
        due_date: "2026-09-05T18:29:00.000Z",
        status: "pending",
      },
      {
        id: "t2",
        subject_id: "s1",
        title: "Revise normalization",
        task_type: "reading",
        priority: "medium",
        due_date: null,
        status: "pending",
      },
      {
        id: "t3",
        subject_id: null,
        title: "Finished old task",
        task_type: "other",
        priority: "low",
        due_date: null,
        status: "completed",
      },
    ],
    sessions: [
      {
        subject_id: "s1",
        planned_date: "2026-09-09",
        duration_minutes: 45,
        status: "completed",
      },
    ],
    studyMinutesCompleted: 45,
  };
}

// Diagnostics are server-side console output — silence them in tests.
vi.spyOn(console, "warn").mockImplementation(() => {});

describe("RC6: snapshot validation", () => {
  test("accepts a complete student snapshot", () => {
    const result = validateSnapshot(snapshot());
    expect(result.ok).toBe(true);
  });

  test("accepts an empty-but-shaped snapshot", () => {
    expect(validateSnapshot({}).ok).toBe(true);
  });

  test("rejects unknown shapes", () => {
    for (const bad of [
      null,
      "nope",
      [],
      { tasks: "not-an-array" },
      { tasks: [{ title: "missing id", status: "pending" }] },
      { tasks: [{ id: "x", title: "bad status", status: "archived" }] },
      { subjects: [{ name: "missing id" }] },
      { sessions: [{ planned_date: "2026-01-01" }] },
      { studyMinutesCompleted: -5 },
    ]) {
      expect(validateSnapshot(bad).ok, JSON.stringify(bad)).toBe(false);
    }
  });
});

describe("RC6: provider response validation + reference verification", () => {
  test("accepts a valid AI response", () => {
    const result = sanitizeAiResponse(
      {
        summary: "Focus on DBMS this week.",
        plan: ["Do lab 4", "Revise joins"],
        items: [{ task_id: "t1", title: "Lab 4", reason: "Overdue + high priority" }],
      },
      snapshot(),
    );
    expect(result?.source).toBe("ai");
    expect(result?.items).toHaveLength(1);
  });

  test("rejects malformed responses (recoverable → caller falls back)", () => {
    for (const bad of [
      null,
      "string",
      [],
      {},
      { summary: "", plan: [], items: [] },
      { summary: "ok", plan: "not-array", items: [] },
      { summary: "ok", plan: [1, 2], items: [] },
      { summary: "ok", plan: [], items: "nope" },
      { summary: "ok", plan: [] },
    ]) {
      expect(sanitizeAiResponse(bad, snapshot()), JSON.stringify(bad)).toBeNull();
    }
  });

  test("unknown task references are nulled, items kept", () => {
    const result = sanitizeAiResponse(
      {
        summary: "Plan",
        plan: ["Step"],
        items: [{ task_id: "ghost-id", title: "Ghost", reason: "invented" }],
      },
      snapshot(),
    );
    expect(result?.items[0]?.task_id).toBeNull();
    expect(result?.items[0]?.title).toBe("Ghost");
  });

  test("completed-task references are rejected", () => {
    const result = sanitizeAiResponse(
      {
        summary: "Plan",
        plan: ["Step"],
        items: [{ task_id: "t3", title: "Old", reason: "done already" }],
      },
      snapshot(),
    );
    expect(result?.items[0]?.task_id).toBeNull();
  });

  test("linked items inherit the REAL task deadline/subject (no invented dates)", () => {
    const result = sanitizeAiResponse(
      {
        summary: "Plan",
        plan: ["Step"],
        items: [
          {
            task_id: "t1",
            title: "Lab 4",
            reason: "urgent",
            subject_id: "forged",
            due_date: "1999-01-01",
          },
        ],
      },
      snapshot(),
    );
    expect(result?.items[0]?.task_id).toBe("t1");
    expect(result?.items[0]?.subject_id).toBe("s1");
    expect(result?.items[0]?.due_date).toBe("2026-09-05T18:29:00.000Z");
  });
});

describe("RC6: prompts contain complete relevant records", () => {
  test("every task title, goal, and subject reaches the prompt", () => {
    const snap = snapshot();
    const { system, user } = buildAdvisorPrompt(snap);
    expect(system).toMatch(/ONLY the provided data/);
    for (const task of snap.tasks) {
      expect(user).toContain(task.title);
    }
    expect(user).toContain("Master DBMS before October");
    expect(user).toContain("Database Systems");
  });
});

describe("RC6: classified provider failures", () => {
  test("missing configuration → config", async () => {
    const outcome = await runAiRecommendation(snapshot(), {
      apiKey: "",
      fetchImpl: async () => {
        throw new Error("must not be called");
      },
    });
    expect(outcome).toEqual({ ok: false, failure: "config" });
  });

  test("provider timeout → timeout", async () => {
    const outcome = await runAiRecommendation(snapshot(), {
      apiKey: "k",
      fetchImpl: async () => {
        throw new DOMException("timed out", "TimeoutError");
      },
    });
    expect(outcome).toEqual({ ok: false, failure: "timeout" });
  });

  test("provider HTTP failure → http (auth for 401/403)", async () => {
    const failing = (status: number) =>
      runAiRecommendation(snapshot(), {
        apiKey: "k",
        fetchImpl: (async () => new Response("err", { status })) as typeof fetch,
      });
    expect(await failing(500)).toEqual({ ok: false, failure: "http" });
    expect(await failing(429)).toEqual({ ok: false, failure: "http" });
    expect(await failing(401)).toEqual({ ok: false, failure: "auth" });
    expect(await failing(403)).toEqual({ ok: false, failure: "auth" });
  });

  test("network failure → network", async () => {
    const outcome = await runAiRecommendation(snapshot(), {
      apiKey: "k",
      fetchImpl: async () => {
        throw new TypeError("fetch failed");
      },
    });
    expect(outcome).toEqual({ ok: false, failure: "network" });
  });

  test("malformed provider payload → format", async () => {
    const malformed = (body: string) =>
      runAiRecommendation(snapshot(), {
        apiKey: "k",
        fetchImpl: (async () =>
          new Response(
            JSON.stringify({ choices: [{ message: { content: body } }] }),
            { status: 200 },
          )) as typeof fetch,
      });
    expect(await malformed("{oops")).toEqual({ ok: false, failure: "format" });
    expect(await malformed(JSON.stringify({ nope: true }))).toEqual({
      ok: false,
      failure: "format",
    });
  });

  test("valid provider payload → ok with verified references", async () => {
    const outcome = await runAiRecommendation(snapshot(), {
      apiKey: "k",
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    summary: "AI plan",
                    plan: ["Do t1"],
                    items: [{ task_id: "t1", title: "Lab", reason: "due soon" }],
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        )) as typeof fetch,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error("unexpected");
    expect(outcome.result.source).toBe("ai");
    expect(outcome.result.items[0]?.task_id).toBe("t1");
  });
});

describe("RC6: deterministic student-specific fallback", () => {
  test("same snapshot → same content (modulo timestamp)", () => {
    const a = fallbackRecommendation(snapshot());
    const b = fallbackRecommendation(snapshot());
    expect(a.source).toBe("fallback");
    expect({ ...a, generated_at: "" }).toEqual({ ...b, generated_at: "" });
  });

  test("fallback is built from the student's real data, not generic text", () => {
    const result = fallbackRecommendation(snapshot());
    const blob = JSON.stringify(result);
    expect(blob).toContain("Submit DBMS lab assignment 4");
    expect(blob).toContain("CS 204");
    expect(blob).toContain("Master DBMS before October");
    expect(result.items[0]?.task_id).toBe("t1");
  });

  test("fallback with no pending tasks says so explicitly", () => {
    const snap = snapshot();
    snap.tasks = snap.tasks.map((t) => ({ ...t, status: "completed" as const }));
    const result = fallbackRecommendation(snap);
    expect(result.items).toEqual([]);
    expect(result.summary).toMatch(/no pending tasks/i);
  });
});

describe("RC6: browser client bounds + validation", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function clientSnapshot() {
    return {
      goals: "",
      subjects: [],
      tasks: [],
      sessions: [],
      studyMinutesCompleted: 0,
    };
  }

  test("validateRecommendationResult accepts shaped payloads, rejects the rest", () => {
    const good = {
      source: "fallback",
      summary: "s",
      plan: ["p"],
      items: [{ task_id: null, title: "t", reason: "r" }],
      generated_at: "2026-09-09T00:00:00.000Z",
    };
    expect(validateRecommendationResult(good)).toEqual(good);
    for (const bad of [null, {}, { ...good, source: "x" }, { ...good, summary: "" }, { ...good, plan: ["p", 1] }, { ...good, items: [{ nope: 1 }] }]) {
      expect(validateRecommendationResult(bad)).toBeNull();
    }
  });

  test("browser request times out instead of waiting forever", async () => {
    globalThis.fetch = (async (_url: unknown, init?: { signal?: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
      })) as typeof fetch;
    await expect(
      fetchRecommendation(clientSnapshot(), { timeoutMs: 30 }),
    ).rejects.toThrow(/timed out/);
  });

  test("malformed API payloads produce a recoverable error", async () => {
    globalThis.fetch = (async () =>
      new Response("{oops", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch;
    await expect(fetchRecommendation(clientSnapshot())).rejects.toThrow(/damaged/);
  });
});
