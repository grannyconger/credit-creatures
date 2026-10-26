// Score Chase's rules (GAME-SPECS.md game 7). Pure and seeded.
// The sandbox keeps its own little set of accounts, builds a credit report from
// them at each month's end, and scores it with the game's real score engine
// (computeScore and explainChange), so factor names, weights and wording match
// My Score exactly. A change made this month reports next month.
import { CONFIG } from "../data/config.js";
import { createRng, computeScore, explainChange, FACTOR_LABELS } from "../engine/index.js";
import { SC_SETUP, SC_START, SC_PAY, SC_COSIGN_BITE, SC_CARDS, SC_SURPRISES } from "../data/arcade/scorechase.js";

const C = () => CONFIG.arcade.games.scorechase;
const r2 = (x) => Math.round(x * 100) / 100;
export const MONTHS = 18;
export { FACTOR_LABELS };

export function newShift(seed) {
  const rng = createRng(`${seed}:deal`);
  const n = rng.int(3, 5);
  const months = [];
  while (months.length < n) {
    const m = rng.int(3, 17);
    if (!months.includes(m)) months.push(m);
  }
  return { seed: String(seed), surpriseMonths: months.sort((a, b) => a - b), cosignDelay: rng.int(4, 8) };
}

export function newState(deal) {
  const c = C();
  return {
    deal,
    month: 0,
    cash: c.startCash,
    autopay: null,
    accounts: [],
    nextId: 1,
    inquiries: [],
    collections: [],
    pendingCollections: [],
    cosign: null,
    used: [],
    queue: [SC_SETUP],
    late: false,
    payChoice: null,
    pending: new Set(),
    reported: null,
    result: null,
    history: [],
    log: [],
    decisions: [],
    fees: [],
    lates: [],
    done: false,
    scam: false,
  };
}

// ---------- Helpers ----------

const own = (s) => s.accounts.filter((a) => a.owner === "self" && a.status === "open");
const ownCards = (s) => own(s).filter((a) => a.kind === "revolving");
export const mainCard = (s) => ownCards(s).sort((a, b) => a.opened - b.opened)[0] || null;

const NEEDS = {
  revolving: (s) => ownCards(s).length > 0,
  ownCard: (s) => ownCards(s).length > 0,
  twoCards: (s) => ownCards(s).length >= 2,
  secured: (s) => ownCards(s).some((a) => a.type === "secured" && s.month - a.opened >= 7),
  au: (s) => s.accounts.some((a) => a.owner === "authorized" && a.status === "open"),
  hadLate: (s) => s.lates.length > 0,
  minAutopay: (s) => s.autopay === "min" && ownCards(s).length > 0,
  autopayOn: (s) => s.autopay !== "off" && ownCards(s).length > 0,
};
const fits = (s, card) => !card.needs || NEEDS[card.needs](s);

// The cards for the current month, in order: the cosign bite, a surprise, the
// month's card, then the pay card when autopay is off.
function dealMonth(s) {
  const m = s.month;
  const q = [];
  if (m === 1) q.push(SC_START);
  else if (m >= 2) {
    if (s.cosign && !s.cosign.bit && m >= s.cosign.bite) q.push(SC_COSIGN_BITE);
    if (s.deal.surpriseMonths.includes(m)) {
      const rng = createRng(`${s.deal.seed}:sur:${m}`);
      const pool = SC_SURPRISES.filter((c) => !s.used.includes(c.id) && fits(s, c));
      if (pool.length) q.push(pool[Math.floor(rng.next() * pool.length)]);
    }
    const rng = createRng(`${s.deal.seed}:m:${m}`);
    const pool = SC_CARDS.filter((c) => !s.used.includes(c.id) && c.from <= m && fits(s, c));
    if (pool.length) q.push(pool[Math.floor(rng.next() * pool.length)]);
  }
  if (m >= 1 && s.autopay === "off" && ownCards(s).length) q.push(SC_PAY);
  s.queue = q;
}

export const current = (s) => s.queue[0] || null;

// ---------- Choosing ----------

