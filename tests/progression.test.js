import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith, withCard } from "./helpers.js";
import * as P from "../js/play.js";
import * as G from "../js/progression.js";
import { CONFIG } from "../js/data/config.js";
import { SCENARIOS } from "../js/data/scenarios.js";

const phased = () => P.newPlay({ phased: true });

test("old saves keep everything unlocked", () => {
  const old = P.newPlay();
  assert.ok(G.isLegacy(old));
  for (const f of Object.keys(G.FEATURES)) assert.ok(G.hasFeature(old, f), f);
  assert.deepEqual(G.newUnlocks(old), []);
});

test("a new game starts with only a piggy bank and three places", () => {
  const play = phased();
  assert.equal(G.stageOf(play), 0);
  assert.deepEqual(G.moneyChipKeys(play, null), ["piggy"]);
  for (const f of ["piggy", "guild", "market", "cottage", "cashier"]) assert.ok(G.hasFeature(play, f), f);
  for (const f of ["checking", "vault", "townhall", "loans", "card", "score", "checks", "ledger"]) assert.ok(!G.hasFeature(play, f), f);
  assert.deepEqual(G.openJobs(play), ["cashier", "checks", "overdraft"], "the prologue is exactly these three jobs");
  assert.equal(P.canPlay(play, 5), false, "no chapter until the prologue is done");
  assert.equal(G.opensText("garage"), "Opens in Chapter 2");
});

test("the prologue goes step by step, and opening the bank starts Chapter 1", () => {
  const play = phased();
  const ids = [];
  const s = play.prologue;
  ids.push(G.prologueStep(play).id);
  s.welcomed = true;
  ids.push(G.prologueStep(play).id);
  s.shifts = 3;
  ids.push(G.prologueStep(play).id);
  s.marketVisited = true;
  s.cottageVisited = true;
  ids.push(G.prologueStep(play).id);
  assert.deepEqual(ids, ["welcome", "firstShift", "market", "bank"]);

  let life = E.earn(E.createLife({ seed: "p", ageMonths: CONFIG.onboarding.startAgeMonths }), 150, "shift").life;
  const r = G.openBankAccount(play, life, { toSavings: 50 });
  life = r.life;
  assert.equal(G.prologueStep(play), null);
  assert.equal(play.chapter, 1);
  assert.equal(life.savings, 50);
  assert.equal(life.checking, 100);
  assert.ok(life.bills.some((b) => b.name === "Phone" && b.amount === CONFIG.bills.teenPhone));
  assert.ok(P.canPlay(play, 1));
  assert.ok(G.hasFeature(play, "checking") && G.hasFeature(play, "checks") && !G.hasFeature(play, "loans"));
  assert.deepEqual(G.moneyChipKeys(play, life), ["checking", "savings"]);
  assert.deepEqual(G.newUnlocks(play).map((u) => u.stage), [1]);
  assert.deepEqual(G.newUnlocks(play), [], "each unlock is celebrated once");
  assert.ok(JSON.stringify(E.replayLife(life.start, life.log)) === JSON.stringify(life), "the bank opening replays");
});

test("Chapter 1 only draws cards a 16-year-old with a checking account can use", () => {
  const play = phased();
  let life = E.earn(E.createLife({ seed: "ch1", ageMonths: 192 }), 200, "shift").life;
  life = G.openBankAccount(play, life).life;
  const ok = new Set(SCENARIOS.filter((s) => (s.minChapter || 2) <= 1 && (s.needs || []).every((f) => G.hasFeature(play, f))).map((s) => s.id));
  assert.ok(ok.size >= 8, `${ok.size} Chapter 1 cards`);
  for (let seed = 0; seed < 25; seed++) {
    const p = phased();
    const l = G.openBankAccount(p, E.earn(E.createLife({ seed: `s${seed}`, ageMonths: 192 }), 60 + seed * 20, "shift").life).life;
    P.startChapter(p, l);
    for (const c of p.active.month.cards) assert.ok(ok.has(c.id), `${c.id} showed up in Chapter 1`);
  }
});

