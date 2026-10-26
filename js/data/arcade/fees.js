// Fee Detective (GAME-SPECS.md game 12, upgrade): clients bring statements and
// bills. Find every fee, choose how to fight it and stop it coming back.
// Plain words, no em-dashes, no semicolons. Parody names only.

// name: [easy, medium, hard] versions of the line. docs: where it can show up.
// right: the correct actions (1 refund, 2 dispute, 3 cancel, 4 accept).
// habit: the fix that stops it, and two wrong ones.
export const FD_CHARGES = {
  maintenance: { label: "Monthly maintenance fee", docs: ["bank"], amount: [5, 15], name: ["MONTHLY MAINTENANCE FEE", "MAINT FEE", "SVC CHG"], right: ["refund"], habit: ["Set up direct deposit or keep the minimum balance", "Close the account today", "Use a different ATM"] },
  overdraft: { label: "Overdraft fee", docs: ["bank"], amount: [29, 36], name: ["OVERDRAFT FEE", "OD ITEM FEE", "OD CHG"], right: ["refund"], habit: ["Turn on low-balance alerts", "Write more checks", "Switch to paper statements"] },
  atm: { label: "Out-of-network ATM fee", docs: ["bank"], amount: [3, 5], name: ["OUT-OF-NETWORK ATM FEE", "NON-NETWORK ATM", "ATM SURCHG"], right: ["accept"], habit: ["Use your own bank's ATMs or get cash back at a store", "Ask for a refund every time", "Carry less cash"] },
  paper: { label: "Paper statement fee", docs: ["bank", "phone"], amount: [2, 3], name: ["PAPER STATEMENT FEE", "STMT FEE", "STMT CHG"], right: ["accept"], habit: ["Switch to free online statements", "Dispute it every month", "Stop opening your mail"] },
  inactivity: { label: "Inactivity fee", docs: ["bank"], amount: [5, 10], name: ["INACTIVITY FEE", "DORMANT ACCT FEE", "ACCT MAINT D"], right: ["refund"], habit: ["Make a small deposit or purchase every few months", "Close every account", "Turn off notifications"] },
  duplicate: { label: "Duplicate charge", docs: ["bank", "gym"], amount: [12, 60], name: ["DUPLICATE: {store}", "{store} (2)", "POS {store} #2"], right: ["dispute"], habit: ["Read your statement every month", "Stop using a debit card", "Ask the store for a coupon"] },
  cramming: { label: "Unknown third-party charge", docs: ["phone"], amount: [9, 15], name: ["THIRD-PARTY CHARGE: STAR TEXTS", "PREMIUM TEXT SVC", "3RD PTY BILLING"], right: ["dispute"], habit: ["Ask your carrier to block third-party charges", "Get a new phone number", "Turn off your phone at night"] },
  afterCancel: { label: "Charge after canceling", docs: ["gym"], amount: [20, 45], name: ["MONTHLY DUES (after cancel)", "MEMBERSHIP DUES", "RECURRING DUES"], right: ["dispute"], habit: ["Get your cancellation in writing and save it", "Never join a gym", "Pay with cash"] },
  unwanted: { label: "Unwanted subscription", docs: ["phone", "gym", "bank"], amount: [8, 16], name: ["STREAMFLIX TRIAL ENDED", "STRMFLX", "RECUR SUB 4471"], right: ["cancel"], habit: ["Set a reminder before free trials end", "Dispute it every month", "Use a different email"] },
  late: { label: "Late fee", docs: ["phone", "gym"], amount: [10, 25], name: ["LATE PAYMENT FEE", "LATE FEE", "LATE CHG"], right: ["accept", "refund"], habit: ["Turn on autopay", "Pay with a credit card", "Ignore the bill"] },
};