// index: the choice picked, or null when a timed card ran out.
export function choose(s, index) {
  const card = current(s);
  if (!card) return null;
  s.queue.shift();
  if (card.id !== "pay") s.used.push(card.id);
  const idx = index ?? card.ignore;
  const choice = idx == null ? null : card.choices[idx];
  const effects = choice ? choice.effects : card.ignoreEffects || {};
  const timedOut = index == null;
  const rng = createRng(`${s.deal.seed}:fx:${s.month}:${card.id}`);
  const out = { card, choice, timedOut, text: choice ? choice.text : card.ignoreText, extra: null, mistakes: [] };
  applyEffects(s, effects, rng, out);
  if (card.id === "cosignBite") s.cosign.bit = true;
  s.decisions.push({ month: s.month, card: card.id, title: card.title, choice: choice ? choice.label : "ran out of time", good: Boolean(choice?.good), timedOut });
  return out;
}

function applyEffects(s, fx, rng, out) {
  const c = C();
  if (fx.autopay) s.autopay = fx.autopay;
  if (fx.pay) s.payChoice = fx.pay;
  if (fx.cash) s.cash = r2(s.cash + fx.cash);
  if (fx.cash === -199) {
    s.scam = true;
    out.mistakes.push({ type: "scam", cost: c.scamCost, label: "Paid the credit repair scam" });
  }
  if (fx.open) {
    const o = fx.open;
    if (o.deposit) s.cash = r2(s.cash - o.deposit);
    s.accounts.push({ id: `a${s.nextId++}`, name: o.name, type: o.type, kind: o.kind || "revolving", owner: o.owner || "self", opened: s.month, limit: o.limit ?? null, carried: o.carry ?? 0, spend: 0, status: "open", late: [], original: o.original ?? null, balance: o.original ?? 0, deposit: o.deposit || 0, monthly: 0 });
    s.pending.add(o.kind === "installment" ? "mix" : "length");
    s.pending.add("newCredit");
    if (o.owner !== "authorized") s.pending.add("owed");
  }
  if (fx.inquiry) {
    s.inquiries.push(s.month);
    s.pending.add("newCredit");
  }
  const card = mainCard(s);
  if (fx.spend && card) {
    card.spend += fx.spend;
    s.pending.add("owed");
  }
  if (fx.monthly && card) card.monthly += fx.monthly;
  if (fx.payDown && card) {
    card.carried = Math.max(0, r2(card.carried - fx.payDown));
    s.cash = r2(s.cash - fx.payDown);
    s.pending.add("owed");
  }
  if (fx.limitUp && card) {
    card.limit += fx.limitUp;
    s.pending.add("owed");
  }
  if (fx.close) {
    const old = ownCards(s).sort((a, b) => a.opened - b.opened)[0];
    if (old) {
      old.status = "closed";
      old.closedMonth = s.month;
      s.cash = r2(s.cash + (old.deposit || 0));
      s.pending.add("length");
      s.pending.add("owed");
    }
  }
  if (fx.upgrade) {
    const sec = ownCards(s).find((a) => a.type === "secured");
    if (sec) {
      sec.type = "student";
      sec.name = "Coinhaven Card";
      sec.limit = Math.max(sec.limit, 500);
      s.cash = r2(s.cash + sec.deposit);
      sec.deposit = 0;
      s.pending.add("owed");
    }
  }
  if (fx.cosign) {
    s.accounts.push({ id: `a${s.nextId++}`, name: "Jordan's car loan (you cosigned)", type: "autoLoan", kind: "installment", owner: "cosigned", opened: s.month, limit: null, carried: 0, spend: 0, status: "open", late: [], original: fx.cosign, balance: fx.cosign, monthly: 0 });
    s.cosign = { month: s.month, bite: s.month + s.deal.cosignDelay, bit: false };
    s.pending.add("mix");
  }
  if (fx.cosignLate) {
    const loan = s.accounts.find((a) => a.owner === "cosigned");
    if (loan) loan.lateNow = true;
  }
  if (fx.late) markLate(s, out);
  if (fx.collectionIn) s.pendingCollections.push({ month: s.month + fx.collectionIn[0], amount: fx.collectionIn[1], name: fx.collectionIn[1] === 180 ? "Urgent care bill" : "Phone plan in your name" });
  if (fx.payCollection) for (const col of s.collections) col.paid = true;
  if (fx.removeAu) {
    const au = s.accounts.find((a) => a.owner === "authorized" && a.status === "open");
    if (au) {
      au.status = "removed";
      s.pending.add("length");
    }
  }
  if (fx.auLate) {
    const au = s.accounts.find((a) => a.owner === "authorized" && a.status === "open");
    if (au) {
      au.lateNow = true;
      s.pending.add("payment");
    }
  }
  if (fx.goodwill && s.lates.length) {
    if (rng.next() < C().goodwillOdds) {
      const last = s.lates.pop();
      for (const a of s.accounts) a.late = a.late.filter((m) => m !== last);
      out.extra = "They said yes. The late mark is gone.";
      s.pending.add("payment");
    } else out.extra = "They said no this time.";
  }
  if (fx.chance && rng.next() < fx.chance[0]) {
    applyEffects(s, fx.chance[1], rng, out);
    out.extra = fx.chance[2];
  }
}

