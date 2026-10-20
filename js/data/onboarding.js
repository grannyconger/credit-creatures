// Student-facing text for onboarding (SPEC §6 and §7).
// Plain language for a 15-year-old. No em-dashes, no semicolons.

export const TEEN_OPTIONS = {
  parentCard: {
    icon: "👪",
    title: "Join a parent's card",
    text: "You become an authorized user. You can't spend on it, but the card's history shows up on your credit report.",
    catch: "You don't get to pick which parent. Some pay on time. Some max out their card. You will find out from your report.",
  },
  teenDebit: {
    icon: "💳",
    title: "Get a teen debit card",
    text: "It spends money that is already in your checking account. No borrowing, no bills, no risk.",
    catch: "Debit cards are not reported to credit bureaus, so they don't build credit.",
  },
};

// The tutorial shift: sort each item into what you OWN or what you OWE.
export const SHIFT_ITEMS = [
  { item: "Your bike", answer: "asset", why: "You own the bike. Things you own are assets." },
  { item: "$40 you borrowed from your cousin", answer: "liability", why: "You have to pay it back. Money you owe is a liability." },
  { item: "Money in your savings account", answer: "asset", why: "That money belongs to you, so it is an asset." },
  { item: "A phone bill you have not paid yet", answer: "liability", why: "You still owe it, so it is a liability." },
  { item: "Your guitar", answer: "asset", why: "You own it and could sell it. That makes it an asset." },
  { item: "A balance on a credit card", answer: "liability", why: "A card balance is borrowed money you owe the bank." },
  { item: "A gift card with $25 on it", answer: "asset", why: "It holds value that belongs to you." },
  { item: "A late library fine", answer: "liability", why: "You owe the library, so it is a liability." },
  { item: "A car you paid off", answer: "asset", why: "It's fully yours now, so it is an asset." },
  { item: "The rest of a car loan", answer: "liability", why: "The loan is money you still owe the lender." },
  { item: "A $100 savings bond", answer: "asset", why: "It belongs to you and is worth money." },
  { item: "A buy now, pay later plan you haven't finished", answer: "liability", why: "The payments still to come are money you owe." },
  { item: "Cash in your wallet", answer: "asset", why: "Cash you hold is something you own." },
  { item: "A student loan", answer: "liability", why: "You have to pay it back, so it is a liability." },
  { item: "A payday loan due Friday", answer: "liability", why: "You owe it back soon, plus a big fee." },
  { item: "A deposit on your secured card", answer: "asset", why: "It's your money held by the bank. You get it back when you close or upgrade the card." },
];

export const SHIFT_ITEMS_PER_SHIFT = 4;

export const FIRST_PURCHASES = [
  { item: "Lantern oil", icon: "🪔", price: 12 },
  { item: "Dragon fruit smoothie", icon: "🥤", price: 6 },
  { item: "Used spell book", icon: "📖", price: 18 },
];

// The tour of the 5 score factors, each with a life choice that moves it.
export const FACTOR_TOUR = [
  {
    key: "payment",
    icon: "⏰",
    weight: "35%",
    title: "Payment history",
    means: "Do you pay your bills on time? This is the biggest part of your score. A long record of on-time payments counts more than a short one.",
    example: "You forget to pay your card while on a trip. A late payment lands on your record and your score drops.",
  },
  {
    key: "owed",
    icon: "📊",
    weight: "30%",
    title: "Amounts owed",
    means: "How much of your credit limit are you using? Using less looks safer.",
    example: "You put a $450 laptop on a card with a $500 limit. You are using 90% of your limit and your score drops.",
  },
  {
    key: "length",
    icon: "🌳",
    weight: "15%",
    title: "Length of history",
    means: "How long have your accounts been open? Older is better.",
    example: "You close your first card because you got a new one. Your oldest account disappears and this part drops.",
  },
  {
    key: "mix",
    icon: "🧩",
    weight: "10%",
    title: "Credit mix",
    means: "Do you handle more than one kind of credit, like a card and a loan?",
    example: "You take a car loan while you already have a card. Now you handle two kinds of credit, and this part goes up.",
  },
  {
    key: "newCredit",
    icon: "🆕",
    weight: "10%",
    title: "New credit",
    means: "How often have you applied for credit lately? Each application is a hard inquiry.",
    example: "You apply for 3 store cards for holiday discounts. That is 3 hard inquiries in one month, and this part drops.",
  },
];

// Lenders vs payment networks (SPEC §7), 3 screens.
export const NETWORK_SLIDES = [
  {
    icon: "🛣️",
    title: "The network is the road",
    body: [
      "Visa 🔷 and Mastercard 🟠 are payment networks.",
      "When you tap your card, the network carries the payment from the store to your bank, like a road carries cars.",
      "Networks do not lend you money. They never decide if you get a card.",
    ],
  },
  {
    icon: "🏦",
    title: "The issuer is the lender",
    body: [
      "Capital One ⛵, Chase 🏛️, and two local credit unions, Greenville Federal Credit Union 🌲 and Truliant 🌟, are issuers.",
      "The issuer looks at your application, decides yes or no, and sets your limit and your APR (the yearly interest rate).",
      "The issuer is who sends your bill each month.",
    ],
  },
  {
    icon: "🚗",
    title: "Putting it together",
    body: [
      "Some companies do both. American Express 🛡️ and Discover 🧭 run their own network and also lend.",
      "Think of it this way. The network is the highway. The issuer is the car company that decides whether to sell you a car, and on what terms.",
      "On the next screen you will design a card and apply to an issuer.",
    ],
  },
];

export const NETWORK_QUIZ = {
  question: "You apply for a Capital One card that runs on Mastercard. Who decides your credit limit?",
  options: [
    { text: "Capital One", correct: true },
    { text: "Mastercard", correct: false },
  ],
  right: "Right. Capital One is the issuer, so it decides your limit and APR. Mastercard only carries the payments.",
  wrong: "Not quite. Mastercard is the network. It only carries payments. Capital One is the issuer, so it sets your limit.",
};

export const TRADEOFF_HELP = {
  risk: "How likely the issuer is to say no.",
  apr: "The yearly interest rate on any balance you carry.",
  annualFee: "What you pay each year just to have the card.",
  requiredIncome: "How much the issuer wants you to earn each month.",
  requiredScore: "The credit score the issuer looks for.",
};
