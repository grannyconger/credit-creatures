// Cashier Rush (GAME-SPECS.md game 1, upgraded 2026-10-25): make change fast,
// read your customers, close your drawer clean. A line of customers with
// patience bars, tips for speed, one short customer, and a drawer
// reveal at closing (it replaced Count the Drawer). Rules: js/arcade/cashier.js.
// The drawer, tray and pieces keep the retro register look from 2026-10-23.
import { h, fill } from "../dom.js";
import { icon } from "../icons.js";
import { sfx } from "../arcade-sound.js";
import { CONFIG } from "../../data/config.js";
import * as R from "../../arcade/cashier.js";
import { calculator } from "./calculator.js";
import { label, pieceButton } from "./money-art.js";
import { keyHelp, timerRing } from "../arcade/components.js";

const fmt = R.fmt;
// A face for each patience state, drawn, plus a word, so it's never color alone.
const FACES = [
  ["Grumpy", "M8 16q4-3 8 0"],
  ["Waiting", "M8 15h8"],
  ["Happy", "M8 14q4 3 8 0"],
];
const faceFor = (f) => (f > 0.6 ? FACES[2] : f > 0.25 ? FACES[1] : FACES[0]);
const faceSvg = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="1.2" fill="currentColor"/><circle cx="15" cy="10" r="1.2" fill="currentColor"/><path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

