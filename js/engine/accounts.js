// Account actions the player takes during a month (time paused).
// Every exported action returns { life, ok, message, ... } and never changes its input.
import { CONFIG } from "../data/config.js";
import { copyLife, findAccount, logAction, monthlyIncome } from "./life.js";
import { rngOn } from "./rng.js";
import { money, dollars } from "./util.js";
import { amortizedPayment } from "./payoff.js";

const fail = (life, message) => ({ life, ok: false, message });

// ---------- shared helpers (mutate the copy they are given) ----------

function newId(life) {
  return "a" + life.nextId++;
}

function baseAccount(life, fields) {
  return {
    id: newId(life),
    owner: "self",
    reported: true,
    openedMonth: life.month,
    closedMonth: null,
    status: "open",
    balance: 0,
    paidThisCycle: 0,
    pastDue: 0,
    monthsDelinquent: 0,
    history: [],
    ...fields,
  };
}

export function isOpen(a) {
  return a.status === "open";
}

export function isRevolving(a) {
  return a.kind === "revolving";
}

export function pendingTotal(a) {
  return (a.pending || []).reduce((s, p) => s + p.amount, 0);
}

export function amountOwed(a) {
  return money(a.balance + pendingTotal(a));
}

export function addInquiry(life, source, hard = true) {
  life.inquiries.push({ month: life.month, source, hard });
}

// ---------- money in and out of checking ----------

export function earn(life, amount, source = "work shift") {
  const next = copyLife(life);
  next.checking = money(next.checking + amount);
  next.incomeThisMonth = money(next.incomeThisMonth + amount);
  logAction(next, "earn", [amount, source]);
  return { life: next, ok: true, message: `You earned ${dollars(amount)}.` };
}

// Money that is not pay, like a gift or a loan handed over in cash.
// It does not count as income when lenders look at what you earn.
export function receiveCash(life, amount, source = "cash") {
  if (!(amount > 0)) return fail(life, "Nothing to receive.");
  const next = copyLife(life);
  next.checking = money(next.checking + amount);
  logAction(next, "receiveCash", [amount, source]);
  return { life: next, ok: true, message: `${dollars(amount)} from ${source} went into checking.` };
}

// months: how many payments before the bill ends (null runs forever).
// A limited bill that bounces stays until it is paid.
// startIn: End Months to wait before the first payment (0 = this one).
export function addBill(life, name, amount, months = null, startIn = 0) {
  const next = copyLife(life);
  next.bills = next.bills.filter((b) => b.name !== name);
  const bill = months == null ? { name, amount } : { name, amount, monthsLeft: months };
  if (startIn > 0) bill.startsMonth = next.month + startIn;
  next.bills.push(bill);
  logAction(next, "addBill", startIn > 0 ? [name, amount, months, startIn] : months == null ? [name, amount] : [name, amount, months]);
  const how = startIn > 0 ? `due in ${startIn} months` : months == null ? "a month" : months === 1 ? "at the end of this month" : `a month for ${months} months`;
  return { life: next, ok: true, message: `${name}: ${dollars(amount)} ${how}.` };
}

export function removeBill(life, name) {
  const next = copyLife(life);
  next.bills = next.bills.filter((b) => b.name !== name);
  logAction(next, "removeBill", [name]);
  return { life: next, ok: true, message: `${name} bill removed.` };
}

// A credit check that is not part of opening an account here, like a store
// card sign-up or checking your own report (soft, no score effect).
export function recordInquiry(life, source, hard = true) {
  const next = copyLife(life);
  addInquiry(next, source, hard);
  logAction(next, "recordInquiry", [source, hard]);
  return { life: next, ok: true, message: hard ? `A hard inquiry from ${source} was added to your report.` : `${source} was a soft inquiry. It does not change your score.` };
}

export function moveToSavings(life, amount) {
  if (amount <= 0 || amount > life.checking) return fail(life, "Not enough in checking.");
  const next = copyLife(life);
  next.checking = money(next.checking - amount);
  next.savings = money(next.savings + amount);
  logAction(next, "moveToSavings", [amount]);
  return { life: next, ok: true, message: `Moved ${dollars(amount)} to savings.` };
}