export const FD_DECOYS = {
  bank: [["Purchase: Trader Zoe's", [18, 64]], ["Purchase: Starducks", [4, 9]], ["Deposit: paycheck", [180, 420], 1], ["Transfer to savings", [20, 80]], ["Interest earned", [0.12, 0.85], 1], ["Purchase: Gas N Go", [22, 48]], ["Venmoo from Riley", [15, 40], 1], ["Purchase: Targit", [12, 70]], ["ATM withdrawal, your bank", [20, 60]], ["Purchase: Sneaker Hut", [45, 110]], ["Mobile deposit", [40, 150], 1], ["Purchase: Chick Filet", [8, 16]]],
  phone: [["Monthly plan", [35, 55]], ["Device payment 12 of 24", [18, 32]], ["Taxes and government fees", [4, 9]], ["Data add-on, 5 GB", [10, 10]], ["International text pack", [5, 5]], ["Insurance, phone protection", [7, 12]], ["Payment received, thank you", [45, 80], 1], ["Line 2 plan", [20, 30]], ["Prorated plan change", [3, 9]], ["Hotspot add-on", [10, 10]], ["Ringback tone you picked", [2, 2]], ["Credit: loyalty discount", [5, 10], 1], ["Activation of new line", [15, 30]]],
  gym: [["Monthly dues", [20, 45]], ["Personal training session", [30, 45]], ["Smoothie bar", [6, 9]], ["Locker rental", [5, 10]], ["Payment received, thank you", [20, 45], 1], ["Guest pass", [10, 15]], ["Towel service", [3, 5]], ["Annual maintenance fee (in contract)", [39, 49]], ["Class pack, 5 classes", [40, 60]], ["Water bottle", [15, 20]], ["Credit: referral bonus", [10, 20], 1], ["Protein bar", [3, 4]], ["Spin class drop-in", [12, 18]]],
};

export const FD_STORES = ["Trader Zoe's", "Targit", "Sneaker Hut", "Gas N Go", "Chick Filet", "Amazin"];

// 30 clients and their documents (10 of each type).
export const FD_CLIENTS = [
  ["Mrs. Pennywhistle", "bank", "My bank keeps nibbling at my account and I can't see where."],
  ["Gus Tran", "bank", "I swear I had more money than this last month."],
  ["Odessa King", "bank", "My grandson set up this account and now there are fees?"],
  ["Felix Ruiz", "bank", "Can you look at my checking before I lose my mind?"],
  ["Nia Shaw", "bank", "Something smells off in my statement."],
  ["Coach Briggs", "bank", "The team account has charges I don't understand."],
  ["Juniper Hale", "bank", "I just opened this account. Why is it shrinking?"],
  ["Rocco Bell", "bank", "My savings are fine, but checking is a mess."],
  ["Winnie Park", "bank", "I want every penny back that I'm owed."],
  ["Thaddeus Moon", "bank", "I never read these. Will you?"],
  ["Lupe Ortiz", "phone", "My phone bill went up and nobody told me why."],
  ["Ezra Pike", "phone", "I think my phone company is charging me for texts I never sent."],
  ["Mabel Ford", "phone", "The bill is longer than my grocery list."],
  ["Dante Cole", "phone", "Something on here is not mine."],
  ["Saffron Lee", "phone", "I pay this on time. Mostly."],
  ["Bartholomew Finch", "phone", "My plan was supposed to be $40. What happened?"],
  ["Priya Shah", "phone", "Can you find what's padding my phone bill?"],
  ["Ambrose Kettle", "phone", "I signed up for a free trial once. Once."],
  ["Kit Morales", "phone", "My mom says my phone bill is too high."],
  ["Tamsin Gray", "phone", "Read this for me before I call them angry."],
  ["Hollis Grant", "gym", "I canceled my gym in March. It's still charging me."],
  ["Delphine Moreau", "gym", "My gym bill doubled and I only went twice."],
  ["Ike Watson", "gym", "Why do I pay the gym more than I pay for food?"],
  ["Rosalind Park", "gym", "I think they charged me twice for the same month."],
  ["Wren Adler", "gym", "The gym's statement is a puzzle."],
  ["Sir Reginald", "gym", "I joined for the smoothies. Now what?"],
  ["Marisol Vega", "gym", "Find whatever I shouldn't be paying."],
  ["Bea Klein", "gym", "My trainer quit but the bill didn't."],
  ["Big Lou", "gym", "Check this before I pay it, would you?"],
  ["Clementine Ash", "gym", "I froze my membership. Did they freeze the bill?"],
];

export const FD_DOC_NAMES = { bank: "Bank statement", phone: "Phone bill", gym: "Gym statement" };

