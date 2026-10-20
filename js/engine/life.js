// The creature's financial life. Plain data only, so it saves to Firestore
// as-is and replays exactly from the same seed.
import { seedFrom } from "./rng.js";
import { CONFIG } from "../data/config.js";

export const LIFE_VERSION = 1;

export function createLife({ seed = 1, name = "", ageMonths = 18 * 12, inSchool = false } = {}) {
  return {
    version: LIFE_VERSION,
    // How this life began. With the log, it rebuilds the whole life (replay.js).
    start: { seed: String(seed), name, ageMonths, inSchool },
    seed: String(seed),
    rng: seedFrom(seed),
    name,
    month: 0,
    ageMonths,
    checking: 0,
    savings: 0,
    heldSavings: 0, // locked by a credit-builder loan
    incomeThisMonth: 0,
    incomeHistory: [],
    inSchool,
    leftSchoolMonth: null,
    teenDebit: false,
    bills: [],
    accounts: [],
    inquiries: [],
    nextId: 1,
    score: null,
    factors: null,
    scoreHistory: [],
    log: [],
  };
}

// Engine actions never change the life they are given. They work on a copy.
// Append-only lists (log, history, statements, inquiries, scoreHistory) share
// their entries, so those entries must never be edited after they are pushed.
export function copyLife(life) {
  return {
    ...life,
    incomeHistory: life.incomeHistory.slice(),
    bills: life.bills.map((b) => ({ ...b })),
    inquiries: life.inquiries.slice(),
    scoreHistory: life.scoreHistory.slice(),
    log: life.log.slice(),
    accounts: life.accounts.map(copyAccount),
  };
}

function copyAccount(a) {
  const c = { ...a, history: a.history.slice() };
  if (a.pending) c.pending = a.pending.map((p) => ({ ...p }));
  if (a.installments) c.installments = a.installments.map((i) => ({ ...i }));
  if (a.statements) c.statements = a.statements.slice();
  if (a.due) c.due = { ...a.due };
  return c;
}

// args are the exact arguments the action got after `life`, so replay.js can
// call it again. details are extras for people reading the log.
export function logAction(life, action, args, details = {}) {
  life.log.push({ month: life.month, action, args, ...details });
}

export function monthlyIncome(life) {
  const h = life.incomeHistory.slice(-CONFIG.credit.incomeMonthsAveraged);
  if (h.length === 0) return life.incomeThisMonth;
  return h.reduce((a, b) => a + b, 0) / h.length;
}

export function findAccount(life, id) {
  return life.accounts.find((a) => a.id === id) || null;
}

export function hardInquiriesInWindow(life) {
  const since = life.month - CONFIG.credit.inquiryCountsMonths;
  return life.inquiries.filter((q) => q.hard && q.month > since).length;
}
