// Cashier Rush (SPEC §17): count back exact change by tapping bills and coins.
// 60 seconds, or a no-timer mode with a set number of customers.
import { h, fill } from "../dom.js";
import { sfx } from "../sound.js";
import { createRng } from "../../engine/index.js";
import { DENOMINATIONS, CASHIER_ITEMS } from "../../data/minigames.js";
import { CONFIG } from "../../data/config.js";
import { calculator } from "./calculator.js";

const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;
const label = (c) => (c >= 100 ? `$${c / 100}` : `${c}¢`);

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

  const clock = h("span.mg-clock", { role: "timer" });
  const score = h("span.mg-score");
  const ticket = h("div.cash-ticket");
  const tray = h("div.cash-tray", { "aria-live": "polite" });
  const flash = h("p.mg-flash", { role: "status" });
  // A cash drawer (teacher request 2026-10-22): bills in one row, coins in
  // the other, in fixed slots that never move, so hands learn where each is.
  const piece = (c) => h("button.cash-piece", { type: "button", class: c >= 100 ? "bill" : c === 1 ? "coin copper" : "coin", onclick: () => addPiece(c), "aria-label": `Add ${label(c)}` }, label(c));
  const money = h(
    "div.cash-money.cash-drawer",
    { role: "group", "aria-label": "Bills and coins" },
    h("div.drawer-row.bills", DENOMINATIONS.filter((c) => c >= 100).map(piece)),
    h("div.drawer-row.coins", DENOMINATIONS.filter((c) => c < 100).map(piece))
  );
  const giveBtn = h("button.big", { type: "button", "data-sound": "none", onclick: () => give() }, "Give change");
  // The calculator opens beside the counter (teacher request 2026-10-22), so
  // nobody needs a new tab. The clock keeps running while it's open.
  let calcUses = 0;
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
        money,
        tray,
        h("div.row.cash-actions", h("button.secondary", { type: "button", onclick: () => busy || ((given = given.slice(0, -1)), paintTray()) }, "Undo"), h("button.secondary", { type: "button", onclick: () => busy || ((given = []), paintTray()) }, "Clear"), giveBtn),
        flash
      ),
      calcSlot
    )
  );

  function newCustomer() {
    const price = 100 + Math.floor(rng.next() * 1899);
    const paid = [500, 1000, 2000, 5000].find((b) => b > price);
    customer = { item: CASHIER_ITEMS[Math.floor(rng.next() * CASHIER_ITEMS.length)], price, paid };
    given = [];
    fill(ticket, h("p", `A customer buys ${customer.item} for `, h("strong", fmt(price)), "."), h("p", "They hand you ", h("strong", fmt(paid)), ". Count back the change."));
    paintTray();
  }

  function paintTray() {
    const sum = given.reduce((a, b) => a + b, 0);
    fill(tray, h("span", "Change so far: ", h("strong", fmt(sum))), h("span.tray-pieces", given.map((c) => h("span.tray-piece", { class: c >= 100 ? "bill" : "coin" }, label(c)))));
    score.textContent = `✓ ${right}   ✗ ${wrong}`;
  }

  function addPiece(c) {
    if (over || busy) return;
    given.push(c);
    paintTray();
  }

  // Bug fix 2026-10-22: the next customer used to load at once, so a double
  // click gave them an empty tray and skipped them. Now the button locks and
  // the result shows for a moment before the next customer steps up.
  function give() {
    if (over || !customer || busy) return;
    const want = customer.paid - customer.price;
    const sum = given.reduce((a, b) => a + b, 0);
    if (!sum) {
      flash.className = "mg-flash";
      flash.textContent = "Tap bills and coins to count out the change first.";
      return;
    }
    busy = true;
    giveBtn.disabled = true;
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
    setTimeout(() => {
      if (over) return;
      newCustomer();
      busy = false;
      giveBtn.disabled = false;
    }, cfg.nextCustomerMs);
  }

  function end() {
    if (over) return;
    over = true;
    clearInterval(timer);
    sfx.questComplete();
    track("minigameEnd", { game: "cashier", right, wrong, timed, calcUses });
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
  };
  return el;
}
