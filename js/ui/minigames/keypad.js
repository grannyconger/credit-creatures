// A money keypad (teacher request 2026-10-22, for Register Balancer and Count
// the Drawer). It fills from the right like an ATM: typing 1, 2, 3, 4 shows
// $12.34, so there's no decimal point to get wrong. Amounts are whole cents.
// Keys work from the keyboard too: digits, Backspace, Escape to clear and
// Enter to check (never while typing in the calculator or a text box).
import { h } from "../dom.js";

const MAX_DIGITS = 8;

// Pure: the cents shown after pressing a key.
export function keyCents(cents, key) {
  if (/^[0-9]$/.test(key)) return String(cents).length >= MAX_DIGITS ? cents : cents * 10 + Number(key);
  if (key === "00") return keyCents(keyCents(cents, "0"), "0");
  if (key === "⌫") return Math.floor(cents / 10);
  if (key === "C") return 0;
  return cents;
}

// onCheck(cents) runs on Check or Enter. Returns { el, reset, setDisabled, unbind }.
export function keypad({ label = "Amount", checkText = "Check", onCheck }) {
  let cents = 0;
  let disabled = false;
  const screen = h("output.kp-screen", { "aria-live": "polite", "aria-label": label }, "$0.00");
  const paint = () => (screen.textContent = `$${(cents / 100).toFixed(2)}`);
  const press = (k) => {
    if (disabled) return;
    cents = keyCents(cents, k);
    paint();
  };
  const check = h("button.kp-check", { type: "button", "data-sound": "none", "aria-keyshortcuts": "Enter", onclick: () => !disabled && onCheck(cents) }, checkText);
  const key = (k) => h("button.kp-key", { type: "button", "data-sound": "none", "aria-label": k === "⌫" ? "Delete" : k === "C" ? "Clear" : k, onclick: () => press(k) }, k);
  const el = h(
    "div.keypad",
    h("div.kp-top", h("span.kp-label", label), screen),
    h("div.kp-keys", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map(key)),
    check
  );
  const onKey = (e) => {
    if (disabled || e.altKey || e.ctrlKey || e.metaKey || !el.isConnected) return;
    if (e.target.closest?.("input, textarea, select, .calc, dialog")) return;
    const k = /^[0-9]$/.test(e.key) ? e.key : { Backspace: "⌫", Escape: "C" }[e.key];
    if (k) {
      e.preventDefault();
      press(k);
    } else if (e.key === "Enter" && !e.target.closest?.("button:not(.kp-key)")) {
      e.preventDefault();
      onCheck(cents);
    }
  };
  document.addEventListener("keydown", onKey);
  return {
    el,
    reset() {
      cents = 0;
      paint();
    },
    setDisabled(v) {
      disabled = v;
      check.disabled = v;
    },
    unbind: () => document.removeEventListener("keydown", onKey),
  };
}
