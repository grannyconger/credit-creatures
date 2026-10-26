// Money Tree's rules (GAME-SPECS.md game 11). Pure and seeded. Dollars.
// Simplified for learning, not investment advice.
//
// A garden of four plots runs for 40 years. At each checkpoint the student sets
// how the yearly $1,200 is split (and can rebalance). A crash year in the index
// fund interrupts: hold or sell everything risky into savings. Year 3 takes the
// car money and year 15 a surprise expense, each from savings first, then the
// CD (with its penalty), then the index fund, then the coin.
import { CONFIG } from "../data/config.js";
import { createRng } from "../engine/index.js";
import { TREE_CHECKPOINTS, TREE_KEYS } from "../data/arcade/tree.js";

const C = () => CONFIG.arcade.games.tree;
const r2 = (x) => Math.round(x * 100) / 100;
export const YEARS = 40;
export { TREE_CHECKPOINTS as CHECKPOINTS };

// One market history: a yearly return for each plot.
export function market(seed) {
  const c = C();
  const rng = createRng(`${seed}:market`);
  const years = [];
  const crashes = new Set();
  const n = rng.int(2, 3);
  for (let k = 0; k < n; k++) crashes.add(rng.int(Math.max(2, Math.floor((k * YEARS) / n)), Math.floor(((k + 1) * YEARS) / n) - 2));
  const mania = rng.int(8, 30);
  let sav = rng.range(0.02, 0.04);
  let recover = 0;
  for (let y = 1; y <= YEARS; y++) {
    sav = Math.min(0.04, Math.max(0.02, sav + rng.range(-0.005, 0.005)));
    let idx;
    if (crashes.has(y)) {
      idx = -rng.range(c.crash[0], c.crash[1]);
      recover = 2;
    } else if (recover > 0) {
      idx = rng.range(0.14, 0.24);
      recover--;
    } else idx = c.indexMean + c.indexSwing * (rng.next() + rng.next() + rng.next() - 1.5);
    const roll = rng.next();
    let coin = roll < 0.5 ? rng.range(0.1, 0.5) : roll < 0.86 ? rng.range(0.8, 1.3) : rng.range(1.8, 3.2);
    if (y === mania || y === mania + 1) coin = rng.range(2.5, 3.5);
    years.push({ y, savings: sav, index: idx, coin, crash: crashes.has(y), mania: y === mania });
  }
  return { seed: String(seed), years, cdRate: rng.range(0.04, 0.05) };
}

export function newGarden(mkt) {
  const c = C();
  return { mkt, year: 0, cp: 0, savings: 0, cd: [], index: 0, coin: 0, split: { savings: 100, cd: 0, index: 0, coin: 0 }, car: null, surprise: null, missed: 0, treats: 0, sold: [], decisions: [], start: c.start, history: [{ year: 0, total: c.start }] };
}

export const cdValue = (g) => r2(g.cd.reduce((t, x) => t + x.amount, 0));
export const total = (g) => r2(g.savings + cdValue(g) + g.index + g.coin);
export const plotValue = (g, k) => (k === "cd" ? cdValue(g) : g[k]);

function invest(g, amount, year) {
  const s = g.split;
  g.savings += (amount * s.savings) / 100;
  g.index += (amount * s.index) / 100;
  g.coin += (amount * s.coin) / 100;
  if (s.cd) g.cd.push({ amount: (amount * s.cd) / 100, start: year, rate: g.mkt.cdRate });
}

// Takes money out for a goal or an expense, in order. Returns what was raised.
function withdraw(g, need) {
  const c = C();
  let got = 0;
  const take = (k) => {
    const v = Math.min(g[k], need - got);
    g[k] -= v;
    got += v;
  };
  take("savings");
  for (const lot of g.cd) {
    if (got >= need) break;
    const locked = g.year - lot.start < c.cdYears;
    const value = lot.amount * (locked ? 1 - c.cdPenalty : 1);
    const use = Math.min(value, need - got);
    lot.amount -= use / (locked ? 1 - c.cdPenalty : 1);
    got += use;
  }
  g.cd = g.cd.filter((x) => x.amount > 0.01);
  if (got < need) take("index");
  if (got < need) take("coin");
  return r2(got);
}

// At a checkpoint: set the split (percent, in tens) and maybe rebalance everything into it.
export function setSplit(g, split, rebalance = false) {
  g.split = { ...split };
  g.decisions.push({ year: g.year, split: { ...split }, rebalance });
  if (!rebalance) return 0;
  const c = C();
  let penalty = 0;
  for (const lot of g.cd) if (g.year - lot.start < c.cdYears) penalty += lot.amount * c.cdPenalty;
  const all = total(g) - penalty;
  g.savings = 0;
  g.index = 0;
  g.coin = 0;
  g.cd = [];
  invest(g, all, g.year);
  return r2(penalty);
}

// Runs years until the next checkpoint, or until a crash interrupts.
// watered: whether this period's contributions go in.
// Returns { at: "checkpoint" | "crash" | "end", events }.
export function run(g, { watered = true } = {}) {
  const c = C();
  const events = [];
  const next = TREE_CHECKPOINTS[g.cp + 1];
  while (g.year < next) {
    g.year++;
    const m = g.mkt.years[g.year - 1];
    if (watered) invest(g, c.yearly, g.year);
    else g.missed += c.yearly;
    g.savings *= 1 + m.savings;
    g.index *= 1 + m.index;
    g.coin *= m.coin;
    for (const lot of g.cd) lot.amount *= 1 + lot.rate;
    if (g.year === c.carYear) {
      const got = withdraw(g, c.carGoal);
      g.car = { got, short: r2(c.carGoal - got), hit: got >= c.carGoal - 0.5 };
      events.push({ type: "car", ...g.car });
    }
    if (g.year === c.surpriseYear) {
      g.surprise = withdraw(g, c.surprise);
      events.push({ type: "surprise", amount: c.surprise });
    }
    if (m.mania) events.push({ type: "mania" });
    g.history.push({ year: g.year, total: total(g) });
    if (m.crash && (g.index > 1 || g.coin > 1)) {
      events.push({ type: "crash", drop: m.index });
      if (g.year === next) g.cp++;
      return { at: "crash", events };
    }
  }
  g.cp++;
  return { at: g.year >= YEARS ? "end" : "checkpoint", events };
}

