// Every tunable number in the game lives here (SPEC §19).
// Engine code reads these values. Change numbers here, not in the engine.
export const CONFIG = {
  pacing: {
    monthsPerChapter: 3,
    decisionCardsPerMonth: 5,
    // One-time cards per month (priority cards don't count). This spreads the
    // pilot's ~20 scenarios across the semester. Everyday cards fill the rest.
    newCardsPerMonth: 2,
    everydayCardsPerMonth: 1,
    // From this chapter on, one-time cards already played can come back once the new ones run out.
    replayFromChapter: 9,
    shiftsPerMonth: 3,
    payPerShift: [40, 120],
    sessionMinutes: 15,
    sparkle: { perChapter: 10, total: 30 },
    // XP (SPEC §16). It never goes down, and there's no lifetime cap. Only right
    // answers repeat without limit, so their XP is capped per chapter.
    // alleyStall: bonus XP for each Lantern Alley stall called right, once each.
    xp: { rightAnswer: 5, shift: 5, reflection: 25, answersPerChapter: 100, alleyStall: 10 },
  },

  // Friends, groups and gifts (Phase 8). firestore.rules repeats giftHours,
  // giftMin, giftMax and groupMax, so change both places together.
  social: { giftHours: 40, giftMin: 5, giftMax: 50, groupMax: 6 },

  // The month loop after Chapter 1 (SPEC §8).
  play: {
    raiseBonus: 10,
    cashAdvanceFee: { percent: 0.05, min: 10 },
    // Work shift minigames (SPEC §17). Pay stays between min and max, plus experience.
    jobs: {
      pay: { min: 40, max: 120 },
      // Every `everyShifts` shifts at one job adds `bonus` dollars, up to `max`.
      experience: { everyShifts: 3, bonus: 5, max: 20 },
      ledger: { seconds: 45, untimedItems: 12, perRight: 8, perWrong: 4 },
      cashier: { seconds: 60, untimedCustomers: 6, perRight: 14 },
      checks: { perField: 13 },
    },
    monthRecordsKept: 6,
  },

  // Age 16 to 18 (SPEC §6). The tutorial plays a few months, then a time skip runs the rest.
  onboarding: {
    startAgeMonths: 16 * 12,
    cardAgeMonths: 18 * 12,
    tutorialMonths: 2,
    tutorialShift: { base: 20, perCorrect: 15 },
    // Phase 10 prologue: shifts before the bank opens (3 are needed, up to this many allowed).
    prologueShifts: 5,
    // Monthly part-time pay during the time skip, and the share of it spent.
    teenIncome: [80, 160],
    teenSpendShare: [0.45, 0.8],
    teenSpending: ["snacks", "games", "clothes", "movie night", "phone case", "gas money"],
  },

  // Monthly bills that start at age 18.
  bills: {
    // Chapter 1 (age 16): the first bill, paid from checking.
    teenPhone: 25,
    phone: 45,
    busPass: 30,
  },

  fees: {
    late: 30,
    overdraft: 35,
    bnplLate: 7,
  },

  minPayment: {
    floor: 25,
    percent: 0.02,
  },

  credit: {
    // Months of unpaid minimums before the account goes to collections (30, 60, 90, 120 days).
    collectionsAfterMonths: 4,
    inquiryCountsMonths: 12,
    inquiryShowsMonths: 24,
    reportGridMonths: 24,
    statementsKept: 24,
    incomeMonthsAveraged: 3,
  },

  bnpl: {
    // Share of the price due at checkout, then at each following End Month (about 6 weeks total).
    schedule: [0.25, 0.5, 0.25],
  },

  loans: {
    creditBuilder: { amount: 500, termMonths: 12, apr: 0.06 },
    federalStudent: { apr: 0.055, termMonths: 120, graceMonths: 6 },
    privateStudent: { apr: 0.11, termMonths: 60 },
    // Auto loan APR by score. The first row whose minScore the score meets wins.
    autoAprByScore: [
      { minScore: 760, apr: 0.055 },
      { minScore: 700, apr: 0.07 },
      { minScore: 650, apr: 0.095 },
      { minScore: 600, apr: 0.13 },
      { minScore: 300, apr: 0.18 },
    ],
    autoAprNoScore: 0.15,
    autoMinScore: 500,
    // The payment must be at most maxPaymentShare of monthly income (counting at least minIncome).
    autoAfford: { maxPaymentShare: 0.5, minIncome: 300 },
    autoTerms: [36, 48, 60, 72],
    // Store and lender loans for a purchase (a couch, cottage repairs). Approved
    // when the payment is at most maxPaymentShare of monthly income (counting
    // at least minIncome), or with a score of scoreOverride or more.
    purchase: { apr: 0.12, maxPaymentShare: 0.4, minIncome: 200, scoreOverride: 650 },
  },

  // Parent card profiles for the authorized-user option (SPEC §6).
  parents: {
    responsible: { label: "Responsible", limit: 8000, ageMonths: 120, utilization: [0.03, 0.12], lateChance: 0 },
    average: { label: "Average", limit: 5000, ageMonths: 72, utilization: [0.25, 0.45], lateChance: 0.01 },
    maxed: { label: "Maxed-out", limit: 3000, ageMonths: 48, utilization: [0.88, 1.0], lateChance: 0.12 },
  },

  score: {
    min: 300,
    max: 850,
    minHistoryMonths: 6,
    weights: { payment: 0.35, owed: 0.3, length: 0.15, mix: 0.1, newCredit: 0.1 },

    // Payment history: penalty per late episode, by its worst mark.
    latePenalty: { 30: 0.14, 60: 0.22, 90: 0.3, CO: 0.4 },
    // Older lates hurt less. Multiplier by months since the episode ended.
    lateRecency: [[0, 1], [12, 0.8], [24, 0.55], [48, 0.35]],
    openCollectionPenalty: 0.3,
    paidCollectionPenalty: 0.1,
    // A short record proves less than a long one. Payment history starts at
    // `floor` and reaches full value after `fullMonths` of reports on one account.
    // A parent's card counts at `authorizedShare` of its months.
    historyDepth: { fullMonths: 36, floor: 0.7, authorizedShare: 0.5 },

    // Amounts owed: utilization -> factor value (points are [utilization, value]).
    utilizationCurve: [[0, 0.9], [0.01, 1], [0.1, 0.97], [0.3, 0.82], [0.5, 0.55], [0.75, 0.3], [0.9, 0.15], [1, 0.05]],
    overallUtilShare: 0.7,
    noRevolvingOwed: 0.7,
    installmentShare: 0.2,

    // Length of history: months at which each part is maxed out.
    oldestFullMonths: 96,
    averageFullMonths: 60,
    lengthCurvePower: 0.8,
    // A parent's card counts as at most this old. You didn't build its history.
    authorizedAgeCapMonths: 12,

    // Credit mix
    mixRevolving: 0.5,
    mixInstallment: 0.35,
    mixExtraType: 0.075,

    // New credit: factor value by count of hard inquiries in the last 12 months.
    inquiryCurve: [1, 0.9, 0.78, 0.62, 0.48, 0.36, 0.25],
    newAccountMonths: 6,
    newAccountPenalty: 0.15,
  },

  approval: {
    lowRiskOdds: 0.8,
    mediumRiskOdds: 0.5,
    highRiskOdds: 0.2,
    maxOdds: 0.99,
    minOdds: 0.01,
    inquiryPenaltyFrom: 3,
    inquiryPenalty: 0.7,
    debtToIncomeLimit: 6,
    debtPenalty: 0.6,
    collectionsPenalty: 0.3,
  },
};
