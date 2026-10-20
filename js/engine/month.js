// End Month: the bank and credit bureau steps from SPEC §10, in order.
// Step 0 runs AutoPay on the due date, before the statement closes.
import { CONFIG } from "../data/config.js";
import { copyLife, logAction } from "./life.js";
import { rngOn } from "./rng.js";
import { money, dollars } from "./util.js";
import { applyPayment, amountOwed, isOpen } from "./accounts.js";
import { minPayment, monthlyInterest } from "./payoff.js";
import { buildReport } from "./report.js";
import { computeScore, explainChange } from "./score.js";

const DELINQUENT_CODES = ["OK", "30", "60", "90"];

export function endMonth(life) {
  const next = copyLife(life);
  const rng = rngOn(next);
  const M = next.month;
  const events = [];
  const emit = (step, type, message, extra = {}) => events.push({ step, type, month: M, message, ...extra });
  const prev = { score: next.score, factors: next.factors };
  logAction(next, "endMonth", []);

  const own = (a) => a.owner === "self";
  const cards = next.accounts.filter((a) => a.kind === "revolving" && own(a) && isOpen(a));

  // When checking can't cover an automatic payment, it bounces with a fee.
  function bounce(step, what, amount, accountId) {
    next.checking = money(next.checking - CONFIG.fees.overdraft);
    emit(step, "fee", `${what} of ${dollars(amount)} bounced. Not enough in checking. ${dollars(CONFIG.fees.overdraft)} overdraft fee.`, {
      accountId,
      amount: CONFIG.fees.overdraft,
      fee: "overdraft",
    });
  }

  // ---- Step 0: AutoPay pays on the due date ----
  for (const a of cards) {
    if (!a.autopay || !a.due || a.due.minDue <= 0) continue;
    let target;
    if (a.autopay === "full") target = a.due.statementBalance;
    else if (a.autopay === "min") target = a.due.minDue;
    else target = Math.max(Number(a.autopay), a.due.minDue);
    const need = money(Math.min(amountOwed(a), Math.max(0, target - a.paidThisCycle)));
    if (need <= 0) continue;
    if (need <= next.checking) {
      applyPayment(next, a, need);
      emit(0, "paymentReceived", `AutoPay paid ${dollars(need)} to ${a.name}.`, { accountId: a.id, amount: need });
    } else {
      bounce(0, `AutoPay to ${a.name}`, need, a.id);
    }
  }

  // ---- Step 1: purchases post to accounts ----
  const posted = {};
  for (const a of cards) {
    const total = money(a.pending.reduce((s, p) => s + p.amount, 0));
    posted[a.id] = { total, items: a.pending.map((p) => ({ ...p })) };
    if (total > 0) {
      a.balance = money(a.balance + total);
      emit(1, "purchasesPosted", `${dollars(total)} of purchases posted to ${a.name}.`, { accountId: a.id, amount: total });
    }
    a.pending = [];
  }
  // A parent's card keeps moving on its own.
  for (const a of next.accounts.filter((x) => x.owner === "authorized")) {
    const p = CONFIG.parents[a.parentProfile];
    a.balance = money(a.limit * rng.range(...p.utilization));
    a.parentLate = rng.chance(p.lateChance);
  }

  // ---- Step 2: statements close, interest and fees ----
  // ---- Step 3: minimum payment set ----
  const statements = {};
  for (const a of cards) {
    const graced = !a.due || a.paidThisCycle >= a.due.statementBalance - 0.005;
    const interest = graced ? 0 : monthlyInterest(a.balance, a.apr);
    const age = M - a.openedMonth;
    const annualFee = a.annualFee > 0 && age % 12 === 0 ? a.annualFee : 0;
    a.balance = money(a.balance + interest + annualFee);
    if (interest > 0) emit(2, "interest", `${dollars(interest)} interest charged on ${a.name}.`, { accountId: a.id, amount: interest });
    if (annualFee > 0) emit(2, "fee", `${dollars(annualFee)} annual fee charged on ${a.name}.`, { accountId: a.id, amount: annualFee, fee: "annual" });
    const minDue = minPayment(a.balance, interest);
    statements[a.id] = {
      month: M,
      purchases: posted[a.id].items,
      purchaseTotal: posted[a.id].total,
      payments: a.paidThisCycle,
      interest,
      fees: annualFee,
      balance: a.balance,
      minDue,
    };
    emit(3, "statement", `${a.name} statement: balance ${dollars(a.balance)}, minimum due ${dollars(minDue)}.`, {
      accountId: a.id,
      amount: a.balance,
      minDue,
    });
  }

  // ---- Step 4: missed due date ----
  for (const a of cards) {
    const s = statements[a.id];
    if (a.due && a.due.minDue > 0 && a.paidThisCycle + 0.005 < a.due.minDue) {
      a.pastDue = money(a.due.minDue - a.paidThisCycle);
      a.monthsDelinquent++;
      a.balance = money(a.balance + CONFIG.fees.late);
      s.fees = money(s.fees + CONFIG.fees.late);
      emit(4, "fee", `Missed the minimum payment on ${a.name}. ${dollars(CONFIG.fees.late)} late fee.`, {
        accountId: a.id,
        amount: CONFIG.fees.late,
        fee: "late",
      });
      if (a.monthsDelinquent >= CONFIG.credit.collectionsAfterMonths) {
        sendToCollections(a);
      } else {
        emit(4, "late", `${a.name} is ${a.monthsDelinquent * 30} days late. This goes on your credit report.`, {
          accountId: a.id,
          daysLate: a.monthsDelinquent * 30,
        });
      }
    } else {
      a.monthsDelinquent = 0;
      a.pastDue = 0;
    }
    a.statements.push(s);
    a.statements = a.statements.slice(-CONFIG.credit.statementsKept);
    a.due = a.status === "open" ? { month: M, statementBalance: s.balance, minDue: money(Math.min(a.balance, s.minDue + a.pastDue)) } : null;
    a.paidThisCycle = 0;
  }

  function sendToCollections(a) {
    a.status = "collections";
    a.closedMonth = M;
    a.autopay = null;
    a.reported = true;
    a.due = null;
    emit(4, "collections", `${a.name} went to collections after 120 days unpaid. This hurts your score a lot.`, {
      accountId: a.id,
      amount: amountOwed(a),
    });
  }

  // ---- Step 5: loan, BNPL and bill payments come out of checking ----
  for (const bill of next.bills) {
    if (bill.startsMonth != null && M < bill.startsMonth) continue;
    if (bill.amount <= next.checking) {
      next.checking = money(next.checking - bill.amount);
      emit(5, "bill", `${bill.name} bill paid: ${dollars(bill.amount)}.`, { amount: bill.amount });
      if (bill.monthsLeft != null) bill.monthsLeft--;
    } else {
      bounce(5, `${bill.name} bill`, bill.amount);
    }
  }
  next.bills = next.bills.filter((b) => b.monthsLeft == null || b.monthsLeft > 0);

  for (const a of next.accounts.filter((x) => x.kind === "installment" && isOpen(x))) {
    if (a.firstDueMonth == null || M < a.firstDueMonth) {
      a.paidThisCycle = 0;
      continue;
    }
    const interest = monthlyInterest(a.balance, a.apr);
    a.balance = money(a.balance + interest);
    // The last scheduled payment clears any leftover cents from rounding.
    const scheduled = a.monthsPaid >= a.termMonths - 1 ? a.balance : money(Math.min(a.payment, a.balance));
    const need = money(Math.max(0, scheduled + a.pastDue - a.paidThisCycle));
    let made = need === 0;
    if (!made && a.owner === "cosigned") {
      if (rng.chance(a.reliability)) {
        a.balance = money(a.balance - need);
        made = true;
      } else {
        emit(5, "cosignMissed", `${a.friend} missed a payment of ${dollars(need)} on the account you cosigned. Pay it to protect your report.`, {
          accountId: a.id,
          amount: need,
        });
      }
    } else if (!made) {
      if (need <= next.checking) {
        next.checking = money(next.checking - need);
        a.balance = money(a.balance - need);
        made = true;
        emit(5, "paymentReceived", `${dollars(need)} paid on your ${a.name}.`, { accountId: a.id, amount: need });
      } else {
        bounce(5, `${a.name} payment`, need, a.id);
      }
    }
    if (made) {
      a.monthsDelinquent = 0;
      a.pastDue = 0;
      a.monthsPaid++;
    } else {
      a.pastDue = need;
      a.monthsDelinquent++;
      a.balance = money(a.balance + CONFIG.fees.late);
      emit(5, "fee", `Missed payment on ${a.name}. ${dollars(CONFIG.fees.late)} late fee.`, { accountId: a.id, amount: CONFIG.fees.late, fee: "late" });
      if (a.monthsDelinquent >= CONFIG.credit.collectionsAfterMonths) sendToCollections(a);
      else emit(5, "late", `${a.name} is ${a.monthsDelinquent * 30} days late. This goes on your credit report.`, { accountId: a.id, daysLate: a.monthsDelinquent * 30 });
    }
    a.paidThisCycle = 0;
    if (a.balance <= 0.005 && a.status === "open") finishLoan(a);
  }

  function finishLoan(a) {
    a.balance = 0;
    a.status = "paid";
    a.closedMonth = M;
    emit(5, "paidOff", `${a.name} is paid off. Nice work.`, { accountId: a.id });
    if (a.held) {
      next.heldSavings = money(next.heldSavings - a.held);
      next.savings = money(next.savings + a.held);
      emit(5, "heldFundsReleased", `Your ${dollars(a.held)} from the credit-builder loan moved into savings.`, { accountId: a.id, amount: a.held });
      a.held = 0;
    }
  }

  for (const a of next.accounts.filter((x) => x.kind === "bnpl" && isOpen(x))) {
    const dueNow = a.installments.filter((i) => i.dueMonth <= M && i.paid < i.amount);
    const need = money(dueNow.reduce((s, i) => s + i.amount - i.paid, 0));
    if (need > 0) {
      if (need <= next.checking) {
        applyPayment(next, a, need);
        a.monthsDelinquent = 0;
        emit(5, "paymentReceived", `${dollars(need)} paid on ${a.name}.`, { accountId: a.id, amount: need });
      } else {
        bounce(5, `${a.name} payment`, need, a.id);
        const fee = money(CONFIG.fees.bnplLate * dueNow.length);
        dueNow[0].amount = money(dueNow[0].amount + fee);
        a.balance = money(a.balance + fee);
        a.monthsDelinquent++;
        emit(5, "fee", `Missed a payment on ${a.name}. ${dollars(fee)} late fee.`, { accountId: a.id, amount: fee, fee: "late" });
        if (a.monthsDelinquent >= CONFIG.credit.collectionsAfterMonths) sendToCollections(a);
      }
    }
    a.paidThisCycle = 0;
    if (a.balance <= 0.005 && a.status === "open") {
      a.balance = 0;
      a.status = "paid";
      a.closedMonth = M;
      emit(5, "paidOff", `${a.name} is paid off.`, { accountId: a.id });
    }
  }

  // ---- Step 6: everything is reported to the credit report ----
  let reportedCount = 0;
  for (const a of next.accounts) {
    if (!a.reported) continue;
    let code = null;
    if (a.owner === "authorized") code = a.parentLate ? "30" : "OK";
    else if (a.status === "collections") code = "CO";
    else if (a.status === "open") code = DELINQUENT_CODES[a.monthsDelinquent] || "90";
    else if (a.closedMonth === M) code = a.status === "paid" ? "OK" : null;
    if (code) {
      a.history.push({ month: M, code });
      reportedCount++;
    }
  }
  if (reportedCount > 0) emit(6, "reported", `${reportedCount} account${reportedCount === 1 ? " was" : "s were"} reported to the credit bureau.`);

  // ---- Step 7: accounts age, old inquiries stop counting ----
  next.incomeHistory.push(next.incomeThisMonth);
  next.incomeHistory = next.incomeHistory.slice(-CONFIG.credit.incomeMonthsAveraged);
  next.incomeThisMonth = 0;
  next.month = M + 1;
  next.ageMonths++;
  for (const q of next.inquiries) {
    if (q.hard && q.month === next.month - CONFIG.credit.inquiryCountsMonths) {
      emit(7, "inquiryExpired", `A hard inquiry from ${q.source} stopped counting against your score.`);
    }
  }
  next.inquiries = next.inquiries.filter((q) => q.month > next.month - CONFIG.credit.inquiryShowsMonths);

  // ---- Step 8: score is recalculated ----
  const result = computeScore(buildReport(next));
  next.score = result.score;
  next.factors = result.factors;
  next.scoreHistory.push({ month: next.month, score: result.score });
  const scoreChange = explainChange(prev, result);
  emit(8, "scoreChange", scoreChange.message, { delta: scoreChange.delta, factor: scoreChange.factor, score: result.score });

  return { life: next, events, scoreChange };
}
