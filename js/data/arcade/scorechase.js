// Score Chase (GAME-SPECS.md game 7): 700 by month 18, starting with no score.
// Cards are data. Each choice lists its effects, read by js/arcade/scorechase.js:
//   open: { type, kind, name, limit, owner, deposit }   a new account
//   inquiry: true      a hard inquiry          spend: n      card spending this month
//   cash: n            cash in or out          late: true    this month's payment is late
//   close: "oldest"    close your oldest card  limitUp: n    raise the main card's limit
//   cosign: n          cosign a loan of n      collectionIn: [months, amount]
//   payCollection: true  removeAu: true  autopay: "full"  upgrade: true  goodwill: true
//   chance: [p, { ...effects if it happens }, "text if it happens"]
// good marks the choice a careful player makes (for the bots and the why capture).
// ignore is the choice that happens when a timed card runs out.
// Situation text 35 words or less, choices 6 words or less. No em-dashes, no semicolons.

export const SC_SETUP = {
  id: "setup",
  title: "Set up autopay",
  text: "Before your first card, pick how autopay works on every card you get. It runs every month, even when you forget.",
  choices: [
    { label: "Pay the full balance", effects: { autopay: "full" }, text: "Autopay pays your whole statement each month. No interest, no late payments.", good: true },
    { label: "Pay the minimum", effects: { autopay: "min" }, text: "Autopay pays the minimum. You're never late, but the rest costs interest." },
    { label: "Off, I'll pay myself", effects: { autopay: "off" }, text: "No autopay. Every month a card will ask you to pay. Miss it and you're late." },
  ],
  ignore: 2,
};

export const SC_START = {
  id: "start",
  title: "Month 1: how do you start?",
  text: "You need a credit history to get a score. Pick how to start building one.",
  choices: [
    { label: "Secured card, $300 deposit", effects: { open: { type: "secured", name: "Coinhaven Secured Card", limit: 300, deposit: 300 }, inquiry: true }, text: "You put down $300 and got a $300 limit. Your deposit comes back later.", good: true },
    { label: "Join a parent's card", effects: { open: { type: "premium", owner: "authorized", name: "Parent's Chaise card", limit: 5000, carry: 900 } }, text: "You're an authorized user. Their history helps you, and their mistakes could too." },
    { label: "Store card, 20% off today", effects: { open: { type: "store", name: "Targit RedCard", limit: 300 }, inquiry: true, cash: 25 }, text: "You saved $25 today. Store cards have tiny limits and big interest rates." },
    { label: "Not yet", effects: {}, text: "No card yet. No history means no score." },
  ],
  ignore: 3,
};

// Asked every month while autopay is off and a card has a balance.
export const SC_PAY = {
  id: "pay",
  title: "Pay your card",
  text: "Your statement is ready. Autopay is off, so it's on you. What do you pay?",
  choices: [
    { label: "The full balance", effects: { pay: "full" }, text: "Paid in full. No interest.", good: true },
    { label: "Just the minimum", effects: { pay: "min" }, text: "On time, but the rest of the balance will cost interest." },
  ],
  ignore: null,
  ignoreText: "You forgot to pay. That's a late payment.",
  ignoreEffects: { late: true },
};

export const SC_COSIGN_BITE = {
  id: "cosignBite",
  title: "Jordan stopped paying",
  text: "Jordan missed two payments on the loan you cosigned. The lender is calling you now. It's on your report too.",
  choices: [
    { label: "Pay Jordan's $160", effects: { cash: -160 }, text: "You paid $160 you'll probably never see again. Your report stays clean.", good: true },
    { label: "Take the hit", effects: { late: true, cosignLate: true }, text: "A late payment on the cosigned loan lands on your report." },
  ],
  ignore: 1,
};

