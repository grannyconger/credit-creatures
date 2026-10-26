// The Lot's rules (GAME-SPECS.md game 8). Pure and seeded. Dollars.
// The 2-year cost is the real cost of owning the car for two years and then
// selling it: the down payment, 24 payments, what you'd still owe, insurance and
// repairs, minus what the car is worth. Long terms and add-ons make it bigger.
import { CONFIG } from "../data/config.js";
import { createRng, amortizedPayment } from "../engine/index.js";
import { LOT_CARS, LOT_ADDONS } from "../data/arcade/lot.js";

const C = () => CONFIG.arcade.games.lot;
const r2 = (x) => Math.round(x * 100) / 100;
// APRs keep four decimals (6.75 percent is 0.0675).
const r4 = (x) => Math.round(x * 10000) / 10000;

export function newShift(seed) {
  const c = C();
  const rng = createRng(`${seed}:lot`);
  const cars = ["flashy", "certified", "older"].map((type) => {
    const pool = LOT_CARS.filter((x) => x.type === type);
    const t = pool[rng.int(0, pool.length - 1)];
    const price = rng.int(t.price[0] / 100, t.price[1] / 100) * 100;
    const repairs = [0, 1].map(() => (rng.next() < t.repairs.odds ? rng.int(t.repairs.cost[0] / 10, t.repairs.cost[1] / 10) * 10 : 0));
    const addons = LOT_ADDONS.map((a) => ({ ...a, price: rng.int(a.price[0] / 10, a.price[1] / 10) * 10 })).filter((_, k) => k === 0 || rng.chance(0.65));
    return { ...t, price, repairs, addons, term: [60, 72, 84][rng.int(0, 2)] };
  });
  const cuApr = r4(rng.range(c.cuApr[0], c.cuApr[1]));
  return {
    seed: String(seed),
    cars,
    cuApr,
    maxLoan: c.maxLoan,
    dealerApr: r4(cuApr + rng.range(c.dealerBump[0], c.dealerBump[1])),
    lowerCut: r2(rng.range(c.lowerCut[0], c.lowerCut[1])),
    callback: rng.next(),
    secondBuyer: rng.chance(c.secondBuyerChance) ? rng.int(1, 2) : 0,
    manager: rng.chance(c.managerChance) ? 2 : 0,
  };
}

export function newState(deal) {
  return { deal, pre: null, car: null, offer: null, first: null, round: 0, lowerUsed: false, sold: [], log: [], phase: "pre", strikes: new Set(), managerOn: false, final: null, secondBuyerSeen: false };
}

export function offerMath(o) {
  const addons = o.addons.reduce((t, a) => t + a.price, 0);
  const financed = Math.max(0, o.price + addons + C().docFee - o.down);
  const monthly = amortizedPayment(financed, o.apr, o.term);
  return { addons, financed, monthly, totalPayments: r2(monthly * o.term), total: r2(o.down + monthly * o.term) };
}

export function preapprove(s, yes) {
  s.pre = yes ? { apr: s.deal.cuApr, max: s.deal.maxLoan } : null;
  s.phase = "lot";
  return s.pre;
}

export function pickCar(s, i) {
  const car = s.deal.cars[i];
  if (!car || s.sold.includes(i)) return null;
  s.car = i;
  s.round = 0;
  s.lowerUsed = false;
  s.offer = { price: car.price, apr: s.deal.dealerApr, term: car.term, down: C().down, addons: car.addons.map((a) => ({ ...a })) };
  s.first ??= { car: i, offer: { ...s.offer, addons: s.offer.addons.map((a) => ({ ...a })) } };
  s.phase = "nego";
  return s.offer;
}

// kind: "price" | "term" | "rate". Returns { ok, text }.
export function counter(s, kind) {
  const c = C();
  if (s.phase !== "nego" || s.round >= c.rounds) return { ok: false, text: "That was the final offer. Accept it or walk away." };
  s.round++;
  let out;
  if (kind === "price") {
    if (s.lowerUsed) out = { ok: false, text: "\"I already went as low as I can on price.\"" };
    else {
      s.lowerUsed = true;
      s.offer.price = Math.round((s.offer.price * (1 - s.deal.lowerCut)) / 100) * 100;
      out = { ok: true, text: `"Let me talk to my manager." He comes back $${Math.round(s.deal.cars[s.car].price - s.offer.price).toLocaleString()} lower.` };
    }
  } else if (kind === "term") {
    if (s.offer.term <= c.minTerm) out = { ok: false, text: "\"That's already our shortest term.\"" };
    else {
      s.offer.term = Math.max(c.minTerm, s.offer.term - 24);
      out = { ok: true, text: `${s.offer.term} months. The payment goes up, but the total goes down.` };
    }
  } else if (kind === "rate") {
    if (!s.pre) out = { ok: false, text: "\"What credit union rate? You don't have one.\" Preapproval would have helped here." };
    else if (offerMath(s.offer).financed > s.pre.max) out = { ok: false, text: `"Your credit union only approved $${s.pre.max.toLocaleString()}. This loan is bigger than that." The rate stays.` };
    else if (s.offer.apr <= s.pre.apr - 0.0025) out = { ok: false, text: "\"We already beat it.\"" };
    else {
      s.offer.apr = r4(s.pre.apr - 0.0025);
      out = { ok: true, text: `"Fine, we'll beat your credit union." ${(s.offer.apr * 100).toFixed(2)} percent APR.` };
    }
  } else out = { ok: false, text: "Pick a counter." };
  s.managerOn = s.deal.manager === s.round;
  if (s.managerOn) s.offer.price -= C().managerOff;
  s.log.push({ round: s.round, kind, ok: out.ok });
  return out;
}

