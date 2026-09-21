import { describe, expect, it } from "vitest";
import { askTutor } from "@/lib/ai/tutor";

describe("AIESES AI Tutor", () => {
  it("provides deterministic pedagogical explanation when API key is unset", async () => {
    const res = await askTutor({
      topic: "Calculus",
      mode: "explain",
    });
    expect(res.source).toBe("deterministic_fallback");
    expect(res.content).toContain("Calculus");
    expect(res.content).toContain("Fundamental Theorem");
    expect(res.suggestedFollowUps.length).toBeGreaterThan(0);
  });

  it("handles explain_simply mode with intuitive analogies", async () => {
    const res = await askTutor({
      topic: "Calculus",
      mode: "explain_simply",
    });
    expect(res.source).toBe("deterministic_fallback");
    expect(res.content.toLowerCase()).toContain("speedometer");
  });

  it("provides active practice challenge questions", async () => {
    const res = await askTutor({
      topic: "Data Structures",
      mode: "practice_question",
    });
    expect(res.source).toBe("deterministic_fallback");
    expect(res.content).toContain("Question:");
  });

  it("provides targeted next learning actions", async () => {
    const res = await askTutor({
      topic: "Calculus",
      mode: "next_action",
    });
    expect(res.source).toBe("deterministic_fallback");
    expect(res.title).toContain("Recommended Study Action");
    expect(res.content).toContain("syllabus coverage");
  });
});
