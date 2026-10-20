// Cashier Rush (SPEC §17): count back exact change by tapping bills and coins.
// 60 seconds, or a no-timer mode with a set number of customers.
import { h, fill } from "../dom.js";
import { createRng } from "../../engine/index.js";
import { DENOMINATIONS, CASHIER_ITEMS } from "../../data/minigames.js";
import { CONFIG } from "../../data/config.js";

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

  const clock = h("span.mg-clock", { role: "timer" });
  const score = h("span.mg-score");
  const ticket = h("div.cash-ticket");
  const tray = h("div.cash-tray", { "aria-live": "polite" });
  const flash = h("p.mg-flash", { role: "status" });
  const money = h(
    "div.cash-money",
    { role: "group", "aria-label": "Bills and coins" },
    DENOMINATIONS.map((c) => h("button.cash-piece", { type: "button", class: c >= 100 ? "bill" : "coin", onclick: () => addPiece(c), "aria-label": `Add ${label(c)}` }, label(c)))
  );
  const giveBtn = h("button.big", { type: "button", onclick: () => give() }, "Give change");
  const el = h(
    "div.minigame.cashier",
    h("div.mg-bar", clock, score),
    ticket,
    money,
    tray,
    h("div.row", h("button.secondary", { type: "button", onclick: () => ((given = given.slice(0, -1)), paintTray()) }, "Undo"), h("button.secondary", { type: "button", onclick: () => ((given = []), paintTray()) }, "Clear"), giveBtn),
    flash
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
    if (over) return;
    given.push(c);
    paintTray();
  }

  function give() {
    if (over || !customer) return;
    const want = customer.paid - customer.price;
    const sum = given.reduce((a, b) => a + b, 0);
    served++;
    const ok = sum === want;
    if (ok) right++;
    else {
      wrong++;
      misses.push(`${fmt(customer.paid)} − ${fmt(customer.price)} = ${fmt(want)} (you gave ${fmt(sum)})`);
    }
    flash.className = `mg-flash ${ok ? "good" : "bad"}`;
    flash.textContent = ok ? `✓ Exact! ${fmt(customer.paid)} − ${fmt(customer.price)} = ${fmt(want)}` : `✗ The change was ${fmt(want)}. You gave ${fmt(sum)}.`;
    if (!timed && served >= cfg.untimedCustomers) return end();
    newCustomer();
  }

  function end() {
    over = true;
    clearInterval(timer);
    track("minigameEnd", { game: "cashier", right, wrong, timed });
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
