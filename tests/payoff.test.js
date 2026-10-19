import { test } from "node:test";
import assert from "node:assert/strict";
import { minPayment, monthlyInterest, amortizedPayment, payoffPlan, minimumOnlyPlan } from "../js/engine/payoff.js";

test("minimum payment uses the $25 floor", () => {
  assert.equal(minPayment(300, 5), 25);
});

test("minimum payment is 2% of balance plus interest when larger", () => {
  // 2% of 2000 = 40, plus 40 interest = 80
  assert.equal(minPayment(2000, 40), 80);
});

test("minimum payment never exceeds the balance", () => {
  assert.equal(minPayment(12, 0), 12);
  assert.equal(minPayment(0, 0), 0);
});

test("monthly interest is APR divided by 12", () => {
  assert.equal(monthlyInterest(600, 0.24), 12);
});

test("amortized loan payment matches the standard formula", () => {
  assert.equal(amortizedPayment(10000, 0.06, 60), 193.33);
  assert.equal(amortizedPayment(1200, 0, 12), 100);
});

test("payoff plan adds up and finishes", () => {
  const p = payoffPlan(600, 0.24, 60);
  assert.equal(p.neverPaysOff, false);
  assert.equal(p.months, 12);
  assert.equal(p.totalPaid, 600 + p.totalInterest);
  assert.ok(p.totalInterest > 0 && p.totalInterest < 100);
});

test("payoff plan says never when the payment only covers interest", () => {
  assert.equal(payoffPlan(1000, 0.24, 20).neverPaysOff, true);
});

test("paying only the minimum takes longer and costs more", () => {
  const fixed = payoffPlan(1000, 0.24, 60);
  const minOnly = minimumOnlyPlan(1000, 0.24);
  assert.ok(minOnly.months > fixed.months);
  assert.ok(minOnly.totalInterest > fixed.totalInterest);
});