// Walking away: a callback with a better offer, or the car is sold.
export function walk(s) {
  const c = C();
  if (s.phase !== "nego") return null;
  const odds = s.deal.secondBuyer && s.secondBuyerSeen ? c.callbackOdds.secondBuyer : c.callbackOdds.normal;
  const back = s.deal.callback < odds;
  s.log.push({ round: s.round, kind: "walk", ok: back });
  // Each walk uses up some of the luck, so walking every time eventually loses.
  s.deal.callback = (s.deal.callback + 0.37) % 1;
  if (back) {
    s.offer.price = Math.round((s.offer.price * (1 - c.callbackCut)) / 100) * 100;
    s.offer.apr = r4(Math.max(s.pre ? s.pre.apr - 0.0025 : s.deal.cuApr + 0.01, s.offer.apr - 0.01));
    s.round = Math.max(0, s.round - 1);
    return { callback: true, text: "Your phone rings. \"Come back in, I've got a better number for you.\"" };
  }
  s.sold.push(s.car);
  s.car = null;
  s.offer = null;
  s.phase = "lot";
  return { callback: false, text: "Someone else bought it while you were gone." };
}

export const leave = (s) => ((s.phase = "done"), (s.final = null));

export function accept(s) {
  if (s.phase !== "nego") return false;
  s.phase = "contract";
  s.strikes = new Set();
  return true;
}

export function strike(s, id) {
  if (s.phase !== "contract") return;
  if (s.strikes.has(id)) s.strikes.delete(id);
  else s.strikes.add(id);
}

export function sign(s) {
  if (s.phase !== "contract") return null;
  s.final = { car: s.car, offer: { ...s.offer, addons: s.offer.addons.filter((a) => !s.strikes.has(a.id)) } };
  s.phase = "done";
  return s.final;
}

// The 2-year cost of owning a deal, then selling the car.
export function twoYear(deal, carIndex, offer) {
  const c = C();
  const car = deal.cars[carIndex];
  const m = offerMath(offer);
  const r = offer.apr / 12;
  let bal = m.financed;
  for (let k = 0; k < 24 && k < offer.term; k++) bal = bal * (1 + r) - m.monthly;
  const owed = Math.max(0, r2(bal));
  const paid = r2(m.monthly * Math.min(24, offer.term));
  const insurance = Math.round(car.insurance * 12 + car.insurance * (1 + c.renewal) * 12);
  const repairs = car.repairs[0] + car.repairs[1];
  const resale = Math.round(car.price * car.keep);
  return { down: offer.down, paid, owed, insurance, repairs, resale, cost: Math.round(offer.down + paid + owed + insurance + repairs - resale), monthly: m.monthly, total: m.total, interest: r2(m.totalPayments - m.financed) };
}

// Deal Score = Ride x 50 + (first offer 2-year cost - your 2-year cost) / 10,
// at least 0. Leaving with no car is 50.
export function score(s) {
  const c = C();
  if (!s.final) return { score: c.noCarScore, noCar: true, cost: null };
  const car = s.deal.cars[s.final.car];
  const mine = twoYear(s.deal, s.final.car, s.final.offer);
  // The baseline is the salesman's first offer on the car you drove home.
  const base = twoYear(s.deal, s.final.car, { ...s.deal.cars[s.final.car], price: car.price, apr: s.deal.dealerApr, term: car.term, down: c.down, addons: car.addons });
  const total = Math.max(0, car.ride * c.perRide + (base.cost - mine.cost) / 10);
  return { score: Math.round(total), noCar: false, cost: mine.cost, base, mine, car };
}

export function biggest(s) {
  if (!s.final) return { text: "walking away with no car", reasons: { weak: "I didn't like any of them.", okay: "The deals were bad.", strong: "I should have countered with my preapproval before walking away." } };
  const car = s.deal.cars[s.final.car];
  return { text: `buying the ${car.name} at ${s.final.offer.term} months` };
}

// ---------- Bots ----------
export function play(seed, bot) {
  const s = newState(newShift(seed));
  preapprove(s, bot.pre);
  for (let guard = 0; guard < 20 && s.phase !== "done"; guard++) {
    if (s.phase === "lot") {
      const choice = bot.pick(s);
      if (choice == null) leave(s);
      else pickCar(s, choice);
      if (s.deal.secondBuyer) s.secondBuyerSeen = true;
    } else if (s.phase === "nego") {
      const move = bot.move(s);
      if (move === "accept") accept(s);
      else if (move === "walk") walk(s);
      else counter(s, move);
    } else if (s.phase === "contract") {
      if (bot.strike) for (const a of s.offer.addons) strike(s, a.id);
      sign(s);
    }
  }
  return s;
}

const firstOpen = (s, order) => order.find((i) => !s.sold.includes(i)) ?? null;
export const balancedBot = { pre: true, strike: true, pick: (s) => firstOpen(s, [1, 2]), move: (s) => (s.round === 0 ? "rate" : s.round === 1 && !s.lowerUsed ? "price" : s.round === 2 ? "term" : "accept") };
export const cheapestBot = { ...balancedBot, pick: (s) => firstOpen(s, [2, 1]) };
export const firstOfferBot = { pre: false, strike: false, pick: (s) => firstOpen(s, [1, 2, 0]), move: () => "accept" };
export const walkerBot = { pre: true, strike: true, pick: (s) => firstOpen(s, [1, 2, 0]), move: (s) => (s.log.filter((x) => x.kind === "walk").length < 6 ? "walk" : "accept") };