// Hold or sell everything risky into savings at the crash price.
export function crashChoice(g, sell) {
  g.decisions.push({ year: g.year, crash: true, sell });
  if (!sell) return 0;
  const moved = r2(g.index + g.coin);
  g.savings += moved;
  g.index = 0;
  g.coin = 0;
  g.sold.push(g.year);
  return moved;
}

// The ghost: what the other crash choice would be worth at the next checkpoint.
export function ghost(g, sell) {
  const copy = JSON.parse(JSON.stringify(g));
  crashChoice(copy, !sell);
  for (let guard = 0; guard < 10; guard++) {
    const r = run(copy, { watered: true });
    if (r.at !== "crash") break;
  }
  return total(copy);
}

// Goal Score = 500 for the car goal + up to 500 for retirement + up to 200 above
// target (1 point per $1,000) + treats taken.
export function score(g) {
  const c = C();
  const final = total(g);
  const car = g.car?.hit ? c.carPoints : 0;
  const ret = Math.min(1, final / c.retireTarget) * c.retirePoints;
  const above = Math.min(c.abovePoints, Math.max(0, final - c.retireTarget) / 1000);
  return { score: Math.round(car + ret + above + g.treats * c.treatPoints), final: Math.round(final), carHit: Boolean(g.car?.hit), carShort: g.car?.short || 0, retired: final >= c.retireTarget, treats: g.treats, missed: g.missed };
}

// ---------- Policies, for bots and the 100-run simulator ----------

// policy: { splitAt(year, g) -> { split, rebalance } | null, sellOnCrash: bool or (year) -> bool,
// waterAt(cp) -> bool, treat: whether a skipped watering takes the treat }
export function play(seed, policy) {
  const g = newGarden(market(seed));
  const first = policy.splitAt(0, g);
  if (first) setSplit(g, first.split, false);
  invest(g, C().start, 0);
  const sells = (y) => (typeof policy.sellOnCrash === "function" ? policy.sellOnCrash(y) : policy.sellOnCrash);
  while (g.year < YEARS) {
    const watered = policy.waterAt ? policy.waterAt(g.cp) : true;
    if (!watered && policy.treat) g.treats++;
    let r = run(g, { watered });
    while (r.at === "crash") {
      crashChoice(g, sells(g.year));
      r = atCheckpoint(g) ? { at: g.year >= YEARS ? "end" : "checkpoint" } : run(g, { watered });
    }
    if (g.year >= YEARS) break;
    const next = policy.splitAt(g.year, g);
    if (next) setSplit(g, next.split, next.rebalance);
  }
  return g;
}

// After a crash: true if the crash landed on a checkpoint year.
export const atCheckpoint = (g) => g.year === TREE_CHECKPOINTS[g.cp];

// Plants the starting $2,000 in the first split.
export function plant(g, split) {
  setSplit(g, split, false);
  invest(g, C().start, 0);
}

// The student's own plan as a policy, for the 100-run simulator.
export function policyOf(g, waters) {
  const at = new Map(g.decisions.filter((d) => !d.crash).map((d) => [d.year, d]));
  const crashes = g.decisions.filter((d) => d.crash);
  return { splitAt: (y) => at.get(y) || null, sellOnCrash: (y) => (crashes.find((d) => d.year >= y) || crashes.at(-1))?.sell || false, waterAt: (cp) => waters[cp] ?? true, treat: true };
}

export function simulate(seed, policy, runs = C().sims) {
  const scores = [];
  for (let k = 1; k <= runs; k++) scores.push(score(play(`${seed}+${k}`, policy)).final);
  scores.sort((a, b) => a - b);
  return { avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), best: scores.at(-1), worst: scores[Math.max(0, Math.floor(scores.length * 0.05) - 1)] };
}

const S = (savings, cd, index, coin) => ({ savings, cd, index, coin });
export const POLICIES = {
  balanced: { sellOnCrash: false, splitAt: (y) => (y === 0 ? { split: S(70, 30, 0, 0) } : y === 5 ? { split: S(10, 0, 90, 0), rebalance: true } : null) },
  panic: { sellOnCrash: true, splitAt: (y) => (y === 0 ? { split: S(70, 30, 0, 0) } : y === 5 ? { split: S(10, 0, 90, 0), rebalance: true } : null) },
  allSavings: { sellOnCrash: false, splitAt: (y) => (y === 0 ? { split: S(100, 0, 0, 0) } : null) },
  allCoin: { sellOnCrash: false, splitAt: (y) => (y === 0 ? { split: S(0, 0, 0, 100) } : null) },
};

export function biggest(g) {
  const crash = g.decisions.find((d) => d.crash);
  if (crash) return { text: `${crash.sell ? "selling" : "holding"} during the year ${crash.year} storm` };
  const s = g.decisions[0]?.split;
  return { text: s ? `your year 0 split (${TREE_KEYS.filter((k) => s[k]).map((k) => `${s[k]} percent ${k === "cd" ? "CD" : k}`).join(", ")})` : "how you planted at the start" };
}
