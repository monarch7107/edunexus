import { describe, expect, it } from "vitest";
import {
  dikshaAdapter,
  OFFICIAL_NCERT_ATTRIBUTION,
  DIKSHA_DEMO_PROVIDER_LABEL,
} from "@/lib/government/diksha";

describe("DIKSHA Government Content Adapter", () => {
  it("searches and returns curriculum resources with NCERT attribution", async () => {
    const results = await dikshaAdapter.searchResources();
    expect(results.items.length).toBeGreaterThan(0);
    expect(results.source).toBe(DIKSHA_DEMO_PROVIDER_LABEL);

    const first = results.items[0];
    expect(first.attribution.publisher).toContain("NCERT");
    expect(first.attribution.license).toContain("CC-BY-NC-SA 4.0");
    expect(first.attribution.portalUrl).toBe("https://diksha.gov.in");
  });

  it("filters resources by query string", async () => {
    const calculusResults = await dikshaAdapter.searchResources({ query: "calculus" });
    expect(calculusResults.items.length).toBeGreaterThan(0);
    expect(calculusResults.items.every((r) => r.title.toLowerCase().includes("calculus") || r.description.toLowerCase().includes("calculus"))).toBe(true);
  });

  it("filters resources by subject", async () => {
    const csResults = await dikshaAdapter.searchResources({ subject: "Computer Science" });
    expect(csResults.items.length).toBeGreaterThan(0);
    expect(csResults.items.every((r) => r.subject === "Computer Science")).toBe(true);
  });

  it("returns specific resource metadata and attribution by id", async () => {
    const res = await dikshaAdapter.getResource("diksha-ncert-math-01");
    expect(res).not.toBeNull();
    expect(res?.title).toContain("Calculus");

    const meta = await dikshaAdapter.getMetadata("diksha-ncert-math-01");
    expect(meta?.board).toContain("CBSE");

    const attr = await dikshaAdapter.getAttribution("diksha-ncert-math-01");
    expect(attr?.framework).toBe("NCF-2023");
  });
});
