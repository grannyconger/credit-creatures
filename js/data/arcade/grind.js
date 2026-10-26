// The Grind (GAME-SPECS.md game 9): deliver food on DashDash, or work shifts at
// the store. Find out what each job really pays per hour. Plain words, no
// em-dashes, no semicolons. Parody names only.

export const GR_RESTAURANTS = [
  "Chick Filet", "Taco Bellhop", "Burger Thing", "Panda Espresso", "Chipotlay", "Wendee's", "Popeyez", "Five Guyz",
  "Sonik", "Dominoz", "Pizza Hutch", "Papa Joan's", "Subwave", "Jersey Mikes-ish", "Panera Bred", "Starducks",
  "Dunkin Donutz", "Shake Shed", "In-N-Outt", "Raising Kanes", "Waffle Haus", "IHOPP", "Olive Garten", "Applebee's-ish",
  "Noodles and Co-ish", "Qdoba-ish", "Zaxbee's", "Cook Out-ish", "Bojangle's", "Krispy Kreem", "Benny's Diner", "Pho Real",
  "Sushi Stop", "The Curry Pot", "Mama Rosa's", "Bubba's BBQ", "Green Bowl", "Boba Bae", "Crumble Cookies", "Late Night Wings",
];

// Store mode offers. kind: extra (+hours, 1 energy), overtime (+hours at 1.5x
// past 40), swap (a coworker trade: no new hours, 1 energy), cover (short close).
export const GR_OFFERS = [
  { kind: "extra", title: "Extra shift Saturday", text: "The manager needs someone Saturday, 8 hours.", hours: 8 },
  { kind: "extra", title: "Inventory night", text: "Count stock after close Friday, 6 hours.", hours: 6 },
  { kind: "extra", title: "Holiday rush", text: "The store needs extra hands Sunday, 8 hours.", hours: 8 },
  { kind: "overtime", title: "Stay late", text: "Stay 4 hours past your shift Thursday. Overtime if you pass 40 hours.", hours: 4 },
  { kind: "overtime", title: "Double shift", text: "Work a double on Wednesday, 8 more hours. Overtime past 40 hours.", hours: 8 },
  { kind: "swap", title: "Swap with Jojo", text: "Jojo begs you to swap your Tuesday morning for their Sunday night. Same hours.", hours: 0 },
  { kind: "swap", title: "Swap with Priya", text: "Priya wants your Monday shift and you'd take her Saturday close. Same hours.", hours: 0 },
  { kind: "cover", title: "Cover the close", text: "Can you close tonight? 3 hours, and you're already tired.", hours: 3 },
  { kind: "cut", title: "Schedule cut", text: "Slow week. The manager cut one of your shifts.", hours: -8 },
];

// One planted paystub error a payday. kind decides what the bad line shows.
export const GR_STUB_ERRORS = [
  { kind: "hours", text: "Regular hours are short by 4." },
  { kind: "hours", text: "Regular hours are short by 6." },
  { kind: "hours", text: "Regular hours are short by 2." },
  { kind: "rate", text: "Your pay rate is a dollar too low." },
  { kind: "rate", text: "Your pay rate is 50 cents too low." },
  { kind: "rate", text: "Your pay rate is from last year." },
  { kind: "overtime1x", text: "Overtime was paid at your regular rate, not 1.5 times." },
  { kind: "overtime1x", text: "Overtime hours were paid like regular hours." },
  { kind: "overtime1x", text: "The overtime rate is missing its time and a half." },
  { kind: "missing", text: "One whole shift is missing." },
  { kind: "missing", text: "Your extra shift isn't on the stub." },
  { kind: "missing", text: "Saturday's hours never made it on." },
  { kind: "hours", text: "Hours were rounded down by 3." },
  { kind: "rate", text: "Your raise isn't on the stub." },
  { kind: "missing", text: "A double shift shows only half." },
];