test("a card unlocks its feature even before its chapter (safety net)", () => {
  const play = phased();
  play.prologue.done = true;
  const { life } = withCard(lifeWith({ seed: "own", checking: 300 }), { limit: 300 });
  assert.ok(!G.hasFeature(play, "card"));
  assert.ok(G.hasFeature(play, "card", life));
});

test("after Chapter 1, time jumps to 18 and the bus pass starts", () => {
  const play = phased();
  let life = G.openBankAccount(play, E.createLife({ seed: "skip", ageMonths: 192 })).life;
  const r = G.afterChapter(play, life, 1);
  assert.equal(r.life.ageMonths, CONFIG.onboarding.cardAgeMonths);
  assert.ok(r.skipped.months > 0);
  assert.ok(r.life.bills.some((b) => b.name === "Bus pass"));
  assert.equal(G.afterChapter(play, r.life, 2).skipped, null);
});

test("dream goals about later chapters say when they open", async () => {
  const { dreamProgress } = await import("../js/data/dreams.js");
  const play = phased();
  play.prologue.done = true;
  play.dreamStage = 1;
  const life = E.createLife({ seed: "dream", ageMonths: 192 });
  const goals = dreamProgress(life, "home", play).stage.goals;
  assert.equal(goals.find((g) => g.type === "score").locked, "Opens in Chapter 4");
  assert.equal(goals.find((g) => g.type === "utilization").locked, "Opens in Chapter 3");
  assert.equal(goals.find((g) => g.type === "onTime").locked, "Opens in Chapter 2");
  assert.equal(dreamProgress(life, "home", Object.assign(P.newPlay(), { dreamStage: 1 })).stage.goals.find((g) => g.type === "score").locked, null, "old saves see no locks");
});

test("Chapter 2 has a full deck of loan cards", () => {
  const ch2 = SCENARIOS.filter((s) => (s.minChapter || 2) === 2 && (s.needs || []).includes("loans"));
  assert.ok(ch2.length >= 9, `${ch2.length} Chapter 2 loan cards`);
});

test("Lantern Alley opens in Chapter 5 with a mix of traps and fair deals in plain words", async () => {
  const { STALLS, alleyProgress } = await import("../js/data/alley.js");
  const { PLACES, placeStatus } = await import("../js/places.js");
  const alley = PLACES.find((p) => p.id === "alley");
  assert.equal(G.opensText(alley.feature), "Opens in Chapter 5");
  assert.equal(new Set(STALLS.map((s) => s.id)).size, STALLS.length);
  const traps = STALLS.filter((s) => s.trap).length;
  assert.ok(traps >= 5 && STALLS.length - traps >= 3, "calling everything a trap can't get them all");
  for (const s of STALLS) {
    const text = [s.name, s.pitch, ...s.fine, ...s.math, s.clue, s.better].join(" ");
    assert.ok(!/[—;]/.test(text), `${s.id} follows the text rules`);
    assert.ok(s.fine.length >= 2 && s.math.length >= 2, s.id);
  }
  const play = phased();
  play.prologue.done = true;
  play.chapter = 4;
  const life = E.createLife({ seed: "alley", ageMonths: 228 });
  assert.equal(placeStatus({ life, play, creature: { name: "Pip" } }).alley.tone, "locked");
  play.chapter = 5;
  assert.equal(placeStatus({ life, play, creature: { name: "Pip" } }).alley.count, STALLS.length);
  P.ensurePlay(play);
  play.alley.checked = { payday: { right: true }, creditUnion: { right: false } };
  assert.deepEqual(alleyProgress(play), { checked: 2, right: 1, total: STALLS.length });
  const got = P.recordAnswer(play, { type: "alley", standard: 5, correct: true });
  assert.ok(got.xp > 0);
  assert.equal(play.desk.byStandard["5"].right, 1, "alley calls count toward Standard 5");
});

