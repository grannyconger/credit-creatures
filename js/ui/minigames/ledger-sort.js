// Ledger Sort (SPEC §17): sort items into ASSET, LIABILITY or EQUITY.
// 45 seconds, or a no-timer mode with a set number of items. Keys 1, 2, 3 work too.
import { h, fill } from "../dom.js";
import { sfx } from "../sound.js";
import { createRng } from "../../engine/index.js";
import { LEDGER_ITEMS, LEDGER_BINS } from "../../data/minigames.js";
import { CONFIG } from "../../data/config.js";

// onDone({ right, wrong, total, seconds, misses }) runs when time is up.
export function ledgerSort({ seed, timed, onDone, track }) {
  const cfg = CONFIG.play.jobs.ledger;
  const rng = createRng(seed);
  let deck = [];
  const nextItem = () => {
    if (!deck.length) {
      deck = LEDGER_ITEMS.slice();
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    }
    return deck.pop();
  };
  const started = Date.now();
  let right = 0;
  let wrong = 0;
  let total = 0;
  const misses = [];
  let item = nextItem();
  let over = false;
  let timer = null;

  const clock = h("span.mg-clock", { role: "timer", "aria-live": "off" });
  const score = h("span.mg-score");
  const card = h("div.ledger-item", { "aria-live": "polite" });
  const flash = h("p.mg-flash", { role: "status" });
  const bins = h(
    "div.ledger-bins",
    Object.entries(LEDGER_BINS).map(([key, b]) =>
      h("button.ledger-bin", { type: "button", "data-sound": "none", onclick: () => sort(key), "aria-keyshortcuts": b.key }, h("span.bin-icon", { "aria-hidden": "true" }, b.icon), h("strong", b.label), h("small", b.hint), h("kbd", b.key))
    )
  );
  const el = h("div.minigame.ledger", h("div.mg-bar", clock, score), card, bins, flash);

  function paint() {
    fill(card, item.item);
    score.textContent = `✓ ${right}   ✗ ${wrong}`;
  }

  function sort(key) {
    if (over) return;
    total++;
    const ok = key === item.answer;
    if (ok) {
      right++;
      sfx.correct();
    } else {
      wrong++;
      sfx.error();
      misses.push(item);
    }
    flash.className = `mg-flash ${ok ? "good" : "bad"}`;
    flash.textContent = ok ? `✓ ${LEDGER_BINS[key].label}` : `✗ It's ${LEDGER_BINS[item.answer].label.toLowerCase()}. ${item.why}`;
    item = nextItem();
    if (!timed && total >= cfg.untimedItems) return end();
    paint();
  }

  const onKey = (e) => {
    const key = Object.entries(LEDGER_BINS).find(([, b]) => b.key === e.key)?.[0];
    if (key && !e.target.closest("input, textarea")) {
      e.preventDefault();
      sort(key);
    }
  };
  document.addEventListener("keydown", onKey);

  function end() {
    over = true;
    clearInterval(timer);
    document.removeEventListener("keydown", onKey);
    sfx.questComplete();
    track("minigameEnd", { game: "ledger", right, wrong, timed });
    onDone({ right, wrong, total, seconds: Math.round((Date.now() - started) / 1000), misses: misses.map((m) => `${m.item}: ${LEDGER_BINS[m.answer].label}. ${m.why}`) });
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
    clock.textContent = `No timer: ${cfg.untimedItems} items`;
  }
  paint();
  // Stop the clock and key handler if the student leaves the screen mid-shift.
  el.stop = () => {
    over = true;
    clearInterval(timer);
    document.removeEventListener("keydown", onKey);
  };
  return el;
}
