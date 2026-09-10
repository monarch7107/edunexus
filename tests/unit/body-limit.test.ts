import { describe, expect, it } from "vitest";
import { readBoundedJson } from "@/lib/api/body";
import { AI_LIMITS } from "@/lib/ai/types";

describe("bounded JSON body reading (M1)", () => {
  it("returns 413 before parsing when content-length is oversized", async () => {
    const request = new Request("http://test.local/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": String(AI_LIMITS.maxTransportBytes + 1) },
      body: JSON.stringify({ message: "x" }),
    });
    const result = await readBoundedJson(request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(413);
      expect(result.error).toMatch(/too large/i);
    }
  });

  it("returns 413 for chunked bodies without a content-length header", async () => {
    const over = `{"message":"${"a".repeat(AI_LIMITS.maxTransportBytes)}"}`;
    const request = new Request("http://test.local/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: over,
    });
    const result = await readBoundedJson(request);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(413);
  });

  it("returns 400 for malformed JSON", async () => {
    const request = new Request("http://test.local/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    const result = await readBoundedJson(request);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("accepts a normal request body and reports its byte length", async () => {
    const request = new Request("http://test.local/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "optimize my week" }),
    });
    const result = await readBoundedJson(request);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.value as { message: string }).message).toBe("optimize my week");
      expect(result.byteLength).toBeGreaterThan(0);
    }
  });
});
