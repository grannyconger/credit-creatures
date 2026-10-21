// Life cards (SPEC §8): one random event each month. Same shape as a Decision
// card (js/data/scenarios.js), plus amount: [min, max] rolled from the seed,
// and effect: changes to this month's play (shiftsCut, shiftBonus).
// Plain language for a 15-year-old. No em-dashes, no semicolons.
import { CONFIG } from "./config.js";
import { dollars } from "../engine/index.js";

const hasCar = (life) => life.accounts.some((a) => a.type === "autoLoan" && a.status === "open");

// A cost the student can pay with the "Pay with" picker or skip.
function pay(item, amount, { methods = ["debit", "card", "bnpl"], label, outcome = "Paid and done." } = {}) {
  return { key: "pay", label: label || `Pay ${dollars(amount)}`, cost: { amount, item, methods }, outcome, quality: "good" };
}

// Money that comes in. Saving some is the better habit.
function windfall(amount, source) {
  const half = Math.round(amount / 2);
  return [
    {
      key: "save",
      label: `Save half (${dollars(half)})`,
      steps: [["receiveCash", amount, source], ["moveToSavings", half]],
      outcome: `${dollars(half)} went to savings and ${dollars(amount - half)} to checking. Savings are your emergency fund.`,
      quality: "good",
    },
    { key: "keep", label: "Keep it all in checking", steps: [["receiveCash", amount, source]], outcome: `${dollars(amount)} went into checking.`, quality: "ok" },
  ];
}

