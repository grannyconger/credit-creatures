// The 1,000-life sanity check from SPEC §24: careful players mostly 700+,
// reckless players mostly under 600. `npm run sim` prints the full report.
import { test } from "node:test";
import assert from "node:assert/strict";
import { simulateLives, summarize } from "./simulate.js";

const results = simulateLives({ n: 1000, months: 48 });
const summary = summarize(results);

test("careful players mostly end at 700+", () => {
  assert.ok(summary.careful.share700plus >= 0.7, `careful 700+: ${summary.careful.share700plus}`);
});

test("reckless players mostly end under 600", () => {
  assert.ok(summary.reckless.shareUnder600 >= 0.7, `reckless under 600: ${summary.reckless.shareUnder600}`);
  assert.ok(summary.ghost.shareUnder600 >= 0.9, `ghost under 600: ${summary.ghost.shareUnder600}`);
});

test("play styles rank in a sensible order", () => {
  const m = (k) => summary[k].median;
  assert.ok(m("careful") > m("average"));
  assert.ok(m("average") > m("reckless"));
  assert.ok(m("minimumPayer") > m("reckless"));
});

test("every score is a whole number from 300 to 850", () => {
  for (const r of results) {
    for (const c of r.changes) assert.ok(typeof c.message === "string");
    if (r.score == null) continue;
    assert.ok(Number.isInteger(r.score) && r.score >= 300 && r.score <= 850, `${r.strategy} ${r.seed}: ${r.score}`);
  }
});

test("money never turns into NaN", () => {
  for (const r of results) {
    const l = r.life;
    for (const v of [l.checking, l.savings, l.heldSavings, ...l.accounts.map((a) => a.balance)]) {
      assert.ok(Number.isFinite(v), `${r.strategy} ${r.seed}`);
    }
  }
});

test("every score change comes with a plain-language reason", () => {
  for (const r of results) {
    for (const c of r.changes) {
      assert.ok(c.message.length > 10);
      assert.doesNotMatch(c.message, /[—;]|undefined|NaN/);
      if (c.delta !== 0) assert.ok(c.factor, `missing factor: ${c.message}`);
    }
  }
});
