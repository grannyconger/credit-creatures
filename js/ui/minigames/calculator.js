// A small calculator that opens inside a minigame (teacher request
// 2026-10-22: students were opening a new tab to do the change math). The
// math is pure (press), so it's tested in Node. calculator() builds the panel.
import { h } from "../dom.js";

// Money math stays in cents so 20 - 13.47 is 6.53, not 6.529999.
const round = (n) => Math.round(n * 100) / 100;
const OPS = { "+": (a, b) => a + b, "−": (a, b) => a - b, "×": (a, b) => a * b, "÷": (a, b) => (b === 0 ? NaN : a / b) };

export const START = { display: "0", acc: null, op: null, fresh: true };

// state: { display, acc, op, fresh }. key: a digit, ".", an operator, "=", "C" or "⌫".
export function press(state, key) {
  const s = { ...state };
  if (s.display === "Error" && key !== "C") return state;
  if (/^[0-9]$/.test(key)) {
    if (s.fresh || s.display === "0") s.display = key;
    else if (s.display.replace(/[^0-9]/g, "").length < 9) s.display += key;
    s.fresh = false;
    return s;
  }
  if (key === ".") {
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
    if (s.op && !s.fresh) s.acc = round(OPS[s.op](s.acc, x));
    else if (s.acc == null || !s.op) s.acc = x;
    s.display = Number.isFinite(s.acc) ? show(s.acc) : "Error";
    s.op = key === "=" ? null : key;
    s.fresh = true;
    if (key === "=") s.acc = null;
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
  const tap = (key) => {
    state = press(state, key);
    screen.textContent = state.display;
    if (!used) {
      used = true;
      onUse?.();
    }
  };
  const key = (k, cls = "") => h("button.calc-key", { type: "button", "data-sound": "none", class: cls, "aria-label": k === "⌫" ? "Delete" : k === "C" ? "Clear" : k, onclick: () => tap(k) }, k);
  const panel = h(
    "aside.calc",
    { "aria-label": "Calculator", tabindex: "-1" },
    h("div.calc-top", screen, key("⌫", "calc-fn"), key("C", "calc-fn")),
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
