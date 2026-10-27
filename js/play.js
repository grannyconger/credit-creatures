// The month loop and chapters after Chapter 1 (SPEC §5, §8, §9).
// Pure functions over the save's `play` object and the engine life: no DOM,
// no Firebase, so a whole chapter can be tested in Node. Functions that take
// `play` change it in place. The life is never changed, only replaced.
import { PROGRESSION_VERSION, newPrologue, hasFeature } from "./progression.js";
import { CONFIG } from "./data/config.js";
import { SCENARIOS, SCENARIO_BY_ID } from "./data/scenarios.js";
import { LIFE_EVENTS, LIFE_EVENT_BY_ID } from "./data/life-events.js";
import { chapterInfo } from "./data/chapters.js";
import { INBOX_KEPT } from "./data/explainers.js";
import { XP } from "./data/achievements.js";
import { qolFor } from "./data/card-qol.js";
import { drawLifeEvent, drawDecisionCards, resolveChoice, endMonth, earn, replayLife, ownCards, dollars, utilization, balanceSheet, freshStart } from "./engine/index.js";
import { vehicleValue } from "./data/garage.js";

// "Cosign for a friend?" reads badly as "Cosign for a friend?: ...".
export function titled(title) {
  return /[?!]$/.test(title) ? `${title} ` : `${title}: `;
}

// phased: a Phase 10 save (js/progression.js). It starts with the prologue and
// Chapter 1. Without it (old saves, most tests) everything is unlocked and
// play starts at Chapter 2, the way it did before.
export function newPlay({ phased = false } = {}) {
  const play = { chapter: 2, active: null, summary: null, history: [], seen: [], shiftBonus: 0, lastChange: null };
  if (phased) Object.assign(play, { chapter: 1, progression: PROGRESSION_VERSION, prologue: newPrologue(), unlocksSeen: [] });
  return ensurePlay(play);
}

// Fields added after Phase 4. Older saves get them on load.
export function ensurePlay(play) {
  play.inbox ??= [];
  play.nextNote ??= 1;
  play.announced ??= 1;
  play.desk ??= { visits: 0, byStandard: {}, byType: {} };
  // Sparkle Points were removed (teacher decision 2026-10-26). Old saves drop them.
  delete play.sparkle;
  // Energy (teacher decision 2026-10-23): earned by side quests, held up to a cap, and
  // spent on Battles later.
  play.energy ??= 0;
  // Quality of Life (js/data/card-qol.js): the meter every card choice moves, apart from money.
  play.qol ??= CONFIG.pacing.qol.start;
  play.theme ??= "royal";
  // Phase 6: XP, achievements, minigame jobs, shop and records.
  play.xp ??= 0;
  play.xpByChapter ??= {};
  play.answerXp ??= {};
  play.rankSeen ??= 1;
  // Phase 8: social counts for achievements.
  play.social ??= { friends: 0, giftsSent: 0, giftsReceived: 0, groupJoined: false };
  // Appearance and reading mode (js/ui/settings.js). Old "night" theme means dark.
  play.dreamDone ??= null;
  // Dream stages finished (js/data/dreams.js). An old finished dream counts as all 3.
  play.dreamStage ??= play.dreamDone ? 3 : 0;
  // The Kingdom Tour (js/ui/tour.js): finished, or skipped so the hub stops offering it.
  // Phase 10: the ride at the Garage and the Cottage upgrades.
  play.garage ??= null;
  play.home ??= [];
  // Phase 12: Lantern Alley stalls checked ({ [stallId]: { right, xp } }).
  play.alley ??= { checked: {} };
  play.tourDone ??= null;
  play.tourSkipped ??= false;
  play.settings ??= play.theme === "night" ? { appearance: "dark", reading: "standard" } : null;
  play.achievements ??= {};
  delete play.achievements.sparkleMax;
  play.stats ??= { shifts: 0, paidInFull: 0, payoffSprints: 0, hadDebt: false };
  play.jobs ??= {};
  play.owned ??= [];
  // The Cottage room (js/data/cottage.js): pieces bought and what each slot wears.
  play.decorOwned ??= [];
  play.cottage ??= null;
  // Daily Pick, the login streak and a coupon from it (js/daily.js).
  play.daily ??= { lastLogin: null, streak: 0, best: 0, pickDay: null, pick: null };
  play.coupon ??= null;
  play.records ??= { highestScore: null, longestOnTime: 0 };
  Object.assign(play.desk, { finished: play.desk.finished ?? 0, perfect: play.desk.perfect ?? 0, streak: play.desk.streak ?? 0, bestStreak: play.desk.bestStreak ?? 0 });
  return play;
}

