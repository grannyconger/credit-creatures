// Simplified credit score with real FICO weights (SPEC §11).
// Works only from the credit report, never from hidden game state.
import { CONFIG } from "../data/config.js";
import { clamp, curve, pct } from "./util.js";

const S = CONFIG.score;
const SEVERITY = { 30: 1, 60: 2, 90: 3, CO: 4 };

export const FACTOR_LABELS = {
  payment: "Payment history",
  owed: "Amounts owed",
  length: "Length of history",
  mix: "Credit mix",
  newCredit: "New credit",
};

function paymentFactor(report) {
  let ok = 0;
  let total = 0;
  let penalty = 0;
  let episodes = 0;
  let latest = null;
  for (const t of report.tradelines) {
    let worst = null;
    let last = null;
    const close = () => {
      if (!worst) return;
      episodes++;
      penalty += S.latePenalty[worst] * curve(S.lateRecency, report.month - 1 - last);
      worst = null;
    };
    for (const h of t.history) {
      total++;
      if (h.code === "OK") {
        ok++;
        close();
        continue;
      }
      if (!worst || SEVERITY[h.code] > SEVERITY[worst]) worst = h.code;
      last = h.month;
      if (!latest || h.month > latest.month || (h.month === latest.month && SEVERITY[h.code] > SEVERITY[latest.code])) {
        latest = { month: h.month, code: h.code, name: t.name };
      }
    }
    close();
  }
  const open = report.collections.filter((c) => !c.paid).length;
  const paid = report.collections.length - open;
  penalty += open * S.openCollectionPenalty + paid * S.paidCollectionPenalty;
  const records = report.publicRecords || [];
  for (const r of records) penalty += S.freshStartPenalty * curve(S.freshStartRecency, report.month - r.month);
  const d = S.historyDepth;
  const depthMonths = Math.max(0, ...report.tradelines.map((t) => t.history.length * (t.owner === "authorized" ? d.authorizedShare : 1)));
  const depth = d.floor + (1 - d.floor) * Math.min(1, depthMonths / d.fullMonths);
  return {
    value: clamp((1 - penalty) * depth, 0, 1),
    depthMonths,
    onTimePct: total ? ok / total : 1,
    lateEpisodes: episodes,
    latestLate: latest,
    openCollections: open,
    paidCollections: paid,
    freshStarts: records.length,
  };
}

function owedFactor(report) {
  // Cards in collections still count, with their unpaid balance against the old limit.
  const revolving = report.tradelines.filter((t) => t.kind === "revolving" && (t.status === "open" || t.status === "collections") && t.limit > 0);
  const installment = report.tradelines.filter((t) => t.kind === "installment" && t.status === "open" && t.original > 0);
  const limit = revolving.reduce((s, t) => s + t.limit, 0);
  const balance = revolving.reduce((s, t) => s + t.balance, 0);
  const utilization = limit > 0 ? balance / limit : null;
  const maxCardUtil = revolving.length ? Math.max(...revolving.map((t) => t.balance / t.limit)) : null;
  const instOriginal = installment.reduce((s, t) => s + t.original, 0);
  const instBalance = installment.reduce((s, t) => s + t.balance, 0);
  const installmentRatio = instOriginal > 0 ? instBalance / instOriginal : null;

  let rev = S.noRevolvingOwed;
  if (utilization != null) {
    rev = S.overallUtilShare * curve(S.utilizationCurve, utilization) + (1 - S.overallUtilShare) * curve(S.utilizationCurve, maxCardUtil);
  }
  let value = rev;
  if (installmentRatio != null) {
    const inst = 1 - 0.4 * clamp(installmentRatio, 0, 1);
    value = (1 - S.installmentShare) * rev + S.installmentShare * inst;
  }
  return { value: clamp(value, 0, 1), utilization, maxCardUtil, installmentRatio, revolvingBalance: balance, revolvingLimit: limit };
}

// Closed cards drop out of length in the game, so closing your oldest card hurts (SPEC §11).
function countsForLength(t) {
  return t.status === "open" || t.status === "paid" || t.status === "collections" || t.status === "collectionPaid";
}

function lengthFactor(report) {
  const ages = report.tradelines
    .filter(countsForLength)
    .map((t) => Math.max(0, t.owner === "authorized" ? Math.min(t.ageMonths, S.authorizedAgeCapMonths) : t.ageMonths));
  if (!ages.length) return { value: 0, oldestMonths: 0, averageMonths: 0 };
  const oldest = Math.max(...ages);
  const average = ages.reduce((a, b) => a + b, 0) / ages.length;
  const p = S.lengthCurvePower;
  const value = 0.6 * Math.pow(Math.min(1, oldest / S.oldestFullMonths), p) + 0.4 * Math.pow(Math.min(1, average / S.averageFullMonths), p);
  return { value, oldestMonths: oldest, averageMonths: Math.round(average) };
}

