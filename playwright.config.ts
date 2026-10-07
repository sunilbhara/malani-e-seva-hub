import { defineConfig, devices } from "@playwright/test";

// End-to-end tests against the production build served by `vite preview`.
// The build uses `.env.e2e` (fake Supabase host); every backend call is answered by
// e2e/support/backend.ts, so the suite is deterministic and never touches real data.
const PORT = 4174;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  timeout: 45_000,
  // Generous waits: data loads compete with the build and other workers on small machines.
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Uses the installed Google Chrome; set PW_CHANNEL=chromium after `npx playwright install chromium`.
    channel: process.env.PW_CHANNEL ?? "chrome",
    locale: "hi-IN",
    timezoneId: "Asia/Kolkata",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], channel: process.env.PW_CHANNEL ?? "chrome" } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 }, channel: process.env.PW_CHANNEL ?? "chrome" } },
  ],
  webServer: {
    command: `npx vite build --mode e2e --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