// Keeps only what the screens need, small enough to save.
export function monthRecord(month, result) {
  return {
    month,
    score: result.life.score,
    util: utilization(result.life),
    delta: result.scoreChange.delta,
    factor: result.scoreChange.factor,
    change: result.scoreChange.message,
    events: result.events.map((e) => (e.amount != null && e.type === "fee" ? { type: e.type, message: e.message, amount: e.amount } : { type: e.type, message: e.message })),
  };
}

export function canPlay(play, releasedChapter) {
  if (play.prologue && !play.prologue.done) return false;
  return play.chapter <= (releasedChapter || 1);
}

export function ctxFor(play, extra = {}) {
  return { chapter: play.active?.chapter ?? play.chapter, seen: play.seen, lastChange: play.lastChange, has: (f) => hasFeature(play, f), ...extra };
}

// months: the class's months per chapter (teacher setting), or the default.
export function startChapter(play, life, months = CONFIG.pacing.monthsPerChapter) {
  play.active = {
    chapter: play.chapter,
    months,
    startMonth: life.month,
    startScore: life.score,
    startChecking: life.checking,
    startLog: life.log.length,
    seenAtStart: play.seen.slice(),
    shiftBonusAtStart: play.shiftBonus,
    lastChangeAtStart: play.lastChange,
    monthIndex: 0,
    month: null,
    decisions: [],
    records: [],
  };
  startMonth(play, life);
}

function startMonth(play, life) {
  const ctx = ctxFor(play);
  const ev = drawLifeEvent(life, LIFE_EVENTS, ctx);
  const cards = drawDecisionCards(life, SCENARIOS, ctx);
  for (const id of [ev?.id, ...cards]) if (id && !play.seen.includes(id)) play.seen.push(id);
  play.active.month = {
    month: life.month,
    life: ev ? { id: ev.id, amount: ev.amount, done: false } : null,
    cards: cards.map((id) => ({ id, done: false })),
    shifts: 0,
    shiftsCut: 0,
  };
}

// The data object and context for one item on this month's list.
// item = "life" or a card index.
export function itemDef(play, item) {
  const m = play.active.month;
  if (item === "life") return { def: LIFE_EVENT_BY_ID[m.life.id], state: m.life, ctx: ctxFor(play, { amount: m.life.amount }), kind: "life" };
  const state = m.cards[item];
  return { def: SCENARIO_BY_ID[state.id], state, ctx: ctxFor(play), kind: "decision" };
}

// A card drawn at the start of the month may not fit anymore (the balance
// it asks about was paid off). It is skipped instead of shown.
export function stillFits(play, life, item) {
  const { def, ctx } = itemDef(play, item);
  return !def.fits || def.fits(life, ctx);
}

// A choice's Quality of Life points come from js/data/card-qol.js, so every
// choice carries a number (0 if a card is new and hasn't been given one yet).
export function choicesFor(play, life, item) {
  const { def, ctx } = itemDef(play, item);
  return def.choices(life, ctx).map((c) => ({ ...c, qol: qolFor(def.id, c.key) ?? 0 }));
}

// The meter after a change, kept inside its range.
export function qolAfter(now, delta) {
  const q = CONFIG.pacing.qol;
  return Math.max(q.min, Math.min(q.max, (now ?? q.start) + delta));
}

export function skipItem(play, item) {
  const { state } = itemDef(play, item);
  state.done = true;
  state.skipped = true;
}

