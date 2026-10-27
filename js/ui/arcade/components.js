// Reusable Arcade pieces (GAME-SPECS.md 2.9 and 2.10): the timer ring, echo
// callouts, coach marks, the cash timeline, the event card, the document
// inspector and the 100-run bars. Each is built once and themed per game by the
// cabinet's --g-* colors. State is never shown by color alone: every danger
// mark has an icon and words too.
import { h, fill, money } from "../dom.js";
import { icon } from "../icons.js";
import { CONFIG } from "../../data/config.js";

const reduced = () => Boolean(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) || document.documentElement.dataset.motion === "calm";

// ---------- Timer ring ----------

// A ring that empties plus the seconds left as a number.
export function timerRing({ size = 46, label = "Time left" } = {}) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const el = h("span.arc-ring", { role: "timer", "aria-label": label });
  el.innerHTML = `<svg viewBox="0 0 44 44" width="${size}" height="${size}" aria-hidden="true"><circle cx="22" cy="22" r="${r}" class="arc-ring-track"/><circle cx="22" cy="22" r="${r}" class="arc-ring-fill" stroke-dasharray="${c}" stroke-dashoffset="0" transform="rotate(-90 22 22)"/></svg>`;
  const num = h("span.arc-ring-num");
  el.append(num);
  const fillC = el.querySelector(".arc-ring-fill");
  el.set = (left, total) => {
    const f = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
    fillC.setAttribute("stroke-dashoffset", String(c * (1 - f)));
    num.textContent = `${Math.max(0, Math.ceil(left))}s`;
    el.classList.toggle("low", f <= 0.25);
    el.setAttribute("aria-valuetext", `${Math.max(0, Math.ceil(left))} seconds`);
  };
  return el;
}

// ---------- Echo callouts (2.9) ----------

// A small tag tied to its cause, visible for a few seconds, and logged for the
// results screen's echo recap.
export function echoHost() {
  const el = h("div.arc-echoes", { "aria-live": "polite" });
  const log = [];
  el.log = log;
  // log: false for a plain notice that isn't a consequence (not in the recap).
  el.push = (text, { kind = "bad", log: keep = true } = {}) => {
    if (keep) log.push({ text, kind });
    const tag = h("p.arc-echo", { class: kind }, icon(kind === "good" ? "up" : kind === "safe" ? "info" : "alert", { size: 16 }), h("span", text));
    el.append(tag);
    // Never more than two tags on screen, so they don't cover the game.
    while (el.children.length > 2) el.firstElementChild.remove();
    setTimeout(() => tag.classList.add("leaving"), CONFIG.arcade.echoMs);
    setTimeout(() => tag.remove(), CONFIG.arcade.echoMs + 400);
  };
  return el;
}

// ---------- Coach marks (2.2) ----------

