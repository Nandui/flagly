import { defineConfig, devices } from "@playwright/test"

// E2E smoke + accessibility gate.
//
// Requires a production build and a seeded database before running:
//   npm run build && npm run db:seed
//   npx playwright install chromium   # one-time, needs network egress to the
//                                     # Playwright CDN (blocked in some sandboxes)
//   npm run test:e2e
const PORT = Number(process.env.PORT ?? 3100)
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
