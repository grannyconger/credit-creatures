// Teacher dashboard math (SPEC §20, docs/FEEDBACK.md). Pure functions over save
// docs and telemetry batches, so they run in Node tests. No DOM, no Firebase.
import { replayLife, amountOwed, utilization, hardInquiriesInWindow, buildReport } from "../engine/index.js";
import { ensurePlay } from "../play.js";
import { rankFor } from "../progress.js";
import { ACHIEVEMENTS } from "../data/achievements.js";
import { STANDARD_LABELS } from "../data/practice-questions.js";

const ACCOUNT_LABELS = {
  card: "Card",
  authorizedUser: "Parent's card",
  creditBuilderLoan: "Credit-builder loan",
  autoLoan: "Auto loan",
  studentLoan: "Federal student loan",
  privateStudentLoan: "Private student loan",
  cosigned: "Cosigned",
  bnpl: "BNPL",
};

export const FLAGS = {
  payday: { icon: "💵", label: "Took a payday loan" },
  collections: { icon: "🚨", label: "An account went to collections" },
  maxed: { icon: "📈", label: "A card is 90% or more used" },
  inquiries: { icon: "🔎", label: "3 or more hard inquiries this year" },
  mismatch: { icon: "⚠️", label: "Numbers don't match the activity log" },
};

// Save doc from Firestore -> { life, play, creature, ... }.
export function parseSave(doc) {
  const life = typeof doc.lifeJson === "string" && doc.lifeJson ? JSON.parse(doc.lifeJson) : doc.life || null;
  return { ...doc, life, play: doc.play ? ensurePlay(structuredClone(doc.play)) : null };
}

// Rebuilds the life from its log and compares the money. Someone editing their
// save in dev tools would change balances without matching log entries.
// Returns the list of differences (empty when everything matches).
export function logMismatches(life) {
  if (!life?.start || !Array.isArray(life.log)) return ["No activity log"];
  let again;
  try {
    again = replayLife(life.start, life.log);
  } catch (err) {
    return [`The log can't be replayed: ${err.message}`];
  }
  const out = [];
  const near = (a, b) => Math.abs((a || 0) - (b || 0)) < 0.01;
  for (const k of ["checking", "savings", "heldSavings"]) if (!near(life[k], again[k])) out.push(`${k}: saved ${life[k]}, log says ${again[k]}`);
  for (const a of life.accounts) {
    const b = again.accounts.find((x) => x.id === a.id);
    if (!b) out.push(`${a.name}: not in the log`);
    else if (!near(amountOwed(a), amountOwed(b)) || a.status !== b.status) out.push(`${a.name}: saved ${amountOwed(a)} (${a.status}), log says ${amountOwed(b)} (${b.status})`);
  }
  if (again.accounts.length !== life.accounts.length) out.push("A different number of accounts than the log");
  return out;
}

function decisionsOf(play) {
  if (!play) return [];
  return [...play.history.flatMap((h) => h.decisions || []), ...(play.summary?.decisions || []), ...(play.active?.decisions || [])];
}

function pct(right, total) {
  return total ? Math.round((right / total) * 100) : null;
}

