// The Arcade IOU, the fresh start and the going-broke rule (GAME-SPECS.md 2.3, 2.4).
import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith, withCard } from "./helpers.js";
import { copyLife } from "../js/engine/life.js";
import * as P from "../js/play.js";
import { CONFIG } from "../js/data/config.js";

const same = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));

test("a risky mistake comes out of checking first, then goes on the Arcade IOU", () => {
  let life = lifeWith({ checking: 30 });
  let r = E.arcadeCharge(life, 20, "Wrong change");
  assert.equal(r.life.checking, 10);
  assert.equal(r.toDebt, 0);
  assert.equal(E.arcadeIou(r.life), null);
  r = E.arcadeCharge(r.life, 25, "Bad check cashed");
  assert.equal(r.life.checking, 0);
  assert.equal(r.toDebt, 15);
  r = E.arcadeCharge(r.life, 5, "Late fee");
  const iou = E.arcadeIou(r.life);
  assert.equal(iou.balance, 20, "one IOU that grows");
  assert.equal(iou.reported, false, "never on the credit report");
  assert.equal(r.life.accounts.filter((a) => a.type === E.IOU_TYPE).length, 1);
  assert.equal(life.checking, 30, "the input never changes");
  same(E.replayLife(r.life.start, r.life.log), r.life);
  // It's a liability and can be paid like any account.
  assert.equal(E.balanceSheet(r.life).liabilities.total, 20);
  const paid = E.pay(E.earn(r.life, 50).life, iou.id, 20);
  assert.ok(paid.ok);
  assert.equal(E.amountOwed(E.findAccount(paid.life, iou.id)), 0);
});

test("a fresh start wipes debts, resets checking, keeps savings and marks the report", () => {
  let life = lifeWith({ checking: 3000 });
  life = E.moveToSavings(life, 100).life;
  const c = withCard(life, { limit: 1000 });
  life = c.life;
  // A year of small, paid-in-full card use builds a healthy score.
  for (let i = 0; i < 12; i++) {
    life = E.cardPurchase(life, c.id, 50, "snacks").life;
    const due = E.findAccount(life, c.id).due;
    if (due) life = E.pay(life, c.id, due.statementBalance).life;
    life = E.endMonth(life).life;
  }
  life = E.cardPurchase(life, c.id, 400, "laptop").life;
  life = E.buyWithBnpl(life, 200, "shoes").life;
  const before = E.endMonth(life).life.score;
  const r = E.freshStart(life, 500);
  assert.equal(r.life.checking, 500);
  assert.equal(r.life.savings, life.savings);
  assert.ok(r.wiped >= 550, `wiped ${r.wiped}`);
  for (const a of r.life.accounts.filter((x) => x.owner === "self")) assert.equal(E.amountOwed(a), 0, a.name);
  assert.equal(E.balanceSheet(r.life).liabilities.total, 0);
  assert.deepEqual(E.buildReport(r.life).publicRecords, [{ type: "freshStart", month: life.month }]);
  const after = E.endMonth(r.life);
  assert.ok(after.life.score < before - 80, `score ${before} to ${after.life.score}`);
  assert.match(after.scoreChange.message, /fresh start/);
});

function monthIn(chapter, checking, savings = 0) {
  const play = P.newPlay();
  play.chapter = chapter;
  let life = lifeWith({ checking: 100 });
  P.startChapter(play, life);
  life = copyLife({ ...life, checking, savings });
  const ready = () => {
    play.active.month.cards.forEach((c) => (c.done = true));
    if (play.active.month.life) play.active.month.life.done = true;
  };
  return { play, life, ready };
}

test("broke at a month's end is a warning first, then back to the previous chapter", () => {
  const { play, life, ready } = monthIn(4, -300, 50);
  ready();
  const r1 = P.finishMonth(play, life);
  assert.equal(r1.broke.type, "warning");
  assert.equal(play.broke.chapter, 4);
  assert.ok(play.active, "the chapter goes on after a warning");
  ready();
  const r2 = P.finishMonth(play, r1.life);
  assert.equal(r2.broke.type, "reset");
  assert.equal(r2.broke.from, 4);
  assert.equal(r2.broke.to, 3);
  assert.equal(play.chapter, 3);
  assert.equal(play.active, null);
  assert.equal(r2.life.checking, CONFIG.broke.resetChecking);
  assert.equal(play.broke, null);
  assert.equal(play.brokeHistory.length, 1);
});

test("getting back above $0 clears the warning, Chapter 2 stays at 2, and Chapter 1 can't go broke", () => {
  let { play, life, ready } = monthIn(5, -100, 0);
  ready();
  let r = P.finishMonth(play, life);
  assert.equal(r.broke.type, "warning");
  ready();
  r = P.finishMonth(play, copyLife({ ...r.life, checking: 400 }));
  assert.equal(r.broke.type, "recovered");
  assert.equal(play.broke, null);

  ({ play, life, ready } = monthIn(2, -100, 0));
  ready();
  r = P.finishMonth(play, life);
  ready();
  r = P.finishMonth(play, r.life);
  assert.equal(r.broke.type, "reset");
  assert.equal(play.chapter, 2, "never earlier than Chapter 2");

  ({ play, life, ready } = monthIn(1, -100, 0));
  ready();
  r = P.finishMonth(play, life);
  assert.equal(r.broke, null);

  // Savings that cover the gap means not broke.
  ({ play, life, ready } = monthIn(3, -100, 500));
  ready();
  assert.equal(P.finishMonth(play, life).broke, null);
});
