// Bill Drop's rules (GAME-SPECS.md game 3). Pure and seeded: the same seed deals
// the same month, chaos and all. The UI calls these and draws the state.
//
// A day runs in this order: money in (paychecks, extra shifts, chaos income),
// chaos costs, then payments (scheduled days and autopays on due dates). At the
// end of the day a balance below $0 costs an overdraft fee for each payment that
// posted that day, and a bill still unpaid on its due date gets a late fee.
import { CONFIG } from "../data/config.js";
import { createRng } from "../engine/index.js";
import { BILL_COMPANIES, BILL_SETS, BILL_CHAOS, TYPE_LABEL } from "../data/arcade/billdrop.js";

const C = () => CONFIG.arcade.games.billdrop;
const r2 = (x) => Math.round(x * 100) / 100;
export const DAYS = 30;

// ---------- Dealing a month ----------

function deal(seed, difficulty) {
  const rng = createRng(seed);
  const c = C();
  const start = rng.int(c.start[0] / 10, c.start[1] / 10) * 10;
  const payDays = c.payDays[rng.int(0, c.payDays.length - 1)];
  const paychecks = payDays.map((day) => ({ day, amount: rng.int(c.paycheck[0] / 10, c.paycheck[1] / 10) * 10 }));
  const bills = BILL_SETS[difficulty].map((type, i) => {
    const pool = BILL_COMPANIES.filter((b) => b.type === type);
    const co = pool[rng.int(0, pool.length - 1)];
    const due = rng.int(co.due[0], co.due[1]);
    const amount = rng.int(co.amount[0], co.amount[1]);
    const arrive = Math.max(1, due - rng.int(3, 10));
    return { id: `b${i}`, company: co.name, coId: co.id, type, channel: co.channel, amount, due, arrive, movable: Boolean(co.movable), cancelable: Boolean(co.cancelable), minimum: co.minimum || null, lateFee: type === "rent" ? c.lateFee.rent : rng.int(c.lateFee.other[0], c.lateFee.other[1]) };
  });
  const forgotten = c.forgotten[difficulty];
  // Forgotten autopays: bills set up long ago that never send a notice.
  const candidates = bills.filter((b) => !["rent", "card"].includes(b.type));
  for (let k = 0; k < forgotten && candidates.length; k++) {
    const b = candidates.splice(rng.int(0, candidates.length - 1), 1)[0];
    b.forgotten = true;
  }
  const nChaos = rng.int(c.chaos[0], c.chaos[1]);
  const pool = BILL_CHAOS.filter((x) => x.kind !== "electricUp" || bills.some((b) => b.type === "electric"));
  const chaos = [];
  const usedDays = new Set();
  const kinds = new Set();
  while (chaos.length < nChaos && pool.length) {
    const card = pool.splice(rng.int(0, pool.length - 1), 1)[0];
    if (kinds.has(card.kind) && card.kind !== "expense") continue;
    let day;
    if (card.kind === "latePay") day = paychecks[rng.int(0, 1)].day;
    else {
      do day = rng.int(3, 27);
      while (usedDays.has(day));
    }
    usedDays.add(day);
    kinds.add(card.kind);
    chaos.push({ ...card, day, amount: card.amount ? rng.int(card.amount[0], card.amount[1]) : 0 });
  }
  chaos.sort((a, b) => a.day - b.day);
  return { start, paychecks, bills, chaos, difficulty };
}

// ---------- A plan, run start to finish (for checking seeds and for bots) ----------

// plan(bill) returns { payDay, autopay, part: "min" | "full" } for logged bills.
// fixes: [{ kind: "move", billId } | { kind: "cancel", billId } | { kind: "shift", day }].
export function simulate(month, { plan, fixes = [], knowsAutopays = true, logged = () => true } = {}) {
  const s = newState(month);
  for (const f of fixes) applyFix(s, f.kind, f.billId ?? f.day, true);
  for (const b of s.bills) {
    if (b.forgotten && !knowsAutopays) continue;
    if (!logged(b)) continue;
    b.logged = true;
    Object.assign(b, plan(b, s));
  }
  while (s.day < DAYS) advance(s);
  return s;
}

// ---------- The live state ----------

