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
  for (let i = 0; i < 60 && !(await page.locator(".arc-collect").count()); i++) {
    const option = page.locator(".fd-option:not([disabled])").first();
    if (await option.count()) await option.click();
    else await page.locator(".fd-stage button.big").first().click();
    await closePopups(page);
  }
  await expect(page.locator(".arc-collect")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Cashier Rush: pick a difficulty and a Chill Round, serve 4 customers, then collect", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  await open(page, "hub");
  await closePopups(page);
  await page.click(".bst-seal-btn");
  await page.waitForTimeout(600);
  await closePopups(page);
  await open(page, "guild");
  await closePopups(page);
  await page.locator(".job-card", { hasText: "Cashier Rush" }).click();
  await page.locator(".cash-choice", { hasText: "Medium" }).click();
  await page.locator(".cash-choice", { hasText: "Chill Round" }).click();
  await page.click(".cash-setup .big");
  // The sale reads as a subtraction: what they hand you comes first. Coins are above bills, small to big.
  const amounts = await page.locator(".cash-amounts .cash-amt small").allTextContents();
  expect(amounts[0]).toContain("They hand you");
  expect(amounts[1]).toContain("Charged");
  // Medium is bills and coins with no pennies: coins on top, small to big, then the bills.
  expect(await page.locator(".cash-drawer .drawer-row.coins .cash-piece").allTextContents()).toEqual(["5¢nickel1", "10¢dime2", "25¢quarter3"]);
  expect(await page.locator(".cash-drawer .cash-piece").count()).toBe(6);
  for (let i = 0; i < 4; i++) {
    await page.locator(".cash-drawer .cash-piece").first().click();
    await page.locator(".cash-actions .big").click();
    await page.waitForTimeout(1100);
  }
  await closePopups(page);
  await expect(page.locator(".arc-collect")).toBeVisible();
  expect(errors).toEqual([]);
});


