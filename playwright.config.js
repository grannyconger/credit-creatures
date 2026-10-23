// End-to-end smoke tests (2026-10-23): open the real game in a headless
// browser, in ?local mode (no sign-in), and fail on any page error. Run with
// `npm run e2e`. Playwright is a development tool only, never shipped.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.spec.js",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:8000",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
  // Locally, use the Google Chrome already installed (no browser download).
  // On GitHub Actions, use Playwright's own Chromium (installed by the workflow).
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, ...(process.env.CI ? {} : { channel: "chrome" }) } }],
  webServer: {
    command: "python3 -m http.server 8000",
    url: "http://localhost:8000/",
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
