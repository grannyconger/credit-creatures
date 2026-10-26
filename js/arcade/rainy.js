// Rainy Day's rules (GAME-SPECS.md game 10). Pure and seeded.
// A plan (a choice for each policy plus an emergency fund) meets a year of 12
// event cards. Money pays from the fund first, then checking, then debt.
// Plan Strength plays the same plan on 100 other years, so a good plan wins,
// not a lucky one.
import { CONFIG } from "../data/config.js";
import { createRng } from "../engine/index.js";
import { RD_POLICIES, RD_EVENTS } from "../data/arcade/rainy.js";

const C = () => CONFIG.arcade.games.rainy;
export const POLICY_KEYS = Object.keys(RD_POLICIES);
export const MONTHS = 12;

export function newYear(seed) {
  const c = C();
  const rng = createRng(`${seed}:rainy`);
  const start = rng.int(c.start[0] / 100, c.start[1] / 100) * 100;
  const income = rng.int(c.income[0] / 10, c.income[1] / 10) * 10;
  const tiers = Object.entries(c.tierWeights);
  const total = tiers.reduce((t, [, w]) => t + w, 0);
  const cards = [];
  for (let m = 0; m < MONTHS; m++) {
    let r = rng.next() * total;
    let tier = tiers[0][0];
    for (const [t, w] of tiers) {
      if ((r -= w) < 0) {
        tier = t;
        break;
      }
    }
    const pool = RD_EVENTS.filter((e) => e.tier === tier && !cards.some((x) => x.id === e.id));
    const e = pool[rng.int(0, pool.length - 1)] || RD_EVENTS[0];
    const range = e.cost || e.gain;
    cards.push({ ...e, amount: range ? Math.round((range[0] + rng.next() * (range[1] - range[0])) / 10) * 10 : 0 });
  }
  return { seed: String(seed), start, income, cards };
}

export const premiumOf = (plan, key, bumped = false) => {
  const p = RD_POLICIES[key][plan[key]];
  if (!p) return 0;
  return Math.round(p.premium * (key === "car" && bumped ? 1 + C().renewalBump : 1));
};
export const monthlyPremiums = (plan) => POLICY_KEYS.reduce((t, k) => t + premiumOf(plan, k), 0);

// Runs one year. Returns every month's result and the year-end money.
export function runYear(year, plan) {
  const c = C();
  let cash = year.start - plan.fund;
  let fund = plan.fund;
  let debt = 0;
  let interest = 0;
  let atFault = false;
  let bumped = false;
  let extras = 0;
  let fees = 0;
  const months = [];
  for (let m = 0; m < MONTHS; m++) {
    cash += year.income;
    // Premiums come from checking. If checking can't cover them, coverage lapses
    // this month and there's a fee. (The fund is set aside, not for premiums.)
    const due = POLICY_KEYS.reduce((t, k) => t + premiumOf(plan, k, bumped), 0);
    const lapsed = due > 0 && cash < due;
    const prem = lapsed ? 0 : due;
    if (lapsed) {
      cash -= c.lapseFee;
      fees += c.lapseFee;
    }
    cash -= prem;
    const e = year.cards[m];
    let you = 0;
    let ins = 0;
    let gain = 0;
    let fromFund = 0;
    let fromCash = 0;
    let toDebt = 0;
    const pol = !lapsed && e.policy && e.policy !== "none" ? RD_POLICIES[e.policy][plan[e.policy]] : null;
    if (e.cost) {
      if (pol && !e.excluded) {
        you = Math.min(e.amount, pol.deductible);
        ins = e.amount - you;
      } else you = e.amount;
      fromFund = Math.min(fund, you);
      fund -= fromFund;
      const rest = you - fromFund;
      fromCash = Math.min(Math.max(0, cash), rest);
      cash -= fromCash;
      toDebt = rest - fromCash;
      debt += toDebt;
      if (e.atFault && e.policy === "car") atFault = true;
    } else if (e.gain) {
      gain = e.amount;
      cash += gain;
    }
    if (cash < 0) {
      debt += -cash;
      toDebt += -cash;
      cash = 0;
    }
    // Money sitting in checking slowly gets spent on everyday extras. The fund doesn't.
    const extra = Math.round(Math.max(0, cash - c.creepFloor) * c.creep);
    cash -= extra;
    extras += extra;
    const renewal = m === c.renewalMonth - 1 && atFault && plan.car !== "none" && !bumped;
    if (renewal) bumped = true;
    const i = Math.round(debt * (c.debtApr / 12));
    debt += i;
    interest += i;
    months.push({ m: m + 1, card: e, premiums: prem, lapsed, extra, you, ins, gain, fromFund, fromCash, toDebt, covered: Boolean(pol && !e.excluded), excluded: Boolean(e.excluded && pol), renewal, fund, cash, debt });
  }
  return { months, end: Math.round(cash + fund - debt), cash: Math.round(cash), fund, debt: Math.round(debt), interest, bumped, extras, fees, lapses: months.filter((x) => x.lapsed).length, premiums: months.reduce((t, x) => t + x.premiums, 0) };
}

// The 100-run simulator (2.10): the same plan on 100 other years.
export function simulate(seed, plan, runs = C().sims) {
  const ends = [];
  for (let k = 1; k <= runs; k++) ends.push(runYear(newYear(`${seed}+${k}`), plan).end);
  ends.sort((a, b) => a - b);
  return { avg: Math.round(ends.reduce((a, b) => a + b, 0) / ends.length), best: ends.at(-1), worst: ends[Math.max(0, Math.floor(ends.length * 0.05) - 1)] };
}

export const PLANS = {
  none: (fund) => ({ car: "none", renters: "none", health: "none", phone: "none", fund }),
  low: (fund) => ({ car: "low", renters: "low", health: "low", phone: "low", fund }),
  // Insure the big risks with high deductibles, and cheap low ones where they pay off.
  balanced: (fund) => ({ car: "high", renters: "low", health: "high", phone: "low", fund }),
};

// Shift pay = year-end money / 20. Ranked metric = Plan Strength.
export function score(seed, plan, year, result) {
  const sim = simulate(seed, plan);
  return { strength: sim.avg, worst: sim.worst, best: sim.best, points: Math.round(result.end / C().payDivisor), end: result.end, interest: result.interest };
}

// The biggest decision (2.7): the coverage choice for the costliest event, else the highest premium.
export function biggest(plan, result) {
  const big = result.months.filter((x) => x.card.cost).sort((a, b) => b.card.amount - a.card.amount)[0];
  const word = { none: "no", low: "low-deductible", high: "high-deductible" };
  if (big && big.card.amount >= 1000 && big.card.policy !== "none") return { text: `choosing ${word[plan[big.card.policy]]} ${RD_POLICIES[big.card.policy].name.toLowerCase()} before the ${big.card.title.toLowerCase()}` };
  const top = POLICY_KEYS.filter((k) => plan[k] !== "none").sort((a, b) => premiumOf(plan, b) - premiumOf(plan, a))[0];
  if (top) return { text: `your ${word[plan[top]]} ${RD_POLICIES[top].name.toLowerCase()}` };
  return { text: "skipping insurance", reasons: { weak: "I didn't think anything would happen.", okay: "Premiums are expensive.", strong: "I had enough in my fund for small stuff, but I'd have insured the big risks if I'd thought it through." } };
}