// The deck. needs: what must be true to draw it. from: the earliest month.
export const SC_CARDS = [
  { id: "storeCard", from: 2, title: "20% off at Sneaker Hut", text: "The cashier says you'll save 20% today if you open a Sneaker Hut card. It takes one minute.", choices: [{ label: "Open the card", effects: { open: { type: "store", name: "Sneaker Hut card", limit: 250 }, inquiry: true, cash: 20 }, text: "You saved $20, got a hard inquiry and a new account." }, { label: "No thanks", effects: {}, text: "You paid full price and kept your report quiet.", good: true }], ignore: 1 },
  { id: "cosign", from: 3, title: "Jordan needs a cosigner", text: "Your friend Jordan needs a cosigner for a $1,200 car loan. If Jordan doesn't pay, you have to.", choices: [{ label: "Cosign it", effects: { cosign: 1200 }, text: "You're on the hook for Jordan's loan now." }, { label: "Say no kindly", effects: {}, text: "Jordan was disappointed, but your credit stays yours.", good: true }], ignore: 1 },
  { id: "cli", from: 6, needs: "revolving", title: "A higher limit", text: "Your card offers to raise your limit by $400. No hard inquiry, no fee.", choices: [{ label: "Accept the raise", effects: { limitUp: 400 }, text: "More limit means the same spending uses less of it.", good: true }, { label: "No thanks", effects: {}, text: "Your limit stays the same." }], ignore: 1 },
  { id: "closeOld", from: 8, needs: "twoCards", title: "Close your oldest card?", text: "You hardly use your oldest card anymore. It feels tidy to close it.", choices: [{ label: "Close it", effects: { close: "oldest" }, text: "Closed. You lost its limit and its age on your report." }, { label: "Keep it open", effects: {}, text: "It stays open, quietly making your history older.", good: true }], ignore: 1 },
  { id: "scam", from: 3, title: "We erase bad credit!", text: "CreditFix Pros: we erase bad history for $199. Results in 30 days, guaranteed!", choices: [{ label: "Pay $199", effects: { cash: -199 }, text: "Nothing changed. No one can erase true information from your report." }, { label: "Ignore it", effects: {}, text: "Good call. Accurate history can't be erased for a fee.", good: true }], ignore: 1 },
  { id: "checkScore", from: 2, title: "Check your own score?", text: "Your bank app offers a free score check. A friend says checking your score lowers it.", choices: [{ label: "Check it", effects: { soft: true }, text: "Checking your own score is a soft inquiry. It never hurts.", good: true }, { label: "Skip it", effects: {}, text: "Fine, but checking your own score never lowers it." }], ignore: 1 },
  { id: "lendCard", from: 4, needs: "ownCard", title: "Can I borrow your card?", text: "A friend wants to borrow your card for a $250 concert ticket and promises to pay you back.", choices: [{ label: "Lend it", effects: { spend: 250, chance: [0.5, { cash: 250 }, "They paid you back. This time."] }, text: "$250 went on your card." }, { label: "Say no", effects: {}, text: "Your card, your rules.", good: true }], ignore: 1 },
  { id: "medical", from: 3, title: "A bill you never saw", text: "A $180 urgent care bill shows up. It went to an old address and it's due now.", choices: [{ label: "Pay it now", effects: { cash: -180 }, text: "Paid. It never reaches your report.", good: true }, { label: "Set it aside", effects: { collectionIn: [2, 180] }, text: "Ignored bills can go to collections." }], ignore: 1 },
  { id: "laptop", from: 4, needs: "ownCard", title: "A $260 laptop deal", text: "A laptop you need for school is $260 this week only. You could put it on your card.", choices: [{ label: "Charge it", effects: { spend: 260 }, text: "That uses a big part of your limit this month." }, { label: "Save cash for it", effects: { cash: -260 }, text: "Paid with cash. Your card balance stays low.", good: true }], ignore: 1 },
  { id: "apartment", from: 9, title: "Apartment pre-check", text: "An apartment you love runs a credit check before you can tour it.", choices: [{ label: "Let them check", effects: { inquiry: true }, text: "One hard inquiry. A small, short dip." }, { label: "Tour another place", effects: {}, text: "No inquiry this time.", good: true }], ignore: 1 },
  { id: "transfer", from: 7, needs: "ownCard", title: "Balance transfer offer", text: "A new card offers 0% interest for 12 months if you move your balance to it. There's a 3% fee.", choices: [{ label: "Apply for it", effects: { open: { type: "student", name: "Transfer card", limit: 500 }, inquiry: true, cash: -15 }, text: "New card, new inquiry, and a fee." }, { label: "Pay it down", effects: {}, text: "You kept it simple.", good: true }], ignore: 1 },
  { id: "secondCard", from: 9, needs: "ownCard", title: "A student card", text: "A student card offers a $500 limit and no annual fee. You've had your first card a while now.", choices: [{ label: "Apply", effects: { open: { type: "student", name: "Discovr Student Card", limit: 500 }, inquiry: true }, text: "Approved. More limit, one inquiry and a newer account.", good: true }, { label: "Not now", effects: {}, text: "Fine. One card is enough for now." }], ignore: 1 },
  { id: "builder", from: 3, title: "A credit builder loan", text: "The credit union offers a $600 loan that you pay $50 a month into a locked savings account.", choices: [{ label: "Open it", effects: { open: { type: "creditBuilder", kind: "installment", name: "Credit builder loan", original: 600 }, inquiry: true }, text: "A second kind of credit. You pay into your own savings.", good: true }, { label: "No thanks", effects: {}, text: "No loan." }], ignore: 1 },
  { id: "holiday", from: 5, needs: "ownCard", title: "Holiday gifts", text: "Everyone on your list wants something. You could put $220 of gifts on your card.", choices: [{ label: "Charge $220", effects: { spend: 220 }, text: "Your card balance jumped this month." }, { label: "Set a $60 budget", effects: { spend: 60 }, text: "Thoughtful gifts, small balance.", good: true }], ignore: 1 },
  { id: "goodwill", from: 3, needs: "hadLate", title: "Ask for a second chance", text: "You paid late once. You could call the card company and ask them to remove it as a goodwill gesture.", choices: [{ label: "Call and ask", effects: { goodwill: true }, text: "You asked politely." , good: true }, { label: "Skip it", effects: {}, text: "The late mark stays." }], ignore: 1 },
  { id: "phish", from: 3, needs: "ownCard", title: "Card locked?", text: "A text says: Your card is locked. Verify your number at chaise-secure.co now.", choices: [{ label: "Tap the link", effects: { spend: 300 }, text: "Scammers charged $300 to your card. You'll have to dispute it." }, { label: "Call the bank", effects: {}, text: "The bank says your card is fine. It was a scam.", good: true }], ignore: 1 },
  { id: "rewards", from: 6, title: "A rewards card with a fee", text: "A travel card with a $95 yearly fee wants you. Free airport lounge!", choices: [{ label: "Apply", effects: { open: { type: "premium", name: "Wanderlust Card", limit: 1000 }, inquiry: true, cash: -95 }, text: "You pay $95 a year for a lounge you'll rarely see." }, { label: "Pass", effects: {}, text: "No fee, no inquiry.", good: true }], ignore: 1 },
  { id: "raise", from: 4, title: "You got a raise", text: "Your boss gave you a raise. That's $40 more each month.", choices: [{ label: "Save the extra", effects: { cash: 120 }, text: "Your cushion grows.", good: true }, { label: "Spend it on your card", effects: { spend: 120 }, text: "More fun, higher balance." }], ignore: 0 },
  { id: "breach", from: 5, title: "A store got hacked", text: "A store you shop at had a data breach. Your info may be out there.", choices: [{ label: "Freeze your credit", effects: { soft: true }, text: "A freeze stops anyone from opening accounts in your name. It's free.", good: true }, { label: "Do nothing", effects: { chance: [0.4, { collectionIn: [2, 240] }, "Someone opened a phone plan in your name."] }, text: "You hoped for the best." }], ignore: 1 },
  { id: "upgrade", from: 8, needs: "secured", title: "Graduate your secured card", text: "Your secured card can become a regular card. You get your $300 deposit back and a $500 limit.", choices: [{ label: "Upgrade it", effects: { upgrade: true }, text: "Deposit back, limit up, same account age.", good: true }, { label: "Keep it secured", effects: {}, text: "Nothing changes." }], ignore: 1 },
  { id: "parentLate", from: 4, needs: "au", title: "Your parent paid late", text: "The parent whose card you're on missed a payment. That account is on your report too.", choices: [{ label: "Come off the card", effects: { removeAu: true }, text: "You're off their card. Its history leaves your report.", good: true }, { label: "Stay on it", effects: { auLate: true }, text: "Their late payment shows on your report too." }], ignore: 1 },
  { id: "bnpl", from: 4, title: "Pay in 4 headphones", text: "Headphones for $120, or 4 payments of $30. Some pay-later apps now report to credit bureaus.", choices: [{ label: "Pay in 4", effects: { cash: -120 }, text: "You paid every installment on time." }, { label: "Pay cash", effects: { cash: -120 }, text: "Paid. Done.", good: true }], ignore: 1 },
  { id: "carRepair", from: 5, title: "Car repair: $300", text: "Your car needs $300 of brake work. Your card offers a cash advance.", choices: [{ label: "Cash advance", effects: { spend: 315 }, text: "Cash advances have a fee and start costing interest right away." }, { label: "Pay from savings", effects: { cash: -300 }, text: "Savings did its job.", good: true }], ignore: 1 },
  { id: "dispute", from: 6, needs: "ownCard", title: "A charge you didn't make", text: "There's a $45 charge from a store you've never heard of on your statement.", choices: [{ label: "Dispute it", effects: {}, text: "The card company took it off. Disputes are your right.", good: true }, { label: "Just pay it", effects: { cash: -45 }, text: "You paid for someone else's stuff." }], ignore: 1 },
  { id: "rent", from: 10, title: "Report your rent?", text: "Your landlord can report your on-time rent payments. It's free.", choices: [{ label: "Turn it on", effects: { soft: true }, text: "Some scores count rent. It can't hurt if you pay on time.", good: true }, { label: "No thanks", effects: {}, text: "Rent stays off your report." }], ignore: 1 },
  { id: "payday", from: 6, title: "Fast cash, no credit check!", text: "A payday lender offers $300 today, $375 due in two weeks. No credit check.", choices: [{ label: "Take it", effects: { cash: -75 }, text: "$75 for two weeks of borrowing. That's a huge rate." }, { label: "Walk away", effects: {}, text: "Smart. Payday loans are some of the most expensive money there is.", good: true }], ignore: 1 },
  { id: "subs", from: 3, needs: "ownCard", title: "Streaming bundle", text: "Add 4 streaming services to your card for $60 a month.", choices: [{ label: "Add them all", effects: { spend: 60, monthly: 60 }, text: "$60 more on your card every month." }, { label: "Keep just one", effects: { spend: 15 }, text: "One show at a time.", good: true }], ignore: 1 },
  { id: "minTrap", from: 5, needs: "minAutopay", title: "Switch to paying in full?", text: "Autopay pays only your minimum. Interest is adding up. Switch to paying the full balance?", choices: [{ label: "Switch to full", effects: { autopay: "full" }, text: "No more interest from now on.", good: true }, { label: "Keep the minimum", effects: {}, text: "The balance keeps rolling over." }], ignore: 1 },
];

