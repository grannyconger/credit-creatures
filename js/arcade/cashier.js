// Cashier Rush's rules (GAME-SPECS.md game 1). Pure and seeded. Money is in
// whole cents. Time is passed in as milliseconds since the shift began, so the
// UI owns the clock and Node tests can run whole shifts instantly.
import { CONFIG } from "../data/config.js";
import { createRng } from "../engine/index.js";
import { cashierCustomer } from "../ui/minigames/gen.js";
import { CASHIER_ITEMS } from "../data/minigames.js";
import { CR_NAMES } from "../data/arcade/cashier.js";

const C = () => CONFIG.arcade.games.cashier;
export const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;
export const DRAWERS = { easy: [100, 500, 1000], medium: [5, 10, 25, 100, 500, 1000], hard: [1, 5, 10, 25, 100, 500, 1000] };

export function newShift(seed, { difficulty, round }) {
  const c = C();
  const rng = createRng(`${seed}:${difficulty}:${round}`);
  const n = round === "chill" ? c.chillCustomers : c.speedPool;
  const names = CR_NAMES.slice();
  const customers = [];
  for (let i = 0; i < n; i++) {
    const base = cashierCustomer(rng, difficulty, CASHIER_ITEMS);
    const name = names.splice(rng.int(0, names.length - 1), 1)[0] || `Customer ${i + 1}`;
    // Customers always hand whole dollars (teacher request 2026-10-27), so the
    // odd-amount "smart payers" are gone.
    customers.push({ i, name, item: base.item, price: base.price, paid: base.paid, smart: false, short: 0 });
  }
  // The short customer: once a shift on Medium and Hard. They hand the whole
  // dollars just under the price, so they're short the cents.
  let shortAt = null;
  if (difficulty !== "easy") {
    shortAt = rng.int(2, Math.min(4, n - 2));
    const sc = customers[shortAt];
    sc.paid = Math.floor(sc.price / 100) * 100;
    sc.short = sc.price - sc.paid;
  }
  const returns = rng.chance(c.returnOdds);
  const rushAt = round === "speed" ? rng.int(c.rushAt[0], c.rushAt[1]) * 1000 : null;
  return { seed: String(seed), difficulty, round, customers, shortAt, returns, rushAt };
}

export function newState(deal) {
  const c = C();
  const s = { deal, line: [], current: null, nextIdx: 0, nextArrival: 0, rushDone: false, served: 0, right: 0, wrong: 0, tips: 0, sales: [], drawer: 0, short: null, returnBonus: 0, guess: null, guessRight: false, patienceMs: c.patience[deal.difficulty] * 1000, over: false };
  if (deal.round === "chill") for (let k = 0; k < deal.customers.length; k++) join(s, 0);
  else for (let k = 0; k < c.lineSize; k++) join(s, 0);
  s.nextArrival = c.arriveMs;
  callNext(s, 0);
  return s;
}

function join(s, now) {
  const cust = s.deal.customers[s.nextIdx];
  if (!cust) return false;
  s.nextIdx++;
  s.line.push({ ...cust, joinedAt: now });
  return true;
}

function callNext(s, now) {
  s.current = s.line.shift() || null;
  if (s.current) s.current.calledAt = now;
  return s.current;
}

// Customers keep arriving in the Speed round, plus one rush of 3 at once.
// Returns what happened ({ rush }).
export function tick(s, now) {
  const c = C();
  const out = {};
  if (s.deal.round !== "speed" || s.over) return out;
  while (now >= s.nextArrival && s.line.length < c.lineSize) {
    join(s, s.nextArrival);
    s.nextArrival += c.arriveMs;
  }
  if (now >= s.nextArrival) s.nextArrival = now + c.arriveMs;
  if (!s.rushDone && s.deal.rushAt != null && now >= s.deal.rushAt) {
    s.rushDone = true;
    for (let k = 0; k < 3; k++) join(s, now);
    out.rush = true;
  }
  if (!s.current) callNext(s, now);
  return out;
}

// 1 when they just joined the line, 0 when their patience ran out.
export const patience = (s, cust, now) => Math.max(0, Math.min(1, 1 - (now - cust.joinedAt) / s.patienceMs));
export const tipFor = (frac) => Math.round(frac * C().tipMax);
export const changeDue = (cust) => cust.paid - cust.price;

// Gives change to the current customer. Returns the sale, with a one-line why.
export function give(s, given, now) {
  const cust = s.current;
  if (!cust || cust.short) return null;
  const want = changeDue(cust);
  const ok = given === want;
  const diff = given - want;
  const frac = patience(s, cust, now);
  const tip = ok ? tipFor(frac) : 0;
  s.served++;
  if (ok) s.right++;
  else {
    s.wrong++;
    // Over-giving leaves the drawer short. Short-changing leaves it over.
    s.drawer -= diff;
  }
  s.tips += tip;
  const sale = { i: cust.i, name: cust.name, price: cust.price, paid: cust.paid, want, given, ok, diff, tip, smart: cust.smart };
  s.sales.push(sale);
  sale.why = whyLine(sale);
  callNext(s, now);
  return sale;
}

