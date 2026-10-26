// Pay in 4's rules (GAME-SPECS.md game 4). Pure and seeded.
//
// A week runs in this order: paycheck (on payday weeks) and gifts, living costs,
// then every payment due this week drafts from cash. A draft that cash can't
// cover fails: a late fee, that app locks, the payment retries next week and the
// mood drops. The emergency lands at the start of its week. Then the week's
// items show up to buy with cash, split with an app, or skip.
import { CONFIG } from "../data/config.js";
import { createRng } from "../engine/index.js";
import { P4_ITEMS, BNPL_APPS, P4_EMERGENCIES } from "../data/arcade/payin4.js";

const C = () => CONFIG.arcade.games.payin4;
const r2 = (x) => Math.round(x * 100) / 100;
export const WEEKS = 12;
export const MOODS = ["Miserable", "Down", "Okay", "Happy", "Thrilled"];

function deal(seed) {
  const rng = createRng(seed);
  const c = C();
  const start = rng.int(c.start[0] / 10, c.start[1] / 10) * 10;
  const paycheck = rng.int(c.paycheck[0] / 10, c.paycheck[1] / 10) * 10;
  const living = rng.int(c.living[0] / 5, c.living[1] / 5) * 5;
  const pool = P4_ITEMS.slice();
  const items = [];
  for (let w = 1; w <= WEEKS; w++) {
    const n = rng.int(1, 2);
    for (let k = 0; k < n && pool.length; k++) {
      const t = pool.splice(rng.int(0, pool.length - 1), 1)[0];
      const price = rng.int(t.price[0], t.price[1]);
      const apps = BNPL_APPS.map((a) => a.id);
      apps.splice(rng.int(0, 2), 1);
      items.push({ id: `i${items.length}`, week: w, name: t.name, store: t.store, price, vibes: rng.int(t.vibes[0], t.vibes[1]), apps: price > c.bnplOver ? apps : [] });
    }
  }
  const paydays = Array.from({ length: WEEKS / 2 }, (_, i) => 2 * i + 2);
  const chaos = { cutWeek: paydays[rng.int(1, paydays.length - 2)], giftWeek: rng.int(2, 11), flashItem: null };
  const flashPool = items.filter((i) => i.week >= 3 && i.week <= 9);
  const flash = flashPool[rng.int(0, flashPool.length - 1)];
  flash.vibes *= 2;
  flash.flash = true;
  chaos.flashItem = flash.id;
  const em = P4_EMERGENCIES[rng.int(0, P4_EMERGENCIES.length - 1)];
  const emergency = { ...em, week: rng.int(9, 11), amount: rng.int(c.emergency[0] / 10, c.emergency[1] / 10) * 10 };
  return { start, paycheck, living, paydays, items, chaos, emergency };
}

export function newShift(seed) {
  // Keep difficulty in a band (1.6): thoughtful play lands in a range,
  // splitting everything fails drafts, and cash for everything misses the emergency.
  for (let t = 0; t < 200; t++) {
    const m = deal(`${seed}:${t}`);
    const best = score(play(m, thoughtfulBot)).score;
    const band = C().band;
    if (best < band[0] || best > band[1]) continue;
    if (score(play(m, neverBot)).score > best - 25) continue;
    if (!play(m, bnplAllBot).fees.length) continue;
    if (play(m, cashAllBot).emergency.covered) continue;
    return m;
  }
  return deal(`${seed}:0`);
}

export function newState(m) {
  return { m, week: 0, cash: m.start, plans: [], locked: [], fees: [], mood: 2, vibes: 0, bought: [], skipped: [], decided: {}, emergency: { ...m.emergency, covered: null }, echoes: [], cashByWeek: [], draftsByWeek: Array.from({ length: WEEKS + 8 }, () => ({})), firstFail: null };
}

export const itemsFor = (s, week = s.week) => s.m.items.filter((i) => i.week === week);
export const open = (s) => itemsFor(s).filter((i) => !s.decided[i.id]);
export const appName = (id) => BNPL_APPS.find((a) => a.id === id)?.name || id;
export const appsOffered = (s, item) => item.apps.filter((a) => !s.locked.includes(a));
export const partOf = (price) => r2(price / 4);

