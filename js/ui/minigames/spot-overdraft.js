// Spot the Overdraft (teacher request 2026-10-22, idea 2). Purchases and
// deposits come one at a time over a live checking balance. Stop the one that
// would drop the balance below $0. Deposits can rescue a low balance, so each
// one has to be read. Timed: each item waits a little less than the last.
// No timer: nothing moves until the student decides.
import { h, fill } from "../dom.js";
import { sfx } from "../sound.js";
import { createRng } from "../../engine/index.js";
import { CONFIG } from "../../data/config.js";
import { overdraftFeed, fmt } from "./gen.js";

export function spotOverdraft({ seed, timed, onDone, track }) {
  const cfg = CONFIG.play.jobs.overdraft;
  const rng = createRng(seed);
  const started = Date.now();
  const fee = CONFIG.fees.overdraft * 100;
  let right = 0;
  let wrong = 0;
  let round = 0;
  let feed = null;
  let i = 0;
  let bal = 0;
  let over = false;
  let waiting = false;
  let timer = 0;
  const misses = [];

  const status = h("span.mg-clock");
  const score = h("span.mg-score");
  const balance = h("strong.od-balance");
  const card = h("div.od-card", { "aria-live": "polite" });
  const bar = h("div.od-bar", { "aria-hidden": "true" }, h("span"));
  const flash = h("p.mg-flash", { role: "status" });
  const stopBtn = h("button.big.od-stop", { type: "button", "data-sound": "none", "aria-keyshortcuts": "S", onclick: () => decide(true) }, "Stop it");
  // The keyboard starts here, so Enter lets an item through as the help says.
  const letBtn = h("button.od-let", { type: "button", "data-sound": "none", "data-autofocus": "", "aria-keyshortcuts": "Enter", onclick: () => decide(false) }, "Let it through");
  const el = h(
    "div.minigame.overdraft",
    h("div.mg-bar", status, score),
    h("p.od-balance-line", "Checking: ", balance),
    card,
    timed ? bar : null,
    h("div.row.od-actions", letBtn, stopBtn),
    flash,
    h("p.cash-keys-help", "Keys: S stops it, Enter lets it through.")
  );

  const paintScore = () => (score.textContent = `✓ ${right}   ✗ ${wrong}`);

  function startRound() {
    feed = overdraftFeed(rng, { length: cfg.feedLength });
    i = 0;
    bal = feed.start;
    status.textContent = `Account ${round + 1} of ${cfg.rounds}`;
    showItem();
  }

  // How long each item waits, shorter as the shift goes on.
  const waitMs = () => Math.round(cfg.startMs - ((cfg.startMs - cfg.endMs) * Math.min(round * cfg.feedLength + i, cfg.rounds * cfg.feedLength)) / (cfg.rounds * cfg.feedLength));

  function showItem() {
    const it = feed.items[i];
    const deposit = it.amount > 0;
    balance.textContent = fmt(bal);
    fill(
      card,
      h("small.od-kind", deposit ? "Deposit" : "Purchase"),
      h("strong.od-label", it.label),
      h("span.od-amount", { class: deposit ? "in" : "out" }, `${deposit ? "+" : "−"} ${fmt(Math.abs(it.amount))}`)
    );
    waiting = true;
    stopBtn.disabled = letBtn.disabled = false;
    if (timed) {
      const ms = waitMs();
      const fillBar = bar.firstElementChild;
      fillBar.style.transition = "none";
      fillBar.style.width = "100%";
      void fillBar.offsetWidth;
      fillBar.style.transition = `width ${ms}ms linear`;
      fillBar.style.width = "0%";
      timer = setTimeout(() => decide(false, true), ms);
    }
  }

  function decide(stop, timedOut = false) {
    if (!waiting || over) return;
    waiting = false;
    clearTimeout(timer);
    const it = feed.items[i];
    const after = bal + it.amount;
    const isStop = i === feed.stop;
    let done = false;
    if (stop && isStop) {
      right++;
      sfx.correct();
      flash.className = "mg-flash good";
      flash.textContent = `✓ Good stop. It would have left ${fmt(after)} and cost a ${fmt(fee)} overdraft fee.`;
      done = true;
    } else if (stop) {
      wrong++;
      sfx.error();
      flash.className = "mg-flash bad";
      flash.textContent = `✗ That one was safe. Checking would still have ${fmt(after)}.`;
      misses.push(`${it.label}: safe to let through (${fmt(bal)} → ${fmt(after)}).`);
      done = true;
    } else if (isStop) {
      wrong++;
      sfx.error();
      bal = after - fee;
      balance.textContent = fmt(bal);
      flash.className = "mg-flash bad";
      flash.textContent = `✗ ${timedOut ? "Too slow. " : ""}That one overdrew the account to ${fmt(after)}, plus a ${fmt(fee)} fee.`;
      misses.push(`${it.label}: ${fmt(Math.abs(it.amount))} with only ${fmt(after - it.amount)} in checking. Stop it before it overdraws.`);
      done = true;
    } else {
      bal = after;
      flash.className = "mg-flash";
      flash.textContent = "";
    }
    track("overdraftStop", { round, item: i, stop, right: (stop && isStop) || (!stop && !isStop), timedOut });
    paintScore();
    if (!done) {
      i++;
      return showItem();
    }
    stopBtn.disabled = letBtn.disabled = true;
    round++;
    if (round >= cfg.rounds) return setTimeout(end, 1100);
    setTimeout(() => !over && startRound(), cfg.betweenMs);
  }

  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, .calc, dialog")) return;
    if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      decide(true);
    } else if (e.key === "Enter" && !e.target.closest?.("button")) {
      e.preventDefault();
      decide(false);
    }
  }
  document.addEventListener("keydown", onKey);

  function end() {
    if (over) return;
    over = true;
    clearTimeout(timer);
    document.removeEventListener("keydown", onKey);
    sfx.questComplete();
    track("minigameEnd", { game: "overdraft", right, wrong, timed });
    onDone({ right, wrong, total: cfg.rounds, seconds: Math.round((Date.now() - started) / 1000), misses });
  }

  paintScore();
  startRound();
  el.stop = () => {
    over = true;
    clearTimeout(timer);
    document.removeEventListener("keydown", onKey);
  };
  return el;
}
