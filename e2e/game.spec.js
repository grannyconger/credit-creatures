// The student game: a brand-new student gets from the title to Home, and an
// established student can open every screen without a page error.
import { test, expect } from "@playwright/test";
import { watchErrors, freshStart, enterGame, closePopups, seededStudent, open } from "./helpers.js";

test("a new student goes from the title to Home", async ({ page }) => {
  const errors = watchErrors(page);
  await freshStart(page);
  await enterGame(page);
  await closePopups(page);

  // The opening story: three pages.
  for (let i = 0; i < 2; i++) await page.getByRole("button", { name: "Turn the page" }).click();
  await page.getByRole("button", { name: /Meet your creature/ }).click();

  // The name bookplate.
  await page.locator("#first-name").fill("Avery");
  await page.locator("#last-name").fill("Lee");
  await page.getByRole("button", { name: /Write my name in/ }).click();

  // Adopt a creature.
  await page.locator("#creature-name").fill("Pip");
  await page.locator("form button[type=submit]").first().click();
  await closePopups(page);

  // Pick a dream, then join the class.
  await page.locator(".bst-packet").first().click();
  await page.locator("#class-code").fill("TEST01");
  await page.getByRole("button", { name: "Join the class" }).click();
  await closePopups(page);

  await expect(page).toHaveURL(/#\/hub/, { timeout: 15_000 });
  expect(errors).toEqual([]);
});

const SCREENS = ["hub", "map", "month", "guild", "accounts", "records", "shop", "academy", "cottage", "garage", "alley", "friends", "trophies", "leaderboard", "settings"];

test("every screen opens without an error", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  for (const route of SCREENS) {
    await open(page, route);
    await expect(page.locator("main#app"), `#/${route} should show something`).not.toBeEmpty();
  }
  expect(errors).toEqual([]);
});

test("the shell: status chips, shortcuts and Things To Do", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  await open(page, "hub");
  await expect(page.locator("#status li")).toHaveCount(3);
  await expect(page.locator("#shortcuts button")).toHaveCount(3);
  await page.keyboard.press("t");
  await expect(page.locator("dialog.things-dialog[open]")).toBeVisible();
  await page.locator(".thing-tile", { hasText: "Map" }).click();
  await expect(page).toHaveURL(/#\/map$/);
  await page.click('#shortcuts button[data-place="market"]');
  await expect(page).toHaveURL(/#\/shop$/);
  expect(errors).toEqual([]);
});
