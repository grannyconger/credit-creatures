import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith, withCard, months, card } from "./helpers.js";

test("auto loan APR depends on the score", () => {
  const noScore = E.quoteAutoLoan(lifeWith(), { price: 10000, termMonths: 60 });
  const good = E.quoteAutoLoan({ ...lifeWith(), score: 780 }, { price: 10000, termMonths: 60 });
  const poor = E.quoteAutoLoan({ ...lifeWith(), score: 610 }, { price: 10000, termMonths: 60 });
  assert.ok(good.apr < noScore.apr);
  assert.ok(poor.apr > good.apr);
  assert.ok(poor.totalInterest > good.totalInterest);
});

test("a 72-month car loan costs more interest than a 60-month one", () => {
  const life = { ...lifeWith(), score: 700 };
  const short = E.quoteAutoLoan(life, { price: 15000, termMonths: 60 });
  const long = E.quoteAutoLoan(life, { price: 15000, termMonths: 72 });
  assert.ok(long.payment < short.payment);
  assert.ok(long.totalInterest > short.totalInterest);
});

test("auto loan is denied below the minimum score", () => {
  const r = E.openAutoLoan({ ...lifeWith(), score: 480 }, { price: 8000 });
  assert.equal(r.ok, false);
  assert.equal(r.life.inquiries.length, 1);
});

test("a cosigned friend's missed payments land on your report", () => {
  let life = lifeWith();
  const r = E.cosign(life, { friend: "Pip", amount: 600, termMonths: 12, reliability: 0 });
  const { life: after, events } = months(r.life, 3);
  assert.ok(events.some((e) => e.type === "cosignMissed"));
  const t = E.buildReport(after).tradelines.find((x) => x.id === r.accountId);
  assert.deepEqual(t.history.map((h) => h.code), ["OK", "30", "60"]);
});

test("a reliable cosigned friend keeps your report clean", () => {
  const r = E.cosign(lifeWith(), { amount: 600, termMonths: 12, reliability: 1 });
  const after = months(r.life, 6).life;
  assert.ok(card(after, r.accountId).history.every((h) => h.code === "OK"));
});

test("you can cover a cosigned payment to protect your report", () => {
  const r = E.cosign(lifeWith({ checking: 1000 }), { amount: 600, termMonths: 12, reliability: 0 });
  let life = E.endMonth(r.life).life;
  const a = card(life, r.accountId);
  life = E.pay(life, a.id, a.payment + 10).life;
  life = E.endMonth(life).life;
  assert.equal(card(life, r.accountId).history.at(-1).code, "OK");
});

test("removing yourself from a parent's card takes it off your report", () => {
  let life = E.joinAsAuthorizedUser(lifeWith(), "maxed").life;
  life = E.endMonth(life).life;
  assert.equal(E.buildReport(life).tradelines.length, 1);
  life = E.removeAuthorizedUser(life).life;
  assert.equal(E.buildReport(life).tradelines.length, 0);
});

test("upgrading a secured card returns the deposit", () => {
  let life = lifeWith({ checking: 400 });
  const r = E.applyForCard(life, { issuer: "capitalOne", product: "secured", requestedLimit: 300 });
  assert.ok(r.approved);
  const up = E.upgradeSecured(r.life, r.accountId, 1000);
  assert.equal(up.life.checking, 400);
  assert.equal(card(up.life, r.accountId).limit, 1000);
  assert.equal(card(up.life, r.accountId).secured, false);
});

test("an ignored bill in collections hurts the score until paid, and stays as a paid collection", () => {
  let { life, id } = withCard(lifeWith({ seed: "coll", checking: 900 }), { limit: 500 });
  for (let i = 0; i < 8; i++) life = E.endMonth(life).life;
  const before = life.score;
  const r = E.addCollection(life, "Clinic bill", 180);
  life = E.endMonth(r.life).life;
  assert.ok(life.score < before - 30, `${before} -> ${life.score}`);
  assert.equal(E.buildReport(life).collections.length, 1);
  life = E.pay(life, r.accountId, 180).life;
  assert.equal(E.findAccount(life, r.accountId).status, "collectionPaid");
  const lower = life.score;
  life = E.endMonth(life).life;
  assert.ok(life.score > lower, "paying it off helps");
  assert.ok(life.score < before, "but the paid collection still shows");
});

test("an installment loan can be paid down early by any amount, then paid off", () => {
  let life = { ...lifeWith(), score: 700, checking: 5000 };
  const open = E.openPurchaseLoan(life, { item: "Couch", price: 1000, termMonths: 12 });
  assert.ok(open.ok);
  life = open.life;
  const id = open.accountId;
  const owed = E.amountOwed(life.accounts.find((a) => a.id === id));
  const part = E.pay(life, id, 250);
  assert.ok(part.ok);
  assert.equal(E.amountOwed(part.life.accounts.find((a) => a.id === id)), Math.round((owed - 250) * 100) / 100);
  assert.equal(part.life.accounts.find((a) => a.id === id).status, "open");
  const all = E.pay(part.life, id, 99999);
  const loan = all.life.accounts.find((a) => a.id === id);
  assert.equal(loan.status, "paid");
  assert.equal(loan.balance, 0);
  assert.match(all.message, /paid off/);
});

test("paying off a credit-builder loan early releases the held savings", () => {
  const open = E.openCreditBuilderLoan({ ...lifeWith(), checking: 3000 });
  assert.ok(open.ok);
  const id = open.accountId || open.life.accounts.at(-1).id;
  const held = open.life.heldSavings;
  assert.ok(held > 0);
  const r = E.pay(open.life, id, 99999);
  assert.equal(r.life.heldSavings, 0);
  assert.equal(r.life.savings, open.life.savings + held);
});
