// Daily Pick and the login streak, applied to a save (docs/UI-REBUILD.md slice 4).
// The pure rules are in js/engine/daily.js. This file decides what a prize
// does to the game. Coins go through the engine (receiveCash), so the activity
// log and replayLife stay correct, and they never count as income.
import { CONFIG } from "./data/config.js";
import { DECOR, ownedDecor } from "./data/cottage.js";
import { dayKey, streakAfter, loginReward, rollBoxes } from "./engine/daily.js";
import { receiveCash } from "./engine/index.js";

export function ensureDaily(play) {
  play.daily ??= { lastLogin: null, streak: 0, best: 0, pickDay: null, pick: null };
  return play.daily;
}

const decorPool = () => DECOR.filter((d) => d.price > 0 && d.price <= CONFIG.daily.prizes.find((p) => p.kind === "decor").maxPrice).map((d) => d.id);

// Today's three boxes for this student.
export function todaysBoxes(life, now = new Date()) {
  return rollBoxes(life.seed, dayKey(now), CONFIG.daily, decorPool());
}

export function pickState(play, now = new Date()) {
  const d = ensureDaily(play);
  return d.pickDay === dayKey(now) && d.pick ? { done: true, pick: d.pick } : { done: false };
}

// The first load of the day: grows the streak and pays the login coins.
// Returns null when today's login was already paid.
export function claimLogin(play, life, now = new Date()) {
  const d = ensureDaily(play);
  const next = streakAfter(d, dayKey(now));
  if (!next.fresh) return null;
  const lostStreak = d.lastLogin && next.streak === 1 && d.streak > 1 ? d.streak : 0;
  const { coins, milestone } = loginReward(next.streak, CONFIG.daily.login);
  const total = coins + milestone;
  const r = receiveCash(life, total, "Daily login");
  Object.assign(d, { lastLogin: next.lastLogin, streak: next.streak, best: next.best });
  return { life: r.life, streak: next.streak, coins, milestone, total, lostStreak };
}

// Opens box `index`. One pick per day. Returns { life, prize, shown, others }.
export function claimPick(play, life, index, now = new Date()) {
  const state = pickState(play, now);
  if (state.done) return null;
  const boxes = todaysBoxes(life, now);
  let prize = boxes[index];
  if (!prize) return null;
  let next = life;
  let note = "";
  const give = (amount, why) => {
    next = receiveCash(next, amount, "Daily Pick").life;
    note = why;
    return { kind: "coins", amount };
  };
  let applied;
  if (prize.kind === "coins") applied = give(prize.amount, "");
  else if (prize.kind === "coupon") {
    play.coupon = { pct: prize.pct };
    applied = { kind: "coupon", pct: prize.pct };
  } else {
    const piece = DECOR.find((d) => d.id === prize.id);
    if (ownedDecor(play).has(piece.id)) applied = give(piece.price, "You already had that piece, so it turned into coins.");
    else {
      (play.decorOwned ||= []).push(piece.id);
      applied = { kind: "decor", id: piece.id, name: piece.name };
    }
  }
  const d = ensureDaily(play);
  d.pickDay = dayKey(now);
  d.pick = { index, ...applied };
  return { life: next, prize: applied, note, boxes, index };
}

// The Market takes the coupon off one buy.
export function couponPrice(play, price) {
  const pct = play.coupon?.pct || 0;
  return pct ? Math.max(1, Math.round(price * (1 - pct / 100))) : price;
}