// Runs a choice. method is the "Pay with" pick when the choice has a cost.
export function choose(play, life, item, key, method = null) {
  const { def, state, kind } = itemDef(play, item);
  if (state.done) return { life, ok: false, message: "You already decided this one." };
  const choice = choicesFor(play, life, item).find((c) => c.key === key);
  if (!choice) return { life, ok: false, message: "That choice is not available." };
  if (choice.disabled) return { life, ok: false, message: choice.disabled };
  if (choice.cost && !method) return { life, ok: false, message: "Pick how to pay." };
  const r = resolveChoice(life, choice, method);
  if (!r.ok) return { life, ok: false, message: r.message };
  const m = play.active.month;
  if (choice.effect?.shiftsCut) m.shiftsCut += choice.effect.shiftsCut;
  if (choice.effect?.shiftBonus) play.shiftBonus += choice.effect.shiftBonus;
  Object.assign(state, { done: true, choice: key, method: method || null, quality: choice.quality || null });
  const outcome = typeof choice.outcome === "function" ? choice.outcome(r, r.life) : choice.outcome || "";
  play.active.decisions.push({
    id: def.id,
    kind,
    title: def.title,
    icon: def.icon,
    choice: key,
    label: choice.label,
    quality: choice.quiz ? null : choice.quality || null,
    quiz: Boolean(choice.quiz),
    outcome,
  });
  // Quests earn XP (teacher decision 2026-10-23): more for a choice that went well.
  const xp = addXp(play, XP.card[choice.quality] ?? XP.card.none);
  // The choice moves Quality of Life, which isn't money, so it lives in play and not in the life.
  const qolBefore = play.qol ?? CONFIG.pacing.qol.start;
  play.qol = qolAfter(qolBefore, choice.qol);
  play.active.decisions.at(-1).qol = play.qol - qolBefore;
  return { life: r.life, ok: true, choice, outcome, results: r.results, message: r.message, denied: Boolean(r.denied), xp, qol: play.qol - qolBefore, qolNow: play.qol };
}

export function shiftsLeft(play) {
  // The prologue has no months yet, just a few shifts to fill the piggy bank.
  if (play.prologue && !play.prologue.done) return Math.max(0, CONFIG.onboarding.prologueShifts - play.prologue.shifts);
  const m = play.active.month;
  return Math.max(0, CONFIG.pacing.shiftsPerMonth - m.shiftsCut - m.shifts);
}

// Pay comes from the minigame (js/progress.js jobPay). It goes into checking as income.
// job: which game was played. The prologue lets each of its three jobs be worked once.
// risky: a risky mode Arcade shift (GAME-SPECS.md 2.3) is unlimited, so it
// doesn't use the month's shifts.
export function workShift(play, life, pay, source = "work shift", job = null, { risky = false } = {}) {
  if (risky) {
    if (play.prologue && !play.prologue.done) return { life, ok: false, message: "Risky mode opens once your bank account does." };
    return pay > 0 ? { ...earn(life, pay, source), pay } : { life, ok: true, pay: 0 };
  }
  if (shiftsLeft(play) <= 0) return { life, ok: false, message: "No shifts left this month." };
  const r = pay > 0 ? earn(life, pay, source) : { life, ok: true };
  if (play.prologue && !play.prologue.done) {
    play.prologue.shifts++;
    if (job) (play.prologue.worked ||= []).push(job);
  } else play.active.month.shifts++;
  return { ...r, pay };
}

export function monthReady(play) {
  const m = play.active.month;
  return (!m.life || m.life.done) && m.cards.every((c) => c.done);
}

// Ends the month. When the chapter's last month ends, the chapter summary
// waits in play.summary until the student continues.
export function finishMonth(play, life) {
  if (!monthReady(play)) return { life, ok: false, message: "Finish this month's cards first." };
  const month = life.month;
  const r = endMonth(life);
  const record = monthRecord(month, r);
  // Net worth at the month's end, so the Vault Overview can draw a line (js/vault.js netWorthSeries).
  record.netWorth = balanceSheet(r.life, { vehicleValue: vehicleValue(play) }).netWorth;
  const a = play.active;
  a.records.push(record);
  play.lastChange = { delta: record.delta, factor: record.factor, message: record.change };
  notesFromMonth(play, r, month);
  const xp = addXp(play, XP.month);
  const broke = brokeStep(play, r.life, a.chapter, month);
  if (broke?.type === "reset") return { life: broke.life, ok: true, record, chapterDone: false, events: r.events, scoreChange: r.scoreChange, xp, broke };
  a.monthIndex++;
  const chapterDone = a.monthIndex >= (a.months || CONFIG.pacing.monthsPerChapter);
  if (chapterDone) {
    play.summary = summarize(a, r.life, play);
    play.active = null;
  } else {
    startMonth(play, r.life);
  }
  return { life: r.life, ok: true, record, chapterDone, events: r.events, scoreChange: r.scoreChange, xp, broke };
}

