import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "StudySpace-42!";

async function createWorkspace(page: Page) {
  const email = `s18-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test`;
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
}

test("landing is available", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("V2 planning copilot: propose, reject, no silent writes", async ({ page }) => {
  test.setTimeout(120000);
  await createWorkspace(page);
  await page.goto("/planner");
  await expect(page.getByRole("heading", { name: "Optimize my week" })).toBeVisible();
  await page.getByRole("button", { name: "Optimize", exact: true }).click();
  await expect(page.getByText("AI proposed changes")).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(page.getByText("Changes rejected. Nothing was modified.")).toBeVisible();
});

test("V2 planning copilot: approve executes and verifies", async ({ page }) => {
  test.setTimeout(120000);
  await createWorkspace(page);
  await page.goto("/academics");
  await page.getByRole("button", { name: "Add subject", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/^Subject\ name\s*\*?$/).fill("Physics");
  await dialog.getByRole("button", { name: "Add subject", exact: true }).click();
  await page.getByRole("button", { name: "Add task", exact: true }).first().click();
  const task = page.getByRole("dialog");
  await task.getByLabel(/^Title\s*\*?$/).fill("Physics exam");
  await task.getByLabel(/^Type\s*\*?$/).selectOption("exam").catch(() => undefined);
  await task.getByRole("button", { name: "Add task", exact: true }).click();
  await page.goto("/planner");
  await page.getByRole("button", { name: "Optimize", exact: true }).click();
  await expect(page.getByText("AI proposed changes")).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Approve all", exact: true }).click();
  await expect(page.getByText(/schedule has been reorganized|couldn’t fully verify/i)).toBeVisible({
    timeout: 20000,
  });
});

test("offline: AI is honest; local task persists in demo workspace", async ({ page, context }) => {
  test.setTimeout(120000);
  await createWorkspace(page);
  await page.goto("/planner");
  await context.setOffline(true);
  await page.getByRole("button", { name: "Optimize", exact: true }).click();
  await expect(
    page.getByText(/You’re offline/),
  ).toBeVisible();
  await context.setOffline(false);
  await page.goto("/academics");
  await page.getByRole("button", { name: "Add task", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/^Title\s*\*?$/).fill("Offline queued task");
  await context.setOffline(true);
  await dialog.getByRole("button", { name: "Add task", exact: true }).click();
  await expect(page.getByRole("button", { name: "Offline queued task", exact: true })).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Offline queued task", exact: true })).toBeVisible();
  await context.setOffline(false);
});

test("client user_id is rejected by the AI gateway", async ({ request }) => {
  const res = await request.post("/api/ai", {
    data: { message: "Fix my study schedule", user_id: "attacker" },
  });
  expect([400, 401]).toContain(res.status());
});

test("responsive planner at 375 and 768", async ({ page }) => {
  await createWorkspace(page);
  for (const width of [375, 768]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/planner");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    ).toBe(true);
  }
});
