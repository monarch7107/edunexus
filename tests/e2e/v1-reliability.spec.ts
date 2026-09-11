import { expect, test, type Page } from "@playwright/test";

/**
 * Step 9 — V1 reliability E2E (demo backend).
 *
 * Covers what unit tests cannot: the real student-facing flows for
 * onboarding validation (RC4), task deadlines (RC5), refresh/sync
 * observability (RC1), and AI failure recovery (RC6). RC2 error
 * categorization and RC3 cookie propagation are covered by unit tests
 * (plus the auth-failure UI paths in workspace.spec.ts); live Supabase
 * session propagation is a production-verification item.
 */

const PASSWORD = "StudySpace-42!";

async function registerAndLandOnboarding(page: Page) {
  const email = `step9-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test`;
  await page.goto("/register");
  await page.getByLabel(/^Email\s*\*?$/).fill(email);
  await page.getByLabel(/^Password\s*\*?$/).fill(PASSWORD);
  await page.getByLabel(/^Confirm\ password\s*\*?$/).fill(PASSWORD);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/onboarding/);
  return email;
}

async function completeOnboarding(page: Page) {
  await page.getByLabel(/^Full\ name\s*\*?$/).fill("Alex Sharma");
  await page.getByLabel(/^Course\s*\*?$/).fill("B.Tech");
  await page.getByLabel(/^Branch\ \/\ field\s*\*?$/).fill("Computer Science");
  // Semester/year deliberately omitted — they are optional.
  await page.getByRole("button", { name: "A little about your goals" }).click();
  await page
    .getByRole("button", { name: "I’ll think about my goals later" })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Alex");
}

