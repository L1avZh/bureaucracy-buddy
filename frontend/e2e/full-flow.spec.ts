import { test, expect } from "@playwright/test";

/**
 * End-to-end happy path: register -> onboarding -> create process -> add
 * task -> complete task -> search -> settings -> export.
 *
 * Requires the real backend running at http://localhost:8000 (see
 * frontend/README.md "Running E2E tests"). This suite does not stub the
 * network — it exercises the real frontend against the real API contract.
 */
test.describe("Bureaucracy Buddy core flow", () => {
  test("register, onboard, manage a process, search, and export data", async ({ page }) => {
    const uniqueEmail = `e2e-${Date.now()}@example.com`;

    // --- Register ---
    await page.goto("/register");
    await page.getByLabel("Display name").fill("E2E Tester");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Password").fill("a-very-secure-password");
    await page.getByRole("button", { name: "Create account" }).click();

    // --- Onboarding ---
    await expect(page).toHaveURL(/\/onboarding/);
    await page.getByLabel("Describe what you need to do").fill("Renew my passport");
    await page.getByRole("radio", { name: "Government" }).click();
    await page.getByRole("button", { name: "Suggest a checklist" }).click();

    await expect(page.getByRole("button", { name: "Create this process" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Create this process" }).click();

    // --- Lands on the new process's detail page ---
    await expect(page).toHaveURL(/\/processes\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // --- Add a task ---
    await page.getByRole("button", { name: "New task" }).click();
    await page.getByLabel("Title").fill("Book an appointment");
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("Book an appointment")).toBeVisible();

    // --- Complete the task ---
    const taskRow = page.getByRole("listitem").filter({ hasText: "Book an appointment" });
    await taskRow.getByRole("checkbox", { name: "Mark as complete" }).click();
    await expect(taskRow.getByRole("checkbox", { name: "Mark as incomplete" })).toBeVisible();

    // --- Search via the command palette ---
    await page.keyboard.press("Control+k");
    await page.getByPlaceholder("Search processes, tasks, documents…").fill("passport");
    await expect(page.getByText(/passport/i).first()).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");

    // --- Settings ---
    await page.goto("/settings");
    await expect(page.getByRole("tab", { name: "General" })).toBeVisible();
    await page.getByRole("tab", { name: "Data" }).click();

    // --- Export data ---
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export data (JSON)" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/bureaucracy-buddy-export-.*\.json/);
  });

  test("language preference survives a reload", async ({ page }) => {
    // Regression test: switching language from the header dropdown must
    // persist server-side (PATCH /users/me), not just update local state —
    // otherwise AuthBootstrap's session-restore silently reverts it to the
    // stale server value on the very next page load.
    const uniqueEmail = `e2e-locale-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel("Display name").fill("Locale Tester");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Password").fill("a-very-secure-password");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/onboarding/);
    await page.getByRole("button", { name: "Skip, I'll set things up myself" }).click();
    await expect(page).toHaveURL("/");

    await page.getByRole("button", { name: "Language" }).click();
    await page.getByRole("menuitem", { name: "עברית" }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "he");
  });
});
