// Fee Detective's upgraded rules and acceptance tests (GAME-SPECS.md game 12).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as D from "../js/arcade/fees.js";
import { FD_CHARGES, FD_CLIENTS } from "../js/data/arcade/fees.js";
import { CONFIG } from "../js/data/config.js";

const seeds = Array.from({ length: 40 }, (_, i) => `fd-${i}`);
const C = CONFIG.arcade.games.fees;

test("30 client documents, 10 of each type, and every fee type has a right action and three habits", () => {
  assert.equal(FD_CLIENTS.length, 30);
  for (const t of ["bank", "phone", "gym"]) assert.equal(FD_CLIENTS.filter((c) => c[1] === t).length, 10);
  for (const [k, ch] of Object.entries(FD_CHARGES)) {
    assert.equal(ch.name.length, 3, `${k} has an easy, medium and hard name`);
    assert.ok(ch.right.every((a) => D.ACTIONS.includes(a)), k);
    assert.equal(ch.habit.length, 3, k);
  }
});

test("each shift: three cases, fees never repeat on a document, and at most one case has no fees", () => {
  for (const seed of seeds) {
    const s = D.play(seed, "medium", D.thoughtfulPolicy);
    assert.equal(s.results.length, 3);
    for (const k of s.cases) {
      const kinds = k.lines.filter((l) => l.fee).map((l) => l.kind);
      assert.equal(new Set(kinds).size, kinds.length, `${seed}: a fee repeats`);
      assert.ok(k.lines.length >= 10 && k.lines.length <= 13);
    }
    assert.ok(s.cases.filter((k) => k.noFee).length <= 1);
    assert.equal(s.cases[2].client, s.cases[0].client, "Case 3 is Case 1's client a month later");
  }
});

test("echo: skip Case 1's habit and its fee is back in Case 3", () => {
  let checked = 0;
  for (const seed of seeds) {
    const deal = D.newShift(seed, "easy");
    if (!deal.cases[0].key) continue;
    assert.ok(D.caseThree(deal, false).lines.some((l) => l.repeat && l.kind === deal.cases[0].key), seed);
    assert.ok(!D.caseThree(deal, true).lines.some((l) => l.kind === deal.cases[0].key), seed);
    checked++;
  }
  assert.ok(checked > 30);
});

test("three calls a shift: with no calls left, refunds and disputes fall back to accept", () => {
  const s = D.newState(D.newShift("calls", "easy"));
  s.calls = 0;
  const k = D.currentCase(s);
  const fee = k.lines.find((l) => l.fee);
  const r = D.closeCase(s, k, { marks: new Set([fee.id]), actions: { [fee.id]: "dispute" } });
  assert.equal(r.outcomes[0].action, "accept");
});

test("acceptance: disputing everything runs out of calls and scores below thoughtful play", () => {
  for (const seed of seeds) {
    const d = D.play(seed, "easy", D.disputeAllPolicy);
    assert.equal(d.calls, 0, `${seed}: calls should run out`);
    assert.ok(D.score(d).score < D.score(D.play(seed, "easy", D.thoughtfulPolicy)).score, seed);
  }
});

test("acceptance: accepting everything scores lower than thoughtful play", () => {
  for (const seed of seeds) assert.ok(D.score(D.play(seed, "hard", D.acceptAllPolicy)).score < D.score(D.play(seed, "hard", D.thoughtfulPolicy)).score, seed);
});

test("difficulty stays in a band for fair class scores", () => {
  for (const seed of seeds) {
    const sc = D.score(D.play(seed, "easy", D.thoughtfulPolicy)).score;
    assert.ok(sc >= C.band[0] && sc <= C.band[1], `${seed}: ${sc}`);
  }
});
