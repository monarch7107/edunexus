import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * V2 experience E2E (demo backend): the AI Command Center, Approval Center,
 * Agent Activity, Adaptive Planner, Risk, and Resource Intelligence screens
 * are all wired to the real gateway — no mock proposals anywhere.
 */

const PASSWORD = "StudySpace-42!";

async function createSeededWorkspace(page: Page) {
  const email = `v2ui-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test`;
  await page.goto("/register");
  await page.getByLabel(/^Email\s*\*?$/).fill(email);
  await page.getByLabel(/^Password\s*\*?$/).fill(PASSWORD);
  await page.getByLabel(/^Confirm\ password\s*\*?$/).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/onboarding/);
  await page.getByLabel(/^Full\ name\s*\*?$/).fill("Alex Sharma");
  await page.getByLabel(/^Course\s*\*?$/).fill("B.Tech");
  await page.getByLabel(/^Branch\ \/\ field\s*\*?$/).fill("Computer Science");
  await page.getByRole("button", { name: "A little about your goals" }).click();
  await page.getByRole("button", { name: "I’ll think about my goals later" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.getByRole("button", { name: /Load sample workspace/ }).click();
  await expect(page.getByText("Sample workspace — demo data")).toBeVisible();
}

test("AI Command Center: propose, edit, re-approve, verify", async ({ page }) => {
  test.setTimeout(120000);
  await createSeededWorkspace(page);
  await page.goto("/ai");
  await expect(
    page.getByRole("heading", { name: "Optimize my week" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Optimize", exact: true }).click();
  await expect(page.getByText("AI proposed changes")).toBeVisible({ timeout: 20000 });
  // Current vs proposed state is shown honestly from the real workspace.
  await expect(page.getByText("Current state").first()).toBeVisible();
  await expect(page.getByText("Proposed state").first()).toBeVisible();

  // Edit invalidates the proposal; saving requires a fresh review.
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const titleInput = page.getByLabel(/^Edit title for /).first();
  await titleInput.fill("Rescheduled by the student");
  await page.getByRole("button", { name: "Save edits", exact: true }).click();
  await expect(page.getByText("AI proposed changes")).toBeVisible({ timeout: 20000 });

  await page.getByRole("button", { name: "Approve all", exact: true }).click();
  await expect(page.getByText(/schedule has been reorganized|couldn’t fully verify/i)).toBeVisible({
    timeout: 20000,
  });
  await expect(page.getByText("Verifying database state").first()).toBeVisible();

  // The run is recorded in Agent Activity with its verification outcome.
  await page.goto("/ai/activity");
  await expect(page.getByText("Planning Agent").first()).toBeVisible();
  await expect(
    page.getByText(/schedule has been reorganized|couldn’t fully verify/i).first(),
  ).toBeVisible();
  await expect(page.getByText("Proposed", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Verified", { exact: true }).first()).toBeVisible();
});

test("Approval Center: reject leaves the workspace untouched", async ({ page }) => {
  test.setTimeout(120000);
  await createSeededWorkspace(page);
  await page.goto("/ai");
  await page.getByRole("button", { name: "Optimize", exact: true }).click();
  await expect(page.getByText("AI proposed changes")).toBeVisible({ timeout: 20000 });

  await page.goto("/ai/approvals");
  await expect(page.getByText("AI proposed changes")).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(page.getByText("Changes rejected. Nothing was modified.").first()).toBeVisible();
});

test("Adaptive Planner mirrors the live proposal next to the current plan", async ({
  page,
}) => {
  test.setTimeout(120000);
  await createSeededWorkspace(page);
  await page.goto("/planner/adaptive");
  await expect(page.getByRole("heading", { name: /responds to your week/ })).toBeVisible();
  await expect(page.getByText("Current plan")).toBeVisible();
  await page.getByRole("button", { name: "Optimize", exact: true }).click();
  await expect(page.getByText("AI proposed changes")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("Awaiting approval").first()).toBeVisible();
});

test("Risk and Resource Intelligence reflect the real workspace", async ({ page }) => {
  await createSeededWorkspace(page);
  await page.goto("/risk");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Academic risk");
  await expect(page.getByText("7 pending tasks")).toBeVisible();
  await page.goto("/resources/intelligence");
  await expect(
    page.getByRole("heading", { level: 1 }),
  ).toContainText("weak areas");
  await expect(page.getByText("DSA - Trees & Graphs notes")).toBeVisible();
});

test("AI routes are guarded when signed out", async ({ page }) => {
  for (const route of ["/ai", "/ai/approvals", "/ai/activity", "/risk", "/resources/intelligence"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/login/);
  }
});

test("Privacy controls clear on-device AI history", async ({ page }) => {
  test.setTimeout(120000);
  await createSeededWorkspace(page);
  await page.goto("/ai");
  await page.getByRole("button", { name: "Optimize", exact: true }).click();
  await expect(page.getByText("AI proposed changes")).toBeVisible({ timeout: 20000 });
  await page.goto("/profile");
  await page.getByRole("button", { name: "Clear AI history on this device" }).click();
  await expect(page.getByText("History cleared on this device.")).toBeVisible();
  await page.goto("/ai/activity");
  await expect(page.getByText("No agent activity yet.")).toBeVisible();
});

const V2_ROUTES = [
  "/dashboard",
  "/ai",
  "/ai/approvals",
  "/ai/activity",
  "/risk",
  "/planner/adaptive",
  "/resources/intelligence",
];

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`responsive V2 routes at ${width}px`, async ({ page }) => {
    test.setTimeout(180000);
    await createSeededWorkspace(page);
    await page.setViewportSize({ width, height: 800 });
    for (const route of V2_ROUTES) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${route} at ${width}px`,
      ).toBe(true);
    }
  });
}

test("new intelligence routes are accessible", async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 390, height: 844 });
  await createSeededWorkspace(page);
  for (const route of ["/ai", "/ai/approvals", "/ai/activity", "/risk"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Let entrance animations settle so axe measures final colors, not
    // mid-fade frames (page transitions run up to ~450ms).
    await page.waitForTimeout(700);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      `Accessibility: ${route}`,
    ).toEqual([]);
  }
});
