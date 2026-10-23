// Cashier Rush (SPEC §17): count back exact change by tapping bills and coins.
// Teacher requests 2026-10-22: a cash drawer, a calculator, keyboard keys,
// tap a piece in the tray to take it back, no wait after a right answer.
// Teacher requests 2026-10-23: pick a difficulty (Easy whole dollars, Medium
// cents in multiples of 5, Hard other cents) and a round (Chill: 4 customers,
// no timer. Speed: as many as possible in 60 seconds, double coins). Coins are
// paid for each right sale. A wrong answer says how far over or short it was.
// The sale reads like a subtraction (they hand you, minus the charge). The
// drawer runs left to right from small to big, coins above bills, no $20.
import { h, fill } from "../dom.js";
import { sfx } from "../arcade-sound.js";
import { createRng } from "../../engine/index.js";
import { CASHIER_ITEMS } from "../../data/minigames.js";
import { CONFIG } from "../../data/config.js";
import { calculator } from "./calculator.js";
import { label, pieceButton } from "./money-art.js";
import { CASH_LEVELS, cashierCustomer, overShortText } from "./gen.js";

const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

// The drawer, left to right in each row: penny, nickel, dime, quarter, then $1,
// $5, $10. There is no $20 bill, because change never reaches $20. Number keys
// follow this order.
const ORDER = [1, 5, 10, 25, 100, 500, 1000];
const SCALE = 1.0;

// Only the money a sale can need is in the drawer (teacher request 2026-10-23):
// Easy is bills only, Medium adds quarters, dimes and nickels, Hard adds pennies.
export const DRAWER = { easy: [100, 500, 1000], medium: [5, 10, 25, 100, 500, 1000], hard: ORDER };

// Coins for each right sale: the relative value unit times the difficulty (1, 5
// or 15), doubled in the Speed Round.
export const cashierRate = (difficulty, mode) => {
  const c = CONFIG.play.jobs.cashier;
  return c.rvu * c.rvuByLevel[difficulty] * (mode === "speed" ? c.speedMultiplier : 1);
};

