// Number tickers (Phase 15): when money, the score or XP changes, the number
// rolls from the old value to the new one instead of jumping. A critically
// damped spring, so money never overshoots and looks wrong for a moment.
import { animate, motionOn } from "./spring.js";

const SETTLE = { stiffness: 90, damping: 19, mass: 1 };
const shown = new Map();

// key: what the number is ("Checking"). Remembers the last value shown, so
// the next render of the same key rolls from it.
export function countTo(el, key, value, format) {
  const from = shown.get(key);
  shown.set(key, value);
  if (from == null || from === value || !motionOn()) return;
  el.textContent = format(from);
  const cls = value > from ? "tick-up" : "tick-down";
  el.classList.add(cls);
  animate({
    from: { n: from },
    to: { n: value },
    spring: SETTLE,
    onUpdate: ({ n }) => (el.textContent = format(n)),
    onDone: () => {
      el.textContent = format(value);
      el.classList.remove(cls);
    },
  });
}