// Starts the next week. Returns what happened, for echoes.
export function nextWeek(s) {
  const c = C();
  const happened = [];
  for (const i of open(s)) s.decided[i.id] = "skip";
  s.week++;
  const w = s.week;
  if (s.m.paydays.includes(w)) {
    const amt = w === s.m.chaos.cutWeek ? Math.round(s.m.paycheck * (1 - c.cut)) : s.m.paycheck;
    s.cash = r2(s.cash + amt);
    happened.push({ type: "pay", amount: amt, cut: w === s.m.chaos.cutWeek });
  }
  if (w === s.m.chaos.giftWeek) {
    s.cash = r2(s.cash + c.gift);
    happened.push({ type: "gift", amount: c.gift });
  }
  s.cash = r2(s.cash - s.m.living);
  if (w === s.emergency.week) {
    if (s.cash >= s.emergency.amount) {
      s.cash = r2(s.cash - s.emergency.amount);
      s.emergency.covered = true;
    } else {
      s.emergency.covered = false;
      s.emergency.short = r2(s.emergency.amount - Math.max(0, s.cash));
      s.mood = Math.max(0, s.mood - 2);
    }
    happened.push({ type: "emergency", covered: s.emergency.covered });
  }
  for (const p of s.plans) {
    for (const pay of p.payments) {
      if (pay.paid || pay.week !== w) continue;
      if (s.cash >= pay.amount) {
        s.cash = r2(s.cash - pay.amount);
        pay.paid = true;
        happened.push({ type: "draft", plan: p, amount: pay.amount });
      } else {
        s.fees.push({ week: w, amount: c.lateFee, app: p.app, item: p.item, boughtWeek: p.week });
        if (!s.locked.includes(p.app)) s.locked.push(p.app);
        s.mood = Math.max(0, s.mood - 1);
        pay.week = w + 1;
        pay.fails = (pay.fails || 0) + 1;
        s.firstFail ??= p.id;
        const text = `Late fee $${c.lateFee}. From: Pay in 4 at ${p.store}, week ${p.week}. ${appName(p.app)} locked you out.`;
        s.echoes.push({ week: w, text });
        happened.push({ type: "fail", plan: p, fee: c.lateFee, text });
      }
    }
  }
  s.cashByWeek[w - 1] = s.cash;
  return happened;
}

// how: "cash", "skip" or an app id for Pay in 4.
export function decide(s, itemId, how) {
  const it = s.m.items.find((i) => i.id === itemId);
  if (!it || it.week !== s.week || s.decided[it.id]) return { ok: false, message: "That one's gone." };
  if (how === "skip") {
    s.decided[it.id] = "skip";
    s.skipped.push(it.id);
    return { ok: true };
  }
  if (how === "cash") {
    if (s.cash < it.price) return { ok: false, message: "Not enough cash." };
    s.cash = r2(s.cash - it.price);
  } else {
    if (!appsOffered(s, it).includes(how)) return { ok: false, message: "That app isn't offered." };
    const part = partOf(it.price);
    if (s.cash < part) return { ok: false, message: "Not enough cash for the first payment." };
    s.cash = r2(s.cash - part);
    const last = r2(it.price - part * 3);
    s.plans.push({ id: `p${s.plans.length}`, app: how, item: it.name, store: it.store, week: s.week, price: it.price, payments: [1, 2, 3].map((k) => ({ week: s.week + 2 * k, amount: k === 3 ? last : part, paid: false })) });
  }
  s.decided[it.id] = how;
  s.vibes += it.vibes;
  s.mood = Math.min(MOODS.length - 1, s.mood + 1);
  s.bought.push({ id: it.id, how, price: it.price, week: s.week, name: it.name, store: it.store });
  return { ok: true };
}

