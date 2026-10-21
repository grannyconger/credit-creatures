import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith, withCard } from "./helpers.js";
import { DREAMS, dreamProgress } from "../js/data/dreams.js";
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

test("dream progress needs savings, a score and clean habits", () => {
  let { life, id } = withCard(lifeWith({ seed: "dream", checking: 4000 }), { limit: 1000 });
  const p0 = dreamProgress(life, "scholar");
  assert.equal(p0.ready, false);
  assert.equal(p0.score.share, 0);
  for (let i = 0; i < 14; i++) {
    life = E.cardPurchase(life, id, 30, "x").life;
    life = E.endMonth(life).life;
    life = E.pay(life, id, E.findAccount(life, id).due.statementBalance).life;
  }
  life = E.moveToSavings(life, 900).life;
  const p = dreamProgress(life, "scholar");
  assert.ok(p.savings.ok && p.habits.ok, JSON.stringify(p.habits));
  assert.equal(p.score.ok, life.score >= DREAMS.scholar.score);
  assert.equal(p.ready, p.score.ok);
  const late = E.endMonth(E.endMonth(E.cardPurchase(life, id, 300, "trip").life).life).life;
  assert.equal(dreamProgress(late, "scholar").habits.list[1].ok, false, "a late mark blocks the dream for 6 months");
});
