// Practice Desk and Factor Check questions (SPEC §11, §14). Each type makes a
// fresh question from a seeded rng: { prompt: [lines], choices, answer, math }.
// Real math is allowed and the worked math always shows after (SPEC §22.1).
// Plain language for a 15-year-old. No em-dashes, no semicolons.
import { dollars, FACTOR_LABELS } from "../engine/index.js";

const pick = (rng, arr) => arr[Math.floor(rng.next() * arr.length)];
const step = (rng, min, max, by) => min + by * Math.floor(rng.next() * (Math.floor((max - min) / by) + 1));
const cents = (x) => Math.round(x * 100) / 100;
const pct = (x) => `${Math.round(x * 100)}%`;

function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The right answer plus distractors, deduped, shuffled. answer = index of the right one.
function mc(rng, right, wrong) {
  const seen = new Set([right]);
  const others = [];
  for (const w of wrong) if (!seen.has(w)) seen.add(w), others.push(w);
  const choices = shuffle(rng, [right, ...others.slice(0, 3)]);
  return { choices, answer: choices.indexOf(right) };
}

// ---------- Factor Check: "Which factor moves, and which way?" ----------

// Said as what it does to the score. "Amounts owed goes up" was confusing, because owing
// more is bad and the part of the score that improves when you owe less (tuning data
// 2026-10-29: only 30% got Factor Check right).
const ARROW = { up: "helps your score ▲", down: "hurts your score ▼" };
export const factorChoice = (key, dir) => `${FACTOR_LABELS[key]}: ${ARROW[dir]}`;

export function factorOptions(rng, key, dir) {
  const flip = dir === "up" ? "down" : "up";
  const others = shuffle(rng, Object.keys(FACTOR_LABELS).filter((k) => k !== key));
  return mc(rng, factorChoice(key, dir), [factorChoice(key, flip), factorChoice(others[0], dir), factorChoice(others[1], flip)]);
}

export const FACTOR_CHECKS = [
  { text: "You closed your oldest card because you got a shiny new one.", key: "length", dir: "down", why: "Your oldest account stops counting, so your history looks shorter." },
  { text: "You put a $450 laptop on a card with a $500 limit.", key: "owed", dir: "down", why: "You're using 90% of your limit. High utilization hurts." },
  { text: "You forgot to pay your card while on a trip, and it was reported 30 days late.", key: "payment", dir: "down", why: "A late payment lands on your record." },
  { text: "You applied for 3 store cards in one week for holiday discounts.", key: "newCredit", dir: "down", why: "3 hard inquiries close together make lenders nervous." },
  { text: "You only had a credit card. Now you also have a car loan, so you handle two different kinds of credit.", key: "mix", dir: "up", why: "You now handle two kinds of credit." },
  { text: "You paid your $400 card balance down to $20.", key: "owed", dir: "up", why: "Your utilization dropped a lot." },
  { text: "Your card issuer raised your limit, and your balance stayed the same.", key: "owed", dir: "up", why: "Same balance, bigger limit, lower utilization." },
  { text: "A year went by since your last credit application.", key: "newCredit", dir: "up", why: "Hard inquiries stop counting after 12 months." },
  { text: "You paid on time for another 12 months in a row.", key: "payment", dir: "up", why: "A longer on-time record counts more." },
  { text: "A friend you cosigned for missed two payments.", key: "payment", dir: "down", why: "A cosigned account's late marks show on your report too." },
  { text: "You opened several new accounts, and the average age of your accounts dropped from 4 years to 1 year.", key: "length", dir: "down", why: "New accounts pull down the average age of your accounts." },
  { text: "You took a $100 cash advance on a card with a $300 limit.", key: "owed", dir: "down", why: "The advance and its fee raise your balance and utilization." },
];

function factorCheckQuestion(rng) {
  const f = pick(rng, FACTOR_CHECKS);
  const { choices, answer } = factorOptions(rng, f.key, f.dir);
  return { prompt: [f.text, "Which part of your score does this change, and does it help or hurt?"], choices, answer, math: `${factorChoice(f.key, f.dir)}. ${f.why}` };
}

// ---------- Question types (SPEC §14 table) ----------

