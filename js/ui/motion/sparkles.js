// Sparkles (Phase 16, docs/MOTION.md): little four-point stars that twinkle
// around anything new or waiting for the student, in the style of Josh
// Comeau's sparkles. Mark an element with data-sparkle and one shared timer
// does the rest, so new screens get it for free. A sparkle never says anything
// by itself: the element always has words too.
import { motionOn } from "./spring.js";

const EVERY_MS = 450;
const LIFE_MS = 900;
const MAX_HOSTS = 8;
const STAR = '<svg viewBox="0 0 68 68" aria-hidden="true" focusable="false"><path d="M26.5 25.5C19 33.4 0 34 0 34s19.1.7 26.7 8.5c7.6 7.8 8.3 26.9 8.3 26.9s.6-19.2 8.2-27c7.6-7.9 26.8-8.7 26.8-8.7s-19.2-.8-26.8-8.6C35.6 17.4 35 0 35 0s-.8 17.7-8.5 25.5z"/></svg>';

let timer = 0;

function visible(el) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
}

function spawn(host) {
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  const star = document.createElement("span");
  star.className = "fx-sparkle";
  star.innerHTML = STAR;
  const size = 12 + Math.random() * 12;
  star.style.width = star.style.height = `${size}px`;
  // Around the edge, a little outside the element's box.
  star.style.left = `${-6 + Math.random() * 112}%`;
  star.style.top = `${-18 + Math.random() * 136}%`;
  host.append(star);
  setTimeout(() => star.remove(), LIFE_MS);
}

function tick() {
  if (!motionOn() || document.hidden) return;
  const hosts = [...document.querySelectorAll("[data-sparkle]")].filter(visible).slice(0, MAX_HOSTS);
  for (const host of hosts) if (Math.random() < 0.7) spawn(host);
}

export function installSparkles() {
  if (!timer) timer = setInterval(tick, EVERY_MS);
}
