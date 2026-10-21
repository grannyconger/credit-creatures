// Lantern Alley (Phase 12, Chapter 5): a side street of shops with loud signs.
// Each stall shows its pitch, with the fine print one tap away. The student
// decides: trap or fair deal? Then the real cost is worked out. Most stalls
// are traps, a few are honest, so guessing "trap" every time doesn't work.
// Standard 5 (high-risk strategies and pitfalls), with some Standard 2 math.
// Plain language for a 15-year-old. No em-dashes, no semicolons.

// Monthly payment on a simple installment loan, rounded to cents.
function payment(amount, apr, months) {
  const r = apr / 12;
  return Math.round(((amount * r) / (1 - (1 + r) ** -months)) * 100) / 100;
}

const cu = { amount: 400, apr: 0.28, months: 6 };
const cuPay = payment(cu.amount, cu.apr, cu.months);
const cuInterest = Math.round(cuPay * cu.months - cu.amount);

const money = (n) => `$${n.toLocaleString("en-US")}`;

// trap: true for a trap, false for a fair deal.
// pitch: the big sign. fine: the fine print. math: the real cost, step by step.
// clue: the one thing to look for next time. better: what to do instead.
export const STALLS = [
  {
    id: "payday",
    icon: "💸",
    name: "Quick Coin Cash",
    pitch: "$300 cash today! No credit check! Pay us back on payday.",
    fine: ["Fee: $15 for every $100 you borrow.", "Due in full in 14 days.", "Can't pay? Roll it over for another $45 fee."],
    trap: true,
    math: ["$45 fee on $300 is 15% for just two weeks.", "A year has 26 two-week periods. 15% × 26 = 390% APR.", "Roll it over 4 times and you've paid $225 in fees and still owe the $300."],
    clue: "A small fee over a very short time is a huge APR.",
    better: "A small emergency fund in savings, or a small loan from a credit union.",
  },
  {
    id: "creditUnion",
    icon: "🏛️",
    name: "Coinhaven Credit Union",
    pitch: `Small loans for members: ${money(cu.amount)} for ${cu.months} months.`,
    fine: [`APR: ${Math.round(cu.apr * 100)}%. The highest a credit union may charge on this kind of loan.`, `Payment: ${money(cuPay)} a month for ${cu.months} months.`, "On-time payments are reported to the credit bureaus."],
    trap: false,
    math: [`${cu.months} payments of ${money(cuPay)} is about ${money(cu.amount + cuInterest)} in all.`, `That's about ${money(cuInterest)} of interest to borrow ${money(cu.amount)} for half a year.`, "Paying on time also builds your credit history."],
    clue: "A clear APR, a fixed payment and a set end date.",
    better: "This is the better choice when you truly need to borrow.",
  },
  {
    id: "titleLoan",
    icon: "🛻",
    name: "Wagon Title Loans",
    pitch: "$1,000 for your wagon's title. Keep driving it!",
    fine: ["Fee: 25% of the loan every month.", "Due in full in 30 days.", "Miss a payment and we take the wagon."],
    trap: true,
    math: ["25% of $1,000 is $250 a month just in fees.", "25% a month × 12 months = 300% APR.", "About 1 in 5 people who take a title loan lose their vehicle."],
    clue: "Any loan that can take the thing you need to get to work.",
    better: "Talk to your lender about a payment plan, or borrow from a credit union.",
  },
  {
    id: "securedCard",
    icon: "🛡️",
    name: "Starter Secured Card",
    pitch: "Build credit with a $200 deposit. Get it back when you upgrade.",
    fine: ["Credit limit: $200, the same as your deposit.", "No annual fee. APR: 25% on any balance you carry.", "Reports to all three credit bureaus every month."],
    trap: false,
    math: ["Pay the full statement balance every month and the 25% APR costs you $0.", "Keep the balance under $60 (30% of $200) to help your score.", "After about a year of on-time payments, many banks upgrade you and return the $200."],
    clue: "No annual fee and it reports to the bureaus. You control the cost by paying in full.",
    better: "A great first card if you can't get a regular one yet.",
  },
  {
    id: "rentToOwn",
    icon: "🎮",
    name: "Rent-a-Wonder",
    pitch: "New game console for just $25 a week! No credit needed!",
    fine: ["78 weekly payments to own it.", "Miss a week and we pick it up. Payments already made are not returned.", "Same console at Shimmer Market: $500."],
    trap: true,
    math: ["$25 × 78 weeks = $1,950.", "That's $1,450 more than buying it outright.", "Saving $25 a week would buy it in 20 weeks."],
    clue: "A small weekly price with a very long count of payments.",
    better: "Save up for 20 weeks, or buy a used one.",
  },
  {
    id: "settlement",
    icon: "📢",
    name: "Debt Be Gone",
    pitch: "Cut your credit card debt in HALF! Stop paying your cards and pay us instead.",
    fine: ["Our fee: 20% of the debt you enroll.", "You stop paying your cards while we 'negotiate'. Results not guaranteed.", "Late fees and interest keep growing while you wait."],
    trap: true,
    math: ["On $4,000 of card debt, the fee is $800.", "Months of missed payments mean a late mark every month, and maybe collections.", "Payment history is 35% of your score, the biggest part."],
    clue: "Anyone who tells you to stop paying your bills.",
    better: "Call your card company and ask for a lower rate or a payment plan, or see a nonprofit credit counselor.",
  },
  {
    id: "freeReport",
    icon: "📜",
    name: "Hall of Records: Free Report",
    pitch: "See your credit report from all three bureaus. Free, every week.",
    fine: ["No credit card needed. No trial that turns into a fee.", "Checking your own report never hurts your score.", "In the real world: AnnualCreditReport.com."],
    trap: false,
    math: ["Cost: $0.", "Spotting one mistake early can save you from a denied loan or a higher rate.", "Disputing an error with the bureau is free too."],
    clue: "Free really means free, and it's the official site.",
    better: "Check your report a few times a year.",
  },
  {
    id: "creditRepair",
    icon: "🪄",
    name: "Magic Credit Fixers",
    pitch: "We erase late payments from your report! Only $99 a month.",
    fine: ["Monthly fee charged before any work is done.", "We dispute every item on your report, true or not.", "No refunds."],
    trap: true,
    math: ["Six months of service is $594.", "Nobody can legally remove true information. A real late mark stays for 7 years.", "You can dispute real mistakes yourself for free."],
    clue: "A promise to erase true information, with payment up front.",
    better: "Dispute real errors yourself, then build new on-time history.",
  },
  {
    id: "deferredInterest",
    icon: "🛋️",
    name: "Comfy Couch Barn",
    pitch: "No interest if paid in full in 12 months!*",
    fine: ["*Interest is charged back to the day you bought it if the balance isn't paid in full by month 12.", "APR after the promo: 29.99%.", "Couch price: $1,200."],
    trap: true,
    math: ["Pay $1,150 by month 12 and still owe $50?", "You're charged interest on the whole balance for the whole year: about $190 at once.", "It isn't 'no interest'. It's 'interest later, if you slip'."],
    clue: "An asterisk next to 'no interest'. Look for the words 'deferred interest'.",
    better: "Divide the price by 11 and pay that every month, so it's gone a month early. Or save first.",
  },
  {
    id: "pawn",
    icon: "🎸",
    name: "Gold Tooth Pawn",
    pitch: "Instant $100 for your guitar! Pick it up any time!",
    fine: ["Pay back $125 within 30 days to get the guitar back.", "After 30 days, the guitar belongs to the shop.", "The shop sells it for $300."],
    trap: true,
    math: ["$25 for one month on $100 is 25% a month.", "25% × 12 = 300% APR.", "Miss the date and you lose a $300 guitar for $100."],
    clue: "A loan where missing one date means you lose the thing for good.",
    better: "Sell something you don't need, or pick up an extra shift.",
  },
];

export const STALL_BY_ID = Object.fromEntries(STALLS.map((s) => [s.id, s]));

// How many stalls are checked and how many were called right.
export function alleyProgress(play) {
  const checked = play.alley?.checked || {};
  const ids = STALLS.filter((s) => checked[s.id]).map((s) => s.id);
  return { checked: ids.length, right: ids.filter((id) => checked[id].right).length, total: STALLS.length };
}
