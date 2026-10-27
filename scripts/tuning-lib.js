// Turns a dashboard tuning export into suggested config changes, each with a
// reason (docs/FEEDBACK.md section 4). Pure, so it's tested in Node.
import { CONFIG } from "../js/data/config.js";
import { replayLife, amountOwed } from "../js/engine/index.js";

const median = (xs) => {
  const a = xs.filter(Number.isFinite).sort((x, y) => x - y);
  return a.length ? a[Math.floor((a.length - 1) / 2)] : null;
};

function worth(life) {
  const debt = life.accounts.filter((a) => a.owner === "self" && ["open", "collections"].includes(a.status)).reduce((s, a) => s + amountOwed(a), 0);
  return life.checking + life.savings + life.heldSavings - debt;
}

// Money saved per game month after 18, for each student (SPEC §19 target: about $100).
export function economy(lives) {
  const at18 = CONFIG.onboarding.cardAgeMonths;
  const out = [];
  for (const l of lives) {
    const idx = l.log.findIndex((e) => l.start.ageMonths + e.month >= at18);
    if (idx < 0) continue;
    const before = replayLife(l.start, l.log, idx);
    const after = replayLife(l.start, l.log);
    const months = after.month - before.month;
    if (months < 1) continue;
    const shop = l.log.filter((e) => /shop:/.test(e.args?.[e.action === "cardPurchase" ? 2 : 1] || "") || (e.action === "buyWithBnpl" && /shop:/.test(e.args?.[1] || "")));
    out.push({
      student: l.student,
      months,
      savedPerMonth: Math.round((worth(after) - worth(before)) / months),
      shopSpent: shop.reduce((s, e) => s + (e.action === "cardPurchase" ? e.args[1] : e.args[0]), 0),
      score: after.score,
    });
  }
  return out;
}

const SAVE_TARGET = { low: 50, goal: 100, high: 150 };

export function suggest(data) {
  const t = data.tuning || {};
  const lines = [];
  const changes = [];
  const push = (setting, current, suggested, reason) => changes.push({ setting, current, suggested, reason });

  // 1. Time per month (SPEC §8: 3 to 4 minutes).
  const m = t.minutesPerMonth;
  if (m?.median != null) {
    lines.push(`Minutes per game month: ${m.median} (target ${m.targetLow} to ${m.targetHigh}, from ${m.n} months).`);
    const p = CONFIG.pacing;
    if (m.median > m.targetHigh + 0.5) push("pacing.newCardsPerMonth", p.newCardsPerMonth, Math.max(1, p.newCardsPerMonth - 1), `Months run long (${m.median} min). One fewer new card a month saves about a minute.`);
    if (m.median < m.targetLow - 0.5) push("pacing.newCardsPerMonth", p.newCardsPerMonth, p.newCardsPerMonth + 1, `Months run short (${m.median} min). One more card a month adds about a minute.`);
  }

  // 2. Economy (SPEC §19: a careful student affords one $600 want every couple of chapters).
  const eco = economy(data.lives || []);
  if (eco.length) {
    const saved = median(eco.map((e) => e.savedPerMonth));
    lines.push(`Money saved per game month after 18: median $${saved} across ${eco.length} students (goal about $${SAVE_TARGET.goal}). Median shop spending: $${median(eco.map((e) => e.shopSpent))}.`);
    const pay = CONFIG.play.jobs.pay;
    if (saved > SAVE_TARGET.high) {
      const cut = Math.min(30, Math.round((saved - SAVE_TARGET.goal) / 3 / 5) * 5);
      push("play.jobs.pay.max", pay.max, pay.max - cut, `Students save $${saved} a month, well over the ~$${SAVE_TARGET.goal} goal. With 3 shifts a month, -$${cut} a shift is about -$${cut * 3} a month.`);
    } else if (saved < SAVE_TARGET.low) {
      const add = Math.min(30, Math.round((SAVE_TARGET.goal - saved) / 3 / 5) * 5);
      push("play.jobs.pay.min", pay.min, pay.min + add, `Students save only $${saved} a month. +$${add} a shift is about +$${add * 3} a month.`);
    }
  }

  // 3. Decision cards everyone answers the same way, or finds confusing.
  for (const c of (t.cards || []).filter((x) => x.lopsided)) lines.push(`Card "${c.id}": ${Math.round(c.topShare * 100)}% picked the same choice (${c.n} times). Make the other choices more tempting, or check the wording.`);
  for (const c of (t.cards || []).filter((x) => x.confusing >= 2)) lines.push(`Card "${c.id}" was flagged confusing ${c.confusing} times. Rewrite it.`);

  // 4. Questions that are too hard or too easy.
  for (const q of t.questions || []) {
    if (q.n < 5) continue;
    if (q.accuracy < 50) lines.push(`Practice Desk "${q.type}": only ${q.accuracy}% right. Add a hint or easier numbers.`);
    if (q.accuracy > 95) lines.push(`Practice Desk "${q.type}": ${q.accuracy}% right. It could be harder.`);
  }

  // 5. Minigame pay and fun.
  for (const g of t.games || []) {
    lines.push(`${g.game}: ${g.n} shifts, median pay $${g.medianPay}, median right ${g.medianRight}, 👍 ${g.up} 😐 ${g.meh} 👎 ${g.down}.`);
    if (g.n >= 5 && g.down > g.up) lines.push(`  More 👎 than 👍 on ${g.game}. Look at its difficulty or timer.`);
  }

  // 6. Chapter ratings.
  for (const r of t.ratings || []) if (r.n >= 3 && (r.clear < 3 || r.fun < 3)) lines.push(`Chapter ${r.chapter} rated fun ${r.fun}, clear ${r.clear}. Look at that chapter's confusing cards.`);

  // 7. XP cap.
  if ((t.xpCapHits || 0) > 0) lines.push(`${t.xpCapHits} right answers came after the 100 XP a chapter cap. If most students hit it, consider ${CONFIG.pacing.xp.answersPerChapter + 50}.`);

  return { lines, changes, economy: eco };
}
