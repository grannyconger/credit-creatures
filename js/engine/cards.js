// Runs life events and Decision cards from the data files (SPEC §8, §13).
// Cards never change the life directly. Each choice is a list of steps, and
// each step is a logged engine action, so replay rebuilds card results too.
import { CONFIG } from "../data/config.js";
import { ACTIONS } from "./actions.js";
import { createRng } from "./rng.js";
import { amountOwed, isOpen, isRevolving } from "./accounts.js";
import { money, dollars } from "./util.js";

// steps = [["actionName", ...args], ...]. All or nothing, except a step that
// fails but still leaves a mark (a denied loan keeps its hard inquiry and stops there).
export function runSteps(life, steps) {
  let cur = life;
  const results = [];
  for (const [name, ...args] of steps) {
    const fn = ACTIONS[name];
    if (!fn) throw new Error(`Cards can't run the action "${name}".`);
    const r = fn(cur, ...args);
    results.push(r);
    if (!r.ok) {
      // Steps after a denial don't run (no car means no gas bill).
      if (r.life !== cur) return { life: r.life, ok: true, denied: true, results, message: r.message };
      return { life, ok: false, results, message: r.message };
    }
    cur = r.life;
  }
  return { life: cur, ok: true, results, message: results.map((r) => r.message).join(" ") };
}

export function ownCards(life) {
  return life.accounts.filter((a) => isRevolving(a) && a.owner === "self" && isOpen(a));
}

export function utilization(life) {
  const cards = ownCards(life);
  const limit = cards.reduce((s, a) => s + a.limit, 0);
  if (!limit) return null;
  return cards.reduce((s, a) => s + amountOwed(a), 0) / limit;
}

// The "Pay with" picker: every way to pay, with the live numbers behind each one.
export function paymentOptions(life, { amount, methods = ["debit", "card", "bnpl"] }) {
  const out = [];
  if (methods.includes("debit")) {
    const ok = amount <= life.checking;
    out.push({
      method: "debit",
      kind: "debit",
      ok,
      before: life.checking,
      after: money(life.checking - amount),
      reason: ok ? "" : `Declined. Only ${dollars(life.checking)} in checking.`,
    });
  }
  if (methods.includes("card")) {
    for (const a of ownCards(life)) {
      const owed = amountOwed(a);
      const available = money(a.limit - owed);
      const ok = amount <= available;
      out.push({
        method: `card:${a.id}`,
        kind: "card",
        accountId: a.id,
        ok,
        available,
        utilBefore: owed / a.limit,
        utilAfter: (owed + amount) / a.limit,
        reason: ok ? "" : `Declined. Only ${dollars(available)} of credit left.`,
      });
    }
  }
  if (methods.includes("bnpl")) {
    const first = money(amount * CONFIG.bnpl.schedule[0]);
    const ok = first <= life.checking;
    out.push({
      method: "bnpl",
      kind: "bnpl",
      ok,
      first,
      later: CONFIG.bnpl.schedule.slice(1).map((s) => money(amount * s)),
      reason: ok ? "" : `Declined. The first ${dollars(first)} comes from checking today.`,
    });
  }
  return out;
}

export function paymentStep(method, { amount, item, merchant = "Pay-in-4" }) {
  if (method === "debit") return ["debitPurchase", amount, item];
  if (method === "bnpl") return ["buyWithBnpl", amount, item, merchant];
  if (method?.startsWith("card:")) return ["cardPurchase", method.slice(5), amount, item];
  throw new Error(`Unknown payment method "${method}".`);
}

// choice = { cost?: { amount, item }, steps?: [...] }. method picks how the cost is paid.
export function resolveChoice(life, choice, method = null) {
  const steps = [];
  if (choice.cost) steps.push(paymentStep(method, choice.cost));
  steps.push(...(choice.steps || []));
  if (!steps.length) return { life, ok: true, results: [], message: "" };
  return runSteps(life, steps);
}