// Points at one element with one sentence and a "Got it" button (Enter).
// Resolves when the student presses it.
// The training coach (teacher request 2026-10-27: bigger, and plum so it
// stands out from every game's skin). It lives on the page, not in the
// frame, so the frame's edges never cut it off. It sits beside its target,
// or below or above when there's no room, and never under the top and bottom bars.
export function coachMark(frame, target, text) {
  return new Promise((resolve) => {
    const box = h("div.arc-coach.bst-scope", { role: "dialog", "aria-label": "Coach" });
    let watch = null;
    const done = () => {
      document.removeEventListener("keydown", onKey, true);
      removeEventListener("resize", place);
      removeEventListener("scroll", place, true);
      clearInterval(watch);
      target?.classList.remove("arc-coached");
      box.remove();
      resolve();
    };
    const got = h("button.arc-coach-ok", { type: "button", onclick: done }, "Got it");
    const onKey = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        done();
      }
    };
    box.append(h("p", icon("compass", { size: 22 }), " ", text), got);
    document.body.append(box);
    target?.classList.add("arc-coached");
    function place() {
      const gap = 14;
      const top = (document.getElementById("topbar")?.getBoundingClientRect().bottom || 0) + 8;
      const bar = document.getElementById("bottombar");
      const bottom = (bar && !bar.hidden ? bar.getBoundingClientRect().top : innerHeight) - 8;
      const bw = box.offsetWidth;
      const bh = box.offsetHeight;
      const t = (target || frame).getBoundingClientRect();
      const fitsX = (x) => x >= 8 && x + bw <= innerWidth - 8;
      const fitsY = (y) => y >= top && y + bh <= bottom;
      const clampX = (x) => Math.max(8, Math.min(innerWidth - bw - 8, x));
      const clampY = (y) => Math.max(top, Math.min(bottom - bh, y));
      const spots = target
        ? [
            [t.right + gap, clampY(t.top)],
            [t.left - bw - gap, clampY(t.top)],
            [clampX(t.left), t.bottom + gap],
            [clampX(t.left), t.top - bh - gap],
          ]
        : [];
      const [x, y] = spots.find(([sx, sy]) => fitsX(sx) && fitsY(sy)) || [clampX(innerWidth - bw - 24), clampY(bottom - bh)];
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
    }
    place();
    addEventListener("resize", place);
    addEventListener("scroll", place, true);
    // If the shift closes while the coach is up, the coach goes too.
    watch = setInterval(() => !frame.isConnected && done(), 500);
    document.addEventListener("keydown", onKey, true);
    got.focus();
  });
}

// ---------- Cash timeline (2.10) ----------

