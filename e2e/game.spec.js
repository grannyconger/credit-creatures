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

test("Home is the Cottage room: objects glow and lead places", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  await open(page, "hub");
  await expect(page.locator(".room-object")).toHaveCount(9);
  await page.hover('[data-object="window"]');
  await expect(page.locator('[data-object="window"] .room-tag')).toBeVisible();
  await page.click('[data-object="window"]');
  await expect(page).toHaveURL(/#\/map$/);
  await open(page, "hub");
  await page.click('[data-object="door"]');
  await expect(page.locator("dialog.things-dialog[open]")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the Dock holds owned pieces and puts them in the room", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  const KEY = "credit-life:saves/local-student";
  await page.goto("/css/tokens.css");
  await page.evaluate((k) => {
    const s = JSON.parse(localStorage.getItem(k));
    s.play.decorOwned = ["rug-gold"];
    s.play.owned = ["topHat"];
    localStorage.setItem(k, JSON.stringify(s));
  }, KEY);
  await enterGame(page);
  await open(page, "hub");
  await expect(page.locator(".dock-count")).toHaveText("2");
  await page.click("#dock-btn");
  await expect(page.locator(".dock-item")).toHaveCount(2);
  await page.locator(".dock-item", { hasText: "Round gold rug" }).click();
  await expect.poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k)).play.cottage?.rug, KEY)).toBe("rug-gold");
  await closePopups(page);
  await page.locator(".dock-item", { hasText: "Top hat" }).click();
  await expect.poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k)).creature.accessories?.head, KEY)).toBe("topHat");
  expect(errors).toEqual([]);
});
