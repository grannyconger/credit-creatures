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
import { drawLifeEvent, drawDecisionCards, resolveChoice, endMonth, earn, replayLife, ownCards, dollars, utilization } from "./engine/index.js";

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
  play.sparkle ??= { total: 0, byChapter: {} };
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
  play.stats ??= { shifts: 0, paidInFull: 0, payoffSprints: 0, hadDebt: false };
  play.jobs ??= {};
  play.owned ??= [];
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

export function choicesFor(play, life, item) {
  const { def, ctx } = itemDef(play, item);
  return def.choices(life, ctx);
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
  return { life: r.life, ok: true, choice, outcome, results: r.results, message: r.message, denied: Boolean(r.denied) };
}

export function shiftsLeft(play) {
  // The prologue has no months yet, just a few shifts to fill the piggy bank.
  if (play.prologue && !play.prologue.done) return Math.max(0, CONFIG.onboarding.prologueShifts - play.prologue.shifts);
  const m = play.active.month;
  return Math.max(0, CONFIG.pacing.shiftsPerMonth - m.shiftsCut - m.shifts);
}

// Pay comes from the minigame (js/progress.js jobPay). It goes into checking as income.
export function workShift(play, life, pay, source = "work shift") {
  if (shiftsLeft(play) <= 0) return { life, ok: false, message: "No shifts left this month." };
  const r = earn(life, pay, source);
  if (play.prologue && !play.prologue.done) play.prologue.shifts++;
  else play.active.month.shifts++;
  return { ...r, pay };
}

export function monthReady(play) {
  const m = play.active.month;
  return (!m.life || m.life.done) && m.cards.every((c) => c.done);
}

// Ends the month. When the chapter's last month ends, the chapter summary
// waits in play.summary for the reflection.
export function finishMonth(play, life) {
  if (!monthReady(play)) return { life, ok: false, message: "Finish this month's cards first." };
  const month = life.month;
  const r = endMonth(life);
  const record = monthRecord(month, r);
  const a = play.active;
  a.records.push(record);
  play.lastChange = { delta: record.delta, factor: record.factor, message: record.change };
  notesFromMonth(play, r, month);
  a.monthIndex++;
  const chapterDone = a.monthIndex >= (a.months || CONFIG.pacing.monthsPerChapter);
  if (chapterDone) {
    play.summary = summarize(a, r.life, play);
    play.active = null;
  } else {
    startMonth(play, r.life);
  }
  return { life: r.life, ok: true, record, chapterDone, events: r.events, scoreChange: r.scoreChange };
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

// Saves the reflection and moves on. Only the newest chapter keeps its month
// records (for the "Previously on" recap), so the save stays small.
export function submitReflection(play, { text, fun, clear }) {
  const s = play.summary;
  if (!s) return { ok: false, message: "There is no chapter to reflect on." };
  for (const h of play.history) delete h.records;
  play.history.push({ ...s, reflection: text, fun, clear });
  addXp(play, XP.reflection);
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

// ---------- Unicorn Sparkle Points (SPEC §15) ----------

// +1 per correct Practice Desk or Factor Check answer, within the caps.
// Returns how many points were given (0 or 1).
export function awardSparkle(play) {
  const cap = CONFIG.pacing.sparkle;
  const s = play.sparkle;
  const ch = String(play.chapter);
  if (s.total >= cap.total || (s.byChapter[ch] || 0) >= cap.perChapter) return 0;
  s.total++;
  s.byChapter[ch] = (s.byChapter[ch] || 0) + 1;
  return 1;
}

export function sparkleLeft(play) {
  const cap = CONFIG.pacing.sparkle;
  return Math.max(0, Math.min(cap.total - play.sparkle.total, cap.perChapter - (play.sparkle.byChapter[String(play.chapter)] || 0)));
}

// XP still available from right answers this chapter (capped, so replaying the
// Practice Desk can't flood the leaderboard).
export function answerXpLeft(play) {
  return Math.max(0, XP.answersPerChapter - (play.answerXp[String(play.chapter)] || 0));
}

// Practice Desk and Factor Check accuracy, by standard and by question type.
// Accuracy always counts. Returns the Sparkle Points and XP it gave.
export function recordAnswer(play, { type, standard, correct }) {
  const bump = (map, key) => {
    const k = String(key);
    map[k] ??= { right: 0, total: 0 };
    map[k].total++;
    if (correct) map[k].right++;
  };
  bump(play.desk.byStandard, standard);
  bump(play.desk.byType, type);
  if (!correct) return { sparkle: 0, xp: 0 };
  const xp = Math.min(XP.rightAnswer, answerXpLeft(play));
  if (xp) {
    const ch = String(play.chapter);
    play.answerXp[ch] = (play.answerXp[ch] || 0) + xp;
    addXp(play, xp);
  }
  return { sparkle: awardSparkle(play), xp };
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