function available(card, ctx) {
  if ((card.minChapter || 2) > ctx.chapter) return false;
  if (card.maxChapter && card.maxChapter < ctx.chapter) return false;
  if (card.once !== false && ctx.seen.includes(card.id)) return false;
  return true;
}

function weightedPick(rng, pool) {
  const total = pool.reduce((s, c) => s + (c.weight ?? 1), 0);
  let r = rng.next() * total;
  for (const c of pool) {
    r -= c.weight ?? 1;
    if (r < 0) return c;
  }
  return pool[pool.length - 1];
}

// ctx = { chapter, seen }. The same month always draws the same event.
export function drawLifeEvent(life, events, ctx) {
  const rng = createRng(`${life.seed}:life:${life.month}`);
  const pool = events.filter((e) => available(e, ctx) && (!e.fits || e.fits(life, ctx)));
  if (!pool.length) return null;
  const e = weightedPick(rng, pool);
  const amount = e.amount ? Math.round(rng.int(...e.amount) / 5) * 5 : 0;
  return { id: e.id, amount };
}

// Cards with a priority come first (a must-see moment). Then a weighted draw
// of one-time cards and everyday (repeatable) cards, each with its own cap.
export function drawDecisionCards(life, scenarios, ctx, count = CONFIG.pacing.decisionCardsPerMonth) {
  const rng = createRng(`${life.seed}:deck:${life.month}`);
  const pool = scenarios.filter((s) => available(s, ctx) && s.fits(life, ctx));
  const picked = pool.filter((s) => s.priority).sort((a, b) => b.priority - a.priority).slice(0, count);
  const draw = (list, cap) => {
    let rest = list.filter((s) => !s.priority);
    for (let n = 0; n < cap && picked.length < count && rest.length; n++) {
      const s = weightedPick(rng, rest);
      picked.push(s);
      rest = rest.filter((x) => x !== s);
    }
  };
  draw(pool.filter((s) => s.once !== false), CONFIG.pacing.newCardsPerMonth);
  draw(pool.filter((s) => s.once === false), CONFIG.pacing.everydayCardsPerMonth);
  return picked.map((s) => s.id);
}

// What comes out of checking on its own at End Month, so students can see
// whether their balance covers it. Card minimums without AutoPay are listed
// apart, because nothing pays them unless the student does.
export function upcomingPayments(life) {
  const auto = [];
  const cardsDue = [];
  for (const a of ownCards(life)) {
    if (!a.due || a.due.minDue <= 0) continue;
    const minLeft = money(Math.max(0, a.due.minDue - a.paidThisCycle));
    if (a.autopay) {
      const target = a.autopay === "full" ? a.due.statementBalance : a.autopay === "min" ? a.due.minDue : Math.max(Number(a.autopay), a.due.minDue);
      const need = money(Math.min(amountOwed(a), Math.max(0, target - a.paidThisCycle)));
      if (need > 0) auto.push({ name: `AutoPay: ${a.name}`, amount: need, accountId: a.id });
    } else if (minLeft > 0) {
      cardsDue.push({ name: a.name, amount: minLeft, accountId: a.id });
    }
  }
  for (const b of life.bills) if (b.startsMonth == null || life.month >= b.startsMonth) auto.push({ name: b.name, amount: b.amount, monthsLeft: b.monthsLeft ?? null });
  for (const a of life.accounts) {
    if (a.owner !== "self" || a.status !== "open") continue;
    if (a.kind === "installment" && a.firstDueMonth != null && life.month >= a.firstDueMonth) {
      const need = money(Math.max(0, Math.min(a.payment, a.balance) + a.pastDue - a.paidThisCycle));
      if (need > 0) auto.push({ name: a.name, amount: need, accountId: a.id });
    }
    if (a.kind === "bnpl") {
      const need = money(a.installments.filter((i) => i.dueMonth <= life.month).reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0));
      if (need > 0) auto.push({ name: a.name, amount: need, accountId: a.id });
    }
  }
  const total = money(auto.reduce((s, x) => s + x.amount, 0));
  return { auto, cardsDue, total, short: money(Math.max(0, total - life.checking)) };
}
