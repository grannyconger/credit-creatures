import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith, withCard, months, card } from "./helpers.js";
import { closeAccount } from "../js/engine/accounts.js";

// A card used at `share` of its limit and paid in full every month.
function steadyLife(share, n = 12, opts = {}) {
  let { life, id } = withCard(lifeWith({ checking: 5000, ...opts }), { limit: 1000 });
  life = months(life, n, (l) => {
    const c = card(l, id);
    if (c.due) l = E.pay(l, id, c.due.statementBalance).life;
    return E.cardPurchase(l, id, 1000 * share).life;
  }).life;
  return { life, id };
}

test("no score until 6 months of reported history", () => {
  const { life: five } = steadyLife(0.1, 5);
  assert.equal(five.score, null);
  const { life: six } = steadyLife(0.1, 6);
  assert.ok(Number.isInteger(six.score));
});

test("joining a Responsible parent's card gives a score right away", () => {
  let life = E.joinAsAuthorizedUser(lifeWith(), "responsible").life;
  life = E.endMonth(life).life;
  assert.ok(life.score >= 700, `got ${life.score}`);
});

test("a Maxed-out parent's card drags the score down", () => {
  const good = E.endMonth(E.joinAsAuthorizedUser(lifeWith(), "responsible").life).life;
  const bad = E.endMonth(E.joinAsAuthorizedUser(lifeWith(), "maxed").life).life;
  assert.ok(bad.score < good.score - 50, `responsible ${good.score}, maxed ${bad.score}`);
});

test("using 90% of the limit scores lower than using 10%", () => {
  const low = steadyLife(0.1).life;
  const high = steadyLife(0.9).life;
  assert.ok(high.score < low.score - 60, `10%: ${low.score}, 90%: ${high.score}`);
  assert.ok(high.factors.owed.value < low.factors.owed.value);
});

test("closing the oldest card lowers length of history", () => {
  let { life, id } = steadyLife(0.05, 24);
  life = withCard(life, { limit: 1000, name: "New Card" }).life;
  life = months(life, 1, (l) => E.pay(l, id, E.amountOwed(card(l, id))).life).life;
  const before = E.computeScore(E.buildReport(life)).factors.length;
  life = closeAccount(life, id).life;
  const after = E.computeScore(E.buildReport(life)).factors.length;
  assert.ok(after.oldestMonths < before.oldestMonths);
  assert.ok(after.value < before.value);
});

test("adding a loan to a card improves credit mix", () => {
  let { life } = steadyLife(0.1, 8);
  const before = life.factors.mix.value;
  life = E.openAutoLoan(life, { price: 4000, termMonths: 48 }).life;
  life = E.endMonth(life).life;
  assert.ok(life.factors.mix.value > before);
});

test("three hard inquiries lower new credit", () => {
  let { life } = steadyLife(0.1, 13);
  const before = life.factors.newCredit.value;
  for (let i = 0; i < 3; i++) life = E.applyForCard(life, { issuer: "chase", product: "student", requestedLimit: 500 }).life;
  life = E.endMonth(life).life;
  assert.equal(life.factors.newCredit.inquiries, 3);
  assert.ok(life.factors.newCredit.value < before);
});

test("late payments and collections push the score far down, but it stays in range", () => {
  let { life, id } = withCard(lifeWith({ checking: 0 }), { limit: 1000 });
  life = E.cardPurchase(life, id, 1000).life;
  life = months(life, 12).life;
  assert.ok(life.score >= 300 && life.score < 550, `got ${life.score}`);
});

test("score change names the factor with real numbers", () => {
  let { life, id } = steadyLife(0.1, 8);
  life = E.pay(life, id, card(life, id).due.statementBalance).life;
  life = E.cardPurchase(life, id, 900).life;
  const r = E.endMonth(life);
  assert.equal(r.scoreChange.factor, "owed");
  assert.ok(r.scoreChange.delta < 0);
  assert.match(r.scoreChange.message, /^Score -\d+: your utilization rose from 10% to 90%\.$/);
});

test("a late payment is explained in plain words", () => {
  let { life, id } = steadyLife(0.1, 8);
  const r = E.endMonth(life); // statement not paid
  assert.equal(r.scoreChange.factor, "payment");
  assert.match(r.scoreChange.message, /was reported 30 days late/);
});

test("score reasons never use em-dashes or semicolons", () => {
  let { life, id } = steadyLife(0.3, 10);
  const { events } = months(life, 8, (l) => E.cardPurchase(l, id, 50).life);
  for (const e of events) assert.doesNotMatch(e.message, /[—;]/);
});
