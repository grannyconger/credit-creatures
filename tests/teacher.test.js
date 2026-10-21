import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith } from "./helpers.js";
import * as T from "../js/teacher/analyze.js";
import * as P from "../js/play.js";

function saveDoc(life, play, extra = {}) {
  return { uid: "u1", studentName: "Avery Stone", studentEmail: "avery@greermiddlecollege.org", displayName: "Avery", step: "hub", creature: { name: "Pip", lastName: "Moss" }, play, lifeJson: JSON.stringify(life), ...extra };
}

function playedLife() {
  let life = lifeWith({ seed: "teacher", checking: 900 });
  const r = E.applyForCard(life, { issuer: "truliant", product: "secured", requestedLimit: 300 });
  life = r.life;
  for (let i = 0; i < 8; i++) {
    life = E.cardPurchase(life, r.accountId, 30, "x").life;
    life = E.endMonth(life).life;
    const a = E.findAccount(life, r.accountId);
    if (a.due) life = E.pay(life, a.id, a.due.statementBalance).life;
  }
  return { life, id: r.accountId };
}

test("a clean save gives a roster row with no flags", () => {
  const { life } = playedLife();
  const play = P.newPlay();
  P.recordAnswer(play, { type: "utilization", standard: 3, correct: true });
  P.recordAnswer(play, { type: "tipMath", standard: 2, correct: false });
  const row = T.rosterRow(saveDoc(life, play));
  assert.equal(row.creatureName, "Pip Moss");
  assert.equal(row.onTimePct, 100);
  assert.equal(row.accuracyAll, 50);
  assert.equal(row.accuracy["3"], 100);
  assert.ok(row.accountTypes.includes("Card"));
  assert.deepEqual(row.flags, []);
  assert.deepEqual(row.mismatches, []);
});

test("an edited save is flagged because it no longer matches its log", () => {
  const { life } = playedLife();
  const tampered = { ...life, checking: life.checking + 5000 };
  const row = T.rosterRow(saveDoc(tampered, P.newPlay()));
  assert.ok(row.flags.includes("mismatch"));
  assert.match(row.mismatches[0], /checking/);
});

test("payday loans, maxed cards and many inquiries are flagged", () => {
  let { life, id } = playedLife();
  life = E.receiveCash(life, 300, "Quick Cash payday loan").life;
  life = E.cardPurchase(life, id, 290, "trip").life;
  for (const s of ["A", "B", "C"]) life = E.recordInquiry(life, `${s} store card`).life;
  const row = T.rosterRow(saveDoc(life, P.newPlay()));
  for (const f of ["payday", "maxed", "inquiries"]) assert.ok(row.flags.includes(f), `${f} in ${row.flags}`);
  assert.ok(!row.flags.includes("mismatch"));
});

test("CSV export quotes commas and quotes", () => {
  const { life } = playedLife();
  const row = T.rosterRow(saveDoc(life, P.newPlay(), { studentName: 'Stone, Avery "Ace"' }));
  const csv = T.rosterCsv([row]);
  const [head, line] = csv.split("\n");
  assert.match(head, /^Last name,First name,Google name,Email,/);
  assert.ok(line.includes(',"Stone, Avery ""Ace""",'));
});

test("student detail lists reflections and earned achievements", () => {
  const { life } = playedLife();
  const play = P.newPlay();
  play.history.push({ chapter: 2, title: "First card, first job", reflection: "Paying in full helped.", fun: 4, clear: 5, decisions: [] });
  play.achievements.firstCard = { month: 3, chapter: 2 };
  const d = T.studentDetail(saveDoc(life, play));
  assert.equal(d.reflections[0].text, "Paying in full helped.");
  assert.equal(d.achievements[0].id, "firstCard");
});

test("tuning numbers come from play telemetry and skip practice mode", () => {
  const batches = [
    { practice: false, events: [
      { type: "monthTime", seconds: 180 }, { type: "monthTime", seconds: 240 },
      ...Array.from({ length: 6 }, () => ({ type: "cardChoice", id: "storeCard", choice: "pay", ok: true, seconds: 10 })),
      { type: "cardReaction", id: "storeCard", reaction: "up", confusing: true },
      { type: "minigame", game: "ledger", pay: 96, right: 9, timed: true, reaction: "up" },
      { type: "question", qtype: "utilization", correct: true, seconds: 12, xp: 0 },
      { type: "chapterRating", chapter: 2, fun: 4, clear: 5 },
      { type: "error", message: "Boom" },
    ] },
    { practice: true, events: [{ type: "monthTime", seconds: 9999 }] },
  ];
  const t = T.tuning(batches, [{ score: 700 }, { score: 812 }, { score: null }]);
  assert.equal(t.minutesPerMonth.n, 2);
  assert.equal(t.minutesPerMonth.median, 3);
  assert.equal(t.cards[0].id, "storeCard");
  assert.equal(t.cards[0].lopsided, true);
  assert.equal(t.cards[0].confusing, 1);
  assert.equal(t.games[0].medianPay, 96);
  assert.equal(t.ratings[0].fun, 4);
  assert.equal(t.errors[0].message, "Boom");
  assert.equal(t.scoreBands.find((b) => b.lo === 670).n, 1);
  assert.equal(t.xpCapHits, 1);
  assert.equal(t.questions[0].type, "utilization");
});

test("old saves with the legacy credit union still replay cleanly", () => {
  let life = lifeWith({ seed: "legacy", checking: 600 });
  life = E.applyForCard(life, { issuer: "creditUnion", product: "secured", requestedLimit: 200 }).life;
  life = E.endMonth(life).life;
  assert.deepEqual(T.logMismatches(life), []);
});
