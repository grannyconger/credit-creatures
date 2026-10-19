import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith } from "./helpers.js";

const SECURED = { issuer: "capitalOne", product: "secured", requestedLimit: 300 };
const STUDENT = { issuer: "chase", product: "student", requestedLimit: 500 };
const PREMIUM = { issuer: "capitalOne", product: "premium", requestedLimit: 10000 };

test("secured card is almost always approved and takes the deposit", () => {
  let approved = 0;
  for (let i = 0; i < 100; i++) {
    const r = E.applyForCard(lifeWith({ seed: i, checking: 400 }), SECURED);
    if (r.approved) {
      approved++;
      assert.equal(r.life.checking, 100);
      assert.equal(E.findAccount(r.life, r.accountId).limit, 300);
    }
  }
  assert.ok(approved >= 90, `approved ${approved}/100`);
});

test("secured card is denied without enough for the deposit", () => {
  const r = E.applyForCard(lifeWith({ checking: 100 }), SECURED);
  assert.equal(r.approved, false);
  assert.ok(r.reasons.some((x) => x.includes("deposit")));
});

test("student card with no income is denied with a reason", () => {
  const r = E.applyForCard(lifeWith({ checking: 0 }), STUDENT);
  assert.equal(r.approved, false);
  assert.ok(r.reasons.some((x) => x.includes("earn")));
});

test("premium travel card with no history is denied", () => {
  for (let i = 0; i < 20; i++) {
    const r = E.applyForCard(lifeWith({ seed: i, checking: 10000 }), PREMIUM);
    assert.equal(r.approved, false);
  }
  const q = E.quoteApplication(lifeWith(), PREMIUM);
  assert.equal(q.odds, 0);
  assert.ok(q.reasons.some((x) => x.includes("history")));
});

test("every application adds a hard inquiry, approved or denied", () => {
  let life = lifeWith({ checking: 1000 });
  life = E.applyForCard(life, SECURED).life;
  life = E.applyForCard(life, PREMIUM).life;
  life = E.applyForCard(life, STUDENT).life;
  assert.equal(life.inquiries.filter((q) => q.hard).length, 3);
});

test("a higher requested limit raises risk, APR and required income", () => {
  const life = lifeWith({ checking: 300 });
  const low = E.quoteApplication(life, { ...STUDENT, requestedLimit: 500 });
  const high = E.quoteApplication(life, { ...STUDENT, requestedLimit: 1000 });
  assert.ok(high.apr > low.apr);
  assert.ok(high.requiredIncome > low.requiredIncome);
  assert.ok(high.odds < low.odds);
});

test("metal design raises the annual fee and makes approval harder", () => {
  const life = lifeWith({ checking: 300 });
  const plain = E.quoteApplication(life, { ...STUDENT, design: "plasticBlue" });
  const metal = E.quoteApplication(life, { ...STUDENT, design: "metal" });
  assert.ok(metal.annualFee > plain.annualFee);
  assert.ok(metal.odds < plain.odds);
});

test("the network comes from the product, not the player", () => {
  const q = E.quoteApplication(lifeWith(), { issuer: "discover", product: "student", requestedLimit: 600 });
  assert.equal(q.networkName, "Discover");
  assert.equal(E.quoteApplication(lifeWith(), { issuer: "chase", product: "secured" }).valid, false);
});

test("quote is pure: it does not add an inquiry or change the life", () => {
  const life = lifeWith();
  const before = JSON.stringify(life);
  E.quoteApplication(life, STUDENT);
  assert.equal(JSON.stringify(life), before);
});
