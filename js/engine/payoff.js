// Payment math: minimum payments, loan payments and payoff previews.
import { CONFIG } from "../data/config.js";
import { money } from "./util.js";

// $25 or 2% of the balance plus interest, whichever is larger, never more than the balance.
export function minPayment(balance, interest = 0) {
  if (balance <= 0) return 0;
  const { floor, percent } = CONFIG.minPayment;
  return money(Math.min(balance, Math.max(floor, balance * percent + interest)));
}

export function monthlyInterest(balance, apr) {
  return money(Math.max(0, balance) * (apr / 12));
}

export function amortizedPayment(principal, apr, months) {
  if (principal <= 0) return 0;
  const r = apr / 12;
  if (r === 0) return money(principal / months);
  return money((principal * r) / (1 - Math.pow(1 + r, -months)));
}

// Paying a fixed amount each month. Interest is charged first each month.
export function payoffPlan(balance, apr, monthly, maxMonths = 600) {
  let bal = balance;
  let months = 0;
  let totalInterest = 0;
  while (bal > 0.005 && months < maxMonths) {
    const interest = monthlyInterest(bal, apr);
    if (monthly <= interest) return { months: Infinity, totalInterest: Infinity, neverPaysOff: true };
    bal = money(bal + interest);
    totalInterest = money(totalInterest + interest);
    bal = money(bal - Math.min(monthly, bal));
    months++;
  }
  return { months, totalInterest, totalPaid: money(balance + totalInterest), neverPaysOff: false };
}

// Paying only the minimum each month (the "minimum payment trap").
export function minimumOnlyPlan(balance, apr, maxMonths = 600) {
  let bal = balance;
  let months = 0;
  let totalInterest = 0;
  while (bal > 0.005 && months < maxMonths) {
    const interest = monthlyInterest(bal, apr);
    bal = money(bal + interest);
    totalInterest = money(totalInterest + interest);
    bal = money(bal - minPayment(bal, interest));
    months++;
  }
  return { months, totalInterest, totalPaid: money(balance + totalInterest) };
}
