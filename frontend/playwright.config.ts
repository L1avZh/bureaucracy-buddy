import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests exercise the real frontend against a real backend — no mock
 * server. They need the FastAPI backend from ../backend running at
 * http://localhost:8000 (see frontend/README.md). The Vite dev server is
 * started automatically below.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
