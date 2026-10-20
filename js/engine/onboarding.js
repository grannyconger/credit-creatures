// Age 16 onboarding (SPEC §6): the teen debit card and the time skip to 18.
import { CONFIG } from "../data/config.js";
import { copyLife, logAction } from "./life.js";
import { createRng } from "./rng.js";
import { earn, debitPurchase } from "./accounts.js";
import { endMonth } from "./month.js";
import { money } from "./util.js";

// Checking isn't reported, so a teen debit card builds no credit and has no risk.
export function getTeenDebitCard(life) {
  if (life.teenDebit) return { life, ok: false, message: "You already have a teen debit card." };
  const next = copyLife(life);
  next.teenDebit = true;
  logAction(next, "getTeenDebitCard", []);
  return { life: next, ok: true, message: "Your teen debit card is ready. It spends money from checking." };
}

// Pay for the guided tutorial shift.
export function tutorialShiftPay(correct) {
  const t = CONFIG.onboarding.tutorialShift;
  return t.base + t.perCorrect * correct;
}

// Fast-forwards whole months of teen life: part-time pay, everyday spending,
// then End Month. It is made of normal engine actions, which log themselves,
// so a replay never needs to know a time skip happened. Its own dice come
// from the seed and month, not from life.rng.
export function timeSkip(life, months) {
  const cfg = CONFIG.onboarding;
  const rng = createRng(`${life.seed}:skip:${life.month}`);
  const startScore = life.score;
  let earned = 0;
  let spent = 0;
  const scoreChanges = [];
  for (let i = 0; i < months; i++) {
    const pay = rng.int(...cfg.teenIncome);
    life = earn(life, pay, "part-time job").life;
    earned += pay;
    const spend = money(pay * rng.range(...cfg.teenSpendShare));
    const r = debitPurchase(life, spend, rng.pick(cfg.teenSpending));
    if (r.ok) {
      life = r.life;
      spent += spend;
    }
    const m = endMonth(life);
    life = m.life;
    scoreChanges.push(m.scoreChange);
  }
  return {
    life,
    ok: true,
    months,
    earned: money(earned),
    spent: money(spent),
    startScore,
    endScore: life.score,
    scoreChanges,
    message: `${months} months went by.`,
  };
}
