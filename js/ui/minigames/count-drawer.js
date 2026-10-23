// Count the Drawer (teacher request 2026-10-22, idea 7): the mirror of
// Cashier Rush. At closing, count each pile of bills and coins with a stepper
// (the running total shows as you go). Then add the starting float to the
// sales on the register tape, and say whether the drawer is over, short or
// exact. Two drawers a shift. Uses the same bills and coins as Cashier Rush.
import { h, fill } from "../dom.js";
import { sfx } from "../arcade-sound.js";
import { createRng } from "../../engine/index.js";
import { CONFIG } from "../../data/config.js";
import { DENOMINATIONS } from "../../data/minigames.js";
import { makeDrawer, overShort, fmt } from "./gen.js";
import { label, pieceClass, pieceFace, coinSize } from "./money-art.js";
import { keypad } from "./keypad.js";

export function countDrawer({ seed, timed, onDone, track }) {
  const cfg = CONFIG.play.jobs.drawer;
  const rng = createRng(seed);
  const started = Date.now();
  const drawers = Array.from({ length: cfg.drawers }, () => makeDrawer(rng));
  let d = 0;
  let right = 0;
  let wrong = 0;
  let over = false;
  let clockTimer = 0;
  let pad = null;
  const misses = [];
  const total = cfg.drawers * (DENOMINATIONS.length + 2);

  const clock = h("span.mg-clock", { role: "timer" });
  const score = h("span.mg-score");
  const stage = h("div.dr-stage");
  const flash = h("p.mg-flash", { role: "status" });
  const el = h("div.minigame.drawer", h("div.mg-bar", clock, score), stage, flash);
  const paintScore = () => (score.textContent = `✓ ${right}   ✗ ${wrong}`);

  // A pile you can count: bills fanned out, coins in a heap. The count is in
  // the label for screen readers, since they can't count the picture.
  function pile(denom, n) {
    return h(
      "div.dr-pile",
      { role: "img", "aria-label": `${n} ${label(denom)} ${denom >= 100 ? "bills" : "coins"}`, class: denom >= 100 ? "bills" : "coins" },
      n ? Array.from({ length: n }, (_, i) => h("span.cash-piece.dr-piece", { class: pieceClass(denom), style: denom < 100 ? `${coinSize(denom, 0.55)}; --i: ${i}` : `--i: ${i}`, "aria-hidden": "true" }, ...pieceFace(denom))) : h("span.dr-none", "none")
    );
  }

  function countStep() {
    const dr = drawers[d];
    const counts = Object.fromEntries(DENOMINATIONS.map((x) => [x, 0]));
    const running = h("strong.dr-running");
    const paintRunning = () => (running.textContent = fmt(DENOMINATIONS.reduce((s, x) => s + x * counts[x], 0)));
    const stepper = (x) => {
      const out = h("output.dr-count", { "aria-live": "polite" }, "0");
      const set = (v) => {
        counts[x] = Math.max(0, Math.min(40, v));
        out.textContent = String(counts[x]);
        paintRunning();
      };
      return h(
        "div.dr-stepper",
        h("button.dr-minus", { type: "button", "data-sound": "none", "aria-label": `One less ${label(x)}`, onclick: () => set(counts[x] - 1) }, "−"),
        out,
        h("button.dr-plus", { type: "button", "data-sound": "none", "aria-label": `One more ${label(x)}`, onclick: () => set(counts[x] + 1) }, "+")
      );
    };
    const done = h("button.big.dr-done", { type: "button", "data-sound": "none", "data-autofocus": "" }, "Done counting");
    done.addEventListener("click", () => {
      done.disabled = true;
      let got = 0;
      for (const x of DENOMINATIONS) {
        const ok = counts[x] === dr.counts[x];
        if (ok) got++;
        else misses.push(`Drawer ${d + 1}, ${label(x)}: there were ${dr.counts[x]}, you counted ${counts[x]}.`);
        stage.querySelector(`[data-denom="${x}"]`)?.classList.add(ok ? "dr-right" : "dr-wrong");
        const note = stage.querySelector(`[data-denom="${x}"] .dr-check`);
        if (note) note.textContent = ok ? "✓ right" : `✗ it's ${dr.counts[x]}`;
      }
      right += got;
      wrong += DENOMINATIONS.length - got;
      (got === DENOMINATIONS.length ? sfx.correct : sfx.error)();
      flash.className = `mg-flash ${got === DENOMINATIONS.length ? "good" : "bad"}`;
      flash.textContent = got === DENOMINATIONS.length ? `✓ Every pile counted right. The drawer has ${fmt(dr.total)}.` : `${got} of ${DENOMINATIONS.length} piles right. The drawer really has ${fmt(dr.total)}.`;
      track("drawerCount", { drawer: d, right: got });
      paintScore();
      setTimeout(() => !over && tapeStep(), got === DENOMINATIONS.length ? 1100 : 2600);
    });
    fill(
      stage,
      h("p.dr-title", h("strong", `Drawer ${d + 1} of ${drawers.length}: count each pile`)),
      h(
        "div.dr-grid",
        DENOMINATIONS.map((x) => h("div.dr-slot", { "data-denom": x }, h("span.dr-name", label(x)), pile(x, dr.counts[x]), stepper(x), h("small.dr-check")))
      ),
      h("div.row.dr-foot", h("span.dr-total", "Your count: ", running), done)
    );
    paintRunning();
    flash.textContent = "";
    stage.querySelector("[data-autofocus]")?.focus();
  }

  function tapeStep() {
    const dr = drawers[d];
    const expected = dr.float + dr.sales;
    let typed = null;
    const choices = h("div.row.dr-choices");
    pad = keypad({
      label: "Expected cash",
      checkText: "Check expected cash",
      onCheck: (c) => {
        if (typed !== null) return;
        typed = c;
        const ok = c === expected;
        if (ok) right++;
        else {
          wrong++;
          misses.push(`Drawer ${d + 1}: expected cash is the float plus sales, ${fmt(dr.float)} + ${fmt(dr.sales)} = ${fmt(expected)}.`);
        }
        (ok ? sfx.correct : sfx.error)();
        flash.className = `mg-flash ${ok ? "good" : "bad"}`;
        flash.textContent = `${ok ? "✓" : "✗"} ${fmt(dr.float)} + ${fmt(dr.sales)} = ${fmt(expected)} should be in the drawer.`;
        pad.setDisabled(true);
        paintScore();
        fill(
          choices,
          h("p.dr-ask", `The drawer has ${fmt(dr.total)}. Is it over, short or exact?`),
          ...["over", "short", "exact"].map((k) => h("button", { type: "button", "data-sound": "none", onclick: () => pick(k) }, k === "over" ? "Over" : k === "short" ? "Short" : "Exact"))
        );
        choices.querySelector("button")?.focus();
      },
    });
    const pick = (k) => {
      if (choices.dataset.done) return;
      choices.dataset.done = "1";
      const ans = overShort(dr.diff);
      const ok = k === ans;
      if (ok) right++;
      else {
        wrong++;
        misses.push(`Drawer ${d + 1}: ${fmt(dr.total)} counted vs ${fmt(expected)} expected is ${ans === "exact" ? "exact" : `${fmt(Math.abs(dr.diff))} ${ans}`}.`);
      }
      (ok ? sfx.correct : sfx.error)();
      flash.className = `mg-flash ${ok ? "good" : "bad"}`;
      flash.textContent = `${ok ? "✓" : "✗"} ${ans === "exact" ? "Exact. The drawer matches the tape." : `${fmt(Math.abs(dr.diff))} ${ans}. ${ans === "short" ? "Short means less cash than there should be." : "Over means more cash than there should be."}`}`;
      choices.querySelectorAll("button").forEach((b) => (b.disabled = true));
      paintScore();
      pad.unbind();
      pad = null;
      d++;
      setTimeout(() => !over && (d < drawers.length ? countStep() : end()), 2200);
    };
    fill(
      stage,
      h("p.dr-title", h("strong", `Drawer ${d + 1}: check it against the register tape`)),
      h(
        "div.dr-tape-row",
        h(
          "div.dr-tape",
          h("p", "Starting cash (the float) ", h("strong", fmt(dr.float))),
          h("p", "Sales on the tape ", h("strong", fmt(dr.sales))),
          h("p", "Counted in the drawer ", h("strong", fmt(dr.total))),
          h("p.note", "Expected cash = float + sales.")
        ),
        pad.el
      ),
      choices
    );
  }

  function end() {
    if (over) return;
    over = true;
    clearInterval(clockTimer);
    pad?.unbind();
    sfx.questComplete();
    track("minigameEnd", { game: "drawer", right, wrong, timed });
    onDone({ right, wrong, total, seconds: Math.round((Date.now() - started) / 1000), misses });
  }

  if (timed) {
    const endAt = Date.now() + cfg.seconds * 1000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      clock.textContent = `⏱️ ${left}s`;
      if (left <= 0 && !over) {
        wrong = Math.max(wrong, total - right);
        end();
      }
    };
    tick();
    clockTimer = setInterval(tick, 250);
  } else clock.textContent = `No timer: ${drawers.length} drawers`;
  paintScore();
  countStep();
  el.stop = () => {
    over = true;
    clearInterval(clockTimer);
    pad?.unbind();
  };
  return el;
}
