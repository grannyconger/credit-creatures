// Decision cards (SPEC §13). One object per scenario. Add new ones here, never in engine code.
// Plain language for a 15-year-old. No em-dashes, no semicolons.
//
// Shape:
//   id, group ("types" | "costs" | "pitfalls" | "profile"), standards [1, 2, 3, 5]
//   icon, title, minChapter (default 2), once (default true), weight, priority (shown first),
//   replay (default true: may come back when the deck reshuffles, CONFIG.pacing.replayFromChapter)
//   fits(life, ctx) -> boolean. ctx = { chapter, seen, lastChange }
//   text(life, ctx) -> string or [strings]
//   choices(life, ctx) -> [{ key, label, detail, cost: { amount, item, methods }, steps,
//     disabled (a reason string), outcome (string or (result, life) => string),
//     quality ("good" | "ok" | "bad"), factor: { key, dir: "up" | "down" }, math, quiz }]
// Steps are engine actions by name (js/engine/actions.js), so replay can redo them.
import { CONFIG } from "./config.js";
import {
  dollars,
  amountOwed,
  quoteAutoLoan,
  amortizedPayment,
  minimumOnlyPlan,
  payoffPlan,
  ownCards,
  utilization,
  buildReport,
  hardInquiriesInWindow,
  FACTOR_LABELS,
} from "../engine/index.js";
import { EARLY_SCENARIOS } from "./scenarios-early.js";
import { LATE_SCENARIOS } from "./scenarios-late.js";

const pct = (x) => `${Math.round(x * 100)}%`;
const apr = (x) => `${(x * 100).toFixed(1)}%`;
const hasType = (life, type) => life.accounts.some((a) => a.type === type);
const openOfType = (life, type) => life.accounts.find((a) => a.type === type && a.status === "open");
const everHadCard = (life) => life.accounts.some((a) => a.type === "card" && a.owner === "self");
const noLates = (a) => a.history.every((h) => h.code === "OK") && a.monthsDelinquent === 0;
const short = (life, amount) => (life.checking < amount ? `You only have ${dollars(life.checking)} in checking.` : null);
const approvedText = (r, yes, no) => (r.results.at(-1)?.approved ? yes : no);

// Score parts the "Why did my score drop?" card asks about.
const FACTOR_KEYS = ["payment", "owed", "length", "mix", "newCredit"];

