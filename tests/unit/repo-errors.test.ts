import { describe, expect, test } from "vitest";
import {
  RepoError,
  asRepoError,
  classifySupabaseError,
  isRepoError,
  toRepoError,
} from "@/lib/repo/errors";
import { friendlyError } from "@/lib/errors";

describe("RC2: classifySupabaseError", () => {
  test("PGRST116 (zero rows) is expected absence, not a backend failure", () => {
    expect(classifySupabaseError({ code: "PGRST116", message: "Cannot coerce" })).toBe(
      "not-found",
    );
    expect(classifySupabaseError({ message: "No rows found" })).toBe("not-found");
  });

  test("session/identity failures are auth failures, never 'no user'", () => {
    for (const message of [
      "JWT expired",
      "invalid JWT: unable to parse",
      "Auth session missing!",
      "Not signed in",
      "Invalid login credentials",
      "Email not confirmed",
      "User not found",
    ]) {
      expect(classifySupabaseError({ message }), message).toBe("auth");
    }
    expect(classifySupabaseError({ status: 401, message: "Unauthorized" })).toBe("auth");
  });

  test("RLS/policy denials are forbidden", () => {
    expect(classifySupabaseError({ code: "42501", message: "permission denied" })).toBe(
      "forbidden",
    );
    expect(classifySupabaseError({ status: 403, message: "Forbidden" })).toBe("forbidden");
    expect(
      classifySupabaseError({ message: "new row violates row-level security policy" }),
    ).toBe("forbidden");
  });

  test("rejected input is validation", () => {
    expect(
      classifySupabaseError({ code: "23505", message: "duplicate key value" }),
    ).toBe("validation");
    expect(
      classifySupabaseError({ code: "23502", message: 'null value in column "title"' }),
    ).toBe("validation");
    expect(classifySupabaseError({ message: "User already registered" })).toBe(
      "validation",
    );
    expect(classifySupabaseError({ status: 400, message: "Bad request" })).toBe("validation");
  });

  test("connectivity problems are network failures", () => {
    for (const message of [
      "fetch failed",
      "Failed to fetch",
      "Network request failed",
      "socket hang up",
    ]) {
      expect(classifySupabaseError({ message }), message).toBe("network");
    }
    expect(classifySupabaseError({ status: 503, message: "Service unavailable" })).toBe(
      "network",
    );
  });

  test("anything else is a backend failure", () => {
    expect(classifySupabaseError({ message: "something exploded" })).toBe("backend");
    expect(classifySupabaseError(null)).toBe("backend");
    expect(classifySupabaseError(undefined)).toBe("backend");
  });
});

describe("RC2: RepoError helpers", () => {
  test("toRepoError keeps the original message and category", () => {
    const err = toRepoError({ code: "PGRST116", message: "zero rows" }, "fallback");
    expect(err).toBeInstanceOf(RepoError);
    expect(err.code).toBe("not-found");
    expect(err.message).toBe("zero rows");
  });

  test("toRepoError falls back when the message is empty", () => {
    expect(toRepoError(null, "fallback").message).toBe("fallback");
  });

  test("asRepoError preserves categorized errors and wraps the rest", () => {
    const categorized = new RepoError("auth", "expired");
    expect(asRepoError(categorized, "backend")).toBe(categorized);
    const wrapped = asRepoError(new Error("boom"), "network");
    expect(wrapped).toBeInstanceOf(RepoError);
    expect(wrapped.code).toBe("network");
    expect(isRepoError(new Error("x"))).toBe(false);
  });
});

describe("RC2: friendlyError maps every category to safe UI copy", () => {
  test("not-found", () => {
    expect(friendlyError(new RepoError("not-found", "Task not found"))).toMatch(
      /couldn’t find that item/i,
    );
  });
  test("auth distinguishes credentials from expired sessions", () => {
    expect(friendlyError(new RepoError("auth", "Invalid login credentials"))).toMatch(
      /don’t match/,
    );
    expect(friendlyError(new RepoError("auth", "JWT expired"))).toMatch(
      /session has expired/i,
    );
  });
  test("forbidden", () => {
    expect(friendlyError(new RepoError("forbidden", "RLS"))).toMatch(/don’t have access/i);
  });
  test("validation", () => {
    expect(
      friendlyError(new RepoError("validation", "User already registered")),
    ).toMatch(/already exists/);
    expect(friendlyError(new RepoError("validation", "bad input"))).toMatch(
      /couldn’t be saved/i,
    );
  });
  test("network", () => {
    expect(friendlyError(new RepoError("network", "fetch failed"))).toMatch(
      /couldn’t connect/i,
    );
  });
  test("backend stays generic and never leaks internals", () => {
    const message = friendlyError(
      new RepoError("backend", "relation subjects does not exist"),
    );
    expect(message).toMatch(/existing work is safe/i);
    expect(message).not.toContain("relation");
  });
});