// What the Wallet shows: cash at the end of each week from now on, with every
// known paycheck, living cost and draft. It can't see the emergency or a gift.
export function forecast(s, extra = null) {
  const out = s.cashByWeek.slice(0, s.week);
  let cash = s.cash;
  const plans = extra ? [...s.plans, extra] : s.plans;
  for (let w = s.week + 1; w <= WEEKS; w++) {
    if (s.m.paydays.includes(w)) cash += s.m.paycheck;
    cash -= s.m.living;
    for (const p of plans) for (const pay of p.payments) if (!pay.paid && pay.week === w) cash -= pay.amount;
    out.push(r2(cash));
  }
  return out;
}

export function draftsByWeek(s) {
  const weeks = Array.from({ length: WEEKS }, () => ({}));
  for (const p of s.plans) for (const pay of p.payments) if (pay.week <= WEEKS) weeks[pay.week - 1][p.app] = r2((weeks[pay.week - 1][p.app] || 0) + pay.amount);
  return weeks;
}

export const owedLeft = (s) => r2(s.plans.reduce((t, p) => t + p.payments.filter((x) => !x.paid).reduce((u, x) => u + x.amount, 0), 0));

// Shopping Score = Vibes + floor(ending cash / 4) - 3 x fees - 150 if the
// emergency wasn't covered. Ending cash counts the plan payments still owed,
// so a plan opened in week 12 isn't free.
export function score(s) {
  const c = C();
  const owed = owedLeft(s);
  const endCash = r2(s.cash - owed);
  const fees = r2(s.fees.reduce((t, f) => t + f.amount, 0));
  const total = s.vibes + Math.floor(endCash / 4) - c.feeWeight * fees - (s.emergency.covered === false ? c.emergencyPenalty : 0);
  return { score: Math.round(total), vibes: s.vibes, endCash, owed, fees, fails: s.fees.length, covered: s.emergency.covered !== false, bought: s.bought.length };
}

export function biggest(s) {
  const failed = s.firstFail && s.plans.find((p) => p.id === s.firstFail);
  if (failed) return { text: `splitting ${failed.item} at ${failed.store} in week ${failed.week}` };
  const top = s.bought.slice().sort((a, b) => b.price - a.price)[0];
  if (top) return { text: `buying ${top.name} for $${top.price}${top.how !== "cash" ? ` with ${appName(top.how)}` : ""}` };
  return { text: "skipping everything", reasons: { weak: "I didn't want anything.", okay: "I wanted to keep my cash safe.", strong: "Nothing was worth it once I counted the payments and the emergency coming." } };
}

// ---------- Bots for the acceptance tests and the seed band ----------

export function play(m, bot) {
  const s = newState(m);
  while (s.week < WEEKS) {
    nextWeek(s);
    for (const it of open(s)) bot(s, it);
  }
  return s;
}

export const neverBot = (s, it) => decide(s, it.id, "skip");
export const cashAllBot = (s, it) => decide(s, it.id, s.cash >= it.price ? "cash" : "skip");
export function bnplAllBot(s, it) {
  const app = appsOffered(s, it)[0];
  if (app && decide(s, it.id, app).ok) return;
  decide(s, it.id, s.cash >= it.price ? "cash" : "skip");
}

// Thoughtful: buy items with good Vibes for the money, keep a cushion for the
// emergency until it passes, and split only when the Wallet shows every payment fits.
export function thoughtfulBot(s, it) {
  const c = C();
  const cushion = s.emergency.covered == null ? c.cushion : 30;
  const worth = it.vibes / it.price >= c.worth;
  if (!worth) return decide(s, it.id, "skip");
  const min = (arr) => Math.min(s.cash, ...arr.slice(s.week));
  if (s.cash - it.price >= cushion && min(forecast(s).map((x) => x - it.price)) >= cushion) return decide(s, it.id, "cash");
  for (const app of appsOffered(s, it)) {
    const part = partOf(it.price);
    const plan = { payments: [1, 2, 3].map((k) => ({ week: s.week + 2 * k, amount: part, paid: false })) };
    if (s.cash - part >= cushion && min(forecast(s, plan).map((x) => x - part)) >= cushion) return decide(s, it.id, app);
  }
  return decide(s, it.id, "skip");
}