test("Chapters 6 to 8 have their own story and a full deck, and later chapters reshuffle", async () => {
  const { chapterInfo } = await import("../js/data/chapters.js");
  for (const n of [6, 7, 8]) {
    assert.notEqual(chapterInfo(n).title, `Chapter ${n}`, `Chapter ${n} has a title`);
    assert.equal(chapterInfo(n, P.newPlay()).title, chapterInfo(n).title, "old saves get the late chapters too");
    const own = SCENARIOS.filter((s) => s.minChapter === n);
    assert.ok(own.length >= 5, `${own.length} cards open in Chapter ${n}`);
  }
  const life = E.createLife({ seed: "late", ageMonths: 240 });
  const seen = SCENARIOS.map((s) => s.id);
  const at = (chapter) => E.drawDecisionCards(life, SCENARIOS, { chapter, seen, lastChange: null }).filter((id) => SCENARIOS.find((s) => s.id === id).once !== false);
  assert.deepEqual(at(CONFIG.pacing.replayFromChapter - 1), [], "before the reshuffle, seen cards stay gone");
  const again = at(CONFIG.pacing.replayFromChapter);
  assert.ok(again.length >= 1, "the reshuffle brings cards back");
  for (const id of again) assert.notEqual(SCENARIOS.find((s) => s.id === id).replay, false, `${id} is a milestone`);
});

test("the teacher sees Lantern Alley, lessons, dream stage and title loans", async () => {
  const { rosterRow, classAlley } = await import("../js/teacher/analyze.js");
  const play = phased();
  play.prologue.done = true;
  play.lessonsSeen = ["welcome", "guild"];
  play.dreamStage = 2;
  P.ensurePlay(play);
  play.alley.checked = { payday: { right: true, readFine: true }, creditUnion: { right: false, readFine: false } };
  let life = E.createLife({ seed: "teach", ageMonths: 228 });
  life = E.receiveCash(life, 300, "title loan").life;
  const raw = { uid: "u1", lifeJson: JSON.stringify(life), play };
  const row = rosterRow(raw);
  assert.equal(row.alleyRight, 1);
  assert.equal(row.alleyChecked, 2);
  assert.equal(row.lessons, 2);
  assert.equal(row.dreamStage, 2);
  assert.ok(row.flags.includes("titleLoan"));
  const table = classAlley([raw, { uid: "u2", play: phased() }]);
  const payday = table.find((t) => t.id === "payday");
  assert.deepEqual([payday.n, payday.rightPct, payday.readPct, payday.rightWhenReadPct], [1, 100, 100, 100]);
  assert.ok(table[0].trap, "traps are listed first");
});

test("the roster sorts by last name, then first name, with the Google name as a fallback", async () => {
  const { rosterRow, byName, rosterCsv } = await import("../js/teacher/analyze.js");
  const rows = [
    rosterRow({ uid: "a", studentName: "Zed Adams", onboarding: { firstName: "Zoe", lastName: "Brown" } }),
    rosterRow({ uid: "b", studentName: "Amy Brown", onboarding: {} }),
    rosterRow({ uid: "c", studentName: "Cara Ash" }),
  ];
  assert.deepEqual([rows[0].firstName, rows[0].lastName], ["Zoe", "Brown"], "the typed name wins");
  assert.deepEqual([rows[1].firstName, rows[1].lastName], ["Amy", "Brown"], "older students fall back to Google");
  assert.deepEqual(rows.slice().sort(byName).map((r) => r.uid), ["c", "b", "a"]);
  assert.ok(rosterCsv(rows).startsWith("Last name,First name,"));
});

test("the prologue allows exactly 3 shifts, one each of cashier, checks and overdraft", () => {
  const play = phased();
  assert.deepEqual(G.openJobs(play), G.PROLOGUE_JOBS);
  let life = E.createLife({ seed: "pro", ageMonths: CONFIG.onboarding.startAgeMonths });
  for (const job of G.PROLOGUE_JOBS) {
    const r = P.workShift(play, life, 60, `work shift: ${job}`, job);
    assert.ok(r.ok, job);
    life = r.life;
  }
  assert.deepEqual(play.prologue.worked, ["cashier", "checks", "overdraft"]);
  assert.equal(P.shiftsLeft(play), 0);
  assert.equal(P.workShift(play, life, 60, "one more", "cashier").ok, false, "no fourth shift");
  play.prologue.welcomed = true;
  assert.equal(G.prologueStep(play).id, "market", "the shift steps are done");
});
