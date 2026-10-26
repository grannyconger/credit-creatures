// Score Chase's rules and acceptance tests (GAME-SPECS.md game 7).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as S from "../js/arcade/scorechase.js";
import { computeScore } from "../js/engine/index.js";
import { SC_CARDS, SC_SURPRISES } from "../js/data/arcade/scorechase.js";

const seeds = Array.from({ length: 40 }, (_, i) => `sc-${i}`);

test("the same seed plays the same 18 months", () => {
  const a = S.play("same", S.thoughtfulPick);
  const b = S.play("same", S.thoughtfulPick);
  assert.deepEqual(a.decisions, b.decisions);
  assert.equal(S.score(a).final, S.score(b).final);
  assert.equal(a.history.at(-1).month, S.MONTHS);
});

test("every card's text fits the spec: 35 words or less, choices 6 words or less", () => {
  const words = (t) => t.trim().split(/\s+/).length;
  for (const c of [...SC_CARDS, ...SC_SURPRISES]) {
    assert.ok(words(c.text) <= 35, `${c.id}: ${words(c.text)} words`);
    for (const ch of c.choices) assert.ok(words(ch.label) <= 6, `${c.id}: ${ch.label}`);
    assert.ok(c.ignore == null || c.choices[c.ignore], `${c.id} has an ignore choice`);
  }
  assert.ok(SC_CARDS.length + SC_SURPRISES.length >= 30);
});

test("no score until the first account is 6 months old, then a change reports a month later", () => {
  const s = S.newState(S.newShift("lag"));
  S.choose(s, 0); // autopay full
  S.endMonth(s);
  S.startMonth(s);
  S.choose(s, 0); // secured card in month 1
  for (let i = 0; i < 6; i++) {
    while (S.current(s)) S.choose(s, S.thoughtfulPick(S.current(s)));
    S.endMonth(s);
    S.startMonth(s);
  }
  assert.ok(s.result.score > 600, `score ${s.result.score} by month ${s.month}`);
  assert.ok(s.log.some((l) => /first time/.test(l.text)));
  // A big charge this month is pending, and only shows next month.
  const before = s.result.score;
  const card = S.mainCard(s);
  card.spend += 280;
  s.pending.add("owed");
  while (S.current(s)) S.choose(s, S.thoughtfulPick(S.current(s)));
  assert.equal(s.result.score, before, "not yet");
  S.endMonth(s);
  S.startMonth(s);
  assert.ok(s.result.score < before, `${before} to ${s.result.score}`);
  assert.match(s.log.at(-1).text, /Amounts owed/);
});

test("it scores with the game's real engine", () => {
  const s = S.play("real", S.thoughtfulPick);
  assert.equal(computeScore(s.reported).score, S.score(s).final);
});

test("acceptance: declining every offer never reaches 700", () => {
  for (const seed of seeds) assert.equal(S.score(S.play(seed, S.declinePick)).reached, false, seed);
});

test("acceptance: accepting every offer scores below thoughtful play", () => {
  for (const seed of seeds) {
    const yes = S.score(S.play(seed, S.acceptPick));
    const good = S.score(S.play(seed, S.thoughtfulPick));
    assert.ok(yes.metric < good.metric, `${seed}: ${yes.metric} vs ${good.metric}`);
  }
});

test("thoughtful play reaches 700 on most seeds, and timing out picks the do-nothing choice", () => {
  const reached = seeds.filter((seed) => S.score(S.play(seed, S.thoughtfulPick)).reached).length;
  assert.ok(reached >= seeds.length * 0.9, `${reached} of ${seeds.length}`);
  const s = S.newState(S.newShift("timeout"));
  S.choose(s, 0);
  S.endMonth(s);
  S.startMonth(s);
  const out = S.choose(s, null);
  assert.equal(out.choice.label, "Not yet");
  assert.ok(out.timedOut);
});

test("cosigning bites back months later", () => {
  for (const seed of seeds) {
    const s = S.play(seed, S.acceptPick);
    const c = s.decisions.find((d) => d.card === "cosign");
    if (!c) continue;
    const bite = s.decisions.find((d) => d.card === "cosignBite");
    if (c.month + s.deal.cosignDelay <= S.MONTHS) assert.ok(bite, seed);
    if (bite) {
      assert.ok(bite.month - c.month >= 4 && bite.month - c.month <= 8, seed);
      return;
    }
  }
  assert.fail("no seed drew the cosign card");
});