function markLate(s, out) {
  const c = C();
  if (s.late) return;
  s.late = true;
  s.pending.add("payment");
  s.cash = r2(s.cash - c.lateFee);
  s.fees.push({ month: s.month, amount: c.lateFee });
  out?.mistakes.push({ type: "late", cost: c.lateFee, label: "Late payment fee" });
}

// ---------- The month's end ----------

// Closes the month: statements, payments, history, then the new report. The
// score it makes shows next month. Returns { report, mistakes, notes }.
export function endMonth(s) {
  const c = C();
  const m = s.month;
  const notes = [];
  const mistakes = [];
  if (m >= 1) {
    for (const a of ownCards(s)) {
      a.spend += c.baseSpend + a.monthly;
      const statement = r2(a.carried + a.spend);
      a.reportBalance = Math.min(statement, a.limit * 1.1);
      let pay = 0;
      const mode = s.autopay === "off" ? s.payChoice : s.autopay;
      const minDue = Math.min(statement, Math.max(c.minPay, Math.round(statement * 0.02)));
      if (mode === "full") pay = statement;
      else if (mode === "min") pay = minDue;
      if (statement > 0 && !mode) {
        if (!s.late) {
          const out = { mistakes: [] };
          markLate(s, out);
          mistakes.push(...out.mistakes);
        }
        pay = 0;
      }
      // Autopay that bounces because cash can't cover even the minimum is a late payment.
      if (statement > 0 && mode && s.cash < minDue && !s.late) {
        const out = { mistakes: [] };
        markLate(s, out);
        mistakes.push(...out.mistakes);
        notes.push("Autopay bounced: not enough cash for even the minimum. That's a late payment.");
      }
      if (s.late && statement > 0) pay = 0;
      pay = Math.min(pay, Math.max(0, s.cash));
      s.cash = r2(s.cash - pay);
      const left = r2(statement - pay);
      a.carried = left > 0 ? r2(left * (1 + c.apr / 12)) : 0;
      a.spend = 0;
      a.late.push(...(s.late && statement > 0 ? [m] : []));
    }
    for (const a of s.accounts.filter((x) => x.status === "open" && x.kind === "installment" && x.owner !== "authorized")) {
      if (a.lateNow) a.late.push(m);
      a.lateNow = false;
      a.balance = Math.max(0, r2(a.balance - a.original / (a.type === "creditBuilder" ? 12 : 24)));
    }
    for (const a of s.accounts.filter((x) => x.owner === "authorized" && x.status === "open")) {
      if (a.lateNow) a.late.push(m);
      a.lateNow = false;
    }
    if (s.late) s.lates.push(m);
    for (const p of s.pendingCollections.filter((x) => x.month <= m && !x.sent)) {
      p.sent = true;
      s.collections.push({ name: p.name, amount: p.amount, month: m, paid: false });
      s.pending.add("payment");
      notes.push(`${p.name} went to collections. From: the bill you set aside.`);
      mistakes.push({ type: "collections", cost: p.amount, label: `${p.name} in collections` });
    }
    s.cash = r2(s.cash + c.income);
  }
  s.late = false;
  s.payChoice = null;
  const prev = s.result;
  const report = buildReport(s);
  const result = computeScore(report);
  s.reportedNext = { report, result, prev, pending: [...s.pending] };
  s.pending = new Set();
  return { mistakes, notes };
}

