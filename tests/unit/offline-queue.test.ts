import { describe, expect, it } from "vitest";
import {
  parseQueue,
  detectConflict,
  connectivityLabel,
  cannotExecuteAs,
  type QueuedMutation,
} from "@/lib/offline/queue";

describe("offline queue", () => {
  it("rejects malformed entries", () => {
    expect(parseQueue("nope")).toEqual([]);
    expect(parseQueue([{ id: 1, kind: "dropTable" }])).toEqual([]);
  });

  it("parses valid mutations", () => {
    const raw: QueuedMutation[] = [
      {
        id: "q1",
        userId: "user-a",
        kind: "createTask",
        payload: { title: "Revise" },
        createdAt: "2026-01-01T00:00:00.000Z",
        status: "pending",
      },
    ];
    expect(parseQueue(raw, "user-a")).toHaveLength(1);
  });

  it("filters another user's mutations from a shared blob", () => {
    const raw = [
      {
        id: "q1",
        userId: "user-a",
        kind: "createTask",
        payload: { title: "A" },
        createdAt: "2026-01-01T00:00:00.000Z",
        status: "pending",
      },
      {
        id: "q2",
        userId: "user-b",
        kind: "createTask",
        payload: { title: "B" },
        createdAt: "2026-01-01T00:00:00.000Z",
        status: "pending",
      },
    ];
    expect(parseQueue(raw, "user-b")).toHaveLength(1);
    expect(parseQueue(raw, "user-b")[0].id).toBe("q2");
  });

  it("detects conflicts without silently overwriting", () => {
    expect(detectConflict({ title: "A" }, { title: "B" })).toBe(true);
    expect(detectConflict({ title: "A" }, { title: "A" })).toBe(false);
    expect(detectConflict(undefined, { title: "A" })).toBe(false);
  });

  it("blocks executing another user's queued mutation", () => {
    const m: QueuedMutation = {
      id: "q1",
      userId: "user-a",
      kind: "createTask",
      payload: {},
      createdAt: "2026-01-01T00:00:00.000Z",
      status: "pending",
    };
    expect(cannotExecuteAs("user-b", m)).toBe(true);
    expect(cannotExecuteAs("user-a", m)).toBe(false);
  });

  it("labels connectivity honestly", () => {
    expect(connectivityLabel("offline", 0)).toMatch(/Offline/);
    expect(connectivityLabel("syncing", 1)).toMatch(/Syncing/);
    expect(connectivityLabel("error", 1)).toMatch(/attention/);
    expect(connectivityLabel("online", 0)).toBe("Synced");
  });
});
