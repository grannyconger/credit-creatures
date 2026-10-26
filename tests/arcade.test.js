// The shared Arcade systems (GAME-SPECS.md Part 2) and every game's content.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as AC from "../js/arcade/core.js";
import * as P from "../js/play.js";
import { CONFIG } from "../js/data/config.js";
import { ARCADE } from "../js/data/arcade/index.js";
import { GUIDES } from "../js/data/guides.js";
import { JOBS } from "../js/data/minigames.js";
import { unlockStage } from "../js/progression.js";
import { lifeWith } from "./helpers.js";

const A = CONFIG.arcade;

function plain(s, where) {
  assert.equal(typeof s, "string", where);
  assert.ok(s.trim().length > 0, `empty: ${where}`);
  assert.ok(!s.includes("—"), `em-dash in ${where}: ${s}`);
  assert.ok(!s.includes(";"), `semicolon in ${where}: ${s}`);
}

test("pay is payCap times the score ratio, capped, never negative", () => {
  A.games.__t = { maxPayScore: 200 };
  assert.equal(AC.payFor("__t", 200), A.payCap);
  assert.equal(AC.payFor("__t", 400), A.payCap);
  assert.equal(AC.payFor("__t", 100), Math.round(A.payCap / 2));
  assert.equal(AC.payFor("__t", -50), 0);
  assert.equal(AC.payFor("__t", 150, { multiplier: 2 }), A.payCap, "a multiplier still stays under the cap");
  A.games.__t = { maxPayScore: { easy: 100, hard: 300 } };
  assert.equal(AC.payFor("__t", 100, { tier: "easy" }), A.payCap);
  assert.equal(AC.payFor("__t", 150, { tier: "hard" }), Math.round(A.payCap / 2));
  delete A.games.__t;
});

test("safe mode uses the month's shifts, risky mode is unlimited, training is free", () => {
  const play = P.newPlay();
  P.startChapter(play, lifeWith());
  assert.ok(AC.canStart(play, "billdrop", { mode: "safe", shiftsLeft: 1 }).ok);
  assert.equal(AC.canStart(play, "billdrop", { mode: "safe", shiftsLeft: 0 }).ok, false);
  assert.ok(AC.canStart(play, "billdrop", { mode: "risky", shiftsLeft: 0 }).ok);
  assert.ok(AC.canStart(play, "billdrop", { mode: "safe", training: true, shiftsLeft: 0 }).ok);
  assert.equal(AC.canStart(play, "billdrop", { mode: "risky", shiftsLeft: 3, prologue: true }).ok, false, "no risky mode in the prologue");
  let life = lifeWith({ checking: 0 });
  const before = P.shiftsLeft(play);
  const r = P.workShift(play, life, 80, "risky", "billdrop", { risky: true });
  assert.ok(r.ok);
  assert.equal(r.life.checking, 80);
  assert.equal(P.shiftsLeft(play), before, "a risky shift doesn't use a safe shift");
});

test("three risky mistakes in one shift fire you for real minutes, even if you quit or the tab closes", () => {
  const play = P.newPlay();
  const now = 1_000_000;
  AC.beginLive(play, "billdrop", "risky");
  AC.noteMistake(play);
  AC.noteMistake(play);
  assert.equal(AC.endLive(play, now), false, "two mistakes is not fired");
  AC.beginLive(play, "billdrop", "risky");
  for (let i = 0; i < A.fireAfter; i++) AC.noteMistake(play);
  assert.equal(AC.endLive(play, now), true);
  assert.equal(AC.minutesLeft(play, "billdrop", now), A.cooldownMinutes);
  assert.equal(AC.canStart(play, "billdrop", { mode: "risky", shiftsLeft: 3, now }).ok, false);
  assert.ok(AC.canStart(play, "billdrop", { mode: "risky", shiftsLeft: 3, now: now + A.cooldownMinutes * 60000 + 1 }).ok, "the cooldown ends in real time");
  // A shift left running (the tab closed) is settled the next time.
  AC.beginLive(play, "cashier", "risky");
  for (let i = 0; i < A.fireAfter; i++) AC.noteMistake(play);
  const s = AC.settleAbandoned(play, now);
  assert.deepEqual(s, { game: "cashier", mistakes: A.fireAfter, fired: true });
  assert.equal(AC.settleAbandoned(play, now), null);
  // Safe shifts are never tracked.
  AC.beginLive(play, "billdrop", "safe");
  assert.equal(AC.noteMistake(play), 0);
});