// Surprise cards (3 to 5 a shift). They land on top of the month's card.
export const SC_SURPRISES = [
  { id: "expired", needs: "autopayOn", title: "Card expired", text: "Your card expired and autopay bounced this month. The new card is in your junk mail.", choices: [{ label: "Pay it by hand now", effects: {}, text: "Paid on time. Close one.", good: true }, { label: "Deal with it later", effects: { late: true }, text: "Later was too late. That's a late payment." }], ignore: 1 },
  { id: "bigBill", title: "Surprise expense", text: "Your phone screen cracked. Fixing it costs $150.", choices: [{ label: "Pay with cash", effects: { cash: -150 }, text: "Cash covered it.", good: true }, { label: "Put it on the card", effects: { spend: 150 }, text: "Your card balance went up." }], ignore: 0 },
  { id: "travel", title: "Weekend trip", text: "Friends are going to the beach. Your share is $180.", choices: [{ label: "Go, on the card", effects: { spend: 180 }, text: "Great memories, bigger balance." }, { label: "Go, with cash", effects: { cash: -180 }, text: "Great memories, no balance.", good: true }], ignore: 1 },
  { id: "bonus", title: "A small bonus", text: "You won $100 at a school raffle!", choices: [{ label: "Pay down your card", effects: { cash: 100, payDown: 100 }, text: "Lower balance, lower utilization.", good: true }, { label: "Keep the cash", effects: { cash: 100 }, text: "Nice cushion." }], ignore: 1 },
];

