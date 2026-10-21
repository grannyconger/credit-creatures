// Spring physics (Phase 15, teacher request 2026-10-21: "ridiculously smooth
// motion"). Springs have no fixed duration. They move like real things: a
// stiffness pulls toward the target, damping slows the wobble, mass makes it
// heavier. One shared requestAnimationFrame loop runs every live spring and
// sleeps when nothing moves or the tab is hidden.
// The math (stepSpring, springEasing) is pure, so it's tested in Node.

export const SPRINGS = {
  gentle: { stiffness: 120, damping: 14, mass: 1 },
  bouncy: { stiffness: 260, damping: 11, mass: 1 },
  snappy: { stiffness: 420, damping: 30, mass: 1 },
  wobbly: { stiffness: 180, damping: 8, mass: 1 },
};

const REST = 0.001;

// One physics step: semi-implicit Euler, stable at 60 to 240 fps.
export function stepSpring({ x, v }, target, { stiffness, damping, mass = 1 }, dt) {
  const force = -stiffness * (x - target) - damping * v;
  const nv = v + (force / mass) * dt;
  return { x: x + nv * dt, v: nv };
}

// Samples a spring from 0 to 1 as a CSS linear() easing, plus how long it
// takes to settle. CSS transitions then spring with no JavaScript at all.
export function springEasing(cfg, { maxSeconds = 2, points = 40 } = {}) {
  const dt = 1 / 240;
  const samples = [];
  let s = { x: 0, v: 0 };
  let t = 0;
  for (; t < maxSeconds; t += dt) {
    samples.push(s.x);
    s = stepSpring(s, 1, cfg, dt);
    if (Math.abs(s.x - 1) < REST && Math.abs(s.v) < REST * 10) break;
  }
  samples.push(1);
  const step = Math.max(1, Math.floor(samples.length / points));
  const stops = [];
  for (let i = 0; i < samples.length; i += step) stops.push(+samples[i].toFixed(3));
  if (stops.at(-1) !== 1) stops.push(1);
  return { easing: `linear(${stops.join(", ")})`, seconds: +Math.min(maxSeconds, t).toFixed(2) };
}

// ---------- Browser side: the shared loop ----------

const live = new Set();
let raf = 0;
let last = 0;

// Full motion unless the student picked Calm or the computer asks for less.
export function motionOn() {
  if (typeof document === "undefined") return false;
  if (document.documentElement.dataset.motion === "calm") return false;
  return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function tick(now) {
  const dt = Math.min(1 / 30, (now - (last || now)) / 1000) || 1 / 60;
  last = now;
  for (const a of live) {
    let moving = false;
    for (const k of Object.keys(a.target)) {
      const s = stepSpring(a.state[k], a.target[k], a.cfg, dt);
      a.state[k] = s;
      if (Math.abs(s.x - a.target[k]) > REST || Math.abs(s.v) > REST * 10) moving = true;
    }
    const values = Object.fromEntries(Object.entries(a.state).map(([k, s]) => [k, moving ? s.x : a.target[k]]));
    a.onUpdate(values);
    if (!moving) {
      live.delete(a);
      a.onDone?.(values);
    }
  }
  raf = live.size ? requestAnimationFrame(tick) : 0;
  if (!raf) last = 0;
}

// Springs { key: number } values toward targets and calls onUpdate each frame.
// Returns a handle: retarget(newTargets) keeps the current velocity, so a
// change of mind mid-motion stays smooth. stop() freezes it.
export function animate({ from, to, spring = SPRINGS.gentle, onUpdate, onDone }) {
  const a = {
    cfg: spring,
    state: Object.fromEntries(Object.entries(from).map(([k, x]) => [k, { x, v: 0 }])),
    target: { ...to },
    onUpdate,
    onDone,
  };
  if (!motionOn()) {
    onUpdate({ ...to });
    onDone?.({ ...to });
    return { retarget: (t) => (onUpdate({ ...to, ...t }), onDone?.({ ...to, ...t })), stop: () => {}, values: () => ({ ...to }) };
  }
  live.add(a);
  if (!raf) raf = requestAnimationFrame(tick);
  return {
    retarget(t) {
      Object.assign(a.target, t);
      for (const k of Object.keys(t)) a.state[k] ??= { x: t[k], v: 0 };
      if (!live.has(a)) live.add(a);
      if (!raf) raf = requestAnimationFrame(tick);
    },
    stop() {
      live.delete(a);
    },
    values: () => Object.fromEntries(Object.entries(a.state).map(([k, s]) => [k, s.x])),
  };
}

// Springs an element's own scale, rotate and translate CSS properties. These
// are separate from `transform`, so they never fight an element's layout
// transform. One handle per element, kept between calls.
const handles = new WeakMap();
export function springStyle(el, to, spring = SPRINGS.bouncy) {
  const apply = ({ scale = 1, rotate = 0, x = 0, y = 0 }) => {
    el.style.scale = scale === 1 ? "" : String(scale);
    el.style.rotate = rotate === 0 ? "" : `${rotate}deg`;
    el.style.translate = x === 0 && y === 0 ? "" : `${x}px ${y}px`;
  };
  const full = { scale: 1, rotate: 0, x: 0, y: 0, ...to };
  const h = handles.get(el);
  if (h) {
    h.retarget(full);
    return h;
  }
  const handle = animate({ from: { scale: 1, rotate: 0, x: 0, y: 0 }, to: full, spring, onUpdate: apply, onDone: (v) => (v.scale === 1 && !v.rotate && !v.x && !v.y ? handles.delete(el) : null) });
  handles.set(el, handle);
  return handle;
}

// Publishes the springs as CSS easing tokens (--ease-gentle, --ease-bouncy,
// --ease-snappy, --ease-wobbly) with matching durations (--dur-*).
export function publishSpringTokens(root = document.documentElement) {
  for (const [name, cfg] of Object.entries(SPRINGS)) {
    const { easing, seconds } = springEasing(cfg);
    root.style.setProperty(`--ease-${name}`, easing);
    root.style.setProperty(`--dur-${name}`, `${seconds}s`);
  }
}