export const SCENARIOS = [
  // ---------------- Types of credit (Std 1) ----------------
  {
    id: "securedSecondChance",
    group: "types",
    standards: [1],
    icon: "🤝",
    title: "A card made for starting out",
    priority: 3,
    fits: (life) => !everHadCard(life) && life.checking >= 220,
    text: () => [
      "Truliant Federal Credit Union offers a secured card. You put down a $200 deposit, and that deposit becomes your limit.",
      "Because your own money backs it, almost everyone gets approved. Pay it on time and it builds your credit history.",
    ],
    choices: () => [
      {
        key: "apply",
        label: "Apply with a $200 deposit",
        steps: [["applyForCard", { issuer: "truliant", product: "secured", requestedLimit: 200, design: "plasticBlue" }]],
        outcome: (r) =>
          approvedText(
            r,
            "Approved! $200 moved from checking into the deposit. Use the card for small things and pay the statement in full.",
            "Denied this time. The application still added a hard inquiry."
          ),
        quality: "good",
        factor: { key: "mix", dir: "up" },
      },
      { key: "wait", label: "Wait for now", outcome: "You kept your $200. Without a card or loan, you still have no credit history.", quality: "ok" },
    ],
  },
  {
    id: "creditBuilder",
    group: "types",
    standards: [1],
    icon: "🧱",
    title: "A credit-builder loan",
    weight: 1.2,
    fits: (life) => !hasType(life, "creditBuilderLoan") && life.checking >= 60,
    text: () => {
      const c = CONFIG.loans.creditBuilder;
      const pay = amortizedPayment(c.amount, c.apr, c.termMonths);
      return [
        `Greenville Federal Credit Union offers a credit-builder loan. They lock ${dollars(c.amount)} in a savings account for you.`,
        `You pay ${dollars(pay)} a month for ${c.termMonths} months. When you finish, the ${dollars(c.amount)} is yours, and every on-time payment goes on your report.`,
      ];
    },
    choices: (life) => {
      const c = CONFIG.loans.creditBuilder;
      const pay = amortizedPayment(c.amount, c.apr, c.termMonths);
      return [
        {
          key: "open",
          label: "Open the loan",
          detail: `${dollars(pay)} a month comes out of checking at each End Month.`,
          steps: [["openCreditBuilderLoan"]],
          outcome: "Loan opened. It adds a hard inquiry today, but on-time payments build history and add a new kind of credit.",
          quality: "good",
          factor: { key: "mix", dir: "up" },
          math: `${c.termMonths} payments of ${dollars(pay)} = ${dollars(pay * c.termMonths)}. You get ${dollars(c.amount)} back, so it costs about ${dollars(pay * c.termMonths - c.amount)} in interest.`,
        },
        { key: "skip", label: "No thanks", outcome: "No new payment and no new history.", quality: "ok" },
      ];
    },
  },
  {
    id: "prescreened",
    group: "types",
    standards: [1, 3],
    icon: "✉️",
    title: "You're prescreened!",
    fits: (life) => life.score != null && ownCards(life).length < 2 && !life.accounts.some((a) => a.product === "student" && a.status === "open"),
    text: () => [
      "A shiny letter says: \"You're prescreened for the Discover it Student card!\"",
      "Prescreened means Discover peeked at your report with a soft inquiry. That doesn't change your score. Applying is a hard inquiry, and approval is not promised.",
    ],
    choices: () => [
      {
        key: "apply",
        label: "Apply for it",
        steps: [["applyForCard", { issuer: "discover", product: "student", requestedLimit: 500, design: "plasticPurple" }]],
        outcome: (r) =>
          approvedText(
            r,
            "Approved! A second card raises your total limit, which can lower your utilization. It also adds a hard inquiry and a new account.",
            "Denied. Prescreened is not the same as approved. The hard inquiry stays on your report."
          ),
        quality: "ok",
        factor: { key: "newCredit", dir: "down" },
      },
      { key: "shred", label: "Shred the letter", outcome: "No inquiry, no new account. Your report stays the same.", quality: "good" },
    ],
  },
  {
    id: "securedUpgrade",
    group: "types",
    standards: [1],
    icon: "🎓",
    title: "Your card graduates",
    priority: 2,
    fits: (life) => life.accounts.some((a) => a.secured && a.status === "open" && life.month - a.openedMonth >= 6 && noLates(a)),
    text: (life) => {
      const a = life.accounts.find((x) => x.secured && x.status === "open");
      return [
        `Your issuer looked at ${life.month - a.openedMonth} months of on-time payments on your ${a.name}.`,
        `They offer to turn it into a regular card with a $500 limit and send your ${dollars(a.deposit)} deposit back to checking.`,
      ];
    },
    choices: (life) => {
      const a = life.accounts.find((x) => x.secured && x.status === "open");
      return [
        {
          key: "upgrade",
          label: "Yes, upgrade my card",
          steps: [["upgradeSecured", a.id, Math.max(500, a.limit)]],
          outcome: "Your deposit is back in checking and your limit went up. Same account, so your history keeps its age.",
          quality: "good",
          factor: { key: "owed", dir: "up" },
        },
        { key: "keep", label: "Keep it secured", outcome: "Nothing changes. Your deposit stays with the issuer.", quality: "ok" },
      ];
    },
  },
  {
    id: "limitIncrease",
    group: "types",
    standards: [1, 2],
    icon: "⬆️",
    title: "A higher limit?",
    fits: (life) => ownCards(life).some((a) => !a.secured && life.month - a.openedMonth >= 6 && noLates(a)),
    text: (life) => {
      const a = ownCards(life).find((x) => !x.secured && life.month - x.openedMonth >= 6 && noLates(x));
      const newLimit = Math.round((a.limit * 1.5) / 50) * 50;
      const owed = amountOwed(a);
      return [
        `${a.name} offers to raise your limit from ${dollars(a.limit)} to ${dollars(newLimit)}. They won't do a hard inquiry.`,
        `You owe ${dollars(owed)} on it now. That is ${pct(owed / a.limit)} of your limit today, or ${pct(owed / newLimit)} of the new one.`,
      ];
    },
    choices: (life) => {
      const a = ownCards(life).find((x) => !x.secured && life.month - x.openedMonth >= 6 && noLates(x));
      const newLimit = Math.round((a.limit * 1.5) / 50) * 50;
      return [
        {
          key: "accept",
          label: "Accept the new limit",
          steps: [["raiseLimit", a.id, newLimit]],
          outcome: "Same balance, bigger limit, so your utilization went down. Just don't treat the extra room as extra money.",
          quality: "good",
          factor: { key: "owed", dir: "up" },
        },
        { key: "decline", label: "No thanks", outcome: "Your limit stays the same. That's fine if you keep your balance low.", quality: "ok" },
      ];
    },
  },
  {
    id: "carDecision",
    group: "types",
    standards: [1, 2],
    icon: "🚗",
    title: "A car of your own?",
    minChapter: 3,
    weight: 2,
    fits: (life) => !hasType(life, "autoLoan") && life.checking >= 550,
    text: () => [
      "The bus is slow and your bus pass costs $30 a month. A used car costs $4,000. Gas and insurance would add about $90 a month.",
      "Truliant, a local credit union, wants $500 down for a 48-month loan. The dealer offers $0 down for 72 months, but adds to the rate.",
    ],
    choices: (life) => {
      const cu = quoteAutoLoan(life, { price: 4000, downPayment: 500, termMonths: 48 });
      const dealer = quoteAutoLoan(life, { price: 4000, downPayment: 0, termMonths: 72, aprBump: 0.04 });
      const carBills = [["removeBill", "Bus pass"], ["addBill", "Gas and insurance", 90]];
      const denied = "Denied. Your score is too low for this loan right now. The application still added a hard inquiry.";
      return [
        {
          key: "creditUnion",
          label: `Truliant loan: ${dollars(cu.payment)}/month`,
          detail: `$500 down, ${apr(cu.apr)} APR, 48 months`,
          steps: [["openAutoLoan", { price: 4000, downPayment: 500, termMonths: 48, lender: "creditUnion" }], ...carBills],
          outcome: (r) => (r.denied ? denied : "You got the car. A loan you pay on time builds history and adds an installment loan to your credit mix."),
          quality: "ok",
          factor: { key: "mix", dir: "up" },
          math: `Truliant: ${dollars(cu.amount)} at ${apr(cu.apr)} for 48 months = ${dollars(cu.payment)} a month and ${dollars(cu.totalInterest)} in interest.`,
        },
        {
          key: "dealer",
          label: `Dealer financing: ${dollars(dealer.payment)}/month`,
          detail: `$0 down, ${apr(dealer.apr)} APR, 72 months`,
          steps: [["openAutoLoan", { price: 4000, downPayment: 0, termMonths: 72, lender: "dealer", aprBump: 0.04 }], ...carBills],
          outcome: (r) => (r.denied ? denied : "You got the car with nothing down, but you'll pay for it for 6 years and pay much more interest."),
          quality: "bad",
          factor: { key: "mix", dir: "up" },
          math: `Dealer: ${dollars(dealer.amount)} at ${apr(dealer.apr)} for 72 months = ${dollars(dealer.payment)} a month and ${dollars(dealer.totalInterest)} in interest. That is ${dollars(dealer.totalInterest - cu.totalInterest)} more than Truliant.`,
        },
        { key: "bus", label: "Keep taking the bus", outcome: "No loan, no inquiry. Your $30 bus pass is still the cheapest ride in the kingdom.", quality: "good" },
      ];
    },
  },
  {
    id: "studentLoan",
    group: "types",
    standards: [1],
    icon: "📚",
    title: "Paying for classes",
    weight: 1.5,
    fits: (life) => !life.inSchool && !hasType(life, "studentLoan") && !hasType(life, "privateStudentLoan"),
    text: () => [
      "The Market Village Community College accepted you for classes. Tuition and books cost $2,400.",
      `A federal student loan charges ${apr(CONFIG.loans.federalStudent.apr)} and waits until after school for payments. A bank's private loan charges ${apr(CONFIG.loans.privateStudent.apr)} and payments start next month.`,
    ],
    choices: () => {
      const fed = CONFIG.loans.federalStudent;
      const priv = CONFIG.loans.privateStudent;
      const privPay = amortizedPayment(2400, priv.apr, priv.termMonths);
      return [
        {
          key: "federal",
          label: "Federal student loan",
          steps: [["startSchool"], ["openFederalStudentLoan", 2400], ["debitPurchase", 2400, "tuition and books"]],
          outcome: `You're in school. No payments until ${fed.graceMonths} months after you finish.`,
          quality: "good",
          factor: { key: "mix", dir: "up" },
          math: `Federal: ${apr(fed.apr)}, payments wait. Private: ${apr(priv.apr)}, ${dollars(privPay)} a month starting next month.`,
        },
        {
          key: "private",
          label: "Private bank loan",
          detail: `${dollars(privPay)} a month starts next month`,
          steps: [["startSchool"], ["openPrivateStudentLoan", 2400], ["debitPurchase", 2400, "tuition and books"]],
          outcome: "You're in school, but now a monthly payment comes out of checking while you study.",
          quality: "bad",
          factor: { key: "mix", dir: "up" },
          math: `Private: ${dollars(2400)} at ${apr(priv.apr)} for ${priv.termMonths} months = ${dollars(privPay)} a month and ${dollars(privPay * priv.termMonths - 2400)} in interest.`,
        },
        { key: "notYet", label: "Not this year", outcome: "No loan for now. You can still take classes later.", quality: "ok" },
      ];
    },
  },
  {
    id: "graduation",
    group: "types",
    standards: [1],
    icon: "🎉",
    title: "You finished your classes!",
    priority: 1,
    fits: (life) => life.inSchool && life.log.some((e) => e.action === "startSchool" && e.month <= life.month - 6),
    text: () => [
      "Congratulations! You finished your classes at the community college.",
      `If you have a federal student loan, payments start in ${CONFIG.loans.federalStudent.graceMonths} months. That wait is called a grace period.`,
    ],
    choices: () => [
      { key: "celebrate", label: "Celebrate 🎓", steps: [["leaveSchool"]], outcome: "Plan ahead for the payments that start after the grace period.", quality: "good" },
    ],
  },

  // ---------------- Costs of credit (Std 2) ----------------
  {
    id: "storeCard",
    group: "costs",
    standards: [1, 2],
    icon: "🏬",
    title: "20% off today?",
    fits: (life) => life.checking >= 130,
    text: () => [
      "You're buying a $120 winter coat at Hollow Oak Outfitters. The cashier says: \"Open our store card and save 20% today!\"",
      "The store card has a 30% APR. Opening it means a hard inquiry.",
    ],
    choices: (life) => {
      const yearInterest = Math.round(96 * 0.3);
      return [
        {
          key: "open",
          label: "Open the store card and save $24",
          steps: [["recordInquiry", "Hollow Oak store card"], ["debitPurchase", 96, "winter coat (store card, paid off)"]],
          disabled: short(life, 96),
          outcome: "You saved $24 and paid the store card off on the first bill. The hard inquiry stays on your report for 2 years.",
          quality: "ok",
          factor: { key: "newCredit", dir: "down" },
          math: `If you had carried that $96 for a year at 30% APR, interest would be about ${dollars(yearInterest)}. That's more than the $24 you saved.`,
        },
        {
          key: "pay",
          label: "No thanks, just buy the coat",
          cost: { amount: 120, item: "winter coat", methods: ["debit", "card"] },
          outcome: "You paid full price and kept your report clean.",
          quality: "good",
        },
        { key: "skip", label: "Skip the coat", outcome: "Your old coat will do for one more winter.", quality: "ok" },
      ];
    },
  },
  {
    id: "minimumTrap",
    group: "costs",
    standards: [2],
    icon: "🪤",
    title: "The minimum payment trap",
    once: false,
    weight: 0.8,
    fits: (life) => ownCards(life).some((a) => a.due && a.due.statementBalance >= 100 && a.paidThisCycle < a.due.statementBalance),
    text: (life) => {
      const a = ownCards(life).find((x) => x.due && x.due.statementBalance >= 100 && x.paidThisCycle < x.due.statementBalance);
      return [
        `Your ${a.name} statement says you owe ${dollars(a.due.statementBalance)}. The minimum due is only ${dollars(a.due.minDue)}.`,
        "Paying just the minimum keeps you out of trouble this month. But interest keeps growing on the rest.",
      ];
    },
    choices: (life) => {
      const a = ownCards(life).find((x) => x.due && x.due.statementBalance >= 100 && x.paidThisCycle < x.due.statementBalance);
      const bal = a.due.statementBalance;
      const minLeft = Math.max(0, a.due.minDue - a.paidThisCycle);
      const fullLeft = Math.max(0, bal - a.paidThisCycle);
      const middle = Math.min(fullLeft, Math.round(a.due.minDue * 3));
      const minPlan = minimumOnlyPlan(bal, a.apr);
      const midPlan = payoffPlan(bal, a.apr, middle);
      const math = `Minimum only: ${minPlan.months} months and ${dollars(minPlan.totalInterest)} interest. ${dollars(middle)} a month: ${midPlan.months} months and ${dollars(midPlan.totalInterest)} interest. Full balance: $0 interest.`;
      return [
        {
          key: "full",
          label: `Pay the full ${dollars(fullLeft)}`,
          steps: [["pay", a.id, fullLeft]],
          disabled: short(life, fullLeft),
          outcome: "Paid in full. No interest this month, and your utilization drops.",
          quality: "good",
          factor: { key: "owed", dir: "up" },
          math,
        },
        {
          key: "middle",
          label: `Pay ${dollars(middle)}`,
          steps: [["pay", a.id, middle]],
          disabled: middle <= minLeft ? "That's no more than the minimum." : short(life, middle),
          outcome: "On time, and you paid down more than the minimum. Interest still grows on what's left.",
          quality: "ok",
          math,
        },
        {
          key: "minimum",
          label: minLeft > 0 ? `Pay only the ${dollars(minLeft)} minimum` : "Pay nothing more (minimum already paid)",
          steps: minLeft > 0 ? [["pay", a.id, minLeft]] : [],
          disabled: short(life, minLeft),
          outcome: "You're on time, but most of the balance stays and interest is charged on it.",
          quality: "bad",
          factor: { key: "owed", dir: "down" },
          math,
        },
      ];
    },
  },
  {
    id: "cashAdvance",
    group: "costs",
    standards: [2],
    icon: "🏧",
    title: "Cash from your card?",
    fits: (life) => life.checking < 120 && ownCards(life).some((a) => a.limit - amountOwed(a) >= 120),
    text: () => [
      "Friends are buying $100 concert tickets, cash only. Checking is low, but the ATM will give you a cash advance from your credit card.",
      `A cash advance has a fee (${pct(CONFIG.play.cashAdvanceFee.percent)}, at least ${dollars(CONFIG.play.cashAdvanceFee.min)}) and interest starts the same day. There is no grace period.`,
    ],
    choices: (life) => {
      const a = ownCards(life).find((x) => x.limit - amountOwed(x) >= 120);
      const f = CONFIG.play.cashAdvanceFee;
      const fee = Math.max(f.min, Math.round(100 * f.percent));
      return [
        {
          key: "advance",
          label: `Take a $100 cash advance`,
          steps: [["cardPurchase", a.id, 100 + fee, "concert ticket (cash advance and fee)"]],
          outcome: `You're going to the concert. It cost $100 plus a ${dollars(fee)} fee on your card, and interest starts right away.`,
          quality: "bad",
          factor: { key: "owed", dir: "down" },
          math: `$100 + ${dollars(fee)} fee = ${dollars(100 + fee)} added to ${a.name}.`,
        },
        { key: "skip", label: "Skip this concert", outcome: "No fee, no interest. There will be other concerts.", quality: "good" },
      ];
    },
  },
  {
    id: "lateRecovery",
    group: "costs",
    standards: [2],
    icon: "⏰",
    title: "You missed a payment",
    once: false,
    priority: 5,
    fits: (life) => ownCards(life).some((a) => a.pastDue > 0 && a.due && a.due.minDue > a.paidThisCycle),
    text: (life) => {
      const a = ownCards(life).find((x) => x.pastDue > 0 && x.due);
      return [
        `Your ${a.name} is ${a.monthsDelinquent * 30} days late. A ${dollars(CONFIG.fees.late)} late fee was added.`,
        `Each month it stays unpaid, the late mark gets worse. After 120 days it goes to collections. You need ${dollars(Math.max(0, a.due.minDue - a.paidThisCycle))} to catch up.`,
      ];
    },
    choices: (life) => {
      const a = ownCards(life).find((x) => x.pastDue > 0 && x.due);
      const need = Math.max(0, a.due.minDue - a.paidThisCycle);
      return [
        {
          key: "catchUp",
          label: `Pay ${dollars(need)} now`,
          steps: need > 0 ? [["pay", a.id, need]] : [],
          disabled: short(life, need),
          outcome: "You're caught up. The late mark stays on your report, but it stops getting worse.",
          quality: "good",
          factor: { key: "payment", dir: "up" },
        },
        {
          key: "autopay",
          label: `Pay ${dollars(need)} and turn on AutoPay`,
          steps: need > 0 ? [["pay", a.id, need], ["setAutopay", a.id, "min"]] : [["setAutopay", a.id, "min"]],
          disabled: short(life, need),
          outcome: "Caught up, and AutoPay will pay at least the minimum from now on. Keep enough in checking so it doesn't bounce.",
          quality: "good",
          factor: { key: "payment", dir: "up" },
        },
        { key: "wait", label: "Wait until next month", outcome: "The account stays late. Another late mark is coming at End Month.", quality: "bad", factor: { key: "payment", dir: "down" } },
      ];
    },
  },

  // ---------------- Pitfalls (Std 5) ----------------
  {
    id: "paydayLoan",
    group: "pitfalls",
    standards: [5],
    icon: "💵",
    title: "Quick cash?",
    minChapter: 3,
    weight: 1.5,
    fits: (life) => life.checking < 150,
    text: () => [
      "Checking is low and your bills come out at the end of the month. A Quick Cash store offers a payday loan: $300 now, pay back $345 in two weeks. No credit check!",
      "Greenville Federal Credit Union offers a small loan instead: $300, paid back over 3 months.",
    ],
    choices: (life) => [
      {
        key: "payday",
        label: "Take the payday loan",
        steps: [["receiveCash", 300, "Quick Cash payday loan"], ["addBill", "Payday loan payback", 345, 1]],
        outcome: "You have $300 now. $345 comes out of checking at End Month. If it bounces, it stays and you pay overdraft fees.",
        quality: "bad",
        math: "$45 fee on $300 for 2 weeks. As a yearly rate, that's about 391% APR. (45 ÷ 300 × 26 two-week periods = 3.9)",
      },
      {
        key: "creditUnion",
        label: "Take the Greenville FCU loan",
        steps: [["receiveCash", 300, "Greenville FCU small loan"], ["addBill", "Greenville FCU loan payment", 104, 3]],
        outcome: "You have $300 now and pay $104 a month for 3 months. That's $12 in interest instead of $45 in two weeks.",
        quality: "good",
        math: "3 payments of $104 = $312. The loan costs $12, about 18% APR.",
      },
      {
        key: "savings",
        label: "Use my savings",
        steps: [["moveToChecking", Math.min(300, life.savings)]],
        disabled: life.savings < 100 ? "You need at least $100 in savings." : null,
        outcome: "This is what an emergency fund is for. No loan, no fee.",
        quality: "good",
      },
      { key: "cutBack", label: "Cut back and skip the loan", outcome: "No new debt. Watch checking closely so your bills don't bounce.", quality: "ok" },
    ],
  },
  {
    id: "rentToOwn",
    group: "pitfalls",
    standards: [5],
    icon: "🎮",
    title: "Rent-to-own console",
    fits: (life) => life.checking < 400,
    text: () => [
      "A shop window says: \"Take home a $300 game console today for just $20 a week! No credit check!\"",
      "You pay for 52 weeks before you own it. Miss a payment and they take it back.",
    ],
    choices: (life) => [
      {
        key: "rent",
        label: "Rent it for $20 a week",
        steps: [["addBill", "Rent-to-own console", 87, 12]],
        outcome: "You have the console. About $87 comes out of checking every month for a year.",
        quality: "bad",
        math: "$20 × 52 weeks = $1,040 for a $300 console. That's $740 extra.",
      },
      {
        key: "save",
        label: "Start saving for it ($50 to savings)",
        steps: [["moveToSavings", 50]],
        disabled: short(life, 50),
        outcome: "Save $50 a month and you can buy it in 6 months for $300.",
        quality: "good",
      },
      { key: "skip", label: "Skip it", outcome: "No console for now, and no year of payments.", quality: "ok" },
    ],
  },
  {
    id: "bnplStack",
    group: "pitfalls",
    standards: [1, 5],
    icon: "🧾",
    title: "Pay later, times three",
    fits: (life) => life.checking >= 80 && life.accounts.filter((a) => a.kind === "bnpl" && a.status === "open").length < 2,
    text: () => [
      "Shimmer Market has sneakers ($80), headphones ($60) and a jacket ($100). Every item offers buy now, pay later.",
      "Pay 25% today, then the rest comes out of checking over the next two End Months. Each plan is small. Together they add up.",
    ],
    choices: (life) => [
      {
        key: "all",
        label: "All three, pay later",
        steps: [["buyWithBnpl", 80, "sneakers", "Shimmer Market"], ["buyWithBnpl", 60, "headphones", "Shimmer Market"], ["buyWithBnpl", 100, "jacket", "Shimmer Market"]],
        disabled: short(life, 60),
        outcome: "You paid $60 today. $120 comes out at this End Month and $60 at the next. Miss one and each plan charges a late fee.",
        quality: "bad",
        math: "$240 total: 25% today ($60), 50% at this End Month ($120), 25% next month ($60).",
      },
      {
        key: "one",
        label: "Just the sneakers, pay later",
        steps: [["buyWithBnpl", 80, "sneakers", "Shimmer Market"]],
        outcome: "$20 today, then $40 and $20 at the next two End Months. One plan is easy to track.",
        quality: "ok",
      },
      {
        key: "debit",
        label: "Just the sneakers, with debit",
        steps: [["debitPurchase", 80, "sneakers"]],
        disabled: short(life, 80),
        outcome: "Paid for and done. Nothing to track later.",
        quality: "good",
      },
      { key: "none", label: "Buy nothing", outcome: "Your checking account thanks you.", quality: "good" },
    ],
  },
  {
    id: "cosignPhone",
    group: "pitfalls",
    standards: [1, 5],
    icon: "📱",
    title: "Cosign for a friend?",
    fits: (life) => !hasType(life, "cosigned"),
    text: () => [
      "Your friend Bramble got denied for a $600 phone payment plan. They ask you to cosign.",
      "Cosigning means you promise to pay if Bramble doesn't. The account goes on your credit report too.",
    ],
    choices: () => [
      {
        key: "cosign",
        label: "Cosign for Bramble",
        steps: [["cosign", { friend: "Bramble", amount: 600, termMonths: 24, apr: 0.15, reliability: 0.8 }]],
        outcome: "Bramble got the phone. If Bramble misses a payment, it shows up late on YOUR report unless you pay it.",
        quality: "bad",
        factor: { key: "newCredit", dir: "down" },
      },
      { key: "no", label: "Say no kindly", outcome: "It's hard to say no to a friend. Your report only shows your own choices.", quality: "good" },
    ],
  },
  {
    id: "maxedTrip",
    group: "pitfalls",
    standards: [2, 5],
    icon: "🏖️",
    title: "Beach trip on a card?",
    fits: (life) => ownCards(life).some((a) => a.limit >= 300 && amountOwed(a) / a.limit < 0.3),
    text: (life) => {
      const a = ownCards(life).find((x) => x.limit >= 300 && amountOwed(x) / x.limit < 0.3);
      const cost = Math.round((a.limit * 0.85 - amountOwed(a)) / 5) * 5;
      return [
        `Friends plan a weekend at Glimmer Bay. Your share is ${dollars(cost)}. It would fit on your ${a.name}, just barely.`,
        `That would use about 85% of your ${dollars(a.limit)} limit.`,
      ];
    },
    choices: (life) => {
      const a = ownCards(life).find((x) => x.limit >= 300 && amountOwed(x) / x.limit < 0.3);
      const cost = Math.round((a.limit * 0.85 - amountOwed(a)) / 5) * 5;
      return [
        {
          key: "card",
          label: `Put the trip on the card`,
          steps: [["cardPurchase", a.id, cost, "beach trip"]],
          outcome: "Great trip! But your utilization jumped to about 85%, and your score will feel it at End Month.",
          quality: "bad",
          factor: { key: "owed", dir: "down" },
        },
        {
          key: "dayTrip",
          label: "Go for one day instead ($40)",
          cost: { amount: 40, item: "beach day trip", methods: ["debit", "card"] },
          outcome: "One great day, and your card balance stays low.",
          quality: "good",
        },
        { key: "skip", label: "Sit this one out", outcome: "No trip, no new balance.", quality: "ok" },
      ];
    },
  },
  {
    id: "threeCards",
    group: "pitfalls",
    standards: [3, 5],
    icon: "🛍️",
    title: "Three store cards in one week",
    minChapter: 3,
    fits: (life) => life.score != null,
    text: () => [
      "Holiday sales! Three different stores offer 15% off if you open their store card today.",
      "Each application is a hard inquiry. Lots of applications close together make lenders nervous.",
    ],
    choices: () => [
      {
        key: "three",
        label: "Open all three",
        steps: [["recordInquiry", "Hollow Oak store card"], ["recordInquiry", "Shimmer Market store card"], ["recordInquiry", "Lantern Lane store card"]],
        outcome: "You saved a little at each store, but you added 3 hard inquiries in one week.",
        quality: "bad",
        factor: { key: "newCredit", dir: "down" },
      },
      {
        key: "one",
        label: "Just one, at my favorite store",
        steps: [["recordInquiry", "Hollow Oak store card"]],
        outcome: "One hard inquiry. It counts against your score for a year, then fades.",
        quality: "ok",
        factor: { key: "newCredit", dir: "down" },
      },
      { key: "none", label: "None of them", outcome: "No inquiries. Your report stays quiet.", quality: "good" },
    ],
  },
  {
    id: "closeOldest",
    group: "pitfalls",
    standards: [3, 5],
    icon: "✂️",
    title: "Close your first card?",
    fits: (life) => ownCards(life).some((a) => amountOwed(a) === 0 && life.month - a.openedMonth >= 4),
    text: (life) => {
      const a = ownCards(life)
        .filter((x) => amountOwed(x) === 0)
        .sort((x, y) => x.openedMonth - y.openedMonth)[0];
      const total = ownCards(life).reduce((s, x) => s + x.limit, 0);
      return [
        `You haven't used your ${a.name} lately and it has a $0 balance. You're thinking about closing it.`,
        `It's ${life.month - a.openedMonth} months old and gives you ${pct(a.limit / total)} of your total credit limit.`,
      ];
    },
    choices: (life) => {
      const a = ownCards(life)
        .filter((x) => amountOwed(x) === 0)
        .sort((x, y) => x.openedMonth - y.openedMonth)[0];
      return [
        {
          key: "close",
          label: "Close it",
          steps: [["closeAccount", a.id]],
          outcome: "Closed. You lost its limit, so any balance on other cards is a bigger share. In this game a closed card also stops counting toward the age of your history.",
          quality: "bad",
          factor: { key: "length", dir: "down" },
        },
        {
          key: "keep",
          label: "Keep it open",
          outcome: "Smart. Use it for one small thing now and then, and pay it off, so it stays active.",
          quality: "good",
        },
      ];
    },
  },

  // ---------------- Everyday cards (repeatable) ----------------
  {
    id: "weekendPlans",
    group: "costs",
    standards: [2],
    icon: "🎳",
    title: "Weekend plans",
    once: false,
    fits: () => true,
    text: (life) => {
      const cost = 25 + (life.month % 4) * 10;
      return [`Friends are going to Moonstone Lanes for bowling and snacks. It costs about ${dollars(cost)}.`];
    },
    choices: (life) => {
      const cost = 25 + (life.month % 4) * 10;
      return [
        { key: "go", label: `Go (${dollars(cost)})`, cost: { amount: cost, item: "bowling night" }, outcome: "Strike! A fun night out.", quality: "ok" },
        { key: "free", label: "Suggest a free movie night at home", outcome: "Popcorn and a borrowed movie. Still fun, and free.", quality: "good" },
      ];
    },
  },
  {
    id: "payYourselfFirst",
    group: "costs",
    standards: [2],
    icon: "🐷",
    title: "Pay yourself first",
    once: false,
    fits: (life) => life.checking >= 200,
    text: (life) => [
      `You have ${dollars(life.checking)} in checking. Savings is money set aside for emergencies, so a surprise bill doesn't turn into debt.`,
      "How much will you move to savings?",
    ],
    choices: (life) => [
      { key: "hundred", label: "Move $100", steps: [["moveToSavings", 100]], disabled: life.checking < 300 ? "Keep at least $200 in checking for bills." : null, outcome: "$100 is safe in savings.", quality: "good" },
      { key: "fifty", label: "Move $50", steps: [["moveToSavings", 50]], outcome: "$50 is safe in savings.", quality: "good" },
      { key: "none", label: "Not this month", outcome: "Everything stays in checking, where it's easy to spend.", quality: "ok" },
    ],
  },
  {
    id: "smallCharge",
    group: "types",
    standards: [1, 2],
    icon: "📺",
    title: "A small, steady charge",
    once: false,
    fits: (life) => ownCards(life).some((a) => amountOwed(a) / a.limit < 0.1),
    text: (life) => {
      const a = ownCards(life).find((x) => amountOwed(x) / x.limit < 0.1);
      return [
        `Your $12 streaming plan is due. You could put it on your ${a.name}.`,
        "A small charge you pay off in full shows lenders you use credit and pay on time, with almost no utilization.",
      ];
    },
    choices: (life) => {
      const a = ownCards(life).find((x) => amountOwed(x) / x.limit < 0.1);
      return [
        {
          key: "card",
          label: "Put it on the card",
          steps: [["cardPurchase", a.id, 12, "streaming plan"]],
          outcome: "Charged $12. Pay the statement in full and it costs you nothing extra.",
          quality: "good",
          factor: { key: "payment", dir: "up" },
        },
        { key: "debit", label: "Pay with debit", steps: [["debitPurchase", 12, "streaming plan"]], disabled: short(life, 12), outcome: "Paid. Debit doesn't build credit, but it's still a fine choice.", quality: "ok" },
        { key: "cancel", label: "Cancel the plan", outcome: "One less bill each month.", quality: "good" },
      ];
    },
  },

  // ---------------- More of the catalog (Phase 9) ----------------
  {
    id: "carLease",
    group: "types",
    standards: [1, 2],
    icon: "🚙",
    title: "Lease a new car?",
    minChapter: 4,
    fits: (life) => !hasType(life, "autoLoan") && life.checking >= 350,
    text: () => [
      "A dealer offers a shiny new car for $199 a month for 3 years, with $300 due when you sign. That's a lease.",
      "With a lease you're renting the car. After 3 years you give it back and own nothing. Gas and insurance add about $90 a month.",
    ],
    choices: () => [
      {
        key: "lease",
        label: "Sign the lease",
        steps: [["debitPurchase", 300, "car lease signing fee"], ["addBill", "Car lease", 199, 36], ["removeBill", "Bus pass"], ["addBill", "Gas and insurance", 90]],
        outcome: "New car smell! $199 comes out every month for 3 years, and at the end you own nothing.",
        quality: "bad",
        math: "$300 + $199 × 36 months = $7,464 to drive a car you give back.",
      },
      { key: "bus", label: "Keep riding the bus", outcome: "Your $30 bus pass wins again. You can save for a used car you'd actually own.", quality: "good" },
    ],
  },
  {
    id: "rewardsCard",
    group: "types",
    standards: [1, 2],
    icon: "✈️",
    title: "A travel rewards card",
    fits: (life) => life.score != null && life.score >= 700 && !life.accounts.some((a) => a.product === "premium" && a.status === "open"),
    text: () => [
      "An ad says: \"Earn 2% back on everything with the Capital One Venture X!\" It has a $395 annual fee and wants a long, strong credit history.",
      "You spend about $300 a month on a card. Is it worth it?",
    ],
    choices: () => [
      {
        key: "apply",
        label: "Apply for it",
        steps: [["applyForCard", { issuer: "capitalOne", product: "premium", requestedLimit: 5000, design: "plasticBlue" }]],
        outcome: (r) =>
          approvedText(r, "Approved, but check the math. The fee costs more than you'll earn back.", "Denied. Premium cards want years of history. The hard inquiry stays on your report."),
        quality: "bad",
        factor: { key: "newCredit", dir: "down" },
        math: "$300 × 12 months × 2% = $72 a year in rewards. The fee is $395. You'd lose $323 a year.",
      },
      { key: "skip", label: "Skip it for now", outcome: "Smart. Rewards only pay off when you spend a lot and pay in full every month.", quality: "good", math: "$300 × 12 × 2% = $72 in rewards vs a $395 fee." },
    ],
  },
  {
    id: "balanceTransfer",
    group: "costs",
    standards: [2],
    icon: "🔀",
    title: "0% balance transfer",
    fits: (life) => ownCards(life).some((a) => amountOwed(a) >= 300),
    text: (life) => {
      const a = ownCards(life).find((x) => amountOwed(x) >= 300);
      const owed = amountOwed(a);
      return [
        `You owe ${dollars(owed)} on your ${a.name} at ${apr(a.apr)} APR. A letter offers a new card with 0% interest for 12 months if you move the balance over.`,
        `There's a 3% transfer fee (${dollars(Math.round(owed * 0.03))}), and applying is a hard inquiry.`,
      ];
    },
    choices: (life) => {
      const a = ownCards(life).find((x) => amountOwed(x) >= 300);
      const owed = amountOwed(a);
      const fee = Math.round(owed * 0.03);
      const monthly = Math.ceil(owed / 12);
      const keep = payoffPlan(owed, a.apr, monthly);
      return [
        {
          key: "transfer",
          label: "Apply and transfer",
          steps: [["recordInquiry", "Balance transfer card"]],
          outcome: `If you pay ${dollars(monthly)} a month, it's gone in 12 months for just the ${dollars(fee)} fee. In this game the transfer card is a one-time choice, so your balance stays where it is.`,
          quality: "ok",
          factor: { key: "newCredit", dir: "down" },
          math: `Keep it at ${apr(a.apr)}: ${dollars(monthly)} a month costs ${dollars(keep.totalInterest)} in interest. Transfer: ${dollars(fee)} fee and $0 interest if it's paid off within 12 months.`,
        },
        {
          key: "payDown",
          label: "Skip it and pay extra each month",
          outcome: "No inquiry and no fee. Paying extra still cuts your interest a lot.",
          quality: "good",
          math: `${dollars(monthly)} a month at ${apr(a.apr)}: ${keep.months} months and ${dollars(keep.totalInterest)} in interest.`,
        },
      ];
    },
  },
  {
    id: "deferredInterest",
    group: "costs",
    standards: [2, 5],
    icon: "⏳",
    title: "No interest if paid in 6 months",
    fits: (life) => life.checking >= 120,
    text: () => [
      "Shimmer Market sells a $600 laptop with a deal: \"No interest if paid in full in 6 months!\"",
      "The catch: if even $1 is left after 6 months, they charge ALL the interest from day one, at 27%. That's called deferred interest.",
    ],
    choices: (life) => [
      {
        key: "planFull",
        label: "Take it and pay $100 a month",
        steps: [["addBill", "Laptop promo plan", 100, 6]],
        outcome: "If every $100 payment goes through, you pay $600 and no interest. Keep enough in checking.",
        quality: "ok",
        math: "$600 ÷ 6 months = $100 a month. Miss it and the back interest is about $81.",
      },
      {
        key: "planHalf",
        label: "Take it and pay $50 a month",
        steps: [["addBill", "Laptop promo plan", 50, 6], ["addBill", "Laptop deferred interest and balance", 381, 1, 5]],
        outcome: "After 6 months you still owe $300, so all the back interest lands at once. Ouch.",
        quality: "bad",
        math: "$50 × 6 = $300 paid. $300 left, plus about $81 of interest from day one = $381 due.",
      },
      {
        key: "cheaper",
        label: "Buy a $300 used laptop with debit",
        steps: [["debitPurchase", 300, "used laptop"]],
        disabled: short(life, 300),
        outcome: "It's not new, but it's paid for. No traps.",
        quality: "good",
      },
    ],
  },
  {
    id: "annualFee",
    group: "costs",
    standards: [2],
    icon: "🗓️",
    title: "Your annual fee is coming",
    fits: (life) => ownCards(life).some((a) => a.annualFee > 0),
    text: (life) => {
      const a = ownCards(life).find((x) => x.annualFee > 0);
      return [`Your ${a.name} charges a ${dollars(a.annualFee)} annual fee every year on its birthday. Is the card worth it?`, "Closing it saves the fee, but you lose its limit and its age on your report."];
    },
    choices: (life) => {
      const a = ownCards(life).find((x) => x.annualFee > 0);
      const owed = amountOwed(a);
      return [
        { key: "keep", label: "Keep it", outcome: "The fee keeps coming each year. Make sure the card earns its keep.", quality: "ok" },
        {
          key: "close",
          label: "Close it",
          steps: [["closeAccount", a.id]],
          disabled: owed > 0 ? `Pay the ${dollars(owed)} balance first.` : null,
          outcome: "No more fee. Your total limit went down, so keep other balances low.",
          quality: "ok",
          factor: { key: "length", dir: "down" },
        },
      ];
    },
  },
  {
    id: "paydayRollover",
    group: "pitfalls",
    standards: [5],
    icon: "🔁",
    title: "Can't repay the payday loan",
    priority: 3,
    once: false,
    fits: (life) => life.bills.some((b) => b.name === "Payday loan payback") && life.checking < 345,
    text: () => [
      "Your $345 payday loan payback comes out at End Month, and checking won't cover it. Quick Cash offers to \"roll it over\": pay just the $45 fee now and owe $345 again in two weeks.",
    ],
    choices: (life) => [
      {
        key: "rollover",
        label: "Roll it over for $45",
        steps: [["debitPurchase", 45, "payday rollover fee"]],
        disabled: short(life, 45),
        outcome: "You paid $45 and still owe $345. This is how a $300 loan turns into hundreds in fees.",
        quality: "bad",
        math: "Roll it over 4 times: $45 × 4 = $180 in fees, and you still owe the $345.",
      },
      {
        key: "savings",
        label: "Pay it from savings",
        steps: [["moveToChecking", Math.min(345, life.savings)]],
        disabled: life.savings < 345 - life.checking ? "Not enough in savings." : null,
        outcome: "Done with Quick Cash. Rebuild your savings next.",
        quality: "good",
      },
      {
        key: "creditUnion",
        label: "Get a Greenville FCU small loan to pay it off",
        steps: [["receiveCash", 300, "Greenville FCU small loan"], ["addBill", "Greenville FCU loan payment", 104, 3]],
        outcome: "The payday loan gets paid at End Month. Now you owe a fair loan instead of a trap.",
        quality: "good",
      },
    ],
  },
  {
    id: "titleLoan",
    group: "pitfalls",
    standards: [5],
    icon: "🔑",
    title: "Cash for your car title?",
    fits: (life) => hasType(life, "autoLoan") && life.checking < 300,
    text: () => [
      "A sign says: \"Get $500 today. Just hand over your car title!\" You pay back $625 next month.",
      "If you can't pay, the lender can take your car, even though you still owe your car loan.",
    ],
    choices: () => [
      {
        key: "take",
        label: "Take the $500",
        steps: [["receiveCash", 500, "title loan"], ["addBill", "Title loan payback", 625, 1]],
        outcome: "You have $500 now. $625 comes out at End Month, and your car is the collateral.",
        quality: "bad",
        math: "$125 fee on $500 for one month. As a yearly rate, that's about 300% APR.",
      },
      { key: "skip", label: "Walk away", outcome: "Your car stays yours. Talk to a credit union or use savings instead.", quality: "good" },
    ],
  },
  {
    id: "settlementAd",
    group: "pitfalls",
    standards: [5],
    icon: "📺",
    title: "\"Erase your debt!\"",
    fits: (life) => life.accounts.some((a) => a.owner === "self" && ["open", "collections"].includes(a.status) && a.kind !== "installment" && amountOwed(a) >= 200),
    text: () => [
      "A video ad says: \"Settle your debt for pennies on the dollar! Just $200 to start!\"",
      "Debt settlement companies take fees up front, tell you to stop paying your bills, and your report fills with late marks.",
    ],
    choices: (life) => [
      {
        key: "pay",
        label: "Pay the $200 to start",
        steps: [["debitPurchase", 200, "debt settlement company fee"]],
        disabled: short(life, 200),
        outcome: "$200 gone, and nothing you owe changed. Many of these companies are scams.",
        quality: "bad",
      },
      { key: "callLender", label: "Call your card company and ask for a payment plan", outcome: "Lenders often lower payments or waive a fee if you ask. Free nonprofit credit counseling can help too.", quality: "good" },
      { key: "ignore", label: "Ignore the ad", outcome: "Good call. Keep paying what you can, starting with the minimums.", quality: "ok" },
    ],
  },
  {
    id: "medicalNotice",
    group: "pitfalls",
    standards: [3, 5],
    icon: "📬",
    title: "A final notice",
    minChapter: 3,
    fits: (life) => life.score != null,
    text: () => [
      "You find an unopened envelope from months ago. It's a $180 bill from the urgent care clinic, marked FINAL NOTICE.",
      "If it's not paid this month, it goes to a collection agency, and that goes on your credit report.",
    ],
    choices: (life) => [
      {
        key: "pay",
        label: "Pay the $180 now",
        cost: { amount: 180, item: "old clinic bill", methods: ["debit", "card"] },
        outcome: "Paid before it went to collections. Your report never knew.",
        quality: "good",
      },
      {
        key: "ignore",
        label: "Ignore it",
        steps: [["addCollection", "Urgent care bill", 180]],
        outcome: "It went to collections and your score will drop. You can still pay it from your Wallet. A paid collection hurts less.",
        quality: "bad",
        factor: { key: "payment", dir: "down" },
      },
    ],
  },
  {
    id: "reportError",
    group: "profile",
    standards: [3],
    icon: "📝",
    title: "A mistake on your report",
    minChapter: 3,
    fits: (life) => life.accounts.some((a) => a.reported && a.history.length >= 3),
    text: () => [
      "You check your report and see a 30-day late mark from a month you know you paid on time. You have the receipt.",
      "Credit bureaus must check a dispute, usually within 30 days, and fix mistakes.",
    ],
    choices: () => [
      { key: "dispute", label: "File a dispute with your receipt", outcome: "Good move. Disputing is free. In real life the bureau checks with the lender and removes the wrong mark.", quality: "good" },
      { key: "ignore", label: "Leave it", outcome: "A wrong late mark can drag your score down for years. Always dispute errors.", quality: "bad" },
    ],
  },
  {
    id: "landlordCheck",
    group: "profile",
    standards: [3],
    icon: "🏠",
    title: "Your first apartment",
    minChapter: 5,
    fits: (life) => life.checking >= 35,
    text: () => [
      "You found an apartment! The landlord charges a $35 application fee and checks your credit. Landlords usually do a soft check.",
      "Your score helps decide the security deposit.",
    ],
    choices: (life) => [
      {
        key: "apply",
        label: "Apply ($35)",
        steps: [["debitPurchase", 35, "apartment application fee"], ["recordInquiry", "Apartment landlord screening", false]],
        outcome:
          life.score == null
            ? "No score yet, so the landlord wants a cosigner or two months of rent as a deposit."
            : life.score >= 670
              ? `Approved with a normal deposit! Your ${life.score} score made it easy.`
              : life.score >= 580
                ? `Approved, but your ${life.score} score means a bigger deposit.`
                : `Denied for now. A ${life.score} score worries landlords. On-time payments will fix that.`,
        quality: life.score != null && life.score >= 670 ? "good" : "ok",
      },
      { key: "wait", label: "Wait until your score is higher", outcome: "Living with roommates or family a bit longer saves money too.", quality: "ok" },
    ],
  },

  // ---------------- Credit profile (Std 3) ----------------
  {
    id: "checkReport",
    group: "profile",
    standards: [3],
    icon: "🔍",
    title: "Check your own report",
    fits: () => true,
    weight: 1.2,
    text: () => [
      "You can see your credit report for free at the official site. Some people worry that looking will hurt their score.",
      "Will you check yours?",
    ],
    choices: (life) => {
      const r = buildReport(life);
      return [
        {
          key: "check",
          label: "Check my report",
          steps: [["recordInquiry", "you, checking your own report", false]],
          outcome: `Checking your own report is a soft inquiry. It never changes your score. Your report shows ${r.tradelines.length} account${r.tradelines.length === 1 ? "" : "s"} and ${hardInquiriesInWindow(life)} hard inquir${hardInquiriesInWindow(life) === 1 ? "y" : "ies"} from the last year.`,
          quality: "good",
        },
        { key: "skip", label: "Not right now", outcome: "That's okay. Checking at least once a year helps you spot mistakes early.", quality: "ok" },
      ];
    },
  },
  {
    id: "parentCard",
    group: "profile",
    standards: [3],
    icon: "👪",
    title: "Your parent's card",
    priority: 2,
    fits: (life) => life.accounts.some((a) => a.owner === "authorized"),
    text: (life) => {
      const a = life.accounts.find((x) => x.owner === "authorized");
      const lates = a.history.filter((h) => h.code !== "OK").length;
      return [
        `You're still an authorized user on your parent's card. Right now it uses ${pct(a.balance / a.limit)} of its ${dollars(a.limit)} limit.`,
        lates ? `It has ${lates} late mark${lates === 1 ? "" : "s"} on your report.` : "It has no late marks.",
        "You can stay on it or ask to be removed. If you're removed, the whole account leaves your report.",
      ];
    },
    choices: (life) => {
      const a = life.accounts.find((x) => x.owner === "authorized");
      const hurting = a.balance / a.limit > 0.5 || a.history.some((h) => h.code !== "OK");
      return [
        {
          key: "stay",
          label: "Stay on the card",
          outcome: hurting
            ? "Its high balance and any late marks keep counting on your report."
            : "Its long, clean history keeps helping your report.",
          quality: hurting ? "bad" : "good",
        },
        {
          key: "remove",
          label: "Ask to be removed",
          steps: [["removeAuthorizedUser"]],
          outcome: hurting
            ? "The account left your report, so its high balance and late marks don't count against you anymore."
            : "The account left your report. Its long, clean history went with it.",
          quality: hurting ? "good" : "bad",
          factor: { key: hurting ? "owed" : "length", dir: hurting ? "up" : "down" },
        },
      ];
    },
  },
  {
    id: "scoreDrop",
    group: "profile",
    standards: [3],
    icon: "🕵️",
    title: "Why did my score drop?",
    once: false,
    priority: 4,
    fits: (life, ctx) => Boolean(ctx.lastChange && ctx.lastChange.delta < 0 && ctx.lastChange.factor),
    text: (life, ctx) => [`Your score dropped ${-ctx.lastChange.delta} points at the last End Month. Which part of your score caused it?`],
    choices: (life, ctx) =>
      FACTOR_KEYS.map((k) => ({
        key: k,
        label: FACTOR_LABELS[k],
        quiz: true,
        quality: k === ctx.lastChange.factor ? "good" : "ok",
        outcome: k === ctx.lastChange.factor ? `Right! ${ctx.lastChange.message}` : `Not this time. ${ctx.lastChange.message}`,
      })),
  },
  {
    id: "identityAlert",
    group: "profile",
    standards: [3, 5],
    icon: "🚨",
    title: "An account you never opened",
    minChapter: 3,
    fits: (life) => life.score != null,
    text: () => [
      "A letter thanks you for opening a phone account in Thornbury, a town you've never visited.",
      "Someone may be using your name. This is called identity theft.",
    ],
    choices: () => [
      {
        key: "freeze",
        label: "Freeze my credit and dispute it",
        outcome: "Good move. A freeze stops anyone from opening new credit in your name. A dispute asks the bureau to remove the fake account. Both are free.",
        quality: "good",
      },
      {
        key: "ignore",
        label: "Ignore it",
        outcome: "In real life, that fake account could go unpaid and land in collections under your name. Always dispute accounts you didn't open.",
        quality: "bad",
      },
    ],
  },
];