export function moveToChecking(life, amount) {
  if (amount <= 0 || amount > life.savings) return fail(life, "Not enough in savings.");
  const next = copyLife(life);
  next.savings = money(next.savings - amount);
  next.checking = money(next.checking + amount);
  logAction(next, "moveToChecking", [amount]);
  return { life: next, ok: true, message: `Moved ${dollars(amount)} to checking.` };
}

// ---------- purchases ----------

export function debitPurchase(life, amount, item = "purchase") {
  if (amount <= 0) return fail(life, "Pick something to buy.");
  if (amount > life.checking) return fail(life, `Declined. You only have ${dollars(life.checking)} in checking.`);
  const next = copyLife(life);
  next.checking = money(next.checking - amount);
  logAction(next, "debitPurchase", [amount, item]);
  return { life: next, ok: true, message: `Paid ${dollars(amount)} with debit.` };
}

export function cardPurchase(life, accountId, amount, item = "purchase") {
  const a = findAccount(life, accountId);
  if (!a || !isRevolving(a) || a.owner !== "self" || !isOpen(a)) return fail(life, "That card can't be used.");
  if (amount <= 0) return fail(life, "Pick something to buy.");
  const available = money(a.limit - amountOwed(a));
  if (amount > available) return fail(life, `Declined. Only ${dollars(available)} of credit is left on this card.`);
  const next = copyLife(life);
  findAccount(next, accountId).pending.push({ amount: money(amount), item, month: next.month });
  logAction(next, "cardPurchase", [accountId, amount, item]);
  return { life: next, ok: true, message: `Charged ${dollars(amount)} to ${a.name}.` };
}

// ---------- payments ----------

// Applies a payment from checking to an account. Mutates `life`.
// Returns the amount actually paid (0 if checking is short).
export function applyPayment(life, a, amount) {
  const owed = amountOwed(a);
  const pay = money(Math.min(amount, owed));
  if (pay <= 0 || pay > life.checking) return 0;
  life.checking = money(life.checking - pay);
  // Payments hit the posted balance first, then anything still pending.
  a.balance = money(a.balance - pay);
  if (a.balance < 0 && a.pending) {
    let extra = -a.balance;
    a.balance = 0;
    while (extra > 0 && a.pending.length) {
      const p = a.pending[0];
      const used = Math.min(extra, p.amount);
      p.amount = money(p.amount - used);
      extra = money(extra - used);
      if (p.amount <= 0) a.pending.shift();
    }
  }
  a.paidThisCycle = money(a.paidThisCycle + pay);
  if (a.kind === "bnpl") payBnplInstallments(a, pay);
  if (a.status === "collections" && amountOwed(a) <= 0) a.status = "collectionPaid";
  return pay;
}

function payBnplInstallments(a, amount) {
  let left = amount;
  for (const inst of a.installments) {
    if (left <= 0) break;
    const owed = money(inst.amount - inst.paid);
    const used = Math.min(left, owed);
    inst.paid = money(inst.paid + used);
    left = money(left - used);
  }
}

export function pay(life, accountId, amount) {
  const a = findAccount(life, accountId);
  if (!a || a.owner === "authorized") return fail(life, "You can't pay that account.");
  if (amount <= 0) return fail(life, "Enter an amount to pay.");
  if (amountOwed(a) <= 0) return fail(life, "Nothing is owed on this account.");
  const want = Math.min(amount, amountOwed(a));
  if (want > life.checking) return fail(life, `You only have ${dollars(life.checking)} in checking.`);
  const next = copyLife(life);
  const paid = applyPayment(next, findAccount(next, accountId), amount);
  logAction(next, "pay", [accountId, amount], { paid });
  return { life: next, ok: true, paid, message: `Paid ${dollars(paid)} to ${a.name}.` };
}