// balances[i] is the balance at the end of day (or week) i + 1. chips are
// { at, text, kind: "pay" | "bill" | "fee" | "event" | "good" }. Days below $0
// draw as a dashed segment with a warning icon and words. today marks progress.
export function cashTimeline({ unit = "Day", title = "Your balance" } = {}) {
  const el = h("figure.arc-timeline");
  const W = 900;
  const H = 150;
  const PAD = { l: 52, r: 12, t: 14, b: 22 };
  el.update = ({ balances, chips = [], today = null, forecastFrom = null }) => {
    const n = balances.length;
    const lo = Math.min(0, ...balances);
    const hi = Math.max(100, ...balances);
    const span = hi - lo || 1;
    const x = (i) => PAD.l + ((W - PAD.l - PAD.r) * (i + 0.5)) / n;
    const y = (v) => PAD.t + (H - PAD.t - PAD.b) * (1 - (v - lo) / span);
    let solid = "";
    let dashed = "";
    let forecast = "";
    for (let i = 1; i < n; i++) {
      const seg = `M${x(i - 1)} ${y(balances[i - 1])}L${x(i)} ${y(balances[i])}`;
      if (balances[i] < 0 || balances[i - 1] < 0) dashed += seg;
      else if (forecastFrom != null && i > forecastFrom) forecast += seg;
      else solid += seg;
    }
    const firstBelow = balances.findIndex((b) => b < 0);
    const ticks = Array.from({ length: n }, (_, i) => i).filter((i) => n <= 14 || i % 5 === 4 || i === 0);
    const svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M${PAD.l} ${y(0)}H${W - PAD.r}" class="arc-tl-zero"/>
      <text x="${PAD.l - 6}" y="${y(0) + 4}" text-anchor="end" class="arc-tl-axis">$0</text>
      <text x="${PAD.l - 6}" y="${PAD.t + 8}" text-anchor="end" class="arc-tl-axis">${money(Math.round(hi))}</text>
      ${today != null ? `<rect x="${x(today) - 6}" y="${PAD.t}" width="12" height="${H - PAD.t - PAD.b}" class="arc-tl-today"/>` : ""}
      <path d="${solid}" class="arc-tl-line"/>
      <path d="${forecast}" class="arc-tl-line forecast"/>
      <path d="${dashed}" class="arc-tl-line below"/>
      ${ticks.map((i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" class="arc-tl-axis">${i + 1}</text>`).join("")}
    </svg>`;
    // One cell per day, so chips never wrap into extra rows. Each chip is an icon
    // with its words in a tooltip and its label, so color is never alone.
    const byDay = new Map();
    for (const c of chips) (byDay.get(c.at) || byDay.set(c.at, []).get(c.at)).push(c);
    const ICON = { pay: "up", good: "up", fee: "alert", event: "info", bill: "receipt" };
    const chipRow = h(
      "div.arc-tl-chips",
      { style: `--n: ${n}` },
      [...byDay.entries()].map(([at, list]) =>
        h(
          "span.arc-tl-day",
          { style: `grid-column: ${at + 1}` },
          list.map((c) => h("span.arc-tl-chip", { class: c.kind, title: `${unit} ${at + 1}: ${c.text}`, tabindex: "0", "aria-label": `${unit} ${at + 1}: ${c.text}` }, icon(ICON[c.kind] || "info", { size: 13 })))
        )
      )
    );
    const warn = firstBelow >= 0 ? h("figcaption.arc-tl-warn", icon("alert", { size: 18 }), ` Below $0 on ${unit.toLowerCase()} ${firstBelow + 1}`) : h("figcaption.arc-tl-ok", icon("check", { size: 18 }), " Above $0 every " + unit.toLowerCase());
    fill(el, h("div.arc-tl-head", h("strong", title), warn), h("div.arc-tl-plot", { html: svg }), chipRow);
  };
  return el;
}

// ---------- Event card (2.10) ----------

// A situation with two choices (Left and Right arrows), or one Flip (Space).
// timer: seconds for the card, or null. onPick(index or null on time out).
export function eventCard({ title, text, choices = [], timer = null, tag = null, onPick }) {
  let done = false;
  let tick = null;
  const ring = timer ? timerRing() : null;
  const pick = (i) => {
    if (done) return;
    done = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
    el.querySelectorAll(".arc-ev-choice").forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
    onPick(i);
  };
  // One choice flips with Space, two use the arrows, more use number keys.
  const many = choices.length > 2;
  const keys = choices.length === 1 ? ["Space"] : many ? choices.map((_, i) => String(i + 1)) : ["Left arrow", "Right arrow"];
  const btns = choices.map((c, i) =>
    h(
      "button.arc-ev-choice",
      { type: "button", "aria-keyshortcuts": choices.length === 1 ? "Space" : many ? String(i + 1) : i === 0 ? "ArrowLeft" : "ArrowRight", onclick: () => pick(i) },
      choices.length === 2 ? icon(i === 0 ? "back" : "next", { size: 18 }) : null,
      h("strong", c.label),
      c.detail ? h("small", c.detail) : null,
      h("kbd", keys[i] || "")
    )
  );
  const el = h("article.arc-event", reduced() ? { class: "still" } : {}, h("header.arc-ev-head", tag ? h("span.arc-ev-tag", tag) : null, h("h4", title), ring), h("p.arc-ev-text", text), h("div.arc-ev-choices", { class: choices.length === 1 ? "one" : many ? "many" : "" }, btns));
  function onKey(e) {
    if (e.target.closest?.("input, textarea, select, dialog") || e.altKey || e.ctrlKey || e.metaKey) return;
    if (many && /^[1-9]$/.test(e.key) && Number(e.key) <= choices.length) (e.preventDefault(), pick(Number(e.key) - 1));
    else if (choices.length === 2 && e.key === "ArrowLeft") (e.preventDefault(), pick(0));
    else if (choices.length === 2 && e.key === "ArrowRight") (e.preventDefault(), pick(1));
    else if (choices.length === 1 && e.key === " ") (e.preventDefault(), pick(0));
  }
  document.addEventListener("keydown", onKey);
  if (timer) {
    const end = Date.now() + timer * 1000;
    const step = () => {
      const left = (end - Date.now()) / 1000;
      ring.set(left, timer);
      if (left <= 0) pick(null);
    };
    step();
    tick = setInterval(step, 200);
  }
  el.stop = () => {
    done = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
  };
  // Pauses a timed card (a coach mark or the pause key). Returns resume().
  el.pause = () => {
    if (!timer || done) return () => {};
    clearInterval(tick);
    const left = Number(ring.querySelector(".arc-ring-num").textContent.replace("s", "")) || 0;
    return () => {
      const end = Date.now() + left * 1000;
      tick = setInterval(() => {
        const l = (end - Date.now()) / 1000;
        ring.set(l, timer);
        if (l <= 0) pick(null);
      }, 200);
    };
  };
  return el;
}

// ---------- Document inspector (2.10) ----------

// A document of lines. Tab moves focus, Enter or Space marks. A marked line
// shows an outline, an icon and the word "Marked". Tap again to unmark.
// lines: [{ id, cells: [text, ...], note }]. onToggle(id, marked).
export function docInspector({ title, lines, marked = new Set(), onToggle, locked = false, className = "" }) {
  const el = h("div.arc-doc", { class: className, role: "group", "aria-label": title });
  const rows = lines.map((l) => {
    const b = h(
      "button.arc-doc-line",
      { type: "button", "aria-pressed": String(marked.has(l.id)), disabled: locked, "data-id": l.id },
      l.cells.map((c, i) => h("span.arc-doc-cell", { class: `c${i}` }, c)),
      h("span.arc-doc-mark", icon("check", { size: 16 }), " Marked")
    );
    b.addEventListener("click", () => {
      if (el.locked) return;
      const now = !marked.has(l.id);
      if (now) marked.add(l.id);
      else marked.delete(l.id);
      b.setAttribute("aria-pressed", String(now));
      onToggle?.(l.id, now);
    });
    return b;
  });
  el.append(title ? h("h4.arc-doc-title", title) : null, h("div.arc-doc-lines", rows));
  el.locked = locked;
  el.lock = () => {
    el.locked = true;
    rows.forEach((r) => (r.disabled = true));
  };
  // After a check: marks each line right or wrong, with a word, not color alone.
  el.grade = (verdicts) => {
    for (const r of rows) {
      const v = verdicts[r.dataset.id];
      if (!v) continue;
      r.classList.add(`v-${v.kind}`);
      r.append(h("span.arc-doc-verdict", icon(v.kind === "right" ? "check" : "alert", { size: 14 }), ` ${v.text}`));
    }
  };
  return el;
}

// ---------- 100-run simulator bars (2.10) ----------

// rows: [{ label, avg, best, worst }] in dollars. Bars are labeled with numbers.
export function simBars({ title, rows, fmt = money, note = "" }) {
  const max = Math.max(1, ...rows.flatMap((r) => [Math.abs(r.avg), Math.abs(r.best), Math.abs(r.worst)]));
  const bar = (v, kind, label) =>
    h("div.arc-sim-bar", { class: kind }, h("span.arc-sim-k", label), h("span.arc-sim-track", h("span.arc-sim-fill", { class: v < 0 ? "neg" : "", style: `width: ${Math.round((Math.abs(v) / max) * 100)}%` })), h("strong", (v < 0 ? "" : "") + fmt(v)));
  return h(
    "figure.arc-sim",
    title ? h("figcaption", h("strong", title), note ? h("small", ` ${note}`) : null) : null,
    rows.map((r) => h("div.arc-sim-row", { class: r.mine ? "mine" : "" }, h("h5", r.mine ? icon("star", { size: 14 }) : null, r.label), bar(r.avg, "avg", "Average"), bar(r.best, "best", "Best"), bar(r.worst, "worst", "Worst 5%")))
  );
}

// ---------- Small helpers ----------

// A keyboard map line under a game.
export const keyHelp = (text) => h("p.arc-keys", icon("info", { size: 14 }), ` Keys: ${text}`);

// A label for simplified numbers (1.3).
export const simplified = (extra = "") => h("small.arc-simplified", `Simplified for learning${extra ? `, ${extra}` : ""}.`);
