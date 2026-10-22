// Boops and squishes (Phase 15). A "boop" (Josh Comeau's name for it) is a
// tiny hover pop: the icon in a button twists and grows for a moment, then
// springs back on its own. Pressing a button squishes it a little, and letting
// go bounces it back. One set of listeners on the page covers every button,
// chip and map place, so new screens get it for free.
// data-boop="rotate" | "scale" | "wiggle" | "none" picks the style for an element.
import { springStyle, SPRINGS, motionOn } from "./spring.js";

const PRESSABLE = "button:not(:disabled), .chip, a.brand";
const BOOPABLE = "button:not(:disabled), .chip, .place, .place-row, [data-boop], a.brand";
const STYLES = {
  rotate: { rotate: 12, scale: 1.12 },
  scale: { scale: 1.18 },
  wiggle: { rotate: -10 },
};
const BOOP_MS = 160;
// Icons with their own hover move in css/app.css (Phase 16) skip the boop.
const OWN_MOVE = new Set(["gear", "compass", "coins", "piggy", "wallet", "inbox", "trophy", "star", "sparkle", "lock", "check", "home", "next", "back", "lantern", "volume"]);
const booping = new WeakSet();

function boopTarget(el) {
  if (el.matches("[data-boop]:not(button)")) return el;
  return el.querySelector(":scope svg.ico") || el.querySelector("svg.ico");
}

function boop(el) {
  const kind = el.dataset.boop || (el.matches(".place, .place-row") ? "scale" : "rotate");
  if (kind === "none") return;
  const target = boopTarget(el);
  if (!target || booping.has(target) || OWN_MOVE.has(target.dataset?.ico)) return;
  booping.add(target);
  springStyle(target, STYLES[kind] || STYLES.rotate, SPRINGS.bouncy);
  setTimeout(() => {
    springStyle(target, {}, SPRINGS.wobbly);
    booping.delete(target);
  }, BOOP_MS);
}

export function installBoops(root = document) {
  root.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch" || !motionOn()) return;
    const el = e.target.closest?.(BOOPABLE);
    if (el && !el.contains(e.relatedTarget)) boop(el);
  });
  // Touch and keyboard users get the boop on press and focus instead.
  root.addEventListener("focusin", (e) => {
    if (!motionOn() || !e.target.matches?.(":focus-visible")) return;
    const el = e.target.closest?.(BOOPABLE);
    if (el) boop(el);
  });
  let pressed = null;
  const release = () => {
    if (!pressed) return;
    springStyle(pressed, {}, SPRINGS.bouncy);
    pressed = null;
  };
  root.addEventListener("pointerdown", (e) => {
    if (!motionOn() || e.button > 0) return;
    const el = e.target.closest?.(PRESSABLE);
    if (!el || el.closest(".kingdom-stage")) return;
    pressed = el;
    springStyle(el, { scale: 0.95 }, SPRINGS.snappy);
    if (e.pointerType === "touch") boop(el);
  });
  for (const type of ["pointerup", "pointercancel", "dragstart"]) root.addEventListener(type, release);
  root.addEventListener("pointerout", (e) => {
    if (pressed && !pressed.contains(e.relatedTarget)) release();
  });
}
