// Layout audit: visits every screen, tab, pop-up, Arcade game, Arena state,
// onboarding step and the teacher and admin pages, and reports what a student
// would trip over: text or controls on top of each other, text cut off by its
// box, content off the side of the screen, a page that scrolls sideways, and
// content stuck under the fixed top or bottom bar. Runs in standard and
// dyslexia reading modes (dyslexia makes text and controls much bigger).
// Needs the local server (python3 -m http.server 8000).
//
//   node e2e/layout-audit.js                          -> every size and mode
//   node e2e/layout-audit.js --sizes 1366x768 --modes dyslexia
//   node e2e/layout-audit.js --only arena,shop        -> states whose name has these words
//   node e2e/layout-audit.js --shots                  -> a screenshot of every state, not just flagged ones
//
// Report: test-results/audit/report.txt. Screenshots: test-results/audit/*.png.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { seededStudent, seedRichVault, open, closePopups, enterGame, freshStart, watchErrors } from "./helpers.js";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const SIZES = opt("sizes", "1440x900,1366x768,1280x720").split(",").map((s) => s.split("x").map(Number));
const MODES = opt("modes", "standard,dyslexia").split(",");
const ONLY = opt("only", "").split(",").filter(Boolean);
const ALL_SHOTS = args.includes("--shots");
const OUT = opt("out", "test-results/audit/");
mkdirSync(OUT, { recursive: true });

const SETTINGS_KEY = "credit-creatures:settings";
const SAVE_KEY = "credit-life:saves/local-student";

