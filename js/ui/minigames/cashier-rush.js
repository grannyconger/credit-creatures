// Cashier Rush (SPEC §17): count back exact change by tapping bills and coins.
// 60 seconds, or a no-timer mode with a set number of customers.
// Teacher requests 2026-10-22: a cash drawer, a calculator, keyboard keys
// (1 to 8 for the drawer, Enter, Backspace, Esc), tap a piece in the tray to
// take it back, no wait after a right answer, and a counting-up hint in
// no-timer mode.
import { h, fill } from "../dom.js";
import { sfx } from "../sound.js";
import { createRng } from "../../engine/index.js";
import { DENOMINATIONS, CASHIER_ITEMS } from "../../data/minigames.js";
import { CONFIG } from "../../data/config.js";
import { calculator } from "./calculator.js";
import { countUp } from "./change.js";
// Bills and coins (real coin sizes) are shared with Count the Drawer.
import { label, pieceButton } from "./money-art.js";

const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export function cashierRush({ seed, timed, onDone, track }) {
  const cfg = CONFIG.play.jobs.cashier;
  const rng = createRng(seed);
  const started = Date.now();
  let right = 0;
  let wrong = 0;
  let served = 0;
  const misses = [];
  let over = false;
  let timer = null;
  let customer = null;
  let given = [];
  // True from "Give change" until the next customer is at the counter.
  let busy = false;
  let lastGive = 0;
  let calcUses = 0;
  let hintUses = 0;
  let keyUses = 0;

  const clock = h("span.mg-clock", { role: "timer" });
  const score = h("span.mg-score");
  const ticket = h("div.cash-ticket");
  const tray = h("div.cash-tray", { "aria-live": "polite" });
  const flash = h("p.mg-flash", { role: "status" });
  const hintBox = h("div.cash-hint");
  // A cash drawer: bills in one row, coins in the other, in fixed slots that
  // never move, so hands learn where each is. Each slot has a number key.
  const piece = (c, i) => pieceButton(c, { onclick: () => addPiece(c), ariaLabel: `Add ${label(c)}`, key: String(i + 1) });
  const money = h(
    "div.cash-money.cash-drawer",
    { role: "group", "aria-label": "Bills and coins" },
    h("div.drawer-row.bills", DENOMINATIONS.filter((c) => c >= 100).map((c) => piece(c, DENOMINATIONS.indexOf(c)))),
    h("div.drawer-row.coins", DENOMINATIONS.filter((c) => c < 100).map((c) => piece(c, DENOMINATIONS.indexOf(c))))
  );
  const giveBtn = h("button.big", { type: "button", "data-sound": "none", "data-autofocus": "", "aria-keyshortcuts": "Enter", onclick: () => give() }, "Give change");
  const undo = () => busy || ((given = given.slice(0, -1)), paintTray());
  const clear = () => busy || ((given = []), paintTray());

  // The calculator opens beside the counter, so nobody needs a new tab. The
  // clock keeps running while it's open.
  const calcSlot = h("div.calc-slot");
  const calcBtn = h("button.calc-toggle", { type: "button", "aria-expanded": "false", onclick: () => toggleCalc() }, "Calculator");
  function toggleCalc() {
    const open = calcBtn.getAttribute("aria-expanded") !== "true";
    calcBtn.setAttribute("aria-expanded", String(open));
    calcBtn.textContent = open ? "Hide calculator" : "Calculator";
    calcSlot.replaceChildren(...(open ? [calculator({ onUse: () => calcUses++ })] : []));
    if (open) {
      track("calcOpen", { game: "cashier" });
      calcSlot.querySelector(".calc")?.focus();
    }
  }

  const el = h(
    "div.minigame.cashier",
    h("div.mg-bar", clock, score, calcBtn),
    h(
      "div.cash-counter",
      h(
        "div.cash-main",
        ticket,
        timed ? null : hintBox,
        money,
        tray,
        h(
          "div.row.cash-actions",
          h("button.secondary", { type: "button", "aria-keyshortcuts": "Backspace", onclick: undo }, "Undo"),
          h("button.secondary", { type: "button", "aria-keyshortcuts": "Escape", onclick: clear }, "Clear"),
          giveBtn
        ),
        flash,
        h("p.cash-keys-help", "Keys: 1 to 8 add money, Enter gives change, Backspace undoes, Esc clears. Tap money in the tray to take it back.")
      ),
      calcSlot
    )
  );

  // No-timer mode only: a hint that shows how a cashier counts up from the
  // price, one piece at a time. It's there to learn the skill, so it's free.
  function paintHint(open = false) {
    if (timed) return;
    if (!open) {
      fill(hintBox, h("button.cash-hint-btn", { type: "button", onclick: () => ((hintUses++), track("cashierHint", {}), paintHint(true)) }, "Show me how to count up"));
      return;
    }
    const steps = countUp(customer.price, customer.paid);
    fill(
      hintBox,
      h("p.cash-hint-title", `Start at ${fmt(customer.price)} and count up to ${fmt(customer.paid)}:`),
      h("ol.cash-hint-steps", steps.map((s) => h("li", h("strong", `+ ${label(s.piece)}`), ` makes ${fmt(s.total)}`)))
    );
  }

  function newCustomer() {
    const price = 100 + Math.floor(rng.next() * 1899);
    const paid = [500, 1000, 2000, 5000].find((b) => b > price);
    customer = { item: CASHIER_ITEMS[Math.floor(rng.next() * CASHIER_ITEMS.length)], price, paid };
    given = [];
    fill(ticket, h("p", `A customer buys ${customer.item} for `, h("strong", fmt(price)), "."), h("p", "They hand you ", h("strong", fmt(paid)), ". Count back the change."));
    paintHint();
    paintTray();
  }

  function paintTray() {
    const sum = given.reduce((a, b) => a + b, 0);
    fill(
      tray,
      h("span", "Change so far: ", h("strong", fmt(sum))),
      h(
        "span.tray-pieces",
        given.map((c, i) =>
          h("button.tray-piece", { type: "button", "data-sound": "none", "data-boop": "none", class: c >= 100 ? "bill" : "coin", "aria-label": `Take back ${label(c)}`, title: "Tap to take it back", onclick: () => takeBack(i) }, label(c))
        )
      )
    );
    score.textContent = `✓ ${right}   ✗ ${wrong}`;
  }

  function addPiece(c) {
    if (over || busy) return;
    given.push(c);
    paintTray();
  }

  function takeBack(i) {
    if (over || busy) return;
    given = given.filter((_, k) => k !== i);
    paintTray();
  }

  // The give button locks until the next customer is at the counter, so a
  // double click can't skip anyone. A right answer brings the next customer
  // right away. A wrong one pauses so the student can read the right change.
  function give() {
    if (over || !customer || busy) return;
    const want = customer.paid - customer.price;
    const sum = given.reduce((a, b) => a + b, 0);
    if (!sum) {
      // A second click just after a give: ignore it and keep the result showing.
      if (Date.now() - lastGive < 700) return;
      flash.className = "mg-flash";
      flash.textContent = "Tap bills and coins to count out the change first.";
      return;
    }
    busy = true;
    giveBtn.disabled = true;
    lastGive = Date.now();
    served++;
    const ok = sum === want;
    if (ok) {
      right++;
      sfx.correct();
    } else {
      wrong++;
      sfx.error();
      misses.push(`${fmt(customer.paid)} − ${fmt(customer.price)} = ${fmt(want)} (you gave ${fmt(sum)})`);
    }
    score.textContent = `✓ ${right}   ✗ ${wrong}`;
    flash.className = `mg-flash ${ok ? "good" : "bad"}`;
    flash.textContent = ok ? `✓ Exact! ${fmt(customer.paid)} − ${fmt(customer.price)} = ${fmt(want)}` : `✗ The change was ${fmt(want)}. You gave ${fmt(sum)}.`;
    if (!timed && served >= cfg.untimedCustomers) return end();
    const next = () => {
      if (over) return;
      newCustomer();
      busy = false;
      giveBtn.disabled = false;
    };
    if (ok) next();
    else setTimeout(next, cfg.nextCustomerMs);
  }

  // Keys work while the shift is on screen, but never while the calculator or
  // a text box has the keyboard.
  const KEYS = { Enter: give, Backspace: undo, Escape: clear };
  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, select, .calc, dialog")) return;
    const n = Number(e.key);
    if (Number.isInteger(n) && n >= 1 && n <= DENOMINATIONS.length) {
      e.preventDefault();
      keyUses++;
      addPiece(DENOMINATIONS[n - 1]);
      // The drawer's slots are in the same order as DENOMINATIONS.
      const btn = money.querySelectorAll(".cash-piece")[n - 1];
      btn?.classList.add("pressed");
      setTimeout(() => btn?.classList.remove("pressed"), 90);
      return;
    }
    const act = KEYS[e.key];
    if (!act) return;
    // Enter on Give, Undo, Clear or the calculator button clicks that button.
    // Anywhere else (even on a bill just tapped) it gives the change.
    if (e.key === "Enter" && e.target.closest?.("button") && !e.target.closest(".cash-drawer, .cash-tray")) return;
    e.preventDefault();
    keyUses++;
    act();
  }
  document.addEventListener("keydown", onKey);

  function end() {
    if (over) return;
    over = true;
    clearInterval(timer);
    document.removeEventListener("keydown", onKey);
    sfx.questComplete();
    track("minigameEnd", { game: "cashier", right, wrong, timed, calcUses, hintUses, keyUses });
    onDone({ right, wrong, total: served, seconds: Math.round((Date.now() - started) / 1000), misses });
  }

  if (timed) {
    const endAt = Date.now() + cfg.seconds * 1000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      clock.textContent = `⏱️ ${left}s`;
      if (left <= 0 && !over) end();
    };
    tick();
    timer = setInterval(tick, 250);
  } else {
    clock.textContent = `No timer: ${cfg.untimedCustomers} customers`;
  }
  newCustomer();
  el.stop = () => {
    over = true;
    clearInterval(timer);
    document.removeEventListener("keydown", onKey);
  };
  return el;
}
