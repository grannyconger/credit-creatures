// Every card says what to decide in a bold question, every choice moves Quality of
// Life, and the cards that ask students to work something out have a hint that
// never gives the answer (teacher request 2026-10-25).
import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith } from "./helpers.js";
import { sampleLives, CTXS } from "./sample-lives.js";
import { SCENARIOS } from "../js/data/scenarios.js";
import { LIFE_EVENTS } from "../js/data/life-events.js";
import { ASKS } from "../js/data/card-asks.js";
import { QOL } from "../js/data/card-qol.js";
import { HINTS } from "../js/data/card-hints.js";
import * as P from "../js/play.js";
import { CONFIG } from "../js/data/config.js";

const ALL = [...SCENARIOS, ...LIFE_EVENTS];
const asList = (t) => (Array.isArray(t) ? t : [t]);
const plain = (s, where) => {
  assert.equal(typeof s, "string", where);
  assert.ok(s.length > 0, where);
  assert.ok(!s.includes("—"), `em-dash in ${where}`);
  assert.ok(!s.includes(";"), `semicolon in ${where}`);
};

test("every card asks one explicit question, and nothing is asked that isn't a card", () => {
  const ids = new Set(ALL.map((c) => c.id));
  for (const c of ALL) {
    const ask = ASKS[c.id];
    plain(ask, `ask for ${c.id}`);
    assert.ok(ask.length <= 90, `${c.id}: the question is too long (${ask.length})`);
    assert.ok(ask.endsWith("?") || ask.startsWith("Nothing to decide here."), `${c.id}: "${ask}" must be a question, or say there is nothing to decide`);
  }
  for (const id of Object.keys(ASKS)) assert.ok(ids.has(id), `${id} has a question but no card`);
});

test("a card's story never repeats its bold question", () => {
  const lives = sampleLives();
  for (const def of ALL) {
    for (const life of Object.values(lives)) {
      for (const base of CTXS) {
        const ctx = { ...base, amount: def.amount ? def.amount[0] : 0 };
        if (def.fits && !def.fits(life, ctx)) continue;
        const text = asList(def.text(life, ctx)).join(" ");
        assert.ok(!text.includes(ASKS[def.id]), `${def.id}: the story repeats "${ASKS[def.id]}"`);
      }
    }
  }
});

test("every choice has Quality of Life points, and none are left over", () => {
  const lives = sampleLives();
  const seen = new Set();
  for (const def of ALL) {
    for (const life of Object.values(lives)) {
      for (const base of CTXS) {
        const ctx = { ...base, amount: def.amount ? def.amount[0] : 0 };
        if (def.fits && !def.fits(life, ctx)) continue;
        for (const c of def.choices(life, ctx)) {
          const pts = QOL[def.id]?.[c.key];
          assert.ok(Number.isInteger(pts), `${def.id}.${c.key} has no Quality of Life points`);
          assert.ok(pts >= -4 && pts <= 6, `${def.id}.${c.key}: ${pts} is outside -4 to +6`);
          seen.add(`${def.id}.${c.key}`);
        }
      }
    }
  }
  for (const [id, keys] of Object.entries(QOL)) for (const k of Object.keys(keys)) assert.ok(seen.has(`${id}.${k}`), `${id}.${k} has points but is never a choice`);
});

test("having fun lowers assets and raises Quality of Life, and the meter stays in its range", () => {
  assert.ok(QOL.weekendPlans.go > 0 && QOL.concert.pay > QOL.concert.skip, "treats raise it, going without lowers it");
  const q = CONFIG.pacing.qol;
  assert.equal(P.qolAfter(q.max - 1, 6), q.max);
  assert.equal(P.qolAfter(1, -4), q.min);
  assert.equal(P.qolAfter(undefined, 3), q.start + 3);
});

