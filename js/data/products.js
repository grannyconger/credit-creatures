// Card shop data for Design Your Card (SPEC §7) and brand icons (SPEC §4).
// Terms are simplified game values inspired by real offers, not current real terms.
export const TERMS_NOTE = "Terms are simplified for the game.";

export const NETWORKS = {
  visa: { name: "Visa", icon: "🔷" },
  mastercard: { name: "Mastercard", icon: "🟠" },
  amex: { name: "American Express", icon: "🛡️" },
  discover: { name: "Discover", icon: "🧭" },
};

export const ISSUERS = {
  capitalOne: { name: "Capital One", icon: "⛵" },
  chase: { name: "Chase", icon: "🏛️" },
  discover: { name: "Discover", icon: "🧭" },
  creditUnion: { name: "Market Village Credit Union", icon: "🤝" },
};

// Each product sets its terms at the low end of the limit slider, plus how much
// they change by the high end (t = 0 at minLimit, 1 at maxLimit).
// requiredScore null means no score is needed.
export const PRODUCTS = {
  secured: {
    label: "Secured card",
    blurb: "You put down a deposit. Your deposit is your limit.",
    secured: true,
    minLimit: 200,
    maxLimit: 500,
    apr: 0.26, aprSpread: 0,
    annualFee: 0, feeSpread: 0,
    requiredIncome: 0, incomeSpread: 0,
    requiredScore: null, scoreSpread: 0,
    baseOdds: 0.97,
    noScoreOdds: 0.97,
  },
  student: {
    label: "Student card",
    blurb: "Made for your first card. You need some income.",
    minLimit: 500,
    maxLimit: 1000,
    apr: 0.21, aprSpread: 0.03,
    annualFee: 0, feeSpread: 0,
    requiredIncome: 100, incomeSpread: 250,
    requiredScore: null, scoreSpread: 0,
    baseOdds: 0.85,
    noScoreOdds: 0.75,
  },
  creditBuilder: {
    label: "Credit-builder card",
    blurb: "Easy approval and a small limit to practice with.",
    minLimit: 300,
    maxLimit: 600,
    apr: 0.28, aprSpread: 0.02,
    annualFee: 0, feeSpread: 39,
    requiredIncome: 50, incomeSpread: 100,
    requiredScore: null, scoreSpread: 0,
    baseOdds: 0.92,
    noScoreOdds: 0.9,
  },
  premium: {
    label: "Premium travel card",
    blurb: "Big limit, travel perks and a big annual fee. Lenders want a long, strong history.",
    premium: true,
    minLimit: 5000,
    maxLimit: 20000,
    apr: 0.22, aprSpread: 0.06,
    annualFee: 395, feeSpread: 300,
    requiredIncome: 2500, incomeSpread: 5000,
    requiredScore: 740, scoreSpread: 60,
    minHistoryMonths: 24,
    baseOdds: 0.7,
    noScoreOdds: 0,
  },
};

// Which issuer offers which product, on which network, under what name.
export const OFFERS = [
  { issuer: "capitalOne", product: "secured", network: "mastercard", name: "Capital One Platinum Secured" },
  { issuer: "capitalOne", product: "student", network: "mastercard", name: "Capital One Student Card" },
  { issuer: "capitalOne", product: "premium", network: "visa", name: "Capital One Venture X", icon: "✈️" },
  { issuer: "chase", product: "student", network: "visa", name: "Chase Freedom Student" },
  { issuer: "chase", product: "premium", network: "visa", name: "Chase Sapphire Reserve", icon: "✈️" },
  { issuer: "discover", product: "secured", network: "discover", name: "Discover it Secured" },
  { issuer: "discover", product: "student", network: "discover", name: "Discover it Student" },
  { issuer: "creditUnion", product: "secured", network: "visa", name: "Credit Union Secured Visa" },
  { issuer: "creditUnion", product: "creditBuilder", network: "visa", name: "Credit Union Builder Visa" },
];

// Card looks. Fancy materials raise the fee and the bar for approval.
export const DESIGNS = {
  plasticBlue: { label: "Plastic, ocean blue", feeBump: 0, scoreBump: 0, incomeBump: 0 },
  plasticGreen: { label: "Plastic, moss green", feeBump: 0, scoreBump: 0, incomeBump: 0 },
  plasticPurple: { label: "Plastic, royal purple", feeBump: 0, scoreBump: 0, incomeBump: 0 },
  clear: { label: "Clear crystal", feeBump: 25, scoreBump: 10, incomeBump: 50 },
  metal: { label: "Brushed metal", feeBump: 95, scoreBump: 30, incomeBump: 300 },
};

export function findOffer(issuer, product) {
  return OFFERS.find((o) => o.issuer === issuer && o.product === product) || null;
}