export function start(ctx) {
  const { seed, settings, training } = ctx;
  const difficulty = training ? "easy" : settings.difficulty;
  const showDue = difficulty !== "hard";
  const round = training ? "chill" : settings.round;
  const speed = round === "speed";
  const cfg = CONFIG.arcade.games.cashier;
  const deal = R.newShift(seed, { difficulty, round });
  const s = R.newState(deal);
  const mine = R.DRAWERS[difficulty];
  const t0 = Date.now();
  const now = () => Date.now() - t0 - pausedFor;
  let pausedFor = 0;
  let given = [];
  let busy = false;
  let over = false;
  let tick = null;
  let calcUses = 0;
  const coached = new Set();

  const root = h("div.minigame.cashier.cr2");
  const line = h("section.cr-line", { "aria-label": "Customers waiting" });
  const ticket = h("div.cash-ticket");
  const changeBox = h("div.cash-amt.change", { "aria-live": "polite" });
  const flash = h("p.mg-flash", { role: "status" });
  const tray = h("div.cash-tray");
  const tips = h("span.mg-score");
  const clock = h("span.mg-clock", { role: "timer" });
  const ring = speed ? timerRing({ label: "Time left in the rush" }) : null;
  const prompt = h("div.cr-prompt");
  const calcSlot = h("div.calc-slot");
  // The calculator is on every difficulty (teacher request 2026-10-27).
  const calcBtn = h("button.calc-toggle", { type: "button", "aria-expanded": "false", "aria-keyshortcuts": "K", onclick: () => toggleCalc() }, "Calculator (K)");

  const piece = (c) => pieceButton(c, { onclick: () => addPiece(c), ariaLabel: `Add ${label(c)}`, key: String(mine.indexOf(c) + 1) });
  const coinRow = mine.filter((c) => c < 100);
  const billRow = mine.filter((c) => c >= 100);
  const drawer = h("div.cash-money.cash-drawer", { role: "group", "aria-label": "Your drawer" }, coinRow.length ? h("div.drawer-row.coins", { style: `--n: ${coinRow.length}` }, coinRow.map(piece)) : null, h("div.drawer-row.bills", { style: `--n: ${billRow.length}` }, billRow.map(piece)));
  const giveBtn = h("button.big", { type: "button", "data-sound": "none", "data-autofocus": "", "aria-keyshortcuts": "Enter", onclick: () => give() }, "Give change");

  fill(
    root,
    h("div.mg-bar", clock, ring, tips, calcBtn),
    h(
      "div.cr-shop",
      line,
      h(
        "div.cash-counter",
        h("div.cash-left", ticket, changeBox, prompt, flash),
        h(
          "div.cash-right",
          drawer,
          h("div.cash-actions", h("div.cash-actions-left", h("button.secondary", { type: "button", "aria-keyshortcuts": "U", onclick: () => undo() }, "Undo (U)"), h("button.secondary", { type: "button", "aria-keyshortcuts": "C", onclick: () => clear() }, "Clear (C)")), giveBtn, h("span")),
          tray
        ),
        calcSlot
      )
    ),
    keyHelp(`1 to ${mine.length} add money, U undo, C clear, Enter give change, K calculator, Y or N for a short customer. Tap money in the tray to take it back.`)
  );

  function toggleCalc() {
    const open = calcBtn.getAttribute("aria-expanded") !== "true";
    calcBtn.setAttribute("aria-expanded", String(open));
    calcBtn.textContent = open ? "Hide calculator" : "Calculator (K)";
    calcSlot.replaceChildren(...(open ? [calculator({ onUse: () => calcUses++ })] : []));
    if (open) ctx.track("calcOpen", { game: "cashier" });
  }

  // ---------- Drawing ----------
  function paintLine() {
    const t = now();
    const waiting = s.line.slice(0, 6);
    fill(
      line,
      h("h4", `In line (${s.line.length})`),
      waiting.length
        ? waiting.map((c) => {
            const f = R.patience(s, c, t);
            const [word, d] = faceFor(f);
            return h("div.cr-cust", h("span.cr-face", { html: faceSvg(d), title: word }), h("strong", c.name), h("div.cr-pbar", { role: "img", "aria-label": `Patience ${Math.round(f * 100)} percent, ${word}` }, h("span", { style: `width: ${Math.round(f * 100)}%` })), h("small", `${Math.ceil((f * s.patienceMs) / 1000)}s ${word}`));
          })
        : h("p.muted", speed ? "More customers are on the way." : "That's everyone.")
    );
  }

  function paintCustomer() {
    const c = s.current;
    if (!c) return fill(ticket, h("p.cash-item", speed ? "Waiting for the next customer..." : "No one left in line."));
    const f = R.patience(s, c, now());
    const [word, d] = faceFor(f);
    fill(
      ticket,
      h("p.cash-item", h("span.cr-face", { html: faceSvg(d), title: word }), ` ${c.name} buys ${c.item}.`),
      h(
        "div.cash-amounts",
        h("div.cash-amt.paid", h("small", "They hand you"), h("strong", fmt(c.paid))),
        h("div.cash-amt.price", h("small", h("span.cash-op", { "aria-hidden": "true" }, "− "), "Charged"), h("strong", fmt(c.price))),
        // Easy and Medium show the change due, so the skill is counting it out.
        showDue && !c.short ? h("div.cash-amt.due", h("small", h("span.cash-op", { "aria-hidden": "true" }, "= "), "Change due"), h("strong", fmt(R.changeDue(c)))) : null
      ),
      h("div.cr-pbar.big", { role: "img", "aria-label": `Patience ${Math.round(f * 100)} percent, ${word}` }, h("span", { style: `width: ${Math.round(f * 100)}%` }), h("small", `Tip if right now: ${R.tipFor(f)}`))
    );
    if (c.short) showShort(c);
    else fill(prompt);
  }

  function paintTray() {
    const sum = given.reduce((a, b) => a + b, 0);
    fill(changeBox, h("small", "Your change so far"), h("strong", fmt(sum)));
    fill(tray, given.length ? h("div.tray-pieces", given.map((c, i) => pieceButton(c, { onclick: () => takeBack(i), ariaLabel: `Take back ${label(c)}`, quiet: true }))) : h("p.tray-empty", "Tap coins and bills to count out the change."));
    tips.textContent = `✓ ${s.right}  ✗ ${s.wrong}  Tips ${s.tips}`;
  }

  function showShort(c) {
    fill(
      prompt,
      h("p", icon("alert", { size: 18 }), ` ${c.name} is ${fmt(c.short)} short. Cover it from your tips?`),
      h("div.row", h("button", { type: "button", "aria-keyshortcuts": "Y", onclick: () => short(true) }, "Y: Cover it"), h("button.secondary", { type: "button", "aria-keyshortcuts": "N", onclick: () => short(false) }, "N: Turn them away"))
    );
    giveBtn.disabled = true;
  }

  // ---------- Actions ----------
  const addPiece = (c) => !busy && !over && s.current && !s.current.short && (given.push(c), paintTray());
  const takeBack = (i) => !busy && ((given = given.filter((_, k) => k !== i)), paintTray());
  const undo = () => !busy && ((given = given.slice(0, -1)), paintTray());
  const clear = () => !busy && ((given = []), paintTray());

  function give() {
    if (busy || over || !s.current || s.current.short) return;
    const sum = given.reduce((a, b) => a + b, 0);
    if (!sum) {
      flash.className = "mg-flash";
      flash.textContent = "Tap bills and coins to count out the change first.";
      return;
    }
    const sale = R.give(s, sum, now());
    given = [];
    ctx.track("cashierSale", { difficulty, round, right: sale.ok, off: sale.diff, smart: sale.smart, tip: sale.tip });
    if (sale.ok) {
      sfx.correct();
      flash.className = "mg-flash good";
      flash.textContent = `✓ Exact! +${cfg.points[difficulty]} and a ${sale.tip}-point tip. ${sale.why}`;
    } else {
      sfx.error();
      flash.className = "mg-flash bad";
      flash.textContent = `✗ ${sale.diff > 0 ? "Too much" : "Not enough"}: ${fmt(Math.abs(sale.diff))} ${sale.diff > 0 ? "over" : "short"}. ${sale.why}`;
      ctx.mistake({ type: "wrongChange", cost: Math.max(1, Math.abs(sale.diff) / 100), label: `Wrong change for ${sale.name}` });
    }
    if (!sale.ok) {
      // A wrong answer pauses for 2 seconds so the student can read it.
      busy = true;
      giveBtn.disabled = true;
      setTimeout(() => {
        busy = false;
        giveBtn.disabled = false;
        afterServe();
      }, cfg.wrongPauseMs);
    } else afterServe();
  }

  function short(cover) {
    if (!s.current?.short || over) return;
    const r = R.decideShort(s, cover, now());
    ctx.track("cashierShort", { cover, cents: r.cents, returned: r.returned });
    // The outcome is uncertain and shows later, in the echo recap.
    ctx.echo(r.text, { kind: cover && r.returned ? "good" : "safe" });
    giveBtn.disabled = false;
    fill(prompt);
    afterServe();
  }

  async function afterServe() {
    paintTray();
    paintCustomer();
    paintLine();
    if (!speed && !s.current) return closeUp();
    if (training && !coached.has(2) && s.served >= 1) {
      coached.add(2);
      await hold(ctx.coach(2, root.querySelector(".cr-pbar.big") || line));
    }
  }

  async function hold(p) {
    const at = Date.now();
    busy = true;
    await p;
    pausedFor += Date.now() - at;
    busy = false;
  }

  // ---------- Keys ----------
  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, select, .calc, dialog, .arc-coach")) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const n = Number(k);
    if (Number.isInteger(n) && n >= 1 && n <= mine.length) {
      e.preventDefault();
      addPiece(mine[n - 1]);
      const btn = drawer.querySelectorAll(".cash-piece")[n - 1];
      btn?.classList.add("pressed");
      setTimeout(() => btn?.classList.remove("pressed"), 90);
      return;
    }
    const act = { u: undo, Backspace: undo, c: clear, Escape: clear, k: toggleCalc, y: () => short(true), n: () => short(false) }[k];
    if (act) return e.preventDefault(), act();
    if (k === "Enter" && !(e.target.closest?.("button") && !e.target.closest(".cash-drawer, .cash-tray"))) return e.preventDefault(), give();
  }
  document.addEventListener("keydown", onKey);

  // ---------- The clock ----------
  function loop() {
    if (over || busy) return;
    const t = now();
    if (speed) {
      const r = R.tick(s, t);
      if (r.rush) ctx.echo("Rush! Three customers just walked in at once.", { kind: "safe" });
      const left = cfg.speedSeconds - t / 1000;
      ring.set(left, cfg.speedSeconds);
      clock.textContent = "Speed round";
      if (left <= 0) return closeUp();
      if (!ticket.querySelector(".cash-amounts") && s.current) paintCustomer();
    } else clock.textContent = `${difficulty[0].toUpperCase()}${difficulty.slice(1)} Chill: ${s.served + (s.short ? 1 : 0)} of ${deal.customers.length} served`;
    paintLine();
    const bar = ticket.querySelector(".cr-pbar.big");
    if (bar && s.current) {
      const f = R.patience(s, s.current, t);
      bar.firstChild.style.width = `${Math.round(f * 100)}%`;
      bar.lastChild.textContent = `Tip if right now: ${R.tipFor(f)}`;
    }
  }

  // ---------- Closing: the drawer reveal ----------
  function closeUp() {
    if (over) return;
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
    const pick = (g) => {
      document.removeEventListener("keydown", guessKey);
      const right = R.guessDrawer(s, g);
      (right ? sfx.correct : sfx.error)();
      ctx.track("cashierDrawerGuess", { guess: g, right, drawer: s.drawer });
      finish();
    };
    const guessKey = (e) => {
      const g = { o: "over", s: "short", e: "exact", 1: "over", 2: "short", 3: "exact" }[e.key.toLowerCase()];
      if (g) (e.preventDefault(), pick(g));
    };
    document.addEventListener("keydown", guessKey);
    root.stop = () => document.removeEventListener("keydown", guessKey);
    fill(
      root,
      h(
        "div.cr-close",
        h("h4", "Closing time. Before you count the drawer..."),
        h("p", `You served ${s.served} customer${s.served === 1 ? "" : "s"} and got ${s.wrong} wrong. Every change mistake is still in the drawer.`),
        h("p.cr-guess-q", `Is the drawer over, short or exact? A right guess is +${cfg.guessBonus}.`),
        h("div.row", h("button.big", { type: "button", onclick: () => pick("over") }, h("kbd", "O"), " Over"), h("button.big", { type: "button", onclick: () => pick("short") }, h("kbd", "S"), " Short"), h("button.big", { type: "button", onclick: () => pick("exact") }, h("kbd", "E"), " Exact"))
      )
    );
    root.querySelector("button")?.focus();
  }

  function finish() {
    const sc = R.score(s);
    const lines = R.drawerLines(s);
    const state = R.drawerState(s);
    if (Math.abs(s.drawer) > cfg.drawerLimit) ctx.mistake({ type: "drawer", cost: cfg.drawerFine, label: `Drawer ${state} by ${fmt(Math.abs(s.drawer))} at closing` });
    for (const l of lines) ctx.echo(l);
    const reveal = h(
      "div.cr-reveal",
      h("p.cr-drawer-total", icon(state === "exact" ? "check" : "alert", { size: 20 }), state === "exact" ? " The drawer is exact." : ` The drawer is ${state} ${fmt(Math.abs(s.drawer))}.`),
      h("p", `You guessed ${s.guess}. ${s.guessRight ? `Right! +${cfg.guessBonus}` : "Not this time."}`),
      lines.length ? h("ul", lines.map((l) => h("li", l))) : h("p", "Every sale was exact."),
      h("ul.bd-reveal-list", h("li", icon("check", { size: 14 }), ` ${sc.right} right sales`), h("li", icon("coins", { size: 14 }), ` ${sc.tips} tip points`), speed ? h("li", icon("star", { size: 14 }), " Speed round: double coins") : null)
    );
    ctx.finish({
      score: sc.score,
      tie: sc.wrong,
      tier: difficulty,
      multiplier: speed ? 2 : 1,
      sub: { right: sc.right, wrong: sc.wrong, tips: sc.tips, drawer: s.drawer, guessRight: sc.guessRight },
      perfect: sc.wrong === 0 && sc.right >= 4,
      reveal,
      biggest: R.biggest(s),
      stats: { difficulty, round, calcUses, served: sc.served },
    });
  }

  // ---------- Start ----------
  paintCustomer();
  paintLine();
  paintTray();
  tick = setInterval(loop, 200);
  loop();
  if (training) {
    (async () => {
      coached.add(0);
      await hold(ctx.coach(0, ticket));
      coached.add(1);
      await hold(ctx.coach(1, calcBtn));
    })();
  }
  root.stop = () => {
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
  };
  return root;
}
