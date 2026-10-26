// Daily Pick and the login streak, as pure functions (no DOM, no clock of their
// own: the caller passes the date). A "day key" is the local date, "YYYY-MM-DD",
// so everything resets at the student's midnight.
import { createRng } from "./rng.js";

export function dayKey(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

// Whole days from key a to key b (b later is positive).
export function dayDiff(a, b) {
  const t = (k) => Date.UTC(...k.split("-").map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))));
  return Math.round((t(b) - t(a)) / 86400000);
}

export function msUntilMidnight(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next - now;
}

// The streak after signing in on `today`. Same day: nothing changes. The next
// day: it grows. Any gap: it starts again at 1. A clock set backwards counts as
// the same day, so it can't be farmed.
export function streakAfter(daily, today) {
  const last = daily?.lastLogin;
  const streak = daily?.streak || 0;
  const best = daily?.best || 0;
  if (last && dayDiff(last, today) <= 0) return { lastLogin: last, streak, best, fresh: false };
  const next = last && dayDiff(last, today) === 1 ? streak + 1 : 1;
  return { lastLogin: today, streak: next, best: Math.max(best, next), fresh: true };
}

// Coins for a login on streak day n, and the milestone if n hits one.
export function loginReward(streak, cfg) {
  const bonus = Math.min(cfg.maxBonus, Math.max(0, streak - 1) * cfg.perDay);
  const milestone = cfg.milestones[streak] || 0;
  return { coins: cfg.base + bonus, milestone };
}

// The closed boxes for one student on one day. The same seed and day always
// give the same boxes, so refreshing the page can't re-roll luck, and different
// students get different boxes. decorPool: ids of Cottage pieces a decor prize
// may be.
export function rollBoxes(seed, key, cfg, decorPool = []) {
  const rng = createRng(`${seed}:daily:${key}`);
  const prizes = cfg.prizes.filter((p) => p.kind !== "decor" || decorPool.length);
  const total = prizes.reduce((s, p) => s + p.weight, 0);
  return Array.from({ length: cfg.boxes }, () => {
    let r = rng.next() * total;
    const prize = prizes.find((p) => (r -= p.weight) < 0) || prizes[0];
    if (prize.kind === "coins") return { kind: "coins", tier: prize.tier, amount: rng.int(prize.range[0], prize.range[1]) };
    if (prize.kind === "coupon") return { kind: "coupon", pct: prize.pct };
    return { kind: "decor", id: rng.pick(decorPool) };
  });
}
