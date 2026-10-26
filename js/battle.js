// Battles outside the engine's turn math (docs/BATTLES.md): the question for each
// round, what a battle costs, and the record a student keeps. No DOM, so it is
// tested in Node. Money moves only through engine actions, so the activity log
// and replayLife stay correct.
import { CONFIG } from "./data/config.js";
import { QUESTION_TYPES } from "./data/practice-questions.js";
import { ROUND_TYPES } from "./data/battle.js";
import { createRng, debitPurchase, receiveCash, upcomingPayments, resultFor } from "./engine/index.js";
import { dayKey } from "./engine/daily.js";

const B = () => CONFIG.battle;

export function ensureBattle(play) {
  play.battle ??= { wins: 0, losses: 0, draws: 0, streak: 0, best: 0, log: [], botPrizes: { day: "", n: 0 } };
  return play.battle;
}

// The question for one side on one turn. Both sides get the same kind of
// question (so it's equally hard) with different numbers (so answers can't be
// passed across the room). Both browsers build it from the battle's seed.
export function roundFor(seed, turn, slot) {
  const type = createRng(`${seed}:round:${turn}`).pick(ROUND_TYPES);
  const q = QUESTION_TYPES[type].make(createRng(`${seed}:round:${turn}:${slot}`));
  return { type, ...q };
}

// Turns one side's stored answer into an engine action. Correctness is worked
// out again from the seed, never trusted from the other browser.
// stored: { m: move id, c: choice index (or -1 for no answer), f: timer left 0 to 1 }
export function actionFrom(seed, turn, slot, stored) {
  const round = roundFor(seed, turn, slot);
  const correct = stored?.c === round.answer;
  return { move: stored?.m || "strike", correct, frac: correct ? Math.max(0, Math.min(1, Number(stored?.f) || 0)) : 0 };
}

// Every stored turn as engine actions, for replayBattle.
// p0, p1: { [turn]: stored answer } for each side.
export function turnsFrom(seed, p0 = {}, p1 = {}) {
  const out = [];
  for (let t = 0; p0[t] && p1[t]; t++) out.push([actionFrom(seed, t, 0, p0[t]), actionFrom(seed, t, 1, p1[t])]);
  return out;
}

// What this month's bills and card minimums still need from checking.
export function billsNeeded(life) {
  const up = upcomingPayments(life);
  return up.total + up.cardsDue.reduce((s, x) => s + x.amount, 0);
}

// Can this student start a battle? { ok, why }. A battle needs Energy and an
// entry fee that leaves enough in checking for this month's bills, so a battle
// can never cause an overdraft or a late payment.
export function canEnter(life, play) {
  const cfg = B();
  if ((play.energy || 0) < cfg.energy) return { ok: false, why: `A battle takes ${cfg.energy} Energy. Earn Energy with side quests in the Arcade.` };
  const room = life.checking - billsNeeded(life);
  if (room < cfg.fee) return { ok: false, why: `The $${cfg.fee} entry fee would leave too little in checking for this month's bills.` };
  return { ok: true, why: "" };
}

// Spends the Energy and the entry fee. Returns { life, ok, message }. The fee is
// an Entertainment purchase from checking, so it shows on statements.
export function payEntry(life, play) {
  const can = canEnter(life, play);
  if (!can.ok) return { life, ok: false, message: can.why };
  const paid = debitPurchase(life, B().fee, "Battle entry (Entertainment)");
  if (!paid.ok) return paid;
  play.energy -= B().energy;
  return paid;
}

// A live battle that ended with nobody there (the other player left). The one
// who stayed gets the fee and Energy back.
export function refundEntry(life, play) {
  play.energy = Math.min(CONFIG.pacing.rewards.energy.max, (play.energy || 0) + B().energy);
  return receiveCash(life, B().fee, "Battle entry refund");
}

// Records a finished battle and pays the prize. vs: { name, kind: "bot" | "live",
// level, unpaid }. Computer battles pay a prize only botPrizesPerDay times a day,
// and a battle joined without paying the entry (unpaid) pays no prize.
// Returns { life, result, prize }.
export function finishBattle(life, play, battle, slot, vs, now = new Date()) {
  const rec = ensureBattle(play);
  const result = resultFor(battle, slot);
  if (!result) return { life, result: null, prize: 0 };
  const today = dayKey(now);
  if (rec.botPrizes.day !== today) rec.botPrizes = { day: today, n: 0 };
  const capped = vs.kind === "bot" && rec.botPrizes.n >= B().botPrizesPerDay;
  // A loss to the computer pays nothing, so losing on purpose can't farm coins.
  const prize = capped || vs.unpaid || (vs.kind === "bot" && result === "loss") ? 0 : B().prize[result];
  if (vs.kind === "bot" && !capped && !vs.unpaid) rec.botPrizes.n++;
  if (result === "win") {
    rec.wins++;
    rec.streak++;
    rec.best = Math.max(rec.best, rec.streak);
  } else {
    if (result === "loss") rec.losses++;
    else rec.draws++;
    rec.streak = 0;
  }
  const me = battle.sides[slot];
  const them = battle.sides[1 - slot];
  rec.log.unshift({ at: today, vs: String(vs.name || "").slice(0, 40), kind: vs.kind, level: vs.level || null, result, hp: [me.hp, them.hp], turns: battle.turn, prize });
  rec.log.length = Math.min(rec.log.length, B().resultsKept);
  const next = prize > 0 ? receiveCash(life, prize, "Battle prize").life : life;
  return { life: next, result, prize, capped };
}

// Prizes left from computer battles today.
export function botPrizesLeft(play, now = new Date()) {
  const rec = ensureBattle(play);
  return rec.botPrizes.day === dayKey(now) ? Math.max(0, B().botPrizesPerDay - rec.botPrizes.n) : B().botPrizesPerDay;
}