// One roster row per student (SPEC §20).
export function rosterRow(raw) {
  const s = parseSave(raw);
  const life = s.life;
  const play = s.play;
  const row = {
    uid: raw.uid,
    studentName: raw.studentName || "",
    studentEmail: raw.studentEmail || "",
    displayName: raw.displayName || "",
    creatureName: [s.creature?.name, s.creature?.lastName].filter(Boolean).join(" "),
    // Phase 10 saves show "prologue" until the bank account opens.
    step: play?.progression === 2 && play.prologue && !play.prologue.done ? "prologue" : raw.step || "",
    updatedAt: raw.updatedAt || null,
    xp: play?.xp ?? 0,
    rank: rankFor(play?.xp ?? 0).title,
    score: life?.score ?? null,
    chapter: play?.chapter ?? 1,
    // Before Phase 10, finishing onboarding counted as Chapter 1.
    chaptersDone: (play?.history.length ?? 0) + (play?.progression !== 2 && (raw.step === "hub" || raw.step === "done") ? 1 : 0),
    reflections: play?.history.filter((h) => h.reflection).length ?? 0,
    onTimePct: null,
    utilization: null,
    accountTypes: [],
    accuracy: {},
    accuracyAll: null,
    achievements: Object.keys(play?.achievements || {}).length,
    flags: [],
    mismatches: [],
  };
  if (!life) return row;

  let ok = 0;
  let total = 0;
  for (const a of life.accounts) {
    if (a.owner === "authorized") continue;
    for (const h of a.history) {
      total++;
      if (h.code === "OK") ok++;
    }
  }
  row.onTimePct = pct(ok, total);
  const u = utilization(life);
  row.utilization = u == null ? null : Math.round(u * 100);
  row.accountTypes = [...new Set(life.accounts.filter((a) => ["open", "paid", "collections"].includes(a.status)).map((a) => ACCOUNT_LABELS[a.type] || a.type))];

  if (play) {
    let r = 0;
    let t = 0;
    for (const [std, v] of Object.entries(play.desk.byStandard)) {
      row.accuracy[std] = pct(v.right, v.total);
      r += v.right;
      t += v.total;
    }
    row.accuracyAll = pct(r, t);
  }

  const decisions = decisionsOf(play);
  if (decisions.some((d) => d.id === "paydayLoan" && d.choice === "payday") || life.log.some((e) => e.action === "receiveCash" && /payday/i.test(e.args[1] || ""))) row.flags.push("payday");
  if (life.accounts.some((a) => ["collections", "collectionPaid"].includes(a.status))) row.flags.push("collections");
  if (life.accounts.some((a) => a.kind === "revolving" && a.owner === "self" && a.status === "open" && a.limit > 0 && amountOwed(a) / a.limit >= 0.9)) row.flags.push("maxed");
  if (hardInquiriesInWindow(life) >= 3) row.flags.push("inquiries");
  row.mismatches = logMismatches(life);
  if (row.mismatches.length) row.flags.push("mismatch");
  return row;
}

// Everything the student detail view shows (SPEC §20).
export function studentDetail(raw) {
  const s = parseSave(raw);
  const play = s.play;
  return {
    row: rosterRow(raw),
    creature: s.creature,
    life: s.life,
    play,
    report: s.life ? buildReport(s.life) : null,
    decisions: decisionsOf(play),
    reflections: (play?.history || []).filter((h) => h.reflection).map((h) => ({ chapter: h.chapter, title: h.title, text: h.reflection, fun: h.fun, clear: h.clear, startScore: h.startScore, endScore: h.endScore })),
    achievements: ACHIEVEMENTS.filter((a) => play?.achievements[a.id]).map((a) => ({ ...a, ...play.achievements[a.id] })),
  };
}

// The tuning export (docs/PILOT.md): no names or emails, just numbers and each
// student's action log, which scripts/replay.js re-runs under new settings.
export function tuningExport({ className, tuningData, rows, saves }) {
  const ids = new Map(rows.map((r, i) => [r.uid, `Student ${i + 1}`]));
  return {
    exportedAt: new Date().toISOString(),
    class: className,
    anonymous: true,
    tuning: tuningData,
    roster: rows.map(({ studentName, studentEmail, displayName, creatureName, uid, ...rest }) => ({ student: ids.get(uid), ...rest })),
    lives: saves
      .map((s) => parseSave(s))
      .filter((s) => s.life?.start && Array.isArray(s.life.log))
      .map((s) => ({ student: ids.get(s.uid), start: { ...s.life.start, name: "" }, log: s.life.log, chapter: s.play?.chapter ?? 1 })),
  };
}

// ---------- CSV export for the gradebook ----------

const CSV_COLUMNS = [
  ["Student", (r) => r.studentName],
  ["Email", (r) => r.studentEmail],
  ["Display name", (r) => r.displayName],
  ["Creature", (r) => r.creatureName],
  ["Chapters done", (r) => r.chaptersDone],
  ["Reflections", (r) => r.reflections],
  ["Practice accuracy %", (r) => r.accuracyAll],
  ...Object.entries(STANDARD_LABELS).map(([std, label]) => [`${label} %`, (r) => r.accuracy[std]]),
  ["XP", (r) => r.xp],
  ["Rank", (r) => r.rank],
  ["Achievements", (r) => r.achievements],
  ["Score", (r) => r.score],
  ["On-time %", (r) => r.onTimePct],
  ["Utilization %", (r) => r.utilization],
  ["Accounts", (r) => r.accountTypes.join("; ")],
  ["Flags", (r) => r.flags.map((f) => FLAGS[f].label).join("; ")],
];

