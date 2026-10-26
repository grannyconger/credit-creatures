// Check Writer's rules (GAME-SPECS.md game 2, upgrade). Pure and seeded.
// Phase 1 writes a rent check, phase 2 endorses a paycheck for mobile deposit,
// phase 3 judges three checks at the Vault counter. Skip a line in phase 1 and
// one of the three is your own check, washed.
import { CONFIG } from "../data/config.js";
import { createRng } from "../engine/index.js";
import { amountInWords, wordsMatch, amountMatch, payeeMatch, MONTH_NAMES } from "../data/minigames.js";
import { CW_LANDLORDS, CW_JUDGE, CW_CALLS, CW_ENDORSE } from "../data/arcade/checks.js";

const C = () => CONFIG.arcade.games.checks;
export const YEAR = 2026;
export const dateText = (d) => `${MONTH_NAMES[d.m]} ${d.d}, ${d.y}`;
const dayNum = (d) => d.y * 372 + d.m * 31 + d.d;
const digits = (rng, n) => Array.from({ length: n }, () => rng.int(0, 9)).join("");

function shiftDate(d, days) {
  const dt = new Date(Date.UTC(d.y, d.m, d.d + days));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate() };
}

export function newShift(seed, { writer = "You" } = {}) {
  const rng = createRng(`${seed}:checks`);
  const today = { y: YEAR, m: rng.int(0, 11), d: rng.int(1, 28) };
  const [payee, memo] = CW_LANDLORDS[rng.int(0, CW_LANDLORDS.length - 1)];
  const cents = rng.int(C().rent[0], C().rent[1]) * 100 + rng.int(0, 99);
  const bill = { payee, memo, cents, words: amountInWords(cents), date: dateText(today) };
  // 0 to 2 clean checks, the rest different problems.
  const cleans = rng.int(0, 2);
  const kinds = ["signature", "altered", "stale", "postdated", "noEndorse", "bigNew"];
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  let picked = [...Array(cleans).fill("clean"), ...kinds.slice(0, 3 - cleans)];
  // Every shift needs at least two different right calls, so Cash, Hold or Reject
  // everything never ties careful play (an acceptance test).
  if (new Set(picked.map((k) => CW_CALLS[k].call)).size < 2) picked = [...picked.slice(0, 2), rng.chance(0.5) ? "postdated" : "clean"];
  for (let i = picked.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  const used = new Set();
  const judge = picked.map((kind) => {
    const pool = CW_JUDGE.filter((t) => t.kind === kind && !used.has(t));
    const t = pool[rng.int(0, pool.length - 1)];
    used.add(t);
    return makeJudgeCheck(rng, t, today);
  });
  // The slot your washed check takes if you skip a line: a problem check, never a clean one.
  const problemSlots = judge.map((j, i) => (j.kind !== "clean" ? i : -1)).filter((i) => i >= 0);
  const washSlot = problemSlots.length ? problemSlots[rng.int(0, problemSlots.length - 1)] : 0;
  // Rent stays under $1,000, so a washer adds "One thousand" in the empty space.
  const washAdd = 100000;
  return { seed: String(seed), today, bill, judge, washSlot, washAdd, writer, payNo: rng.int(5100, 5999) };
}

function makeJudgeCheck(rng, t, today) {
  const cents = rng.int(t.amount[0], t.amount[1]) * 100 + (t.kind === "bigNew" ? 0 : rng.int(0, 99));
  let date = shiftDate(today, -rng.int(1, 20));
  if (t.kind === "stale") date = shiftDate(today, -30 * rng.int(t.monthsOld[0], t.monthsOld[1]));
  if (t.kind === "postdated") date = shiftDate(today, rng.int(t.daysAhead[0], t.daysAhead[1]));
  const shown = t.kind === "altered" ? cents + t.add * 100 : cents;
  return {
    kind: t.kind,
    writer: t.writer,
    payee: t.payee,
    cents: shown,
    numbers: (shown / 100).toFixed(2),
    words: amountInWords(cents),
    altered: t.kind === "altered" ? { added: t.add } : null,
    date: dateText(date),
    signedAs: t.kind === "signature" ? t.forged : t.writer,
    card: t.writer,
    endorsed: t.kind !== "noEndorse",
    newDays: t.kind === "bigNew" ? rng.int(t.newDays[0], t.newDays[1]) : null,
    push: t.push,
    routing: `0${digits(rng, 8)}`,
    account: digits(rng, 9),
    checkno: String(rng.int(1001, 4999)),
    call: CW_CALLS[t.kind].call,
    why: CW_CALLS[t.kind].why,
  };
}

// Your own rent check, washed: someone added to the empty space.
export function washedCheck(deal, written) {
  const cents = deal.bill.cents + deal.washAdd;
  const prefix = "One thousand";
  return {
    kind: "washed",
    writer: deal.writer,
    payee: written.payee || deal.bill.payee,
    cents,
    numbers: (cents / 100).toFixed(2),
    words: `${prefix} ${deal.bill.words.charAt(0).toLowerCase()}${deal.bill.words.slice(1)}`,
    altered: { added: deal.washAdd / 100, own: true },
    date: deal.bill.date,
    signedAs: deal.writer,
    card: deal.writer,
    endorsed: true,
    newDays: null,
    push: "Rent money. Can I get it in cash?",
    routing: "071000013",
    account: "448210377",
    checkno: "101",
    call: "reject",
    why: CW_CALLS.washed.why,
    own: true,
  };
}

// The three checks at the counter, with your washed check in place if a line was skipped.
export function counterChecks(deal, written) {
  const washed = !(written.lines?.payee && written.lines?.words);
  return deal.judge.map((j, i) => (washed && i === deal.washSlot ? washedCheck(deal, written) : j));
}

// ---------- Grading ----------

// written: { date, payee, amount, tiles: [words...], cents: "17/100", signed, lines: { payee, words } }
export function gradeWrite(deal, w) {
  const n = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const words = [...(w.tiles || []), w.cents || ""].join(" ");
  return {
    date: n(w.date) === n(deal.bill.date) || n(w.date) === n(deal.bill.date.replace(/, \d{4}$/, "")),
    payee: payeeMatch(w.payee, deal.bill.payee),
    amount: amountMatch(w.amount, deal.bill.cents),
    words: wordsMatch(words, deal.bill.cents),
    signature: Boolean(w.signed),
    lines: Boolean(w.lines?.payee && w.lines?.words),
  };
}

export const endorseRight = (id) => Boolean(CW_ENDORSE.find((e) => e.id === id)?.right);
export const callRight = (check, call) => check.call === call;

// Vault Score = 10 per right field (6) + 10 endorsement + 20 per right call + 20
// if washing was avoided. Max 150.
export function score(deal, w, endorse, calls) {
  const c = C();
  const g = gradeWrite(deal, w);
  const fields = Object.values(g).filter(Boolean).length;
  const checks = counterChecks(deal, w);
  const right = checks.filter((k, i) => calls[i] && callRight(k, calls[i])).length;
  const total = c.perField * fields + (endorseRight(endorse) ? c.endorse : 0) + c.perCall * right + (g.lines ? c.noWash : 0);
  return { score: total, fields, grade: g, endorse: endorseRight(endorse), right, washed: !g.lines, checks };
}

// The biggest decision (2.7): any Hold call, else the washed check, else the hardest call.
export function biggest(deal, w, calls) {
  const checks = counterChecks(deal, w);
  const hold = checks.findIndex((k, i) => calls[i] === "hold");
  if (hold >= 0) return { text: checks[hold].own ? "holding your own washed rent check" : `holding ${checks[hold].payee}'s check for $${checks[hold].numbers}` };
  const washed = checks.findIndex((k) => k.own);
  if (washed >= 0) return { text: "leaving empty space on your rent check", reasons: { weak: "I didn't think it mattered.", okay: "I was in a hurry.", strong: "A line through empty space stops anyone from adding to my check." } };
  const order = ["signature", "altered", "bigNew", "postdated", "stale", "noEndorse", "clean"];
  const hard = checks.map((k, i) => ({ k, i })).sort((a, b) => order.indexOf(a.k.kind) - order.indexOf(b.k.kind))[0];
  return { text: `your call on ${hard.k.payee}'s check (${calls[hard.i] || "no call"})` };
}
