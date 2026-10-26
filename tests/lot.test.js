// The Lot's rules and acceptance tests (GAME-SPECS.md game 8).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as L from "../js/arcade/lot.js";
import { LOT_CARS, LOT_ADDONS } from "../js/data/arcade/lot.js";
import { amortizedPayment } from "../js/engine/index.js";

const seeds = Array.from({ length: 40 }, (_, i) => `lt-${i}`);
const run = (seed, bot) => L.score(L.play(seed, bot));

test("9 car templates, 3 of each type, and the amortization check from the spec", () => {
  assert.equal(LOT_CARS.length, 9);
  for (const t of ["flashy", "certified", "older"]) assert.equal(LOT_CARS.filter((c) => c.type === t).length, 3);
  assert.equal(amortizedPayment(10000, 0.06, 36), 304.22);
  assert.equal(LOT_ADDONS.length, 4);
});

test("the first offer always uses a long term, and a shorter term lowers the total", () => {
  for (const seed of seeds) {
    const s = L.newState(L.newShift(seed));
    L.preapprove(s, true);
    L.pickCar(s, 1);
    assert.ok(s.offer.term >= 60);
    const before = L.offerMath(s.offer);
    L.counter(s, "term");
    const after = L.offerMath(s.offer);
    assert.ok(after.monthly > before.monthly && after.total < before.total, seed);
  }
});

test("beating the credit union rate only works with preapproval and within its limit", () => {
  const s = L.newState(L.newShift("rate"));
  L.preapprove(s, false);
  L.pickCar(s, 1);
  assert.equal(L.counter(s, "rate").ok, false);
  const t = L.newState(L.newShift("rate"));
  L.preapprove(t, true);
  L.pickCar(t, 1);
  assert.ok(L.counter(t, "rate").ok);
  assert.ok(t.offer.apr < t.pre.apr);
  const f = L.newState(L.newShift("rate"));
  L.preapprove(f, true);
  L.pickCar(f, 0);
  assert.equal(L.counter(f, "rate").ok, false, "the flashy loan is bigger than the preapproval");
});

test("acceptance: always picking the cheapest car scores below a balanced choice on most seeds", () => {
  const lower = seeds.filter((seed) => run(seed, L.cheapestBot).score < run(seed, L.balancedBot).score).length;
  assert.ok(lower >= seeds.length * 0.8, `${lower} of ${seeds.length}`);
});

test("acceptance: always walking away loses the car often enough to score lower", () => {
  const noCar = seeds.filter((seed) => run(seed, L.walkerBot).noCar).length;
  assert.ok(noCar >= seeds.length * 0.4, `${noCar} of ${seeds.length}`);
  const avg = (bot) => seeds.reduce((t, seed) => t + run(seed, bot).score, 0) / seeds.length;
  assert.ok(avg(L.walkerBot) < avg(L.balancedBot));
});

test("acceptance: accepting the first offer scores lowest among those who drive off", () => {
  for (const seed of seeds) {
    const first = run(seed, L.firstOfferBot).score;
    assert.ok(first < run(seed, L.balancedBot).score, seed);
    assert.ok(first < run(seed, L.cheapestBot).score || first <= 200, seed);
  }
});
