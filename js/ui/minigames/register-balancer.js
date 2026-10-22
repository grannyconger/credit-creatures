// Register Balancer (teacher request 2026-10-22, idea 1). A check register
// with a starting balance. Each line comes one at a time and the student types
// the new running balance on the keypad. Two lines are mistakes (a duplicate
// charge, or a charge much bigger than its receipt) to Dispute instead. A
// wrong answer shows the math, and the right balance carries forward, so one
// slip doesn't snowball.
import { h, fill } from "../dom.js";
import { sfx } from "../sound.js";
import { createRng } from "../../engine/index.js";
import { CONFIG } from "../../data/config.js";
import { registerLines, fmt } from "./gen.js";
import { keypad } from "./keypad.js";

export function registerBalancer({ seed, timed, onDone, track }) {
  const cfg = CONFIG.play.jobs.register;
  const rng = createRng(seed);
  const started = Date.now();
  const { start, lines } = registerLines(rng, { count: cfg.lines });
  let i = 0;
  let bal = start;
  let right = 0;
  let wrong = 0;
  let over = false;
  let clockTimer = 0;
  const misses = [];

  const clock = h("span.mg-clock", { role: "timer" });
  const score = h("span.mg-score");
  const body = h("tbody");
  const flash = h("p.mg-flash", { role: "status" });
  const pad = keypad({ label: "New balance", checkText: "Enter balance", onCheck: (c) => answer(c) });
  const dispute = h("button.rg-dispute", { type: "button", "data-sound": "none", "aria-keyshortcuts": "D", onclick: () => answer("dispute") }, "Dispute this line");
  const el = h(
    "div.minigame.register",
    h("div.mg-bar", clock, score),
    h(
      "div.rg-layout",
      h(
        "div.rg-book",
        h("table.rg-table", h("caption.sr-only", "Your check register"), h("thead", h("tr", h("th", "Date"), h("th", "What"), h("th.num", "Amount"), h("th.num", "Balance"))), body)
      ),
      h("div.rg-side", pad.el, dispute, h("p.cash-keys-help", "Type the new balance, then Enter. Press D to dispute a line that looks wrong."))
    ),
    flash
  );

  const paintScore = () => (score.textContent = `✓ ${right}   ✗ ${wrong}`);

  function row(line, { current = false, result = null } = {}) {
    const amount = line.amount > 0 ? `+ ${fmt(line.amount)}` : `− ${fmt(-line.amount)}`;
    return h(
      "tr",
      { class: `${current ? "current" : ""}${line.error && result ? " disputed" : ""}` },
      h("td", line.date),
      h("td", line.label, line.receipt ? h("small.rg-receipt", ` Receipt says ${fmt(line.receipt)}`) : null),
      h("td.num", amount),
      h("td.num", current ? h("span.rg-blank", "?") : line.error ? h("span", fmt(line.balance), h("small", " (disputed)")) : fmt(line.balance), result ? h("span.rg-mark", { "aria-label": result === "right" ? "right" : "wrong" }, result === "right" ? " ✓" : " ✗") : null)
    );
  }

  const results = [];
  function paint() {
    fill(
      body,
      h("tr.start", h("td", ""), h("td", "Starting balance"), h("td.num", ""), h("td.num", fmt(start))),
      lines.slice(0, i).map((l, k) => row(l, { result: results[k] })),
      i < lines.length ? row(lines[i], { current: true }) : null
    );
    body.querySelector("tr.current")?.scrollIntoView({ block: "nearest" });
    paintScore();
  }

  function answer(given) {
    if (over || i >= lines.length) return;
    const line = lines[i];
    const ok = line.error ? given === "dispute" : given === line.balance;
    if (ok) {
      right++;
      sfx.correct();
      flash.className = "mg-flash good";
      flash.textContent = line.error ? `✓ Good catch. ${line.error === "duplicate" ? "That's the same charge twice." : `The receipt says ${fmt(line.receipt)}, not ${fmt(-line.amount)}.`} Disputing it keeps your money.` : `✓ ${fmt(bal)} ${line.amount > 0 ? "+" : "−"} ${fmt(Math.abs(line.amount))} = ${fmt(line.balance)}`;
    } else {
      wrong++;
      sfx.error();
      flash.className = "mg-flash bad";
      let why;
      if (line.error) why = `This line was a mistake: ${line.error === "duplicate" ? "the same charge twice" : `the receipt says ${fmt(line.receipt)}`}. Dispute it so it doesn't come out of your balance.`;
      else if (given === "dispute") why = `This charge was real. ${fmt(bal)} ${line.amount > 0 ? "+" : "−"} ${fmt(Math.abs(line.amount))} = ${fmt(line.balance)}.`;
      else why = `${fmt(bal)} ${line.amount > 0 ? "+" : "−"} ${fmt(Math.abs(line.amount))} = ${fmt(line.balance)}. You wrote ${fmt(given)}.`;
      flash.textContent = `✗ ${why}`;
      misses.push(`${line.label}: ${why}`);
    }
    track("registerLine", { line: i, error: line.error || "", disputed: given === "dispute", right: ok });
    results[i] = ok ? "right" : "wrong";
    // The right balance carries forward either way.
    bal = line.balance;
    i++;
    pad.reset();
    paint();
    if (i >= lines.length) end();
  }

  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, .calc, dialog")) return;
    if (e.key === "d" || e.key === "D") {
      e.preventDefault();
      answer("dispute");
    }
  }
  document.addEventListener("keydown", onKey);

  function end() {
    if (over) return;
    over = true;
    clearInterval(clockTimer);
    pad.setDisabled(true);
    pad.unbind();
    dispute.disabled = true;
    document.removeEventListener("keydown", onKey);
    sfx.questComplete();
    track("minigameEnd", { game: "register", right, wrong, timed });
    setTimeout(() => onDone({ right, wrong, total: lines.length, seconds: Math.round((Date.now() - started) / 1000), misses }), 900);
  }

  if (timed) {
    const endAt = Date.now() + cfg.seconds * 1000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      clock.textContent = `⏱️ ${left}s`;
      if (left <= 0 && !over) {
        // Lines not reached count as missed, so the pay stays fair.
        for (let k = i; k < lines.length; k++) misses.push(`${lines[k].label}: not reached before time ran out.`);
        wrong += lines.length - i;
        end();
      }
    };
    tick();
    clockTimer = setInterval(tick, 250);
  } else clock.textContent = `No timer: ${lines.length} lines`;
  paint();
  el.stop = () => {
    over = true;
    clearInterval(clockTimer);
    pad.unbind();
    document.removeEventListener("keydown", onKey);
  };
  return el;
}
