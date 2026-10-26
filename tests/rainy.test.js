// Rainy Day's rules and acceptance tests (GAME-SPECS.md game 10).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as R from "../js/arcade/rainy.js";
import { RD_EVENTS } from "../js/data/arcade/rainy.js";

const seeds = Array.from({ length: 12 }, (_, i) => `rd-${i}`);

test("40 event cards, one exclusion, and the same seed deals the same year", () => {
  assert.equal(RD_EVENTS.length, 40);
  assert.equal(RD_EVENTS.filter((e) => e.excluded).length, 1);
  assert.deepEqual(R.newYear("x"), R.newYear("x"));
  assert.equal(R.newYear("x").cards.length, 12);
});

test("deductibles split the cost, the fund pays first, and floods aren't covered by renters", () => {
  const year = R.newYear("split");
  year.cards = Array.from({ length: 12 }, () => ({ id: "q", tier: "quiet" }));
  year.cards[0] = { id: "m2", tier: "medium", policy: "health", title: "ER visit", cost: [1, 2], amount: 2000 };
  year.cards[1] = { id: "x1", tier: "medium", policy: "renters", excluded: true, title: "Flood", cost: [1, 2], amount: 3000 };
  const plan = { car: "none", renters: "low", health: "low", phone: "none", fund: 1000 };
  const r = R.runYear(year, plan);
  assert.equal(r.months[0].you, 500);
  assert.equal(r.months[0].ins, 1500);
  assert.equal(r.months[0].fromFund, 500);
  assert.equal(r.months[1].you, 3000, "the flood is excluded");
  assert.ok(r.months[1].excluded);
});

test("an at-fault car accident raises the car premium at the month 6 renewal", () => {
  const year = R.newYear("renew");
  year.cards = Array.from({ length: 12 }, () => ({ id: "q", tier: "quiet" }));
  year.cards[2] = { id: "m1", tier: "medium", policy: "car", atFault: true, title: "Fender bender", cost: [1, 2], amount: 2500 };
  const r = R.runYear(year, { car: "high", renters: "none", health: "none", phone: "none", fund: 0 });
  assert.ok(r.bumped);
  assert.ok(r.months[7].premiums > r.months[1].premiums);
});

test("acceptance: full low-deductible insurance has a lower Plan Strength than a balanced plan", () => {
  for (const seed of seeds) for (const fund of [0, 1500, 2500]) assert.ok(R.simulate(seed, R.PLANS.low(fund)).avg < R.simulate(seed, R.PLANS.balanced(fund)).avg, `${seed} fund ${fund}`);
});

test("acceptance: no insurance has a much worse worst 5 percent", () => {
  for (const seed of seeds) {
    const none = R.simulate(seed, R.PLANS.none(1500));
    const bal = R.simulate(seed, R.PLANS.balanced(1500));
    assert.ok(none.worst < bal.worst - 5000, `${seed}: ${none.worst} vs ${bal.worst}`);
  }
});

test("setting money aside in the fund helps, because checking gets spent", () => {
  for (const seed of seeds) assert.ok(R.simulate(seed, R.PLANS.balanced(2000)).avg > R.simulate(seed, R.PLANS.balanced(0)).avg, seed);
});
