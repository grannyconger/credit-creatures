// The month loop and chapters after Chapter 1 (SPEC §5, §8, §9).
// Pure functions over the save's `play` object and the engine life: no DOM,
// no Firebase, so a whole chapter can be tested in Node. Functions that take
// `play` change it in place. The life is never changed, only replaced.
import { CONFIG } from "./data/config.js";
import { SCENARIOS, SCENARIO_BY_ID } from "./data/scenarios.js";
import { LIFE_EVENTS, LIFE_EVENT_BY_ID } from "./data/life-events.js";
import { chapterInfo } from "./data/chapters.js";
import { drawLifeEvent, drawDecisionCards, resolveChoice, endMonth, earn, shiftPay, replayLife } from "./engine/index.js";

// "Cosign for a friend?" reads badly as "Cosign for a friend?: ...".
export function titled(title) {
  return /[?!]$/.test(title) ? `${title} ` : `${title}: `;
}

export function newPlay() {
  return { chapter: 2, active: null, summary: null, history: [], seen: [], shiftBonus: 0, lastChange: null };
}

// Keeps only what the screens need, small enough to save.
export function monthRecord(month, result) {
  return {
    month,
    score: result.life.score,
    delta: result.scoreChange.delta,
    factor: result.scoreChange.factor,
    change: result.scoreChange.message,
    events: result.events.map((e) => (e.amount != null && e.type === "fee" ? { type: e.type, message: e.message, amount: e.amount } : { type: e.type, message: e.message })),
  };
}

export function canPlay(play, releasedChapter) {
  return play.chapter <= (releasedChapter || 1);
}

export function ctxFor(play, extra = {}) {
  return { chapter: play.active?.chapter ?? play.chapter, seen: play.seen, lastChange: play.lastChange, ...extra };
}

export function startChapter(play, life) {
  play.active = {
    chapter: play.chapter,
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
  const m = play.active.month;
  return Math.max(0, CONFIG.pacing.shiftsPerMonth - m.shiftsCut - m.shifts);
}

export function workShift(play, life, correct) {
  if (shiftsLeft(play) <= 0) return { life, ok: false, message: "No shifts left this month." };
  const pay = shiftPay(correct, play.shiftBonus);
  const r = earn(life, pay, "work shift");
  play.active.month.shifts++;
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
  a.monthIndex++;
  const chapterDone = a.monthIndex >= CONFIG.pacing.monthsPerChapter;
  if (chapterDone) {
    play.summary = summarize(a, r.life);
    play.active = null;
  } else {
    startMonth(play, r.life);
  }
  return { life: r.life, ok: true, record, chapterDone, events: r.events, scoreChange: r.scoreChange };
}

const RANK = { good: 2, ok: 1, bad: 0 };

function summarize(a, life) {
  const graded = a.decisions.filter((d) => d.quality && d.kind === "decision");
  const best = graded.filter((d) => d.quality === "good")[0] || null;
  const worst = graded.slice().sort((x, y) => RANK[x.quality] - RANK[y.quality])[0];
  const events = a.records.flatMap((r) => r.events);
  return {
    chapter: a.chapter,
    title: chapterInfo(a.chapter).title,
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
  startChapter(play, life);
  return { life, play };
}
