// Check Writer's upgraded rules and acceptance tests (GAME-SPECS.md game 2).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as K from "../js/arcade/checks.js";
import { CW_JUDGE } from "../js/data/arcade/checks.js";
import { amountInWords } from "../js/data/minigames.js";

const seeds = Array.from({ length: 200 }, (_, i) => `cw-${i}`);

// A perfect check: every field right and both lines drawn.
function perfect(deal) {
  const words = amountInWords(deal.bill.cents).replace(/-/g, " ").toLowerCase();
  const [dollars, cents] = words.split(" and ");
  return { date: deal.bill.date, payee: deal.bill.payee, amount: (deal.bill.cents / 100).toFixed(2), tiles: [...dollars.split(" "), "and"], cents, signed: true, lines: { payee: true, words: true } };
}

test("40 judge templates cover every problem type, with 0 to 2 clean checks a shift", () => {
  assert.equal(CW_JUDGE.length, 40);
  for (const kind of ["clean", "signature", "altered", "stale", "postdated", "noEndorse", "bigNew"]) assert.ok(CW_JUDGE.some((t) => t.kind === kind), kind);
  for (const seed of seeds) {
    const d = K.newShift(seed);
    assert.equal(d.judge.length, 3);
    const clean = d.judge.filter((j) => j.kind === "clean").length;
    assert.ok(new Set(d.judge.map((j) => j.call)).size >= 2, `${seed} needs two different calls`);
    assert.ok(clean <= 2);
    assert.ok(d.bill.cents < 100000, "rent stays under $1,000");
    for (const j of d.judge) {
      if (j.kind === "stale") assert.ok(/, 202[4-6]$/.test(j.date), j.date);
      if (j.kind === "signature") assert.notEqual(j.signedAs, j.card);
      if (j.kind === "altered") assert.notEqual(j.cents, Math.round(Number(j.numbers) * 100) - 1);
    }
  }
});

test("the word tiles grade right, with the cents as a fraction", () => {
  for (const seed of seeds) {
    const d = K.newShift(seed);
    const g = K.gradeWrite(d, perfect(d));
    assert.deepEqual(Object.values(g), [true, true, true, true, true, true], seed);
    const off = { ...perfect(d), cents: "99/100" };
    if (d.bill.cents % 100 !== 99) assert.equal(K.gradeWrite(d, off).words, false);
  }
});

test("acceptance: skipping a line always triggers your washed check, and drawing both never does", () => {
  for (const seed of seeds) {
    const d = K.newShift(seed);
    const p = perfect(d);
    assert.ok(!K.counterChecks(d, p).some((k) => k.own), seed);
    for (const skip of ["payee", "words"]) {
      const w = { ...p, lines: { ...p.lines, [skip]: false } };
      const own = K.counterChecks(d, w).filter((k) => k.own);
      assert.equal(own.length, 1, `${seed} ${skip}`);
      assert.equal(own[0].call, "reject");
      assert.equal(own[0].cents, d.bill.cents + 100000);
      assert.match(own[0].words, /^One thousand /);
    }
  }
});

test("acceptance: Cash everything, Hold everything and Reject everything all score below thoughtful play", () => {
  for (const seed of seeds) {
    const d = K.newShift(seed);
    const p = perfect(d);
    const checks = K.counterChecks(d, p);
    const best = K.score(d, p, "mobile", checks.map((k) => k.call)).score;
    assert.equal(best, 150, "a perfect shift is 150");
    for (const lazy of ["cash", "hold", "reject"]) {
      const s = K.score(d, p, "mobile", checks.map(() => lazy)).score;
      assert.ok(s < best, `${seed}: ${lazy} everything scored ${s}`);
    }
  }
});

test("endorsing for mobile deposit is the right call", () => {
  assert.ok(K.endorseRight("mobile"));
  assert.ok(!K.endorseRight("sig"));
  assert.ok(!K.endorseRight("friend"));
});
