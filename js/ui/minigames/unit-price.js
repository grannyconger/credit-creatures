// Unit Price Showdown (teacher request 2026-10-22, idea 11). Two or three
// products side by side with a price and a size. Tap the better buy, then see
// each one's price per unit. Later rounds mix brands, add a coupon, or give a
// size in pounds or quarts. Bigger is not always cheaper.
import { h, fill } from "../dom.js";
import { sfx } from "../sound.js";
import { createRng } from "../../engine/index.js";
import { CONFIG } from "../../data/config.js";
import { UNIT_TIPS } from "../../data/minigames.js";
import { unitRounds, unitText, fmt } from "./gen.js";

export function unitPriceShowdown({ seed, timed, onDone, track }) {
  const cfg = CONFIG.play.jobs.unitprice;
  const rng = createRng(seed);
  const started = Date.now();
  const rounds = unitRounds(rng, { count: cfg.rounds });
  let k = 0;
  let right = 0;
  let wrong = 0;
  let over = false;
  let locked = false;
  let clockTimer = 0;
  let shownAt = Date.now();
  const misses = [];

  const clock = h("span.mg-clock", { role: "timer" });
  const score = h("span.mg-score");
  const prompt = h("p.up-prompt");
  const shelf = h("div.up-shelf", { role: "group", "aria-label": "Products to compare" });
  const flash = h("p.mg-flash", { role: "status" });
  const nextBtn = h("button.up-next", { type: "button", hidden: true, onclick: () => next() }, "Next");
  const el = h("div.minigame.unitprice", h("div.mg-bar", clock, score), prompt, shelf, h("div.row.up-foot", nextBtn), flash, h("p.cash-keys-help", "Keys: 1, 2 or 3 picks a product. Enter goes on."));
  const paintScore = () => (score.textContent = `✓ ${right}   ✗ ${wrong}`);
  const size = (o) => `${o.showQty} ${o.showUnit}`;

  function show() {
    locked = false;
    shownAt = Date.now();
    nextBtn.hidden = true;
    flash.className = "mg-flash";
    flash.textContent = "";
    const r = rounds[k];
    fill(prompt, h("small", `Round ${k + 1} of ${rounds.length}`), h("strong", r.options.length > 2 ? "Which of these three is the best buy?" : "Which is the better buy?"));
    fill(
      shelf,
      r.options.map((o, i) =>
        h(
          "button.up-card",
          { type: "button", "data-sound": "none", "data-boop": "none", "data-i": i, "aria-keyshortcuts": String(i + 1), onclick: () => pick(i) },
          h("kbd.cash-key", { "aria-hidden": "true" }, String(i + 1)),
          h("strong.up-name", o.name),
          h("span.up-size", size(o)),
          h("span.up-price", fmt(o.price)),
          o.coupon ? h("span.up-coupon", `Coupon: ${fmt(o.coupon)} off`) : null,
          h("span.up-unit")
        )
      )
    );
    shelf.querySelector("button")?.focus();
    paintScore();
  }

  function pick(i) {
    if (over || locked) return;
    locked = true;
    const r = rounds[k];
    const ok = i === r.best;
    const best = r.options[r.best];
    shelf.querySelectorAll(".up-card").forEach((card, j) => {
      const o = r.options[j];
      card.disabled = true;
      card.querySelector(".up-unit").textContent = unitText(o);
      if (j === r.best) {
        card.classList.add("up-best");
        card.append(h("small.up-tag", "✓ Best buy"));
      }
      if (j === i) {
        card.classList.add("up-chosen");
        card.append(h("small.up-tag.chosen", "Your pick"));
      }
    });
    if (ok) right++;
    else {
      wrong++;
      misses.push(`${r.options.map((o) => `${o.name} ${size(o)} at ${fmt(o.price - (o.coupon || 0))} is ${unitText(o)}`).join(", ")}. Best buy: ${best.name} ${size(best)}.`);
    }
    // Teach the trap when the bigger size wasn't the better buy.
    const bigger = r.options.some((o) => o.baseQty > best.baseQty && o.kind === best.kind);
    const tip = best.coupon ? "The coupon changes the math. Take it off the price first, then divide by the size." : r.options.some((o) => o.showUnit !== o.baseUnit) ? "Change the sizes to the same unit first. There are 16 ounces in a pound and 32 fluid ounces in a quart." : bigger ? UNIT_TIPS[0] : UNIT_TIPS[1 + (k % (UNIT_TIPS.length - 1))];
    (ok ? sfx.correct : sfx.error)();
    flash.className = `mg-flash ${ok ? "good" : "bad"}`;
    flash.textContent = `${ok ? "✓ Right." : `✗ The best buy was ${best.name} ${size(best)}.`} ${tip}`;
    track("unitPick", { round: k, right: ok, options: r.options.length, coupon: r.options.some((o) => o.coupon), seconds: Math.round((Date.now() - shownAt) / 1000) });
    paintScore();
    nextBtn.hidden = false;
    nextBtn.focus();
    if (timed) setTimeout(() => locked && !over && k === r.k && next(), ok ? 1400 : 2600);
  }

  function next() {
    if (over || !locked) return;
    k++;
    if (k >= rounds.length) return end();
    show();
  }

  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, .calc, dialog")) return;
    const n = Number(e.key);
    if (!locked && Number.isInteger(n) && n >= 1 && n <= rounds[k].options.length) {
      e.preventDefault();
      pick(n - 1);
    } else if (locked && e.key === "Enter" && !e.target.closest?.("button")) {
      e.preventDefault();
      next();
    }
  }
  document.addEventListener("keydown", onKey);

  function end() {
    if (over) return;
    over = true;
    clearInterval(clockTimer);
    document.removeEventListener("keydown", onKey);
    sfx.questComplete();
    track("minigameEnd", { game: "unitprice", right, wrong, timed });
    onDone({ right, wrong, total: rounds.length, seconds: Math.round((Date.now() - started) / 1000), misses });
  }

  rounds.forEach((r, i) => (r.k = i));
  if (timed) {
    const endAt = Date.now() + cfg.seconds * 1000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      clock.textContent = `⏱️ ${left}s`;
      if (left <= 0 && !over) {
        wrong += rounds.length - k - (locked ? 1 : 0);
        end();
      }
    };
    tick();
    clockTimer = setInterval(tick, 250);
  } else clock.textContent = `No timer: ${rounds.length} rounds`;
  show();
  el.stop = () => {
    over = true;
    clearInterval(clockTimer);
    document.removeEventListener("keydown", onKey);
  };
  return el;
}
