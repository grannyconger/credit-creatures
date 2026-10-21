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
  assert.deepEqual(G.openJobs(play), ["cashier"]);
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
