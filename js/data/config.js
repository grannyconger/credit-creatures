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
    payPerShift: [10, 120],
    sessionMinutes: 15,
    sparkle: { perChapter: 10, total: 30 },
    // Quality of Life (teacher request 2026-10-25): the third Tradeoffs spectrum, next
    // to Assets and Liabilities. A meter from min to max that every card choice moves
    // by its points in js/data/card-qol.js. It starts at start and never leaves the range.
    qol: { start: 50, min: 0, max: 100 },
    // What a side quest shift pays besides Coins (teacher decision 2026-10-23).
    // A shift needs at least minAnswers scored answers to count for a bonus.
    // Energy: finishing pays finish, 80% or better (strongPct) adds strong, a
    // perfect shift adds perfect. It is held up to max. Sparkle: a perfect shift
    // earns perfectSparkle, inside the usual Sparkle caps above. Energy is spent
    // on Battles, which are not built yet.
    rewards: { minAnswers: 4, strongPct: 0.8, energy: { max: 10, finish: 1, strong: 1, perfect: 1 }, perfectSparkle: 1 },
    // XP (SPEC §16). It never goes down, and there's no lifetime cap. Quests earn
    // it (teacher decision 2026-10-23, built 2026-10-25): each decision card by how
    // well the choice went (card: good, ok, bad, none for news and quiz cards), and a
    // finished month. Side quests (Arcade shifts) pay Coins, Energy and Sparkle
    // instead, never XP. Only right answers repeat without limit, so their XP is
    // capped per chapter. alleyStall: bonus XP for each Lantern Alley stall called
    // right, once each.
    xp: { rightAnswer: 5, card: { good: 6, ok: 4, bad: 2, none: 2 }, month: 10, reflection: 25, answersPerChapter: 100, alleyStall: 10 },
  },

  // Friends, groups and gifts (Phase 8). firestore.rules repeats giftHours,
  // giftsPerWindow, giftMin, giftMax and groupMax, so change both places
  // together. Gifts (teacher request 2026-10-22): up to giftsPerWindow in a
  // giftHours window that starts with the first gift, then the count resets.
  // Teacher dashboard (2026-10-23): a student shows under "Needs help" after
  // inactiveDays without playing, and the dashboard says the class is ready
  // for the next chapter once readyShare of it has finished the open one.
  // The save watch flags a student after quietMinutes with no save and
  // re-checks every watchSeconds, reading the small leaderboard entries the
  // game touches at most every heartbeatMinutes. Standards grid words: Strong from strong %,
  // Getting there from gettingThere %, else Needs help (teacher request).
  teacher: { inactiveDays: 5, readyShare: 0.75, quietMinutes: 8, watchSeconds: 60, heartbeatMinutes: 2, strong: 80, gettingThere: 60, reteachMinAnswers: 5, reteachMinStudents: 3 },
  social: { giftHours: 20, giftsPerWindow: 4, giftMin: 5, giftMax: 50, groupMax: 6 },

  // Daily Pick and the login streak (docs/UI-REBUILD.md slice 4). A day is the
  // student's local calendar day, so both reset at midnight. login: coins for
  // signing in, base plus perDay for each day of the streak up to maxBonus,
  // and one-time milestone coins on those streak days. boxes: how many closed
  // boxes to choose from. prizes: what a box can hold, by weight. coins prizes
  // roll an amount in range. A coupon takes pct off the next Market buy.
  // decor prizes pick a Cottage piece up to maxPrice. A prize you can't use
  // (Sparkle past its cap, a piece you already own) turns into coins.
  daily: {
    login: { base: 5, perDay: 1, maxBonus: 10, milestones: { 3: 10, 7: 25, 14: 50, 30: 100 } },
    boxes: 3,
    prizes: [
      { kind: "coins", tier: "small", weight: 38, range: [5, 15] },
      { kind: "coins", tier: "nice", weight: 24, range: [20, 40] },
      { kind: "coins", tier: "jackpot", weight: 5, range: [75, 120] },
      { kind: "sparkle", weight: 12, amount: 1 },
      { kind: "coupon", weight: 11, pct: 20 },
      { kind: "decor", weight: 10, maxPrice: 40 },
    ],
    sparkleFallback: 10,
    // Three challenges a day. Finish all three for challengeBonus coins.
    challengeBonus: 10,
  },

  // The month loop after Chapter 1 (SPEC §8).
  play: {
    raiseBonus: 10,
    cashAdvanceFee: { percent: 0.05, min: 10 },
    // Work shift minigames (SPEC §17). Pay stays between min and max, plus experience.
    jobs: {
      // Coins for a shift: perRight for each right answer (and perWrong off for
      // Ledger Sort), never below min for finishing and never above max. A
      // perfect shift in every game pays max (120), so the average student
      // earns about what the old $40 to $120 band paid. Experience, a ride and
      // a home workshop add to this on top.
      pay: { min: 10, max: 120 },
      // Every `everyShifts` shifts at one job adds `bonus` dollars, up to `max`.
      experience: { everyShifts: 3, bonus: 5, max: 20 },
      // lockMs: a short pause after each Ledger Sort answer, so a double click
      // can't answer the next item too. nextCustomerMs: Cashier Rush pauses
      // this long after a wrong answer only, so the right change can be read
      // (a right answer brings the next customer at once).
      ledger: { seconds: 45, untimedItems: 12, perRight: 10, perWrong: 5, lockMs: 300 },
      // Cashier Rush (teacher request 2026-10-23): pick a difficulty and a round.
      // Chill Round serves untimedCustomers with no clock. Speed Round serves as
      // many as possible in seconds. perRight is only for old saves and tests.
      // rvu is the relative value unit in coins. Easy pays 1 RVU a sale, Medium 5 and
      // Hard 15 (rvuByLevel). Speed Round doubles it (speedMultiplier) and lasts 90 seconds.
      cashier: { seconds: 90, untimedCustomers: 4, perRight: 14, nextCustomerMs: 900, rvu: 1, rvuByLevel: { easy: 5, medium: 12, hard: 25 }, speedMultiplier: 2 },
      checks: { perField: 20 },
      // The five Chapter 1 jobs (teacher request 2026-10-22). perRight is
      // coins per right answer. A perfect shift pays the top of the range (max),
      // like the first three jobs.
      // seconds is the timed shift. The No timer toggle drops the clock.
      overdraft: { rounds: 6, feedLength: 7, startMs: 2800, endMs: 1500, betweenMs: 1600, perRight: 20 },
      register: { lines: 10, seconds: 180, perRight: 12 },
      checkhunt: { seconds: 120, rightMs: 1300, wrongMs: 2600, perRight: 12 },
      drawer: { drawers: 2, seconds: 240, perRight: 6 },
      unitprice: { rounds: 10, seconds: 120, perRight: 12 },
      // Fee Detective: statements per shift (one has no fees), lines on each,
      // and a pause after each reveal. perRight is coins per right answer.
      fees: { statements: 3, lines: 13, seconds: 240, perRight: 7.5, noFeePoints: 2, revealMs: 1600 },
    },
    monthRecordsKept: 6,
  },

  // Going broke (GAME-SPECS.md 2.4, teacher decisions 2026-10-25). At a month's
  // end, checking below $0 that savings can't cover is broke. The first time is a
  // RED ALERT warning. Still broke at the next month's end means a fresh start:
  // back to the start of the previous chapter (never before fromChapter), every
  // debt wiped, checking set to resetChecking and a mark on the credit report.
  broke: { fromChapter: 2, resetChecking: 500 },

  // The Arcade side quests (GAME-SPECS.md Part 2). Pay for a shift is
  // round(payCap x min(1, score / maxPayScore)), plus experience, ride and home
  // bonuses on top. Safe mode uses the month's shifts and mistakes cost nothing.
  // Risky mode is unlimited, mistakes cost real money, and fireAfter mistakes in
  // one shift locks that game for cooldownMinutes of real time.
  arcade: {
    payCap: 120,
    bonusCoins: 50,
    fireAfter: 3,
    cooldownMinutes: 15,
    // A cost never below this, so a 5 cent slip still means something.
    minMistake: 1,
    whyMaxChars: 140,
    echoMs: 3000,
    resultsKept: 25,
    iouName: "Owed to the Arcade",
    // Each game's own numbers. maxPayScore is the score that pays the full
    // payCap. Some games set it per difficulty.
    games: {
      // Bill Drop (game 3). Money in dollars, days in a 30-day month.
      billdrop: {
        maxPayScore: { easy: 360, medium: 450, hard: 450 },
        dayMs: 4000,
        start: [300, 500],
        paycheck: [600, 700],
        payDays: [[5, 19], [6, 20], [7, 21], [4, 18]],
        lateFee: { rent: 50, other: [10, 35] },
        overdraftFee: 35,
        forgotten: { easy: 0, medium: 1, hard: 2 },
        chaos: [2, 3],
        fixes: 2,
        moveDays: 5,
        shiftDelay: 7,
        extraShift: [80, 120],
        cardApr: 0.24,
        perOnTime: 50,
        perUnpaid: 75,
        balanceCap: 500,
        balanceDivisor: 5,
        // The thoughtful plan's ending balance must land in this band (1.6).
        endBand: { easy: [100, 900], medium: [50, 650], hard: [0, 450] },
      },
      // Pay in 4 (game 4). Money in dollars, 12 weeks.
      payin4: {
        maxPayScore: 290,
        weekMs: 10000,
        start: [250, 350],
        paycheck: [260, 300],
        living: [80, 100],
        bnplOver: 50,
        cut: 0.3,
        gift: 50,
        emergency: [150, 250],
        lateFee: 8,
        feeWeight: 3,
        emergencyPenalty: 150,
        // The thoughtful bot's cushion and its Vibes per dollar bar.
        cushion: 230,
        worth: 0.27,
        // Thoughtful play's score must land in this band (1.6).
        band: [180, 420],
      },
      // Cashier Rush (game 1, upgrade). Money in cents. Speed doubles coins.
      cashier: {
        maxPayScore: { easy: 240, medium: 300, hard: 340 },
        speedSeconds: 180,
        chillCustomers: 6,
        speedPool: 60,
        lineSize: 3,
        arriveMs: 6000,
        rushAt: [50, 120],
        smartShare: 0.2,
        short: [25, 60],
        returnOdds: 0.5,
        returnTip: 9,
        tipMax: 5,
        points: { easy: 10, medium: 20, hard: 30 },
        // Seconds of patience before a customer's tip is gone.
        patience: { easy: 30, medium: 35, hard: 45 },
        guessBonus: 10,
        wrongPauseMs: 2000,
        // Risky mode: a drawer off by more than drawerLimit cents costs drawerFine dollars.
        drawerLimit: 200,
        drawerFine: 5,
      },
      // Check Writer (game 2, upgrade). Rent in whole dollars, under $1,000.
      checks: {
        maxPayScore: 130,
        seconds: 210,
        rent: [650, 980],
        perField: 10,
        endorse: 10,
        perCall: 20,
        noWash: 20,
        badCash: 50,
        washedCost: 25,
        badEndorse: 5,
      },
      // Phish Tank (game 5). Times in milliseconds.
      phish: {
        maxPayScore: 440,
        seconds: 150,
        messages: 18,
        legit: [0.35, 0.4],
        firstMs: 1500,
        gapStart: 9500,
        gapEnd: 3500,
        expiryMs: 20000,
        verifyMs: 5000,
        flagShowMs: 3000,
        lockTaps: 4,
        tapMs: 900,
        perRight: 20,
        perFlag: 10,
        perWrong: 15,
        perMissed: 5,
        takeoverCost: 20,
      },
      // The Grind (game 9). Delivery runs on game minutes: a 240-minute evening
      // in 150 real seconds. Store pays by the hour over two weeks.
      grind: {
        maxPayScore: { delivery: 75, store: 280 },
        salary: 26000,
        delivery: {
          shiftMin: 240,
          realSeconds: 150,
          windowMin: 11,
          gap: [3, 9],
          badShare: 0.38,
          baitShare: 0.17,
          baitKeep: 0.3,
          longWait: 15,
          surgeAt: [60, 160],
          surgeMin: 48,
          carAt: [40, 200],
          carMin: 32,
          gasPerMile: 0.2,
          lowRate: 0.4,
          lowRateAfter: 5,
          lowRateGap: 2,
          taxRate: 0.25,
          penaltyRate: 0.1,
          penaltyMin: 5,
          // The selective bot's bar: dollars kept per minute.
          goodPerMin: 0.26,
        },
        store: {
          seconds: 90,
          offerSec: 8,
          wage: 12.5,
          baseHours: 32,
          shiftHours: 8,
          energy: 5,
          restTo: 2,
          cutChance: 0.6,
          tax: { federal: 0.1, state: 0.04, socialSecurity: 0.062, medicare: 0.0145 },
          predictMax: 50,
          predictBand: 0.25,
          stubBonus: 40,
        },
      },
      // Fee Detective (game 12, upgrade). Three cases, three calls.
      fees: {
        maxPayScore: { easy: 170, medium: 170, hard: 170 },
        band: [140, 200],
        seconds: 210,
        lines: [10, 13],
        fees: [2, 4],
        noFeeChance: 0.4,
        calls: 3,
        refundOdds: { first: 0.85, repeat: 0.35 },
        perFound: 10,
        perWrong: 5,
        perMissed: 10,
        habit: 15,
        noFee: 2,
        // The thoughtful bot only spends a call on a charge this big or more.
        callWorth: 8,
        disputeLegitCost: 10,
      },
      // Feed Frenzy (game 6). Four weeks, three posts a week.
      feed: {
        maxPayScore: 380,
        seconds: 150,
        postSeconds: 11,
        fakeSale: [1.15, 1.4],
        outOfStock: 0.3,
        surprise: 40,
        savingsCap: 300,
        perNeed: 50,
        perTrick: 10,
        perRegret: 40,
        perUnmet: 60,
        perWrongTap: 5,
        usedIfInterest: 0.85,
        usedOtherwise: 0.2,
        band: [300, 420],
      },
      // Rainy Day (game 10). One year, 12 cards. Simplified insurance math.
      rainy: {
        maxPayScore: 110,
        shopSeconds: 60,
        cardSeconds: 8,
        start: [2500, 3500],
        income: [380, 480],
        tierWeights: { quiet: 0.42, good: 0.12, small: 0.37, medium: 0.07, cat: 0.012 },
        renewalMonth: 6,
        // Checking above creepFloor loses creep each month to everyday extras.
        creep: 0.08,
        creepFloor: 300,
        lapseFee: 35,
        renewalBump: 0.3,
        debtApr: 0.2,
        sims: 100,
        payDivisor: 20,
        // Risky mode: an uncovered cost over threshold goes on the creature's
        // debt, capped per cost so one catastrophe can't bury a creature.
        riskyThreshold: 1000,
        riskyCap: 500,
      },
      // Market Dash (game 13). Money in cents except perMeal, takeout and catchBonus.
      dash: {
        maxPayScore: { easy: 290, medium: 345, hard: 410 },
        seconds: 120,
        meals: { easy: 4, medium: 5, hard: 5 },
        budgetFactor: { easy: 1.45, medium: 1.35, hard: 1.2 },
        taxRate: 0.07,
        saleOff: 0.3,
        saleSeconds: 30,
        takeout: 18,
        perMeal: 60,
        catchBonus: 30,
      },
      // Score Chase (game 7). 18 months, a card at a time.
      scorechase: {
        maxPayScore: 660,
        cardSeconds: 10,
        startCash: 500,
        income: 120,
        baseSpend: 25,
        minPay: 25,
        apr: 0.24,
        lateFee: 25,
        scamCost: 199,
        goal: 700,
        goalBonus: 100,
        goodwillOdds: 0.5,
      },
    },
  },

  // Age 16 to 18 (SPEC §6). The tutorial plays a few months, then a time skip runs the rest.
  onboarding: {
    startAgeMonths: 16 * 12,
    cardAgeMonths: 18 * 12,
    tutorialMonths: 2,
    tutorialShift: { base: 20, perCorrect: 15 },
    // Phase 10 prologue: exactly 3 shifts before the bank opens, one each of
    // Cashier Rush, Check Writer and Spot the Overdraft (teacher request 2026-10-23).
    prologueShifts: 3,
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
    // A fresh start after going broke (teacher decision 2026-10-25) hurts payment
    // history like a bankruptcy, fading over about four chapters.
    freshStartPenalty: 0.6,
    freshStartRecency: [[0, 1], [6, 0.75], [12, 0.45], [18, 0.2], [24, 0]],
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