// mode: null (off), "min", "full", or a dollar amount.
export function setAutopay(life, accountId, mode) {
  const a = findAccount(life, accountId);
  if (!a || !isRevolving(a) || a.owner !== "self") return fail(life, "AutoPay works on your own cards.");
  const next = copyLife(life);
  findAccount(next, accountId).autopay = mode;
  logAction(next, "setAutopay", [accountId, mode]);
  return { life: next, ok: true, message: mode ? "AutoPay is on." : "AutoPay is off." };
}

// ---------- cards ----------

// Opens an approved card. Mutates `life`. Used by approval.js.
export function openCard(life, terms) {
  const a = baseAccount(life, {
    type: "card",
    kind: "revolving",
    product: terms.product,
    name: terms.name,
    nickname: terms.nickname || "",
    design: terms.design || null,
    issuer: terms.issuer,
    network: terms.network,
    icon: terms.icon,
    limit: terms.limit,
    apr: terms.apr,
    annualFee: terms.annualFee,
    secured: Boolean(terms.secured),
    deposit: terms.secured ? terms.limit : 0,
    pending: [],
    due: null,
    autopay: null,
    statements: [],
  });
  if (a.secured) life.checking = money(life.checking - a.deposit);
  life.accounts.push(a);
  return a;
}

export function closeAccount(life, accountId) {
  const a = findAccount(life, accountId);
  if (!a || !isRevolving(a) || a.owner !== "self" || !isOpen(a)) return fail(life, "That card can't be closed.");
  if (amountOwed(a) > 0) return fail(life, "Pay the balance to zero before closing this card.");
  const next = copyLife(life);
  const c = findAccount(next, accountId);
  c.status = "closed";
  c.closedMonth = next.month;
  c.autopay = null;
  let message = `${c.name} is closed.`;
  if (c.secured && c.deposit > 0) {
    next.checking = money(next.checking + c.deposit);
    message += ` Your ${dollars(c.deposit)} deposit came back to checking.`;
    c.deposit = 0;
  }
  logAction(next, "closeAccount", [accountId]);
  return { life: next, ok: true, message };
}

// Secured card graduates to unsecured. The deposit comes back.
export function upgradeSecured(life, accountId, newLimit) {
  const a = findAccount(life, accountId);
  if (!a || !a.secured || !isOpen(a)) return fail(life, "That card is not a secured card.");
  const next = copyLife(life);
  const c = findAccount(next, accountId);
  next.checking = money(next.checking + c.deposit);
  const back = c.deposit;
  c.deposit = 0;
  c.secured = false;
  if (newLimit) c.limit = newLimit;
  logAction(next, "upgradeSecured", [accountId, newLimit ?? null]);
  return { life: next, ok: true, message: `Your card is now unsecured. Your ${dollars(back)} deposit came back.` };
}

export function raiseLimit(life, accountId, newLimit) {
  const a = findAccount(life, accountId);
  if (!a || !isRevolving(a) || a.owner !== "self" || !isOpen(a) || a.secured) return fail(life, "That card can't get a higher limit.");
  if (!(newLimit > a.limit)) return fail(life, "The new limit has to be higher.");
  const next = copyLife(life);
  const before = a.limit;
  findAccount(next, accountId).limit = newLimit;
  logAction(next, "raiseLimit", [accountId, newLimit]);
  return { life: next, ok: true, message: `${a.name} limit went from ${dollars(before)} to ${dollars(newLimit)}.` };
}

// ---------- authorized user (SPEC §6) ----------

