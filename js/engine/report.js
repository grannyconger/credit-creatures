// The credit bureau's view of the creature (SPEC §14 My Credit Report).
import { CONFIG } from "../data/config.js";
import { amountOwed } from "./accounts.js";
import { computeScore } from "./score.js";

export function buildReport(life) {
  const tradelines = life.accounts
    .filter((a) => a.reported)
    .map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      kind: a.kind,
      owner: a.owner,
      status: a.status,
      openedMonth: a.openedMonth,
      closedMonth: a.closedMonth,
      ageMonths: life.month - a.openedMonth,
      limit: a.limit ?? null,
      balance: amountOwed(a),
      original: a.original ?? null,
      monthsDelinquent: a.monthsDelinquent,
      history: a.history.map((h) => ({ ...h })),
    }));

  const months = new Set();
  for (const t of tradelines) for (const h of t.history) months.add(h.month);

  const since = life.month - CONFIG.credit.inquiryCountsMonths;
  const inquiries = life.inquiries
    .filter((q) => q.hard)
    .map((q) => ({ month: q.month, source: q.source, counts: q.month > since }));

  const collections = tradelines
    .filter((t) => t.status === "collections" || t.status === "collectionPaid")
    .map((t) => ({ id: t.id, name: t.name, balance: t.balance, paid: t.status === "collectionPaid" }));

  // A fresh start after going broke (js/engine/arcade.js) stays on the report like a bankruptcy.
  const publicRecords = (life.marks || []).map((m) => ({ type: m.type, month: m.month }));

  return { month: life.month, tradelines, inquiries, collections, publicRecords, reportedMonths: months.size };
}

// The last 24 months as a grid row per account, oldest first.
export function paymentGrid(report) {
  const n = CONFIG.credit.reportGridMonths;
  const start = report.month - n;
  return report.tradelines.map((t) => {
    const byMonth = new Map(t.history.map((h) => [h.month, h.code]));
    const cells = [];
    for (let m = start; m < report.month; m++) cells.push(byMonth.get(m) || null);
    return { id: t.id, name: t.name, cells };
  });
}

const HELPING = {
  payment: "You pay on time.",
  owed: "You use only a small part of your credit limits.",
  length: "Your accounts have been open a good while.",
  mix: "You handle more than one kind of credit.",
  newCredit: "You have not applied for much new credit lately.",
};

const HURTING = {
  payment: "Late payments or collections are on your report.",
  owed: "You are using a big part of your credit limits.",
  length: "Your credit history is still short.",
  mix: "You only have one kind of credit.",
  newCredit: "You applied for a lot of credit recently.",
};

// Full report with score and "helping you / hurting you" callouts.
export function creditReport(life) {
  const report = buildReport(life);
  const result = computeScore(report);
  const helping = [];
  const hurting = [];
  if (result.factors) {
    for (const [k, f] of Object.entries(result.factors)) {
      if (f.value >= 0.85) helping.push({ factor: k, text: HELPING[k] });
      else if (f.value < 0.6) hurting.push({ factor: k, text: HURTING[k] });
    }
  }
  return { ...report, score: result.score, factors: result.factors, grid: paymentGrid(report), helping, hurting };
}
