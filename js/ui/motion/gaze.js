// Living creatures (Phase 17, docs/MOTION.md). One tracker for every creature
// on screen: pupils spring toward the pointer (kept inside the eye), each
// creature blinks every 3 to 6 seconds, the eyes widen when the pointer comes
// close, and the eyes wander when nobody's moving. On a touch screen they
// follow the last tap. react("happy" | "worried") makes every creature on
// screen hop or wobble. All of it stops under Calm or reduce motion.
// lookAt() is pure, so it's tested in Node.
import { motionOn } from "./spring.js";

const MIN_SIZE = 48; // smaller avatars hold still
const REACH = 160; // px: how far the pointer has to be for a full look
const CLOSE = 0.9; // widen when the pointer is within this many creature widths

// Where a pupil should sit: toward the target, at most max away from the eye.
// ex, ey: the eye in screen px. tx, ty: the target. Returns { x, y } in px.
export function lookAt(ex, ey, tx, ty, max, reach = REACH) {
  const dx = tx - ex;
  const dy = ty - ey;
  const d = Math.hypot(dx, dy);
  if (!d) return { x: 0, y: 0 };
  const k = (Math.min(d, reach) / reach) * max;
  return { x: (dx / d) * k, y: (dy / d) * k };
}

const seen = new Set(); // creature SVGs being watched
const visible = new Set();
const state = new WeakMap(); // svg -> { eyes: [{ el, cx, cy, max, x, y }], blinkAt }
let io = null;
let raf = 0;
let last = 0;
const pointer = { x: (globalThis.innerWidth || 0) / 2, y: (globalThis.innerHeight || 0) / 3, at: 0 };
let wander = { x: pointer.x, y: pointer.y, at: 0 };

function setup(svg) {
  const eyes = [...svg.querySelectorAll(".cc-eye[data-cx]")].map((g) => ({ el: g.querySelector(".cc-pupil"), cx: +g.dataset.cx, cy: +g.dataset.cy, max: +g.dataset.max, x: 0, y: 0 }));
  state.set(svg, { eyes, blinkAt: performance.now() + 1500 + Math.random() * 3500 });
}

function scan() {
  for (const svg of document.querySelectorAll("svg.cc")) {
    if (seen.has(svg)) continue;
    seen.add(svg);
    setup(svg);
    io.observe(svg);
  }
  for (const svg of seen) {
    if (!svg.isConnected) {
      seen.delete(svg);
      visible.delete(svg);
      io.unobserve(svg);
    }
  }
}

function target(now) {
  // Nobody has moved for a while: the eyes drift around on their own.
  if (now - pointer.at > 5000) {
    if (now - wander.at > 2200 + Math.random() * 1800) wander = { x: Math.random() * innerWidth, y: Math.random() * innerHeight * 0.8, at: now };
    return wander;
  }
  return pointer;
}

function frame(now) {
  raf = 0;
  if (!motionOn()) return rest();
  if (document.hidden || !visible.size) return;
  const dt = Math.min(1 / 30, (now - (last || now)) / 1000) || 1 / 60;
  last = now;
  const t = target(now);
  let moving = false;
  for (const svg of visible) {
    const st = state.get(svg);
    if (!st) continue;
    if (now > st.blinkAt) {
      svg.classList.add("cc-blinking");
      setTimeout(() => svg.classList.remove("cc-blinking"), 170);
      st.blinkAt = now + 3000 + Math.random() * 3000;
    }
    const r = svg.getBoundingClientRect();
    if (r.width < MIN_SIZE) continue;
    const scale = r.width / 200;
    for (const eye of st.eyes) {
      if (!eye.el) continue;
      const want = lookAt(r.left + eye.cx * scale, r.top + eye.cy * scale, t.x, t.y, eye.max * scale);
      // A soft spring: quick to follow, no jitter.
      const k = Math.min(1, dt * 12);
      const nx = eye.x + (want.x / scale - eye.x) * k;
      const ny = eye.y + (want.y / scale - eye.y) * k;
      if (Math.abs(nx - eye.x) + Math.abs(ny - eye.y) > 0.01) moving = true;
      eye.x = nx;
      eye.y = ny;
      eye.el.setAttribute("transform", `translate(${eye.x.toFixed(2)} ${eye.y.toFixed(2)})`);
    }
    const near = Math.hypot(t.x - (r.left + r.width / 2), t.y - (r.top + r.height / 2)) < r.width * CLOSE && t === pointer;
    svg.classList.toggle("cc-close", near);
  }
  // Settled eyes check back a few times a second (for blinks and wandering)
  // instead of every frame, so the tracker costs almost nothing at rest.
  if (moving) raf = requestAnimationFrame(frame);
  else {
    raf = -1;
    idle = setTimeout(() => {
      raf = 0;
      wake();
    }, 120);
  }
}

let idle = 0;
function wake() {
  if (raf === -1 && performance.now() - pointer.at < 50) {
    clearTimeout(idle);
    raf = 0;
  }
  if (!raf && visible.size && motionOn()) raf = requestAnimationFrame(frame);
}

// Every creature on screen hops (happy) or wobbles (worried) for a moment.
export function react(kind) {
  if (!motionOn() || !io) return;
  scan();
  // Creatures just drawn haven't been seen by the observer yet, so check each one.
  for (const svg of seen) {
    const r = svg.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
    svg.classList.remove("cc-react-happy", "cc-react-worried");
    void svg.getBoundingClientRect();
    svg.classList.add(`cc-react-${kind}`);
    setTimeout(() => svg.classList.remove(`cc-react-${kind}`), 900);
  }
}

// Calm: every pupil goes back to the middle and holds still.
function rest() {
  for (const svg of seen) {
    const st = state.get(svg);
    for (const eye of st?.eyes || []) {
      eye.x = eye.y = 0;
      eye.el?.removeAttribute("transform");
    }
    svg.classList.remove("cc-close", "cc-blinking");
  }
}

export function installGaze() {
  if (io || typeof IntersectionObserver === "undefined") return;
  io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
    wake();
  });
  addEventListener("pointermove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.at = performance.now();
    wake();
  }, { passive: true });
  // Touch: the eyes follow the last tap.
  addEventListener("pointerdown", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.at = performance.now();
    wake();
  }, { passive: true });
  document.addEventListener("visibilitychange", wake);
  addEventListener("cc:settings", () => (motionOn() ? wake() : rest()));
  // New creatures appear as screens change, so look for them now and then.
  scan();
  setInterval(() => {
    scan();
    wake();
  }, 700);
}
