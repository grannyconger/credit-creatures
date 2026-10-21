// Small celebrations (visual plan item 8): coins flying into checking,
// confetti and a statement stamp. Every effect is skipped under reduced motion,
// and none of them carries meaning on its own (the words always say it too).
import { h } from "./dom.js";
import { sfx } from "./sound.js";

const reduced = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Coins fly from an element (a Collect button) to the Checking chip, or to the
// creature in the top bar when no chip is on screen. chime: ms to wait before
// the coin sound (0 plays it right away).
export function coinsFly(from, { chime = 0 } = {}) {
  if (chime) setTimeout(sfx.coinGain, chime);
  else sfx.coinGain();
  if (reduced() || !from?.getBoundingClientRect) return;
  const target = document.querySelector(".money-chips li") || document.getElementById("who");
  if (!target) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const sx = a.left + a.width / 2;
  const sy = a.top + a.height / 2;
  const tx = b.left + Math.min(40, b.width / 2);
  const ty = b.top + b.height / 2;
  for (let i = 0; i < 9; i++) {
    const coin = h("span.fx-coin", { "aria-hidden": "true" });
    coin.style.left = `${sx}px`;
    coin.style.top = `${sy}px`;
    document.body.append(coin);
    const spread = (i - 4) * 14;
    const anim = coin.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.6)", opacity: 0 },
        { transform: `translate(calc(-50% + ${spread}px), calc(-50% - ${50 + Math.abs(spread)}px)) scale(1)`, opacity: 1, offset: 0.35 },
        { transform: `translate(calc(-50% + ${tx - sx}px), calc(-50% + ${ty - sy}px)) scale(0.5)`, opacity: 0.9 },
      ],
      { duration: 750 + i * 40, delay: i * 45, easing: "cubic-bezier(.3,.7,.4,1)", fill: "backwards" }
    );
    anim.onfinish = () => coin.remove();
  }
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