export function newState(month) {
  const bills = month.bills.map((b) => ({ ...b, logged: false, seen: false, autopay: Boolean(b.forgotten), payDay: null, part: "full", paid: 0, paidDay: null, late: false, canceled: false }));
  return {
    month,
    difficulty: month.difficulty,
    day: 0,
    balance: month.start,
    balances: [],
    paychecks: month.paychecks.map((p) => ({ ...p })),
    chaos: month.chaos.map((c) => ({ ...c, done: false })),
    extra: [],
    bills,
    fees: [],
    echoes: [],
    fixesLeft: C().fixes,
    fixesUsed: [],
    checkedBank: false,
    closest: null,
    events: [],
  };
}

export function newMonth(seed, difficulty) {
  // The seed generator keeps difficulty in a band (1.6): the month must be
  // winnable with thoughtful play, paying every bill the day it arrives must
  // overdraft, and on Hard autopay-everything must stumble.
  for (let tryN = 0; tryN < 300; tryN++) {
    const m = deal(`${seed}:${tryN}`, difficulty);
    if (fair(m)) return m;
  }
  return deal(`${seed}:0`, difficulty);
}

function fair(m) {
  const best = thoughtful(m);
  if (best.fees.length || best.bills.some((b) => b.late)) return false;
  const end = best.balance;
  const band = C().endBand[m.difficulty];
  if (end < band[0] || end > band[1]) return false;
  if (!simulate(m, { plan: (b) => ({ payDay: b.arrive }) }).fees.some((f) => f.kind === "overdraft")) return false;
  if (m.difficulty === "hard") {
    const lazy = simulate(m, { plan: () => ({ autopay: true, part: "full" }), knowsAutopays: false });
    if (score(lazy).score >= score(best).score - 40) return false;
  }
  return true;
}

// The thoughtful plan: every bill on its due date, the card's minimum when
// paying it in full would overdraft, and fixes tried until the month clears.
export function thoughtful(m) {
  const due = (part) => (b) => ({ payDay: b.due, part: b.type === "card" ? part : "full" });
  let best = null;
  const tries = [[]];
  const movable = m.bills.filter((b) => b.movable);
  const cancel = m.bills.filter((b) => b.cancelable);
  for (const b of movable) tries.push([{ kind: "move", billId: b.id }]);
  for (const b of cancel) tries.push([{ kind: "cancel", billId: b.id }]);
  for (const a of movable) for (const b of movable) if (a.id < b.id) tries.push([{ kind: "move", billId: a.id }, { kind: "move", billId: b.id }]);
  for (const a of movable) for (const b of cancel) tries.push([{ kind: "move", billId: a.id }, { kind: "cancel", billId: b.id }]);
  for (const part of ["full", "min"]) {
    for (const fixes of tries) {
      const s = simulate(m, { plan: due(part), fixes });
      if (!best || score(s).score > score(best).score) best = s;
      if (!s.fees.length && part === "full") return s;
    }
  }
  return best;
}

// ---------- Actions ----------

export const billOf = (s, id) => s.bills.find((b) => b.id === id);

// Bills that have shown up and can be seen (forgotten autopays stay hidden
// until the bank app is checked or they draft).
export function arrived(s) {
  return s.bills.filter((b) => !b.forgotten && b.arrive <= Math.max(1, s.day) && !b.canceled);
}

export function logBill(s, id) {
  const b = billOf(s, id);
  if (!b || b.logged) return false;
  b.logged = true;
  b.seen = true;
  if (b.payDay == null && !b.autopay) b.payDay = null;
  return true;
}

// A pay day can't be in the past. Any day up to 30 is allowed (after the due
// date means late).
export function schedule(s, id, day) {
  const b = billOf(s, id);
  if (!b || b.paid || b.canceled) return false;
  b.payDay = Math.max(s.day + 1, Math.min(DAYS, day));
  b.autopay = false;
  return true;
}

export function setAutopay(s, id, on) {
  const b = billOf(s, id);
  if (!b || b.paid || b.canceled) return false;
  b.autopay = on;
  if (on) b.payDay = null;
  return true;
}

export function setPart(s, id, part) {
  const b = billOf(s, id);
  if (!b || b.type !== "card") return false;
  b.part = part;
  return true;
}

