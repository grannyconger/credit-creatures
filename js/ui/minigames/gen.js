// Round makers for the five Chapter 1 jobs (teacher request 2026-10-22).
// Pure and seeded (rng from createRng), so the same seed deals the same
// shift, and every one is tested in Node (tests/jobs.test.js). Money is in
// whole cents everywhere and only turns into dollars on screen.
import { FEE_KINDS, FEE_TRANSFERS, SPENDS, EARNINGS, CHECK_PAYEES, CHECK_PARTS, CHECK_FLAWS, DRAWER_FLOATS, PRODUCTS, MONTH_NAMES, DENOMINATIONS, amountInWords } from "../../data/minigames.js";

export const fmt = (cents) => `${cents < 0 ? "-" : ""}$${(Math.abs(cents) / 100).toFixed(2)}`;
const cents = (rng, lo, hi, step = 1) => Math.round(rng.int(Math.ceil(lo / step), Math.floor(hi / step)) * step);
const shuffle = (rng, list) => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------- Spot the Overdraft ----------

// One feed: a starting balance and items that arrive one at a time. Exactly
// one item (stop) is the first that would drop the balance below $0. Items
// before it never do, and deposits along the way can rescue a low balance.
export function overdraftFeed(rng, { length = 7 } = {}) {
  const start = cents(rng, 4000, 16000, 25);
  const stop = rng.int(3, length - 1);
  const items = [];
  let bal = start;
  for (let i = 0; i < stop; i++) {
    // Sometimes a deposit, more likely when the balance is getting low.
    if (bal < 400 || rng.chance(bal < 3000 ? 0.45 : 0.2)) {
      const amt = cents(rng, 1500, 9000, 25);
      items.push({ label: rng.pick(EARNINGS), amount: amt });
      bal += amt;
    } else {
      // Spend down, but leave something so the stop item is the first to overdraw.
      const max = Math.max(200, Math.min(bal - 100, Math.round(bal * 0.7)));
      const amt = Math.max(1, Math.min(bal - 100, cents(rng, 199, max)));
      items.push({ label: rng.pick(SPENDS), amount: -amt });
      bal -= amt;
    }
  }
  const over = cents(rng, 150, 3500);
  items.push({ label: rng.pick(SPENDS), amount: -(bal + over) });
  return { start, items, stop };
}

// The balance after each item, starting from start.
export function runningBalances(start, items) {
  let b = start;
  return items.map((it) => (b += it.amount));
}

// ---------- Register Balancer ----------

// A month of register lines. Most change the balance. Two are planted
// mistakes to dispute: a duplicate of the line before it, or a charge far
// bigger than its receipt. A mistake never changes the right balance.
export function registerLines(rng, { count = 10 } = {}) {
  const start = cents(rng, 25000, 60000, 5);
  const errorAt = new Set([rng.int(2, 4), rng.int(6, count - 1)]);
  const lines = [];
  let bal = start;
  let checkNo = rng.int(101, 140);
  let day = 1;
  // One month of the register, days going up.
  const month = rng.pick(MONTH_NAMES).slice(0, 3);
  for (let i = 0; i < count; i++) {
    day += rng.int(1, 2);
    const date = `${month} ${Math.min(28, day)}`;
    const prev = lines.at(-1);
    if (errorAt.has(i) && prev && prev.amount < 0 && !prev.error && rng.chance(0.5)) {
      lines.push({ date: prev.date, label: prev.label, amount: prev.amount, error: "duplicate", balance: bal });
      continue;
    }
    if (errorAt.has(i)) {
      const real = cents(rng, 450, 2400, 5);
      const label = rng.pick(SPENDS);
      lines.push({ date, label, amount: -real * 10, receipt: real, error: "amount", balance: bal });
      continue;
    }
    // A low balance gets a deposit, so the register never goes below $0.
    const kind = bal < 8000 ? "deposit" : rng.pick(["deposit", "check", "debit", "debit", "atm"]);
    let amount;
    let label;
    if (kind === "deposit") {
      amount = cents(rng, 2500, 15000, 5);
      label = `Deposit: ${rng.pick(EARNINGS)}`;
    } else if (kind === "check") {
      amount = -Math.min(bal - 500, cents(rng, 2500, 12000, 5));
      label = `Check #${checkNo++} to ${rng.pick(CHECK_PAYEES)}`;
    } else if (kind === "atm") {
      amount = -rng.pick([250, 300, 350]);
      label = "ATM fee (another bank's machine)";
    } else {
      amount = -Math.min(bal - 500, cents(rng, 299, 6500));
      label = `Debit card: ${rng.pick(SPENDS)}`;
    }
    bal += amount;
    lines.push({ date, label, amount, error: null, balance: bal });
  }
  return { start, lines };
}

