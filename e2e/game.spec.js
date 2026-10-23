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

const SCREENS = ["hub", "map", "month", "guild", "accounts", "records", "shop", "academy", "cottage", "garage", "alley", "friends", "trophies", "leaderboard", "settings", "daily"];

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
  await expect(page.locator("#status li").first()).toBeVisible();
  expect(await page.locator("#status li").count()).toBeGreaterThanOrEqual(3);
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
  await closePopups(page);
  await expect(page.locator(".room-object")).toHaveCount(10);
  await page.hover('[data-object="window"]');
  await expect(page.locator('[data-object="window"] .room-tag')).toBeVisible();
  await page.click('[data-object="window"]');
  await expect(page).toHaveURL(/#\/map$/);
  await open(page, "hub");
  await closePopups(page);
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

test("Daily Pick: one box a day, a streak, and challenges", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  await open(page, "hub");
  await expect(page.locator("#status li", { hasText: "Streak" })).toBeVisible();
  await page.click('[data-object="chest"]');
  await expect(page).toHaveURL(/#\/daily$/);
  await expect(page.locator("button.daily-box")).toHaveCount(3);
  await page.locator("button.daily-box").nth(0).click();
  await expect(page.locator("button.daily-box")).toHaveCount(0);
  await expect(page.locator(".daily-box.open.mine")).toHaveCount(1);
  await page.reload();
  await page.waitForTimeout(1200);
  await open(page, "daily");
  await expect(page.locator("button.daily-box")).toHaveCount(0);
  await expect(page.locator(".daily-box.open.mine")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("Decorate: change a slot, preview an unowned piece, and it saves", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  const KEY = "credit-life:saves/local-student";
  await page.goto("/css/tokens.css");
  await page.evaluate((k) => {
    const s = JSON.parse(localStorage.getItem(k));
    s.play.decorOwned = ["rug-gold"];
    localStorage.setItem(k, JSON.stringify(s));
  }, KEY);
  await enterGame(page);
  await open(page, "hub");
  await closePopups(page);
  await page.click(".decorate-btn");
  await expect(page.locator(".slot-chip")).toHaveCount(8);
  await page.click('.slot-chip[data-slot="rug"]');
  await page.locator(".piece", { hasText: "Plum oval rug" }).click();
  await expect(page.locator(".piece-preview")).toContainText("costs $40");
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).play.cottage?.rug ?? null, KEY)).toBe(null);
  await page.locator(".piece", { hasText: "Round gold rug" }).click();
  await expect.poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k)).play.cottage?.rug, KEY)).toBe("rug-gold");
  expect(errors).toEqual([]);
});

test("Fee Detective: a whole shift plays through and pays", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  await open(page, "hub");
  await closePopups(page);
  await page.click(".bst-seal-btn");
  await page.waitForTimeout(600);
  await closePopups(page);
  await open(page, "guild");
  await closePopups(page);
  await page.locator(".job-card", { hasText: "Fee Detective" }).click();
  for (let i = 0; i < 60 && !(await page.locator(".bst-seal-btn", { hasText: "Collect" }).count()); i++) {
    const option = page.locator(".fd-option:not([disabled])").first();
    if (await option.count()) await option.click();
    else await page.locator(".fd-stage button.big").first().click();
    await closePopups(page);
  }
  await expect(page.locator(".bst-seal-btn", { hasText: "Collect" })).toBeVisible();
  expect(errors).toEqual([]);
});