// What each card needs unlocked first (Phase 10, js/progression.js). Old saves
// have everything unlocked, so this only paces new games.
const NEEDS = {
  card: ["securedSecondChance", "securedUpgrade", "limitIncrease", "storeCard", "minimumTrap", "cashAdvance", "lateRecovery", "maxedTrip", "closeOldest", "smallCharge", "balanceTransfer", "deferredInterest", "annualFee", "parentCard"],
  bnpl: ["bnplStack"],
  loans: ["creditBuilder", "carDecision", "carLease", "studentLoan", "graduation"],
  score: ["prescreened", "rewardsCard", "threeCards", "identityAlert", "scoreDrop", "reportError", "checkReport", "landlordCheck"],
  pitfalls: ["paydayLoan", "paydayRollover", "rentToOwn", "titleLoan", "settlementAd", "cosignPhone", "medicalNotice"],
};
for (const [feature, ids] of Object.entries(NEEDS)) for (const id of ids) (SCENARIOS.find((s) => s.id === id).needs ??= []).push(feature);

// Milestones that never come back when late chapters reshuffle the deck.
for (const id of ["graduation", "studentLoan", "carDecision", "carLease", "creditBuilder", "parentCard"]) SCENARIOS.find((s) => s.id === id).replay = false;

// Everyday money cards that also fit Chapter 1.
for (const id of ["weekendPlans", "payYourselfFirst"]) SCENARIOS.find((s) => s.id === id).minChapter = 1;

SCENARIOS.unshift(...EARLY_SCENARIOS);
SCENARIOS.push(...LATE_SCENARIOS);

export const SCENARIO_BY_ID = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

export const GROUP_LABELS = {
  banking: "Bank accounts",
  types: "Types of credit",
  costs: "Costs of credit",
  pitfalls: "Pitfalls",
  profile: "Your credit profile",
};

