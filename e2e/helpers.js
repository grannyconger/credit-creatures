// Shared steps for the smoke tests. Everything runs in ?local mode, which
// saves to localStorage (js/db-local.js), so no real student data is touched.
import { expect } from "@playwright/test";

const KEY = "credit-life:saves/local-student";

// Collects page errors and console errors, so a test can fail on any of them.
export function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    // A failed request is reported below with its URL instead.
    if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(`console: ${m.text()}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && r.url().startsWith("http://localhost")) errors.push(`${r.status()}: ${r.url().replace("http://localhost:8000", "")}`);
  });
  return errors;
}

// A clean browser with no saved game, the first-run settings pop-up skipped,
// and any extra localStorage entries.
export async function freshStart(page, extra = {}) {
  await page.goto("/?local");
  await page.evaluate((extra) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("credit-creatures:settingsAsked:local-student", "1");
    for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
  }, extra);
}

// Clicks Begin and the local sign-in, past the title cover.
// Waits for the title cover, then clicks Begin and the local sign-in until
// the cover is gone. (A returning student may go straight in.)
export async function enterGame(page) {
  await page.goto("/?local");
  await page.locator(".bst-title, #topbar:not([hidden]), .bestiary").first().waitFor({ timeout: 15_000 });
  for (let i = 0; i < 10 && (await page.locator(".bst-title").count()); i++) {
    const btn = page.locator(".bst-title button:visible").filter({ hasText: /sign in|begin|continue/i }).first();
    if (await btn.count()) await btn.click();
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(500);
}

// Closes any lesson or pop-up that's in the way.
export async function closePopups(page) {
  for (let i = 0; i < 8; i++) {
    const skip = page.locator(".tour button").filter({ hasText: /skip|got it|done|close/i }).first();
    const dialog = page.locator("dialog[open]").first();
    if (await skip.isVisible().catch(() => false)) await skip.click({ force: true, timeout: 3000 });
    else if (await dialog.isVisible().catch(() => false)) await dialog.locator("button").last().click({ force: true, timeout: 3000 });
    else break;
    await page.waitForTimeout(250);
  }
}

// A student who finished onboarding, with an older-style save so every place
// on the map is open (like the pilot students' saves).
export async function seededStudent(page) {
  const creature = { name: "Pebble", species: "lanternFox", palette: "ocean", accessories: {}, dream: "home" };
  await freshStart(page, {
    [KEY]: { creature, onboarding: { step: "done", firstName: "Test", lastName: "Student" }, chapter: 1 },
    "credit-life:users/local-student": { displayName: "Test Student", classId: "local-class" },
  });
  await page.evaluate(() => sessionStorage.setItem("credit-creatures:entered", "1"));
  await enterGame(page);
  await closePopups(page);
  await expect.poll(() => page.evaluate((k) => Boolean(JSON.parse(localStorage.getItem(k))?.play), KEY), { timeout: 15_000 }).toBe(true);
  // Unlock everything the way old saves are: drop the Phase 10 progression fields.
  await page.goto("/css/tokens.css");
  await page.evaluate((k) => {
    const s = JSON.parse(localStorage.getItem(k));
    delete s.play.progression;
    delete s.play.prologue;
    delete s.play.unlocksSeen;
    localStorage.setItem(k, JSON.stringify(s));
  }, KEY);
  await enterGame(page);
  await closePopups(page);
}

export async function open(page, route) {
  await page.evaluate((r) => (location.hash = `#/${r}`), route);
  await page.waitForTimeout(600);
  await closePopups(page);
}

// Gives the signed-in student a full Vault: money in checking and savings, a card
// with a balance, an auto loan, a couch loan, a student loan, a pay-later plan and a
// credit-builder loan. A fresh student has none of these, so those parts of the
// Vault never draw and the contrast audit can't see them. Reloads the game after.
export async function seedRichVault(page) {
  // Leave the game first: it saves its own state when the page is hidden, which would overwrite this.
  await page.goto("/css/tokens.css");
  await page.evaluate(async (k) => {
    const E = await import("/js/engine/index.js");
    const { openCard } = await import("/js/engine/accounts.js");
    const { copyLife } = await import("/js/engine/life.js");
    const save = JSON.parse(localStorage.getItem(k));
    let life = E.earn(save.life, 1200, "seeded pay").life;
    life = E.moveToSavings(life, 414).life;
    const next = copyLife(life);
    const a = openCard(next, { product: "student", name: "Student Card", issuer: "chase", network: "visa", icon: "🏛️", limit: 800, apr: 0.24, annualFee: 0 });
    life = E.cardPurchase(next, a.id, 180, "seeded purchase").life;
    life = E.openAutoLoan(life, { price: 4000, downPayment: 500, termMonths: 48 }).life;
    life = E.openPurchaseLoan(life, { item: "couch", price: 600, termMonths: 12 }).life;
    life = E.startSchool(life).life;
    life = E.buyWithBnpl(life, 80, "sneakers", "Market").life;
    life = E.openCreditBuilderLoan(life).life;
    localStorage.setItem(k, JSON.stringify({ ...save, life }));
  }, KEY);
  await page.goto("/?local");
  await enterGame(page);
  await closePopups(page);
}
