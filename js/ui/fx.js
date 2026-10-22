// Small celebrations (visual plan item 8, canvas coins since Phase 16): coins flying into checking,
// confetti and a statement stamp. Every effect is skipped under reduced motion,
// and none of them carries meaning on its own (the words always say it too).
import { h } from "./dom.js";
import { sfx } from "./sound.js";
import { burstFrom } from "./motion/particles.js";

const reduced = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Coins fly from an element (a Collect button) to the Checking chip, or to the
// creature in the top bar when no chip is on screen. chime: ms to wait before
// the coin sound (0 plays it right away).
export function coinsFly(from, { chime = 0 } = {}) {
  if (chime) setTimeout(sfx.coinGain, chime);
  else sfx.coinGain();
  if (!from?.getBoundingClientRect) return;
  const target = document.querySelector(".money-chips li") || document.getElementById("who");
  if (!target) return;
  const b = target.getBoundingClientRect();
  // Phase 16: the coins are canvas particles now (js/ui/motion/particles.js).
  // They hop up, then tumble into the Checking line. Off under Calm.
  burstFrom(from, "coins", { to: { x: b.left + Math.min(40, b.width / 2), y: b.top + b.height / 2 } });
  if (reduced()) return;
  setTimeout(() => {
    target.classList.add("fx-bump");
    setTimeout(() => target.classList.remove("fx-bump"), 450);
  }, 900);
}

// Confetti pieces for a pop-up. Returns an element to put inside it.
export function confetti(n = 42) {
  const box = h("div.fx-confetti", { "aria-hidden": "true" });
  if (reduced()) return box;
  const colors = ["#f2c84b", "#5b3fc4", "#e05a7a", "#2a78d6", "#1baf7a", "#eb6834"];
  for (let i = 0; i < n; i++) {
    const p = h("span");
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${Math.random() * 0.5}s`;
    p.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
    p.style.setProperty("--spin", `${Math.random() * 720 - 360}deg`);
    p.style.setProperty("--drift", `${Math.random() * 80 - 40}px`);
    box.append(p);
  }
  return box;
}

// A rubber stamp for a statement. land: animate it landing (the newest one).
export function stamp(text, tone, land = false) {
  const el = h("span.fx-stamp", { class: `${tone}${land && !reduced() ? " land" : ""}` }, text);
  if (land) setTimeout(sfx.stamp, 260);
  return el;
}
