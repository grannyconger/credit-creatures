// A contrast audit for every screen and pop-up, in light and dark (teacher
// request 2026-10-23: text must be high contrast everywhere). Needs the local
// server running (python3 -m http.server 8000).
//
//   node e2e/contrast.js                 -> every route, both themes
//   node e2e/contrast.js garage --dark   -> one route, one theme
//
// Prints each failing text style once per route and theme, with the ratio, the
// colors and a sample. WCAG AA: 4.5 for normal text, 3 for large text.
import { chromium } from "@playwright/test";
import { seededStudent, seedRichVault, open, closePopups } from "./helpers.js";

const args = process.argv.slice(2);
const only = args.find((a) => !a.startsWith("--"));
const themes = args.includes("--dark") ? ["dark"] : args.includes("--light") ? ["light"] : ["light", "dark"];
const ROUTES = ["hub", "map", "month", "guild", "accounts", "shop", "academy", "cottage", "garage", "alley", "friends", "trophies", "leaderboard", "daily"];

// Runs in the page. Walks up from each text element to find what's behind it.
function audit(withGradients) {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return [0, 0, 0, 0];
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p[3] ?? 1];
  };
  const over = (top, bottom) => {
    const a = top[3] + bottom[3] * (1 - top[3]);
    if (!a) return [0, 0, 0, 0];
    return [0, 1, 2].map((i) => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a).concat(a);
  };
  const lum = ([r, g, b]) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const bgOf = (el) => {
    let acc = [0, 0, 0, 0];
    let unknown = false;
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const bg = parse(cs.backgroundColor);
      if (cs.backgroundImage !== "none" && !/url\(/.test(cs.backgroundImage) && /gradient/.test(cs.backgroundImage)) unknown = true;
      acc = over(acc, bg);
      if (acc[3] >= 0.99) break;
    }
    if (acc[3] < 0.99) acc = over(acc, [255, 255, 255, 1]);
    return { rgb: acc, unknown };
  };
  const sig = (el) => `${el.tagName.toLowerCase()}${[...el.classList].slice(0, 3).map((c) => "." + c).join("")}`;
  const out = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const text = t.nodeValue.trim();
    if (!text) continue;
    const el = t.parentElement;
    if (!el || ["SCRIPT", "STYLE"].includes(el.tagName) || el.closest("svg")) continue;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (cs.visibility === "hidden" || cs.display === "none" || r.width < 2 || r.height < 2) continue;
    let opacity = 1;
    for (let n = el; n; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
    if (opacity < 0.05) continue;
    const bg = bgOf(el);
    const fg = parse(cs.color);
    fg[3] *= opacity;
    const fgc = over(fg, bg.rgb);
    const L1 = lum(fgc);
    const L2 = lum(bg.rgb);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const px = parseFloat(cs.fontSize);
    const bold = Number(cs.fontWeight) >= 700;
    const need = px >= 24 || (px >= 18.66 && bold) ? 3 : 4.5;
    // A pattern or gradient behind the text hides its real color from this check, so it is left for a human.
    if (ratio >= need || (bg.unknown && !withGradients)) continue;
    const key = `${sig(el)}|${cs.color}|${bg.rgb.map(Math.round).join(",")}`;
    const o = out.get(key) || { sig: sig(el), ratio: Number(ratio.toFixed(2)), need, color: cs.color, bg: `rgb(${bg.rgb.slice(0, 3).map(Math.round)})`, unknown: bg.unknown, sample: text.slice(0, 40), count: 0 };
    o.count++;
    out.set(key, o);
  }
  return [...out.values()];
}

