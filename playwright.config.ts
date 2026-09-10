import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testIgnore: /unit\/.*/,
  fullyParallel: false,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    actionTimeout: 10000,
    screenshot: "only-on-failure",
    launchOptions: {
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : {}),
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        // Extra flags used when running the npm-distributed Chromium inside a
        // constrained sandbox (no /dev/shm, no GPU). Harmless in normal CI.
        ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
          ? ["--disable-gpu"]
          : []),
      ],
    },
  },
  webServer: {
    command: "npm run dev",
    url: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
        colorScheme: "light",
      },
    },
  ],
});
