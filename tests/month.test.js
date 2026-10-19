import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith, withCard, months, card, deepFreeze } from "./helpers.js";

test("purchases post and a statement closes with a minimum due", () => {
  let { life, id } = withCard(lifeWith());
  life = E.cardPurchase(life, id, 100, "boots").life;
  assert.equal(card(life, id).balance, 0, "purchase is pending until End Month");
  const r = E.endMonth(life);
  const c = card(r.life, id);
  assert.equal(c.balance, 100);
  assert.equal(c.due.statementBalance, 100);
  assert.equal(c.due.minDue, 25);
  assert.equal(c.statements.at(-1).interest, 0);
});

test("no interest when the last statement is paid in full (grace period)", () => {
  let { life, id } = withCard(lifeWith());
  life = E.cardPurchase(life, id, 100).life;
  life = E.endMonth(life).life;
  life = E.pay(life, id, 100).life;
  life = E.cardPurchase(life, id, 50).life;
  life = E.endMonth(life).life;
  const s = card(life, id).statements.at(-1);
  assert.equal(s.interest, 0);
  assert.equal(s.balance, 50);
});

test("interest is APR / 12 on a carried balance", () => {
  let { life, id } = withCard(lifeWith(), { apr: 0.24 });
  life = E.cardPurchase(life, id, 400).life;
  life = E.endMonth(life).life;
  life = E.pay(life, id, 100).life;
  life = E.endMonth(life).life;
  const s = card(life, id).statements.at(-1);
  assert.equal(s.interest, 6); // 300 * 0.24 / 12
  assert.equal(s.balance, 306);
});

test("missed minimums go 30, 60, 90 days late, then collections at 120", () => {
  let { life, id } = withCard(lifeWith());
  life = E.cardPurchase(life, id, 200).life;
  const { life: after, events } = months(life, 5);
  const c = card(after, id);
  assert.deepEqual(
    c.history.map((h) => h.code),
    ["OK", "30", "60", "90", "CO"]
  );
  assert.equal(c.status, "collections");
  const lateFees = events.filter((e) => e.type === "fee" && e.fee === "late");
  assert.equal(lateFees.length, 4);
  assert.ok(lateFees.every((e) => e.amount === 30));
  assert.equal(events.filter((e) => e.type === "collections").length, 1);
});

test("paying the past-due amount brings the account current", () => {
  let { life, id } = withCard(lifeWith());
  life = E.cardPurchase(life, id, 200).life;
  life = months(life, 2).life; // one missed minimum
  assert.equal(card(life, id).monthsDelinquent, 1);
  life = E.pay(life, id, card(life, id).due.minDue).life;
  life = E.endMonth(life).life;
  assert.equal(card(life, id).monthsDelinquent, 0);
  assert.equal(card(life, id).history.at(-1).code, "OK");
});

test("paying off a collection marks it paid", () => {
  let { life, id } = withCard(lifeWith());
  life = E.cardPurchase(life, id, 200).life;
  life = months(life, 5).life;
  const owed = E.amountOwed(card(life, id));
  life = E.pay(life, id, owed).life;
  assert.equal(card(life, id).status, "collectionPaid");
});

test("AutoPay full pays the statement, and bounces with a fee when checking is short", () => {
  let { life, id } = withCard(lifeWith({ checking: 150 }));
  life = E.setAutopay(life, id, "full").life;
  life = E.cardPurchase(life, id, 100).life;
  life = E.endMonth(life).life;
  let r = E.endMonth(life);
  assert.ok(r.events.some((e) => e.type === "paymentReceived" && e.amount === 100));
  assert.equal(r.life.checking, 50);
  life = E.cardPurchase(r.life, id, 200).life;
  life = E.endMonth(life).life;
  r = E.endMonth(life);
  assert.ok(r.events.some((e) => e.type === "fee" && e.fee === "overdraft"));
  assert.ok(r.events.some((e) => e.type === "late"));
});

test("annual fee is charged at opening and every 12 months", () => {
  let { life, id } = withCard(lifeWith(), { annualFee: 95 });
  const { events } = months(life, 13, (l) => {
    const c = card(l, id);
    return c.due ? E.pay(l, id, c.due.statementBalance).life : l;
  });
  const fees = events.filter((e) => e.fee === "annual");
  assert.equal(fees.length, 2);
  assert.deepEqual(fees.map((e) => e.month), [0, 12]);
});