export const QUESTION_TYPES = {
  runningBalance: {
    label: "Running balance",
    standard: 2,
    formula: ["New amount owed = old amount owed + purchases − payments", "A purchase makes you owe more, so add it.", "A payment makes you owe less, so subtract it."],
    make(rng) {
      const bal = step(rng, 100, 400, 5);
      const buy = step(rng, 15, 80, 5);
      const paid = step(rng, 50, Math.min(150, bal + buy), 5);
      const right = bal + buy - paid;
      return {
        // Worded as what you OWE (bug fix 2026-10-22: "balance" and "pay" read
        // like money you have, so both sounded like subtraction).
        prompt: [`You owe ${dollars(bal)} on your credit card.`, `You use the card to buy something for ${dollars(buy)}.`, `Then you make a ${dollars(paid)} payment toward the card.`, "How much do you owe on the card now?"],
        ...mc(rng, dollars(right), [dollars(bal + buy + paid), dollars(Math.abs(bal - buy - paid)), dollars(bal - buy + paid), dollars(right + 10)]),
        math: `${dollars(bal)} owed + ${dollars(buy)} purchase − ${dollars(paid)} payment = ${dollars(right)} owed. A purchase on a card adds to what you owe. A payment takes it down.`,
      };
    },
  },
  utilization: {
    label: "Utilization",
    standard: 3,
    formula: ["Utilization = amount owed ÷ credit limit", "Divide what you owe by the limit.", "Move the decimal two places to make it a percent (0.25 is 25%)."],
    make(rng) {
      const limit = pick(rng, [500, 800, 1000, 1500, 2000, 2500]);
      const share = pick(rng, [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.9]);
      const bal = limit * share;
      return {
        prompt: [`You owe ${dollars(bal)} on a card with a ${dollars(limit)} limit.`, "What is your utilization?"],
        ...mc(rng, pct(share), [pct(Math.min(1, share * 2)), pct(share / 2), pct(1 - share), pct(Math.min(0.95, share + 0.15))]),
        math: `${dollars(bal)} ÷ ${dollars(limit)} = ${share.toFixed(2)} = ${pct(share)}. ${share <= 0.1 ? "Under 10% is great." : share <= 0.3 ? "Under 30% is good." : "Over 30% can lower your score."}`,
      };
    },
  },
  monthlyInterest: {
    label: "Monthly interest",
    standard: 2,
    formula: ["Interest for 1 month = balance × APR ÷ 12", "Turn the APR into a decimal (24% is 0.24).", "Multiply the balance by that decimal. That is a whole year of interest.", "Divide by 12 to get one month."],
    make(rng) {
      const bal = step(rng, 300, 1200, 50);
      const apr = pick(rng, [18, 21, 24, 27, 30]);
      const right = cents((bal * apr) / 100 / 12);
      return {
        prompt: [`You carry a ${dollars(bal)} balance at ${apr}% APR for one month.`, "About how much interest is charged?"],
        ...mc(rng, dollars(right), [dollars(cents((bal * apr) / 100)), dollars(cents(right * 2)), dollars(cents((bal * apr) / 100 / 365)), dollars(cents(right / 2))]),
        math: `APR is a yearly rate. ${dollars(bal)} × ${apr}% = ${dollars(cents((bal * apr) / 100))} a year. ÷ 12 months = ${dollars(right)} for one month.`,
      };
    },
  },
  tipMath: {
    label: "Tip math",
    standard: 2,
    formula: ["Total = meal cost + tip, and tip = meal cost × tip percent", "Turn the percent into a decimal (20% is 0.20).", "Multiply the meal cost by it to get the tip.", "Add the tip to the meal cost."],
    make(rng) {
      const sub = step(rng, 1200, 6000, 50) / 100;
      const tip = cents(sub * 0.2);
      const right = cents(sub + tip);
      return {
        prompt: [`Your meal costs ${dollars(sub)}. You add a 20% tip.`, "What is the total?"],
        ...mc(rng, dollars(right), [dollars(cents(sub + 20)), dollars(cents(sub * 1.02)), dollars(cents(sub * 1.15)), dollars(tip)]),
        math: `20% of ${dollars(sub)} = ${dollars(sub)} × 0.20 = ${dollars(tip)}. ${dollars(sub)} + ${dollars(tip)} = ${dollars(right)}. Quick trick: move the decimal one place for 10%, then double it.`,
      };
    },
  },
  debitVsCredit: {
    label: "Debit vs credit",
    standard: 1,
    make(rng) {
      const q = pick(rng, [
        { q: "Which one builds credit history?", right: "A credit card you pay on time", wrong: ["A debit card", "Cash", "A gift card"], why: "Only borrowing and paying back gets reported to credit bureaus. Debit spends your own money." },
        { q: "You swipe your debit card for $20. Where does the money come from?", right: "Your checking account, right away", wrong: ["The bank lends it to you", "Your credit limit", "Next month's paycheck"], why: "Debit spends money you already have." },
        { q: "You swipe your credit card for $20. What happened?", right: "You borrowed $20 that you must pay back", wrong: ["$20 left your checking account", "You earned $20", "Nothing until you check your balance"], why: "A credit card is a loan you pay back when the bill comes." },
        { q: "Checking has $15. You try to pay $30 with debit. What happens?", right: "It's declined", wrong: ["It works and you owe $15", "It goes on your credit report", "Your score drops"], why: "In this game, a debit purchase with too little in checking is declined. Automatic payments that bounce cost an overdraft fee." },
      ]);
      return { prompt: [q.q], ...mc(rng, q.right, q.wrong), math: q.why };
    },
  },
  cardAccounting: {
    label: "Card accounting",
    standard: 2,
    make(rng) {
      const q = pick(rng, [
        { q: "You buy $40 of groceries with your credit card. Your card balance...", right: "Goes up", why: "A purchase adds to what you owe." },
        { q: "You pay $100 toward your credit card. Your card balance...", right: "Goes down", why: "A payment lowers what you owe." },
        { q: "Your card charges $9 of interest. Your card balance...", right: "Goes up", why: "Interest is added to what you owe." },
        { q: "You buy lunch with your debit card. Your credit card balance...", right: "Stays the same", why: "Debit spends from checking. Your card isn't touched." },
        { q: "A $30 late fee is charged on your card. Your card balance...", right: "Goes up", why: "Fees are added to what you owe." },
      ]);
      return { prompt: [q.q], ...mc(rng, q.right, ["Goes up", "Goes down", "Stays the same"].filter((x) => x !== q.right)), math: q.why };
    },
  },
  accountMatch: {
    label: "Account match",
    standard: 1,
    make(rng) {
      const all = ["Secured card", "Federal student loan", "Credit-builder loan", "Auto loan", "Buy now, pay later", "Authorized user"];
      const q = pick(rng, [
        { q: "You have no credit history and $200 saved. Which card is easiest to get?", right: "Secured card", why: "Your deposit backs the card, so almost everyone is approved." },
        { q: "You need money for college classes and want payments to wait until you finish.", right: "Federal student loan", why: "Federal loans wait until after school and have fixed rates." },
        { q: "You want to build credit without a card. The money stays locked until you finish paying.", right: "Credit-builder loan", why: "The lender holds the money while your on-time payments build history." },
        { q: "You want to buy a $4,000 used car and pay over 4 years.", right: "Auto loan", why: "An installment loan with a set payment each month." },
        { q: "You want to split an $80 purchase into a few payments, and it usually isn't reported.", right: "Buy now, pay later", why: "BNPL splits a purchase. It's not reported unless you miss and it goes to collections." },
        { q: "You want your parent's long, clean history to show on your report.", right: "Authorized user", why: "Joining a parent's card brings its history onto your report." },
      ]);
      return { prompt: [q.q], ...mc(rng, q.right, shuffle(rng, all.filter((x) => x !== q.right))), math: q.why };
    },
  },
  reportReading: {
    label: "Report reading",
    standard: 3,
    make(rng) {
      const q = pick(rng, [
        { lines: ["Card: $930 owed on a $1,000 limit", "24 months, all on time", "0 hard inquiries"], key: "owed", why: "93% utilization is the problem. Everything else looks strong." },
        { lines: ["Card: $50 owed on a $1,000 limit", "Two 30-day late marks this year", "1 hard inquiry"], key: "payment", why: "Late marks hurt the biggest part of the score." },
        { lines: ["Card: $40 owed on a $800 limit", "All on time", "5 hard inquiries in 6 months"], key: "newCredit", why: "Lots of recent applications hurt the new credit part." },
        { lines: ["Card: $20 owed on a $500 limit", "All on time", "Oldest account: 4 months"], key: "length", why: "Everything is good, the history is just short. Only time fixes that." },
      ]);
      const right = FACTOR_LABELS[q.key];
      return {
        prompt: ["Read this mini report:", ...q.lines.map((l) => `• ${l}`), "What's hurting this score most?"],
        ...mc(rng, right, shuffle(rng, Object.values(FACTOR_LABELS).filter((x) => x !== right))),
        math: q.why,
      };
    },
  },
  factorCheck: { label: "Factor Check", standard: 3, make: factorCheckQuestion },
};

export const DESK_QUESTIONS = 5;

export const STANDARD_LABELS = {
  1: "Std 1: Types of credit",
  2: "Std 2: Costs of credit",
  3: "Std 3: Your credit profile",
  5: "Std 5: Pitfalls",
};