function mixFactor(report) {
  const active = report.tradelines.filter((t) => t.status === "open" || t.status === "paid");
  const hasRevolving = active.some((t) => t.kind === "revolving");
  const hasInstallment = active.some((t) => t.kind === "installment");
  const types = new Set(active.map((t) => t.type)).size;
  let value = (hasRevolving ? S.mixRevolving : 0) + (hasInstallment ? S.mixInstallment : 0);
  value += S.mixExtraType * Math.min(2, Math.max(0, types - 2));
  return { value: clamp(value, 0, 1), hasRevolving, hasInstallment, types };
}

function newCreditFactor(report) {
  const inquiries = report.inquiries.filter((q) => q.counts).length;
  const newAccounts = report.tradelines.filter((t) => t.owner !== "authorized" && t.ageMonths < S.newAccountMonths).length;
  const inq = S.inquiryCurve[Math.min(inquiries, S.inquiryCurve.length - 1)];
  const acct = Math.max(0.4, 1 - S.newAccountPenalty * Math.max(0, newAccounts - 1));
  return { value: 0.6 * inq + 0.4 * acct, inquiries, newAccounts };
}

export function computeScore(report) {
  const factors = {
    payment: paymentFactor(report),
    owed: owedFactor(report),
    length: lengthFactor(report),
    mix: mixFactor(report),
    newCredit: newCreditFactor(report),
  };
  const monthsNeeded = Math.max(0, S.minHistoryMonths - report.reportedMonths);
  if (monthsNeeded > 0) return { score: null, factors, monthsNeeded };
  let total = 0;
  for (const [k, w] of Object.entries(S.weights)) total += w * factors[k].value;
  const score = Math.round(clamp(S.min + (S.max - S.min) * total, S.min, S.max));
  return { score, factors, monthsNeeded: 0 };
}

// ---------- plain-language reasons ----------

function reason(factor, up, before, after) {
  switch (factor) {
    case "owed":
      if (before.utilization != null && after.utilization != null && Math.abs(after.utilization - before.utilization) >= 0.01) {
        return `your utilization ${after.utilization < before.utilization ? "dropped" : "rose"} from ${pct(before.utilization)} to ${pct(after.utilization)}`;
      }
      if (after.utilization != null && before.utilization == null) return `you now use ${pct(after.utilization)} of your credit limit`;
      return up ? "you paid down what you owe" : "you owe more than before";
    case "payment": {
      const late = after.latestLate;
      if (!up && late && (!before.latestLate || late.month !== before.latestLate.month || late.code !== before.latestLate.code)) {
        return late.code === "CO" ? `${late.name} went to collections` : `${late.name} was reported ${late.code} days late`;
      }
      if (!up && (after.freshStarts || 0) > (before.freshStarts || 0)) return "you went broke and needed a fresh start";
      if (!up && after.openCollections > before.openCollections) return "an account went to collections";
      if (up && after.paidCollections > before.paidCollections) return "you paid off a collection";
      return up ? (after.lateEpisodes || after.freshStarts ? "your old marks are getting older" : "you added another month of on-time payments") : "your payment record got worse";
    }
    case "length":
      if (!up && after.oldestMonths < before.oldestMonths) return "your oldest account is no longer counted";
      return up ? "your accounts got older" : "a new account lowered your average account age";
    case "mix":
      return up ? "you added a new kind of credit" : "you have fewer kinds of credit now";
    case "newCredit":
      if (after.inquiries > before.inquiries) return `you now have ${after.inquiries} hard inquir${after.inquiries === 1 ? "y" : "ies"} in the last 12 months`;
      if (after.inquiries < before.inquiries) return "an old hard inquiry stopped counting";
      if (after.newAccounts > before.newAccounts) return "you opened a new account";
      return up ? "your new accounts are not new anymore" : "you have more new credit than before";
    default:
      return "your report changed";
  }
}

// prev and next are { score, factors }. Returns { delta, factor, message }.
export function explainChange(prev, next) {
  if (next.score == null) {
    const n = next.monthsNeeded ?? 0;
    return { delta: 0, factor: null, message: `No score yet. You need ${n} more month${n === 1 ? "" : "s"} of credit history.` };
  }
  if (prev.score == null || !prev.factors) {
    return { delta: 0, factor: null, first: true, message: `You have a credit score for the first time: ${next.score}.` };
  }
  const delta = next.score - prev.score;
  const range = S.max - S.min;
  if (delta === 0) {
    return { delta: 0, factor: null, message: `Score held steady at ${next.score}. Nothing on your report changed much.` };
  }
  // The factor that moved the most in the same direction as the score.
  const moves = Object.entries(S.weights).map(([k, w]) => ({ factor: k, move: w * (next.factors[k].value - prev.factors[k].value) * range }));
  const sameWay = moves.filter((m) => Math.sign(m.move) === Math.sign(delta));
  const best = (sameWay.length ? sameWay : moves).reduce((a, b) => (Math.abs(b.move) > Math.abs(a.move) ? b : a));
  const why = reason(best.factor, best.move > 0, prev.factors[best.factor], next.factors[best.factor]);
  return { delta, factor: best.factor, message: `Score ${delta > 0 ? "+" : ""}${delta}: ${why}.` };
}