// The game secretly picks the parent unless a profile key is given.
export function joinAsAuthorizedUser(life, profileKey = null) {
  if (life.accounts.some((a) => a.owner === "authorized" && a.status === "open")) {
    return fail(life, "You are already on a parent's card.");
  }
  const next = copyLife(life);
  const rng = rngOn(next);
  const key = profileKey || rng.pick(Object.keys(CONFIG.parents));
  const p = CONFIG.parents[key];
  const a = baseAccount(next, {
    type: "authorizedUser",
    kind: "revolving",
    owner: "authorized",
    parentProfile: key,
    name: "Parent's card",
    icon: "🔷",
    limit: p.limit,
    apr: 0.24,
    openedMonth: next.month - p.ageMonths,
  });
  a.balance = money(p.limit * rng.range(...p.utilization));
  // The parent's recent history comes along onto your report.
  const backMonths = Math.min(p.ageMonths, CONFIG.credit.reportGridMonths);
  for (let m = next.month - backMonths; m < next.month; m++) {
    a.history.push({ month: m, code: rng.chance(p.lateChance) ? "30" : "OK" });
  }
  next.accounts.push(a);
  logAction(next, "joinAsAuthorizedUser", [profileKey], { parentProfile: key });
  return { life: next, ok: true, accountId: a.id, message: "You were added to a parent's card. Its history now shows on your report." };
}

// Removing yourself takes the whole account off your report.
export function removeAuthorizedUser(life) {
  const a = life.accounts.find((x) => x.owner === "authorized");
  if (!a) return fail(life, "You are not on a parent's card.");
  const next = copyLife(life);
  next.accounts = next.accounts.filter((x) => x.id !== a.id);
  logAction(next, "removeAuthorizedUser", []);
  return { life: next, ok: true, message: "You are off the parent's card. It no longer shows on your report." };
}

// ---------- installment loans ----------

function openInstallment(life, fields) {
  const a = baseAccount(life, { kind: "installment", monthsPaid: 0, ...fields });
  a.payment = amortizedPayment(a.original, a.apr, a.termMonths);
  life.accounts.push(a);
  return a;
}

// $500 is held in savings while you pay it off. You get it at the end.
export function openCreditBuilderLoan(life) {
  const cfg = CONFIG.loans.creditBuilder;
  const next = copyLife(life);
  addInquiry(next, "Credit union credit-builder loan");
  const a = openInstallment(next, {
    type: "creditBuilderLoan",
    name: "Credit-builder loan",
    icon: "🤝",
    issuer: "creditUnion",
    original: cfg.amount,
    balance: cfg.amount,
    apr: cfg.apr,
    termMonths: cfg.termMonths,
    firstDueMonth: next.month + 1,
    held: cfg.amount,
  });
  next.heldSavings = money(next.heldSavings + cfg.amount);
  logAction(next, "openCreditBuilderLoan", []);
  return {
    life: next,
    ok: true,
    accountId: a.id,
    message: `Loan opened. ${dollars(cfg.amount)} is held in savings. Pay ${dollars(a.payment)} a month for ${cfg.termMonths} months to unlock it.`,
  };
}

export function autoLoanApr(score) {
  const cfg = CONFIG.loans;
  if (score == null) return cfg.autoAprNoScore;
  return cfg.autoAprByScore.find((r) => score >= r.minScore).apr;
}

// aprBump: extra APR a dealer adds on top of the rate your score earns.
export function quoteAutoLoan(life, { price, downPayment = 0, termMonths = 60, aprBump = 0 }) {
  const amount = money(price - downPayment);
  const apr = Math.round((autoLoanApr(life.score) + aprBump) * 10000) / 10000;
  const payment = amortizedPayment(amount, apr, termMonths);
  const totalInterest = money(payment * termMonths - amount);
  const approved = life.score == null || life.score >= CONFIG.loans.autoMinScore;
  return { amount, apr, termMonths, payment, totalInterest, approved };
}