test("loan payments come out of checking, and short checking bounces", () => {
  let life = lifeWith({ checking: 2000 });
  const r = E.openAutoLoan(life, { price: 6000, downPayment: 1000, termMonths: 36 });
  assert.ok(r.ok);
  life = r.life;
  const loan = card(life, r.accountId);
  life = E.endMonth(life).life; // first payment due next month
  const before = life.checking;
  life = E.endMonth(life).life;
  assert.equal(life.checking, Math.round((before - loan.payment) * 100) / 100);
  life = E.moveToSavings(life, life.checking).life;
  const miss = E.endMonth(life);
  assert.ok(miss.events.some((e) => e.type === "fee" && e.fee === "overdraft"));
  assert.ok(miss.events.some((e) => e.type === "late" && e.accountId === r.accountId));
  assert.equal(card(miss.life, r.accountId).history.at(-1).code, "30");
});

test("credit-builder loan releases the held $500 when paid off", () => {
  let life = lifeWith({ checking: 1000 });
  const r = E.openCreditBuilderLoan(life);
  life = r.life;
  assert.equal(life.heldSavings, 500);
  const { life: after, events } = months(life, 13);
  assert.equal(card(after, r.accountId).status, "paid");
  assert.equal(after.heldSavings, 0);
  assert.equal(after.savings, 500);
  assert.ok(events.some((e) => e.type === "heldFundsReleased"));
});

test("federal student loan waits while in school and starts 6 months after", () => {
  let life = lifeWith({ checking: 500, inSchool: true });
  const r = E.openFederalStudentLoan(life, 3000);
  life = months(r.life, 10).life;
  assert.equal(card(life, r.accountId).balance, 3000, "no interest or payments while in school");
  life = E.leaveSchool(life).life;
  life = months(life, 6).life;
  assert.equal(card(life, r.accountId).monthsPaid, 0);
  life = months(life, 1).life;
  assert.equal(card(life, r.accountId).monthsPaid, 1);
});

test("hard inquiries stop counting after 12 months", () => {
  let life = lifeWith();
  life = E.applyForCard(life, { issuer: "capitalOne", product: "secured", requestedLimit: 200 }).life;
  life = months(life, 11).life;
  assert.equal(E.hardInquiriesInWindow(life), 1);
  const r = E.endMonth(life);
  assert.equal(E.hardInquiriesInWindow(r.life), 0);
  assert.ok(r.events.some((e) => e.type === "inquiryExpired"));
});

test("End Month events follow the SPEC §10 step order", () => {
  let { life, id } = withCard(lifeWith());
  life = E.addBill(life, "Phone", 45).life;
  life = E.openAutoLoan(life, { price: 3000, termMonths: 36 }).life;
  life = E.cardPurchase(life, id, 120).life;
  for (let i = 0; i < 3; i++) {
    const r = E.endMonth(life);
    const steps = r.events.map((e) => e.step);
    assert.deepEqual(steps, [...steps].sort((a, b) => a - b));
    assert.equal(r.events.at(-1).type, "scoreChange");
    life = E.cardPurchase(r.life, id, 50).life;
  }
});

test("engine actions never change their input", () => {
  let { life, id } = withCard(lifeWith());
  life = E.cardPurchase(life, id, 100).life;
  life = E.endMonth(life).life;
  life = E.buyWithBnpl(life, 200, "console").life;
  life = E.openAutoLoan(life, { price: 3000 }).life;
  life = E.joinAsAuthorizedUser(life, "average").life;
  const frozen = deepFreeze(life);
  const snapshot = JSON.stringify(frozen);
  E.endMonth(frozen);
  E.pay(frozen, id, 50);
  E.cardPurchase(frozen, id, 20);
  E.applyForCard(frozen, { issuer: "chase", product: "student", requestedLimit: 600 });
  E.closeAccount(frozen, id);
  E.removeAuthorizedUser(frozen);
  assert.equal(JSON.stringify(frozen), snapshot);
});
