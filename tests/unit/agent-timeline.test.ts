import { describe, expect, it } from "vitest";
import { stageIndexForStatus } from "@/components/ai/agent-timeline";

describe("agent timeline stages", () => {
  it("maps run statuses to the furthest stage reached", () => {
    expect(stageIndexForStatus(null)).toBeNull();
    expect(stageIndexForStatus("queued")).toBe(0);
    expect(stageIndexForStatus("running")).toBe(2);
    expect(stageIndexForStatus("waiting_approval")).toBe(5);
    expect(stageIndexForStatus("executing")).toBe(6);
    expect(stageIndexForStatus("completed")).toBe(8);
  });

  it("parks failed and cancelled runs at the approval stage", () => {
    expect(stageIndexForStatus("failed")).toBe(5);
    expect(stageIndexForStatus("cancelled")).toBe(5);
  });
});
