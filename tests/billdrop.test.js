// Bill Drop's rules and acceptance tests (GAME-SPECS.md game 3).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as B from "../js/arcade/billdrop.js";

const seeds = Array.from({ length: 40 }, (_, i) => `bd${i}`);
const LEVELS = ["easy", "medium", "hard"];

test("the same seed deals the same month, chaos and all", () => {
  for (const d of LEVELS) assert.deepEqual(B.newMonth("same", d), B.newMonth("same", d));
  assert.notDeepEqual(B.newMonth("a", "easy"), B.newMonth("b", "easy"));
});

test("each difficulty deals its bills, forgotten autopays and 2 to 3 chaos cards", () => {
  for (const s of seeds.slice(0, 15)) {
    const counts = { easy: [5, 0], medium: [7, 1], hard: [8, 2] };
    for (const d of LEVELS) {
      const m = B.newMonth(s, d);
      assert.equal(m.bills.length, counts[d][0], `${s} ${d}`);
      assert.equal(m.bills.filter((b) => b.forgotten).length, counts[d][1], `${s} ${d}`);
      assert.equal(m.bills.some((b) => b.type === "card"), d === "hard");
      assert.ok(m.chaos.length >= 2 && m.chaos.length <= 3);
      for (const b of m.bills) assert.ok(b.due - b.arrive >= 0 && b.due - b.arrive <= 10 && b.arrive >= 1);
    }
  }
});

test("difficulty stays in a band: thoughtful play clears the month with no fees", () => {
  for (const d of LEVELS) {
    const scores = seeds.map((s) => {
      const best = B.thoughtful(B.newMonth(s, d));
      assert.equal(best.fees.length, 0, `${s} ${d}`);
      return B.score(best).score;
    });
    const spread = Math.max(...scores) - Math.min(...scores);
    assert.ok(spread <= 180, `${d} scores spread ${spread}`);
  }
});

test("acceptance: paying every bill the moment it arrives overdrafts on most seeds", () => {
  for (const d of LEVELS) {
    const bad = seeds.filter((s) => B.simulate(B.newMonth(s, d), { plan: (b) => ({ payDay: b.arrive }) }).fees.some((f) => f.kind === "overdraft")).length;
    assert.ok(bad >= seeds.length * 0.6, `${d}: ${bad} of ${seeds.length}`);
  }
});

test("acceptance: never logging bills leads to late fees and scores far below thoughtful play", () => {
  for (const d of LEVELS) {
    for (const s of seeds.slice(0, 15)) {
      const m = B.newMonth(s, d);
      const none = B.simulate(m, { plan: () => ({}), logged: () => false });
      assert.ok(none.fees.some((f) => f.kind === "late"), `${s} ${d}`);
      assert.ok(B.score(none).score < B.score(B.thoughtful(m)).score - 100);
    }
  }
});

test("acceptance: autopay on everything fails on Hard", () => {
  const worse = seeds.filter((s) => {
    const m = B.newMonth(s, "hard");
    const lazy = B.simulate(m, { plan: () => ({ autopay: true, part: "full" }), knowsAutopays: false });
    return B.score(lazy).score < B.score(B.thoughtful(m)).score;
  }).length;
  assert.equal(worse, seeds.length);
});

test("fees: overdraft per item, a late fee once, forgotten autopays draft with an echo", () => {
  const m = B.newMonth("rules", "medium");
  const s = B.newState(m);
  const rent = s.bills.find((b) => b.type === "rent");
  B.logBill(s, rent.id);
  B.schedule(s, rent.id, 1);
  s.balance = 10;
  B.advance(s);
  assert.equal(s.fees.filter((f) => f.kind === "overdraft").length, 1);
  assert.equal(rent.paidDay, 1);
  while (s.day < B.DAYS) B.advance(s);
  const forgotten = s.bills.find((b) => b.forgotten);
  assert.equal(forgotten.paidDay, forgotten.due);
  assert.ok(s.echoes.some((e) => e.text.includes(forgotten.company)));
  const unpaid = s.bills.filter((b) => !b.paid);
  assert.equal(s.fees.filter((f) => f.kind === "late").length, unpaid.length, "one late fee per unpaid bill");
  assert.equal(B.score(s).never, unpaid.length);
});

test("the fix menu: move a utility, cancel a subscription, two uses", () => {
  const m = B.newMonth("fix", "easy");
  const s = B.newState(m);
  const util = s.bills.find((b) => b.movable);
  const sub = s.bills.find((b) => b.cancelable);
  const rent = s.bills.find((b) => b.type === "rent");
  assert.equal(B.applyFix(s, "move", rent.id).ok, false, "rent won't move");
  const due = util.due;
  assert.ok(B.applyFix(s, "move", util.id).ok);
  assert.equal(util.due, Math.min(30, due + 5));
  assert.ok(B.applyFix(s, "cancel", sub.id).ok);
  assert.equal(B.applyFix(s, "shift").ok, false, "only two fixes");
  while (s.day < B.DAYS) B.advance(s);
  assert.equal(sub.paid, 0);
  assert.equal(B.score(s).bills, 4, "a canceled bill doesn't count");
});

test("the forecast hides unlogged bills and shows logged ones", () => {
  const s = B.newState(B.newMonth("fc", "easy"));
  const before = B.forecast(s);
  const rent = s.bills.find((b) => b.type === "rent");
  B.logBill(s, rent.id);
  B.schedule(s, rent.id, rent.due);
  const after = B.forecast(s);
  assert.equal(before.length, B.DAYS);
  assert.equal(Math.round(before[rent.due - 1] - after[rent.due - 1]), rent.amount);
});