// Starts the next month: last month's report becomes what the bureau shows.
// Returns the score change callout (or null) for the echo.
export function startMonth(s) {
  let change = null;
  if (s.reportedNext) {
    const { report, result, prev } = s.reportedNext;
    s.reported = report;
    s.result = result;
    if (prev) {
      const ex = explainChange(prev, result);
      // It shows in the next month, caused by what happened this month.
      if (ex.delta) change = { delta: ex.delta, factor: ex.factor, cause: s.month, text: `${ex.delta > 0 ? "+" : ""}${ex.delta}, ${FACTOR_LABELS[ex.factor]}: ${ex.message.replace(/^Score [+-]?\d+: /, "").replace(/\.$/, "")}. From: month ${s.month}.` };
      else if (ex.first) change = { delta: 0, factor: null, cause: s.month, text: ex.message };
    }
    s.reportedNext = null;
  }
  s.history.push({ month: s.month, score: s.result?.score ?? null });
  if (change) s.log.push({ month: Math.min(MONTHS, s.month + 1), ...change });
  if (s.month >= MONTHS) {
    s.done = true;
    s.queue = [];
    return change;
  }
  s.month++;
  dealMonth(s);
  return change;
}

// The report the bureau would print, built from the sandbox's accounts.
export function buildReport(s) {
  const month = s.month + 1;
  const tradelines = s.accounts
    .filter((a) => a.status !== "removed" && month - a.opened > 0)
    .map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      kind: a.kind,
      owner: a.owner === "cosigned" ? "cosigned" : a.owner,
      status: a.status === "closed" ? "closed" : "open",
      openedMonth: a.opened,
      ageMonths: month - a.opened,
      limit: a.limit,
      balance: a.kind === "revolving" ? (a.owner === "authorized" ? a.carried : a.reportBalance ?? 0) : a.balance,
      original: a.original,
      history: Array.from({ length: Math.min(month, a.closedMonth ?? month) - a.opened }, (_, k) => ({ month: a.opened + k, code: a.late.includes(a.opened + k) ? "30" : "OK" })),
    }));
  const months = new Set(tradelines.flatMap((t) => t.history.map((h) => h.month)));
  return {
    month,
    tradelines,
    inquiries: s.inquiries.map((q) => ({ month: q, source: "application", counts: q > month - 1 - CONFIG.credit.inquiryCountsMonths })),
    collections: s.collections.map((c) => ({ name: c.name, balance: c.paid ? 0 : c.amount, paid: c.paid })),
    publicRecords: [],
    reportedMonths: months.size,
  };
}

// The utilization the bars show, from the reported report.
export function utilization(s) {
  return s.result?.factors?.owed?.utilization ?? null;
}

// ---------- Scoring ----------

// Ranked metric: the final score (0 if there's no score). Pay points =
// final - 300, + 100 at 700 or more, + cash / 10.
export function score(s) {
  const c = C();
  const final = s.result?.score ?? null;
  const points = (final ? final - 300 + (final >= c.goal ? c.goalBonus : 0) : 0) + Math.floor(Math.max(0, s.cash) / 10);
  return { final, metric: final ?? 0, points: Math.round(points), cash: s.cash, reached: final != null && final >= c.goal, lates: s.lates.length, collections: s.collections.length };
}

// The biggest decision (2.7): the choice with the largest score impact. A
// change in month m comes from the choices of month m - 1.
export function biggest(s) {
  const worst = s.log.filter((l) => l.delta).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  if (worst) {
    const d = s.decisions.filter((x) => x.month === worst.cause).sort((a, b) => Number(a.good) - Number(b.good))[0];
    if (d) return { text: `"${d.choice}" (${d.title}, month ${d.month})` };
  }
  const start = s.decisions.find((d) => d.card === "start");
  return { text: start ? `how you started: "${start.choice}"` : "how you started your credit" };
}

// ---------- Bots ----------

export function play(seed, pick) {
  const s = newState(newShift(seed));
  while (!s.done) {
    while (current(s)) choose(s, pick(current(s), s));
    endMonth(s);
    startMonth(s);
  }
  return s;
}

const OFFER_KEYS = ["open", "cosign", "limitUp", "upgrade", "inquiry", "spend"];
const isOffer = (ch) => OFFER_KEYS.some((k) => k in ch.effects) || (ch.effects.cash ?? 0) < 0;
export const thoughtfulPick = (card) => Math.max(0, card.choices.findIndex((c) => c.good));
export const declinePick = (card) => {
  const i = card.choices.findIndex((c) => !isOffer(c));
  return i >= 0 ? i : card.choices.length - 1;
};
export const acceptPick = (card) => {
  const i = card.choices.findIndex((c) => isOffer(c));
  return i >= 0 ? i : 0;
};
