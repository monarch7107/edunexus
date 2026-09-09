import { describe, expect, test } from "vitest";
import { isOnboarded, validateOnboarding } from "@/lib/profile";

function profile(overrides: Record<string, unknown> = {}) {
  return {
    full_name: "Alex Sharma",
    course: "B.Tech",
    branch: "Computer Science",
    ...overrides,
  };
}

describe("RC4: onboarding completion requires name + course + branch", () => {
  test("blank name fails", () => {
    expect(isOnboarded(profile({ full_name: "" }))).toBe(false);
    expect(validateOnboarding(profile({ full_name: "" }))).toHaveProperty("fullName");
  });

  test("whitespace-only name fails", () => {
    expect(isOnboarded(profile({ full_name: "   " }))).toBe(false);
    expect(validateOnboarding(profile({ full_name: "  \t " }))).toHaveProperty("fullName");
  });

  test("missing course fails", () => {
    expect(isOnboarded(profile({ course: "" }))).toBe(false);
    expect(validateOnboarding(profile({ course: "" }))).toHaveProperty("course");
  });

  test("missing branch fails", () => {
    expect(isOnboarded(profile({ branch: "  " }))).toBe(false);
    expect(validateOnboarding(profile({ branch: "" }))).toHaveProperty("branch");
  });

  test("valid onboarding passes", () => {
    expect(isOnboarded(profile())).toBe(true);
    expect(validateOnboarding(profile())).toEqual({});
  });

  test("optional semester/year and goals may be omitted", () => {
    // isOnboarded only inspects required fields; optionals live elsewhere.
    expect(isOnboarded(profile())).toBe(true);
    expect(validateOnboarding(profile())).toEqual({});
  });

  test("legacy local profile with only a full_name is NOT onboarded", () => {
    expect(
      isOnboarded(profile({ full_name: "Alex", course: "", branch: "" })),
    ).toBe(false);
  });

  test("padded-but-real values pass after trimming", () => {
    expect(
      isOnboarded(
        profile({ full_name: "  Alex  ", course: " B.Tech ", branch: " CS " }),
      ),
    ).toBe(true);
  });

  test("null profile is not onboarded", () => {
    expect(isOnboarded(null)).toBe(false);
    expect(isOnboarded(undefined)).toBe(false);
  });
});