// ---------- Going broke (GAME-SPECS.md 2.4, teacher decisions 2026-10-25) ----------

// Broke: at a month's end, checking is below $0 and savings can't cover it.
export function isBroke(life) {
  return life.checking < 0 && life.checking + life.savings < 0;
}

// The first broke month is a RED ALERT warning. Still broke at the next month's
// end means a fresh start: back to the start of the previous chapter (never
// before Chapter 2), every debt wiped, checking reset, a mark on the report.
// Chapter 1 can't go broke. Getting back above $0 clears the warning.
// Returns null, { type: "warning" }, { type: "recovered" } or { type: "reset", life, ... }.
function brokeStep(play, life, chapter, month) {
  const B = CONFIG.broke;
  if (chapter < B.fromChapter) return null;
  if (!isBroke(life)) {
    if (!play.broke) return null;
    play.broke = null;
    return { type: "recovered" };
  }
  if (!play.broke) {
    play.broke = { warnedMonth: month, chapter };
    return { type: "warning", shortBy: Math.round(-(life.checking + life.savings) * 100) / 100 };
  }
  const to = Math.max(B.fromChapter, chapter - 1);
  const fs = freshStart(life, B.resetChecking);
  (play.brokeHistory ??= []).push({ month, from: chapter, to, wiped: fs.wiped });
  play.broke = null;
  // The unfinished chapter is dropped. Its cards can come back later.
  play.active = null;
  play.summary = null;
  play.chapter = to;
  return { type: "reset", life: fs.life, from: chapter, to, wiped: fs.wiped, checking: B.resetChecking };
}

const RANK = { good: 2, ok: 1, bad: 0 };

function summarize(a, life, play) {
  const graded = a.decisions.filter((d) => d.quality && d.kind === "decision");
  const best = graded.filter((d) => d.quality === "good")[0] || null;
  const worst = graded.slice().sort((x, y) => RANK[x.quality] - RANK[y.quality])[0];
  const events = a.records.flatMap((r) => r.events);
  return {
    chapter: a.chapter,
    months: a.months,
    title: chapterInfo(a.chapter, play).title,
    startMonth: a.startMonth,
    endMonth: life.month,
    startScore: a.startScore,
    endScore: life.score,
    startChecking: a.startChecking,
    endChecking: life.checking,
    startLog: a.startLog,
    seenAtStart: a.seenAtStart,
    shiftBonusAtStart: a.shiftBonusAtStart,
    lastChangeAtStart: a.lastChangeAtStart,
    decisions: a.decisions,
    records: a.records,
    best,
    worst: worst && worst.quality === "bad" ? worst : null,
    fees: Math.round(events.filter((e) => e.type === "fee").reduce((s, e) => s + (e.amount || 0), 0) * 100) / 100,
    maxUtil: a.records.some((r) => r.util != null) ? Math.max(...a.records.filter((r) => r.util != null).map((r) => r.util)) : null,
    hadCredit: life.accounts.some((x) => x.owner === "self" && x.reported && ["open", "paid"].includes(x.status)),
    lates: events.filter((e) => e.type === "late" || e.type === "collections").length,
    quizRight: a.decisions.filter((d) => d.quiz && d.quality === "good").length,
  };
}

// Files the finished chapter and moves on. Only the newest chapter keeps its
// month records (for the "Previously on" recap), so the save stays small.
export function completeChapter(play) {
  const s = play.summary;
  if (!s) return { ok: false, message: "There is no finished chapter." };
  for (const h of play.history) delete h.records;
  play.history.push({ ...s });
  addXp(play, XP.chapterDone);
  play.summary = null;
  play.chapter = s.chapter + 1;
  return { ok: true };
}

// The "Previously on..." recap: the latest finished chapter, plus the current
// chapter's months so far.
export function recap(play) {
  const last = play.history.at(-1) || null;
  const current = play.active && play.active.records.length ? play.active : null;
  if (!last && !current) return null;
  return { last, current };
}