export const LIFE_EVENTS = [
  {
    id: "bikeRepair",
    icon: "🚲",
    title: "Flat tire",
    kind: "need",
    amount: [60, 95],
    once: false,
    fits: (life) => !hasCar(life),
    text: (life, { amount }) => [`Your bike got a flat and a bent wheel on the way to work. The repair costs ${dollars(amount)}.`],
    choices: (life, { amount }) => [
      pay("bike repair", amount),
      { key: "walk", label: "Walk for now", effect: { shiftsCut: 1 }, outcome: "Walking takes longer. You can work one fewer shift this month.", quality: "ok" },
    ],
  },
  {
    id: "carRepair",
    icon: "🔧",
    title: "Car trouble",
    kind: "need",
    amount: [300, 450],
    once: false,
    weight: 1.5,
    fits: (life) => hasCar(life),
    text: (life, { amount }) => [`Your car won't start. The mechanic says the repair costs ${dollars(amount)}.`, "You still owe the car loan payment either way."],
    choices: (life, { amount }) => [
      pay("car repair", amount),
      { key: "bus", label: "Take the bus this month", effect: { shiftsCut: 1 }, outcome: "The car waits. The bus makes you late, so you lose a shift this month.", quality: "ok" },
    ],
  },
  {
    id: "brokenPhone",
    icon: "📵",
    title: "Cracked phone",
    kind: "need",
    amount: [120, 180],
    fits: () => true,
    text: (life, { amount }) => [`You dropped your phone and the screen shattered. A new one costs ${dollars(amount)}.`],
    choices: (life, { amount }) => [
      pay("new phone", amount),
      { key: "keep", label: "Live with the cracks", outcome: "It still works. Mostly. Your money stays put.", quality: "good" },
    ],
  },
  {
    id: "urgentCare",
    icon: "🩺",
    title: "A trip to urgent care",
    kind: "need",
    amount: [150, 260],
    fits: () => true,
    text: (life, { amount }) => [`You sprained your wrist. The urgent care bill is ${dollars(amount)}.`, "The clinic also offers a free 3-month payment plan."],
    choices: (life, { amount }) => {
      const part = Math.ceil(amount / 3);
      return [
        pay("urgent care bill", amount, { methods: ["debit", "card"] }),
        {
          key: "plan",
          label: `Payment plan: ${dollars(part)} for 3 months`,
          steps: [["addBill", "Clinic payment plan", part, 3]],
          outcome: "No interest. The payment comes out of checking at each End Month. Medical bills that go unpaid can end up in collections.",
          quality: "good",
        },
      ];
    },
  },
  {
    id: "birthdayMoney",
    icon: "🎂",
    title: "Birthday money!",
    kind: "income",
    amount: [40, 80],
    fits: () => true,
    text: (life, { amount }) => [`Your grandparent sent ${dollars(amount)} in a birthday card.`],
    choices: (life, { amount }) => windfall(amount, "birthday money"),
  },
  {
    id: "taxRefund",
    icon: "🧾",
    title: "Tax refund",
    kind: "income",
    amount: [120, 220],
    minChapter: 3,
    fits: () => true,
    text: (life, { amount }) => [`Your job took out a little too much tax from your pay. The kingdom sent back ${dollars(amount)}.`],
    choices: (life, { amount }) => windfall(amount, "tax refund"),
  },
  {
    id: "extraShift",
    icon: "⏱️",
    title: "Extra hours",
    kind: "income",
    amount: [60, 100],
    once: false,
    fits: () => true,
    text: (life, { amount }) => [`A coworker was sick and you covered their shift. You earned ${dollars(amount)}.`],
    choices: (life, { amount }) => [{ key: "ok", label: "Nice!", steps: [["earn", amount, "extra shift"]], outcome: `${dollars(amount)} of pay went into checking.`, quality: "good" }],
  },
  {
    id: "raise",
    icon: "📈",
    title: "You got a raise",
    kind: "income",
    fits: () => true,
    text: () => [`Your boss at The Gilded Vault is impressed. Every work shift now pays ${dollars(CONFIG.play.raiseBonus)} more.`],
    choices: () => [{ key: "ok", label: "Thank you!", effect: { shiftBonus: CONFIG.play.raiseBonus }, outcome: "More income makes bills easier and helps when lenders check what you earn.", quality: "good" }],
  },
  {
    id: "cutHours",
    icon: "📉",
    title: "Fewer hours",
    kind: "note",
    once: false,
    fits: () => true,
    text: () => ["Business is slow, so the bookkeeper cut your hours. You can work one fewer shift this month."],
    choices: () => [{ key: "ok", label: "Okay", effect: { shiftsCut: 1 }, outcome: "Less pay this month. Check that your bills are still covered.", quality: "ok" }],
  },
  {
    id: "friendGift",
    icon: "🎁",
    title: "A friend's birthday",
    kind: "want",
    amount: [25, 40],
    once: false,
    fits: () => true,
    text: (life, { amount }) => [`It's your best friend's birthday. The gift you have in mind costs ${dollars(amount)}.`],
    choices: (life, { amount }) => [
      pay("birthday gift", amount, { methods: ["debit", "card"], label: `Buy the gift (${dollars(amount)})`, outcome: "Your friend loved it." }),
      { key: "card", label: "Make a card by hand", outcome: "Free, and your friend kept it on their wall.", quality: "good" },
    ],
  },
  {
    id: "concert",
    icon: "🎸",
    title: "Concert tickets",
    kind: "want",
    amount: [80, 120],
    fits: () => true,
    text: (life, { amount }) => [`The Moonlit Lutes are playing the town square! Tickets cost ${dollars(amount)}.`],
    choices: (life, { amount }) => [
      { ...pay("concert ticket", amount, { label: `Buy a ticket (${dollars(amount)})`, outcome: "What a night!" }), quality: "ok" },
      { key: "skip", label: "Skip it", outcome: "You listened from the hill outside for free.", quality: "good" },
    ],
  },
  {
    id: "workShoes",
    icon: "👟",
    title: "Work shoes",
    kind: "need",
    amount: [50, 70],
    fits: () => true,
    text: (life, { amount }) => [`Your boss says you need proper work shoes. They cost ${dollars(amount)}.`],
    choices: (life, { amount }) => [pay("work shoes", amount, { label: `Buy the shoes (${dollars(amount)})` })],
  },
  {
    id: "textbooks",
    icon: "📖",
    title: "Textbooks",
    kind: "need",
    amount: [80, 140],
    once: false,
    fits: (life) => life.inSchool,
    text: (life, { amount }) => [`Your class needs a new textbook. It costs ${dollars(amount)}.`],
    choices: (life, { amount }) => [
      pay("textbook", amount, { methods: ["debit", "card"] }),
      { key: "library", label: "Borrow the library copy", outcome: "Free, but you can only read it in the library.", quality: "good" },
    ],
  },
  {
    id: "foundMoney",
    icon: "🪙",
    title: "Lucky find",
    kind: "income",
    amount: [10, 25],
    once: false,
    fits: () => true,
    text: (life, { amount }) => [`You found ${dollars(amount)} in an old coat pocket.`],
    choices: (life, { amount }) => [{ key: "ok", label: "Score!", steps: [["receiveCash", amount, "an old coat pocket"]], outcome: `${dollars(amount)} went into checking.`, quality: "good" }],
  },
];

export const LIFE_EVENT_BY_ID = Object.fromEntries(LIFE_EVENTS.map((e) => [e.id, e]));

// Life events that also fit Chapter 1 (age 16, a checking account and no credit yet).
for (const id of ["bikeRepair", "brokenPhone", "birthdayMoney", "extraShift", "raise", "cutHours", "friendGift", "concert", "workShoes", "foundMoney"]) LIFE_EVENTS.find((e) => e.id === id).minChapter = 1;