const browser = await chromium.launch({ channel: "chrome" });
const all = [];
for (const theme of themes) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, baseURL: "http://localhost:8000", colorScheme: theme });
  await seededStudent(page);
  const run = async (name, setup) => {
    try {
      await setup();
      await page.waitForTimeout(450);
      for (const f of await page.evaluate(audit, args.includes("--gradients"))) all.push({ theme, route: name, ...f });
    } catch (err) {
      console.log(`skipped ${name} (${theme}): ${err.message.split("\n")[0]}`);
    }
  };
  for (const r of ROUTES.filter((x) => !only || x === only)) {
    if (only === "arcade") break;
    await run(r, async () => {
      await open(page, r);
      await closePopups(page);
    });
  }
  // The Arcade needs a chapter running. Each game is audited at its start screen.
  if (!only || only === "arcade") {
    const NAMES = { billdrop: "Bill Drop", payin4: "Pay in 4", scorechase: "Score Chase", phish: "Phish Tank", grind: "The Grind", feed: "Feed Frenzy", rainy: "Rainy Day", dash: "Market Dash", lot: "The Lot", ledger: "Ledger Sort", cashier: "Cashier Rush", checks: "Check Writer", overdraft: "Spot the Overdraft", register: "Register Balancer", checkhunt: "Check Anatomy Hunt", drawer: "Count the Drawer", unitprice: "Unit Price Showdown", fees: "Fee Detective" };
    await run("arcade-start", async () => {
      await open(page, "hub");
      await closePopups(page);
      await page.click(".bst-seal-btn");
      await page.waitForTimeout(600);
      await closePopups(page);
      await open(page, "guild");
      await closePopups(page);
    });
    for (const [key, name] of Object.entries(NAMES)) {
      await run(`game-${key}`, async () => {
        if (await page.locator(".job-back").count()) {
          await page.click(".job-back");
          await page.locator(".job-leave-ask button", { hasText: "Leave" }).click();
        }
        await page.locator(".job-card", { hasText: name }).click();
        // GAME-SPECS.md games open the shared settings modal first: audit it, then start.
        if (await page.locator("dialog.arc-settings[open]").count()) {
          await page.waitForTimeout(250);
          await page.evaluate(audit, args.includes("--gradients")).then((fs) => fs.forEach((f) => all.push({ theme, route: `game-${key}-settings`, ...f })));
          await page.locator(".arc-opt", { hasText: "No timer" }).first().click().catch(() => {});
          await page.click(".arc-start");
          await page.waitForTimeout(300);
        }
      });
    }
  }
  // The pay sheet (a phone payment screen inside a decision card): choosing a card, and the receipt after.
  if (!only || only === "pay") {
    await run("pay-sheet", async () => {
      await page.evaluate(async () => {
        const E = await import("/js/engine/index.js");
        const { openCard } = await import("/js/engine/accounts.js");
        const { copyLife } = await import("/js/engine/life.js");
        const { decisionCard } = await import("/js/ui/decision-card.js");
        let life = E.earn(E.createLife({ seed: "contrast", ageMonths: 18 * 12 }), 400, "shift").life;
        const next = copyLife(life);
        openCard(next, { product: "student", name: "Student Card", issuer: "chase", network: "visa", icon: "🏛️", limit: 500, apr: 0.24, annualFee: 0 });
        openCard(next, { product: "student", name: "Rewards Card", issuer: "capitalOne", network: "mastercard", icon: "🏛️", limit: 100, apr: 0.27, annualFee: 0 });
        life = next;
        const choices = [{ key: "a", label: "Buy it", cost: { amount: 349, item: "Charger bundle", merchant: "Techtopia", methods: ["debit", "card", "bnpl"] } }, { key: "b", label: "Skip" }];
        const def = { id: "contrast", title: "Cracked phone", icon: "📱", group: "costs", text: () => ["Your phone cracked."] };
        const root = document.getElementById("app");
        root.replaceChildren();
        const wrap = document.createElement("div");
        wrap.className = "bestiary bst-month";
        root.append(wrap);
        wrap.append(decisionCard({ def, kind: "life", life, ctx: {}, choices, track: () => {}, payAllowed: ["debit", "card", "bnpl"], choose: async (key, method) => ({ ...E.resolveChoice(life, choices.find((c) => c.key === key), method), outcome: "Done." }), onContinue: () => {} }));
      });
      await page.locator(".dc-choice").first().click();
      await page.locator(".dc-submit").click();
      await page.locator(".ps-card", { hasText: "Student Card" }).click();
    });
    await run("pay-terminal", async () => {
      await page.locator(".pay-confirm").click();
      await page.locator(".ps-terminal.done").waitFor();
    });
    await run("pay-receipt", async () => {
      await page.locator(".dc-outcome").waitFor();
    });
  }
  // A math card: the bold question, the Hint pop-up and the calculator beside the choices.
  if (!only || only === "pay") {
    await run("card-hint", async () => {
      await page.evaluate(async () => {
        const E = await import("/js/engine/index.js");
        const { decisionCard } = await import("/js/ui/decision-card.js");
        const { SCENARIOS } = await import("/js/data/scenarios.js");
        const { ASKS } = await import("/js/data/card-asks.js");
        const { HINTS } = await import("/js/data/card-hints.js");
        const def = SCENARIOS.find((s) => s.id === "loanLetter");
        const life = E.earn(E.createLife({ seed: "hint", ageMonths: 18 * 12 }), 360, "shift").life;
        const choices = def.choices(life, { chapter: 3, seen: [] }).map((c) => ({ ...c, qol: 0 }));
        const root = document.getElementById("app");
        root.replaceChildren();
        const wrap = document.createElement("div");
        wrap.className = "bestiary bst-month";
        root.append(wrap);
        wrap.append(decisionCard({ def, kind: "decision", life, ctx: {}, choices, track: () => {}, ask: ASKS.loanLetter, hint: HINTS.loanLetter, qolNow: 50, choose: async () => ({ ok: true }), onContinue: () => {} }));
      });
      await page.click(".calc-toggle");
      await page.hover(".dc-hint-btn");
    });
  }
  if (!only) {
    await run("things-to-do", async () => {
      await open(page, "hub");
      await closePopups(page);
      await page.keyboard.press("t");
    });
    await page.keyboard.press("Escape");
    await run("stat-pop", async () => {
      await page.click('.stat-chip[data-stat="coins"]');
    });
    await page.keyboard.press("Escape");
    await run("settings", async () => {
      await page.click("#settings-btn");
    });
    await page.keyboard.press("Escape");
    await run("dock", async () => {
      await page.click("#dock-btn");
    });
    await page.keyboard.press("Escape");
    await run("challenges", async () => {
      await page.click(".challenge-toggle");
    });
    await run("decorate", async () => {
      await open(page, "hub");
      await closePopups(page);
      await page.click(".decorate-btn");
      await page.click('.slot-chip[data-slot="rug"]');
    });
    await run("bug-dialog", async () => {
      await open(page, "hub");
      await closePopups(page);
      await page.click(".bug-button");
    });
  }
  await page.close();
  // The Vault again with a full life (cards, loans, savings, a pay-later plan), since a
  // fresh student has none of those and their text never draws. Every tab is audited.
  if (!only || only === "accounts" || only === "vault") {
    const rich = await browser.newPage({ viewport: { width: 1440, height: 900 }, baseURL: "http://localhost:8000", colorScheme: theme });
    await seededStudent(rich);
    await seedRichVault(rich);
    const richRun = async (name, setup) => {
      try {
        await setup();
        await rich.waitForTimeout(450);
        for (const f of await rich.evaluate(audit, args.includes("--gradients"))) all.push({ theme, route: name, ...f });
      } catch (err) {
        console.log(`skipped ${name} (${theme}): ${err.message.split("\n")[0]}`);
      }
    };
    await richRun("vault-rich", async () => {
      await open(rich, "accounts");
      await closePopups(rich);
    });
    // Every tab, then every sub-tab inside it.
    const tabs = await rich.locator("nav.acct-tabs button").count();
    for (let i = 0; i < tabs; i++) {
      const label = (await rich.locator("nav.acct-tabs button").nth(i).innerText()).trim().replace(/\s+/g, " ");
      await richRun(`vault-${label}`, async () => {
        await rich.locator("nav.acct-tabs button").nth(i).click();
      });
      const subs = await rich.locator("nav.acct-subtabs button").count();
      for (let j = 0; j < subs; j++) {
        const sub = (await rich.locator("nav.acct-subtabs button").nth(j).innerText()).trim().replace(/\s+/g, " ");
        await richRun(`vault-${label}-${sub}`, async () => {
          await rich.locator("nav.acct-subtabs button").nth(j).click();
        });
      }
    }
    await rich.close();
  }
}
await browser.close();
// The same style on many routes prints once, with where it was seen.
const merged = new Map();
for (const f of all) {
  const k = `${f.theme}|${f.sig}|${f.color}|${f.bg}`;
  const m = merged.get(k) || { ...f, routes: [] };
  if (!m.routes.includes(f.route)) m.routes.push(f.route);
  merged.set(k, m);
}
const worst = [...merged.values()].sort((a, b) => a.ratio - b.ratio);
for (const f of worst) console.log(`${f.theme.padEnd(5)} ${String(f.ratio).padStart(5)} (need ${f.need}) ${f.sig} fg ${f.color} bg ${f.bg}${f.unknown ? " [gradient]" : ""} "${f.sample}" in ${f.routes.length > 4 ? `${f.routes.length} places` : f.routes.join(", ")}`);
console.log(`\n${worst.length} failing text styles (${all.length} before merging)`);
