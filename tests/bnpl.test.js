import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith, months, card } from "./helpers.js";

test("BNPL takes 25% today, then 50% and 25% at the next two End Months", () => {
  let life = lifeWith({ checking: 500 });
  const r = E.buyWithBnpl(life, 200, "headphones");
  life = r.life;
  assert.equal(life.checking, 450);
  life = E.endMonth(life).life;
  assert.equal(life.checking, 350);
  life = E.endMonth(life).life;
  assert.equal(life.checking, 300);
  assert.equal(card(life, r.accountId).status, "paid");
});

test("on-time BNPL never shows on the credit report", () => {
  let life = lifeWith({ checking: 500 });
  life = E.buyWithBnpl(life, 200).life;
  life = months(life, 3).life;
  assert.equal(E.buildReport(life).tradelines.length, 0);
});

test("missed BNPL payments add late fees and end in a reported collection", () => {
  let life = lifeWith({ checking: 60 });
  const r = E.buyWithBnpl(life, 200, "console");
  life = E.debitPurchase(r.life, life.checking - 50, "snacks").life;
  life = E.debitPurchase(life, life.checking, "more snacks").life;
  const { life: after, events } = months(life, 5);
  assert.ok(events.some((e) => e.type === "fee" && e.amount === 7));
  assert.equal(card(after, r.accountId).status, "collections");
  const report = E.buildReport(after);
  assert.equal(report.collections.length, 1);
});

test("BNPL is declined when checking can't cover the first payment", () => {
  const r = E.buyWithBnpl(lifeWith({ checking: 10 }), 200);
  assert.equal(r.ok, false);
});
