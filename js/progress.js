// XP, ranks, achievements, job experience and personal records (SPEC §16, §17).
// Pure functions over the save, so they run in Node tests. XP never goes down.
import { CONFIG } from "./data/config.js";
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID, XP, RANKS } from "./data/achievements.js";
import { SHOP_BY_ID } from "./data/shop.js";
import { amountOwed } from "./engine/index.js";
import { addNote, addXp } from "./play.js";

export { addXp };

export function rankFor(xp) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  const rank = RANKS[i];
  const next = RANKS[i + 1] || null;
  return { ...rank, level: i + 1, next, progress: next ? (xp - rank.xp) / (next.xp - rank.xp) : 1 };
}

// Months in a row where every one of your own accounts reported on time.
export function onTimeStreaks(life) {
  const worst = new Map();
  for (const a of life.accounts) {
    if (a.owner === "authorized") continue;
    for (const h of a.history) {
      const bad = h.code !== "OK";
      worst.set(h.month, (worst.get(h.month) || false) || bad);
    }
  }
  const months = [...worst.keys()].sort((x, y) => x - y);
  let run = 0;
  let longest = 0;
  let prev = null;
  for (const m of months) {
    if (worst.get(m)) run = 0;
    else run = prev != null && m === prev + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = m;
  }
  return { current: run, longest, months: months.length };
}

export function facts(save) {
  const life = save.life;
  const play = save.play;
  const own = life.accounts.filter((a) => a.owner === "self");
  const live = own.filter((a) => ["open", "paid"].includes(a.status));
  const debtNow = Math.round(own.filter((a) => ["open", "collections"].includes(a.status)).reduce((s, a) => s + amountOwed(a), 0) * 100) / 100;
  const scores = life.scoreHistory.map((p) => p.score).filter((s) => s != null);
  const streaks = onTimeStreaks(life);
  const current = play.active ? [play.active] : [];
  return {
    life,
    play,
    creature: save.creature,
    stats: play.stats,
    desk: play.desk,
    jobs: play.jobs,
    decisions: [...play.history.flatMap((h) => h.decisions || []), ...current.flatMap((a) => a.decisions), ...(play.summary?.decisions || [])],
    summaries: [...play.history, ...(play.summary ? [play.summary] : [])],
    monthUtils: [...current.flatMap((a) => a.records), ...(play.summary?.records || []), ...(play.history.at(-1)?.records || [])].map((r) => r.util ?? null),
    ownOnTimeMonths: own.reduce((n, a) => n + a.history.filter((h) => h.code === "OK").length, 0),
    longestOnTime: streaks.longest,
    bestScore: scores.length ? Math.max(...scores) : null,
    hasRevolving: live.some((a) => a.kind === "revolving"),
    hasInstallment: live.some((a) => a.kind === "installment"),
    debtNow,
    hadDebt: play.stats.hadDebt || debtNow > 0,
    ownedBackgrounds: play.owned.filter((id) => SHOP_BY_ID[id]?.kind === "background").length,
    sparkleCap: CONFIG.pacing.sparkle.perChapter,
  };
}

// Checks every achievement and awards the new ones (XP plus an inbox note).
// Returns the newly earned achievements.
export function evaluate(save) {
  if (!save.life || !save.play) return [];
  const play = save.play;
  const f = facts(save);
  if (f.debtNow > 0) play.stats.hadDebt = true;
  play.records.highestScore = f.bestScore;
  play.records.longestOnTime = Math.max(play.records.longestOnTime || 0, f.longestOnTime);
  const earned = [];
  for (const a of ACHIEVEMENTS) {
    if (play.achievements[a.id]) continue;
    let ok = false;
    try {
      ok = a.check(f);
    } catch {
      ok = false;
    }
    if (!ok) continue;
    play.achievements[a.id] = { month: save.life.month, chapter: play.chapter };
    addXp(play, a.xp);
    addNote(play, "achievement", `${a.icon} ${a.title}: +${a.xp} XP`, save.life.month);
    earned.push(a);
  }
  return earned;
}

export function bestXpChapter(play) {
  const entries = Object.entries(play.xpByChapter);
  if (!entries.length) return null;
  const [chapter, xp] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  return { chapter: Number(chapter), xp };
}

// ---------- Jobs (SPEC §17): pay rises with experience ----------

export function experienceBonus(play, job) {
  const e = CONFIG.play.jobs.experience;
  const shifts = play.jobs[job]?.shifts || 0;
  return Math.min(e.max, Math.floor(shifts / e.everyShifts) * e.bonus);
}

// Pay from performance, kept in the $40 to $120 band, plus experience and any raise.
export function jobPay(play, job, score) {
  const j = CONFIG.play.jobs;
  let base;
  if (job === "ledger") base = j.pay.min + j.ledger.perRight * score.right - j.ledger.perWrong * score.wrong;
  else if (job === "cashier") base = j.pay.min + j.cashier.perRight * score.right;
  else base = j.pay.min + j.checks.perField * score.right;
  const clamped = Math.max(j.pay.min, Math.min(j.pay.max, Math.round(base)));
  return clamped + experienceBonus(play, job) + (play.shiftBonus || 0);
}

export function recordShift(play, job, { right, pay }) {
  const r = (play.jobs[job] ??= { shifts: 0, best: 0, totalPay: 0 });
  r.shifts++;
  r.best = Math.max(r.best, right);
  r.totalPay += pay;
  play.stats.shifts++;
  addXp(play, XP.shift);
}

// ---------- Payments, for "Paid in Full" and "Payoff Sprint" ----------

// before = the life just before a payment of `paid` to accountId.
export function notePayment(play, before, accountId, paid) {
  const a = before.accounts.find((x) => x.id === accountId);
  if (!a || a.kind !== "revolving") return;
  const owed = amountOwed(a);
  if (a.due && a.due.statementBalance > 0 && a.paidThisCycle < a.due.statementBalance && a.paidThisCycle + paid >= a.due.statementBalance - 0.005) play.stats.paidInFull++;
  if (owed >= 100 && paid >= owed - 0.005) play.stats.payoffSprints++;
}

// ---------- Practice Desk visits ----------

export function finishDeskVisit(play, right, total) {
  const d = play.desk;
  d.finished++;
  if (right === total) d.perfect++;
  d.streak = right >= total - 1 ? d.streak + 1 : 0;
  d.bestStreak = Math.max(d.bestStreak, d.streak);
}

export { ACHIEVEMENT_BY_ID, XP };
