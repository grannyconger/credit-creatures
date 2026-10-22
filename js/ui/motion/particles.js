// Particles (Phase 16, docs/MOTION.md), drawn for the Mossy Bestiary: coins
// that tumble into checking, leaves and seeds for unlocks, ink dust when
// buying, foxfire motes for a right call, and hearts when a creature is petted.
// One pooled system on a canvas (the page's, or one inside an open pop-up,
// since a modal sits above everything else), capped at MAX live particles.
// The physics (stepParticle) is pure, so it's tested in Node. Nothing here
// carries meaning on its own: the words on screen always say it too.
import { motionOn } from "./spring.js";

export const MAX = 80;
const GRAVITY = 900; // px per second squared

// One step of a particle's life. dt in seconds. Returns false when it's done.
// p: { x, y, vx, vy, spin, angle, life, age, drag, gravity, home?, homeAfter? }
export function stepParticle(p, dt) {
  p.age += dt;
  if (p.age >= p.life) return false;
  if (p.home && p.age > p.homeAfter) {
    // Steer toward the target, like a coin pulled into a purse.
    const k = Math.min(1, (p.age - p.homeAfter) / (p.life - p.homeAfter));
    p.x += (p.home.x - p.x) * Math.min(1, dt * (4 + 18 * k));
    p.y += (p.home.y - p.y) * Math.min(1, dt * (4 + 18 * k));
  } else {
    const drag = Math.pow(1 - p.drag, dt * 60);
    p.vx *= drag;
    p.vy = p.vy * drag + GRAVITY * p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  p.angle += p.spin * dt;
  return true;
}

// The pool: adding past MAX recycles the oldest, so a burst never piles up.
export function addTo(pool, list) {
  for (const p of list) {
    if (pool.length >= MAX) pool.shift();
    pool.push(p);
  }
  return pool;
}

// ---------- presets ----------

const rand = (a, b) => a + Math.random() * (b - a);

function make(kind, x, y, extra = {}) {
  return { kind, x, y, vx: 0, vy: 0, spin: 0, angle: rand(0, Math.PI * 2), life: 1, age: 0, drag: 0.04, gravity: 1, size: 8, ...extra };
}

const PRESETS = {
  // Coins hop up from the button, then tumble into the Checking line.
  coins: (x, y, { n = 10, to } = {}) =>
    Array.from({ length: n }, (_, i) =>
      make("coin", x, y, { vx: rand(-260, 260), vy: rand(-620, -380), spin: rand(-8, 8), life: rand(0.9, 1.25), size: rand(7, 10), drag: 0.03, home: to, homeAfter: 0.32 + i * 0.02 })
    ),
  // Leaves and seeds drift out for an unlock or an achievement.
  leaves: (x, y, { n = 26 } = {}) =>
    Array.from({ length: n }, () => {
      const a = rand(0, Math.PI * 2);
      const v = rand(180, 520);
      return make(Math.random() < 0.7 ? "leaf" : "seed", x, y, { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 220, spin: rand(-5, 5), life: rand(1.4, 2.2), size: rand(6, 11), drag: 0.06, gravity: 0.32 });
    }),
  // A small puff of ink dust when something is bought.
  dust: (x, y, { n = 14 } = {}) =>
    Array.from({ length: n }, () => make("dust", x + rand(-20, 20), y + rand(-6, 6), { vx: rand(-140, 140), vy: rand(-160, -40), life: rand(0.5, 0.9), size: rand(4, 9), drag: 0.1, gravity: 0.15 })),
  // Foxfire motes rise for a right answer.
  motes: (x, y, { n = 16 } = {}) =>
    Array.from({ length: n }, () => make("mote", x + rand(-30, 30), y + rand(-10, 10), { vx: rand(-90, 90), vy: rand(-320, -120), life: rand(0.8, 1.3), size: rand(3, 6), drag: 0.05, gravity: -0.05 })),
  // Hearts float up when a creature is petted.
  hearts: (x, y, { n = 7 } = {}) =>
    Array.from({ length: n }, () => make("heart", x + rand(-30, 30), y, { vx: rand(-80, 80), vy: rand(-280, -170), spin: rand(-1.5, 1.5), angle: rand(-0.4, 0.4), life: rand(1, 1.4), size: rand(12, 18), drag: 0.05, gravity: -0.1 })),
};

// ---------- drawing ----------

// Colors come from the bestiary tokens, read once from the top bar (a
// .bst-scope element), so dark mode and future palettes follow along.
let colors = null;
function palette() {
  if (colors) return colors;
  const el = document.getElementById("topbar") || document.documentElement;
  const css = getComputedStyle(el);
  const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  colors = {
    gold: v("--b-gold", "#d9a441"),
    goldInk: v("--b-gold-ink", "#8a6416"),
    moss: [v("--b-moss-1", "#5d8a3c"), v("--b-moss-2", "#6c9446"), v("--b-fern", "#6f9a4f")],
    rust: v("--b-rust", "#b5532e"),
    ink: v("--b-ink-soft", "#3d4a43"),
    foxfire: v("--b-foxfire", "#c8e04b"),
    plum: v("--b-plum", "#5b2a4e"),
  };
  return colors;
}
globalThis.addEventListener?.("cc:settings", () => (colors = null));

function draw(ctx, p) {
  const c = palette();
  const fade = 1 - Math.max(0, (p.age - p.life * 0.65) / (p.life * 0.35));
  ctx.save();
  ctx.globalAlpha = Math.max(0, fade);
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  const s = p.size;
  if (p.kind === "coin") {
    // A coin flips by squashing its width as it turns.
    ctx.scale(Math.max(0.15, Math.abs(Math.cos(p.angle * 1.7))), 1);
    ctx.fillStyle = c.gold;
    ctx.strokeStyle = c.goldInk;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
    ctx.stroke();
  } else if (p.kind === "leaf") {
    ctx.fillStyle = c.moss[Math.floor(s) % 3];
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = c.ink;
    ctx.globalAlpha *= 0.5;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(s, 0);
    ctx.stroke();
  } else if (p.kind === "seed") {
    ctx.fillStyle = Math.floor(s) % 2 ? c.gold : c.rust;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.45, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === "dust") {
    ctx.fillStyle = c.ink;
    ctx.globalAlpha *= 0.35;
    ctx.beginPath();
    ctx.arc(0, 0, s * (0.6 + p.age / p.life), 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === "mote") {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2.4);
    g.addColorStop(0, c.foxfire);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, s * 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === "heart") {
    ctx.fillStyle = c.rust;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s, -s * 0.3, -s * 0.5, -s, 0, -s * 0.45);
    ctx.bezierCurveTo(s * 0.5, -s, s, -s * 0.3, 0, s * 0.35);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- the canvas and its loop ----------

const layers = new Map(); // host element -> { canvas, ctx, pool }
let raf = 0;
let last = 0;

function layerFor(host) {
  let layer = layers.get(host);
  if (layer && layer.canvas.isConnected) return layer;
  const canvas = document.createElement("canvas");
  canvas.className = "fx-particles";
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);
  layer = { canvas, ctx: canvas.getContext("2d"), pool: [] };
  layers.set(host, layer);
  return layer;
}

function size(layer) {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const w = innerWidth;
  const hgt = innerHeight;
  if (layer.canvas.width !== Math.round(w * dpr) || layer.canvas.height !== Math.round(hgt * dpr)) {
    layer.canvas.width = Math.round(w * dpr);
    layer.canvas.height = Math.round(hgt * dpr);
  }
  layer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function frame(now) {
  const dt = Math.min(1 / 30, (now - (last || now)) / 1000) || 1 / 60;
  last = now;
  let alive = 0;
  for (const [host, layer] of layers) {
    if (!layer.canvas.isConnected) {
      layers.delete(host);
      continue;
    }
    size(layer);
    layer.ctx.clearRect(0, 0, innerWidth, innerHeight);
    layer.pool = layer.pool.filter((p) => stepParticle(p, dt));
    for (const p of layer.pool) draw(layer.ctx, p);
    alive += layer.pool.length;
    if (!layer.pool.length) {
      layer.canvas.remove();
      layers.delete(host);
    }
  }
  raf = alive ? requestAnimationFrame(frame) : 0;
  if (!raf) last = 0;
}

// burst("coins", { x, y }) in screen pixels. Options go to the preset (n, to).
// Inside an open pop-up the particles draw in the pop-up's own layer.
export function burst(kind, { x, y, ...opts }) {
  if (!motionOn() || !PRESETS[kind]) return;
  const host = document.querySelector("dialog[open]") || document.body;
  const layer = layerFor(host);
  addTo(layer.pool, PRESETS[kind](x, y, opts));
  if (!raf) raf = requestAnimationFrame(frame);
}

// The middle of an element, in screen pixels.
export function centerOf(el, dy = 0) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 + dy };
}

export function burstFrom(el, kind, opts = {}) {
  if (!el?.getBoundingClientRect) return;
  burst(kind, { ...centerOf(el), ...opts });
}