// ---------- Check Anatomy Hunt ----------

const digits = (rng, n) => Array.from({ length: n }, () => rng.int(0, 9)).join("");

// A made-up check with every part filled in. flaw: "ok" | "unsigned" |
// "mismatch" | "nodate".
export function makeCheck(rng, { flaw = "ok" } = {}) {
  const amount = cents(rng, 1250, 48000);
  const wrongBy = rng.pick([100, 1000, 500, 900]);
  return {
    payee: rng.pick(CHECK_PAYEES),
    amount,
    words: amountInWords(flaw === "mismatch" ? amount + wrongBy : amount),
    date: flaw === "nodate" ? "" : `${rng.pick(MONTH_NAMES)} ${rng.int(1, 28)}`,
    memo: rng.pick(["Rent", "Water bill", "Checkup", "Lessons", "Team fees"]),
    routing: `0${digits(rng, 8)}`,
    account: digits(rng, rng.int(8, 10)),
    checkno: String(rng.int(1001, 1499)),
    signed: flaw !== "unsigned",
    flaw,
  };
}

// The prompts for one shift: 8 parts to find, then 2 "good to cash?" checks.
export function checkHuntRounds(rng) {
  const parts = shuffle(rng, Object.keys(CHECK_PARTS)).slice(0, 8);
  // Two different checks to judge: any two of good, unsigned, mismatched or undated.
  const flaws = shuffle(rng, ["ok", "unsigned", "mismatch", "nodate"]).slice(0, 2);
  return [
    ...parts.map((part) => ({ type: "find", part, check: makeCheck(rng) })),
    ...shuffle(rng, flaws).map((flaw) => ({ type: "judge", flaw, check: makeCheck(rng, { flaw }), why: CHECK_FLAWS[flaw] })),
  ];
}

// ---------- Count the Drawer ----------

// A drawer at closing: how many of each bill and coin, the starting float
// and the sales on the register tape. diff = counted - (float + sales).
export function makeDrawer(rng) {
  const max = { 2000: 5, 1000: 6, 500: 7, 100: 12, 25: 12, 10: 10, 5: 8, 1: 12 };
  const counts = Object.fromEntries(DENOMINATIONS.map((d) => [d, rng.int(d >= 100 ? 1 : 0, max[d])]));
  const total = DENOMINATIONS.reduce((s, d) => s + d * counts[d], 0);
  // The biggest round float that leaves room for some sales.
  const fits = DRAWER_FLOATS.filter((f) => f <= total - 1500);
  const float = fits.length ? rng.pick(fits) : DRAWER_FLOATS[0];
  const diff = rng.pick([0, 0, 0, 100, -500, -27, 35, -1000, 200]);
  const sales = Math.max(100, total - float - diff);
  return { counts, total, float, sales, diff: total - float - sales };
}

export const overShort = (diff) => (diff > 0 ? "over" : diff < 0 ? "short" : "exact");

// ---------- Unit Price Showdown ----------

// Unit price in hundredths of a cent per unit, so close prices still compare.
export const unitPrice = (opt) => Math.round(((opt.price - (opt.coupon || 0)) * 100) / opt.baseQty);

function option(p, [qty, price], { inPounds = false } = {}) {
  // Ounces can show as pounds (16 oz in a pound) and fluid ounces as quarts
  // (32 fl oz in a quart) in the conversion rounds.
  const show =
    inPounds && p.unit === "oz" && qty % 16 === 0
      ? { qty: qty / 16, unit: "lb" }
      : inPounds && p.unit === "fl oz" && qty % 32 === 0
        ? { qty: qty / 32, unit: qty === 32 ? "quart" : "quarts" }
        : { qty, unit: p.unit };
  return { name: p.name, kind: p.kind, price, baseQty: qty, baseUnit: p.unit, showQty: show.qty, showUnit: show.unit };
}