function cell(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function rosterCsv(rows) {
  return [CSV_COLUMNS.map(([h]) => cell(h)).join(","), ...rows.map((r) => CSV_COLUMNS.map(([, f]) => cell(f(r))).join(","))].join("\n");
}

// ---------- Tuning (docs/FEEDBACK.md section 3) ----------

const median = (xs) => {
  const a = xs.filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
  return a.length ? a[Math.floor((a.length - 1) / 2)] : null;
};
const mean = (xs) => (xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : null);

// batches = telemetry event docs ({ events: [...], practice, ... }) from every student.
export function tuning(batches, rows = []) {
  const events = batches.filter((b) => !b.practice).flatMap((b) => b.events || []);
  const of = (type) => events.filter((e) => e.type === type);

  const monthSeconds = of("monthTime").map((e) => e.seconds);

  const cards = {};
  for (const e of [...of("cardChoice"), ...of("lifeCardChoice")]) {
    if (!e.ok) continue;
    const c = (cards[e.id] ??= { id: e.id, n: 0, choices: {}, seconds: [], up: 0, meh: 0, down: 0, confusing: 0 });
    c.n++;
    c.choices[e.choice] = (c.choices[e.choice] || 0) + 1;
    c.seconds.push(e.seconds);
  }
  for (const e of of("cardReaction")) {
    const c = cards[e.id];
    if (!c) continue;
    if (e.reaction) c[e.reaction]++;
    if (e.confusing) c.confusing++;
  }
  const cardRows = Object.values(cards)
    .map((c) => {
      const top = Math.max(...Object.values(c.choices));
      return { id: c.id, n: c.n, choices: c.choices, medianSeconds: median(c.seconds), topShare: c.n ? top / c.n : 0, lopsided: c.n >= 5 && top / c.n >= 0.8, up: c.up, meh: c.meh, down: c.down, confusing: c.confusing };
    })
    .sort((a, b) => b.confusing - a.confusing || b.n - a.n);

  const games = {};
  for (const e of of("minigame")) {
    const g = (games[e.game] ??= { game: e.game, n: 0, pay: [], right: [], untimed: 0, up: 0, meh: 0, down: 0 });
    g.n++;
    g.pay.push(e.pay);
    g.right.push(e.right);
    if (e.timed === false) g.untimed++;
    if (e.reaction) g[e.reaction]++;
  }
  const gameRows = Object.values(games).map((g) => ({ game: g.game, n: g.n, medianPay: median(g.pay), medianRight: median(g.right), untimed: g.untimed, up: g.up, meh: g.meh, down: g.down }));

  const qs = {};
  for (const e of of("question")) {
    const q = (qs[e.qtype] ??= { type: e.qtype, n: 0, right: 0, seconds: [] });
    q.n++;
    if (e.correct) q.right++;
    q.seconds.push(e.seconds);
  }
  const questionRows = Object.values(qs).map((q) => ({ type: q.type, n: q.n, accuracy: pct(q.right, q.n), medianSeconds: median(q.seconds) }));

  const ratings = {};
  for (const e of of("chapterRating")) {
    const r = (ratings[e.chapter] ??= { chapter: e.chapter, fun: [], clear: [] });
    r.fun.push(e.fun);
    r.clear.push(e.clear);
  }
  const ratingRows = Object.values(ratings).map((r) => ({ chapter: r.chapter, n: r.fun.length, fun: mean(r.fun), clear: mean(r.clear) }));

  const errors = {};
  for (const e of of("error")) errors[e.message || "Unknown error"] = (errors[e.message || "Unknown error"] || 0) + 1;

  const scores = rows.map((r) => r.score).filter((s) => s != null);
  const bands = [[300, 579], [580, 669], [670, 739], [740, 799], [800, 850]].map(([lo, hi]) => ({ lo, hi, n: scores.filter((s) => s >= lo && s <= hi).length }));

  return {
    events: events.length,
    minutesPerMonth: { n: monthSeconds.length, median: monthSeconds.length ? Math.round((median(monthSeconds) / 60) * 10) / 10 : null, targetLow: 3, targetHigh: 4 },
    cards: cardRows,
    games: gameRows,
    questions: questionRows,
    ratings: ratingRows.sort((a, b) => a.chapter - b.chapter),
    errors: Object.entries(errors).map(([message, n]) => ({ message, n })).sort((a, b) => b.n - a.n),
    scoreBands: bands,
    xpCapHits: of("question").filter((e) => e.correct && e.xp === 0).length,
  };
}
