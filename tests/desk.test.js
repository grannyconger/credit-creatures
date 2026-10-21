import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith, withCard } from "./helpers.js";
import { QUESTION_TYPES, FACTOR_CHECKS, factorOptions, factorChoice } from "../js/data/practice-questions.js";
import * as X from "../js/data/explainers.js";
import * as P from "../js/play.js";
import { CONFIG } from "../js/data/config.js";

function strings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}

const clean = (s, where) => {
  assert.ok(!s.includes("—"), `em-dash in ${where}: ${s}`);
  assert.ok(!s.includes(";"), `semicolon in ${where}: ${s}`);
  assert.ok(!/undefined|NaN|\[object/.test(s), `bad value in ${where}: ${s}`);
};

test("every question type makes 3 or 4 distinct choices with the right answer among them", () => {
  for (const [type, q] of Object.entries(QUESTION_TYPES)) {
    assert.ok([1, 2, 3, 5].includes(q.standard), type);
    for (let i = 0; i < 300; i++) {
      const made = q.make(E.createRng(`${type}:${i}`));
      // Card accounting has only 3 honest answers (up, down, same).
      assert.equal(made.choices.length, type === "cardAccounting" ? 3 : 4, `${type} #${i}: ${made.choices}`);
      assert.equal(new Set(made.choices).size, made.choices.length, `${type} #${i} duplicates: ${made.choices}`);
      assert.ok(made.answer >= 0 && made.answer < made.choices.length, type);
      for (const s of [...made.prompt, ...made.choices, made.math]) clean(s, type);
    }
  }
});

test("the math in number questions is right", () => {
  for (let i = 0; i < 200; i++) {
    const q = QUESTION_TYPES.utilization.make(E.createRng(`u${i}`));
    const [bal, limit] = q.prompt[0].match(/\$[\d,.]+/g).map((x) => Number(x.replace(/[$,]/g, "")));
    assert.equal(q.choices[q.answer], `${Math.round((bal / limit) * 100)}%`);
    const r = QUESTION_TYPES.runningBalance.make(E.createRng(`r${i}`));
    const [b, buy, paid] = r.prompt[0].match(/\$[\d,.]+/g).map((x) => Number(x.replace(/[$,]/g, "")));
    assert.equal(r.choices[r.answer], E.dollars(b + buy - paid));
  }
});

test("factor checks offer the right factor and direction", () => {
  for (const f of FACTOR_CHECKS) {
    const o = factorOptions(E.createRng(f.text), f.key, f.dir);
    assert.equal(o.choices[o.answer], factorChoice(f.key, f.dir));
    assert.equal(new Set(o.choices).size, 4);
  }
});

test("My Score and inbox text follow the student text rules", () => {
  for (const s of strings([X.FACTOR_EXPLAINERS, X.SCORE_BANDS, X.INBOX_TYPES, FACTOR_CHECKS])) clean(s, "explainers");
  assert.deepEqual(Object.keys(X.FACTOR_EXPLAINERS).sort(), ["length", "mix", "newCredit", "owed", "payment"]);
  assert.equal(X.bandFor(300).label, "Poor");
  assert.equal(X.bandFor(735).label, "Good");
  assert.equal(X.bandFor(850).label, "Excellent");
});

test("Sparkle Points stop at 10 per chapter and 30 total", () => {
  const play = P.newPlay();
  const cap = CONFIG.pacing.sparkle;
  let got = 0;
  for (let i = 0; i < 25; i++) got += P.recordAnswer(play, { type: "utilization", standard: 3, correct: true }).sparkle;
  assert.equal(got, cap.perChapter);
  assert.equal(P.sparkleLeft(play), 0);
  for (let ch = 3; ch <= 8; ch++) {
    play.chapter = ch;
    for (let i = 0; i < 12; i++) got += P.recordAnswer(play, { type: "tipMath", standard: 2, correct: true }).sparkle;
  }
  assert.equal(got, cap.total);
  assert.deepEqual(P.recordAnswer(play, { type: "tipMath", standard: 2, correct: false }), { sparkle: 0, xp: 0 });
  assert.equal(play.desk.byStandard["2"].total, 73);
  assert.equal(play.desk.byType.utilization.right, 25);
});

test("End Month fills the inbox, and due reminders appear for unpaid minimums", () => {
  const play = P.newPlay();
  let { life, id } = withCard(lifeWith({ seed: "inbox", checking: 600 }), { limit: 500 });
  life = E.cardPurchase(life, id, 120, "stuff").life;
  P.startChapter(play, life);
  for (const item of [...(play.active.month.life ? ["life"] : []), ...play.active.month.cards.map((_, i) => i)]) P.skipItem(play, item);
  const r = P.finishMonth(play, life);
  assert.ok(r.ok);
  const types = play.inbox.map((n) => n.type);
  assert.ok(types.includes("statement"), types.join(","));
  assert.ok(types.includes("due"), types.join(","));
  assert.ok(P.unreadCount(play) > 0);
  P.markRead(play, play.inbox[0].id);
  assert.equal(play.inbox[0].read, true);
  P.markAllRead(play);
  assert.equal(P.unreadCount(play), 0);
  for (let i = 0; i < 60; i++) P.addNote(play, "fee", `Fee ${i}`, 1);
  assert.equal(play.inbox.length, X.INBOX_KEPT);
});

test("a chapter release is announced once", () => {
  const play = P.newPlay();
  assert.equal(P.announceChapter(play, 1), false);
  assert.equal(P.announceChapter(play, 2), true);
  assert.equal(P.announceChapter(play, 2), false);
  assert.equal(play.inbox[0].type, "chapter");
});

test("old saves get the new play fields", () => {
  const old = { chapter: 3, active: null, summary: null, history: [], seen: [], shiftBonus: 0, lastChange: null };
  const p = P.ensurePlay(old);
  assert.deepEqual(p.inbox, []);
  assert.equal(p.theme, "royal");
  assert.equal(p.sparkle.total, 0);
});

test("XP from right answers stops at the chapter cap, but accuracy keeps counting", () => {
  const play = P.newPlay();
  const cap = CONFIG.pacing.xp.answersPerChapter;
  for (let i = 0; i < 40; i++) P.recordAnswer(play, { type: "utilization", standard: 3, correct: true });
  assert.equal(play.xp, cap);
  assert.equal(P.answerXpLeft(play), 0);
  assert.equal(play.desk.byType.utilization.right, 40);
  assert.equal(P.recordAnswer(play, { type: "utilization", standard: 3, correct: true }).xp, 0);
  play.chapter = 3;
  assert.equal(P.answerXpLeft(play), cap);
  assert.equal(P.recordAnswer(play, { type: "utilization", standard: 3, correct: true }).xp, CONFIG.pacing.xp.rightAnswer);
});