// 10 rounds: 4 of one product in two sizes, 4 of two brands, then 2 harder
// ones with three choices, a coupon or a size in pounds. Every round has one
// clear winner (at least 4% cheaper per unit than the next best).
export function unitRounds(rng, { count = 10 } = {}) {
  const rounds = [];
  let guard = 0;
  while (rounds.length < count && guard++ < 500) {
    const i = rounds.length;
    let opts;
    if (i < 4) {
      const p = rng.pick(PRODUCTS);
      if (p.sizes.length < 2) continue;
      opts = shuffle(rng, p.sizes).slice(0, 2).map((sz) => option(p, sz));
    } else if (i < 8) {
      const kind = rng.pick([...new Set(PRODUCTS.map((p) => p.kind))]);
      const same = PRODUCTS.filter((p) => p.kind === kind);
      if (same.length < 2) continue;
      opts = shuffle(rng, same).slice(0, 2).map((p) => option(p, rng.pick(p.sizes)));
    } else {
      const p = rng.pick(PRODUCTS.filter((x) => x.sizes.length >= 3));
      opts = p.sizes.map((sz) => option(p, sz, { inPounds: true }));
      // A coupon on one of them, sometimes the one that then wins.
      const c = rng.pick(opts);
      c.coupon = rng.pick([50, 75, 100, 150]);
      opts = shuffle(rng, opts);
    }
    const ranked = opts.map(unitPrice).sort((a, b) => a - b);
    if (ranked[1] < ranked[0] * 1.04) continue;
    const best = opts.findIndex((o) => unitPrice(o) === ranked[0]);
    rounds.push({ options: opts, best });
  }
  return rounds;
}

// "$0.19 per oz", from hundredths of a cent.
export function unitText(opt) {
  const per = unitPrice(opt) / 10000;
  const unit = opt.baseUnit.replace(/s$/, "");
  return `$${per.toFixed(per < 0.1 ? 3 : 2)} per ${unit}`;
}

// ---------- Fee Detective ----------

// One monthly statement: lines with a date, a name and an amount in cents
// (negative is money out). fees lists the fee lines by index. A statement
// with none is a real answer ("No fees this month"). Fees never repeat on a
// statement, and the decoys include a transfer and interest earned.
export function feeStatement(rng, { feeCount = 3, lines = 13, month = 9 } = {}) {
  const kinds = shuffle(rng, Object.keys(FEE_KINDS)).slice(0, feeCount);
  const rows = kinds.map((fee) => ({ type: "fee", fee, text: FEE_KINDS[fee].line, amount: -rng.pick(FEE_KINDS[fee].amounts) }));
  const decoys = [
    { type: "interest", text: "INTEREST EARNED", amount: rng.int(1, 9) },
    { type: "transfer", text: rng.pick(FEE_TRANSFERS), amount: (rng.chance(0.5) ? -1 : 1) * cents(rng, 2000, 8000, 500) },
  ];
  const extra = lines - rows.length - decoys.length;
  const deposits = rng.int(2, 3);
  for (let i = 0; i < extra; i++) {
    if (i < deposits) decoys.push({ type: "deposit", text: rng.pick(EARNINGS).toUpperCase(), amount: cents(rng, 1500, 9000, 25) });
    else decoys.push({ type: "purchase", text: rng.pick(SPENDS).toUpperCase(), amount: -cents(rng, 299, 4999) });
  }
  const all = shuffle(rng, [...rows, ...decoys]).map((r, i) => ({ ...r, day: 0, id: i }));
  // Dates run forward down the page.
  const days = Array.from({ length: all.length }, () => rng.int(1, 28)).sort((a, b) => a - b);
  all.forEach((r, i) => (r.day = days[i]));
  const feeLines = all.filter((r) => r.type === "fee");
  const total = feeLines.reduce((sum, r) => sum - r.amount, 0);
  return { month, lines: all, fees: feeLines.map((r) => r.id), total };
}

// A shift: `statements` of them, and exactly one has no fees. The others
// have 3 and 4. Returns the statements and the most points a student can earn.
export function feeStatements(rng, { statements = 3, lines = 13, noFeePoints = 2 } = {}) {
  const plan = shuffle(rng, [3, 4, 0, 3, 4].slice(0, Math.max(1, statements)));
  if (!plan.includes(0)) plan[0] = 0;
  const list = plan.map((feeCount, i) => ({ ...feeStatement(rng, { feeCount, lines, month: (9 + i) % 12 }), noFee: feeCount === 0 }));
  const most = list.reduce((sum, st) => sum + (st.noFee ? noFeePoints : st.fees.length * 2), 0);
  return { statements: list, most };
}

// "Choose how to avoid it": the right answer and two that don't work, shuffled.
export function avoidOptions(rng, fee) {
  const k = FEE_KINDS[fee];
  const opts = shuffle(rng, [{ text: k.avoid, right: true }, ...k.wrong.map((text) => ({ text, right: false }))]);
  return opts;
}
