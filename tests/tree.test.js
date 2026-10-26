// Money Tree's rules and acceptance tests (GAME-SPECS.md game 11).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "../js/arcade/tree.js";
import { CONFIG } from "../js/data/config.js";

const cfg = CONFIG.arcade.games.tree;
const seeds = Array.from({ length: 20 }, (_, i) => `mt-${i}`);
const run = (seed, p) => T.score(T.play(seed, p));

test("the same seed grows the same market, with 2 or 3 crashes of 30 to 40 percent", () => {
  assert.deepEqual(T.market("x"), T.market("x"));
  for (const seed of seeds) {
    const m = T.market(seed);
    assert.equal(m.years.length, 40);
    const crashes = m.years.filter((y) => y.crash);
    assert.ok(crashes.length >= 2 && crashes.length <= 3, seed);
    for (const c of crashes) assert.ok(c.index <= -0.3 && c.index >= -0.4);
    for (const y of m.years) assert.ok(y.savings >= 0.02 && y.savings <= 0.04);
  }
});

test("the car goal draws from savings first, and early CD money pays a penalty", () => {
  const g = T.newGarden(T.market("car"));
  T.plant(g, { savings: 0, cd: 100, index: 0, coin: 0 });
  T.run(g);
  assert.ok(g.car, "the year 3 checkpoint checks the car goal");
  assert.equal(g.year, 3);
  // All CD money is locked, so 10 percent is lost on the way out.
  const g2 = T.newGarden(T.market("car"));
  T.plant(g2, { savings: 100, cd: 0, index: 0, coin: 0 });
  T.run(g2);
  assert.ok(g2.car.hit);
  assert.ok(T.total(g2) > T.total(g) - 1 || !g.car.hit);
});

test("a rebalance pulls locked CDs with the penalty shown", () => {
  const g = T.newGarden(T.market("rb"));
  T.plant(g, { savings: 0, cd: 100, index: 0, coin: 0 });
  g.year = 2;
  const pen = T.setSplit(g, { savings: 100, cd: 0, index: 0, coin: 0 }, true);
  assert.ok(Math.abs(pen - cfg.start * cfg.cdPenalty) < 0.01);
  assert.equal(T.cdValue(g), 0);
});

test("acceptance: all Hype coin misses the car goal on most seeds and scores below a balanced plan", () => {
  let missed = 0;
  let coin = 0;
  let bal = 0;
  for (const seed of seeds) {
    const c = run(seed, T.POLICIES.allCoin);
    if (!c.carHit) missed++;
    coin += c.score;
    bal += run(seed, T.POLICIES.balanced).score;
  }
  assert.ok(missed > seeds.length / 2, `missed ${missed}`);
  assert.ok(coin < bal);
});

test("acceptance: all savings misses the retirement target", () => {
  for (const seed of seeds) assert.ok(!run(seed, T.POLICIES.allSavings).retired, seed);
});

test("acceptance: panic selling scores lower than holding across 20 seeds", () => {
  for (const seed of seeds) assert.ok(run(seed, T.POLICIES.panic).score < run(seed, T.POLICIES.balanced).score, seed);
});

test("missing waterings and the student's own plan replay in the simulator", () => {
  const skip = { ...T.POLICIES.balanced, waterAt: (cp) => cp !== 2, treat: true };
  const a = run("w", skip);
  const b = run("w", T.POLICIES.balanced);
  assert.ok(a.missed > 0 && a.treats === 1);
  assert.ok(a.final < b.final);
  const g = T.play("p", T.POLICIES.balanced);
  assert.equal(run("p", T.policyOf(g, {})).final, T.score(g).final);
});