// ---------- What the page is checked for (runs in the browser) ----------
function detect(where = "only") {
  const vw = innerWidth;
  const vh = innerHeight;
  const out = [];
  const label = (el) => {
    let s = el.tagName.toLowerCase();
    const c = [...el.classList].slice(0, 2).join(".");
    if (c) s += `.${c}`;
    const t = (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 34);
    return t ? `${s} "${t}"` : s;
  };
  const docW = document.documentElement.scrollWidth;
  if (docW > vw + 1) out.push({ type: "page scrolls sideways", a: `${docW}px wide in a ${vw}px window` });

  const fixedOf = new Map();
  const fixedRoot = (el) => {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      if (fixedOf.has(e)) return fixedOf.get(e);
      const p = getComputedStyle(e).position;
      if (p === "fixed" || p === "sticky") {
        fixedOf.set(e, e);
        return e;
      }
    }
    return null;
  };
  // The part of a text box you can actually see: boxes that hide their overflow
  // (an ellipsis, a visually hidden label) cut it. Returns null if nothing shows.
  const clipCache = new Map();
  const clips = (el) => {
    if (clipCache.has(el)) return clipCache.get(el);
    const list = [];
    for (let a = el; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX !== "visible" || cs.overflowY !== "visible" || (cs.clip && cs.clip !== "auto") || cs.clipPath !== "none") list.push(a.getBoundingClientRect());
    }
    clipCache.set(el, list);
    return list;
  };
  const seenPart = (r, el) => {
    let { left, top, right, bottom } = r;
    for (const c of clips(el)) {
      left = Math.max(left, c.left);
      top = Math.max(top, c.top);
      right = Math.min(right, c.right);
      bottom = Math.min(bottom, c.bottom);
    }
    return right - left > 1 && bottom - top > 1 ? { left, top, right, bottom, width: right - left, height: bottom - top } : null;
  };
  const modal = [...document.querySelectorAll("dialog[open]")].filter((d) => d.matches(":modal")).pop();
  // An open pop-up (the Wallet, a stat explainer) sits over the page on purpose,
  // so only what's inside it is checked.
  const pop = [...document.querySelectorAll(":popover-open, #stat-pop:not([hidden])")].pop();
  const scope = modal || pop || document.body;
  const CTL = "button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], summary";
  const items = [];
  for (const el of scope.querySelectorAll("*")) {
    // aria-hidden text is still on screen, so it counts. Only drawings and screen-reader-only text don't.
    if (el.closest("svg, .sr-only, .visually-hidden, script, style, template, .toast, #toasts, .fx-particles")) continue;
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const ctl = el.matches(CTL);
    if (!ctl && el.parentElement?.closest(CTL)) continue;
    let rects = [];
    if (ctl) {
      const b = el.getBoundingClientRect();
      if (b.width > 2 && b.height > 2) rects = [b];
      // Text that spills out of its control counts too.
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent.trim() || n.parentElement.closest("svg, .sr-only")) continue;
        const r = document.createRange();
        r.selectNodeContents(n);
        for (const raw of r.getClientRects()) {
          const x = seenPart(raw, n.parentElement);
          // Words cut off inside the button itself (not a 1px visually hidden label, not an ellipsis).
          // Only boxes inside the button count here. A scrolling card around it is fine.
          let own = raw;
          for (let a = n.parentElement; a && a !== el.parentElement; a = a.parentElement) {
            const cs = getComputedStyle(a);
            if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
            const c = a.getBoundingClientRect();
            if (c.width <= 2 || c.height <= 2) {
              own = null;
              break;
            }
            own = { left: Math.max(own.left, c.left), top: Math.max(own.top, c.top), right: Math.min(own.right, c.right), bottom: Math.min(own.bottom, c.bottom) };
          }
          const ellipsis = getComputedStyle(n.parentElement).textOverflow === "ellipsis";
          if (own && !ellipsis && (own.right - own.left < 1 || own.bottom - own.top < 1 || raw.bottom - own.bottom > 3 || own.top - raw.top > 3 || raw.right - own.right > 3 || own.left - raw.left > 3)) out.push({ type: "cut off inside a button", a: label(el), b: n.textContent.trim().slice(0, 30) });
          if (x && (x.left < b.left - 2 || x.right > b.right + 2 || x.top < b.top - 2 || x.bottom > b.bottom + 2)) rects.push(x);
        }
      }
    } else {
      for (const n of el.childNodes) {
        if (n.nodeType !== 3 || !n.textContent.trim()) continue;
        const r = document.createRange();
        r.selectNodeContents(n);
        for (const x of r.getClientRects()) if (x.width > 1 && x.height > 1) rects.push(x);
      }
    }
    // rects: where the text is laid out (to find text cut off). seen: what shows (for overlaps).
    const seen = ctl ? rects : rects.map((x) => seenPart(x, el)).filter(Boolean);
    if (rects.length) items.push({ el, rects, seen, fixed: fixedRoot(el) });
  }

  const scrollable = /(auto|scroll)/;
  for (const it of items) {
    // Cut off by a box that hides its overflow.
    for (let a = it.el.parentElement; a && a !== document.documentElement && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
      const ar = a.getBoundingClientRect();
      // A visually hidden label (a 1px box) is hidden on purpose.
      if (ar.width <= 2 || ar.height <= 2) break;
      const bad = it.rects.some((r) => (!scrollable.test(cs.overflowX) && (r.left < ar.left - 2 || r.right > ar.right + 2)) || (!scrollable.test(cs.overflowY) && (r.top < ar.top - 2 || r.bottom > ar.bottom + 2)));
      if (bad) {
        out.push({ type: "cut off", a: label(it.el), b: label(a) });
        break;
      }
      if (scrollable.test(cs.overflowX) || scrollable.test(cs.overflowY)) break;
    }
    const cs = getComputedStyle(it.el);
    if ((cs.textOverflow === "ellipsis" || cs.overflowX === "hidden" || cs.overflowX === "clip") && it.el.scrollWidth > it.el.clientWidth + 2) out.push({ type: "truncated", a: label(it.el) });
    if (it.seen.some((r) => r.right > vw + 1 || r.left < -1)) out.push({ type: "off the side", a: label(it.el) });
  }

  // On top of each other.
  // Text line boxes are taller than the letters (OpenDyslexic most of all), so
  // neighbouring lines can touch without the letters touching. Count an overlap
  // only when it covers over a third of the shorter box.
  const hit = (a, b) => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 3 && h > 3 && h > 0.35 * Math.min(a.height, b.height);
  };
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const A = items[i];
      const B = items[j];
      if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
      let found = null;
      for (const ra of A.seen) {
        for (const rb of B.seen) if (hit(ra, rb)) found = [ra, rb];
        if (found) break;
      }
      if (!found) continue;
      const [ra, rb] = found;
      const x = (Math.max(ra.left, rb.left) + Math.min(ra.right, rb.right)) / 2;
      const y = (Math.max(ra.top, rb.top) + Math.min(ra.bottom, rb.bottom)) / 2;
      const top = document.elementFromPoint(x, y);
      const onTop = top && (A.el.contains(top) || top.contains(A.el)) ? "first on top" : top && (B.el.contains(top) || top.contains(B.el)) ? "second on top" : "";
      // Content slides under the fixed bars while scrolling, which is fine. It is a
      // problem only where it can't scroll out: under the top bar at the top of the
      // page, under the bottom bar (or Bugs?) at the bottom, or on a page that doesn't scroll.
      // Two different fixed or sticky layers (a sticky column under the top bar)
      // slide past each other while scrolling, like content under a bar.
      const bar = A.fixed !== B.fixed;
      if (bar && where !== "only") {
        const isBar = (x) => x && (x.id === "topbar" || x.id === "bottombar" || getComputedStyle(x).position === "fixed");
        const f = (isBar(A.fixed) ? A.fixed : isBar(B.fixed) ? B.fixed : A.fixed || B.fixed).getBoundingClientRect();
        const upper = f.top + f.height / 2 < vh / 2;
        if ((where === "top") !== upper) continue;
      }
      out.push({ type: bar ? "under a fixed bar" : "overlap", a: label(A.el), b: label(B.el), note: onTop });
    }
  }
  const seen = new Set();
  return out.filter((o) => {
    const k = `${o.type}|${o.a}|${o.b || ""}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ---------- One run: a size and a reading mode ----------
const report = [];
const errorsAll = [];

async function setMode(page, mode) {
  await page.goto("/css/tokens.css");
  await page.evaluate(
    ({ mode, SETTINGS_KEY, SAVE_KEY }) => {
      const s = { ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}), reading: mode, motion: "calm", appearance: "light" };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
      const save = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (save?.play) {
        save.play.settings = { ...(save.play.settings || {}), reading: mode, motion: "calm", appearance: "light" };
        save.play.energy = 10;
        localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      }
    },
    { mode, SETTINGS_KEY, SAVE_KEY }
  );
  await enterGame(page);
  await closePopups(page);
}

function runner(page, tag, mode) {
  return async function check(name) {
    if (ONLY.length && !ONLY.some((w) => name.includes(w))) return;
    await page.waitForTimeout(450);
    const reading = await page.evaluate(() => document.documentElement.dataset.reading || "standard");
    if (reading !== mode) report.push({ tag, name, type: "mode not applied", a: `wanted ${mode}, page is ${reading}` });
    const found = [];
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(120);
    // With a card open the page behind can't scroll, so only the card is checked.
    const scrolls = await page.evaluate(() => !document.querySelector("dialog[open]:modal") && document.documentElement.scrollHeight > innerHeight + 4);
    found.push(...(await page.evaluate(detect, scrolls ? "top" : "only")).map((x) => ({ ...x, where: "top" })));
    // An open card that scrolls inside itself (an Arcade settings card) is checked at its end too.
    const inner = await page.evaluate(() => {
      const d = [...document.querySelectorAll("dialog[open]")].pop();
      if (!d || d.scrollHeight <= d.clientHeight + 4) return false;
      d.scrollTop = d.scrollHeight;
      return true;
    });
    if (inner) {
      await page.waitForTimeout(150);
      const end = (await page.evaluate(detect, "only")).filter((x) => !found.some((f) => f.type === x.type && f.a === x.a && f.b === x.b));
      found.push(...end.map((x) => ({ ...x, where: "card end" })));
      if (found.length || ALL_SHOTS) await page.screenshot({ path: `${OUT}${tag}-${name.replace(/[^a-z0-9]+/gi, "_")}-card-end.png` });
      await page.evaluate(() => ([...document.querySelectorAll("dialog[open]")].pop().scrollTop = 0));
    }
    if (scrolls) {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(150);
      const bottom = (await page.evaluate(detect, "bottom")).filter((x) => !found.some((f) => f.type === x.type && f.a === x.a && f.b === x.b));
      found.push(...bottom.map((x) => ({ ...x, where: "bottom" })));
    }
    for (const f of found) report.push({ tag, name, ...f });
    const file = `${tag}-${name.replace(/[^a-z0-9]+/gi, "_")}`;
    if (found.length || ALL_SHOTS) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${OUT}${file}.png` });
      if (scrolls) {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.screenshot({ path: `${OUT}${file}-bottom.png` });
      }
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    process.stdout.write(found.length ? "x" : ".");
  };
}

