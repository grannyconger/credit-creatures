// Teacher dashboard math (SPEC §20, docs/FEEDBACK.md). Pure functions over save
// docs and telemetry batches, so they run in Node tests. No DOM, no Firebase.
import { replayLife, amountOwed, utilization, hardInquiriesInWindow, buildReport } from "../engine/index.js";
import { ensurePlay } from "../play.js";
import { rankFor } from "../progress.js";
import { ACHIEVEMENTS } from "../data/achievements.js";
import { STANDARD_LABELS } from "../data/practice-questions.js";
import { STALLS, alleyProgress } from "../data/alley.js";
import { LESSON_ORDER } from "../data/lessons.js";
import { QUESTION_TYPES } from "../data/practice-questions.js";

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

// icon is kept for the CSV and older views. mark is a drawn icon name from
// js/ui/icons.js for the dashboard (2026-10-23).
export const FLAGS = {
  payday: { short: "Payday loan", icon: "💵", mark: "coins", label: "Took a payday loan" },
  titleLoan: { short: "Title loan", icon: "🛻", mark: "car", label: "Took a title loan" },
  collections: { short: "Collections", icon: "🚨", mark: "alert", label: "An account went to collections" },
  maxed: { short: "Maxed card", icon: "📈", mark: "card", label: "A card is 90% or more used" },
  inquiries: { short: "Many inquiries", icon: "🔎", mark: "report", label: "3 or more hard inquiries this year" },
  mismatch: { short: "Log mismatch", icon: "⚠️", mark: "info", label: "Numbers don't match the activity log" },
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

// First and last name the student typed, or the Google name split in two.
function nameParts(raw) {
  const ob = raw.onboarding || {};
  if (ob.firstName || ob.lastName) return { firstName: ob.firstName || "", lastName: ob.lastName || "" };
  const parts = (raw.studentName || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

// Last name, then first name (the roster's default order).
export function byName(a, b) {
  return (a.lastName || "").localeCompare(b.lastName || "") || (a.firstName || "").localeCompare(b.firstName || "");
}

// One roster row per student (SPEC §20).
export function rosterRow(raw) {
  const s = parseSave(raw);
  const life = s.life;
  const play = s.play;
  const row = {
    uid: raw.uid,
    studentName: raw.studentName || "",
    // The student's own first and last name (2026-10-21), or their Google name split.
    ...nameParts(raw),
    studentEmail: raw.studentEmail || "",
    displayName: raw.displayName || "",
    creatureName: [s.creature?.name, s.creature?.lastName].filter(Boolean).join(" "),
    // Phase 10 saves show "prologue" until the bank account opens.
    step: play?.progression === 2 && play.prologue && !play.prologue.done ? "prologue" : raw.step || "",
    updatedAt: raw.updatedAt || null,
    lastPlayed: lastPlayed(raw.updatedAt),
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
    // Phase 14: the newer parts of the game.
    alleyRight: null,
    alleyChecked: 0,
    lessons: play?.lessonsSeen?.length ?? 0,
    dreamStage: play ? (play.dreamDone ? 3 : play.dreamStage || 0) : 0,
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
    const alley = alleyProgress(play);
    row.alleyChecked = alley.checked;
    row.alleyRight = alley.checked ? alley.right : null;
  }

  const decisions = decisionsOf(play);
  if (decisions.some((d) => d.id === "paydayLoan" && d.choice === "payday") || life.log.some((e) => e.action === "receiveCash" && /payday/i.test(e.args[1] || ""))) row.flags.push("payday");
  if (decisions.some((d) => (d.id === "titleLoan" && d.choice === "take") || (d.id === "carRepairOffer" && d.choice === "title")) || life.log.some((e) => e.action === "receiveCash" && /title loan/i.test(e.args[1] || ""))) row.flags.push("titleLoan");
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

// Lantern Alley for the whole class: which offers fool students, and whether
// reading the fine print first helps. One row per stall, traps first.
export function classAlley(saves) {
  const plays = saves.map((s) => parseSave(s).play).filter(Boolean);
  return STALLS.map((st) => {
    const calls = plays.map((p) => p.alley?.checked?.[st.id]).filter(Boolean);
    const read = calls.filter((c) => c.readFine);
    return {
      id: st.id,
      icon: st.icon,
      name: st.name,
      trap: st.trap,
      n: calls.length,
      rightPct: pct(calls.filter((c) => c.right).length, calls.length),
      readPct: pct(read.length, calls.length),
      rightWhenReadPct: pct(read.filter((c) => c.right).length, read.length),
    };
  }).sort((a, b) => Number(b.trap) - Number(a.trap) || (a.rightPct ?? 101) - (b.rightPct ?? 101));
}

export const LESSON_COUNT = LESSON_ORDER.length;

// The tuning export (docs/PILOT.md): no names or emails, just numbers and each
// student's action log, which scripts/replay.js re-runs under new settings.
export function tuningExport({ className, tuningData, rows, saves }) {
  const ids = new Map(rows.map((r, i) => [r.uid, `Student ${i + 1}`]));
  return {
    exportedAt: new Date().toISOString(),
    class: className,
    anonymous: true,
    tuning: tuningData,
    roster: rows.map(({ studentName, studentEmail, displayName, creatureName, firstName, lastName, uid, ...rest }) => ({ student: ids.get(uid), ...rest })),
    lives: saves
      .map((s) => parseSave(s))
      .filter((s) => s.life?.start && Array.isArray(s.life.log))
      .map((s) => ({ student: ids.get(s.uid), start: { ...s.life.start, name: "" }, log: s.life.log, chapter: s.play?.chapter ?? 1 })),
  };
}

// ---------- CSV export for the gradebook ----------

const CSV_COLUMNS = [
  ["Last name", (r) => r.lastName],
  ["First name", (r) => r.firstName],
  ["Google name", (r) => r.studentName],
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
  ["Lantern Alley right", (r) => (r.alleyRight == null ? null : `${r.alleyRight} of ${r.alleyChecked}`)],
  ["Lessons", (r) => r.lessons],
  ["Dream stage", (r) => r.dreamStage],
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
    const c = (cards[e.id] ??= { id: e.id, n: 0, choices: {}, seconds: [], up: 0, meh: 0, down: 0, confusing: 0, clear: 0 });
    c.n++;
    c.choices[e.choice] = (c.choices[e.choice] || 0) + 1;
    c.seconds.push(e.seconds);
  }
  for (const e of of("cardReaction")) {
    const c = cards[e.id];
    if (!c) continue;
    if (e.reaction) c[e.reaction]++;
    if (e.confusing) c.confusing++;
    // New 2026-10-23: life cards ask "Makes sense" or "That was confusing".
    if (e.clarity === "clear") c.clear++;
  }
  const cardRows = Object.values(cards)
    .map((c) => {
      const top = Math.max(...Object.values(c.choices));
      return { id: c.id, n: c.n, choices: c.choices, medianSeconds: median(c.seconds), topShare: c.n ? top / c.n : 0, lopsided: c.n >= 5 && top / c.n >= 0.8, up: c.up, meh: c.meh, down: c.down, confusing: c.confusing, clear: c.clear };
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

// Emails pasted into "Send students back to the start": school addresses
// only, lowercased and without repeats. bad lists anything else.
const SCHOOL = /^[^@\s]+@greermiddlecollege\.org$/;
export function parseEmails(text) {
  const all = String(text).toLowerCase().split(/[\s,;]+/).filter(Boolean);
  return { good: [...new Set(all.filter((e) => SCHOOL.test(e)))], bad: all.filter((e) => !SCHOOL.test(e)) };
}

// ---------- The dashboard's summary (2026-10-23) ----------

// When a save was last written, in ms: a Firestore Timestamp ({ seconds }),
// a number or a date string. null when it's missing.
export function lastPlayed(updatedAt) {
  if (updatedAt == null) return null;
  if (typeof updatedAt === "number") return Number.isFinite(updatedAt) ? updatedAt : null;
  if (typeof updatedAt.toMillis === "function") return updatedAt.toMillis();
  if (typeof updatedAt.seconds === "number") return updatedAt.seconds * 1000;
  const t = Date.parse(updatedAt);
  return Number.isNaN(t) ? null : t;
}

const DAY = 24 * 60 * 60 * 1000;

// Students who need a look: flags from the save, or no play in a while.
// Most reasons first, then by name.
export function needsHelp(rows, { now = Date.now(), inactiveDays = 5 } = {}) {
  return rows
    .map((r) => {
      const reasons = r.flags.map((f) => ({ kind: f, mark: FLAGS[f].mark, label: FLAGS[f].label }));
      if (r.lastPlayed != null) {
        const days = Math.floor((now - r.lastPlayed) / DAY);
        if (days >= inactiveDays) reasons.push({ kind: "inactive", mark: "calendar", label: `Hasn't played in ${days} days` });
      }
      return { uid: r.uid, row: r, reasons };
    })
    .filter((x) => x.reasons.length)
    .sort((a, b) => b.reasons.length - a.reasons.length || byName(a.row, b.row));
}

// Where the class is against the open chapter. finished: done with it.
// working: in it now. behind: still in an earlier chapter. prologue: before
// the bank opens. setup: hasn't finished making a creature and joining.
export function pacing(rows, releasedChapter = 1, readyShare = 0.75) {
  const out = { finished: 0, working: 0, behind: 0, prologue: 0, setup: 0, total: rows.length, ready: false };
  for (const r of rows) {
    if (r.step === "prologue") out.prologue++;
    else if (!["hub", "done"].includes(r.step) && !r.chaptersDone) out.setup++;
    else if (r.chaptersDone >= releasedChapter) out.finished++;
    else if (r.chapter >= releasedChapter) out.working++;
    else out.behind++;
  }
  out.ready = out.total > 0 && out.finished / out.total >= readyShare;
  return out;
}

// What the grade is built on (SPEC §20): practice accuracy, chapters and
// reflections. Medians for the class, and who owes a reflection.
export function gradeSummary(rows) {
  const mid = (xs) => median(xs.filter((x) => x != null));
  return {
    practice: mid(rows.map((r) => r.accuracyAll)),
    chapters: mid(rows.map((r) => r.chaptersDone)),
    reflections: mid(rows.map((r) => r.reflections)),
    missingReflections: rows.filter((r) => r.reflections < r.chaptersDone).sort(byName).map((r) => ({ uid: r.uid, row: r, missing: r.chaptersDone - r.reflections })),
    noPractice: rows.filter((r) => r.accuracyAll == null && r.chaptersDone > 0).length,
  };
}

// ---------- Teacher page round 2 (2026-10-23) ----------

const MIN = 60 * 1000;

// The newest sign of saving for each student: the save's own updatedAt, or
// the small leaderboard entry the game touches every couple of minutes,
// whichever is later. board: [{ uid, updatedAt }].
export function lastSeen(rows, board = []) {
  const at = new Map(board.map((b) => [b.uid, lastPlayed(b.updatedAt)]));
  return rows.map((r) => {
    const b = at.get(r.uid) ?? null;
    const t = r.lastPlayed == null ? b : b == null ? r.lastPlayed : Math.max(r.lastPlayed, b);
    return t === r.lastPlayed ? r : { ...r, lastPlayed: t };
  });
}

// The save watch: students who saved today but not in the last quietMinutes.
// Longest quiet first. now is passed in so tests stay exact.
export function quietStudents(rows, { now = Date.now(), quietMinutes = 8 } = {}) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return rows
    .filter((r) => r.lastPlayed != null && r.lastPlayed >= today.getTime() && now - r.lastPlayed >= quietMinutes * MIN)
    .map((r) => ({ uid: r.uid, row: r, minutes: Math.floor((now - r.lastPlayed) / MIN) }))
    .sort((a, b) => b.minutes - a.minutes || byName(a.row, b.row));
}

// A practice % as a word, so the standards grid never relies on color.
export function standardBand(pct, { strong = 80, gettingThere = 60 } = {}) {
  if (pct == null) return { key: "none", label: "No answers" };
  if (pct >= strong) return { key: "strong", label: "Strong" };
  if (pct >= gettingThere) return { key: "getting", label: "Getting there" };
  return { key: "help", label: "Needs help" };
}

// What to reteach: the practice question types the class gets wrong most,
// the decision cards where the most students made a rough choice, and the
// Lantern Alley offers that fool the most students.
export function reteach(saves, { minAnswers = 5, minStudents = 3, top = 5 } = {}) {
  const plays = saves.map((s) => {
    try {
      return parseSave(s).play;
    } catch {
      return null;
    }
  }).filter(Boolean);
  const types = {};
  for (const p of plays) {
    for (const [type, v] of Object.entries(p.desk?.byType || {})) {
      const t = (types[type] ??= { type, right: 0, total: 0 });
      t.right += v.right;
      t.total += v.total;
    }
  }
  const questions = Object.values(types)
    .filter((t) => t.total >= minAnswers)
    .map((t) => ({ type: t.type, label: QUESTION_TYPES[t.type]?.label || t.type, standard: QUESTION_TYPES[t.type]?.standard ?? null, answers: t.total, accuracy: pct(t.right, t.total) }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, top);

  const cards = {};
  for (const p of plays) {
    // One vote per student per card: their latest choice.
    const latest = {};
    for (const d of decisionsOf(p)) if (d.quality && d.id) latest[d.id] = d;
    for (const d of Object.values(latest)) {
      const c = (cards[d.id] ??= { id: d.id, title: d.title || d.id, n: 0, rough: 0, roughChoices: {} });
      c.n++;
      if (d.quality === "bad") {
        c.rough++;
        c.roughChoices[d.label] = (c.roughChoices[d.label] || 0) + 1;
      }
    }
  }
  const decisions = Object.values(cards)
    .filter((c) => c.n >= minStudents && c.rough > 0)
    .map((c) => ({ id: c.id, title: c.title, students: c.n, roughPct: pct(c.rough, c.n), commonRough: Object.entries(c.roughChoices).sort((a, b) => b[1] - a[1])[0]?.[0] || "" }))
    .sort((a, b) => b.roughPct - a.roughPct || b.students - a.students)
    .slice(0, top);

  const traps = classAlley(saves)
    .filter((r) => r.trap && r.n >= minStudents && r.rightPct != null && r.rightPct < 100)
    .slice(0, top)
    .map((r) => ({ id: r.id, name: r.name, students: r.n, rightPct: r.rightPct }));
  return { questions, decisions, traps };
}

// A student's sessions from their play log, newest first. batches are the
// telemetry docs ({ sessionId, createdAt, month, chapter, events }).
const COUNTS = {
  months: ["monthTime"],
  cards: ["cardChoice", "lifeCardChoice"],
  shifts: ["minigame"],
  questions: ["question", "lessonQuiz", "shiftAnswer"],
  lessons: ["lessonStart"],
  chapters: ["chapterDone"],
  reflections: ["reflection"],
  achievements: ["achievement"],
};
export function timeline(batches) {
  const sessions = {};
  for (const b of batches) {
    if (b.practice) continue;
    const at = lastPlayed(b.createdAt);
    const id = b.sessionId || `t${at}`;
    const s = (sessions[id] ??= { id, start: null, end: null, saves: 0, months: 0, cards: 0, shifts: 0, questions: 0, right: 0, lessons: 0, chapters: 0, reflections: 0, achievements: 0, chapter: b.chapter ?? null, monthsSeen: new Set() });
    s.saves++;
    const span = Math.max(0, ...((b.events || []).map((e) => e.t || 0)));
    if (at != null) {
      const begin = at - span * 1000;
      s.start = s.start == null ? begin : Math.min(s.start, begin);
      s.end = s.end == null ? at : Math.max(s.end, at);
    }
    if (b.month != null && b.month >= 0) s.monthsSeen.add(b.month);
    s.chapter = Math.max(s.chapter ?? 0, b.chapter ?? 0) || s.chapter;
    for (const e of b.events || []) {
      for (const [k, types] of Object.entries(COUNTS)) if (types.includes(e.type)) s[k]++;
      if (e.type === "question" && (e.correct || e.right)) s.right++;
    }
  }
  return Object.values(sessions)
    .map(({ monthsSeen, ...s }) => ({ ...s, minutes: s.start != null && s.end != null ? Math.max(1, Math.round((s.end - s.start) / MIN)) : null, gameMonths: [...monthsSeen].sort((a, b) => a - b) }))
    .sort((a, b) => (b.start ?? 0) - (a.start ?? 0));
}
