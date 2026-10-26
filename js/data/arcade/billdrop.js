// Bill Drop (GAME-SPECS.md game 3): bills arrive all month in different places.
// Log them, schedule them and keep the balance above $0 every day.
// Plain words for a 15-year-old. No em-dashes, no semicolons. Parody names only.

// type: what kind of bill. movable: the company will move the due date (fix
// menu). channel: where the bill shows up. amount and due are ranges.
export const BILL_COMPANIES = [
  { id: "rent1", type: "rent", name: "Maple Court Apartments", channel: "mail", amount: [760, 860], due: [3, 8], movable: false },
  { id: "rent2", type: "rent", name: "Brickhouse Rentals", channel: "email", amount: [780, 880], due: [3, 8], movable: false },
  { id: "rent3", type: "rent", name: "Sunny Row Property Co.", channel: "app", amount: [750, 850], due: [3, 8], movable: false },
  { id: "elec1", type: "electric", name: "Duke Energee", channel: "email", amount: [70, 120], due: [10, 26], movable: true },
  { id: "elec2", type: "electric", name: "Bright Spark Power", channel: "mail", amount: [65, 115], due: [10, 26], movable: true },
  { id: "elec3", type: "electric", name: "Coinhaven Light Co.", channel: "text", amount: [60, 110], due: [10, 26], movable: true },
  { id: "water1", type: "water", name: "Gulligan Water Co.", channel: "mail", amount: [30, 55], due: [8, 26], movable: true },
  { id: "water2", type: "water", name: "Clearbrook Water", channel: "email", amount: [28, 50], due: [8, 26], movable: true },
  { id: "water3", type: "water", name: "City of Coinhaven Utilities", channel: "mail", amount: [32, 58], due: [8, 26], movable: true },
  { id: "net1", type: "internet", name: "Xfinite Internet", channel: "email", amount: [55, 75], due: [6, 24], movable: true },
  { id: "net2", type: "internet", name: "Spectrom Home WiFi", channel: "app", amount: [50, 70], due: [6, 24], movable: true },
  { id: "net3", type: "internet", name: "Fiberly", channel: "text", amount: [45, 65], due: [6, 24], movable: true },
  { id: "phone1", type: "phone", name: "Verizoom Wireless", channel: "text", amount: [40, 70], due: [6, 26], movable: true },
  { id: "phone2", type: "phone", name: "T-Mobeel", channel: "app", amount: [35, 60], due: [6, 26], movable: true },
  { id: "phone3", type: "phone", name: "Mint Mobyle", channel: "email", amount: [25, 45], due: [6, 26], movable: true },
  { id: "car1", type: "car", name: "Hondo Finance", channel: "email", amount: [210, 290], due: [8, 22], movable: false },
  { id: "car2", type: "car", name: "Toyoda Motor Credit", channel: "app", amount: [220, 300], due: [8, 22], movable: false },
  { id: "car3", type: "car", name: "Fjord Credit", channel: "mail", amount: [230, 310], due: [8, 22], movable: false },
  { id: "loan1", type: "studentLoan", name: "Nelnot Student Loans", channel: "email", amount: [90, 160], due: [10, 26], movable: false },
  { id: "loan2", type: "studentLoan", name: "Great Lakez Loans", channel: "mail", amount: [85, 150], due: [10, 26], movable: false },
  { id: "loan3", type: "studentLoan", name: "Aidvantage Plus", channel: "app", amount: [95, 165], due: [10, 26], movable: false },
  { id: "card1", type: "card", name: "Chaise Freedom Card", channel: "app", amount: [260, 420], due: [12, 24], movable: false, minimum: 35 },
  { id: "card2", type: "card", name: "Bank of Americana Rewards", channel: "email", amount: [240, 400], due: [12, 24], movable: false, minimum: 35 },
  { id: "card3", type: "card", name: "Capital Two Quicksilver", channel: "text", amount: [250, 410], due: [12, 24], movable: false, minimum: 30 },
  { id: "stream1", type: "streaming", name: "Netflicks", channel: "email", amount: [15, 23], due: [4, 26], movable: false, cancelable: true },
  { id: "stream2", type: "streaming", name: "Spotifly Premium", channel: "app", amount: [11, 12], due: [4, 26], movable: false, cancelable: true },
  { id: "stream3", type: "streaming", name: "Hulo Plus", channel: "text", amount: [8, 18], due: [4, 26], movable: false, cancelable: true },
  { id: "gym1", type: "streaming", name: "Planet Fitnest", channel: "app", amount: [15, 25], due: [4, 26], movable: false, cancelable: true },
  { id: "ins1", type: "insurance", name: "Geico-ish Car Insurance", channel: "email", amount: [90, 140], due: [8, 24], movable: false },
  { id: "ins2", type: "insurance", name: "State Farmz", channel: "mail", amount: [95, 145], due: [8, 24], movable: false },
];