export const SCORECHASE_META = {
  title: "Score Chase",
  pitch: "You need a 700 credit score in 18 months to rent the apartment you want. You start with no score at all.",
  skill: "credit",
  standards: ["D3", "D1", "D4", "D5"],
  metric: "Final credit score",
  tie: { label: "higher cash", better: "high" },
  rankedHint: "only Timed shifts are ranked",
  ranked: (s) => s.timer === "timed",
  board: () => "scorechase",
  timer: { timed: "10 seconds a card.", none: "Take your time on each card." },
  format: (v) => (v > 0 ? String(v) : "No score"),
  settings: () => [],
  mistakes: ["A late payment: a $25 late fee.", "An account sent to collections: the bill amount, added as debt.", "Paying the credit repair scam: $199."],
  beats: ["Pick a choice. Each one changes your credit.", "These five bars are what your score is made of.", "Changes show up next month, when your card company reports them."],
  why: { weak: "It sounded like a good deal.", okay: "I didn't want a hard inquiry.", strong: "Closing my oldest card would raise my utilization and shorten my history." },
  revealTitle: "Your score, month by month",
  unlock: 4,
};

export const SCORECHASE_BONUS = [
  { id: "s1", type: "choice", q: "Which part counts the most in a credit score?", choices: ["Payment history", "Credit mix", "New credit"], answer: 0, why: "Payment history is about 35 percent. Paying on time matters most." },
  { id: "s2", type: "number", q: "You owe $150 on a $500 limit. What's your utilization, in percent?", answer: 30, tolerance: 0.5, why: "$150 divided by $500 is 0.30, or 30 percent." },
  { id: "s3", type: "choice", q: "Checking your own credit score...", choices: ["Never lowers it", "Lowers it a lot", "Lowers it a little"], answer: 0, why: "Checking your own score is a soft inquiry. It has no effect." },
  { id: "s4", type: "choice", q: "No credit score means...", choices: ["Not enough history yet", "A very bad score", "You owe money"], answer: 0, why: "No score is not a bad score. It just means there isn't enough history." },
  { id: "s5", type: "choice", q: "Closing your oldest card usually...", choices: ["Shortens your history and can raise utilization", "Raises your score", "Removes late payments"], answer: 0, why: "You lose its age and its limit, so the same balance uses more of your total limit." },
  { id: "s6", type: "choice", q: "Cosigning a loan means...", choices: ["You must pay if they don't", "You're a reference", "You get half the money"], answer: 0, why: "A cosigner is fully on the hook, and their missed payments hit your report." },
  { id: "s7", type: "number", q: "Your limit is $1,000. To stay under 30 percent utilization, what's the most you should owe?", answer: 300, why: "30 percent of $1,000 is $300." },
  { id: "s8", type: "choice", q: "A hard inquiry happens when...", choices: ["You apply for new credit", "You check your score", "You pay your bill"], answer: 0, why: "Lenders pull your report when you apply. That's a hard inquiry." },
  { id: "s9", type: "choice", q: "Can a company legally erase true late payments for a fee?", choices: ["No", "Yes, for $199", "Only on weekends"], answer: 0, why: "Accurate information stays on your report. Credit repair promises like that are a red flag." },
  { id: "s10", type: "choice", q: "An authorized user is...", choices: ["Someone added to another person's card", "A store clerk", "A cosigner"], answer: 0, why: "You get the card's history on your report, good or bad." },
  { id: "s11", type: "choice", q: "A secured card needs...", choices: ["A deposit that becomes your limit", "A cosigner", "A high score"], answer: 0, why: "Your deposit backs the card, so it's easy to get with no history." },
  { id: "s12", type: "number", q: "Your balance is $90 on a $300 limit. What's your utilization, in percent?", answer: 30, tolerance: 0.5, why: "$90 divided by $300 is 0.30, or 30 percent." },
  { id: "s13", type: "choice", q: "Which helps your score most this month?", choices: ["Paying on time", "Opening three cards", "Closing old cards"], answer: 0, why: "On-time payments build the biggest part of your score." },
  { id: "s14", type: "choice", q: "Credit mix means...", choices: ["Having different kinds of credit, like a card and a loan", "Using two cards at once", "Mixing cash and credit"], answer: 0, why: "A card plus a loan shows you can handle different kinds of credit." },
  { id: "s15", type: "choice", q: "A raise in your credit limit with no inquiry usually...", choices: ["Lowers your utilization", "Hurts your score", "Adds a late payment"], answer: 0, why: "The same balance is a smaller share of a bigger limit." },
  { id: "s16", type: "number", q: "A late payment comes with a $25 fee. Three of them cost how much?", answer: 75, why: "$25 times 3 is $75, plus the damage to your report." },
  { id: "s17", type: "choice", q: "A bill sent to collections...", choices: ["Hurts your score a lot", "Doesn't count", "Raises your score"], answer: 0, why: "Collections are one of the most damaging marks on a report." },
  { id: "s18", type: "choice", q: "If you find a charge you didn't make, you should...", choices: ["Dispute it with the card company", "Pay it quietly", "Close every card"], answer: 0, why: "You have the right to dispute billing errors and fraud." },
  { id: "s19", type: "choice", q: "Length of credit history looks at...", choices: ["How long your accounts have been open", "How long your bills are", "Your age"], answer: 0, why: "Older accounts show a longer track record." },
  { id: "s20", type: "choice", q: "A credit freeze...", choices: ["Stops new accounts in your name", "Lowers your score", "Closes your cards"], answer: 0, why: "A freeze blocks new credit until you lift it, and it's free." },
  { id: "s21", type: "number", q: "Two cards: $200 owed on $500 and $100 owed on $1,000. What's your total utilization, in percent?", answer: 20, tolerance: 0.5, why: "$300 owed on $1,500 total limit is 20 percent." },
];

