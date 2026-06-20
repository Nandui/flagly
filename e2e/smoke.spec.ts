import { test, expect, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

// Smoke + a11y gate against a seeded database. Override the seed credentials
// with E2E_EMAIL / E2E_PASSWORD if needed.
const EMAIL = process.env.E2E_EMAIL ?? "fernandoserina@leisureworldcork.com"
const PASSWORD = process.env.E2E_PASSWORD ?? "password123"

async function signIn(page: Page) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(EMAIL)
  await page.getByLabel("Password").fill(PASSWORD)
  await page.getByRole("button", { name: "Sign in" }).click()
  await page.waitForURL("**/flagly")
}

test("signs in and lands on the dashboard", async ({ page }) => {
  await signIn(page)
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
  await expect(page.getByText("Open incidents")).toBeVisible()
})

test("opens the incident list and the report form", async ({ page }) => {
  await signIn(page)

  await page.goto("/flagly/incidents")
  await expect(page.getByRole("heading", { name: "All incidents" })).toBeVisible()

  await page.goto("/flagly/incidents/new")
  await expect(
    page.getByRole("heading", { name: "Report an incident" })
  ).toBeVisible()
})

test("dashboard has no serious accessibility violations", async ({ page }) => {
  await signIn(page)
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze()
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical"
  )
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([])
})
