// Moves one save ahead to the end of a chapter by playing the skipped chapters the way a
// careful student would, so every coin, XP, account and bill is what real play would have
// made (teacher request 2026-10-29). It uses the same engine actions as the game, so the
// activity log still replays. Plain JS with no DOM, so it runs in Node tests.
import * as P from "./play.js";
import { openBankAccount, afterChapter } from "./progression.js";
import { paymentOptions, ownCards, amountOwed, pay } from "./engine/index.js";
import { CONFIG } from "./data/config.js";

const PROLOGUE_JOBS = ["cashier", "checks", "phish"];
const QUALITY = { good: 0, ok: 1, bad: 2 };

// The pay for one shift: the middle of the range a real shift pays.
const shiftPay = () => Math.round((CONFIG.pacing.payPerShift[0] + CONFIG.pacing.payPerShift[1]) / 2);

function methodFor(life, cost) {
  return paymentOptions(life, cost).find((o) => o.ok)?.method || null;
}

// The best choice a careful student can afford: good before ok, never bad if there is a choice.
function pickChoice(life, choices) {
  const open = choices.filter((c) => !c.disabled && (!c.cost || methodFor(life, c.cost)));
  const rank = (c) => QUALITY[c.quality] ?? 1;
  return open.slice().sort((a, b) => rank(a) - rank(b))[0] || null;
}

function playMonth(play, life) {
  const m = play.active.month;
  const items = [...(m.life && !m.life.done ? ["life"] : []), ...m.cards.map((c, i) => (c.done ? null : i)).filter((i) => i !== null)];
  for (const item of items) {
    if (!P.stillFits(play, life, item)) {
      P.skipItem(play, item);
      continue;
    }
    const c = pickChoice(life, P.choicesFor(play, life, item));
    const r = c ? P.choose(play, life, item, c.key, c.cost ? methodFor(life, c.cost) : null) : { ok: false };
    if (r.ok) life = r.life;
    else P.skipItem(play, item);
  }
  while (P.shiftsLeft(play) > 0) life = P.workShift(play, life, shiftPay()).life;
  for (const a of ownCards(life)) {
    const owed = amountOwed(a);
    if (owed > 0 && owed <= life.checking) life = pay(life, a.id, owed).life;
  }
  return life;
}

function finishPrologue(play, life) {
  const p = play.prologue;
  if (!p || p.done) return life;
  Object.assign(p, { welcomed: true, marketVisited: true, cottageVisited: true });
  for (const job of PROLOGUE_JOBS) if (!p.worked.includes(job)) life = P.workShift(play, life, shiftPay(), "work shift", job).life;
  return openBankAccount(play, life, { toSavings: Math.floor(life.checking * 0.25) }).life;
}

// Plays every chapter up to and including `through`. Chapter answer XP counts in full.
// Returns { life, skipped } or null when there was nothing to do or it could not finish
// (the save is then left exactly as it was).
export function fastForward(play, life, { through = 4, months = CONFIG.pacing.monthsPerChapter } = {}) {
  if (!play.prologue?.done && !play.prologue) return null;
  if (play.chapter > through && !play.active && !play.summary) return null;
  const backup = structuredClone(play);
  const before = { chapter: play.chapter, xp: play.xp, checking: life.checking };
  let guard = 0;
  try {
    life = finishPrologue(play, life);
    while ((play.chapter <= through || play.active || play.summary) && guard++ < 200) {
      if (play.summary) {
        const done = play.summary.chapter;
        P.addXp(play, Math.max(0, CONFIG.pacing.xp.answersPerChapter - (play.answerXp[String(play.chapter)] || 0)));
        play.answerXp[String(play.chapter)] = CONFIG.pacing.xp.answersPerChapter;
        P.completeChapter(play);
        life = afterChapter(play, life, done).life;
      } else if (!play.active) {
        P.startChapter(play, life, months);
      } else {
        life = playMonth(play, life);
        const end = P.finishMonth(play, life);
        if (!end.ok) throw new Error("month did not finish");
        life = end.life;
      }
    }
    if (play.chapter !== through + 1 || play.active || play.summary) throw new Error("did not reach the end of the chapter");
  } catch {
    for (const k of Object.keys(play)) delete play[k];
    Object.assign(play, backup);
    return null;
  }
  return { life, from: before.chapter, xpGained: play.xp - before.xp, coinsGained: Math.round((life.checking - before.checking) * 100) / 100 };
}
