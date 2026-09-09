import { describe, expect, test } from "vitest";
import {
  createCookieSync,
  type CookieUpdate,
} from "@/lib/supabase/cookie-sync";

/** Minimal in-memory stand-in for Next's request/response cookie jars. */
function makeJar(initial: { name: string; value: string }[] = []) {
  const store = new Map(initial.map((c) => [c.name, c.value]));
  const writes: CookieUpdate[] = [];
  return {
    writes,
    getAll: () => [...store.entries()].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string, options: Record<string, unknown> = {}) => {
      store.set(name, value);
      writes.push({ name, value, options });
    },
  };
}

describe("RC3: SSR cookie propagation", () => {
  test("setAll keeps the in-flight request jar in sync for downstream reads", () => {
    const request = makeJar([{ name: "sb-access", value: "old" }]);
    const sync = createCookieSync(request);
    sync.setAll([
      { name: "sb-access", value: "fresh", options: { path: "/" } },
    ]);
    expect(
      request.getAll().find((c) => c.name === "sb-access")?.value,
    ).toBe("fresh");
  });

  test("applyTo replays every update in order onto a redirect response", () => {
    const request = makeJar();
    const redirect = makeJar();
    const sync = createCookieSync(request);
    sync.setAll([
      { name: "sb-access", value: "a1", options: { path: "/" } },
      { name: "sb-refresh", value: "r1", options: { path: "/" } },
    ]);
    sync.applyTo({ cookies: redirect });
    expect(redirect.writes.map((w) => [w.name, w.value])).toEqual([
      ["sb-access", "a1"],
      ["sb-refresh", "r1"],
    ]);
  });

  test("multiple setAll calls all propagate (no update is dropped)", () => {
    const request = makeJar();
    const response = makeJar();
    const sync = createCookieSync(request);
    sync.setAll([{ name: "a", value: "1", options: {} }]);
    sync.setAll([{ name: "b", value: "2", options: {} }]);
    sync.applyTo({ cookies: response });
    expect(response.writes.map((w) => w.name)).toEqual(["a", "b"]);
    expect(sync.pending()).toHaveLength(2);
  });

  test("cookie clearing preserves empty value + expiry options verbatim", () => {
    const request = makeJar([{ name: "sb-access", value: "token" }]);
    const redirect = makeJar();
    const sync = createCookieSync(request);
    sync.setAll([
      { name: "sb-access", value: "", options: { maxAge: 0, path: "/" } },
    ]);
    sync.applyTo({ cookies: redirect });
    expect(redirect.writes).toEqual([
      { name: "sb-access", value: "", options: { maxAge: 0, path: "/" } },
    ]);
  });

  test("login/session propagation: fresh cookies reach both request and response", () => {
    const request = makeJar();
    const response = makeJar();
    const sync = createCookieSync(request);
    // Simulate what middleware does on every setAll: record + immediate apply.
    const updates: CookieUpdate[] = [
      { name: "sb-access", value: "new-access", options: { path: "/" } },
      { name: "sb-refresh", value: "new-refresh", options: { path: "/" } },
    ];
    sync.setAll(updates);
    for (const { name, value, options } of updates) {
      response.set(name, value, options);
    }
    expect(request.getAll()).toHaveLength(2);
    expect(response.writes).toHaveLength(2);
  });
});