// Practice mode (SPEC §5): rebuild the life at the start of a finished chapter
// and play it again on a throwaway copy. Nothing is written back.
export function startPractice(save, chapter) {
  const h = save.play.history.find((x) => x.chapter === chapter);
  if (!h) return null;
  const life = replayLife(save.life.start, save.life.log, h.startLog);
  const play = { ...newPlay(), chapter, seen: h.seenAtStart.slice(), shiftBonus: h.shiftBonusAtStart || 0, lastChange: h.lastChangeAtStart || null };
  startChapter(play, life, h.months);
  return { life, play };
}

// ---------- XP (SPEC §16): it only ever goes up ----------

export function addXp(play, n) {
  if (!(n > 0)) return 0;
  play.xp += n;
  const ch = String(play.chapter);
  play.xpByChapter[ch] = (play.xpByChapter[ch] || 0) + n;
  return n;
}

// ---------- Energy: earned from side quests, spent on Battles later ----------

// Adds Energy up to the cap and returns how much was actually added.
export function awardEnergy(play, n) {
  const max = CONFIG.pacing.rewards.energy.max;
  const before = play.energy || 0;
  play.energy = Math.min(max, before + Math.max(0, n));
  return play.energy - before;
}

// XP still available from right answers this chapter (capped, so replaying the
// Practice Desk can't flood the leaderboard).
export function answerXpLeft(play) {
  return Math.max(0, XP.answersPerChapter - (play.answerXp[String(play.chapter)] || 0));
}

// Practice Desk and Factor Check accuracy, by standard and by question type.
// Accuracy always counts. Returns the XP it gave.
export function recordAnswer(play, { type, standard, correct }) {
  const bump = (map, key) => {
    const k = String(key);
    map[k] ??= { right: 0, total: 0 };
    map[k].total++;
    if (correct) map[k].right++;
  };
  bump(play.desk.byStandard, standard);
  bump(play.desk.byType, type);
  if (!correct) return { xp: 0 };
  const xp = Math.min(XP.rightAnswer, answerXpLeft(play));
  if (xp) {
    const ch = String(play.chapter);
    play.answerXp[ch] = (play.answerXp[ch] || 0) + xp;
    addXp(play, xp);
  }
  return { xp };
}

// ---------- Notifications inbox (SPEC §14) ----------

export function addNote(play, type, text, month) {
  play.inbox.unshift({ id: play.nextNote++, type, text, month, read: false });
  play.inbox.length = Math.min(play.inbox.length, INBOX_KEPT);
}

export function unreadCount(play) {
  return play.inbox.filter((n) => !n.read).length;
}

export function markRead(play, id) {
  const n = play.inbox.find((x) => x.id === id);
  if (n) n.read = true;
}

export function markAllRead(play) {
  for (const n of play.inbox) n.read = true;
}

const NOTE_FOR_EVENT = {
  fee: "fee",
  paymentReceived: "payment",
  paidOff: "payment",
  heldFundsReleased: "payment",
  statement: "statement",
  late: "alert",
  collections: "alert",
  cosignMissed: "alert",
};

// Turns End Month events into inbox notes, plus "due soon" reminders for
// card minimums nothing will pay automatically.
function notesFromMonth(play, r, month) {
  for (const e of r.events) {
    if (e.type === "scoreChange") {
      if (e.delta || e.message.includes("first time")) addNote(play, e.delta < 0 ? "scoreDown" : "scoreUp", e.message, month);
    } else if (NOTE_FOR_EVENT[e.type]) {
      addNote(play, NOTE_FOR_EVENT[e.type], e.message, month);
    }
  }
  for (const a of ownCards(r.life)) {
    if (a.due && a.due.minDue > 0 && !a.autopay) {
      addNote(play, "due", `${a.name}: pay at least ${dollars(a.due.minDue)} before the next End Month, or it will be late.`, month + 1);
    }
  }
}

// Once per chapter, when the teacher opens it.
export function announceChapter(play, released) {
  if (released > play.announced && play.chapter <= released) {
    play.announced = released;
    addNote(play, "chapter", `Chapter ${play.chapter} is open! Start it from your hub.`, null);
    return true;
  }
  return false;
}
