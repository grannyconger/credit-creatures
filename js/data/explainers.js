// My Score text, score bands, inbox types and Account Management themes (SPEC §11, §14).
// Plain language for a 15-year-old. No em-dashes, no semicolons.

// "Life choice -> factor movement" (SPEC §11). Each factor has choices that
// raise it and choices that lower it.
export const FACTOR_EXPLAINERS = {
  payment: {
    icon: "⏰",
    means: "Do you pay at least the minimum by the due date, every time?",
    up: ["Paying every bill on time, month after month", "Turning on AutoPay and keeping enough in checking"],
    down: ["Forgetting to pay your card while on a trip", "A cosigned friend missing a payment", "Ignoring a bill until it goes to collections"],
  },
  owed: {
    icon: "📊",
    means: "How much of your credit limits are you using? Under 30% is good. Under 10% is great.",
    up: ["Paying your statement in full", "Getting a higher limit and keeping the same balance", "Paying down a loan"],
    down: ["Putting a $450 laptop on a $500 limit card", "Maxing out a card for a trip", "Taking a cash advance"],
  },
  length: {
    icon: "🌳",
    means: "How long have your accounts been open? Older is better, and it only grows with time.",
    up: ["Keeping your first card open and using it a little", "Simply waiting while you pay on time"],
    down: ["Closing your first card because you got a new one", "Opening several new accounts, which lowers your average age"],
  },
  mix: {
    icon: "🧩",
    means: "Do you handle more than one kind of credit, like a card and a loan?",
    up: ["Taking a car loan while you already have a card", "Paying off a credit-builder loan"],
    down: ["Closing your only card", "Having only one kind of account"],
  },
  newCredit: {
    icon: "🆕",
    means: "Have you applied for a lot of credit lately? Each application is a hard inquiry.",
    up: ["Waiting a year, so old inquiries stop counting", "Saying no to store card offers"],
    down: ["Applying for 3 store cards for holiday discounts", "Applying for a card you are very likely to be denied"],
  },
};

// FICO-style bands. Always shown with their name, never by color alone.
export const SCORE_BANDS = [
  { min: 300, max: 579, label: "Poor", color: "#b3261e" },
  { min: 580, max: 669, label: "Fair", color: "#b45f06" },
  { min: 670, max: 739, label: "Good", color: "#8a7400" },
  { min: 740, max: 799, label: "Very good", color: "#3f7d3a" },
  { min: 800, max: 850, label: "Excellent", color: "#1f6b4f" },
];

export function bandFor(score) {
  return SCORE_BANDS.find((b) => score >= b.min && score <= b.max) || SCORE_BANDS[0];
}

// Notifications inbox (SPEC §14). Each type has its own icon and color.
export const INBOX_TYPES = {
  fee: { icon: "💸", label: "Fee charged", tone: "red" },
  due: { icon: "⏰", label: "Payment due soon", tone: "amber" },
  payment: { icon: "✅", label: "Payment received", tone: "green" },
  scoreUp: { icon: "📈", label: "Score change", tone: "blue" },
  scoreDown: { icon: "📉", label: "Score change", tone: "blue" },
  statement: { icon: "🧾", label: "Statement ready", tone: "blue" },
  alert: { icon: "🚨", label: "Report alert", tone: "red" },
  chapter: { icon: "📣", label: "Chapter update", tone: "purple" },
  achievement: { icon: "🏆", label: "Achievement", tone: "gold" },
};

export const INBOX_KEPT = 40;