async function createTask(
  page: Page,
  title: string,
  dueDate?: string,
) {
  await page
    .getByRole("button", { name: "Add task", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/^Title\s*\*?$/).fill(title);
  if (dueDate !== undefined) {
    await dialog.getByLabel(/^Due\ date\s*\*?$/).fill(dueDate);
  }
  await dialog.getByRole("button", { name: "Add task", exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

async function dbTasks(page: Page) {
  return page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem("edunexus_demo_session")!);
    const db = JSON.parse(localStorage.getItem(`edunexus_db_${id}`)!);
    return db.tasks as { id: string; title: string; due_date: string | null }[];
  });
}

test("RC4: onboarding rejects blank/whitespace required fields, accepts valid input with optionals omitted", async ({
  page,
}) => {
  await registerAndLandOnboarding(page);
  await page.getByRole("button", { name: "A little about your goals" }).click();
  await expect(page.getByText("Tell us what to call you.")).toBeVisible();
  await expect(page.getByText("Add your course, such as B.Tech.")).toBeVisible();
  await expect(
    page.getByText("Add your branch or field of study."),
  ).toBeVisible();
  await expect(page).toHaveURL(/onboarding/);

  // Whitespace-only name is still rejected.
  await page.getByLabel(/^Full\ name\s*\*?$/).fill("   ");
  await page.getByLabel(/^Course\s*\*?$/).fill("B.Tech");
  await page.getByLabel(/^Branch\ \/\ field\s*\*?$/).fill("Computer Science");
  await page.getByRole("button", { name: "A little about your goals" }).click();
  await expect(page.getByText("Tell us what to call you.")).toBeVisible();
  await expect(page).toHaveURL(/onboarding/);

  // Valid input with optionals omitted completes onboarding.
  await page.getByLabel(/^Full\ name\s*\*?$/).fill("Alex Sharma");
  await page.getByRole("button", { name: "A little about your goals" }).click();
  await page
    .getByRole("button", { name: "I’ll think about my goals later" })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Alex");
});

test("RC5: deadlines — past allowed, title-only edit preserves timestamp, edit/clear work", async ({
  page,
}) => {
  await registerAndLandOnboarding(page);
  await completeOnboarding(page);
  await page.goto("/academics");

  // Create with a PAST date: allowed, and the input carries no min block.
  await page
    .getByRole("button", { name: "Add task", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  const dueInput = dialog.getByLabel(/^Due\ date\s*\*?$/);
  expect(
    await dueInput.evaluate((el) =>
      (el as HTMLInputElement).hasAttribute("min"),
    ),
  ).toBe(false);
  await dialog.getByLabel(/^Title\s*\*?$/).fill("Past deadline task");
  await dueInput.fill("2020-05-04");
  await dialog.getByRole("button", { name: "Add task", exact: true }).click();
  await expect(dialog).not.toBeVisible();

  const expected = await page.evaluate(
    () => new Date("2020-05-04T23:59:00").toISOString(),
  );
  let tasks = await dbTasks(page);
  expect(
    tasks.find((t) => t.title === "Past deadline task")?.due_date,
  ).toBe(expected);

  // Edit the TITLE ONLY: the exact stored timestamp must survive.
  await page
    .getByRole("button", { name: "Edit task Past deadline task" })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel(/^Title\s*\*?$/)
    .fill("Past deadline task v2");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save changes" })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  tasks = await dbTasks(page);
  expect(
    tasks.find((t) => t.title === "Past deadline task v2")?.due_date,
  ).toBe(expected);

  // Explicit date change takes effect.
  await page
    .getByRole("button", { name: "Edit task Past deadline task v2" })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel(/^Due\ date\s*\*?$/)
    .fill("2026-12-25");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save changes" })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const expected2 = await page.evaluate(
    () => new Date("2026-12-25T23:59:00").toISOString(),
  );
  tasks = await dbTasks(page);
  expect(
    tasks.find((t) => t.title === "Past deadline task v2")?.due_date,
  ).toBe(expected2);

  // Clearing the date stores null.
  await page
    .getByRole("button", { name: "Edit task Past deadline task v2" })
    .click();
  await page.getByRole("dialog").getByLabel(/^Due\ date\s*\*?$/).fill("");
  await expect(
    page.getByRole("dialog").getByText("Saving will clear the current deadline."),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save changes" })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  tasks = await dbTasks(page);
  expect(
    tasks.find((t) => t.title === "Past deadline task v2")?.due_date,
  ).toBeNull();
});

test("RC5: unparseable date input is blocked inline and never corrupts the deadline", async ({
  page,
}) => {
  await registerAndLandOnboarding(page);
  await completeOnboarding(page);
  await page.goto("/academics");
  await createTask(page, "Guarded task", "2026-10-10");

  const before = (await dbTasks(page)).find(
    (t) => t.title === "Guarded task",
  )?.due_date;
  expect(before).toBeTruthy();

  await page.getByRole("button", { name: "Edit task Guarded task" }).click();
  const dialog = page.getByRole("dialog");
  // Simulate exactly what the browser reports for unparseable keystrokes in
  // a native date input: an empty value with validity.badInput set.
  await dialog
    .getByLabel(/^Due\ date\s*\*?$/)
    .evaluate((el) => {
      const input = el as HTMLInputElement;
      Object.defineProperty(input, "validity", {
        value: { badInput: true },
        configurable: true,
      });
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )!.set!;
      nativeSetter.call(input, "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog.getByRole("alert")).toContainText("doesn’t look valid");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();

  // The stored deadline is untouched.
  const tasks = await dbTasks(page);
  expect(tasks.find((t) => t.title === "Guarded task")?.due_date).toBe(before);
});

test("RC1: write-ok + refresh-fail shows a sync warning (never false success); retry recovers", async ({
  page,
}) => {
  await registerAndLandOnboarding(page);
  await completeOnboarding(page);
  await page.goto("/academics");
  await createTask(page, "Baseline task");

  // Arm failure: workspace reads fail only AFTER the next successful write,
  // so the write provably succeeds while the follow-up refresh fails.
  await page.evaluate(() => {
    const w = window as unknown as {
      __failReads: boolean;
      __restoreStep9: () => void;
    };
    w.__failReads = false;
    const origSet = Storage.prototype.setItem;
    const origGet = Storage.prototype.getItem;
    Storage.prototype.setItem = function (k, v) {
      const result = origSet.call(this, k, v);
      if (String(k).startsWith("edunexus_db_")) w.__failReads = true;
      return result;
    };
    Storage.prototype.getItem = function (k) {
      if (w.__failReads && String(k).startsWith("edunexus_db_")) {
        throw new Error("step9 simulated read failure");
      }
      return origGet.call(this, k);
    };
    w.__restoreStep9 = () => {
      Storage.prototype.setItem = origSet;
      Storage.prototype.getItem = origGet;
    };
  });

  await createTask(page, "Written but stale task");

  const main = page.locator("main");
  await expect(
    main.getByText(/Saved, but some workspace data couldn’t be refreshed/),
  ).toBeVisible();
  // Honest staleness: the saved task is NOT shown as if everything were current.
  await expect(
    page.getByRole("button", { name: "Written but stale task", exact: true }),
  ).not.toBeVisible();

  // Restore + retry: the saved change appears and every banner clears.
  await page.evaluate(
    () =>
      (window as unknown as { __restoreStep9: () => void }).__restoreStep9(),
  );
  await main.getByRole("button", { name: "Retry" }).click();
  await expect(
    page.getByRole("button", { name: "Written but stale task", exact: true }),
  ).toBeVisible();
  await expect(
    main.getByText(/Saved, but some workspace data couldn’t be refreshed/),
  ).not.toBeVisible();
  await expect(main.getByText("Let’s try that again")).not.toBeVisible();
});

test("RC1: failed background refresh shows a retryable error; retry recovers cleanly", async ({
  page,
}) => {
  await registerAndLandOnboarding(page);
  await completeOnboarding(page);
  await page.goto("/academics");
  await createTask(page, "Durable task");
  await page.goto("/dashboard");

  await page.evaluate(() => {
    const w = window as unknown as { __restoreStep9: () => void };
    const origGet = Storage.prototype.getItem;
    Storage.prototype.getItem = function (k) {
      if (String(k).startsWith("edunexus_db_")) {
        throw new Error("step9 simulated read failure");
      }
      return origGet.call(this, k);
    };
    w.__restoreStep9 = () => {
      Storage.prototype.getItem = origGet;
    };
  });

  // A background (focus-triggered) refresh now fails across datasets.
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const main = page.locator("main");
  await expect(main.getByText("Let’s try that again")).toBeVisible();

  await page.evaluate(
    () =>
      (window as unknown as { __restoreStep9: () => void }).__restoreStep9(),
  );
  await main.getByRole("button", { name: "Try again" }).click();
  await expect(main.getByText("Let’s try that again")).not.toBeVisible();
  // Previously loaded data survived the failed round untouched.
  await expect(main.getByText("Durable task")).toBeVisible();
});

test("RC6: malformed AI payloads fail recoverably; retry returns the student-specific fallback", async ({
  page,
}) => {
  await registerAndLandOnboarding(page);
  await completeOnboarding(page);
  await page.goto("/academics");
  await createTask(page, "Submit the revision plan");
  await page.goto("/dashboard");

  // Wrong-shape JSON passes HTTP 200 but fails client validation.
  await page.route("**/api/recommend", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ bogus: true }),
    }),
  );
  await page
    .getByRole("button", { name: "Generate my study plan", exact: false })
    .click();
  await expect(page.getByText("A brief pause, not a setback.")).toBeVisible();

  // Malformed JSON body likewise recovers.
  await page.unroute("**/api/recommend");
  await page.route("**/api/recommend", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{oops",
    }),
  );
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByText("A brief pause, not a setback.")).toBeVisible();

  await page.unroute("**/api/recommend");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByText("Smart rules · No AI service used"),
  ).toBeVisible();
});
