// The Grind's rules and acceptance tests (GAME-SPECS.md game 9).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as G from "../js/arcade/grind.js";
import { CONFIG } from "../js/data/config.js";
import { GR_RESTAURANTS, GR_STUB_ERRORS } from "../js/data/arcade/grind.js";

const seeds = Array.from({ length: 40 }, (_, i) => `gr-${i}`);
const D = CONFIG.arcade.games.grind.delivery;

test("content: 40 restaurants and 15 paystub error templates", () => {
  assert.equal(GR_RESTAURANTS.length, 40);
  assert.equal(GR_STUB_ERRORS.length, 15);
});

test("delivery: an offer expires as a decline, waiting is unpaid, and the surge doubles pay", () => {
  const s = G.deliveryState(G.newDelivery("one"));
  let t = 0;
  while (!s.offer) G.deliveryTick(s, ++t);
  const first = s.offer;
  G.deliveryTick(s, t + D.windowMin + 1);
  assert.equal(s.declined, 1, "letting it run out counts as a decline");
  assert.equal(s.offer, null);
  const surge = G.deliveryState(G.newDelivery("one"));
  assert.equal(G.offerPay(surge, first, surge.deal.surgeAt), Math.round((first.base + first.tip) * 2 * 100) / 100);
});

test("delivery: declining most offers lowers the offer rate", () => {
  const s = G.playDelivery("low", () => false);
  assert.ok(s.lowRate);
  const busy = G.playDelivery("low", G.selectiveBot);
  assert.ok(s.offered < busy.offered + 20);
});

test("acceptance: accepting every order gives a lower true hourly rate than selective play on most seeds", () => {
  const better = seeds.filter((seed) => G.deliveryPayday(G.playDelivery(seed, G.selectiveBot), 0.25).rate > G.deliveryPayday(G.playDelivery(seed, G.acceptAllBot), 0.25).rate).length;
  assert.ok(better >= seeds.length * 0.7, `${better} of ${seeds.length}`);
});

test("acceptance: a tax jar of 0 always produces a shortfall, and enough saved never does", () => {
  for (const seed of seeds) {
    const s = G.playDelivery(seed, G.selectiveBot);
    const zero = G.deliveryPayday(s, 0);
    assert.ok(zero.short > 0 && zero.penalty >= D.penaltyMin, seed);
    const enough = G.deliveryPayday(s, D.taxRate);
    assert.equal(enough.short, 0);
    assert.ok(enough.rate > zero.rate);
    assert.ok(enough.points > zero.points);
  }
});

test("store: overtime pays 1.5 times past 40 hours, and the stub hides one error", () => {
  const w = G.weekPay(44, 12.5);
  assert.equal(w.regPay, 500);
  assert.equal(w.otPay, 75);
  for (const seed of seeds) {
    const s = G.playStore(seed, G.carefulBot);
    const st = G.stub(s);
    assert.ok(st.missing > 0, `${seed}: the printed stub pays less`);
    assert.ok(["regHours", "rate", "otRate"].includes(st.bad));
    const found = G.storePayday(s, { predicted: st.real.net, found: true });
    const missed = G.storePayday(s, { predicted: st.real.net, found: false });
    assert.ok(found.score > missed.score);
    assert.equal(found.bonus, CONFIG.arcade.games.grind.store.predictMax);
  }
});

test("acceptance: accepting every extra shift triggers a sick day on most seeds, and scores below careful play", () => {
  const sick = seeds.filter((seed) => G.playStore(seed, G.yesAllBot).sick > 0).length;
  assert.ok(sick >= seeds.length * 0.75, `${sick} of ${seeds.length}`);
  const pd = (seed, bot) => {
    const s = G.playStore(seed, bot);
    return G.storePayday(s, { predicted: G.stub(s).real.net, found: true }).score;
  };
  const lower = seeds.filter((seed) => pd(seed, G.yesAllBot) < pd(seed, G.carefulBot)).length;
  assert.ok(lower >= seeds.length * 0.7, `${lower} of ${seeds.length}`);
});

test("a timed shift fits 3 to 4 minutes in each mode", () => {
  assert.equal(D.realSeconds, 150);
  assert.ok(CONFIG.arcade.games.grind.store.seconds <= 90);
  const offers = G.newStore("x").offers.length;
  assert.ok(offers * CONFIG.arcade.games.grind.store.offerSec <= 90, `${offers} store offers`);
});
