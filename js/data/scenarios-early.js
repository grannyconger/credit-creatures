// Decision cards for the first chapters of a Phase 10 game (docs/PROGRESSION.md):
// Chapter 1 teaches a checking account, Chapter 2 teaches installment loans.
// Same shape as js/data/scenarios.js. needs: the features they ask for.
// Plain language for a 15-year-old. No em-dashes, no semicolons.
import { CONFIG } from "./config.js";
import { dollars, quotePurchaseLoan } from "../engine/index.js";

const hasBill = (life, name) => life.bills.some((b) => b.name === name);
const autoTotal = (life) => life.bills.reduce((s, b) => s + b.amount, 0);
const openLoans = (life) => life.accounts.filter((a) => a.owner === "self" && a.kind === "installment" && a.status === "open" && a.balance > 0);

export const EARLY_SCENARIOS = [
  // ---------------- Chapter 1: your first bank account ----------------
  {
    id: "billsFirst",
    group: "banking",
    standards: [2],
    icon: "🎧",
    title: "Bills come first",
    minChapter: 1,
    maxChapter: 2,
    needs: ["checking"],
    priority: 2,
    fits: (life) => life.checking >= 40 && life.bills.length > 0,
    text: (life) => [
      `Wireless headphones are on sale for $35. You have ${dollars(life.checking)} in checking.`,
      `At End Month, ${dollars(autoTotal(life))} in bills comes out of checking by itself. If there isn't enough, the bank charges a ${dollars(CONFIG.fees.overdraft)} overdraft fee.`,
    ],
    choices: (life) => [
      {
        key: "buy",
        label: "Buy them ($35)",
        cost: { amount: 35, item: "headphones" },
        outcome: (r, after) => (after.checking >= autoTotal(after) ? "New headphones, and there's still enough left for your bills." : "New headphones, but checking won't cover your bills now. Earn more before End Month or pay an overdraft fee."),
        quality: life.checking - 35 >= autoTotal(life) ? "ok" : "bad",
      },
      { key: "wait", label: "Wait until my bills are paid", outcome: "Smart. Bills first, fun second. The sale comes around again.", quality: "good" },
    ],
  },
  {
    id: "depositCheck",
    group: "banking",
    standards: [2],
    icon: "✉️",
    title: "A check from Grandma",
    minChapter: 1,
    maxChapter: 3,
    needs: ["checking"],
    fits: () => true,
    text: () => ["Grandma mailed you a $50 check for doing well in school. A check is a written order to pay you. You need to deposit or cash it to use the money."],
    choices: () => [
      { key: "deposit", label: "Deposit it with the Vault app", steps: [["receiveCash", 50, "Grandma's check"]], outcome: "You snapped a photo of the check and the $50 went into checking. Free and easy.", quality: "good" },
      { key: "split", label: "Deposit it and move half to savings", steps: [["receiveCash", 50, "Grandma's check"], ["moveToSavings", 25]], outcome: "$25 to spend and $25 saved. Paying yourself first is a great habit.", quality: "good" },
      { key: "cash", label: "Cash it at the Quick Check store", steps: [["receiveCash", 44, "check cashed at Quick Check"]], outcome: "Quick Check kept $6 as a fee. Your own bank cashes checks for free.", quality: "bad" },
    ],
  },
  {
    id: "atmFee",
    group: "banking",
    standards: [2],
    icon: "🏧",
    title: "The nearest ATM",
    minChapter: 1,
    maxChapter: 3,
    needs: ["debit"],
    fits: (life) => life.checking >= 25,
    text: () => [
      "You need $20 in cash for the fair. The ATM right here belongs to another bank. It charges $3, and your bank adds $2 for using it.",
      "A Gilded Vault ATM is a 10-minute walk away, and it's free.",
    ],
    choices: () => [
      { key: "walk", label: "Walk to my bank's ATM", outcome: "A short walk saved $5. That's a quarter of what you took out.", quality: "good" },
      { key: "here", label: "Use this ATM ($5 in fees)", steps: [["debitPurchase", 5, "ATM fees"]], outcome: "$5 in fees for $20 of cash. ATM fees add up fast.", quality: "bad" },
    ],
  },
  {
    id: "phishingText",
    group: "banking",
    standards: [5],
    icon: "📱",
    title: "Your account is locked?",
    minChapter: 1,
    maxChapter: 4,
    needs: ["debit"],
    fits: (life) => life.checking >= 20,
    text: () => ['A text says: "GILDED VAULT ALERT: Your account is locked. Reply with your card number and PIN to unlock it."', "The link and the number look a little strange."],
    choices: (life) => {
      const lost = Math.min(60, Math.floor(life.checking));
      return [
        { key: "call", label: "Ignore it and call the number on my card", outcome: "The real bank says your account is fine. That text was a scam. Banks never ask for your PIN.", quality: "good" },
        { key: "reply", label: "Reply with my card number and PIN", steps: [["debitPurchase", lost, "money taken by a scammer"]], outcome: `A scammer took ${dollars(lost)} before you noticed. Never share your PIN, even with someone who says they're the bank.`, quality: "bad" },
      ];
    },
  },
  {
    id: "freeTrial",
    group: "banking",
    standards: [2],
    icon: "🎵",
    title: "A free trial",
    minChapter: 1,
    maxChapter: 3,
    needs: ["debit"],
    fits: (life) => !hasBill(life, "MonsterTunes"),
    text: () => ["MonsterTunes offers a free 7-day music trial. You have to enter your debit card. After 7 days it charges $10 every month until you cancel."],
    choices: () => [
      { key: "forget", label: "Start the trial", steps: [["addBill", "MonsterTunes", 10]], outcome: "Free music! But a $10 charge now comes out of checking every month. Watch your bills list at the Vault.", quality: "ok" },
      { key: "skip", label: "No thanks", outcome: "No new monthly charge. Free trials are built so people forget to cancel.", quality: "good" },
    ],
  },
  {
    id: "cancelSubscription",
    group: "banking",
    standards: [2],
    icon: "🧾",
    title: "Read your bills",
    minChapter: 1,
    needs: ["debit"],
    priority: 1,
    fits: (life) => hasBill(life, "MonsterTunes"),
    text: () => ["Looking at your bills at the Vault, you spot $10 to MonsterTunes every month. You haven't opened the app in weeks."],
    choices: () => [
      { key: "cancel", label: "Cancel it", steps: [["removeBill", "MonsterTunes"]], outcome: "Canceled. That's $120 a year back in your pocket.", quality: "good" },
      { key: "keep", label: "Keep it", outcome: "$10 keeps coming out every month. Small monthly charges are easy to forget.", quality: "ok" },
    ],
  },
  {
    id: "pizzaSplit",
    group: "banking",
    standards: [2],
    icon: "🍕",
    title: "Pizza for four",
    minChapter: 1,
    maxChapter: 3,
    needs: ["debit"],
    fits: (life) => life.checking >= 40,
    text: () => ["You paid $36 with your debit card for pizza with three friends. Each friend owes you $9."],
    choices: () => [
      { key: "ask", label: "Send each friend a payment request now", steps: [["debitPurchase", 36, "pizza for four"], ["receiveCash", 27, "friends paid you back"]], outcome: "Everyone paid you back the same night. Asking right away is easier than asking later.", quality: "good" },
      { key: "later", label: "Ask them some other time", steps: [["debitPurchase", 36, "pizza for four"]], outcome: "Nobody remembered. You paid $36 for everyone.", quality: "bad" },
    ],
  },
  {
    id: "lostCard",
    group: "banking",
    standards: [5],
    icon: "🔎",
    title: "Where's my debit card?",
    minChapter: 1,
    maxChapter: 4,
    needs: ["debit"],
    fits: (life) => life.checking >= 30,
    text: () => ["You can't find your debit card. Maybe it's in your other jacket. Maybe you dropped it at the mall."],
    choices: (life) => [
      { key: "lock", label: "Lock it in the app right now", outcome: "Locked in seconds. You found it the next day and unlocked it. Nobody could use it in between.", quality: "good" },
      { key: "wait", label: "Wait a few days and keep looking", steps: [["debitPurchase", Math.min(40, Math.floor(life.checking)), "charges from a stranger"]], outcome: "Someone found it and spent money before you reported it. Lock or report a lost card right away.", quality: "bad" },
    ],
  },
  {
    id: "budgetSplit",
    group: "banking",
    standards: [2],
    icon: "📝",
    title: "Make a budget",
    minChapter: 1,
    maxChapter: 3,
    needs: ["checking"],
    fits: () => true,
    text: () => ["A budget is a plan for your money before you spend it. One popular plan is 50/30/20: half for needs, 30% for wants and 20% for savings.", "If you earn $200 this month, how much goes to savings?"],
    choices: () =>
      [
        ["ten", "$10", false],
        ["forty", "$40", true],
        ["hundred", "$100", false],
      ].map(([key, label, right]) => ({ key, label, quiz: true, quality: right ? "good" : "ok", outcome: right ? "Right! 20% of $200 is $40." : "Not quite. 20% of $200 is $40, and $100 would go to needs." })),
  },

  // ---------------- Chapter 2: borrow and pay back ----------------
  {
    id: "couchDeal",
    group: "types",
    standards: [1, 2],
    icon: "🛋️",
    title: "A couch on payments",
    minChapter: 2,
    maxChapter: 4,
    needs: ["loans"],
    fits: () => true,
    text: (life) => {
      const q12 = quotePurchaseLoan(life, { price: 600, termMonths: 12, apr: 0.12 });
      const q36 = quotePurchaseLoan(life, { price: 600, termMonths: 36, apr: 0.22 });
      return [
        "Comfy Corner sells a $600 couch. You can pay now, or take a store loan and pay monthly.",
        `12 months at 12% APR: ${dollars(q12.payment)} a month, ${dollars(q12.totalInterest)} in interest. 36 months at 22% APR: ${dollars(q36.payment)} a month, ${dollars(q36.totalInterest)} in interest.`,
      ];
    },
    choices: (life) => {
      const q12 = quotePurchaseLoan(life, { price: 600, termMonths: 12, apr: 0.12 });
      const q36 = quotePurchaseLoan(life, { price: 600, termMonths: 36, apr: 0.22 });
      return [
        { key: "cash", label: "Pay $600 now", steps: [["debitPurchase", 600, "couch"]], disabled: life.checking < 600 ? `You only have ${dollars(life.checking)} in checking.` : null, outcome: "No loan and no interest. The couch is all yours.", quality: "good" },
        { key: "short", label: `12-month loan (${dollars(q12.payment)} a month)`, steps: [["openPurchaseLoan", { item: "couch", price: 600, termMonths: 12, apr: 0.12, lender: "store", type: "storeLoan", icon: "🛋️" }]], outcome: (r) => (r.ok && !r.denied ? `Approved. Paying it off in a year keeps the interest to ${dollars(q12.totalInterest)}. On-time payments start building your credit history.` : "Denied. The payment is too big for your income right now."), quality: "ok", factor: { key: "mix", dir: "up" } },
        { key: "long", label: `36-month loan (${dollars(q36.payment)} a month)`, steps: [["openPurchaseLoan", { item: "couch", price: 600, termMonths: 36, apr: 0.22, lender: "store", type: "storeLoan", icon: "🛋️" }]], outcome: (r) => (r.ok && !r.denied ? `A smaller payment, but ${dollars(q36.totalInterest)} in interest. You'll pay ${dollars(600 + q36.totalInterest)} for a $600 couch.` : "Denied. The payment is too big for your income right now."), quality: "bad", math: `${dollars(q36.payment)} × 36 months = ${dollars(q36.payment * 36)}. That's ${dollars(q36.totalInterest)} more than the price.` },
        { key: "skip", label: "Keep the old couch", outcome: "The old couch still works. No new bill.", quality: "good" },
      ];
    },
  },
  {
    id: "extraLoanPayment",
    group: "costs",
    standards: [2],
    icon: "➕",
    title: "Pay a little extra?",
    minChapter: 2,
    once: false,
    needs: ["loans"],
    fits: (life) => life.checking >= 150 && openLoans(life).some((a) => a.balance > 100 && a.firstDueMonth != null),
    text: (life) => {
      const a = openLoans(life).find((x) => x.balance > 100);
      return [`Your ${a.name} has ${dollars(a.balance)} left at ${(a.apr * 100).toFixed(1)}% APR. Paying extra goes straight to the balance, so you pay less interest and finish sooner.`];
    },
    choices: (life) => {
      const a = openLoans(life).find((x) => x.balance > 100);
      return [
        { key: "extra", label: "Pay $50 extra", steps: [["pay", a.id, 50]], outcome: "$50 off the balance. Less interest every month from now on.", quality: "good" },
        { key: "no", label: "Just the regular payment", outcome: "That's fine too. Your regular payment comes out at End Month.", quality: "ok" },
      ];
    },
  },
  {
    id: "loanLetter",
    group: "types",
    standards: [1],
    icon: "📬",
    title: "Reading a loan",
    minChapter: 2,
    maxChapter: 4,
    needs: ["loans"],
    fits: () => true,
    text: () => ["A $1,000 loan for 12 months at 10% APR costs about $88 a month. How much do you pay in total?"],
    choices: () =>
      [
        ["thousand", "$1,000", false],
        ["fiftysix", "About $1,056", true],
        ["twelve", "About $1,200", false],
      ].map(([key, label, right]) => ({ key, label, quiz: true, quality: right ? "good" : "ok", outcome: right ? "Right! $88 × 12 is about $1,056. The extra $56 is interest." : "Not quite. Multiply the payment by the months: $88 × 12 is about $1,056. The extra $56 is the interest." })),
  },
];