test("a choice moves the Quality of Life meter and reports it", () => {
  const life = lifeWith({ seed: "qol", checking: 800 });
  const play = P.newPlay();
  P.startChapter(play, life);
  assert.equal(play.qol, CONFIG.pacing.qol.start);
  const item = play.active.month.life ? "life" : 0;
  const choices = P.choicesFor(play, life, item);
  assert.ok(choices.every((c) => Number.isInteger(c.qol)), "every choice carries its points");
  const pick = choices.find((c) => !c.cost && !c.disabled);
  const r = P.choose(play, life, item, pick.key);
  assert.ok(r.ok);
  assert.equal(r.qol, pick.qol);
  assert.equal(play.qol, CONFIG.pacing.qol.start + pick.qol);
  assert.equal(r.qolNow, play.qol);
  assert.equal(play.active.decisions.at(-1).qol, pick.qol);
});

test("the side-by-side compares Quality of Life too", () => {
  const life = lifeWith({ seed: "cmp", checking: 300 });
  const choices = [
    { key: "go", label: "Go", cost: { amount: 25, item: "bowling" }, qol: 4 },
    { key: "stay", label: "Stay", qol: 0 },
  ];
  const rows = E.compareChoices(life, choices, { qol: 50 });
  const go = rows.find((r) => r.key === "go");
  assert.equal(go.metrics.qol, 54);
  assert.equal(go.delta.qol, 4);
  assert.ok(go.delta.checking < 0, "it costs assets");
  assert.equal(go.delta.owed, 0, "it adds no liabilities");
  assert.equal(E.startRow(life, 50).metrics.qol, 50);
});

test("hints say how to work it out, never the answer", () => {
  const ids = new Set(ALL.map((c) => c.id));
  const lives = sampleLives();
  for (const [id, h] of Object.entries(HINTS)) {
    assert.ok(ids.has(id), `${id} has a hint but no card`);
    assert.ok(Array.isArray(h.steps) && h.steps.length >= 1, `${id} steps`);
    h.steps.forEach((s, i) => plain(s, `${id} hint step ${i}`));
    if (h.calc) plain(h.calcTip, `${id} calculator tip`);
    assert.ok(!/the answer is/i.test(JSON.stringify(h)), `${id} hint gives the answer away`);
  }
  // Every quiz card has a hint, and the hint never contains the right number.
  for (const def of ALL) {
    for (const life of Object.values(lives)) {
      for (const base of CTXS) {
        const ctx = { ...base, amount: 0 };
        if (def.fits && !def.fits(life, ctx)) continue;
        const choices = def.choices(life, ctx);
        if (!choices.some((c) => c.quiz)) continue;
        assert.ok(HINTS[def.id], `${def.id} is a quiz card with no hint`);
        const right = choices.find((c) => c.quality === "good");
        const nums = (right.label.match(/[\d,.]+\d/g) || []).map((n) => n.replace(/,/g, ""));
        const hint = JSON.stringify(HINTS[def.id]).replace(/,/g, "");
        for (const n of nums) assert.ok(!new RegExp(`(^|[^\\d.])${n.replace(".", "\\.")}([^\\d]|$)`).test(hint), `${def.id}: the hint contains the right answer ${n}`);
      }
    }
  }
});

test("the car cards are examples only: no loan opens, no lease is signed and no money moves", () => {
  const life = lifeWith({ seed: "cars", checking: 900 });
  for (const id of ["carDecision", "carLease"]) {
    const def = ALL.find((c) => c.id === id);
    const text = asList(def.text(life, { chapter: 5, seen: [] })).join(" ");
    assert.match(text, /only an example/, `${id} says it's an example`);
    for (const c of def.choices(life, { chapter: 5, seen: [] })) {
      assert.ok(!c.steps && !c.cost, `${id}.${c.key} changes nothing in the game`);
      assert.match(typeof c.outcome === "string" ? c.outcome : "", /example/, `${id}.${c.key} outcome says so`);
      const r = E.resolveChoice(life, c, null);
      assert.equal(JSON.stringify(r.life), JSON.stringify(life), `${id}.${c.key} leaves the life alone`);
      assert.equal(QOL[id][c.key], 0, `${id}.${c.key} doesn't move Quality of Life`);
    }
  }
});