function whyLine(sale) {
  if (sale.ok && sale.smart) return `They paid ${fmt(sale.paid)} so the change came out to an easy ${fmt(sale.want)}. Smart payers add coins to skip a pile of pennies.`;
  if (sale.ok) return `Counting up from ${fmt(sale.price)} to ${fmt(sale.paid)} is ${fmt(sale.want)}.`;
  return `You gave ${fmt(sale.given)}, which is ${fmt(Math.abs(sale.diff))} ${sale.diff > 0 ? "too much" : "too little"}. The change was ${fmt(sale.want)}.`;
}

// The short customer: cover the gap from your tips (Y) or turn them away (N).
// About half of covered customers come back later with a big tip.
export function decideShort(s, cover, now) {
  const c = C();
  const cust = s.current;
  if (!cust?.short) return null;
  const cost = Math.ceil(cust.short / 10);
  s.short = { name: cust.name, cents: cust.short, cover, cost: cover ? cost : 0, returned: cover && s.deal.returns };
  if (cover) {
    s.tips -= cost;
    if (s.deal.returns) s.returnBonus = c.returnTip;
  }
  callNext(s, now);
  const text = cover
    ? s.deal.returns
      ? `${cust.name} came back later and left a ${c.returnTip}-point tip. Kindness paid off this time.`
      : `You covered ${fmt(cust.short)} from your tips. ${cust.name} never came back. That happens too.`
    : `${cust.name} left with a sad little wave. You kept your tips.`;
  return { ...s.short, text };
}

// Drawer reveal: guess Over, Short or Exact before it's counted.
export function drawerState(s) {
  return s.drawer > 0 ? "over" : s.drawer < 0 ? "short" : "exact";
}

export function guessDrawer(s, guess) {
  s.guess = guess;
  s.guessRight = guess === drawerState(s);
  return s.guessRight;
}

// Each change mistake, as the drawer reveal reads it.
export function drawerLines(s) {
  return s.sales.filter((x) => !x.ok).map((x) => `${x.diff > 0 ? "Short" : "Over"} ${fmt(Math.abs(x.diff))}. ${x.name}: you gave ${fmt(Math.abs(x.diff))} too ${x.diff > 0 ? "much" : "little"}.`);
}

// Rush Score = right sales x difficulty points + tips + the drawer guess bonus
// (+ a returning short customer's tip).
export function score(s) {
  const c = C();
  const pts = c.points[s.deal.difficulty];
  const total = s.right * pts + s.tips + (s.guessRight ? c.guessBonus : 0) + s.returnBonus;
  return { score: Math.round(total), right: s.right, wrong: s.wrong, tips: s.tips, served: s.served, drawer: s.drawer, guessRight: s.guessRight };
}

export function biggest(s) {
  if (s.short) return { text: s.short.cover ? `covering ${s.short.name}'s ${fmt(s.short.cents)}` : `turning ${s.short.name} away` };
  const worst = s.sales.filter((x) => !x.ok).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0];
  if (worst) return { text: `the change for ${worst.name} (${fmt(worst.want)})`, reasons: { weak: "I was rushing for the tip.", okay: "I counted the bills but guessed the coins.", strong: "I should count up from the price, coin by coin, then bill by bill." } };
  return { text: "how fast to go versus how carefully to count", reasons: { weak: "I just tapped fast.", okay: "I slowed down on the hard ones.", strong: "A wrong sale costs more than a smaller tip, so I counted up every time." } };
}

// The count-up method for the skill moment: from the price up to what they paid,
// smallest pieces first. Returns [{ piece, total }].
export function countUp(price, paid, drawer) {
  const steps = [];
  let total = price;
  const asc = drawer.slice().sort((a, b) => a - b);
  // First round up with the small pieces: pennies to a nickel, nickels to a
  // dime, and so on. Then the biggest pieces that still fit.
  asc.forEach((d, k) => {
    const next = asc[k + 1];
    if (!next) return;
    while (total % next !== 0 && total + d <= paid) {
      total += d;
      steps.push({ piece: d, total });
    }
  });
  for (const d of asc.slice().reverse()) {
    while (total + d <= paid) {
      total += d;
      steps.push({ piece: d, total });
    }
  }
  return total === paid ? steps : [];
}

// Exact change in the fewest pieces (for bots and the hint).
export function makeChange(cents, drawer) {
  const out = [];
  for (const p of drawer.slice().sort((a, b) => b - a)) while (cents >= p) (out.push(p), (cents -= p));
  return cents === 0 ? out : null;
}
