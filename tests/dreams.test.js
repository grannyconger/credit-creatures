import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith, withCard } from "./helpers.js";
import { DREAMS, dreamProgress, finishStage, dreamSummary } from "../js/data/dreams.js";
import * as P from "../js/play.js";
import { INTRO_PANELS } from "../js/data/story.js";
import { LEDGER_ITEMS, LEDGER_BINS } from "../js/data/minigames.js";

function strings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}

test("story, dreams and ledger text follow the student text rules", () => {
  for (const s of strings([DREAMS, INTRO_PANELS, LEDGER_ITEMS, LEDGER_BINS])) {
    assert.ok(!s.includes("—") && !s.includes(";"), s);
  }
});

test("equity in Ledger Sort means investments, not profit or net worth", () => {
  const eq = LEDGER_ITEMS.filter((i) => i.answer === "equity");
  assert.ok(eq.length >= 6);
  for (const i of eq) assert.match(`${i.item} ${i.why}`, /stock|share|invest|fund/i, i.item);
  assert.ok(!LEDGER_ITEMS.some((i) => /net worth|profit your business kept|minus what you owe/i.test(i.item)));
  assert.match(LEDGER_BINS.equity.hint, /INVESTMENT/);
});

test("every dream has 3 stages with plain-language goals, and the last stage costs the most", () => {
  for (const [id, d] of Object.entries(DREAMS)) {
    assert.equal(d.stages.length, 3, id);
    for (const st of d.stages) {
      assert.ok(st.goals.length >= 2 && st.xp > 0, `${id}: ${st.title}`);
      for (const s of [st.title, st.story, st.costFor || ""]) assert.ok(!s.includes("—") && !s.includes(";"), s);
    }
    assert.ok(d.stages[2].cost > (d.stages[1].cost || 0), id);
    const sum = dreamSummary(d);
    assert.ok(sum.savings > d.stages[2].cost, `${id}: the savings goal leaves a cushion after paying`);
    assert.ok(sum.score >= 600, id);
  }
});

test("stages go in order: goals from the whole game, a cost, then the next stage", () => {
  let { life, id } = withCard(lifeWith({ seed: "dream", checking: 4000 }), { limit: 1000 });
  const play = P.newPlay();
  let p = dreamProgress(life, "scholar", play);
  assert.equal(p.stageIndex, 0);
  assert.equal(p.ready, false);
  assert.equal(p.stage.goals.find((g) => g.type === "desk").ok, false);
  assert.equal(finishStage(life, play, "scholar").ok, false, "can't finish a stage that isn't ready");

  // Stage 1: 3 Practice Desk sessions and $150 saved.
  play.desk.finished = 3;
  life = E.moveToSavings(life, 200).life;
  p = dreamProgress(life, "scholar", play);
  assert.ok(p.ready, JSON.stringify(p.stage.goals));
  const xp = play.xp;
  let r = finishStage(life, play, "scholar");
  assert.ok(r.ok && !r.complete);
  assert.equal(play.dreamStage, 1);
  assert.equal(play.xp, xp + DREAMS.scholar.stages[0].xp);
  life = r.life;

  // Stage 2 needs a score, so build history, and costs the application fee.
  play.stats.shifts = 6;
  for (let i = 0; i < 14; i++) {
    life = E.cardPurchase(life, id, 30, "x").life;
    life = E.endMonth(life).life;
    life = E.pay(life, id, E.findAccount(life, id).due.statementBalance).life;
  }
  p = dreamProgress(life, "scholar", play);
  assert.equal(p.stageIndex, 1);
  assert.equal(p.ready, life.score >= 620);
  if (p.ready) {
    const before = life.savings + life.checking;
    r = finishStage(life, play, "scholar");
    assert.ok(r.ok);
    assert.ok(Math.abs(r.life.savings + r.life.checking - (before - DREAMS.scholar.stages[1].cost)) < 0.01, "the fee is paid");
    assert.ok(r.life.log.length > life.log.length, "paying is a logged engine action");
  }

  // A late payment shows up in the habit goals.
  const late = E.endMonth(E.endMonth(E.cardPurchase(life, id, 300, "trip").life).life).life;
  const lateGoal = dreamProgress(late, "scholar", { ...play, dreamStage: 2 }).stage.goals.find((g) => g.type === "noLate");
  assert.equal(lateGoal.ok, false, "a late mark blocks the last stage for 6 months");
});

test("old saves: a finished dream counts as every stage done", () => {
  const old = P.ensurePlay({ chapter: 4, active: null, summary: null, history: [], seen: [], dreamDone: { dream: "home", month: 30 } });
  assert.equal(old.dreamStage, 3);
  const life = lifeWith({ seed: "old", checking: 100 });
  assert.equal(dreamProgress(life, "home", old).complete, true);
  assert.equal(P.ensurePlay({ chapter: 2, active: null, summary: null, history: [], seen: [] }).dreamStage, 0);
});
