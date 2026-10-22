// Work shift minigames (SPEC §17): Ledger Sort, Cashier Rush and Check Writer.
// Plain language for a 15-year-old. No em-dashes, no semicolons.

export const JOBS = {
  ledger: {
    mark: "report",
    icon: "📒",
    title: "Ledger Sort",
    job: "Bookkeeper",
    skill: "Sort items into ASSET, LIABILITY or EQUITY.",
  },
  cashier: {
    mark: "coins",
    icon: "🪙",
    title: "Cashier Rush",
    job: "Shopkeeper",
    skill: "Count back the exact change for each customer.",
  },
  checks: {
    mark: "scroll",
    icon: "✍️",
    title: "Check Writer",
    job: "Scribe at the Vault",
    skill: "Write a check to pay a bill, then endorse your paycheck.",
  },
};

// ---------- Ledger Sort ----------

export const LEDGER_BINS = {
  asset: { label: "Asset", hint: "Something you OWN", icon: "🏠", key: "1" },
  liability: { label: "Liability", hint: "Something you OWE", icon: "📝", key: "2" },
  equity: { label: "Equity", hint: "An INVESTMENT: you own a share of a business", icon: "📈", key: "3" },
};

export const LEDGER_ITEMS = [
  { item: "Cash in your wallet", answer: "asset", why: "Cash you hold is yours." },
  { item: "Money in your savings account", answer: "asset", why: "Savings belong to you." },
  { item: "Your bike", answer: "asset", why: "You own it and could sell it." },
  { item: "A laptop you paid for", answer: "asset", why: "It's fully yours." },
  { item: "A gift card with $25 on it", answer: "asset", why: "It holds value that belongs to you." },
  { item: "The deposit on your secured card", answer: "asset", why: "It's your money. You get it back when you close or upgrade the card." },
  { item: "Lemonade your stand hasn't sold yet", answer: "asset", why: "Stock you own and plan to sell is an asset." },
  { item: "$30 a customer still owes your business", answer: "asset", why: "Money owed TO you is something you own." },
  { item: "A $100 savings bond", answer: "asset", why: "It's yours and worth money." },
  { item: "Your guitar", answer: "asset", why: "You own it and could sell it." },
  { item: "A balance on your credit card", answer: "liability", why: "It's borrowed money you owe the bank." },
  { item: "The rest of your car loan", answer: "liability", why: "You still owe it to the lender." },
  { item: "A student loan", answer: "liability", why: "You have to pay it back." },
  { item: "A buy now, pay later plan you haven't finished", answer: "liability", why: "The payments still to come are owed." },
  { item: "A phone bill you haven't paid yet", answer: "liability", why: "You owe it." },
  { item: "$40 you borrowed from your cousin", answer: "liability", why: "Money you owe a person is still a liability." },
  { item: "A payday loan due Friday", answer: "liability", why: "You owe it back soon, plus a big fee." },
  { item: "Rent that's due next week", answer: "liability", why: "It's money you owe." },
  { item: "A late library fine", answer: "liability", why: "You owe the library." },
  { item: "A clinic payment plan", answer: "liability", why: "You still owe the rest of the bill." },
  { item: "10 shares of stock in the Coinhaven Shipping Company", answer: "equity", why: "Stock is equity: you own a small piece of that company." },
  { item: "Money in an index fund that owns hundreds of companies", answer: "equity", why: "An index fund is an investment in many companies' stock. That's equity." },
  { item: "A 10% share you bought in your friend's bakery", answer: "equity", why: "You invested in the business and own part of it. That's equity." },
  { item: "A retirement account invested in stocks", answer: "equity", why: "It holds shares of companies, so it's an equity investment." },
  { item: "Company stock your job gave you as a bonus", answer: "equity", why: "Owning shares of the company you work for is equity." },
  { item: "Shares of the Vault that pay you part of its profits", answer: "equity", why: "Shares are ownership. Getting a part of the profits is one reward of equity." },
];

// ---------- Cashier Rush ----------

// Cents, biggest first. Bills and coins the cashier can hand back.
export const DENOMINATIONS = [2000, 1000, 500, 100, 25, 10, 5, 1];

export const CASHIER_ITEMS = [
  "a dragon fruit smoothie",
  "lantern oil",
  "a used spell book",
  "a bag of moon berries",
  "a scarf",
  "a bus pass refill",
  "a phone charger",
  "a loaf of honey bread",
  "two concert posters",
  "a map of the kingdom",
  "a potted mushroom",
  "a box of quills",
];

// ---------- Check Writer ----------

export const CHECK_BILLS = [
  { payee: "Hollow Oak Outfitters", memo: "Acct 4471", what: "winter coat on layaway" },
  { payee: "Market Village Water Co.", memo: "Acct 2093", what: "water bill" },
  { payee: "Thornbury Dental", memo: "Acct 7718", what: "teeth cleaning" },
  { payee: "Moonstone Lanes", memo: "Party 12", what: "bowling party" },
  { payee: "Glimmer Bay Rentals", memo: "Unit 3B", what: "beach cabin deposit" },
  { payee: "Lantern Lane Library", memo: "Card 5521", what: "lost book fee" },
];

export const CHECK_FIELDS = {
  date: "Date",
  payee: "Pay to the order of",
  amount: "Amount in numbers",
  words: "Amount in words",
  memo: "Memo",
  signature: "Signature",
};

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function underThousand(n) {
  const parts = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} hundred`);
    n %= 100;
  }
  if (n >= 20) parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
  else if (n > 0 || !parts.length) parts.push(ONES[n]);
  return parts.join(" ");
}

// 4725 cents -> "Forty-seven and 25/100" (how amounts are written on checks).
export function amountInWords(cents) {
  const dollars = Math.floor(cents / 100);
  const c = cents % 100;
  let words = dollars >= 1000 ? `${underThousand(Math.floor(dollars / 1000))} thousand${dollars % 1000 ? ` ${underThousand(dollars % 1000)}` : ""}` : underThousand(dollars);
  words = words.charAt(0).toUpperCase() + words.slice(1);
  return `${words} and ${String(c).padStart(2, "0")}/100`;
}

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\b(dollars?|only|exactly|cents?)\b/g, " ")
    .replace(/[^a-z0-9/ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Accepts small differences: capitals, hyphens, "dollars", "only", extra spaces.
export function wordsMatch(typed, cents) {
  const want = norm(amountInWords(cents));
  const got = norm(typed);
  if (got === want) return true;
  // "forty seven 25/100" without the "and" is fine too.
  return got.replace(/ and /g, " ") === want.replace(/ and /g, " ");
}

export function amountMatch(typed, cents) {
  const v = Number(String(typed || "").replace(/[$,\s]/g, ""));
  return Number.isFinite(v) && Math.round(v * 100) === cents;
}

export function payeeMatch(typed, payee) {
  const n = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return n(typed) === n(payee);
}

// Grades a check. answers = { date, payee, amount, words, memo, signed }.
export function gradeCheck(answers, { dateText, payee, cents, memo }) {
  const n = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return {
    date: n(answers.date) === n(dateText),
    payee: payeeMatch(answers.payee, payee),
    amount: amountMatch(answers.amount, cents),
    words: wordsMatch(answers.words, cents),
    memo: n(answers.memo) === n(memo),
    signature: Boolean(answers.signed),
  };
}

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
