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
  life = E.receiveCash(life, 300, "Check Into Dash payday loan").life;
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

test("student detail lists earned achievements", () => {
  const { life } = playedLife();
  const play = P.newPlay();
  play.history.push({ chapter: 2, title: "First card, first job", decisions: [] });
  play.achievements.firstCard = { month: 3, chapter: 2 };
  const d = T.studentDetail(saveDoc(life, play));
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

test("pasted reset emails keep school addresses only, once each", async () => {
  const { parseEmails } = await import("../js/teacher/analyze.js");
  const r = parseEmails("A.Lee@GreerMiddleCollege.org, b.ray@greermiddlecollege.org\n\na.lee@greermiddlecollege.org; me@gmail.com");
  assert.deepEqual(r.good, ["a.lee@greermiddlecollege.org", "b.ray@greermiddlecollege.org"]);
  assert.deepEqual(r.bad, ["me@gmail.com"]);
  assert.deepEqual(parseEmails("   ").good, []);
});

// ---------- The dashboard's summary (2026-10-23) ----------

const row = (o) => ({ uid: o.uid || "u", firstName: "A", lastName: o.uid || "u", step: "hub", chapter: 1, chaptersDone: 0, accuracyAll: null, flags: [], lastPlayed: null, ...o });

test("lastPlayed reads Firestore timestamps, numbers and dates", () => {
  assert.equal(T.lastPlayed({ seconds: 100 }), 100000);
  assert.equal(T.lastPlayed({ toMillis: () => 5 }), 5);
  assert.equal(T.lastPlayed(42), 42);
  assert.equal(T.lastPlayed("2026-10-01T00:00:00Z"), Date.parse("2026-10-01T00:00:00Z"));
  assert.equal(T.lastPlayed(null), null);
  assert.equal(T.lastPlayed("not a date"), null);
});

test("needsHelp lists flagged and inactive students, most reasons first", () => {
  const now = Date.parse("2026-10-23T12:00:00Z");
  const day = 86400000;
  const out = T.needsHelp(
    [
      row({ uid: "fine", lastPlayed: now - day }),
      row({ uid: "quiet", lastPlayed: now - 6 * day }),
      row({ uid: "both", flags: ["payday"], lastPlayed: now - 9 * day }),
      row({ uid: "never" }),
    ],
    { now, inactiveDays: 5 }
  );
  assert.deepEqual(out.map((x) => x.uid), ["both", "quiet"]);
  assert.equal(out[0].reasons[0].label, "Took a payday loan");
  assert.equal(out[1].reasons[0].label, "Hasn't played in 6 days");
});

test("pacing sorts the class against the open chapter", () => {
  const p = T.pacing(
    [
      row({ uid: "a", chaptersDone: 2, chapter: 3 }),
      row({ uid: "b", chaptersDone: 1, chapter: 2 }),
      row({ uid: "c", chaptersDone: 0, chapter: 1 }),
      row({ uid: "d", step: "prologue" }),
      row({ uid: "e", step: "creature" }),
    ],
    2,
    0.75
  );
  assert.deepEqual(p, { finished: 1, working: 1, behind: 1, prologue: 1, setup: 1, total: 5, ready: false });
  assert.equal(T.pacing([row({ chaptersDone: 1 })], 1).ready, true);
});

test("gradeSummary gives class medians", () => {
  const g = T.gradeSummary([row({ uid: "a", chaptersDone: 2, accuracyAll: 80 }), row({ uid: "b", chaptersDone: 1, accuracyAll: 60 }), row({ uid: "c", chaptersDone: 1 })]);
  assert.equal(g.practice, 60);
  assert.equal(g.chapters, 1);
  assert.equal(g.noPractice, 1);
});

// ---------- Teacher page round 2 (2026-10-23) ----------

test("quietStudents flags students who saved today but not lately", () => {
  const now = new Date(2026, 9, 23, 10, 30).getTime();
  const min = 60000;
  const out = T.quietStudents(
    [
      row({ uid: "busy", lastPlayed: now - 2 * min }),
      row({ uid: "quiet", lastPlayed: now - 9 * min }),
      row({ uid: "quieter", lastPlayed: now - 30 * min }),
      row({ uid: "absent", lastPlayed: now - 26 * 60 * min }),
      row({ uid: "never" }),
    ],
    { now, quietMinutes: 8 }
  );
  assert.deepEqual(out.map((x) => [x.uid, x.minutes]), [["quieter", 30], ["quiet", 9]]);
});

test("standardBand gives a word for every percent", () => {
  assert.equal(T.standardBand(null).label, "No answers");
  assert.equal(T.standardBand(85).label, "Strong");
  assert.equal(T.standardBand(80).label, "Strong");
  assert.equal(T.standardBand(65).label, "Getting there");
  assert.equal(T.standardBand(40).label, "Needs help");
});

test("reteach finds weak question types and rough card choices", () => {
  const mk = (uid, right, rough) => {
    const play = P.newPlay();
    for (let i = 0; i < 4; i++) P.recordAnswer(play, { type: "runningBalance", standard: 2, correct: i < right });
    play.history.push({ chapter: 1, title: "Ch 1", decisions: [{ id: "paydayLoan", title: "Payday loan", label: rough ? "Take it" : "Skip it", quality: rough ? "bad" : "good" }] });
    return { uid, play };
  };
  const r = T.reteach([mk("a", 1, true), mk("b", 2, true), mk("c", 4, false)], { minAnswers: 5, minStudents: 3 });
  assert.equal(r.questions[0].label, "Running balance");
  assert.equal(r.questions[0].accuracy, 58);
  assert.deepEqual(r.decisions.map((d) => [d.id, d.roughPct, d.commonRough]), [["paydayLoan", 67, "Take it"]]);
});

test("timeline groups play logs into sessions", () => {
  const t0 = Date.parse("2026-10-23T14:00:00Z");
  const out = T.timeline([
    { sessionId: "s1", createdAt: { seconds: (t0 + 5 * 60000) / 1000 }, month: 2, chapter: 1, events: [{ t: 0, type: "cardChoice" }, { t: 300, type: "minigame" }] },
    { sessionId: "s1", createdAt: { seconds: (t0 + 20 * 60000) / 1000 }, month: 3, chapter: 1, events: [{ t: 1200, type: "question", correct: true }, { t: 1200, type: "monthTime" }] },
    { sessionId: "s0", createdAt: { seconds: (t0 - 86400000) / 1000 }, month: 1, chapter: 1, events: [{ t: 60, type: "lessonStart" }] },
    { sessionId: "p", practice: true, createdAt: { seconds: t0 / 1000 }, events: [{ t: 1, type: "cardChoice" }] },
  ]);
  assert.equal(out.length, 2);
  assert.equal(out[0].id, "s1");
  assert.equal(out[0].minutes, 20);
  assert.deepEqual([out[0].cards, out[0].shifts, out[0].questions, out[0].right, out[0].months, out[0].saves], [1, 1, 1, 1, 1, 2]);
  assert.deepEqual(out[0].gameMonths, [2, 3]);
});

test("lastSeen takes the newer of the save and the leaderboard heartbeat", () => {
  const out = T.lastSeen(
    [row({ uid: "a", lastPlayed: 1000 }), row({ uid: "b", lastPlayed: 5000 }), row({ uid: "c" }), row({ uid: "d", lastPlayed: 7 })],
    [{ uid: "a", updatedAt: { seconds: 3 } }, { uid: "b", updatedAt: { seconds: 1 } }, { uid: "c", updatedAt: 42 }]
  );
  assert.deepEqual(out.map((r) => r.lastPlayed), [3000, 5000, 42, 7]);
});