test("ranked shifts set personal bests with the tiebreak, training never counts", () => {
  const play = P.newPlay();
  const base = { game: "billdrop", seed: "x", settings: { difficulty: "easy" }, ranked: true, training: false, mode: "safe", coins: 50, seconds: 200, board: "billdrop:easy" };
  assert.equal(AC.recordResult(play, { ...base, score: 200, tie: 30 }, { tie: "low" }).newBest, true);
  assert.equal(AC.recordResult(play, { ...base, score: 200, tie: 40 }, { tie: "low" }).newBest, false, "same score, more fees");
  assert.equal(AC.recordResult(play, { ...base, score: 200, tie: 10 }, { tie: "low" }).newBest, true, "same score, fewer fees");
  assert.equal(AC.recordResult(play, { ...base, score: 999, ranked: false }).newBest, false);
  assert.equal(AC.recordResult(play, { ...base, score: 999, training: true }).newBest, false);
  assert.equal(AC.bestOf(play, "billdrop:easy").s, 200);
  assert.equal(play.arcade.log.length, 4, "training isn't logged");
  assert.ok(AC.saveWhy(play, "x", { q: "strong", pick: "p", text: "", d: "d" }));
  const rows = [{ creatureName: "A", best: { b: { s: 10, t: 5 } } }, { creatureName: "B", best: { b: { s: 10, t: 2 } } }, { creatureName: "C", best: {} }];
  assert.equal(AC.classTop(rows, "b", "low").creatureName, "B");
  assert.equal(AC.classTop(rows, "zzz"), null);
});

test("why reasons come in a seeded order, and bonus questions are picked and checked", () => {
  const r = { weak: "w", okay: "o", strong: "s" };
  assert.deepEqual(AC.orderedReasons(r, "a"), AC.orderedReasons(r, "a"));
  const firsts = new Set(Array.from({ length: 30 }, (_, i) => AC.orderedReasons(r, `s${i}`)[2].quality));
  assert.equal(firsts.size, 3, "the strong reason moves around");
  const q = { id: "n", type: "number", answer: 150 };
  assert.ok(AC.bonusRight(q, "$150"));
  assert.ok(AC.bonusRight(q, "150.00"));
  assert.equal(AC.bonusRight(q, "15"), false);
  assert.ok(AC.bonusRight({ type: "choice", answer: 1 }, 1));
});

test("every Arcade game has its job, guide, three beats, why reasons, mistakes and 20 bonus questions in plain words", () => {
  for (const [key, m] of Object.entries(ARCADE)) {
    assert.ok(JOBS[key], `${key} needs a JOBS entry`);
    assert.ok(GUIDES[key], `${key} needs a guide`);
    assert.ok(A.games[key]?.maxPayScore, `${key} needs maxPayScore in config`);
    assert.ok(Number.isInteger(unlockStage(key)), key);
    assert.equal(m.beats.length, 3, `${key} has exactly three coach beats`);
    for (const t of [m.title, m.pitch, m.metric, m.rankedHint, ...m.beats, ...m.mistakes, m.why.weak, m.why.okay, m.why.strong]) plain(t, key);
    assert.ok(m.standards.length && m.standards.every((s) => /^[A-G][1-8]$/.test(s)), `${key} standards`);
    assert.ok(typeof m.ranked === "function" && typeof m.board === "function");
    assert.ok(m.bonus.length >= 20, `${key} has ${m.bonus.length} bonus questions`);
    assert.equal(new Set(m.bonus.map((q) => q.id)).size, m.bonus.length, `${key} bonus ids`);
    for (const q of m.bonus) {
      plain(q.q, q.id);
      plain(q.why, q.id);
      if (q.type === "choice") {
        assert.ok(q.answer >= 0 && q.answer < q.choices.length, q.id);
        q.choices.forEach((c) => plain(c, q.id));
      } else assert.equal(typeof q.answer, "number", q.id);
    }
    const g = GUIDES[key];
    plain(g.how.goal, key);
    g.how.steps.forEach((s) => plain(s, key));
    g.vocab.forEach((v) => (plain(v.def, key), plain(v.example, key)));
    assert.ok(g.irl.facts.length >= 1, `${key} needs a sourced IRL fact`);
    for (const f of g.irl.facts) {
      plain(f.stat, key);
      assert.match(f.url, /^https:\/\//);
      assert.ok(f.year >= 2015, key);
    }
    assert.match(g.irl.checked, /^\d{4}-\d{2}-\d{2}$/);
    // Every [[term]] in the steps is in the vocab list.
    const terms = new Set(g.vocab.map((v) => v.term.toLowerCase()));
    for (const s of [...g.how.steps, g.how.example]) for (const t of s.matchAll(/\[\[(.*?)\]\]/g)) assert.ok(terms.has(t[1].toLowerCase()), `${key}: [[${t[1]}]] isn't in the vocab`);
  }
});

test("every standards category A to G has at least one Arcade game once all are built", () => {
  const cats = new Set(Object.values(ARCADE).flatMap((m) => m.standards.map((s) => s[0])));
  // Grows as games are built. All seven letters are required once Move-In Day ships.
  if (ARCADE.movein) assert.deepEqual([...cats].sort(), ["A", "B", "C", "D", "E", "F", "G"]);
  else assert.ok(cats.size >= 1);
});
