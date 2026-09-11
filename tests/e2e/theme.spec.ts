import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PASSWORD = "StudySpace-42!";

async function createWorkspace(page: Page, name = "Themed Student") {
  const email = `theme-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test`;
  await page.goto("/register");
  await page.getByLabel(/^Email\s*\*?$/).fill(email);
  await page.getByLabel(/^Password\s*\*?$/).fill(PASSWORD);
  await page.getByLabel(/^Confirm\ password\s*\*?$/).fill(PASSWORD);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/onboarding/);
  await page.getByLabel(/^Full\ name\s*\*?$/).fill(name);
  await page.getByLabel(/^Course\s*\*?$/).fill("B.Tech");
  await page.getByLabel(/^Branch\ \/\ field\s*\*?$/).fill("Computer Science");
  await page.getByLabel(/^Semester\s*\*?$/).selectOption("4");
  await page.getByLabel(/^Year\ of\ study\s*\*?$/).selectOption("2");
  await page.getByRole("button", { name: "A little about your goals" }).click();
  await page
    .getByRole("button", { name: "Build a consistent study habit" })
    .click();
  await page.getByRole("button", { name: "Let’s begin" }).click();
  await expect(page).toHaveURL(/dashboard/);
  return email;
}

const PALETTES = [
  { value: "sapphire", label: /Sapphire Blue \+ Ice Silver/ },
  { value: "royal", label: /Royal Gold \+ Black/ },
  { value: "neon", label: /Neon.*Experimental/ },
  { value: "aurora", label: /Aurora Scholar/ },
] as const;

async function storedPalette(page: Page) {
  return page.evaluate(() => localStorage.getItem("edunexus-palette"));
}

test("sapphire is the default palette before any choice", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "sapphire");
});

test("profile appearance lists all four themes with previews", async ({
  page,
}) => {
  await createWorkspace(page);
  await page.goto("/profile");
  for (const { label } of PALETTES) {
    await expect(
      page.getByRole("button", { name: label }).first(),
    ).toBeVisible();
  }
  const sapphire = page.getByRole("button", {
    name: PALETTES[0].label,
  }).first();
  await expect(sapphire).toContainText("Default");
  await expect(sapphire).toContainText("Recommended");
  await expect(
    page.getByRole("button", { name: PALETTES[1].label }).first(),
  ).toContainText("Premium");
  await expect(
    page.getByRole("button", { name: PALETTES[3].label }).first(),
  ).toContainText("signature");
});

test("switching palettes updates the document and persists", async ({
  page,
}) => {
  await createWorkspace(page);
  await page.goto("/profile");
  for (const { value, label } of PALETTES) {
    await page.getByRole("button", { name: label }).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-palette", value);
    expect(await storedPalette(page)).toBe(value);
  }
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "aurora");
  await page.goto("/dashboard");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "aurora");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("palette switching works on mobile and combines with dark mode", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 375, height: 812 });
  await createWorkspace(page);
  await page.goto("/profile");
  await page.getByRole("button", { name: PALETTES[1].label }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "royal");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "royal");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/ai");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("AI surfaces render under every palette", async ({ page }) => {
  test.setTimeout(180000);
  await createWorkspace(page);
  for (const { value, label } of PALETTES) {
    await page.goto("/profile");
    await page.getByRole("button", { name: label }).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-palette", value);
    for (const route of ["/ai", "/ai/approvals", "/ai/activity"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  }
});

test("every palette passes axe on flagship routes (light + dark)", async ({
  page,
}) => {
  // Light AND dark: dark mode previously had untested contrast territory
  // (e.g. neon/aurora sidebar nav at 4.2:1) — both modes are gated now.
  test.setTimeout(480000);
  await createWorkspace(page);
  for (const { value, label } of PALETTES) {
    await page.goto("/profile");
    await page.getByRole("button", { name: label }).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-palette", value);
    for (const mode of ["Light", "Dark"] as const) {
      // Mode controls live in /profile's appearance section — the route loop
      // below leaves that page, so re-enter it before every mode switch.
      await page.goto("/profile");
      await page.getByRole("button", { name: mode, exact: true }).click();
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        mode.toLowerCase(),
      );
      for (const route of ["/dashboard", "/ai/approvals"]) {
        await page.goto(route);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await page.waitForTimeout(700);
        const audit = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(
          audit.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
          `Accessibility: ${value} ${mode.toLowerCase()} ${route}`,
        ).toEqual([]);
      }
    }
  }
});

test("appearance controls are keyboard operable with visible focus", async ({
  page,
}) => {
  await createWorkspace(page);
  await page.goto("/profile");
  const royal = page.getByRole("button", { name: PALETTES[1].label }).first();
  // A keyboard interaction first so :focus-visible matches programmatic focus.
  await page.keyboard.press("Tab");
  await royal.focus();
  await expect(royal).toBeFocused();
  const outlineWidth = await royal.evaluate(
    (el) => getComputedStyle(el).outlineWidth,
  );
  expect(parseFloat(outlineWidth)).toBeGreaterThan(0);
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "royal");
  await expect(royal).toHaveAttribute("aria-pressed", "true");
});
