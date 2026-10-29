// A small calculator that opens inside a minigame (teacher request
// 2026-10-22: students were opening a new tab to do the change math). The
// math is pure (press), so it's tested in Node. calculator() builds the panel.
import { h } from "../dom.js";

// Money math stays in cents so 20 - 13.47 is 6.53, not 6.529999.
const round = (n) => Math.round(n * 100) / 100;
const OPS = { "+": (a, b) => a + b, "−": (a, b) => a - b, "×": (a, b) => a * b, "÷": (a, b) => (b === 0 ? NaN : a / b) };

// expr is the sum so far in words ("12.5 × 4 ="), so a student can see what was just worked out.
// done is true right after "=", when a new button press starts a new calculation.
export const START = { display: "0", acc: null, op: null, fresh: true, expr: "", done: false };

// state: { display, acc, op, fresh }. key: a digit, ".", an operator, "=", "C" or "⌫".
export function press(state, key) {
  const s = { ...state };
  if (s.display === "Error" && key !== "C") return state;
  if (/^[0-9]$/.test(key)) {
    if (s.done) (s.expr = ""), (s.done = false);
    if (s.fresh || s.display === "0") s.display = key;
    else if (s.display.replace(/[^0-9]/g, "").length < 9) s.display += key;
    s.fresh = false;
    return s;
  }
  if (key === ".") {
    if (s.done) (s.expr = ""), (s.done = false);
    if (s.fresh) s.display = "0.";
    else if (!s.display.includes(".")) s.display += ".";
    s.fresh = false;
    return s;
  }
  if (key === "C") return { ...START };
  if (key === "⌫") {
    if (s.fresh) return s;
    s.display = s.display.length > 1 ? s.display.slice(0, -1) : "0";
    return s;
  }
  if (key in OPS || key === "=") {
    const x = Number(s.display);
    if (s.op && !s.fresh) {
      s.expr = `${s.expr} ${s.display}`;
      s.acc = round(OPS[s.op](s.acc, x));
    } else if (!s.op) {
      s.acc = x;
      s.expr = show(x);
    }
    s.display = Number.isFinite(s.acc) ? show(s.acc) : "Error";
    if (key === "=") {
      if (s.op && s.fresh) s.expr = s.expr.replace(/ [+−×÷]$/, "");
      s.expr = `${s.expr} =`;
      s.done = true;
      s.op = null;
      s.acc = null;
    } else {
      s.expr = s.op && s.fresh ? `${s.expr.slice(0, -1)}${key}` : `${s.expr} ${key}`;
      s.op = key;
      s.done = false;
    }
    s.fresh = true;
    return s;
  }
  return state;
}

function show(n) {
  return String(round(n));
}

const KEYS = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "=", "+"];
const TYPED = { "*": "×", x: "×", "/": "÷", "-": "−", "+": "+", Enter: "=", "=": "=", Backspace: "⌫", Escape: "C", c: "C", C: "C", ".": "." };

// onUse() runs the first time a key is pressed in this panel (telemetry).
export function calculator({ onUse } = {}) {
  let state = { ...START };
  let used = false;
  const screen = h("output.calc-screen", { "aria-live": "polite", "aria-label": "Calculator display" }, state.display);
  const expr = h("p.calc-expr", { "aria-hidden": "true" }, "\u00a0");
  const tap = (key) => {
    state = press(state, key);
    screen.textContent = state.display;
    expr.textContent = state.expr || "\u00a0";
    newBtn.classList.toggle("ready", state.done);
    if (!used) {
      used = true;
      onUse?.();
    }
  };
  const key = (k, cls = "") => h("button.calc-key", { type: "button", "data-sound": "none", class: cls, "aria-label": k === "⌫" ? "Delete" : k === "C" ? "New calculation. Clears everything" : k, onclick: () => tap(k) }, k === "C" ? "New" : k);
  const newBtn = key("C", "calc-fn calc-new");
  const panel = h(
    "aside.calc",
    { "aria-label": "Calculator", tabindex: "-1" },
    expr,
    h("div.calc-top", screen, key("⌫", "calc-fn"), newBtn),
    h("div.calc-keys", KEYS.map((k) => key(k, k in OPS || k === "=" ? "calc-op" : "")))
  );
  // Typing works only while the calculator has focus, so it never answers
  // anything in the game by mistake.
  panel.addEventListener("keydown", (e) => {
    const k = /^[0-9]$/.test(e.key) ? e.key : TYPED[e.key];
    if (!k) return;
    e.preventDefault();
    e.stopPropagation();
    tap(k);
  });
  return panel;
}

// A "Calculator" button and the slot it opens into, for any screen with a question on it.
// Put toggle in the tools row and slot where the calculator should appear.
// onOpen() and onUse() are for telemetry.
export function calcWidget({ onOpen, onUse } = {}) {
  const slot = h("div.calc-slot");
  const toggle = h("button.calc-toggle", { type: "button", "aria-expanded": "false", "data-sound": "none" }, "Calculator");
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Hide calculator" : "Calculator";
    slot.replaceChildren(...(open ? [calculator({ onUse })] : []));
    if (open) {
      onOpen?.();
      slot.querySelector(".calc")?.focus({ preventScroll: true });
    }
  });
  return { toggle, slot };
}