// Which bill types each difficulty deals, in order of priority.
export const BILL_SETS = {
  easy: ["rent", "electric", "phone", "internet", "streaming"],
  medium: ["rent", "electric", "phone", "internet", "car", "water", "streaming"],
  hard: ["rent", "electric", "phone", "internet", "car", "water", "studentLoan", "card"],
};

export const TYPE_LABEL = { rent: "Rent", electric: "Electric", water: "Water", internet: "Internet", phone: "Phone", car: "Car payment", studentLoan: "Student loan", card: "Credit card", streaming: "Subscription", insurance: "Car insurance" };
export const CHANNEL_LABEL = { text: "Text message", email: "Email", mail: "Paper mail", app: "App alert" };

// Chaos cards (15). kind decides what happens. amount is a range.
export const BILL_CHAOS = [
  { id: "vet1", kind: "expense", title: "Your cat ate a hair tie", text: "The vet says she'll be fine. The bill says otherwise.", amount: [120, 190] },
  { id: "vet2", kind: "expense", title: "Limping pup", text: "A quick X-ray at Pawsome Vet Clinic. Nothing broken except your budget.", amount: [140, 200] },
  { id: "tire", kind: "expense", title: "Flat tire", text: "A nail in the tire. Sneaker Hut doesn't fix tires, so it's the shop.", amount: [90, 150] },
  { id: "dentist", kind: "expense", title: "Surprise filling", text: "The dentist found a cavity. Your part of the bill is due today.", amount: [80, 140] },
  { id: "laptop", kind: "expense", title: "Cracked charger", text: "Your laptop charger snapped. You need it for work.", amount: [60, 90] },
  { id: "late1", kind: "latePay", title: "Payday is a day late", text: "The payroll office had a glitch. Your paycheck lands tomorrow instead." },
  { id: "late2", kind: "latePay", title: "Bank holiday", text: "It's a bank holiday, so your direct deposit shows up one day later." },
  { id: "ac1", kind: "electricUp", title: "Heat wave", text: "The AC ran all week. This month's electric bill is higher than usual.", amount: [35, 70] },
  { id: "ac2", kind: "electricUp", title: "Space heater season", text: "That little heater was not little on the bill. Electric is up this month.", amount: [30, 60] },
  { id: "refund1", kind: "income", title: "Refund!", text: "Amazin refunded the headphones you sent back.", amount: [25, 60] },
  { id: "refund2", kind: "income", title: "Overpaid deposit", text: "Your old landlord mailed back part of a deposit you forgot about.", amount: [40, 80] },
  { id: "friend1", kind: "income", title: "A friend pays you back", text: "Jordan finally sent the $40 for concert tickets on Venmoo.", amount: [40, 40] },
  { id: "friend2", kind: "income", title: "Split the pizza", text: "Your roommate paid you back for last week's groceries on Cash Ap.", amount: [30, 45] },
  { id: "gift", kind: "income", title: "Birthday card", text: "Grandma's card had cash in it. Of course it did.", amount: [25, 50] },
  { id: "fine", kind: "expense", title: "Library fine", text: "That book you lost turned out to be a rare one.", amount: [35, 60] },
];

// Message text for each channel. {name} {amount} {due} are filled in.
export const NOTICE_TEXT = {
  text: "{name}: Your bill of {amount} is ready. Due day {due}. Reply STOP to stop texts.",
  email: "Your {name} statement is ready. Amount due: {amount}. Due date: day {due}.",
  mail: "PLEASE REMIT. {name}. Amount due {amount} by day {due}. Late fees apply.",
  app: "{name}: {amount} due on day {due}. Tap to view your bill.",
};

