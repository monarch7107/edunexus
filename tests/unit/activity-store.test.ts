import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  clearAgentHistory,
  listAgentRuns,
  recordAgentRun,
} from "@/lib/ai/activity-store";
import type { GatewayResponse } from "@/lib/ai/types";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
    key: () => null,
    length: 0,
  } as Storage;
}

function gateway(overrides: Partial<GatewayResponse> = {}): GatewayResponse {
  return {
    runId: "run-1",
    status: "waiting_approval",
    agent: "planning",
    intent: "optimize_schedule",
    summary: "Test proposal",
    evidence: [],
    conflicts: [],
    changeSetId: "set-1",
    changes: [],
    source: "fallback",
    activity: { proposed: 2, approved: 0, executed: 0, verified: 0 },
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubGlobal("window", { localStorage: memoryStorage() });
});

describe("agent activity store", () => {
  it("records and lists runs newest-first", () => {
    recordAgentRun("user-a", gateway({ runId: "run-1", summary: "First" }));
    recordAgentRun("user-a", gateway({ runId: "run-2", summary: "Second" }));
    const runs = listAgentRuns("user-a");
    expect(runs.map((r) => r.runId)).toEqual(["run-2", "run-1"]);
    expect(runs[0].proposed).toBe(2);
  });

  it("upserts the same run instead of duplicating it", () => {
    recordAgentRun("user-a", gateway({ runId: "run-1", status: "waiting_approval" }));
    recordAgentRun("user-a", gateway({ runId: "run-1", status: "completed" }));
    const runs = listAgentRuns("user-a");
    expect(runs).toHaveLength(1);
    expect(runs[0].status).toBe("completed");
  });

  it("isolates history per user id", () => {
    recordAgentRun("user-a", gateway({ runId: "run-a" }));
    expect(listAgentRuns("user-b")).toEqual([]);
    recordAgentRun("user-b", gateway({ runId: "run-b" }));
    expect(listAgentRuns("user-a").map((r) => r.runId)).toEqual(["run-a"]);
    expect(listAgentRuns("user-b").map((r) => r.runId)).toEqual(["run-b"]);
  });

  it("returns [] for corrupt storage instead of throwing", () => {
    const storage = (window as unknown as { localStorage: Storage }).localStorage;
    storage.setItem("edunexus_ai_history_user-a", "{oops");
    expect(listAgentRuns("user-a")).toEqual([]);
  });

  it("caps history at 20 entries", () => {
    for (let i = 0; i < 25; i++) {
      recordAgentRun("user-a", gateway({ runId: `run-${i}` }));
    }
    expect(listAgentRuns("user-a")).toHaveLength(20);
  });

  it("clears one user's history without touching another's", () => {
    recordAgentRun("user-a", gateway({ runId: "run-a" }));
    recordAgentRun("user-b", gateway({ runId: "run-b" }));
    clearAgentHistory("user-a");
    expect(listAgentRuns("user-a")).toEqual([]);
    expect(listAgentRuns("user-b")).toHaveLength(1);
  });
});
