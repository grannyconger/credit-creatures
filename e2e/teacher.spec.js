// The teacher page and /admin, in ?local mode with the browser's test save.
import { test, expect } from "@playwright/test";
import { watchErrors, seededStudent } from "./helpers.js";

test("the teacher page shows the class, the roster and the student panel", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  await page.goto("/teacher/?local");
  await expect(page.locator(".t-strip h1")).toHaveText("Local Test Class");
  await expect(page.locator("#t-roster-table tbody tr")).toHaveCount(1);

  for (const view of ["Standards", "Credit", "Game", "Progress"]) {
    await page.locator(".t-views button", { hasText: view }).click();
    await expect(page.locator(".t-views button", { hasText: view })).toHaveAttribute("aria-pressed", "true");
  }

  await page.locator("#t-roster-table tbody th button").first().click();
  await expect(page.locator("dialog.t-side")).toBeVisible();
  for (const tab of ["Reflections", "Decisions", "Credit", "Timeline", "Friends", "Overview"]) await page.locator(".t-side-tabs button", { hasText: tab }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog.t-side")).toHaveCount(0);

  await page.getByRole("button", { name: /Check who's saving/ }).click();
  await expect(page.locator(".t-watch")).toBeVisible();
  await page.getByRole("button", { name: /Stop the save watch/ }).click();
  expect(errors).toEqual([]);
});

test("projector mode fits the screen with no scrolling", async ({ page }) => {
  await seededStudent(page);
  for (const size of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(size);
    await page.goto("/teacher/?local");
    await page.getByRole("button", { name: /Projector mode/ }).click();
    const overflow = await page.locator("dialog.t-projector").evaluate((d) => [d, ...d.querySelectorAll("section")].some((x) => x.scrollHeight > x.clientHeight + 1));
    expect(overflow, `projector overflows at ${size.width}x${size.height}`).toBe(false);
  }
});

test("the admin page opens all three tabs", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  await page.goto("/admin/?local");
  await expect(page.locator(".t-strip h1")).toHaveText("Admin");
  for (const tab of ["Bug reports", "Tuning", "All classes"]) await page.locator(".t-tabs button", { hasText: tab }).click();
  expect(errors).toEqual([]);
});
