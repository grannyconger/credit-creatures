// Runs many creature lives with different play styles (SPEC §23 Phase 2).
import * as E from "../../js/engine/index.js";
import { STRATEGIES } from "./strategies.js";

export function simulateLife(strategy, seed, months = 48) {
  const bot = STRATEGIES[strategy];
  const rng = E.createRng(`${seed}:bot`);
  let life = E.createLife({ seed, name: `${strategy}-${seed}` });
  life = E.addBill(life, "Phone", 45).life;
  life = E.addBill(life, "Bus pass", 30).life;
  life = bot.setup(life, rng);
  const changes = [];
  for (let m = 0; m < months; m++) {
    life = bot.month(life, rng);
    const r = E.endMonth(life);
    life = r.life;
    changes.push(r.scoreChange);
  }
  const report = E.creditReport(life);
  const f = report.factors;
  return {
    strategy,
    seed,
    score: life.score,
    onTimePct: f.payment.onTimePct,
    utilization: f.owed.utilization,
    collections: report.collections.length,
    inquiries: f.newCredit.inquiries,
    accounts: report.tradelines.length,
    changes,
    life,
  };
}

// n lives split evenly across the strategies.
export function simulateLives({ n = 1000, months = 48, seed = "credit-life" } = {}) {
  const names = Object.keys(STRATEGIES);
  const results = [];
  for (let i = 0; i < n; i++) {
    const strategy = names[i % names.length];
    results.push(simulateLife(strategy, `${seed}-${i}`, months));
  }
  return results;
}

export function summarize(results) {
  const by = {};
  for (const r of results) (by[r.strategy] ||= []).push(r);
  const out = {};
  for (const [name, rs] of Object.entries(by)) {
    const scores = rs.map((r) => r.score).filter((s) => s != null).sort((a, b) => a - b);
    const q = (p) => scores[Math.min(scores.length - 1, Math.floor(p * scores.length))];
    const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
    out[name] = {
      count: rs.length,
      scored: scores.length,
      min: scores[0],
      p10: q(0.1),
      median: q(0.5),
      p90: q(0.9),
      max: scores[scores.length - 1],
      share700plus: scores.filter((s) => s >= 700).length / rs.length,
      shareUnder600: rs.filter((r) => r.score == null || r.score < 600).length / rs.length,
      onTimePct: mean(rs.map((r) => r.onTimePct)),
      utilization: mean(rs.map((r) => r.utilization ?? 0)),
      collectionsRate: rs.filter((r) => r.collections > 0).length / rs.length,
      inquiries: mean(rs.map((r) => r.inquiries)),
      scores,
    };
  }
  return out;
}
