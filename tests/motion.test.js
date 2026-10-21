import { test } from "node:test";
import assert from "node:assert/strict";
import { stepSpring, springEasing, SPRINGS } from "../js/ui/motion/spring.js";

const run = (cfg, seconds = 3, dt = 1 / 60) => {
  let s = { x: 0, v: 0 };
  let peak = 0;
  for (let t = 0; t < seconds; t += dt) {
    s = stepSpring(s, 1, cfg, dt);
    peak = Math.max(peak, s.x);
  }
  return { ...s, peak };
};

test("every spring settles on its target, at 30, 60 and 144 fps, without blowing up", () => {
  for (const [name, cfg] of Object.entries(SPRINGS)) {
    for (const fps of [30, 60, 144]) {
      const r = run(cfg, 4, 1 / fps);
      assert.ok(Math.abs(r.x - 1) < 0.01, `${name} at ${fps} fps ends at ${r.x}`);
      assert.ok(r.peak < 1.8, `${name} overshoots to ${r.peak}`);
    }
  }
  assert.ok(run(SPRINGS.bouncy).peak > 1.05, "bouncy really bounces");
  assert.ok(run(SPRINGS.snappy).peak < 1.06, "snappy barely overshoots");
});

test("springs become CSS linear() easings that start at 0 and end at 1", () => {
  for (const cfg of Object.values(SPRINGS)) {
    const { easing, seconds } = springEasing(cfg);
    const stops = easing.slice(7, -1).split(", ").map(Number);
    assert.ok(easing.startsWith("linear("));
    assert.equal(stops[0], 0);
    assert.equal(stops.at(-1), 1);
    assert.ok(stops.length >= 10 && stops.length <= 60, `${stops.length} stops`);
    assert.ok(seconds > 0.2 && seconds <= 2, `${seconds}s`);
  }
});
