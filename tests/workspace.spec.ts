import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { toDateInput, dayKey, rankTasks } from "../lib/utils";
import {
  validatePreviewFile,
  resourceKind,
  safeResourceUrl,
} from "../lib/resources";

const PASSWORD = "StudySpace-42!";
async function createWorkspace(page: Page, name = "Alex Sharma") {
  const email = `student-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test`;
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
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Alex");
  return email;
}
async function addSubject(page: Page, name: string, code: string) {
  await page
    .getByRole("button", { name: "Add subject", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/^Subject\ name\s*\*?$/).fill(name);
  await dialog.getByLabel(/^Course\ code\ \(optional\)\s*\*?$/).fill(code);
  await dialog
    .getByRole("button", { name: "Add subject", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
}
async function addTask(
  page: Page,
  title: string,
  subject: string,
  priority = "medium",
) {
  await page
    .getByRole("button", { name: "Add task", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/^Title\s*\*?$/).fill(title);
  await dialog
    .getByLabel(/^Description\ \(optional\)\s*\*?$/)
    .fill("Review the lecture notes and make a clear plan.");
  await dialog.getByLabel(/^Subject\s*\*?$/).selectOption({ label: subject });
  await dialog.getByLabel(/^Priority\s*\*?$/).selectOption(priority);
  await dialog.getByLabel(/^Due\ date\s*\*?$/).fill(toDateInput());
  await dialog.getByRole("button", { name: "Add task", exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

// This suite uses the existing zero-configuration local repository. It never
// seeds production data or claims that Supabase/storage were live-tested.
test("student journey: registration, onboarding, CRUD, recommendations, settings and persistence", async ({
  page,
}) => {
  test.setTimeout(150000);
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  const email = await createWorkspace(page);
  await page.goto("/academics");
  await addSubject(page, "Database Systems", "CS 204");
  await addTask(
    page,
    "Finish the database assignment",
    "CS 204 — Database Systems",
    "high",
  );
  await page
    .getByRole("button", {
      name: 'Mark "Finish the database assignment" as complete',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: 'Mark "Finish the database assignment" as pending',
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: 'Mark "Finish the database assignment" as pending',
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: 'Mark "Finish the database assignment" as pending',
    })
    .click();
  await page
    .getByRole("button", { name: "Edit task Finish the database assignment" })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel(/^Title\s*\*?$/)
    .fill("Submit the database assignment");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save changes" })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Submit the database assignment",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit Database Systems", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel(/^Subject\ name\s*\*?$/)
    .fill("Database Management Systems");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save changes" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Database Management Systems",
      exact: true,
    }),
  ).toBeVisible();

  await page.goto("/planner");
  await page
    .getByRole("button", { name: "Plan study session", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel(/^Session\ title\s*\*?$/)
    .fill("Practice SQL joins");
  await page
    .getByRole("dialog")
    .getByLabel(/^Duration\s*\*?$/)
    .selectOption("45");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Plan session", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Complete session Practice SQL joins",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Session completed", { exact: true }),
  ).toBeVisible();
  await page.goto("/insights");
  await expect(page.getByText("45 min", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Last 14 days", exact: true }).click();
  await expect(
    page.getByText("of focused learning in the last 14 days"),
  ).toBeVisible();

  await page.goto("/learning");
  await page.getByRole("button", { name: "Add resource", exact: true }).click();
  await page.getByLabel(/^Resource\ title\s*\*?$/).fill("SQL revision notes");
  await page
    .getByLabel(/^Your\ note\s*\*?$/)
    .fill(
      "Inner joins keep matching rows. Left joins keep every row on the left.\n" +
        "More detail worth keeping. ".repeat(25),
    );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save resource", exact: true })
    .click();
  await page.getByRole("button", { name: "Read note", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Left joins keep every row on the left.",
  );
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Read note", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Add resource", exact: true }).click();
  await page.getByRole("button", { name: "Save a link", exact: true }).click();
  await page.getByLabel(/^Resource\ title\s*\*?$/).fill("Database textbook");
  await page
    .getByLabel(/^Resource\ link\s*\*?$/)
    .fill("https://example.com/database-textbook.pdf");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save resource", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Open document", exact: false }),
  ).toHaveAttribute("href", "https://example.com/database-textbook.pdf");
  await page.getByRole("button", { name: "List view" }).click();
  await expect(page.getByRole("button", { name: "List view" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByLabel(/^Search\ resources\s*\*?$/).fill("SQL");
  await expect(page.locator("article")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear resource search" }).click();

  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: "Generate my study plan", exact: false })
    .click();
  await expect(
    page.getByText("Smart rules · No AI service used"),
  ).toBeVisible();
  await expect(
    page.locator("#ai-title").locator("..").locator("..").locator(".."),
  ).toContainText("Submit the database assignment");
  await page.getByRole("button", { name: "Search your workspace" }).click();
  await page
    .getByLabel(/^Search\ all\ workspace\ items\s*\*?$/)
    .fill("SQL revision");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "SQL revision notes Resource" })
    .click();
  await expect(page).toHaveURL(/learning\?search=/);
  await expect(page.locator("article")).toHaveCount(1);

  await page.goto("/profile");
  await page.getByLabel(/^Full\ name\s*\*?$/).fill("Alex Sharma Updated");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Alex Sharma Updated", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Aurora Scholar" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "aurora");
  await page.getByRole("switch", { name: "Reduce workspace motion" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "aurora");
  await expect(
    page.getByRole("switch", { name: "Reduce workspace motion" }),
  ).toHaveAttribute("aria-checked", "true");
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .last()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel(/^Email\s*\*?$/).fill(email);
  await page.getByLabel(/^Password\s*\*?$/).fill(PASSWORD);
  await page.getByRole("button", { name: "Log in to your workspace" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/academics");
  // Deleting a subject must preserve, and only unlink, child work.
  await page
    .getByRole("button", {
      name: "Delete Database Management Systems",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Submit the database assignment",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Delete task Submit the database assignment",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Submit the database assignment",
      exact: true,
    }),
  ).not.toBeVisible();
  await page.goto("/planner");
  await page
    .getByRole("button", { name: "Delete session Practice SQL joins" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(
    page.getByText("Practice SQL joins", { exact: true }),
  ).not.toBeVisible();
  await page.goto("/learning");
  await page
    .getByRole("button", { name: "Delete resource SQL revision notes" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Read note", exact: true }),
  ).not.toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("upload UI is honest, validates files and does not create a resource", async ({
  page,
}) => {
  await createWorkspace(page);
  await page.goto("/learning");
  await page.getByRole("button", { name: "Choose file", exact: true }).click();
  await expect(
    page.getByText("Direct uploads aren’t connected yet."),
  ).toBeVisible();
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({
    name: "lecture.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 sample"),
  });
  await expect(page.getByText("lecture.pdf", { exact: true })).toBeVisible();
  await expect(page.getByText("Selected locally · Not uploaded")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upload unavailable" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Remove selected file" }).click();
  await input.setInputFiles({
    name: "script.exe",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("not an educational resource"),
  });
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Choose a PDF, Word document",
  );
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Choose file", exact: true }),
  ).toBeFocused();
  await expect(page.locator("article")).toHaveCount(0);
});

test("auth validation, guards, theme persistence and error feedback", async ({
  page,
}) => {
  for (const route of [
    "dashboard",
    "academics",
    "planner",
    "learning",
    "insights",
    "profile",
    "onboarding",
  ]) {
    await page.goto(`/${route}`);
    await expect(page).toHaveURL(/login/);
  }
  await page.getByRole("button", { name: "Log in to your workspace" }).click();
  await expect(page.getByLabel(/^Email\s*\*?$/)).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByLabel(/^Email\s*\*?$/).fill("missing@example.test");
  await page.getByLabel(/^Password\s*\*?$/).fill(PASSWORD);
  await page.getByRole("button", { name: "Log in to your workspace" }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "That email and password don’t match" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/login/);
  await page.getByRole("button", { name: "Customize appearance" }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.getByRole("button", { name: "Royal Gold + Black" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "royal");
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("mobile routes, forms, dark mode, reduced motion and accessibility", async ({
  page,
}) => {
  test.setTimeout(150000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await createWorkspace(page);
  for (const route of [
    "dashboard",
    "academics",
    "planner",
    "learning",
    "insights",
    "profile",
  ]) {
    await page.goto(`/${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("navigation", { name: "Mobile navigation" }),
    ).toBeVisible();
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      audit.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
      `Accessibility: ${route}`,
    ).toEqual([]);
  }
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  for (const route of [
    "dashboard",
    "academics",
    "planner",
    "learning",
    "insights",
    "profile",
  ]) {
    await page.goto(`/${route}`);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      `Dark accessibility: ${route}`,
    ).toEqual([]);
  }
  await page.goto("/academics");
  await page.getByRole("button", { name: "Add subject", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest('[role="dialog"]'),
    ),
  ).toBe(true);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add subject", exact: true })
    .click();
  await expect(page.getByLabel(/^Subject\ name\s*\*?$/)).toHaveAttribute(
    "aria-invalid",
    "true",
  );
});

test("local date parsing, resource validation and original prioritization are safe", async () => {
  expect(dayKey("2026-09-05")).toBe("2026-09-05");
  expect(dayKey("2026-13-40")).toBeNull();
  expect(dayKey("2026-02-30")).toBeNull();
  expect(dayKey("invalid-date")).toBeNull();
  expect(safeResourceUrl("javascript:alert(1)")).toBeNull();
  expect(safeResourceUrl("https://example.test/lecture.pdf")).toBe(
    "https://example.test/lecture.pdf",
  );
  expect(
    validatePreviewFile({
      name: "lecture.pdf",
      size: 200,
      type: "application/pdf",
    }),
  ).toBeNull();
  expect(
    validatePreviewFile({
      name: "lecture.docx",
      size: 200,
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
  ).toBeNull();
  expect(
    validatePreviewFile({
      name: "empty.pdf",
      size: 0,
      type: "application/pdf",
    }),
  ).toContain("empty");
  expect(
    validatePreviewFile({
      name: "large.pdf",
      size: 21 * 1024 * 1024,
      type: "application/pdf",
    }),
  ).toContain("20 MB");
  expect(
    validatePreviewFile({
      name: "disguised.png",
      size: 200,
      type: "image/svg+xml",
    }),
  ).toContain("safely");
  expect(
    resourceKind({
      resource_type: "link",
      resource_url: "https://example.test/file.pdf?token=x",
    } as Parameters<typeof resourceKind>[0]),
  ).toBe("document");
  expect(rankTasks([])).toEqual([]);
});

test("failed saves and recommendation requests remain retryable without false success", async ({
  page,
}) => {
  await createWorkspace(page);
  await page.goto("/academics");
  await addSubject(page, "Software Engineering", "CS 206");
  await addTask(
    page,
    "Write the project brief",
    "CS 206 — Software Engineering",
  );
  await page
    .getByRole("button", { name: "Add task", exact: true })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByLabel(/^Title\s*\*?$/)
    .fill("Must not appear until saved");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    (
      window as unknown as { restoreTestStorage: () => void }
    ).restoreTestStorage = () => {
      Storage.prototype.setItem = original;
    };
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("edunexus_db_"))
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add task", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Add task", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("alert").filter({ hasText: "storage is full" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => {
      const id = JSON.parse(localStorage.getItem("edunexus_demo_session")!);
      return JSON.parse(localStorage.getItem(`edunexus_db_${id}`)!).tasks
        .length;
    }),
  ).toBe(1);
  await page.evaluate(() =>
    (
      window as unknown as { restoreTestStorage: () => void }
    ).restoreTestStorage(),
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add task", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Must not appear until saved",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/dashboard");
  await page.route("**/api/recommend", (route) => route.abort());
  await page
    .getByRole("button", { name: "Generate my study plan", exact: false })
    .click();
  await expect(page.getByText("A brief pause, not a setback.")).toBeVisible();
  await page.unroute("**/api/recommend");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByText("Smart rules · No AI service used"),
  ).toBeVisible();
});

test("public pages are accessible in both themes and the smallest navigation stays on screen", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const route of ["/", "/login", "/register"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", scheme);
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        audit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        `${scheme}: ${route}`,
      ).toEqual([]);
    }
  }
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await page.getByRole("button", { name: "Customize appearance" }).click();
  const appearance = page
    .locator("[id]")
    .filter({ has: page.getByRole("button", { name: "Light", exact: true }) })
    .last();
  const box = await appearance.boundingBox();
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect(box ? box.x + box.width : 1000).toBeLessThanOrEqual(320);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Customize appearance" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobile site navigation" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
