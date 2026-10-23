import { test } from "node:test";
import assert from "node:assert/strict";
import { E } from "./helpers.js";
import { compareChoices, lifeMetrics, allSame } from "../js/engine/index.js";
import { SCENARIOS } from "../js/data/scenarios.js";
import { CONFIG } from "../js/data/config.js";

const ctx = { chapter: 4, seen: [], lastChange: null };

function rich() {
  let life = E.createLife({ seed: "pv", ageMonths: 17 * 12 });
  life = E.earn(life, 800, "shift").life;
  return life;
}

test("comparing choices never changes the starting life", () => {
  const life = rich();
  const before = JSON.stringify(life);
  let ran = 0;
  for (const def of SCENARIOS) {
    let choices;
    try {
      choices = def.choices(life, ctx);
    } catch {
      continue;
    }
    const rows = compareChoices(life, choices);
    assert.equal(rows.length, choices.length, def.id);
    ran++;
  }
  assert.equal(JSON.stringify(life), before, "the real life is untouched");
  assert.ok(ran > 5, "ran on many cards");
});

test("a paid choice shows less money, and a choice that can't be afforded says so", () => {
  const life = rich();
  const paid = { key: "buy", label: "Buy", cost: { amount: 300, item: "boots", methods: ["debit"] } };
  const free = { key: "skip", label: "Skip" };
  const rows = compareChoices(life, [paid, free], { chosenKey: "buy", chosenMethod: "debit" });
  assert.equal(rows[0].delta.checking, -300);
  assert.equal(rows[0].metrics.checking, life.checking - 300);
  assert.equal(rows[1].delta.checking, 0);
  assert.ok(rows[0].chosen && !rows[1].chosen);
  const broke = compareChoices(life, [{ key: "big", label: "Big", cost: { amount: 99999, item: "x", methods: ["debit"] } }]);
  assert.equal(broke[0].ok, false);
  assert.match(broke[0].reason, /can't pay/);
  assert.equal(allSame(rows), false);
  assert.equal(allSame(compareChoices(life, [free, { key: "also", label: "Also" }])), true);
});

test("metrics read the same numbers a student sees", () => {
  const life = rich();
  const m = lifeMetrics(life);
  assert.equal(m.checking, life.checking);
  assert.equal(m.owed, 0);
  assert.equal(m.score, null, "no score until there is history");
  assert.ok(CONFIG);
});
