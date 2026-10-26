// Work shift minigames (SPEC §17): Ledger Sort, Cashier Rush and Check Writer.
// Plain language for a 15-year-old. No em-dashes, no semicolons.

export const JOBS = {
  // The GAME-SPECS.md games (2026-10-25). Their settings, rules and results
  // run through js/ui/arcade/runner.js.
  billdrop: {
    mark: "calendar",
    icon: "📅",
    title: "Bill Drop",
    job: "Month manager",
    skill: "Log every bill, schedule it, and keep your balance above $0 all month.",
  },
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
  // Five more jobs that open in Chapter 1 (teacher request 2026-10-22).
  overdraft: {
    mark: "alert",
    icon: "🛑",
    title: "Spot the Overdraft",
    job: "Teller at the Vault",
    skill: "Stop the one purchase that would drop checking below $0.",
  },
  register: {
    mark: "receipt",
    icon: "🧾",
    title: "Register Balancer",
    job: "Bookkeeper's helper",
    skill: "Keep a running balance, and dispute charges that look wrong.",
  },
  checkhunt: {
    mark: "statement",
    icon: "🔎",
    title: "Check Anatomy Hunt",
    job: "Vault clerk",
    skill: "Find each part of a check and spot one that's no good.",
  },
  drawer: {
    mark: "piggy",
    icon: "💵",
    title: "Count the Drawer",
    job: "Closing shift at Market",
    skill: "Count the cash drawer and find out if it's over or short.",
  },
  fees: {
    mark: "statement",
    icon: "🕵️",
    title: "Fee Detective",
    job: "Statement auditor at the Vault",
    skill: "Tap every fee on a bank statement, then say how to avoid each one.",
  },
  unitprice: {
    mark: "market",
    icon: "⚖️",
    title: "Unit Price Showdown",
    job: "Market price checker",
    skill: "Pick the better buy by its price per unit, not its size.",
  },
};

// ---------- Spot the Overdraft and Register Balancer ----------

// Fictional places to spend and ways to get paid.
export const SPENDS = [
  "Trader Zoe's", "Starducks", "Gamestomp", "Tuber", "Foot Rocker", "Benny's Diner",
  "Barnes & Noodle", "Verizoom", "Greybound Bus Pass", "Wreck Bike Shop", "Wetco Pet Supply", "Pride Laundry",
];
export const EARNINGS = ["Paycheck from the Arcade", "Birthday money from Grandma", "Refund from Foot Rocker", "Tutoring pay", "Sold an old game"];
export const CHECK_PAYEES = ["Pillow Rentals", "Gulligan Water Co.", "Dr. Fernsby's Office", "Guitar Renter Music School", "Hilltop Soccer Club"];

// ---------- Check Anatomy Hunt ----------

// Each part of a check, what to tap, and what it does.
export const CHECK_PARTS = {
  routing: { ask: "the routing number", why: "The routing number tells which bank the check is from. It's the first group on the bottom line." },
  account: { ask: "the account number", why: "The account number is the writer's account at that bank. It comes after the routing number." },
  checkno: { ask: "the check number", why: "The check number helps you track each check. It's in the top corner and at the end of the bottom line." },
  payee: { ask: "who gets paid (the payee)", why: "The payee is the person or business the money goes to." },
  amount: { ask: "the amount in numbers", why: "The amount in numbers goes in the box by the dollar sign." },
  words: { ask: "the amount in words", why: "The amount in words is the official amount. It has to match the numbers." },
  date: { ask: "the date", why: "The date shows when the check was written." },
  memo: { ask: "the memo line", why: "The memo is a note about what the check is for. It's optional, but it helps you remember." },
  signature: { ask: "the signature", why: "A check isn't valid until the person who owns the account signs it." },
};
// The planted problems for "Is this check good to cash?"
export const CHECK_FLAWS = {
  ok: "Everything matches and it's signed, so it's good to cash.",
  unsigned: "There's no signature, so the bank won't cash it.",
  mismatch: "The numbers and the words don't match. The bank goes by the words, or sends it back.",
  nodate: "It has no date. Most banks won't take a check without one.",
};

// ---------- Count the Drawer ----------

// Starting cash in the drawer (the float), in cents. Round amounts, like a real till.
export const DRAWER_FLOATS = [2500, 5000, 7500, 10000];

// ---------- Unit Price Showdown ----------

