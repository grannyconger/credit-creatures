// Lessons from Sage (Phase 10, docs/PROGRESSION.md). Each one is a short walk
// through the real screens, run by js/ui/guide.js. Prologue lessons play the
// first time a student visits a place. Unlock lessons play when a chapter
// unlocks something new. The Academy can replay any lesson already unlocked.
// step: { route, target, click, fallback, big, title, text, quiz }
//   target: CSS selector(s), the first one on screen wins. { sel, text }
//   matches text too. click: a tab to open first (tabs only, never anything
//   that changes the game). big: a large emoji for a celebration step.
// Plain language for a 15-year-old. No em-dashes, no semicolons.

export const GUIDE = {
  name: "Sage",
  role: "Royal Treasurer of Coinhaven",
  look: { species: "crystalOwl", palette: "royal", eyes: "sparkle", accessories: { face: "glasses", head: "wizardHat" } },
};

const tab = (text, sel = ".acct-tabs button") => ({ sel, text });
const sub = (text) => tab(text, ".acct-subtabs button");

// feature: what has to be unlocked to replay it (js/progression.js).
export const LESSONS = {
  welcome: {
    title: "Welcome to Coinhaven",
    feature: "piggy",
    steps: [
      { route: "hub", big: "🏰", title: "Welcome to Coinhaven, Guardian!", text: ["I'm Sage, the Royal Treasurer. Your creature is 16 and has no money of its own yet. Let's change that.", "I'll show you one thing at a time. The kingdom grows as you learn."] },
      { route: "hub", target: ".money-chips", title: "Your piggy bank", text: ["Right now your only account is a piggy bank. Coins you earn go in here.", "It's simple, but it can't do much. It can't pay bills, and lost coins are gone for good."] },
      { route: "hub", target: "#topnav", title: "Find your way", text: ["Home, the Map, your Wallet and the Leaderboard are always up here. Your chapter's progress sits next to them."] },
      { route: "map", target: ".kingdom", title: "A kingdom that grows", text: ["More places appear on the map as you learn. Three are open now: your Cottage, the Arcade and the Market."] },
      { route: "map", target: ['.place[data-place="guild"]', '.place-row[data-place="guild"]'], title: "Start at the Arcade", text: ["Jobs pay coins. Your first job is Cashier Rush: count back the right change. Tap the Arcade when you're ready."] },
    ],
  },
  guild: {
    title: "Working a shift",
    feature: "guild",
    steps: [
      { route: "guild", target: [".job-board", ".place-header"], title: "Pick a job", text: ["Each job is a short game. The more you get right, the more you earn.", "While you learn, turn on No timer. Your pay goes straight into your piggy bank."] },
    ],
  },
  market: {
    title: "Spend or save?",
    feature: "market",
    steps: [
      {
        route: "shop",
        target: [".shop-grid", ".place-header"],
        title: "Wants cost money",
        text: ["The Market sells things for your creature. Spending is fun, but coins you spend are gone.", "Your creature's dream needs savings. Every purchase is a choice between now and later."],
        quiz: { q: "You have $60 and want a $45 hat. Your dream fund needs $50 more. What's the smartest move?", choices: ["Buy the hat now", "Save first, buy the hat later", "Borrow $45 from a friend"], answer: 1, why: "Save first. You can still get the hat later, and your dream won't wait." },
      },
    ],
  },
  cottage: {
    title: "Your Cottage",
    feature: "cottage",
    steps: [
      { route: "cottage", target: ".cottage-stage", title: "Home sweet home", text: ["This is your creature's Cottage. Customize it here with looks you unlock."] },
      { route: "cottage", target: ".dream-card", title: "The dream's first steps", text: ["Your dream's first stage needs savings and some work. A piggy bank holds coins, but a bank can do a lot more.", "When you're ready, take your coins to the Vault."] },
    ],
  },
  checking: {
    title: "Your first bank account",
    feature: "checking",
    steps: [
      { route: "hub", big: "🏦", title: "You opened a bank account!", text: ["Chapter 1 begins. Your coins are safe at the Vault now, and you have a debit card.", "Four new places opened: the Vault, Town Hall, Friendship Plaza and the Academy."] },
      { route: "hub", target: ".money-chips", title: "Checking and savings", text: ["Checking is for spending. Your debit card takes money straight from it.", "Savings is for later. Move money there so it's not so easy to spend."] },
      { route: "accounts", click: tab("Pay Bills"), target: [".bills", ".acct-body"], title: "Bills come out of checking", text: ["Your phone bill comes out of checking on its own at End Month. If checking is short, the bank charges a $35 overdraft fee.", "You can move money between checking and savings here any time."] },
      {
        route: "map",
        target: ['.place[data-place="townhall"]', '.place-row[data-place="townhall"]'],
        title: "Town Hall is open",
        text: ["Each month, Town Hall brings a news card and a few money decisions. Then you end the month and your bills come out.", "Chapter 1 starts there. You can still work shifts at the Arcade, and there's a new job: Check Writer."],
        quiz: { q: "Your debit card spends money from which account?", choices: ["Checking", "Savings", "The bank's own money"], answer: 0, why: "A debit card spends your own money from checking. That's why you can't spend more than you have." },
      },
    ],
  },
  townhall: {
    title: "Your first month at Town Hall",
    feature: "townhall",
    steps: [
      { route: "month", target: [".quest-board", ".place-header"], title: "This month's quests", text: ["Each month has a news card about your creature's life and a few money decisions. Do them in order. Each one gets a Done stamp."] },
      { route: "month", target: [".decision-card", ".month-main"], title: "Read, then choose", text: ["Read the card and pick what you'd really do. Some choices cost money, and then you pick how to pay.", "After you choose, the card flips to show what happened and which part of your money it changed."] },
      { route: "month", target: [".quest-board li:last-child", ".quest-board"], title: "End Month", text: ["When every card is done, end the month. Bills come out of checking, and you see what changed.", "Before you do, work your shifts at the Arcade and check that checking can cover your bills."] },
    ],
  },
  academy: {
    title: "The Academy",
    feature: "academy",
    steps: [
      { route: "academy", target: [".academy-rank", ".place-header"], title: "Learn and level up", text: ["Practice Desk questions earn XP and Sparkle Points. XP raises your rank, from Apprentice to Grand Vizier, and unlocks new looks."] },
      { route: "academy", target: [".lesson-shelf", ".place-header"], title: "Your lesson shelf", text: ["Every lesson from me lands here. Replay any of them whenever you need a reminder."] },
    ],
  },
  plaza: {
    title: "Friendship Plaza",
    feature: "plaza",
    steps: [
      { route: "friends", target: [".acct-tabs", ".place-header"], title: "Friends and gifts", text: ["Add classmates as friends, start or join a group, and send up to 4 gifts of money or items every 20 hours.", "Everyone sees your creature with your name, so they know who sent what. Nobody sees your money or your score."] },
    ],
  },
  loans: {
    title: "Loans",
    feature: "loans",
    steps: [
      { route: "hub", big: "🚗", title: "You're 18! Loans are here.", text: ["Time flew by. Now you can borrow money with an installment loan: you get it all now and pay it back in equal monthly payments, plus interest.", "Lenders report every payment to the Hall of Records. On-time payments start your credit history."] },
      { route: "map", target: ['.place[data-place="garage"]', '.place-row[data-place="garage"]'], title: "The Garage is open", text: ["Buy a ride with cash or an auto loan. A ride gets you to better jobs, so every shift pays more."] },
      {
        route: "garage",
        target: [".lesson-box", ".place-header"],
        title: "Three numbers to check",
        text: ["Every loan shows its APR, its term and its total cost. Try different terms and watch the numbers change before you decide.", "You can also fix up your Cottage with cash or a home improvement loan."],
        quiz: { q: "A longer loan term means...", choices: ["Smaller payments and less interest", "Smaller payments but more interest in the end", "Bigger payments and more interest"], answer: 1, why: "Spreading a loan over more months makes each payment smaller, but you pay interest for longer, so the total is higher." },
      },
    ],
  },
  card: {
    title: "Credit cards",
    feature: "card",
    steps: [
      { route: "hub", big: "💳", title: "Credit cards are here", text: ["A credit card lets you borrow up to a limit, again and again. You don't pay for each purchase right away. You get a bill called a statement each month."] },
      {
        route: "accounts",
        click: [tab("Build Credit"), sub("Statements")],
        target: [".acct-body"],
        title: "Statements",
        text: ["Your statement lists what you bought, what you paid and what you owe. Pay the whole statement balance and there's no interest.", "Card utilization is how much of your limit you're using. Under 30% is good. Under 10% is great."],
        quiz: { q: "How do you avoid interest on a credit card?", choices: ["Pay the minimum", "Pay the full statement balance by the due date", "Use the card less often"], answer: 1, why: "Pay the full statement balance and the bank charges no interest. The minimum keeps you on time, but interest is added." },
      },
      { route: "accounts", click: [tab("Build Credit"), sub("Cards")], target: [".apply-card", ".acct-body"], title: "Apply for your first card", text: ["Start here. You'll learn who's behind a card, design your own and apply. The Vault tells you exactly why it says yes or no.", "Tip: cards made for beginners, like a secured card, are the easiest to get."] },
    ],
  },
  score: {
    title: "Your credit score",
    feature: "score",
    steps: [
      { route: "hub", big: "📜", title: "Your credit score arrives", text: ["Lenders reported your loan and card payments every month. The credit bureau turned that history into a credit score, from 300 to 850."] },
      {
        route: "accounts",
        click: [tab("Build Credit"), sub("My Score")],
        target: [".acct-body"],
        title: "The 5 parts of your score",
        text: ["Payment history, amounts owed, length of history, credit mix and new credit. Open any part to see what moves it.", "From now on, offers and loan rates depend on your score."],
        quiz: { q: "Which part counts the most?", choices: ["Credit mix", "Payment history", "New credit"], answer: 1, why: "Payment history is 35% of your score. Paying on time, every time, matters most." },
      },
      { route: "accounts", click: [tab("Build Credit"), sub("My Report")], target: [".acct-body"], title: "Your credit report", text: ["Your report is what lenders see: every account, every late mark and every application. Check it for mistakes."] },
    ],
  },
  pitfalls: {
    title: "Watch out for traps",
    feature: "pitfalls",
    steps: [
      {
        route: "hub",
        big: "⚠️",
        title: "Watch out for traps",
        text: ["Coinhaven gets trickier now. Some offers look like help but cost a fortune: payday loans, title loans, rent-to-own and debt settlement ads.", "The trick is to find the total cost before you say yes."],
        quiz: { q: "A $300 payday loan costs $45 for two weeks. About what APR is that?", choices: ["15%", "45%", "Almost 400%"], answer: 2, why: "$45 on $300 is 15% for just two weeks. Over a whole year, that's about 390% APR. A credit card is closer to 25%." },
      },
      { route: "map", target: ['.place[data-place="townhall"]', '.place-row[data-place="townhall"]'], title: "Offers show up at Town Hall", text: ["When money is tight, these offers appear on your cards. A small emergency fund in savings is the best protection.", "If something sounds too easy, it usually costs too much."] },
      { route: "map", target: ['.place[data-place="alley"]', '.place-row[data-place="alley"]'], title: "Lantern Alley is open", text: ["A side street full of bright signs. Practice spotting traps there before one shows up for real."] },
    ],
  },
  alley: {
    title: "Read the fine print",
    feature: "pitfalls",
    steps: [
      { route: "alley", target: [".stall-grid", ".place-header"], title: "Every stall has a pitch", text: ["The big sign tells you the good part. The fine print tells you the cost.", "Open each offer, read the fine print, then decide: trap or fair deal?"] },
      {
        route: "alley",
        target: [".lesson-box", ".place-header"],
        title: "Not every offer is a trap",
        text: ["Some deals here are honest. A fair deal has a clear APR, a payment you can afford and a set end date.", "A right call earns bonus XP, once per stall."],
        quiz: { q: "Which one is a warning sign?", choices: ["A clear APR on the first page", "\"Stop paying your bills and pay us instead\"", "A loan reported to the credit bureaus"], answer: 1, why: "Nobody honest tells you to stop paying your bills. Missed payments hurt the biggest part of your score." },
      },
    ],
  },
};

export const LESSON_ORDER = ["welcome", "guild", "market", "cottage", "checking", "townhall", "academy", "plaza", "loans", "card", "score", "pitfalls", "alley"];
