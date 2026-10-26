// Money Tree (GAME-SPECS.md game 11): plant your money in a garden and grow it
// for 40 years. Storms will come. Will you hold on? Simplified for learning, not
// investment advice. No em-dashes, no semicolons.

export const TREE_PLOTS = {
  savings: { name: "Savings", plant: "Steady sprout", label: "About 2 to 4 percent a year. Never drops." },
  cd: { name: "CD", plant: "Fenced plot with a lock", label: "About 4 to 5 percent, locked 5 years. Early withdrawal costs a penalty." },
  index: { name: "Index fund", plant: "Tree", label: "About 7 percent a year on average, with big swings and a few crashes that recover." },
  coin: { name: "Hype coin", plant: "Glowing mushroom", label: "Huge swings, often near zero. On average it grows less than the index fund." },
};
export const TREE_KEYS = Object.keys(TREE_PLOTS);

export const TREE_CHECKPOINTS = [0, 3, 5, 10, 15, 20, 25, 30, 35, 40];

export const TREE_TEMPTATIONS = [
  "Skip this year's contribution and buy concert tickets instead.",
  "Skip watering this season and get the new phone now.",
  "Skip it and take a spring break trip with friends.",
  "Skip it and upgrade your car stereo.",
  "Skip it and get the designer sneakers.",
  "Skip it and redo your room.",
  "Skip it and treat everyone to dinner.",
  "Skip it and buy the new game console.",
  "Skip it and take a weekend at the beach.",
];

export const TREE_META = {
  title: "Money Tree",
  pitch: "Plant your money in a garden and grow it for 40 years. Storms will come. Will you hold on?",
  skill: "investing",
  standards: ["G1", "G2", "G3", "G5", "G7"],
  metric: "Goal Score",
  tie: { label: "more money at the end", better: "high" },
  rankedHint: "only Timed shifts are ranked",
  ranked: (s) => s.timer === "timed",
  board: () => "tree",
  timer: { timed: "15 seconds a season.", none: "Take your time each season." },
  settings: () => [
    {
      key: "water",
      label: "Watering",
      def: "auto",
      options: [
        { value: "auto", label: "Auto-water", hint: "Your yearly $1,200 goes in on its own." },
        { value: "manual", label: "Water by hand", hint: "Each season, press Space to water. Temptations will show up." },
      ],
    },
  ],
  mistakes: ["Missing the car goal: the shortfall, added as debt (up to $500 in this game).", "Selling during a crash: $20."],
  beats: ["Each plot grows differently. Some are safe, some are wild.", "You need car money in 3 years and retirement money in 40.", "When a storm hits, you can sell or hold."],
  why: { weak: "I wanted to get rich fast.", okay: "I didn't want to lose more.", strong: "I don't need this money for decades, so I held and let it recover." },
  revealTitle: "Your plan, grown 100 times",
  unlock: 8,
};