export const BILLDROP_META = {
  title: "Bill Drop",
  pitch: "Bills from different companies show up all month in different places. Log them, schedule them and keep your balance above $0 every single day.",
  skill: "banking",
  standards: ["A4", "C4", "D2"],
  metric: "Month Score",
  tie: { label: "fewer fees", better: "low" },
  rankedHint: "only Timed shifts are ranked",
  ranked: (s) => s.timer === "timed",
  board: (s) => `billdrop:${s.difficulty}`,
  boardLabel: (s) => ({ easy: "Easy", medium: "Medium", hard: "Hard" })[s.difficulty],
  timer: { timed: "Days tick by on their own.", none: "Press Space to move to the next day." },
  settings: (play) => {
    const prologue = Boolean(play?.prologue && !play.prologue.done);
    return [
      {
        key: "difficulty",
        label: "Difficulty",
        def: "easy",
        locked: prologue ? "easy" : null,
        lockedWhy: "Medium and Hard open once your bank account does.",
        options: [
          { value: "easy", label: "Easy", hint: "5 bills, no surprise autopays." },
          { value: "medium", label: "Medium", hint: "7 bills, 1 forgotten autopay." },
          { value: "hard", label: "Hard", hint: "8 bills, 2 forgotten autopays, a credit card." },
        ],
      },
    ];
  },
  mistakes: ["Each overdraft: the overdraft fee.", "Each late bill: its late fee.", "Each bill never paid: the bill amount, added as debt."],
  beats: ["A bill arrived. Add it to your calendar so you can see it.", "This line shows your balance every day this month. Keep it above $0.", "Pick a day before it's due. Pay after a paycheck lands."],
  why: { weak: "I paid it when I saw it.", okay: "I waited until it was due.", strong: "I paid it after my paycheck landed, so my balance stayed above zero." },
  revealTitle: "Your whole month, with every fee marked",
  unlock: 0,
};

// Bonus round questions (2.8). type "choice" (answer = index) or "number".
export const BILLDROP_BONUS = [
  { id: "bd1", type: "number", q: "Your balance is $300. Rent of $450 is due before payday. How much short are you?", answer: 150, why: "$450 minus $300 is $150 short." },
  { id: "bd2", type: "choice", q: "What is an overdraft?", choices: ["Paying a bill early", "Spending more than is in your account", "A bill that is paid by mail"], answer: 1, why: "An overdraft means your balance went below $0, and banks often charge a fee for it." },
  { id: "bd3", type: "choice", q: "Autopay pays a bill on which day?", choices: ["The day the bill arrives", "Its due date", "Payday"], answer: 1, why: "Autopay pulls the money on the due date, whether or not you have it." },
  { id: "bd4", type: "number", q: "You overdraft 3 times this month. Each fee is $35. How much in fees?", answer: 105, why: "3 times $35 is $105, money that bought you nothing." },
  { id: "bd5", type: "choice", q: "Cash flow is about...", choices: ["How much you earn in a year", "When money comes in and goes out", "How much cash is in your wallet"], answer: 1, why: "Timing matters. A bill due before payday can sink you even if the month adds up." },
  { id: "bd6", type: "number", q: "Paycheck $650 lands on day 15. Your balance on day 14 is $120. What's your balance on day 15?", answer: 770, why: "$120 plus $650 is $770." },
  { id: "bd7", type: "choice", q: "You forgot about a gym autopay. What's the best way to find autopays you forgot?", choices: ["Wait for a fee", "Check your bank app for scheduled payments", "Ask a friend"], answer: 1, why: "Your bank app lists automatic payments, so nothing drafts by surprise." },
  { id: "bd8", type: "choice", q: "Which bill can you usually ask to move to a later due date?", choices: ["Rent", "Your phone bill", "A car loan payment"], answer: 1, why: "Phone and utility companies often let you pick a due date. Rent and loans usually don't." },
  { id: "bd9", type: "number", q: "A $20 streaming bill every month costs how much in a year?", answer: 240, why: "$20 times 12 months is $240." },
  { id: "bd10", type: "choice", q: "A late fee happens when...", choices: ["You pay after the due date", "You pay with a card", "You pay early"], answer: 0, why: "Missing the due date usually adds a late fee, and very late payments can hurt your credit." },
  { id: "bd11", type: "number", q: "Credit card bill: $400 balance, $35 minimum. You pay the minimum. How much is left on the card?", answer: 365, why: "$400 minus $35 leaves $365, and interest grows on that." },
  { id: "bd12", type: "choice", q: "Paying the credit card minimum instead of the full balance means...", choices: ["No interest", "Interest on what's left", "A lower credit limit"], answer: 1, why: "Whatever you don't pay off keeps costing interest next month." },
  { id: "bd13", type: "number", q: "Start $500. Rent $600 due day 2. Paycheck $700 day 10. If rent drafts day 2, what's your balance that day (before any fee)?", answer: -100, tolerance: 0.01, why: "$500 minus $600 is negative $100, and the bank will charge an overdraft fee too." },
  { id: "bd14", type: "choice", q: "Why add every bill to your calendar?", choices: ["So you can see what's coming before it hits", "Banks require it", "It lowers the bill"], answer: 0, why: "A bill you can't see can't be planned for." },
  { id: "bd15", type: "choice", q: "Which is a need, not a want, on a bill list?", choices: ["Streaming", "Electric", "A second gaming subscription"], answer: 1, why: "You need power. Streaming is nice to have." },
  { id: "bd16", type: "number", q: "You pick up an extra shift that pays $15 an hour for 6 hours. How much?", answer: 90, why: "$15 times 6 is $90 before taxes." },
  { id: "bd17", type: "choice", q: "A bill arrives 10 days before it's due. When should you usually pay it?", choices: ["Right away, always", "On a day you'll have the money, before it's due", "After the due date"], answer: 1, why: "Any day up to the due date is on time. Pick one when your balance can handle it." },
  { id: "bd18", type: "number", q: "Two bills draft the same day: $80 and $60. Your balance is $100. How far below $0 do you go?", answer: -40, why: "$100 minus $140 is negative $40." },
  { id: "bd19", type: "choice", q: "What's the safest way to avoid overdrafts?", choices: ["Keep a small cushion in checking", "Use more autopays", "Pay every bill the day it arrives"], answer: 0, why: "A cushion absorbs surprises like a vet bill or a late paycheck." },
  { id: "bd20", type: "choice", q: "Paper mail bills are risky because...", choices: ["They cost more", "You might not see them until it's late", "They're never real"], answer: 1, why: "If you don't check the mailbox, you don't know the bill exists." },
  { id: "bd21", type: "number", q: "Rent is $900 and you earn $2,000 a month. What percent of your pay goes to rent?", answer: 45, tolerance: 0.5, why: "$900 divided by $2,000 is 0.45, or 45 percent. A lot of people aim for about 30 percent." },
];

