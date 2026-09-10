import { describe, expect, it, vi } from "vitest";
import { syncQueue, type SyncDeps } from "@/lib/offline/sync";
import type { QueuedMutation } from "@/lib/offline/queue";

function baseDeps(overrides: Partial<SyncDeps> = {}): SyncDeps {
  return {
    createTask: vi.fn(async () => ({})),
    updateTask: vi.fn(async () => ({})),
    setTaskStatus: vi.fn(async () => ({})),
    createSession: vi.fn(async () => ({})),
    deleteSession: vi.fn(async () => ({})),
    currentState: vi.fn(async () => null),
    ...overrides,
  };
}

function mut(partial: Partial<QueuedMutation>): QueuedMutation {
  return {
    id: partial.id ?? "m1",
    userId: partial.userId ?? "user-a",
    kind: partial.kind ?? "createTask",
    payload: partial.payload ?? { title: "Revise" },
    expected: partial.expected,
    createdAt: "2026-01-01T00:00:00.000Z",
    status: partial.status ?? "pending",
    error: partial.error,
  };
}

describe("offline sync engine", () => {
  it("flushes a pending createTask through the repo and removes it", async () => {
    const deps = baseDeps();
    const res = await syncQueue("user-a", [mut({ kind: "createTask", payload: { title: "X" } })], deps);
    expect(deps.createTask).toHaveBeenCalledWith({ title: "X" });
    expect(res.synced).toEqual(["m1"]);
    expect(res.remaining).toEqual([]);
  });

  it("never flushes another account's mutation (defence in depth)", async () => {
    const deps = baseDeps();
    const res = await syncQueue("user-b", [mut({ userId: "user-a" })], deps);
    expect(deps.createTask).not.toHaveBeenCalled();
    expect(res.failed).toEqual(["m1"]);
    expect(res.remaining[0].error).toMatch(/another account/i);
  });

  it("detects a conflict and does NOT overwrite the server value", async () => {
    const deps = baseDeps({
      currentState: vi.fn(async () => ({ title: "Server title", status: "pending", priority: "high" })),
    });
    const res = await syncQueue(
      "user-a",
      [
        mut({
          kind: "setTaskStatus",
          payload: { id: "t1", completed: true },
          expected: { title: "My offline title" },
        }),
      ],
      deps,
    );
    expect(deps.setTaskStatus).not.toHaveBeenCalled();
    expect(res.conflicts).toEqual(["m1"]);
    expect(res.remaining[0].status).toBe("conflict");
    expect(res.remaining[0].error).toMatch(/conflicts with the latest version/i);
  });

  it("applies an update when expected matches current server state", async () => {
    const deps = baseDeps({
      currentState: vi.fn(async () => ({ title: "Same", status: "pending", priority: "high" })),
    });
    const res = await syncQueue(
      "user-a",
      [
        mut({
          kind: "updateTask",
          payload: { id: "t1", input: { title: "New" } },
          expected: { title: "Same" },
        }),
      ],
      deps,
    );
    expect(deps.updateTask).toHaveBeenCalledWith("t1", { title: "New" });
    expect(res.synced).toEqual(["m1"]);
  });

  it("treats an already-deleted session as successfully synced", async () => {
    const deps = baseDeps({ currentState: vi.fn(async () => null) });
    const res = await syncQueue(
      "user-a",
      [mut({ kind: "deleteSession", payload: { id: "s1" }, expected: { title: "gone" } })],
      deps,
    );
    expect(deps.deleteSession).not.toHaveBeenCalled();
    expect(res.synced).toEqual(["m1"]);
  });

  it("records a failure without dropping the item", async () => {
    const deps = baseDeps({
      createTask: vi.fn(async () => {
        throw new Error("network down");
      }),
    });
    const res = await syncQueue("user-a", [mut({ kind: "createTask" })], deps);
    expect(res.failed).toEqual(["m1"]);
    expect(res.remaining[0].status).toBe("failed");
    expect(res.remaining[0].error).toBe("network down");
  });

  it("skips items already marked synced (idempotent re-run)", async () => {
    const deps = baseDeps();
    const res = await syncQueue("user-a", [mut({ status: "synced" })], deps);
    expect(deps.createTask).not.toHaveBeenCalled();
    expect(res.synced).toEqual([]);
    expect(res.remaining).toEqual([]);
  });

  it("preserves order across multiple mutations", async () => {
    const calls: string[] = [];
    const deps = baseDeps({
      createTask: vi.fn(async (i: { title: string }) => {
        calls.push(i.title);
      }),
    });
    await syncQueue(
      "user-a",
      [
        mut({ id: "a", payload: { title: "first" } }),
        mut({ id: "b", payload: { title: "second" } }),
      ],
      deps,
    );
    expect(calls).toEqual(["first", "second"]);
  });
});