export const GRIND_META = {
  title: "The Grind",
  pitch: "Deliver food on DashDash or work shifts at the store. Find out what each job really pays per hour.",
  skill: "earning",
  standards: ["F4", "F5", "F6", "A2"],
  metric: "True hourly rate or Payday Score",
  metricFor: (s) => (s.mode === "store" ? "Payday Score" : "True hourly rate"),
  formatBoard: (board, v) => (board === "grind:delivery" ? `$${(v / 100).toFixed(2)}/hr` : String(v)),
  tie: { label: "higher score", better: "high" },
  rankedHint: "only Timed shifts are ranked",
  ranked: (s) => s.timer === "timed",
  board: (s) => `grind:${s.mode}`,
  boardLabel: (s) => (s.mode === "store" ? "Store" : "Delivery"),
  timer: { timed: "Delivery 2:30, Store 1:30, then payday.", none: "Take your time." },
  settings: (play) => {
    const last = (play?.arcade?.log || []).filter((e) => e.g === "grind").at(-1)?.set?.mode;
    return [
      {
        key: "mode",
        label: "Mode",
        def: last === "delivery" ? "store" : "delivery",
        options: [
          { value: "delivery", label: "Delivery", hint: "Accept or decline food orders. Gas and taxes are on you." },
          { value: "store", label: "Store", hint: "Two weeks of shifts, extra hours and a paystub to check." },
        ],
      },
    ];
  },
  mistakes: ["Delivery: a tax shortfall, plus its penalty.", "Store: a paystub error you miss (the missing pay).", "Both: a sick day (the lost pay)."],
  beats: ["Accept or decline each offer. Look at what it pays and what it costs you.", "Your time and your gas aren't free. Watch the true hourly rate.", "Payday tells the truth. Save for taxes and check your paystub."],
  why: { weak: "I want all my money now.", okay: "I saved a little.", strong: "Gig pay has no taxes taken out, so I saved about a quarter for the tax bill." },
  revealTitle: "What each job really pays per hour",
  unlock: 1,
};

export const GRIND_BONUS = [
  { id: "g1", type: "number", q: "You earned $60 in 4 hours and spent $12 on gas. What's your true hourly rate?", answer: 12, why: "$60 minus $12 is $48, and $48 divided by 4 hours is $12 an hour." },
  { id: "g2", type: "choice", q: "Gross pay is...", choices: ["Pay before anything is taken out", "Pay after taxes", "Your tips only"], answer: 0, why: "Gross is the top line. Net is what lands in your account." },
  { id: "g3", type: "choice", q: "Net pay is...", choices: ["What's left after taxes and deductions", "Pay before taxes", "Overtime only"], answer: 0, why: "Net is your take-home pay." },
  { id: "g4", type: "number", q: "You work 44 hours at $12 an hour. Overtime is 1.5 times pay past 40. What's your gross pay?", answer: 552, why: "40 times $12 is $480. 4 overtime hours at $18 is $72. Total $552." },
  { id: "g5", type: "choice", q: "Gig apps like DashDash usually...", choices: ["Don't take taxes out of your pay", "Take out all your taxes", "Pay you a salary"], answer: 0, why: "Gig workers are usually independent contractors, so saving for taxes is on them." },
  { id: "g6", type: "number", q: "You made $800 in gig profit. You save 25 percent for taxes. How much is that?", answer: 200, why: "25 percent of $800 is $200." },
  { id: "g7", type: "choice", q: "Withholding is...", choices: ["Tax your employer takes out of each paycheck", "Money you hold onto", "A late fee"], answer: 0, why: "Your W-4 form tells your employer how much to withhold." },
  { id: "g8", type: "choice", q: "Which form do you fill out at a new job so taxes get withheld right?", choices: ["W-4", "1099", "I-9"], answer: 0, why: "The W-4 sets withholding. The I-9 proves you can work. A 1099 reports gig income." },
  { id: "g9", type: "choice", q: "Social Security and Medicare taxes together are called...", choices: ["FICA", "APR", "PIN"], answer: 0, why: "FICA is 6.2 percent for Social Security plus 1.45 percent for Medicare, from each paycheck." },
  { id: "g10", type: "number", q: "Social Security tax is 6.2 percent. On a $500 paycheck, how much is it?", answer: 31, why: "6.2 percent of $500 is $31." },
  { id: "g11", type: "choice", q: "A salary of $26,000 for 50 hours a week works out to...", choices: ["Less per hour than 40 hours a week", "More per hour", "The same per hour"], answer: 0, why: "Same yearly pay, more hours, so each hour is worth less." },
  { id: "g12", type: "number", q: "A salary is $31,200 a year. At 40 hours a week for 52 weeks, what's the hourly rate?", answer: 15, why: "40 times 52 is 2,080 hours. $31,200 divided by 2,080 is $15." },
  { id: "g13", type: "choice", q: "Why check every paystub?", choices: ["Payroll makes mistakes, and missed hours are your money", "It's required for fun", "To change your password"], answer: 0, why: "Hours, rates and overtime can be wrong. Catch it and ask." },
  { id: "g14", type: "number", q: "A delivery pays $7 for 9 miles. Gas is about 20 cents a mile. What do you keep?", answer: 5.2, why: "9 miles at $0.20 is $1.80. $7 minus $1.80 is $5.20." },
  { id: "g15", type: "choice", q: "A 1099 form reports...", choices: ["Income from contract or gig work", "Your hours at a regular job", "Your credit score"], answer: 0, why: "Gig apps send a 1099. Regular jobs send a W-2." },
  { id: "g16", type: "choice", q: "Overtime under federal law is usually paid at...", choices: ["1.5 times your regular rate after 40 hours a week", "Double, always", "The same rate"], answer: 0, why: "Time and a half after 40 hours is the federal rule for most hourly workers." },
  { id: "g17", type: "choice", q: "Gig work income has to be reported on your taxes...", choices: ["Even if you don't get a form for it", "Only if you get a 1099", "Never"], answer: 0, why: "The IRS says all gig income counts, form or no form." },
  { id: "g18", type: "number", q: "You worked 30 hours, but your stub says 26. At $13 an hour, how much pay is missing?", answer: 52, why: "4 missing hours times $13 is $52." },
  { id: "g19", type: "choice", q: "Taking every extra shift can...", choices: ["Wear you out and cost you a sick day", "Always pay more", "Raise your credit score"], answer: 0, why: "Rest is part of earning. A sick day is lost pay." },
  { id: "g20", type: "choice", q: "Idle time waiting for gig orders is usually...", choices: ["Unpaid", "Paid double", "Paid at minimum wage"], answer: 0, why: "You only earn while you deliver, so waiting lowers your true hourly rate." },
  { id: "g21", type: "number", q: "Gross pay $400. Taxes and deductions are $72. What's your net pay?", answer: 328, why: "$400 minus $72 is $328." },
];