export const BILLDROP_GUIDE = {
  how: {
    goal: "Get through a 30-day month with every bill paid on time and your balance above $0 every day.",
    steps: [
      "Bills show up in your notification tray as texts, emails and app alerts. Paper bills land in the mailbox, so open it now and then.",
      "Press Add to calendar on a bill. Only bills you add show on your balance line.",
      "Pick a pay day for each bill, any day up to its [[due date]]. Or turn on [[autopay]], which pays on the due date.",
      "Watch the balance line. A dashed line with a warning means you'd go below $0, which is an [[overdraft]] and costs a fee.",
      "Use the fix menu when a month is tight: move a utility's due date, cancel a subscription, or pick up an extra shift.",
      "On Hard, a credit card bill lets you pay the [[minimum payment]] or the full balance. The minimum costs interest later.",
    ],
    example: "Rent of $600 is due day 3, but your balance is $400 until payday on day 5. Paying rent on day 3 overdrafts. Paying it late costs a [[late fee]]. Moving your phone bill and planning ahead keeps your [[cash flow]] smooth.",
  },
  vocab: [
    { term: "due date", def: "The last day to pay a bill on time.", example: "The electric bill's due date is day 18." },
    { term: "autopay", def: "A setting that pays a bill automatically on its due date.", example: "Autopay paid the phone bill even though she forgot about it." },
    { term: "late fee", def: "Extra money a company charges when you pay after the due date.", example: "Rent was a day late, so the landlord added a $50 late fee." },
    { term: "overdraft", def: "When a payment takes your balance below $0. Banks often charge a fee for each one.", example: "Two bills drafted the same day and caused two overdraft fees." },
    { term: "cash flow", def: "The timing of money coming in and going out.", example: "His month added up, but his cash flow didn't, because rent was due before payday." },
    { term: "minimum payment", def: "The smallest amount you can pay on a credit card to stay on time. The rest costs interest.", example: "She paid the $35 minimum and owed interest on the other $365." },
  ],
  irl: {
    checked: "2026-10-25",
    intro: "Paying on time is mostly about timing, not just having enough money.",
    facts: [
      { stat: "More than a quarter of people said someone in their household was charged an overdraft or NSF fee in the past year.", source: "Consumer Financial Protection Bureau, Making Ends Meet report", year: 2023, url: "https://www.consumerfinance.gov/about-us/newsroom/cfpb-issues-report-showing-many-americans-are-surprised-by-overdraft-fees/" },
      { stat: "43 percent of people charged an overdraft fee were surprised by their most recent overdraft. Many didn't see it coming.", source: "Consumer Financial Protection Bureau, Making Ends Meet report", year: 2023, url: "https://www.consumerfinance.gov/about-us/newsroom/cfpb-issues-report-showing-many-americans-are-surprised-by-overdraft-fees/" },
      { stat: "Credit card late fees cost American families more than $14 billion in 2022, and a typical late fee was about $32.", source: "Consumer Financial Protection Bureau, press release", year: 2024, url: "https://www.consumerfinance.gov/archive/newsroom/cfpb-bans-excessive-credit-card-late-fees-lowers-typical-fee-from-32-to-8/" },
    ],
  },
};