export function openAutoLoan(life, { price, downPayment = 0, termMonths = 60, lender = "creditUnion", aprBump = 0 }) {
  if (downPayment > life.checking) return fail(life, "You don't have that much for a down payment.");
  const q = quoteAutoLoan(life, { price, downPayment, termMonths, aprBump });
  const args = [aprBump ? { price, downPayment, termMonths, lender, aprBump } : { price, downPayment, termMonths, lender }];
  const next = copyLife(life);
  addInquiry(next, "Auto loan");
  if (!q.approved) {
    logAction(next, "openAutoLoan", args, { approved: false });
    return { life: next, ok: false, quote: q, message: "Denied. Your score is too low for this loan right now." };
  }
  next.checking = money(next.checking - downPayment);
  const a = openInstallment(next, {
    type: "autoLoan",
    name: "Auto loan",
    icon: "🚗",
    issuer: lender,
    original: q.amount,
    balance: q.amount,
    apr: q.apr,
    termMonths,
    firstDueMonth: next.month + 1,
  });
  logAction(next, "openAutoLoan", args, { approved: true });
  return { life: next, ok: true, accountId: a.id, quote: q, message: `Approved at ${(q.apr * 100).toFixed(1)}% APR. Payment ${dollars(q.payment)} a month.` };
}

// A store or lender pays for something now and you pay it back monthly
// (a couch, cottage repairs). The money goes straight to the seller, so only
// the down payment leaves checking. Approval looks at the payment against
// income: lenders want it to fit your budget.
export function quotePurchaseLoan(life, { price, downPayment = 0, termMonths = 12, apr = CONFIG.loans.purchase.apr }) {
  const amount = money(price - downPayment);
  const payment = amortizedPayment(amount, apr, termMonths);
  const income = monthlyIncome(life);
  const fits = payment <= Math.max(CONFIG.loans.purchase.minIncome, income) * CONFIG.loans.purchase.maxPaymentShare;
  const approved = fits || (life.score != null && life.score >= CONFIG.loans.purchase.scoreOverride);
  return { amount, apr, termMonths, payment, totalInterest: money(payment * termMonths - amount), approved };
}

export function openPurchaseLoan(life, { item, price, downPayment = 0, termMonths = 12, apr = CONFIG.loans.purchase.apr, lender = "creditUnion", type = "purchaseLoan", icon = "🧾" }) {
  if (downPayment > life.checking) return fail(life, "You don't have that much for a down payment.");
  const q = quotePurchaseLoan(life, { price, downPayment, termMonths, apr });
  const args = [{ item, price, downPayment, termMonths, apr, lender, type, icon }];
  const next = copyLife(life);
  addInquiry(next, `${item} loan`);
  if (!q.approved) {
    logAction(next, "openPurchaseLoan", args, { approved: false });
    return { life: next, ok: false, quote: q, message: `Denied. A ${dollars(q.payment)} monthly payment is too big for your income right now.` };
  }
  next.checking = money(next.checking - downPayment);
  const a = openInstallment(next, { type, name: `${item[0].toUpperCase()}${item.slice(1)} loan`, icon, issuer: lender, original: q.amount, balance: q.amount, apr, termMonths, firstDueMonth: next.month + 1 });
  logAction(next, "openPurchaseLoan", args, { approved: true });
  return { life: next, ok: true, accountId: a.id, quote: q, message: `Approved. Pay ${dollars(q.payment)} a month for ${termMonths} months.` };
}

// Deferred while in school. Repayment starts after the grace period.
export function openFederalStudentLoan(life, amount) {
  const cfg = CONFIG.loans.federalStudent;
  const next = copyLife(life);
  next.checking = money(next.checking + amount);
  const a = openInstallment(next, {
    type: "studentLoan",
    name: "Federal student loan",
    icon: "🎓",
    issuer: "federal",
    original: amount,
    balance: amount,
    apr: cfg.apr,
    termMonths: cfg.termMonths,
    firstDueMonth: next.inSchool ? null : next.month + cfg.graceMonths,
  });
  logAction(next, "openFederalStudentLoan", [amount]);
  return { life: next, ok: true, accountId: a.id, message: `Student loan of ${dollars(amount)} received. Payments wait until after school.` };
}