// Runs one step. A click that times out (often because something covers the
// button) is a finding too, and the audit carries on.
async function step(tag, name, fn) {
  try {
    await fn();
  } catch (err) {
    report.push({ tag, name, type: "step failed", a: String(err.message || err).split("\n").find((l) => /intercepts|Timeout|not visible|outside/.test(l))?.trim() || String(err.message).split("\n")[0] });
    process.stdout.write("!");
  }
}

const want = (name) => !ONLY.length || ONLY.some((w) => name.includes(w));

async function eachButton(page, selector, check, prefix, after = null) {
  const n = await page.locator(selector).count();
  for (let i = 0; i < n; i++) {
    const b = page.locator(selector).nth(i);
    const text = ((await b.innerText().catch(() => "")) || `${i}`).trim().replace(/\s+/g, " ").slice(0, 24);
    await b.click().catch(() => {});
    await page.waitForTimeout(300);
    await check(`${prefix}:${text}`);
    if (after) await after(text);
  }
}

async function studentRun(browser, [w, h], mode) {
  const tag = `${w}x${h}-${mode}`;
  const page = await browser.newPage({ viewport: { width: w, height: h }, baseURL: "http://localhost:8000" });
  const errors = watchErrors(page);
  page.setDefaultTimeout(5000);
  const check = runner(page, tag, mode);
  const S = (name, fn) => step(tag, name, fn);
  await seededStudent(page);
  await seedRichVault(page);
  await setMode(page, mode);

  for (const r of ["hub", "map", "guild", "accounts", "records", "shop", "academy", "cottage", "garage", "alley", "friends", "trophies", "leaderboard", "daily", "arena", "creature", "dream", "profile"]) {
    if (!want(`screen:${r}`) && !want(r)) continue;
    await S(`screen:${r}`, async () => {
      await open(page, r);
      await closePopups(page);
      await check(`screen:${r}`);
    });
  }

  if (want("vault") || want("accounts")) await S("vault", async () => {
    await open(page, "accounts");
    await closePopups(page);
    const tabs = await page.locator("nav.acct-tabs button").count();
    for (let t = 0; t < tabs; t++) {
      const tb = page.locator("nav.acct-tabs button").nth(t);
      const tname = (await tb.innerText()).trim().slice(0, 20);
      await tb.click();
      await page.waitForTimeout(300);
      await closePopups(page);
      await check(`vault:${tname}`);
      const subs = await page.locator(".acct-subtabs button").count();
      for (let s = 1; s < subs; s++) {
        const sb = page.locator(".acct-subtabs button").nth(s);
        const sname = (await sb.innerText()).trim().slice(0, 20);
        await sb.click();
        await page.waitForTimeout(300);
        await check(`vault:${tname}:${sname}`);
      }
    }
  });
  for (const [r, sel] of [["shop", ".bst-shop [role=tab]"], ["friends", ".friends [data-tab]"], ["creature", "button.bst-tab"]]) {
    if (!want(r)) continue;
    await S(`${r} tabs`, async () => {
      await open(page, r);
      await closePopups(page);
      await eachButton(page, sel, check, r);
    });
  }

  // Pop-ups from the shell.
  if (want("popup")) {
    await S("popup:Things To Do", async () => {
      await open(page, "hub");
      await closePopups(page);
      await page.keyboard.press("t");
      await check("popup:Things To Do");
      await page.keyboard.press("Escape");
    });
    const chips = await page.locator(".stat-chip").count();
    for (let i = 0; i < chips; i++) {
      await S(`popup:stat ${i}`, async () => {
        await page.locator(".stat-chip").nth(i).click();
        await check(`popup:stat ${i}`);
      });
      await page.keyboard.press("Escape");
    }
    await S("popup:settings", async () => {
      await page.click("#settings-btn");
      await check("popup:settings");
    });
    await page.keyboard.press("Escape");
    for (const name of [/Wallet/, /Dock/, /Today/, /Bugs/]) {
      await S(`popup:${name.source}`, async () => {
        const b = page.getByRole("button", { name }).first();
        if (!(await b.count())) return;
        await b.click();
        await check(`popup:${name.source}`);
      });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }
  }

  // The Arena: how it works, then a computer bout from start to end.
  if (want("arena")) await S("arena bout", async () => {
    await open(page, "arena");
    await page.locator(".arena-how summary").click();
    await check("arena:how it works");
    await page.locator(".arena-bot button").first().click();
    await check("arena:pick");
    for (let t = 0; t < 8 && !(await page.locator(".arena-over").count()); t++) {
      await page.locator("button.arena-move:not([disabled])").first().click();
      if (t === 0) await check("arena:question");
      await page.locator("button.arena-choice").nth(t % 2).click();
      if (t < 2) await check(`arena:reveal ${t + 1}`);
      await page.locator("button.arena-next").click();
    }
    await check("arena:over");
    await page.locator(".arena-over .bst-seal-btn").click();
    await check("arena:lobby after");
  });

  // Town Hall: start the chapter, then a card and its outcome.
  if (want("month")) await S("month", async () => {
    await open(page, "hub");
    await closePopups(page);
    const seal = page.locator(".bst-seal-btn").first();
    if (await seal.count()) await seal.click().catch(() => {});
    await page.waitForTimeout(600);
    await closePopups(page);
    await open(page, "month");
    await closePopups(page);
    await check("month:start");
    for (let k = 0; k < 3; k++) {
      const choice = page.locator(".dc-choice").first();
      if (!(await choice.count())) break;
      await choice.click();
      await check(`month:card ${k + 1}`);
      const submit = page.locator(".dc-submit");
      if (await submit.count()) await submit.click().catch(() => {});
      await page.waitForTimeout(500);
      const pay = page.locator("button.pay-option:not([disabled])").first();
      if (await pay.count()) {
        await check(`month:pay ${k + 1}`);
        await pay.click().catch(() => {});
        const confirm = page.locator(".pay-confirm");
        if (await confirm.count()) await confirm.click().catch(() => {});
        await page.waitForTimeout(2500);
      }
      await check(`month:outcome ${k + 1}`);
      const cont = page.getByRole("button", { name: /continue|next/i }).first();
      if (await cont.count()) await cont.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  });
  // (After Town Hall: the Arcade is open only while a chapter is going.)
  // Every Arcade game: the settings card, then the first moments of a shift.
  if (want("arcade")) {
    await open(page, "guild");
    await closePopups(page);
    const n = await page.locator(".arc-cab-front").count();
    for (let i = 0; i < n; i++) await S(`arcade ${i}`, async () => {
      await page.goto("/?local#/guild");
      await enterGame(page);
      await open(page, "guild");
      await closePopups(page);
      const cab = page.locator(".arc-cab-front").nth(i);
      const title = ((await cab.locator("strong").first().innerText().catch(() => "")) || `game ${i}`).trim();
      await cab.click();
      const settings = page.locator("dialog.arc-settings[open]");
      await page.waitForTimeout(500);
      if (!(await settings.count())) return await check(`arcade:${title}:no settings`);
      await check(`arcade:${title}:settings`);
      const start = page.locator("dialog.arc-settings[open] .arc-start");
      if ((await start.count()) && (await start.isEnabled())) {
        await start.click();
        await page.waitForTimeout(1200);
        await closePopups(page);
        await check(`arcade:${title}:play`);
      }
    });
    await page.goto("/?local#/hub");
    await enterGame(page);
  }

  errorsAll.push(...errors.map((e) => `${tag}: ${e}`));
  await page.close();
}

// A brand-new student: the title cover, the story, the name, adopting, the dream and joining.
async function onboardingRun(browser, [w, h], mode) {
  if (!want("onboarding")) return;
  const tag = `${w}x${h}-${mode}`;
  const page = await browser.newPage({ viewport: { width: w, height: h }, baseURL: "http://localhost:8000" });
  const errors = watchErrors(page);
  page.setDefaultTimeout(5000);
  const check = runner(page, tag, mode);
  await step(tag, "onboarding", async () => {
  await freshStart(page, { [SETTINGS_KEY]: { reading: mode, motion: "calm", appearance: "light" } });
  await page.goto("/?local");
  await page.waitForTimeout(1200);
  await check("onboarding:title");
  await enterGame(page);
  await closePopups(page);
  for (let i = 0; i < 3; i++) {
    await check(`onboarding:story ${i + 1}`);
    const next = page.getByRole("button", { name: i < 2 ? "Turn the page" : /Meet your creature/ });
    if (await next.count()) await next.click();
  }
  await check("onboarding:name");
  await page.locator("#first-name").fill("Avery");
  await page.locator("#last-name").fill("Lee");
  await page.getByRole("button", { name: /Write my name in/ }).click();
  await check("onboarding:adopt");
  await page.locator("#creature-name").fill("Pip");
  await page.locator("form button[type=submit]").first().click();
  await closePopups(page);
  await check("onboarding:dream");
  await page.locator(".bst-packet").first().click();
  await check("onboarding:join");
  await page.locator("#class-code").fill("TEST01");
  await page.getByRole("button", { name: "Join the class" }).click();
  await page.waitForTimeout(1200);
  await check("onboarding:first home (with lessons)");
  await closePopups(page);
  await check("onboarding:first home");
  });
  errorsAll.push(...errors.map((e) => `${tag}: ${e}`));
  await page.close();
}

async function teacherRun(browser, [w, h], mode) {
  if (!want("teacher") && !want("admin")) return;
  const tag = `${w}x${h}-${mode}`;
  const page = await browser.newPage({ viewport: { width: w, height: h }, baseURL: "http://localhost:8000" });
  const errors = watchErrors(page);
  const check = runner(page, tag, mode);
  await page.goto("/teacher/?local");
  await page.evaluate(({ k, mode }) => localStorage.setItem(k, JSON.stringify({ reading: mode, motion: "calm", appearance: "light" })), { k: SETTINGS_KEY, mode });
  for (const path of ["/teacher/?local", "/admin/?local"]) await step(tag, path, async () => {
    await page.goto(path);
    await page.waitForTimeout(1500);
    const signIn = page.getByRole("button", { name: /sign in/i }).first();
    if (await signIn.count()) await signIn.click().catch(() => {});
    await page.waitForTimeout(1500);
    await check(`${path.includes("admin") ? "admin" : "teacher"}:main`);
  });
  errorsAll.push(...errors.map((e) => `${tag}: ${e}`));
  await page.close();
}

const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const size of SIZES) {
    for (const mode of MODES) {
      process.stdout.write(`\n${size.join("x")} ${mode} `);
      await studentRun(browser, size, mode);
      await onboardingRun(browser, size, mode);
      await teacherRun(browser, size, mode);
    }
  }
} finally {
  await browser.close();
  writeReport();
}

function writeReport() {
  const lines = [];
  const byState = new Map();
  for (const r of report) {
    const k = `${r.tag}  ${r.name}`;
    if (!byState.has(k)) byState.set(k, []);
    byState.get(k).push(r);
  }
  for (const [k, list] of byState) {
    lines.push(k);
    for (const r of list) lines.push(`   [${r.where || ""}] ${r.type}: ${r.a}${r.b ? `  <->  ${r.b}` : ""}${r.note ? `  (${r.note})` : ""}`);
  }
  lines.push("", `Page errors: ${errorsAll.length ? "\n" + errorsAll.join("\n") : "none"}`);
  writeFileSync(`${OUT}report.txt`, lines.join("\n"));
  console.log(`\n\n${report.length} findings in ${byState.size} states. Report: ${OUT}report.txt`);
}
