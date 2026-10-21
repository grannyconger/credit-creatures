import { test } from "node:test";
import assert from "node:assert/strict";
import { simulateLife } from "./sim/simulate.js";
import { suggest, economy } from "../scripts/tuning-lib.js";
import { compare, parseSets, withConfig } from "../scripts/replay-lib.js";
import { CONFIG } from "../js/data/config.js";
import { tuningExport, rosterRow } from "../js/teacher/analyze.js";
import * as P from "../js/play.js";

function lives(n = 4) {
  return Array.from({ length: n }, (_, i) => {
    const { life } = simulateLife(i % 2 ? "careful" : "reckless", `tune-${i}`, 24);
    return { student: `Student ${i + 1}`, start: life.start, log: life.log };
  });
}

test("replay with no changes moves nothing", () => {
  const r = compare(lives(), {});
  for (const row of r.rows) assert.deepEqual(row.cand, row.base);
  assert.equal(r.scoreMoved10, 0);
});

test("replay shows a higher late fee raising fees, and puts CONFIG back", () => {
  const before = CONFIG.fees.late;
  const r = compare(lives(), { "fees.late": before * 3 });
  assert.ok(r.medians.fees.after >= r.medians.fees.before);
  assert.ok(r.rows.some((x) => x.cand.fees > x.base.fees));
  assert.equal(CONFIG.fees.late, before);
  assert.throws(() => withConfig({ "fees.nope": 1 }, () => 0), /Unknown setting/);
  assert.deepEqual(parseSets(["--set", "fees.late=40", "--set", "score.weights={\"payment\":0.4}"]), { "fees.late": 40, "score.weights": { payment: 0.4 } });
});

test("the tuning report suggests fewer cards when months run long, and pay changes from savings", () => {
  const data = { tuning: { minutesPerMonth: { n: 30, median: 6, targetLow: 3, targetHigh: 4 }, cards: [{ id: "storeCard", n: 10, topShare: 0.9, lopsided: true, confusing: 3 }], questions: [{ type: "monthlyInterest", n: 20, accuracy: 30 }], games: [], ratings: [{ chapter: 2, n: 5, fun: 4, clear: 2.5 }], xpCapHits: 4 }, lives: lives(2) };
  const s = suggest(data);
  assert.ok(s.changes.some((c) => c.setting === "pacing.newCardsPerMonth" && c.suggested < c.current));
  assert.ok(s.lines.some((l) => l.includes("storeCard") && l.includes("90%")));
  assert.ok(s.lines.some((l) => l.includes("confusing 3")));
  assert.ok(s.lines.some((l) => l.includes("monthlyInterest")));
  assert.ok(s.lines.some((l) => l.includes("Chapter 2")));
  assert.equal(s.economy.length, 2);
});

test("economy measures money saved per month after 18", () => {
  const e = economy(lives(2));
  for (const x of e) {
    assert.ok(Number.isFinite(x.savedPerMonth));
    assert.ok(x.months > 0);
  }
});

test("the tuning export has no names or emails", () => {
  const { life } = simulateLife("careful", "export", 12);
  const save = { uid: "abc", studentName: "Avery Stone", studentEmail: "avery@greermiddlecollege.org", displayName: "Avery", onboarding: { step: "hub", firstName: "Avery", lastName: "Stone" }, creature: { name: "Pip" }, play: P.newPlay(), lifeJson: JSON.stringify({ ...life, start: { ...life.start, name: "Pip" } }) };
  const row = rosterRow(save);
  const out = JSON.stringify(tuningExport({ className: "P2", tuningData: {}, rows: [row], saves: [save] }));
  for (const secret of ["Avery", "avery@", "abc", "Pip"]) assert.ok(!out.includes(secret), secret);
  assert.ok(out.includes("Student 1"));
});