// The bank app shows every autopay, including forgotten ones. Once a shift.
export function checkBank(s) {
  if (s.checkedBank) return [];
  s.checkedBank = true;
  const found = s.bills.filter((b) => b.forgotten && !b.paid);
  for (const b of found) {
    b.logged = true;
    b.seen = true;
  }
  return found;
}

// kind: "move" a utility or phone due date 5 days later, "cancel" a
// subscription, or pick up an extra "shift" that pays a week later.
export function applyFix(s, kind, target, quiet = false) {
  if (s.fixesLeft <= 0) return { ok: false, message: "No fixes left this month." };
  const c = C();
  if (kind === "move") {
    const b = billOf(s, target);
    if (!b || !b.movable) return { ok: false, message: "Only utility and phone companies move due dates." };
    if (b.paid || b.due <= s.day) return { ok: false, message: "Too late to move this one." };
    b.due = Math.min(DAYS, b.due + c.moveDays);
    if (b.payDay != null && b.payDay < b.due) b.payDay = b.payDay;
  } else if (kind === "cancel") {
    const b = billOf(s, target);
    if (!b || !b.cancelable) return { ok: false, message: "Only subscriptions can be canceled." };
    if (b.paid) return { ok: false, message: "Already paid this month." };
    b.canceled = true;
  } else if (kind === "shift") {
    const day = Math.min(DAYS, Math.max(s.day, typeof target === "number" ? target : 0) + c.shiftDelay);
    if (day > DAYS) return { ok: false, message: "Too late in the month for an extra shift." };
    const rng = createRng(`${s.month.start}:${s.fixesLeft}:${s.day}:shift`);
    s.extra.push({ day, amount: rng.int(c.extraShift[0] / 10, c.extraShift[1] / 10) * 10 });
  } else return { ok: false, message: "Pick a fix." };
  s.fixesLeft--;
  s.fixesUsed.push({ kind, target, day: s.day });
  if (!quiet) s.events.push({ type: "fix", kind, day: s.day });
  return { ok: true };
}

// What a bill pays when it pays: the card's minimum or the full amount.
const payAmount = (b) => (b.type === "card" && b.part === "min" ? b.minimum : b.amount);

// Runs one day. Returns what happened, for the UI and its echo callouts.
export function advance(s) {
  if (s.day >= DAYS) return { done: true, happened: [] };
  s.day++;
  const d = s.day;
  const c = C();
  const happened = [];
  for (const p of s.paychecks) if (p.day === d) (s.balance = r2(s.balance + p.amount)), happened.push({ type: "pay", amount: p.amount, text: `Paycheck +$${p.amount}` });
  for (const x of s.extra) if (x.day === d) (s.balance = r2(s.balance + x.amount)), happened.push({ type: "pay", amount: x.amount, text: `Extra shift pay +$${x.amount}` });
  for (const ev of s.chaos) {
    if (ev.day !== d || ev.done) continue;
    ev.done = true;
    if (ev.kind === "expense") s.balance = r2(s.balance - ev.amount);
    else if (ev.kind === "income") s.balance = r2(s.balance + ev.amount);
    else if (ev.kind === "latePay") {
      const p = s.paychecks.find((x) => x.day === d && !x.moved);
      if (p) {
        p.day = d + 1;
        p.moved = true;
        s.balance = r2(s.balance - p.amount);
      }
    } else if (ev.kind === "electricUp") {
      const b = s.bills.find((x) => x.type === "electric" && !x.paid);
      if (b) b.amount = r2(b.amount + ev.amount);
    }
    happened.push({ type: "chaos", card: ev });
  }
  // Payments.
  let debits = 0;
  for (const b of s.bills) {
    if (b.paid || b.canceled) continue;
    const today = b.autopay ? b.due === d || (b.due < d && !b.late && false) : b.payDay === d;
    if (!today) continue;
    const amt = payAmount(b);
    s.balance = r2(s.balance - amt);
    b.paid = amt;
    b.paidDay = d;
    b.logged = true;
    debits++;
    happened.push({ type: "paid", bill: b, amount: amt, surprise: b.forgotten && !b.seen });
    if (b.forgotten && !b.seen) {
      b.seen = true;
      s.echoes.push({ day: d, text: `Autopay: ${b.company} ${TYPE_LABEL[b.type].toLowerCase()} $${amt}. You set this up months ago.` });
    }
    // The student's own riskiest payment (not a forgotten autopay they never chose).
    if (!b.forgotten && (s.closest == null || s.balance < s.closest.balance)) s.closest = { balance: s.balance, billId: b.id, day: d };
  }
  // End of day: overdraft fees, one for each payment that posted while below $0.
  if (s.balance < 0 && debits > 0) {
    for (let i = 0; i < debits; i++) {
      s.balance = r2(s.balance - c.overdraftFee);
      const cause = happened.filter((x) => x.type === "paid")[i]?.bill;
      const fee = { kind: "overdraft", day: d, amount: c.overdraftFee, billId: cause?.id, text: `Overdraft fee $${c.overdraftFee}. From: ${cause ? cause.company : "a payment"}, day ${d}.` };
      s.fees.push(fee);
      happened.push({ type: "fee", fee });
    }
  } else if (s.balance < 0 && happened.some((x) => x.type === "chaos")) {
    const fee = { kind: "overdraft", day: d, amount: c.overdraftFee, text: `Overdraft fee $${c.overdraftFee}. From: a surprise cost, day ${d}.` };
    s.balance = r2(s.balance - c.overdraftFee);
    s.fees.push(fee);
    happened.push({ type: "fee", fee });
  }
  // Late fees, once per bill, the day after the due date passes unpaid.
  for (const b of s.bills) {
    if (b.paid || b.canceled || b.late || b.due >= d) continue;
    b.late = true;
    s.balance = r2(s.balance - b.lateFee);
    const fee = { kind: "late", day: d, amount: b.lateFee, billId: b.id, text: `Late fee $${b.lateFee}. From: ${b.company}, due day ${b.due}.` };
    s.fees.push(fee);
    happened.push({ type: "fee", fee });
  }
  s.balances.push(s.balance);
  return { done: s.day >= DAYS, happened };
}

