import { test } from "node:test";
import assert from "node:assert/strict";
import { stepParticle, addTo, MAX } from "../js/ui/motion/particles.js";
import { iconSvg, ICON_NAMES } from "../js/ui/icons.js";

const particle = (extra = {}) => ({ x: 0, y: 0, vx: 0, vy: 0, spin: 1, angle: 0, life: 1, age: 0, drag: 0, gravity: 1, ...extra });

test("particles fall with gravity, spin, and end when their life is up", () => {
  const p = particle({ vx: 100 });
  for (let i = 0; i < 10; i++) assert.equal(stepParticle(p, 1 / 60), true);
  assert.ok(p.y > 0, "gravity pulls it down");
  assert.ok(p.x > 0, "it keeps moving sideways");
  assert.ok(p.angle > 0, "it spins");
  let alive = true;
  for (let i = 0; i < 120 && alive; i++) alive = stepParticle(p, 1 / 60);
  assert.equal(alive, false);
});

test("drag slows a particle and negative gravity floats it up", () => {
  const slow = particle({ vx: 200, drag: 0.1, gravity: 0 });
  stepParticle(slow, 1 / 60);
  assert.ok(slow.vx < 200);
  const mote = particle({ gravity: -0.5 });
  stepParticle(mote, 1 / 60);
  stepParticle(mote, 1 / 60);
  assert.ok(mote.y < 0);
});

test("homing coins end up at their target", () => {
  const coin = particle({ vy: -400, life: 1.2, home: { x: 300, y: -200 }, homeAfter: 0.3 });
  for (let i = 0; i < 70; i++) stepParticle(coin, 1 / 60);
  assert.ok(Math.abs(coin.x - 300) < 6 && Math.abs(coin.y + 200) < 6, `${coin.x}, ${coin.y}`);
});

test("the pool never holds more than MAX particles", () => {
  const pool = [];
  addTo(pool, Array.from({ length: MAX + 25 }, (_, i) => particle({ id: i })));
  assert.equal(pool.length, MAX);
  assert.equal(pool[0].id, 25, "the oldest ones are recycled");
});

test("every icon can draw itself in and names itself for its hover move", () => {
  for (const name of ICON_NAMES) {
    const svg = iconSvg(name);
    assert.ok(svg.includes(`data-ico="${name}"`), name);
    const shapes = svg.match(/<(path|circle|rect|line|polyline|polygon|ellipse)\b[^>]*>/g) || [];
    assert.ok(shapes.length > 0, name);
    for (const s of shapes) assert.ok(s.includes('pathLength="1"'), `${name}: ${s}`);
  }
  assert.ok(iconSvg("gear", { draw: true }).includes('class="ico ico-draw"'));
});
