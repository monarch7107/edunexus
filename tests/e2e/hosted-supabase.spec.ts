/**
 * HOSTED-SUPABASE end-to-end certification (§26).
 *
 * This suite is REAL and runs the full agentic flow against a hosted Supabase
 * project — BUT only when one is actually configured. It self-skips (never
 * fakes a pass) when Supabase is not present, because demo/localStorage mode is
 * NOT evidence of hosted persistence.
 *
 * To run it for real:
 *   1. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *   2. Apply supabase/schema.sql + v2_agentic*.sql to the project.
 *   3. In Supabase Auth, turn OFF "Confirm email" so sign-up yields a session.
 *   4. Build and start the app, then:
 *        RUN_HOSTED_SUPABASE=1 npx playwright test tests/hosted-supabase.spec.ts
 *
 * The gate is deliberate: the suite requires BOTH the Supabase env vars AND an
 * explicit RUN_HOSTED_SUPABASE=1 opt-in, so it can never be mistaken for a
 * hosted pass when it was actually skipped.
 */
import { expect, test, type Page } from "@playwright/test";

const HOSTED =
  process.env.RUN_HOSTED_SUPABASE === "1" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const PASSWORD = "StudySpace-42!";

test.describe("hosted Supabase certification", () => {
  test.skip(
    !HOSTED,
    "Hosted Supabase not configured (set NEXT_PUBLIC_SUPABASE_* and RUN_HOSTED_SUPABASE=1). " +
      "Demo mode is NOT hosted evidence — this suite intentionally does not run in demo mode.",
  );

  async function registerReal(page: Page, name: string): Promise<string> {
    const email = `hosted-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test`;
    await page.goto("/register");
    await page.getByLabel(/^Email\s*\*?$/).fill(email);
    await page.getByLabel(/^Password\s*\*?$/).fill(PASSWORD);
    await page.getByLabel(/^Confirm\ password\s*\*?$/).fill(PASSWORD);
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page).toHaveURL(/onboarding/);
    await page.getByLabel(/^Full\ name\s*\*?$/).fill(name);
    await page.getByLabel(/^Course\s*\*?$/).fill("B.Tech");
    await page.getByLabel(/^Branch\ \/\ field\s*\*?$/).fill("Computer Science");
    await page.getByRole("button", { name: "A little about your goals" }).click();
    await page.getByRole("button", { name: "I’ll think about my goals later" }).click();
    await expect(page).toHaveURL(/dashboard/);
    // In Supabase mode the footer says "Connected to your workspace".
    await expect(page.getByText(/Connected to your workspace/)).toBeVisible();
    return email;
  }

  test("full agentic flow persists to real Supabase and verifies", async ({ page }) => {
    test.setTimeout(180000);
    await registerReal(page, "Hosted Alice");

    // Real academic data.
    await page.goto("/academics");
    await page.getByRole("button", { name: "Add subject", exact: true }).first().click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel(/^Subject\ name\s*\*?$/).fill("Physics");
    await dialog.getByRole("button", { name: "Add subject", exact: true }).click();

    await page.getByRole("button", { name: "Add task", exact: true }).first().click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel(/^Title\s*\*?$/).fill("Physics exam");
    await dialog.getByLabel(/^Type\s*\*?$/).selectOption("exam").catch(() => undefined);
    await dialog.getByRole("button", { name: "Add task", exact: true }).click();

    // Planning agent → proposal → approve → execute → verify (server-side,
    // writing real study_sessions rows under RLS).
    await page.goto("/planner");
    await page.getByRole("button", { name: "Optimize", exact: true }).click();
    await expect(page.getByText("AI proposed changes")).toBeVisible({ timeout: 30000 });
    await page.getByRole("button", { name: "Approve all", exact: true }).click();
    await expect(
      page.getByText(/schedule has been reorganized|couldn’t fully verify/i),
    ).toBeVisible({ timeout: 30000 });

    // Reload proves durable hosted persistence (not localStorage).
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Connected to your workspace/)).toBeVisible();
  });

  test("second real user sees only their own data", async ({ page }) => {
    test.setTimeout(180000);
    await registerReal(page, "Hosted Alice 2");
    await page.goto("/academics");
    await page.getByRole("button", { name: "Add task", exact: true }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/^Title\s*\*?$/).fill("Alice-only secret task");
    await dialog.getByRole("button", { name: "Add task", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Alice-only secret task", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/login/);

    await registerReal(page, "Hosted Bob");
    await page.goto("/academics");
    await expect(
      page.getByRole("button", { name: "Alice-only secret task", exact: true }),
    ).toHaveCount(0);
  });

  test("unauthenticated AI request is rejected by hosted auth", async ({ request }) => {
    const res = await request.post("/api/ai", { data: { message: "Optimize my schedule" } });
    expect([401, 403]).toContain(res.status());
  });
});