export const FEES_META = {
  title: "Fee Detective",
  pitch: "Clients bring you their statements and bills. Find every fee, choose how to fight it, and stop it from coming back.",
  skill: "banking",
  standards: ["C3", "C5", "D4"],
  metric: "Case Score",
  tie: { label: "fewer wrong marks", better: "low" },
  rankedHint: "only Timed shifts are ranked",
  ranked: (s) => s.timer === "timed",
  board: (s) => `fees:${s.difficulty}`,
  boardLabel: (s) => ({ easy: "Easy", medium: "Medium", hard: "Hard" })[s.difficulty],
  timer: { timed: "3:30 for three cases.", none: "Take your time." },
  settings: () => [
    {
      key: "difficulty",
      label: "Difficulty",
      def: "easy",
      options: [
        { value: "easy", label: "Easy", hint: "Fees have clear names." },
        { value: "medium", label: "Medium", hint: "Mixed names, some short." },
        { value: "hard", label: "Hard", hint: "Vague names like SVC CHG." },
      ],
    },
  ],
  mistakes: ["Each fee you miss: its monthly amount.", "Disputing a charge that was fine: $10."],
  beats: ["Mark every line that's a fee.", "Pick how to handle each one. Refunds and disputes cost a phone call.", "Pick the habit that stops it next time."],
  why: { weak: "I disputed everything.", okay: "It was a big fee.", strong: "I saved my calls for the charges worth the most and fixed the small ones with a habit." },
  revealTitle: "What the fees would have cost",
  unlock: 1,
};

export const FEES_BONUS = [
  { id: "d1", type: "number", q: "A $12 fee every month costs how much a year?", answer: 144, why: "$12 times 12 months is $144." },
  { id: "d2", type: "choice", q: "A duplicate charge should be...", choices: ["Disputed", "Accepted", "Ignored"], answer: 0, why: "You were charged twice for one thing. That's an error you can dispute." },
  { id: "d3", type: "choice", q: "Interest earned on a statement is...", choices: ["Money the bank pays you, not a fee", "A fee", "A late charge"], answer: 0, why: "Interest earned adds to your balance." },
  { id: "d4", type: "choice", q: "Cramming is...", choices: ["Sneaking third-party charges onto a phone bill", "Studying all night", "A bank fee"], answer: 0, why: "Unknown third-party charges on phone bills are called cramming. Dispute them." },
  { id: "d5", type: "choice", q: "The best way to avoid out-of-network ATM fees is to...", choices: ["Use your own bank's ATMs or get cash back at a store", "Ask for a refund every time", "Use more ATMs"], answer: 0, why: "A habit beats a phone call for small fees." },
  { id: "d6", type: "choice", q: "Banks often waive a first-time fee if you...", choices: ["Call and ask politely", "Close the account", "Never call"], answer: 0, why: "A first slip is often forgiven. Repeat fees less often." },
  { id: "d7", type: "number", q: "A $3 paper statement fee and a $5 ATM fee every month. How much a year?", answer: 96, why: "$8 a month times 12 is $96." },
  { id: "d8", type: "choice", q: "If a gym keeps charging after you canceled, you should...", choices: ["Dispute it and show your cancellation", "Pay it forever", "Join a second gym"], answer: 0, why: "Proof of cancellation wins disputes. Keep it in writing." },
  { id: "d9", type: "choice", q: "A monthly maintenance fee can often be avoided by...", choices: ["Direct deposit or a minimum balance", "Overdrafting", "Using paper checks"], answer: 0, why: "Many banks drop the fee if you meet one of their rules." },
  { id: "d10", type: "choice", q: "A dispute is...", choices: ["Telling a company a charge is wrong and asking them to fix it", "A refund for a fee you earned", "A type of loan"], answer: 0, why: "Disputes are for errors. Refund requests are for fees you'd like waived." },
  { id: "d11", type: "number", q: "You got two $35 overdraft fees refunded. How much did you recover?", answer: 70, why: "$35 times 2 is $70." },
  { id: "d12", type: "choice", q: "An inactivity fee happens when...", choices: ["You don't use an account for a long time", "You use it too much", "You get paid"], answer: 0, why: "A small purchase or deposit every few months keeps it active." },
  { id: "d13", type: "choice", q: "A free trial that turned into a monthly charge you don't want should be...", choices: ["Canceled", "Disputed every month", "Ignored"], answer: 0, why: "Canceling stops it. Set a reminder next time." },
  { id: "d14", type: "choice", q: "Why read every statement?", choices: ["Fees and errors hide in small lines", "It's required by law", "To earn points"], answer: 0, why: "Most people never notice small fees until they add up." },
  { id: "d15", type: "number", q: "A $9.99 charge you never signed up for, every month for a year. How much?", answer: 119.88, why: "$9.99 times 12 is $119.88." },
  { id: "d16", type: "choice", q: "Which fee is usually best handled with a habit, not a call?", choices: ["A $3 ATM fee", "A $60 duplicate charge", "A $35 overdraft"], answer: 0, why: "Save your calls for the big ones." },
  { id: "d17", type: "choice", q: "The Fair Credit Billing Act lets you...", choices: ["Dispute billing errors on credit cards", "Skip paying bills", "Raise your credit limit"], answer: 0, why: "You have the right to dispute errors like double charges." },
  { id: "d18", type: "choice", q: "A late fee on your first slip-up might be...", choices: ["Waived if you ask", "Doubled", "Sent to collections"], answer: 0, why: "Many companies forgive a first late fee. Then turn on autopay." },
  { id: "d19", type: "number", q: "A $15 monthly fee was refunded and a $10 subscription canceled. How much did that save this month?", answer: 25, why: "$15 plus $10 is $25." },
  { id: "d20", type: "choice", q: "A deposit on a statement is...", choices: ["Money coming in", "A fee", "A purchase"], answer: 0, why: "Deposits add money. Not a fee." },
  { id: "d21", type: "choice", q: "Before you dispute a charge, you should...", choices: ["Check that it really is wrong", "Dispute it right away no matter what", "Close your card"], answer: 0, why: "Disputing a real charge wastes your time and can cost you." },
];

