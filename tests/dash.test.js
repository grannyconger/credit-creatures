// Market Dash's rules and acceptance tests (GAME-SPECS.md game 13).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as M from "../js/arcade/dash.js";
import { DASH_ITEMS, DASH_MEALS } from "../js/data/arcade/dash.js";

const seeds = Array.from({ length: 40 }, (_, i) => `md-${i}`);

test("content: 80 items, 25 meals, and every meal ingredient is on a shelf", () => {
  assert.equal(DASH_ITEMS.length, 80);
  assert.equal(DASH_MEALS.length, 25);
  for (const m of DASH_MEALS) for (const t of m.needs) assert.ok(DASH_ITEMS.some((it) => it.type === t), `${m.name}: ${t}`);
  for (const it of DASH_ITEMS) assert.ok(!/health|calorie|nutri/i.test(it.name), "no nutrition labels");
});

test("careful shopping cooks every meal within budget on every seed and difficulty", () => {
  for (const d of ["easy", "medium", "hard"]) for (const seed of seeds) {
    const deal = M.newShift(seed, d);
    const s = M.score(deal, M.thoughtfulCart(deal), { caught: true });
    assert.equal(s.cooked, deal.plan.length, `${seed} ${d}`);
    assert.ok(s.left >= 0, `${seed} ${d} left ${s.left}`);
  }
});

test("the receipt has exactly one error, and catching it refunds it", () => {
  for (const seed of seeds) {
    const deal = M.newShift(seed, "medium");
    const cart = M.thoughtfulCart(deal);
    const r = M.receipt(deal, cart);
    assert.ok(r.bad && r.over > 0, seed);
    const t = M.cartTotal(deal, cart);
    assert.equal(r.total - r.over, t.total, `${seed}: fixing the one error gives the right total (${r.kind})`);
    assert.ok(M.score(deal, cart, { caught: true }).score > M.score(deal, cart, { caught: false }).score);
  }
});

test("acceptance: grabbing the cheapest unit price of everything causes spoilage on Medium and Hard on most seeds", () => {
  for (const d of ["medium", "hard"]) {
    const spoiled = seeds.filter((seed) => {
      const deal = M.newShift(seed, d);
      return M.week(deal, M.cheapestUnitCart(deal)).waste > 0;
    }).length;
    assert.ok(spoiled >= seeds.length * 0.75, `${d}: ${spoiled} of ${seeds.length}`);
  }
});

test("acceptance: buying almost nothing means expensive takeout and a lower score", () => {
  for (const d of ["easy", "medium", "hard"]) for (const seed of seeds.slice(0, 15)) {
    const deal = M.newShift(seed, d);
    const little = M.score(deal, M.almostNothingCart(deal), { caught: true });
    assert.ok(little.takeout > 0);
    assert.ok(little.score < M.score(deal, M.thoughtfulCart(deal), { caught: true }).score);
  }
});

test("Easy never spoils, and the out-of-stock item always has a substitute", () => {
  for (const seed of seeds) {
    const deal = M.newShift(seed, "easy");
    assert.equal(M.week(deal, M.cheapestUnitCart(deal)).waste, 0);
    const out = DASH_ITEMS[deal.out];
    if (out) assert.ok(DASH_ITEMS.filter((x) => x.type === out.type).length > 1);
  }
});