// ---------- Forecast and score ----------

// The balance line the student can see: real days so far, then a forecast of
// logged bills, known autopays, paychecks and extra shifts. Unlogged bills and
// unknown chaos don't show.
export function forecast(s) {
  const out = s.balances.slice();
  let bal = s.balance;
  for (let d = s.day + 1; d <= DAYS; d++) {
    for (const p of s.paychecks) if (p.day === d) bal += p.amount;
    for (const x of s.extra) if (x.day === d) bal += x.amount;
    for (const b of s.bills) {
      if (b.paid || b.canceled || !(b.logged || (b.forgotten && s.checkedBank))) continue;
      if ((b.autopay && b.due === d) || (!b.autopay && b.payDay === d)) bal -= payAmount(b);
    }
    out.push(r2(bal));
  }
  return out;
}

// Month Score = 50 per bill paid on time + min(ending balance, 500) / 5
// - total fees - 75 per bill never paid.
export function score(s) {
  const c = C();
  const live = s.bills.filter((b) => !b.canceled);
  const onTime = live.filter((b) => b.paid && b.paidDay <= b.due).length;
  const never = live.filter((b) => !b.paid).length;
  const fees = r2(s.fees.reduce((t, f) => t + f.amount, 0));
  const end = s.balance;
  const card = live.find((b) => b.type === "card");
  const cardLeft = card && card.paid && card.part === "min" ? r2(card.amount - card.paid) : 0;
  const interest = r2(cardLeft * (c.cardApr / 12));
  const total = Math.round(c.perOnTime * onTime + Math.min(Math.max(end, 0), c.balanceCap) / c.balanceDivisor - fees - c.perUnpaid * never);
  return { score: total, onTime, never, fees, end, interest, cardLeft, bills: live.length };
}

// The biggest decision (2.7): the payment that came closest to an overdraft,
// or the fix used.
export function biggest(s) {
  const fix = s.fixesUsed[0];
  if (fix && (!s.closest || s.closest.balance >= 50)) {
    const b = fix.target != null ? billOf(s, fix.target) : null;
    return { text: fix.kind === "move" ? `asking ${b?.company} to move the due date` : fix.kind === "cancel" ? `canceling ${b?.company}` : "picking up an extra shift" };
  }
  if (s.closest) {
    const b = billOf(s, s.closest.billId);
    return { text: `paying ${b.company} on day ${s.closest.day}` };
  }
  return { text: "when you scheduled your rent" };
}