export const FEES_GUIDE = {
  how: {
    goal: "Find every fee on three clients' statements, handle each one the smart way, and pick the habit that stops it coming back.",
    steps: [
      "Read each line. A [[fee]] is money taken for a service or a slip. Purchases, deposits, transfers and interest earned are not fees.",
      "Tap a line to mark it. Then press That's all the fees (F), or No fees on this one (N).",
      "Pick an action for each marked line: ask for a [[refund]] (1), [[dispute]] it (2), [[cancel]] it (3), or accept it (4).",
      "Refunds and disputes each cost one of your 3 calls. Save them for the charges worth the most.",
      "Pick the habit that stops the main fee. Case 3 is your first client again, a month later. Skip the habit and the fee is back.",
      "Watch for [[cramming]] on phone bills and charges after a [[cancellation]].",
    ],
    example: "A $35 overdraft fee: ask for a refund, then fix it with low-balance alerts. A $3 out-of-network ATM fee: accept it and use your own bank's ATMs next time.",
  },
  vocab: [
    { term: "fee", def: "Money a company charges for a service or a slip-up.", example: "The bank charged a $3 fee for using another bank's ATM." },
    { term: "statement", def: "A monthly list of everything that went in and out of an account.", example: "Check your statement every month." },
    { term: "overdraft", def: "Spending more than you have in the account.", example: "Her balance was $10, so the $25 purchase was an overdraft." },
    { term: "maintenance fee", def: "A monthly charge some banks add just for having the account.", example: "Direct deposit can make the maintenance fee go away." },
    { term: "direct deposit", def: "Pay that goes straight into your account.", example: "With direct deposit, payday money shows up on its own." },
    { term: "minimum balance", def: "The least money a bank wants you to keep to avoid a fee.", example: "Keep $300 in checking and the fee goes away." },
    { term: "waive", def: "To cancel a fee.", example: "The bank waived the fee because it was her first one." },
    { term: "refund", def: "Getting money back for a fee or a charge.", example: "He called and got a refund for his first overdraft fee." },
    { term: "dispute", def: "Telling a company a charge is a mistake and asking them to fix it.", example: "She disputed the duplicate charge and got it reversed." },
    { term: "cramming", def: "Third-party charges sneaked onto a phone bill.", example: "A $9.99 premium text charge was cramming." },
    { term: "cancel", def: "Stop a subscription or service so it stops charging you.", example: "He canceled the trial before it renewed." },
    { term: "cancellation", def: "Proof that you ended a service. Keep it in writing.", example: "Her cancellation email won the gym dispute." },
  ],
  irl: {
    checked: "2026-10-23",
    intro: "Fees are quiet. Most people don't notice them until they add up.",
    facts: [
      { stat: "Banks that report their fees still collected $5.8 billion in overdraft and non-sufficient funds fees in 2023.", source: "Consumer Financial Protection Bureau, Data Spotlight", year: 2024, url: "https://files.consumerfinance.gov/f/documents/cfpb_overdraft-nsf_data-spotlight_2024-04.pdf" },
      { stat: "That was down by more than half from before the pandemic, because many banks changed their rules. Fees are a choice the bank makes, and they can change.", source: "Consumer Financial Protection Bureau, Data Spotlight", year: 2024, url: "https://files.consumerfinance.gov/f/documents/cfpb_overdraft-nsf_data-spotlight_2024-04.pdf" },
      { stat: "The typical purchase that causes an overdraft is only $50, and it is usually paid back about three days later. A small slip can cost a lot.", source: "Consumer Financial Protection Bureau, overdraft report", year: 2024, url: "https://files.consumerfinance.gov/f/documents/cfpb_overdraft-nsf-practices-very-large-financial-institutions_2024-01.pdf" },
    ],
  },
};