// A bank loan for school. A higher rate than federal, and no waiting: payments start next month.
export function openPrivateStudentLoan(life, amount) {
  const cfg = CONFIG.loans.privateStudent;
  const next = copyLife(life);
  addInquiry(next, "Private student loan");
  next.checking = money(next.checking + amount);
  const a = openInstallment(next, {
    type: "privateStudentLoan",
    name: "Private student loan",
    icon: "🏦",
    issuer: "bank",
    original: amount,
    balance: amount,
    apr: cfg.apr,
    termMonths: cfg.termMonths,
    firstDueMonth: next.month + 1,
  });
  logAction(next, "openPrivateStudentLoan", [amount]);
  return { life: next, ok: true, accountId: a.id, message: `Private loan of ${dollars(amount)} received. Payments of ${dollars(a.payment)} start next month.` };
}

export function leaveSchool(life) {
  const next = copyLife(life);
  next.inSchool = false;
  next.leftSchoolMonth = next.month;
  for (const a of next.accounts) {
    if (a.type === "studentLoan" && a.firstDueMonth == null) {
      a.firstDueMonth = next.month + CONFIG.loans.federalStudent.graceMonths;
    }
  }
  logAction(next, "leaveSchool", []);
  return { life: next, ok: true, message: "You finished school. Student loan payments start in 6 months." };
}

export function startSchool(life) {
  const next = copyLife(life);
  next.inSchool = true;
  logAction(next, "startSchool", []);
  return { life: next, ok: true, message: "You started school." };
}

// A friend's account with your name on it. Their misses land on your report.
export function cosign(life, { friend = "your friend", amount = 600, termMonths = 24, apr = 0.15, reliability = 0.8 } = {}) {
  const next = copyLife(life);
  addInquiry(next, `Cosigned account for ${friend}`);
  const a = openInstallment(next, {
    type: "cosigned",
    owner: "cosigned",
    name: `Cosigned for ${friend}`,
    icon: "🤝",
    issuer: "lender",
    original: amount,
    balance: amount,
    apr,
    termMonths,
    firstDueMonth: next.month + 1,
    friend,
    reliability,
  });
  logAction(next, "cosign", [{ friend, amount, termMonths, apr, reliability }]);
  return { life: next, ok: true, accountId: a.id, message: `You cosigned for ${friend}. If they miss a payment, it shows on your report.` };
}

// ---------- collections (an ignored bill) ----------

// A bill that was never paid, sold to a collection agency. It shows on the
// report as a collection until it's paid, and as a paid collection after.
export function addCollection(life, name, amount) {
  const next = copyLife(life);
  const a = baseAccount(next, {
    type: "collection",
    kind: "collection",
    name: `${name} (in collections)`,
    icon: "🚨",
    original: money(amount),
    balance: money(amount),
    status: "collections",
    closedMonth: next.month,
  });
  next.accounts.push(a);
  logAction(next, "addCollection", [name, amount]);
  return { life: next, ok: true, accountId: a.id, message: `${name} went to collections. It's on your credit report now.` };
}

// ---------- buy now, pay later ----------

export function buyWithBnpl(life, amount, item = "purchase", merchant = "BNPL plan") {
  const schedule = CONFIG.bnpl.schedule;
  const parts = schedule.map((s) => money(amount * s));
  parts[parts.length - 1] = money(amount - parts.slice(0, -1).reduce((x, y) => x + y, 0));
  if (parts[0] > life.checking) return fail(life, `Declined. The first payment of ${dollars(parts[0])} needs to come from checking.`);
  const next = copyLife(life);
  const a = baseAccount(next, {
    type: "bnpl",
    kind: "bnpl",
    reported: false,
    name: `${merchant}: ${item}`,
    icon: "🧾",
    original: money(amount),
    balance: money(amount - parts[0]),
    installments: parts.slice(1).map((p, i) => ({ amount: p, dueMonth: next.month + i, paid: 0 })),
  });
  next.checking = money(next.checking - parts[0]);
  next.accounts.push(a);
  logAction(next, "buyWithBnpl", [amount, item, merchant]);
  return {
    life: next,
    ok: true,
    accountId: a.id,
    message: `Paid ${dollars(parts[0])} today. ${parts.length - 1} more payments come out of checking automatically.`,
  };
}