export const SCORECHASE_GUIDE = {
  how: {
    goal: "Reach a 700 [[credit score]] by month 18, starting from no score at all.",
    steps: [
      "First, set up autopay. Then pick how to start your history: a [[secured card]], becoming an [[authorized user]], or a store card.",
      "Each month a card shows up. Press Left or Right to choose. In timed mode, a card that runs out picks the do-nothing choice.",
      "The five bars on the right are what your score is made of. [[Payment history]] counts the most.",
      "Changes show up the next month, when your card company reports them. Watch for the Pending chip.",
      "Keep [[utilization]] low, pay on time, and be careful with a [[hard inquiry]] or a request to [[cosign]].",
    ],
    example: "You charge a $260 laptop on a $300 limit. Next month your utilization reports at about 87 percent and your score drops. Paying cash would have kept it low.",
  },
  vocab: [
    { term: "credit score", def: "A number from 300 to 850 that shows lenders how you've handled credit.", example: "A 720 credit score gets better rates than a 620." },
    { term: "payment history", def: "Whether you paid on time. It's the biggest part of your score.", example: "One late payment can drop a young score by a lot." },
    { term: "utilization", def: "How much of your credit limit you're using.", example: "$90 owed on a $300 limit is 30 percent utilization." },
    { term: "hard inquiry", def: "A check of your report when you apply for credit. It lowers your score a little for a while.", example: "Applying for three store cards added three hard inquiries." },
    { term: "cosign", def: "Promise to pay someone else's loan if they don't.", example: "She cosigned her brother's loan and his late payments hit her report." },
    { term: "authorized user", def: "Someone added to another person's credit card. The card's history shows on their report.", example: "Being an authorized user on Mom's card gave him some history." },
    { term: "secured card", def: "A credit card backed by a deposit you make, made for building credit.", example: "Her $300 deposit became her $300 limit." },
  ],
  irl: {
    checked: "2026-10-25",
    intro: "These are the real weights used by the most common score, and they're the same ones in this game.",
    facts: [
      { stat: "FICO says payment history is about 35 percent of a score, amounts owed 30 percent, length of history 15 percent, new credit 10 percent and credit mix 10 percent.", source: "myFICO, What's in my FICO Scores", year: 2026, url: "https://www.myfico.com/credit-education/whats-in-your-credit-score" },
      { stat: "To get a FICO Score at all, you need at least one account that's been open six months or more and has reported in the past six months. That's why you start with no score.", source: "myFICO, minimum requirements for a FICO Score", year: 2026, url: "https://www.myfico.com/credit-education/faq/scores/fico-score-requirements" },
      { stat: "The CFPB found that the share of adults with a scored credit record grew between 2010 and 2020, and that its old count of people with no credit record at all should be cut roughly in half.", source: "Consumer Financial Protection Bureau, credit invisibles update", year: 2025, url: "https://www.consumerfinance.gov/data-research/research-reports/technical-correction-and-update-to-the-cfpbs-credit-invisibles-estimate/" },
    ],
  },
};
