// The student game: a brand-new student gets from the title to Home, and an
// established student can open every screen without a page error.
import { test, expect } from "@playwright/test";
import { watchErrors, freshStart, enterGame, closePopups, seededStudent, seedRichVault, open } from "./helpers.js";

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

const SCREENS = ["arena", "hub", "map", "month", "guild", "accounts", "records", "shop", "academy", "cottage", "garage", "alley", "friends", "trophies", "leaderboard", "settings", "daily"];

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
  await expect(page.locator(".room-object")).toHaveCount(11);
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

test("the closet opens the Wardrobe and the Map button opens the map", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  await open(page, "hub");
  await expect(page.locator("#dock-btn")).toHaveCount(0);
  await page.click('[data-object="closet"]');
  await expect(page).toHaveURL(/#\/creature$/);
  await open(page, "hub");
  await page.click("#map-btn");
  await expect(page).toHaveURL(/#\/map$/);
  await expect(page.locator("#map-btn")).toHaveAttribute("aria-current", "page");
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

test("Fee Detective: three cases with calls, actions and habits, then the results", async ({ page }) => {
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
  await page.locator(".arc-opt", { hasText: "No timer" }).click();
  await page.click(".arc-start");
  await page.fill(".fd2-skill input", "144");
  await page.keyboard.press("Enter");
  await page.locator(".fd2-skill .big").click();
  for (let i = 0; i < 30 && !(await page.locator(".arc-results").count()); i++) {
    if (await page.locator(".fd2-actions").count()) {
      const rows = page.locator(".fd2-row");
      for (let r = 0; r < (await rows.count()); r++) await rows.nth(r).locator(".fd2-act").last().click();
      if (await page.locator(".fd2-hab").count()) await page.locator(".fd2-hab").first().click();
      await page.locator(".fd2-actions > .big").click();
    } else if (await page.locator(".fd2-case").count()) {
      await page.locator(".arc-doc-line").first().click();
      await page.keyboard.press("f");
      await page.waitForTimeout(150);
      if (await page.locator(".fd2-case").count()) await page.keyboard.press("f");
    } else await page.locator(".fd2-body > .big").click();
    await page.waitForTimeout(150);
  }
  await expect(page.locator(".arc-results")).toBeVisible();
  await expect(page.locator(".fd2-reveal")).toContainText("would have cost your clients");
  expect(errors).toEqual([]);
});

test("Cashier Rush: settings, a Medium Chill round with a line and a short customer, then the drawer reveal", async ({ page }) => {
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
  await page.locator(".arc-opt", { hasText: "Medium" }).click();
  await page.locator(".arc-opt", { hasText: "Chill" }).click();
  await page.click(".arc-start");
  // The sale reads as a subtraction: what they hand you comes first. Medium has no pennies.
  const amounts = await page.locator(".cash-amounts .cash-amt small").allTextContents();
  expect(amounts[0]).toContain("They hand you");
  expect(amounts[1]).toContain("Charged");
  expect(await page.locator(".cash-drawer .cash-piece").count()).toBe(6);
  await expect(page.locator(".cr-line .cr-cust").first()).toBeVisible();
  await expect(page.locator(".cr-lesson")).toContainText("Count up");
  for (let i = 0; i < 12 && !(await page.locator(".cr-close").count()); i++) {
    if (await page.locator(".cr-prompt button").count()) {
      await page.keyboard.press("n");
      continue;
    }
    await page.locator(".cash-drawer .cash-piece").first().click();
    await page.locator(".cash-actions .big").click();
    await page.waitForTimeout(2300);
  }
  await page.keyboard.press("o");
  await expect(page.locator(".arc-results")).toBeVisible();
  await expect(page.locator(".cr-reveal")).toContainText("The drawer is");
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
  await page.locator(".job-card", { hasText: "Cashier Rush" }).click();
  await page.waitForSelector("dialog.arc-settings[open]");
  await page.keyboard.press("Escape");
  await expect.poll(() => page.locator(".arc-cab").count()).toBeGreaterThanOrEqual(9);
  // The Version 1 cabinets are retired (GAME-SPECS.md 4.1).
  await expect(page.locator(".job-card", { hasText: "Ledger Sort" })).toHaveCount(0);

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
  await expect(page.locator(".dc-outcome")).toContainText("$40");
  expect(errors).toEqual([]);
});

test("every card asks a bold question, math cards have a Hint and a calculator, and Tradeoffs show assets, liabilities and quality of life", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  await page.evaluate(async () => {
    const E = await import("/js/engine/index.js");
    const { decisionCard } = await import("/js/ui/decision-card.js");
    const { SCENARIOS } = await import("/js/data/scenarios.js");
    const { ASKS } = await import("/js/data/card-asks.js");
    const { HINTS } = await import("/js/data/card-hints.js");
    const { qolFor } = await import("/js/data/card-qol.js");
    window.__show = (id) => {
      const def = SCENARIOS.find((s) => s.id === id);
      const life = E.earn(E.createLife({ seed: "e2e-ask", ageMonths: 18 * 12 }), 360, "shift").life;
      const choices = def.choices(life, { chapter: 3, seen: [] }).map((c) => ({ ...c, qol: qolFor(id, c.key) ?? 0 }));
      const root = document.getElementById("app");
      root.replaceChildren();
      const wrap = document.createElement("div");
      wrap.className = "bestiary bst-month";
      root.append(wrap);
      wrap.append(decisionCard({ def, kind: "decision", life, ctx: { chapter: 3, seen: [] }, choices, track: () => {}, payAllowed: ["debit"], ask: ASKS[id], hint: HINTS[id] || null, qolNow: 50, choose: async (key, method) => { const c = choices.find((x) => x.key === key); const r = E.resolveChoice(life, c, method); return { ...r, outcome: "Done.", qol: c.qol, qolNow: 50 + c.qol }; }, onContinue: () => {} }));
    };
    window.__show("loanLetter");
  });
  // The question is bold, and the math card has a Hint and a calculator.
  await expect(page.locator(".dc-ask strong")).toHaveText("How much will you pay in total over the 12 months?");
  expect(await page.locator(".dc-ask strong").evaluate((e) => Number(getComputedStyle(e).fontWeight))).toBeGreaterThanOrEqual(700);
  await page.hover(".dc-hint-btn");
  await expect(page.locator(".dc-hint-pop")).toBeVisible();
  await expect(page.locator(".dc-hint-pop")).toContainText("monthly payment times the number of months");
  await expect(page.locator(".dc-hint-pop")).not.toContainText("1,056");
  await page.mouse.move(5, 5);
  await expect(page.locator(".dc-hint-pop")).toBeHidden();
  await page.click(".calc-toggle");
  await expect(page.locator(".decision-card .calc")).toBeVisible();
  await page.click(".calc-toggle");
  await expect(page.locator(".decision-card .calc")).toHaveCount(0);
  // A card with no math has the question but no Hint or calculator.
  await page.evaluate(() => window.__show("weekendPlans"));
  await expect(page.locator(".dc-ask strong")).toHaveText("What will you do this weekend?");
  await expect(page.locator(".dc-hint-btn")).toHaveCount(0);
  await page.locator(".dc-choice").first().click();
  await page.locator(".dc-submit").click();
  await page.locator(".pay-option:not([disabled])").first().click();
  await page.locator(".pay-confirm").click();
  // The Tradeoffs are three spectrums: assets, liabilities and quality of life.
  await expect(page.locator(".trade-col.chosen [data-metric='assets']")).toBeVisible({ timeout: 8000 });
  await expect(page.locator(".trade-col.chosen [data-metric='owed']")).toContainText("Liabilities");
  await expect(page.locator(".trade-col.chosen [data-metric='qol']")).toContainText("Quality of life");
  await expect(page.locator(".dc-qol")).toContainText("Quality of life +4");
  // Calm cards: one legend for the panel, bars for the parts, and no explaining words or "No change" lines.
  await expect(page.locator(".dc-tradeoffs .seg-legend")).toHaveCount(1);
  await expect(page.locator(".trade-col.chosen .seg-bar").first()).toBeVisible();
  await expect(page.locator(".dc-tradeoffs")).not.toContainText("No change");
  await expect(page.locator(".dc-tradeoffs")).not.toContainText("what you have");
  await expect(page.locator(".dc-tradeoffs")).not.toContainText("Best of these");
  await expect(page.locator(".trade-col.chosen [data-metric='assets'] .seg-bar")).toHaveAttribute("aria-label", /Assets: Checking/);
  expect(errors).toEqual([]);
});

test("the Vault is organised by money jobs: an Overview with assets, liabilities and net worth, tabs, and sub-tabs", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  await seedRichVault(page);
  await open(page, "accounts");
  await closePopups(page);
  // The landing page: assets, liabilities and net worth, with what each is made of.
  const tabs = (await page.locator("nav.acct-tabs button").allInnerTexts()).map((t) => t.replace(/\d+$/, "").trim());
  expect(tabs).toEqual(["Overview", "Pay Bills", "Save for Goals", "Manage Debt", "Build Credit", "Protect Yourself", "Messages"]);
  await expect(page.locator(".nw-card.assets .nw-total")).toHaveText("$1,185");
  await expect(page.locator(".nw-card.liabilities .nw-total")).toHaveText("$4,840");
  await expect(page.locator(".nw-card.networth .nw-total")).toContainText("3,655");
  await expect(page.locator(".nw-card.assets .seg-bar")).toHaveAttribute("aria-label", /Checking \$271, Savings \$414, Locked savings \$500/);
  // Each tab opens with something real, with no errors.
  for (const [tab, text] of [["Pay Bills", "Comes out of checking"], ["Save for Goals", "safety net"], ["Manage Debt", "Auto loan"], ["Protect Yourself", "Renter's insurance"], ["Messages", ""]]) {
    await page.locator("nav.acct-tabs button", { hasText: tab }).click();
    if (text) await expect(page.locator(".acct-body")).toContainText(text);
  }
  // Build Credit has sub-tabs, and the score and report moved here from the Hall of Records.
  await page.locator("nav.acct-tabs button", { hasText: "Build Credit" }).click();
  expect((await page.locator("nav.acct-subtabs button").allInnerTexts()).map((t) => t.trim())).toEqual(["Cards", "Statements", "My Score", "My Report"]);
  await page.locator("nav.acct-subtabs button", { hasText: "My Score" }).click();
  await expect(page.locator(".acct-body")).toContainText(/score/i);
  // The old Hall of Records link lands on the score.
  await open(page, "records");
  await expect(page).toHaveURL(/#\/accounts/);
  await expect(page.locator("nav.acct-subtabs button[aria-pressed='true']")).toHaveText("My Score");
  // Something that needs attention has a button to the tab that fixes it.
  await page.locator("nav.acct-tabs button", { hasText: "Overview" }).click();
  await expect(page.locator(".nw-attention")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Battle Arena: a computer bout costs Energy and the fee, plays rounds with the worked math, and records the result", async ({ page }) => {
  const errors = watchErrors(page);
  await seededStudent(page);
  await page.goto("/css/tokens.css");
  await page.evaluate(() => {
    const k = "credit-life:saves/local-student";
    const s = JSON.parse(localStorage.getItem(k));
    s.play.energy = 10;
    localStorage.setItem(k, JSON.stringify(s));
  });
  await enterGame(page);
  await closePopups(page);
  await open(page, "arena");
  await expect(page.locator(".arena-bot")).toHaveCount(3);
  await page.getByRole("button", { name: "Battle Pip" }).click();
  await expect(page.locator(".stat-chip[data-stat='energy'] strong")).toHaveText(/^8\//);
  for (let i = 0; i < 8 && !(await page.locator(".arena-over").count()); i++) {
    await page.locator("button.arena-move:not([disabled])").first().click();
    await expect(page.locator(".arena-q-prompt")).toBeVisible();
    if (i === 0) {
      // Every question has a calculator, and it stays open the next round.
      await page.locator(".arena-question .calc-toggle").click();
      await expect(page.locator(".arena-calc-slot .calc")).toBeFocused();
      await page.keyboard.type("12*3=");
      await expect(page.locator(".arena-calc-slot .calc-screen")).toHaveText("36");
    } else await expect(page.locator(".arena-calc-slot .calc")).toBeVisible();
    await page.locator("button.arena-choice").first().click();
    await expect(page.locator(".arena-math")).not.toBeEmpty();
    await page.locator("button.arena-next").click();
  }
  await expect(page.locator("dialog.battle-end .be-stats")).toContainText("Right answers");
  await page.locator("dialog.battle-end .bst-seal-btn").click();
  await expect(page.locator(".arena-over h2")).toHaveText(/won|lost|tie/i);
  await page.locator(".arena-over .bst-seal-btn").click();
  await expect(page.locator(".arena-tally")).toContainText("1");
  expect(errors).toEqual([]);
});
