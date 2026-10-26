// Pay in 4's rules and acceptance tests (GAME-SPECS.md game 4).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as P from "../js/arcade/payin4.js";
import { CONFIG } from "../js/data/config.js";

const seeds = Array.from({ length: 40 }, (_, i) => `p4-${i}`);
const run = (s, bot) => P.score(P.play(P.newShift(s), bot));

test("the same seed deals the same twelve weeks", () => {
  assert.deepEqual(P.newShift("same"), P.newShift("same"));
  const m = P.newShift("shape");
  assert.ok(m.items.every((i) => i.week >= 1 && i.week <= 12));
  for (let w = 1; w <= 12; w++) assert.ok([1, 2].includes(m.items.filter((i) => i.week === w).length));
  assert.ok(m.items.every((i) => i.price >= 20 && i.price <= 300 && i.vibes >= 5 && i.vibes <= 80));
  assert.equal(m.items.filter((i) => i.flash).length, 1);
  assert.ok(m.emergency.week >= 9 && m.emergency.week <= 11);
  assert.ok(m.items.filter((i) => i.price <= CONFIG.arcade.games.payin4.bnplOver).every((i) => !i.apps.length), "no Pay in 4 on small items");
});

test("a plan takes 25 percent today, then 3 payments 2 weeks apart", () => {
  const s = P.newState(P.newShift("plan"));
  P.nextWeek(s);
  const it = P.open(s).find((i) => i.apps.length) || s.m.items.find((i) => i.apps.length);
  if (it.week !== s.week) while (s.week < it.week) P.nextWeek(s);
  const before = s.cash;
  assert.ok(P.decide(s, it.id, it.apps[0]).ok);
  assert.equal(Math.round((before - s.cash) * 100) / 100, P.partOf(it.price));
  const p = s.plans[0];
  assert.deepEqual(p.payments.map((x) => x.week), [it.week + 2, it.week + 4, it.week + 6]);
  assert.equal(Math.round(p.payments.reduce((t, x) => t + x.amount, 0) * 100) / 100, Math.round((it.price - P.partOf(it.price)) * 100) / 100);
});

test("a failed draft costs a fee, locks the app, retries next week and drops the mood", () => {
  const s = P.newState(P.newShift("fail"));
  P.nextWeek(s);
  const it = s.m.items.find((i) => i.apps.length && i.week >= 1);
  while (s.week < it.week) P.nextWeek(s);
  s.cash = 1000;
  P.decide(s, it.id, it.apps[0]);
  const mood = s.mood;
  while (s.week < it.week + 1) P.nextWeek(s);
  // Far below $0, so even a paycheck that week can't cover the draft.
  s.cash = -1000;
  P.nextWeek(s);
  assert.equal(s.fees.length, 1);
  assert.ok(s.locked.includes(it.apps[0]));
  assert.equal(s.plans[0].payments[0].week, it.week + 3, "it retries next week");
  assert.ok(s.mood < mood);
  assert.match(s.echoes[0].text, /From: Pay in 4 at/);
});

test("acceptance: never buying scores below thoughtful play", () => {
  for (const s of seeds) assert.ok(run(s, P.neverBot).score < run(s, P.thoughtfulBot).score, s);
});

test("acceptance: Pay in 4 on everything fails drafts on most seeds and scores lowest", () => {
  const failed = seeds.filter((s) => run(s, P.bnplAllBot).fails > 0).length;
  assert.ok(failed >= seeds.length * 0.75, `${failed} of ${seeds.length}`);
  const low = seeds.filter((s) => run(s, P.bnplAllBot).score < run(s, P.thoughtfulBot).score).length;
  assert.equal(low, seeds.length);
});

test("acceptance: cash for everything leaves the emergency uncovered on most seeds", () => {
  const uncovered = seeds.filter((s) => !run(s, P.cashAllBot).covered).length;
  assert.ok(uncovered >= seeds.length * 0.75, `${uncovered} of ${seeds.length}`);
  for (const s of seeds) assert.ok(run(s, P.cashAllBot).score < run(s, P.thoughtfulBot).score, s);
});

test("difficulty stays in a band and plans still owed after week 12 count against ending cash", () => {
  const scores = seeds.map((s) => run(s, P.thoughtfulBot).score);
  const [lo, hi] = CONFIG.arcade.games.payin4.band;
  assert.ok(scores.every((x) => x >= lo && x <= hi), scores.join(","));
  const s = P.newState(P.newShift("late"));
  while (s.week < 12) P.nextWeek(s);
  s.cash = 1000;
  const it = P.open(s).find((i) => i.apps.length);
  if (it) {
    P.decide(s, it.id, it.apps[0]);
    assert.ok(P.score(s).owed > 0);
    assert.equal(P.score(s).endCash, Math.round((s.cash - P.owedLeft(s)) * 100) / 100);
  }
});