export const GRIND_GUIDE = {
  how: {
    goal: "Find out what a job really pays per hour, and keep as much of it as you honestly can.",
    steps: [
      "Delivery: offers pop up with pay, miles and minutes. Accept (A) or Decline (D) before the ring runs out. Waiting between orders is unpaid.",
      "Gas comes out of your pay. Your [[true hourly rate]] is what you keep after gas and taxes, divided by your hours.",
      "Decline too many and the app sends fewer offers. Grab the surge if it comes.",
      "Gig pay has no [[withholding]]. At payday, set your tax jar. A short jar means a tax bill plus a penalty.",
      "Store: say yes or no to extra shifts and [[overtime]]. Each one costs energy. At zero energy you get a sick day.",
      "At payday, predict your [[net pay]], watch the waterfall from [[gross pay]] down, and find the mistake on your paystub.",
    ],
    example: "You made $72 delivering in 4 hours and used $9 of gas. You saved $16 for taxes. That's $47 kept, or $11.75 an hour, not the $18 the app showed.",
  },
  vocab: [
    { term: "gross pay", def: "All the money you earned before anything is taken out.", example: "Her gross pay was $480 for the week." },
    { term: "net pay", def: "Your take-home pay, after taxes and deductions.", example: "His net pay was $401 after taxes." },
    { term: "withholding", def: "Taxes your employer takes out of each paycheck for you.", example: "Store jobs have withholding. Gig apps usually don't." },
    { term: "overtime", def: "Hours past 40 in a week, usually paid at 1.5 times your rate.", example: "Four overtime hours at $18 instead of $12." },
    { term: "gig work", def: "Short jobs through an app, where you're your own boss.", example: "Delivering on DashDash is gig work." },
    { term: "self-employment", def: "Working for yourself, so you handle your own taxes.", example: "Self-employment means saving for taxes yourself." },
    { term: "true hourly rate", def: "What you keep after costs and taxes, divided by all the hours you spent.", example: "The app said $20 an hour, but her true hourly rate was $12." },
  ],
  irl: {
    checked: "2026-10-25",
    intro: "Gig work is a real part of the economy, and its taxes are real too.",
    facts: [
      { stat: "In July 2023, 11.9 million people were independent contractors on their main job, 7.4 percent of everyone working.", source: "U.S. Bureau of Labor Statistics", year: 2024, url: "https://www.bls.gov/news.release/conemp.htm" },
      { stat: "Most independent contractors, 80.3 percent, said they liked that arrangement better than a regular job.", source: "U.S. Bureau of Labor Statistics", year: 2024, url: "https://www.bls.gov/news.release/conemp.htm" },
      { stat: "The IRS says you must report gig income on your tax return even if no form like a 1099 or W-2 reports it.", source: "IRS Gig Economy Tax Center", year: 2026, url: "https://www.irs.gov/businesses/gig-economy-tax-center" },
    ],
  },
};
