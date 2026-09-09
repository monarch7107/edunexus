import { describe, expect, test } from "vitest";
import {
  createRefreshCoordinator,
  refreshFailureSummary,
  settleRefresh,
} from "@/lib/workspace-refresh";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("RC1: stale responses must never overwrite newer state", () => {
  test("A → refresh, B → refresh, B lands, A lands: A is discarded whole", async () => {
    const coordinator = createRefreshCoordinator();
    const tokenA = coordinator.begin();
    const tokenB = coordinator.begin();

    const a = deferred<string>();
    const b = deferred<string>();
    const pendingA = settleRefresh(coordinator, tokenA, {
      tasks: () => a.promise,
    });
    const pendingB = settleRefresh(coordinator, tokenB, {
      tasks: () => b.promise,
    });

    b.resolve("B-tasks");
    const resultB = await pendingB;
    expect(resultB.stale).toBe(false);
    expect(resultB.values).toEqual({ tasks: "B-tasks" });

    a.resolve("A-tasks");
    const resultA = await pendingA;
    expect(resultA.stale).toBe(true);
    expect(resultA.values).toEqual({});
    expect(resultA.failed).toEqual([]);
  });

  test("a superseded round is stale even when it rejects", async () => {
    const coordinator = createRefreshCoordinator();
    const tokenA = coordinator.begin();
    coordinator.begin(); // B starts, A is now stale
    const a = deferred<string>();
    const pendingA = settleRefresh(coordinator, tokenA, {
      tasks: () => a.promise,
    });
    a.reject(new Error("boom"));
    const resultA = await pendingA;
    expect(resultA.stale).toBe(true);
  });

  test("sequential rounds each commit normally", async () => {
    const coordinator = createRefreshCoordinator();
    const first = await settleRefresh(coordinator, coordinator.begin(), {
      tasks: async () => ["t1"],
    });
    expect(first.stale).toBe(false);
    expect(first.values).toEqual({ tasks: ["t1"] });
    const second = await settleRefresh(coordinator, coordinator.begin(), {
      tasks: async () => ["t1", "t2"],
    });
    expect(second.values).toEqual({ tasks: ["t1", "t2"] });
  });
});

describe("RC1: datasets settle independently", () => {
  test("one failed read does not block unrelated successful datasets", async () => {
    const coordinator = createRefreshCoordinator();
    const result = await settleRefresh(coordinator, coordinator.begin(), {
      profile: async () => ({ id: "u1" }),
      subjects: async () => [{ id: "s1" }],
      tasks: async () => {
        throw new Error("tasks read failed");
      },
      sessions: async () => [],
      resources: async () => [],
      recommendations: async () => [],
    });
    expect(result.stale).toBe(false);
    expect(result.failed).toEqual(["tasks"]);
    expect(result.values.profile).toEqual({ id: "u1" });
    expect(result.values.subjects).toEqual([{ id: "s1" }]);
    expect(result.values.sessions).toEqual([]);
    expect(result.values).not.toHaveProperty("tasks");
  });

  test("write-ok + partial refresh failure is observable (failed keys listed)", async () => {
    // Simulates: task write succeeded, follow-up dashboard refresh partially
    // fails. The caller must see exactly which datasets went stale so the
    // dashboard can show a sync warning instead of pretending all is current.
    const coordinator = createRefreshCoordinator();
    const result = await settleRefresh(coordinator, coordinator.begin(), {
      tasks: async () => [{ id: "t-new" }],
      sessions: async () => {
        throw new Error("offline");
      },
    });
    expect(result.failed).toEqual(["sessions"]);
    expect(result.values.tasks).toEqual([{ id: "t-new" }]);
    expect(refreshFailureSummary(result.failed)).toMatch(/study sessions/);
  });

  test("retry after failure recovers cleanly with zero failures", async () => {
    const coordinator = createRefreshCoordinator();
    let fail = true;
    const loaders = {
      tasks: async () => {
        if (fail) throw new Error("flaky");
        return ["t1"];
      },
    };
    const first = await settleRefresh(coordinator, coordinator.begin(), loaders);
    expect(first.failed).toEqual(["tasks"]);
    fail = false;
    const retry = await settleRefresh(coordinator, coordinator.begin(), loaders);
    expect(retry.failed).toEqual([]);
    expect(retry.values.tasks).toEqual(["t1"]);
  });
});

describe("RC1: failure summaries", () => {
  test("empty failures produce no summary", () => {
    expect(refreshFailureSummary([])).toBe("");
  });
  test("single dataset is named", () => {
    expect(refreshFailureSummary(["tasks"])).toMatch(/your tasks/);
  });
  test("multiple datasets are all named", () => {
    const summary = refreshFailureSummary(["tasks", "sessions", "profile"]);
    expect(summary).toMatch(/tasks/);
    expect(summary).toMatch(/study sessions/);
    expect(summary).toMatch(/profile/);
  });
});