export const TREE_BONUS = [
  { id: "t1", type: "choice", q: "$1,000 grows 7 percent a year. About how much after 10 years?", choices: ["About $1,970", "About $1,700", "About $1,070", "About $7,000"], answer: 0, why: "Compound growth: 1.07 to the 10th power is about 1.97." },
  { id: "t2", type: "choice", q: "The Rule of 72 says money at 8 percent doubles in about...", choices: ["9 years", "72 years", "8 years"], answer: 0, why: "72 divided by 8 is 9." },
  { id: "t3", type: "number", q: "Using the Rule of 72, at 6 percent, how many years to double?", answer: 12, why: "72 divided by 6 is 12." },
  { id: "t4", type: "choice", q: "An index fund is...", choices: ["A fund that owns a slice of many companies", "One company's stock", "A savings account"], answer: 0, why: "Owning many companies spreads out the risk." },
  { id: "t5", type: "choice", q: "Diversification means...", choices: ["Spreading money across different investments", "Putting everything in one stock", "Only saving cash"], answer: 0, why: "Don't put all your eggs in one basket." },
  { id: "t6", type: "choice", q: "Higher possible returns usually come with...", choices: ["Higher risk", "No risk", "Guarantees"], answer: 0, why: "Risk and return go together." },
  { id: "t7", type: "choice", q: "A CD is...", choices: ["Money locked for a set time at a set rate", "A stock", "A credit card"], answer: 0, why: "Certificates of Deposit pay a fixed rate if you leave the money in." },
  { id: "t8", type: "choice", q: "Selling during a crash usually...", choices: ["Locks in the loss", "Guarantees a profit", "Has no effect"], answer: 0, why: "Markets have recovered from past crashes, but only for people still invested." },
  { id: "t9", type: "number", q: "Simple interest: $500 at 4 percent for 3 years. How much interest?", answer: 60, why: "$500 times 0.04 is $20 a year, times 3 years is $60." },
  { id: "t10", type: "choice", q: "Compound interest means...", choices: ["You earn interest on your interest", "Interest only on what you put in", "No interest"], answer: 0, why: "Growth builds on growth, which is why starting early matters." },
  { id: "t11", type: "choice", q: "Time horizon is...", choices: ["How long until you need the money", "The time of day you invest", "A bank's hours"], answer: 0, why: "Money you need soon belongs somewhere steady." },
  { id: "t12", type: "choice", q: "Money for a car in 3 years should mostly be in...", choices: ["Savings or a CD", "A hype coin", "The riskiest thing you can find"], answer: 0, why: "Short time horizon, low risk." },
  { id: "t13", type: "choice", q: "A 401(k) is...", choices: ["A retirement account through your job", "A car loan", "A credit score"], answer: 0, why: "Many employers even add matching money." },
  { id: "t14", type: "choice", q: "A Roth IRA lets you...", choices: ["Pay tax now and take money out tax-free in retirement", "Skip taxes forever on everything", "Borrow from a bank"], answer: 0, why: "Roth means taxed now, not later." },
  { id: "t15", type: "choice", q: "Volatility means...", choices: ["How much a price swings up and down", "A type of account", "A bank fee"], answer: 0, why: "High volatility means a bumpy ride." },
  { id: "t16", type: "number", q: "You invest $100 a month for 40 years. How much did you put in?", answer: 48000, why: "$100 times 12 times 40 is $48,000. Growth makes the final amount much bigger." },
  { id: "t17", type: "choice", q: "Who usually ends up with more: someone who starts at 22 or at 32, both investing the same amount each year until 62?", choices: ["The one who starts at 22", "The one at 32", "The same"], answer: 0, why: "Ten extra years of compounding is huge." },
  { id: "t18", type: "choice", q: "Automatic saving works because...", choices: ["You never have to decide to skip it", "Banks pay more for it", "It's required"], answer: 0, why: "No decision means no temptation." },
  { id: "t19", type: "choice", q: "A target-date fund...", choices: ["Gets safer as your retirement year gets closer", "Is only for one year", "Is a type of CD"], answer: 0, why: "It shifts from stocks toward bonds over time." },
  { id: "t20", type: "choice", q: "Social Security in retirement is...", choices: ["A monthly benefit based on your work history", "A savings account", "Enough on its own for most people"], answer: 0, why: "It helps, but most people need their own savings too." },
  { id: "t21", type: "choice", q: "If the market crashes 35 percent and you hold, you...", choices: ["Lose on paper, and can recover if prices come back", "Lose it forever", "Owe money"], answer: 0, why: "Losses become real when you sell." },
];

export const TREE_GUIDE = {
  how: {
    goal: "Have car money in 3 years and retirement money in 40, without getting spooked out of the garden.",
    steps: [
      "Four plots grow differently: Savings is steady, a [[CD]] is locked for 5 years, the [[index fund]] swings but grows, and the Hype coin is wild.",
      "At each season, set how your yearly $1,200 is split across the plots, and move money between them if you want.",
      "Year 3 is the car goal. Money for something you need soon belongs somewhere steady. That's your [[time horizon]].",
      "When a storm hits, choose Hold (H) or Sell everything (S). A ghost line later shows what the other choice would have done.",
      "[[Compound interest]] needs time. Missing a season's watering costs more than it looks.",
      "Spreading money out is [[diversification]]. Big swings are called [[volatility]].",
    ],
    example: "Early Eva invests from age 22. Late Leo starts at 32. Same yearly amount, but Eva ends up with far more, because her money had ten extra years to compound.",
  },
  vocab: [
    { term: "compound interest", def: "Earning growth on your growth, not just on what you put in.", example: "Compound interest turned $1,000 into almost $2,000 in 10 years at 7 percent." },
    { term: "index fund", def: "A fund that owns small pieces of many companies.", example: "An index fund rises and falls with the whole market." },
    { term: "CD", def: "A Certificate of Deposit: money locked for a set time at a set rate.", example: "Her 5-year CD paid 4.5 percent." },
    { term: "diversification", def: "Spreading money across different investments.", example: "Diversification meant one bad plot didn't ruin his garden." },
    { term: "volatility", def: "How much a price swings up and down.", example: "The Hype coin's volatility was wild." },
    { term: "time horizon", def: "How long until you need the money.", example: "Retirement money has a 40-year time horizon." },
  ],
  irl: {
    checked: "2026-10-25",
    intro: "Long-term investing in real life.",
    facts: [
      { stat: "In 2025, only 35 percent of adults who weren't retired yet thought their retirement saving was on track.", source: "Federal Reserve, Economic Well-Being of U.S. Households in 2025", year: 2026, url: "https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-savings-investments.htm" },
      { stat: "61 percent of adults had a tax-preferred retirement account, like a 401(k), an IRA or a Roth IRA.", source: "Federal Reserve, Economic Well-Being of U.S. Households in 2025", year: 2026, url: "https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-savings-investments.htm" },
      { stat: "In the past year, 5 percent of non-retired adults borrowed from their retirement accounts and 4 percent cashed some out. Pulling seeds early stops them growing.", source: "Federal Reserve, Economic Well-Being of U.S. Households in 2025", year: 2026, url: "https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-savings-investments.htm" },
    ],
  },
};