// Fictional products. price in cents, qty in the unit shown. kind groups the
// ones that compare fairly (same thing, different packs or brands).
export const PRODUCTS = [
  { kind: "cereal", name: "Cap'n Munch", unit: "oz", sizes: [[12, 349], [18, 459], [32, 849]] },
  { kind: "cereal", name: "Honey Nut Cheeri-Goes", unit: "oz", sizes: [[10, 299], [20, 529]] },
  { kind: "juice", name: "Scott's Apple Juice", unit: "fl oz", sizes: [[32, 299], [64, 549], [96, 899]] },
  { kind: "juice", name: "Kelch's Grape Juice", unit: "fl oz", sizes: [[48, 429], [128, 1099]] },
  { kind: "soap", name: "Yawn Dish Soap", unit: "fl oz", sizes: [[16, 249], [28, 399], [40, 649]] },
  { kind: "pencils", name: "Pixon Pencils", unit: "pencils", sizes: [[12, 299], [24, 499], [48, 1099]] },
  { kind: "pencils", name: "Paper Skate Pencils", unit: "pencils", sizes: [[10, 199], [30, 649]] },
  { kind: "kibble", name: "Pedi-Free Kibble", unit: "lb", sizes: [[4, 899], [15, 2799], [30, 5999]] },
  { kind: "chips", name: "Pay's Chips", unit: "oz", sizes: [[8, 329], [16, 529], [32, 1149]] },
  { kind: "water", name: "Roland Spring Water", unit: "bottles", sizes: [[12, 449], [24, 799], [35, 1299]] },
];
export const UNIT_TIPS = [
  "Bigger is not always cheaper. Check the price per unit.",
  "Unit price means the price for one ounce, one pencil or one bottle. It makes different sizes fair to compare.",
  "A low unit price isn't a deal if the food goes bad before you use it.",
  "Store shelf tags often show the unit price in small print. Look for it.",
];

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
  { payee: "The North Pace", memo: "Acct 4471", what: "winter coat on layaway" },
  { payee: "Gulligan Water Co.", memo: "Acct 2093", what: "water bill" },
  { payee: "Gaspen Dental", memo: "Acct 7718", what: "teeth cleaning" },
  { payee: "Bowl Hero Lanes", memo: "Party 12", what: "bowling party" },
  { payee: "Hairbnb", memo: "Unit 3B", what: "beach cabin deposit" },
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

// ---------- Fee Detective ----------

// The fees a checking statement can hold. line is how the bank prints it.
// amounts are in cents. avoid is the right answer to "how could you avoid
// this?", wrong are two answers that sound okay but don't work.
export const FEE_KINDS = {
  maintenance: {
    line: "MONTHLY MAINTENANCE FEE",
    amounts: [500, 800, 1000, 1200],
    why: "A maintenance fee is what some banks charge just for having the account.",
    avoid: "Keep the minimum balance or set up direct deposit. Many banks drop the fee then.",
    wrong: ["Close and reopen the account every month.", "Pay your bills with checks so it doesn't count."],
  },
  overdraft: {
    line: "OVERDRAFT FEE",
    amounts: [3500],
    why: "An overdraft fee is charged when a purchase is bigger than your balance and the bank pays it anyway.",
    avoid: "Check your balance before you buy, and turn on low-balance alerts.",
    wrong: ["Buy it anyway and hope the bank forgets.", "Only shop on weekends."],
  },
  atm: {
    line: "OUT-OF-NETWORK ATM FEE",
    amounts: [300, 350, 400, 450],
    why: "You pay this when you use an ATM that doesn't belong to your bank.",
    avoid: "Use your own bank's ATMs, or ask for cash back at a store.",
    wrong: ["Take out cash in smaller amounts, more often.", "Use the ATM at night."],
  },
  paper: {
    line: "PAPER STATEMENT FEE",
    amounts: [200, 300, 500],
    why: "Some banks charge you for mailing a paper statement.",
    avoid: "Switch to free online statements.",
    wrong: ["Throw the paper statements away.", "Ask the bank to send two copies."],
  },
  inactive: {
    line: "ACCOUNT INACTIVITY FEE",
    amounts: [500, 1000],
    why: "A bank may charge this when an account sits unused for months.",
    avoid: "Make a deposit or a debit card purchase every few months.",
    wrong: ["Never touch the account.", "Check your balance more often."],
  },
};

// Lines that are not fees, and what to say if a student taps one.
export const FEE_DECOYS = {
  purchase: "That's a purchase you chose to make. It's not a fee.",
  deposit: "That's money coming in. A fee is money going out.",
  transfer: "Moving your own money to savings isn't a fee. It's still yours.",
  interest: "Interest earned is money the bank pays you. It's the opposite of a fee.",
};
export const FEE_TRANSFERS = ["Transfer to savings", "Transfer from savings"];