export function cashierRush({ seed, timed, onDone, track }) {
  const cfg = CONFIG.play.jobs.cashier;
  const host = h("div.cash-host");
  let game = null;
  let choice = { difficulty: "easy", mode: timed ? "speed" : "chill" };

  // ---- Setup: pick a difficulty and a round, then start. ----
  function setup() {
    const rate = () => cashierRate(choice.difficulty, choice.mode);
    const summary = h("p.cash-summary", { "aria-live": "polite" });
    const paintSummary = () => {
      const lvl = CASH_LEVELS[choice.difficulty];
      summary.textContent = `${lvl.label} ${choice.mode === "speed" ? "Speed Round" : "Chill Round"}: ${rate()} coin${rate() === 1 ? "" : "s"} for each right sale. ${choice.mode === "speed" ? `Serve as many customers as you can in ${cfg.seconds} seconds. Double coins!` : `Serve ${cfg.untimedCustomers} customers with no timer.`}`;
    };
    const group = (title, key, options) => {
      const buttons = options.map(([value, name, detail, pays, badge]) =>
        h(
          "button.cash-choice",
          {
            type: "button",
            "data-sound": "none",
            "aria-pressed": String(choice[key] === value),
            onclick: () => {
              choice[key] = value;
              buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(options[i][0] === value)));
              refresh();
            },
          },
          h("strong", name, badge ? h("span.cash-badge", badge) : null),
          h("span", detail),
          pays ? h("small", pays()) : null
        )
      );
      return h("fieldset.cash-group", h("legend", title), h("div.cash-choices", buttons));
    };
    const pay = (d) => () => `${cashierRate(d, "chill")} coin${cashierRate(d, "chill") === 1 ? "" : "s"} a sale (${cashierRate(d, "speed")} in Speed)`;
    const levels = group("Pick a difficulty", "difficulty", Object.entries(CASH_LEVELS).map(([d, l]) => [d, l.label, l.text, pay(d)]));
    const rounds = group("Pick a round", "mode", [
      ["chill", "Chill Round", `Serve ${cfg.untimedCustomers} customers. No timer.`, null, null],
      ["speed", "Speed Round", `Serve as many as you can in ${cfg.seconds} seconds.`, null, "2× COINS"],
    ]);
    const refresh = paintSummary;
    const start = h("button.big", { type: "button", "data-autofocus": "", onclick: () => begin() }, "Open the register");
    paintSummary();
    fill(host, h("div.minigame.cashsetup", h("div.cash-setup", levels, rounds, summary, h("div.row", start))));
  }

  function begin() {
    track("cashierSetup", { difficulty: choice.difficulty, mode: choice.mode });
    game = play(choice);
    fill(host, game);
    (game.querySelector("[data-autofocus]") || game.querySelector("button"))?.focus();
  }

  // ---- The register. ----
  function play({ difficulty, mode }) {
    const speed = mode === "speed";
    const rng = createRng(`${seed}:${difficulty}:${mode}`);
    const started = Date.now();
    const perSale = cashierRate(difficulty, mode);
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
    let keyUses = 0;

    const clock = h("span.mg-clock", { role: "timer" });
    const score = h("span.mg-score");
    const ticket = h("div.cash-ticket");
    const tray = h("div.cash-tray");
    const changeBox = h("div.cash-amt.change", { "aria-live": "polite" });
    const flash = h("p.mg-flash", { role: "status" });
    // A cash drawer: coins in the top row, bills below, in fixed slots that
    // never move, so hands learn where each is. Each slot has a number key.
    const mine = DRAWER[difficulty];
    const piece = (c) => pieceButton(c, { onclick: () => addPiece(c), ariaLabel: `Add ${label(c)}`, key: String(mine.indexOf(c) + 1), scale: SCALE });
    const coinRow = mine.filter((c) => c < 100);
    const billRow = mine.filter((c) => c >= 100);
    const money = h(
      "div.cash-money.cash-drawer",
      { role: "group", "aria-label": difficulty === "easy" ? "Bills" : "Coins and bills" },
      coinRow.length ? h("div.drawer-row.coins", { style: `--n: ${coinRow.length}` }, coinRow.map(piece)) : null,
      h("div.drawer-row.bills", { style: `--n: ${billRow.length}` }, billRow.map(piece))
    );
    const giveBtn = h("button.big", { type: "button", "data-sound": "none", "data-autofocus": "", "aria-keyshortcuts": "Enter", onclick: () => give() }, "Give change");
    const undo = () => busy || ((given = given.slice(0, -1)), paintTray());
    const clear = () => busy || ((given = []), paintTray());

    // The calculator opens beside the counter, on top of everything else. The
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
        h("div.cash-left", ticket, changeBox, flash),
        // The buttons sit between the drawer and the tray, so they're close to both.
        h(
          "div.cash-right",
          money,
          h("div.cash-actions", h("div.cash-actions-left", h("button.secondary", { type: "button", "aria-keyshortcuts": "Backspace", onclick: undo }, "Undo"), h("button.secondary", { type: "button", "aria-keyshortcuts": "Escape", onclick: clear }, "Clear")), giveBtn, h("span")),
          tray
        ),
        calcSlot
      ),
      h("p.cash-keys-help", `Keys: 1 to ${mine.length} add money, Enter gives change, Backspace undoes, Esc clears. Tap money in the tray to take it back.`)
    );

    function newCustomer() {
      customer = cashierCustomer(rng, difficulty, CASHIER_ITEMS);
      given = [];
      // The sale reads like a subtraction: what they hand you, minus the charge.
      fill(
        ticket,
        h("p.cash-item", `A customer buys ${customer.item}.`),
        h("div.cash-amounts", h("div.cash-amt.paid", h("small", "They hand you"), h("strong", fmt(customer.paid))), h("div.cash-amt.price", h("small", h("span.cash-op", { "aria-hidden": "true" }, "− "), "Charged"), h("strong", fmt(customer.price)))),
        h("p.cash-ask", "Count back the change.")
      );
      paintTray();
    }

    function paintTray() {
      const sum = given.reduce((a, b) => a + b, 0);
      fill(changeBox, h("small", "Your change so far"), h("strong", fmt(sum)));
      // The same bills and coins as the drawer, at the same size and color.
      fill(
        tray,
        given.length
          ? h("div.tray-pieces", given.map((c, i) => pieceButton(c, { onclick: () => takeBack(i), ariaLabel: `Take back ${label(c)}`, scale: SCALE, quiet: true })))
          : h("p.tray-empty", "Tap coins and bills to count out the change.")
      );
      paintScore();
    }

    function paintScore() {
      score.textContent = `✓ ${right}   ✗ ${wrong}   ${right * perSale} coins`;
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
    // right away. A wrong one pauses so the student can read how far off it was.
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
        misses.push(`${fmt(customer.paid)} − ${fmt(customer.price)} = ${fmt(want)} (you gave ${fmt(sum)}, ${overShortText(sum, want)})`);
      }
      paintScore();
      flash.className = `mg-flash ${ok ? "good" : "bad"}`;
      flash.textContent = ok ? `✓ Exact! ${fmt(customer.paid)} − ${fmt(customer.price)} = ${fmt(want)}` : `✗ ${sum > want ? "Too much" : "Not enough"}: ${fmt(sum)} is ${overShortText(sum, want)}. The change was ${fmt(want)}.`;
      track("cashierSale", { difficulty, mode, right: ok, off: sum - want });
      if (!speed && served >= cfg.untimedCustomers) return end();
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
      if (Number.isInteger(n) && n >= 1 && n <= mine.length) {
        e.preventDefault();
        keyUses++;
        addPiece(mine[n - 1]);
        // The drawer's slots are in the same order as ORDER.
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
      const coins = right * perSale;
      track("minigameEnd", { game: "cashier", right, wrong, timed: speed, difficulty, mode, coins, calcUses, keyUses });
      onDone({ right, wrong, total: served, seconds: Math.round((Date.now() - started) / 1000), misses, coins, difficulty, mode });
    }

    if (speed) {
      clock.after(h("span.cash-badge.cash-double", "2× COINS"));
      const endAt = Date.now() + cfg.seconds * 1000;
      const tick = () => {
        const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        clock.textContent = `⏱️ ${left}s`;
        if (left <= 0 && !over) end();
      };
      tick();
      timer = setInterval(tick, 250);
    } else {
      clock.textContent = `${CASH_LEVELS[difficulty].label} Chill Round: ${cfg.untimedCustomers} customers`;
    }
    newCustomer();
    el.stop = () => {
      over = true;
      clearInterval(timer);
      document.removeEventListener("keydown", onKey);
    };
    return el;
  }

  setup();
  host.stop = () => game?.stop?.();
  return host;
}