test("the top bar numbers explain themselves, and settings is a pop-up that keeps your place", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  await open(page, "garage");
  await closePopups(page);
  await page.click('.stat-chip[data-stat="coins"]');
  await expect(page.locator("#stat-pop")).toContainText("What it is");
  await page.keyboard.press("Escape");
  await page.click("#settings-btn");
  await expect(page.locator("dialog.settings-dialog[open]")).toBeVisible();
  await page.locator("dialog.settings-dialog .chip", { hasText: "Dark" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-appearance", "dark");
  await page.locator("dialog.settings-dialog .settings-done button").click();
  await expect(page).toHaveURL(/#\/garage$/);
  expect(errors).toEqual([]);
});

test("Things To Do groups every place, each in its own color", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  await open(page, "hub");
  await closePopups(page);
  await page.keyboard.press("t");
  await expect(page.locator(".thing-group")).toHaveCount(4);
  const hues = await page.locator(".thing-tile").evaluateAll((els) => [...new Set(els.map((e) => getComputedStyle(e.querySelector(".thing-medal")).backgroundImage))]);
  expect(hues.length).toBeGreaterThanOrEqual(10);
  expect(errors).toEqual([]);
});

test("you can leave a game for the Arcade library, and a life card shows its choices side by side", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  await open(page, "hub");
  await closePopups(page);
  await page.click(".bst-seal-btn");
  await page.waitForTimeout(600);
  await closePopups(page);
  await open(page, "guild");
  await closePopups(page);
  await page.locator(".job-card", { hasText: "Ledger Sort" }).click();
  await page.click(".job-back");
  await page.locator(".job-leave-ask button", { hasText: "Leave" }).click();
  await expect(page.locator(".arc-cab")).toHaveCount(9);

  await page.evaluate(async () => {
    const E = await import("/js/engine/index.js");
    const { decisionCard } = await import("/js/ui/decision-card.js");
    let life = E.createLife({ seed: "e2e", ageMonths: 18 * 12 });
    life = E.earn(life, 900, "shift").life;
    const choices = [
      { key: "a", label: "Buy the new phone", cost: { amount: 650, item: "phone", methods: ["debit"] } },
      { key: "b", label: "Keep the old one" },
    ];
    const def = { id: "e2e", title: "Cracked phone", icon: "📱", group: "costs", text: () => ["Your phone cracked."] };
    const root = document.getElementById("app");
    root.replaceChildren();
    const wrap = document.createElement("div");
    wrap.className = "bestiary bst-month";
    root.append(wrap);
    wrap.append(
      decisionCard({ def, kind: "life", life, ctx: {}, choices, track: () => {}, payAllowed: ["debit"], choose: async (key, method) => ({ ...E.resolveChoice(life, choices.find((c) => c.key === key), method), outcome: "Done." }), onContinue: () => {} })
    );
  });
  await expect(page.locator(".dc-balance")).toContainText("$900");
  await page.locator(".dc-choice").first().click();
  await page.locator(".dc-submit").click();
  await page.locator("button.pay-option:not([disabled])").first().click();
  const confirm = page.locator(".pay-confirm");
  if (await confirm.count()) await confirm.click();
  await expect(page.locator(".trade-col")).toHaveCount(2);
  await expect(page.locator(".trade-col.chosen")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("the pay screen is a phone payment sheet: pick a card, hold near the reader, payment complete, then the receipt", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  await page.evaluate(async () => {
    const E = await import("/js/engine/index.js");
    const { openCard } = await import("/js/engine/accounts.js");
    const { copyLife } = await import("/js/engine/life.js");
    const { decisionCard } = await import("/js/ui/decision-card.js");
    let life = E.earn(E.createLife({ seed: "e2e-pay", ageMonths: 18 * 12 }), 400, "shift").life;
    const next = copyLife(life);
    openCard(next, { product: "student", name: "Student Card", issuer: "chase", network: "visa", icon: "🏛️", limit: 500, apr: 0.24, annualFee: 0 });
    life = next;
    const choices = [
      { key: "a", label: "Buy the case", cost: { amount: 40, item: "Phone case", merchant: "Techtopia", methods: ["debit", "card", "bnpl"] } },
      { key: "b", label: "Skip it" },
    ];
    const def = { id: "e2e-pay", title: "Cracked phone", icon: "📱", group: "costs", text: () => ["Your phone cracked."] };
    const root = document.getElementById("app");
    root.replaceChildren();
    const wrap = document.createElement("div");
    wrap.className = "bestiary bst-month";
    root.append(wrap);
    wrap.append(decisionCard({ def, kind: "life", life, ctx: {}, choices, track: () => {}, payAllowed: ["debit", "card", "bnpl"], choose: async (key, method) => ({ ...E.resolveChoice(life, choices.find((c) => c.key === key), method), outcome: "Done." }), onContinue: () => {} }));
  });
  await page.locator(".dc-choice").first().click();
  await page.locator(".dc-submit").click();
  // The sheet names who is paid and how much, and draws the wallet's cards.
  await expect(page.locator(".ps-merchant")).toContainText("Techtopia");
  await expect(page.locator(".ps-amount")).toHaveText("$40");
  await expect(page.locator(".ps-card")).toHaveCount(3);
  await expect(page.locator(".ps-card .card-art")).toHaveCount(2);
  // Nothing is paid until a card is picked and Pay is pressed.
  await expect(page.locator(".pay-confirm")).toBeDisabled();
  await page.locator(".ps-card", { hasText: "Student Card" }).click();
  await expect(page.locator(".ps-detail")).toContainText("Utilization");
  await page.locator(".pay-confirm").click();
  await expect(page.locator(".ps-terminal")).toContainText("Hold near reader");
  await expect(page.locator(".ps-terminal.done")).toContainText("Payment complete");
  await expect(page.locator(".dc-receipt")).toContainText("Paid $40 with Student Card");
  expect(errors).toEqual([]);
});
