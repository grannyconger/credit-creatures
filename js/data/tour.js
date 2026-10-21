// The Kingdom Tour (teacher request 2026-10-20): a guided walk through every
// main feature, played on the real screens. js/ui/tour.js runs it.
// step: { route, target, click, fallback, title, text, quiz }
//   route: the screen to open first (stays put when missing)
//   target: CSS selector(s) to spotlight. The first one that's on screen wins.
//     { sel, text } matches an element whose text includes text.
//   click: a tab to open before showing the step ({ sel, text }). Tabs only,
//     never anything that changes the game.
//   fallback: { route, target } when the screen isn't open right now (for
//     example Town Hall between chapters).
//   quiz: { q, choices, answer, why } must be answered right to go on.
// Plain language for a 15-year-old. No em-dashes, no semicolons.

export const GUIDE = {
  name: "Sage",
  role: "Royal Treasurer of Coinhaven",
  look: { species: "crystalOwl", palette: "royal", eyes: "sparkle", accessories: { face: "glasses", head: "wizardHat" } },
};

const TOWN_HALL_ON_MAP = { route: "hub", target: ['.place[data-place="townhall"]', '.place-row[data-place="townhall"]'] };
const tab = (text, sel = ".acct-tabs button") => ({ sel, text });

export const TOUR_STEPS = [
  // ---------- The hub ----------
  {
    route: "hub",
    title: "Welcome to the Kingdom Tour!",
    text: ["Hi, I'm Sage, the Royal Treasurer of Coinhaven. I'll show you every part of the kingdom and how the game works.", "It takes about 5 minutes. Nothing on this tour changes your game."],
  },
  { route: "hub", target: ".guardian", title: "You are the Guardian of Coin", text: ["This is your creature. It can't manage money alone, so every money choice is yours.", "Your choices change its life, its credit score and whether its dream comes true."] },
  { route: "hub", target: [".guardian .meters", ".guardian"], title: "Your creature's dream", text: ["Every dream has 3 stages. Each stage has goals, like saving money, raising your score and paying on time.", "This bar shows how close you are. Finish all 3 stages to make the dream come true."] },
  { route: "hub", target: ".chapter-box", title: "Chapters and your next step", text: ["The game moves in chapters. Your teacher opens each one, so the class stays together.", "This box always tells you what to do next. When you're not sure, look here."] },
  { route: "hub", target: ".money-chips li:nth-child(1)", title: "Checking", text: ["Checking is your spending money. Your pay goes in and your bills come out.", "If checking drops below zero, the bank charges an overdraft fee. Keep a little extra in here."] },
  { route: "hub", target: ".money-chips li:nth-child(2)", title: "Savings", text: ["Savings is money you set aside for later. It's safe from everyday spending.", "It pays for emergencies and for your creature's dream."] },
  { route: "hub", target: ".money-chips li:nth-child(3)", title: "Your credit score", text: ["A credit score goes from 300 to 850. Lenders use it to decide whether to say yes, and how much interest to charge.", "You don't have one until you've had credit for a few months."] },
  {
    route: "hub",
    target: [".money-chips li:nth-child(4)", ".money-chips"],
    title: "Utilization and what you owe",
    text: ["Card utilization is how much of your card limit you're using. Under 30% is good. Under 10% is great.", "You owe adds up all your debt: cards, loans and buy now, pay later plans."],
    quiz: { q: "Your card limit is $500 and you owe $250 on it. What's your utilization?", choices: ["25%", "50%", "75%"], answer: 1, why: "$250 is half of $500, so you're using 50%. That's high. Under 30% would help your score." },
  },
  { route: "hub", target: ".kingdom", title: "The Kingdom of Coinhaven", text: ["Every building is a place to go. The badges tell you what's waiting there.", "Everything starts here at home and comes back here."] },
  { route: "hub", target: "#who", title: "Your creature, any time", text: ["Tap your creature up here from any screen to visit its Cottage."] },
  { route: "hub", target: "#brand", title: "Back home", text: ["Tap Credit Creatures to come back to the kingdom from anywhere."] },
  { route: "hub", target: "#sign-out", title: "Saving", text: ["Your game saves by itself as you play. You'll see the time it last saved up here.", "When you're done, use Save and sign out, especially on a shared laptop."] },

  // ---------- Town Hall ----------
  { route: "month", target: ".place-header", fallback: TOWN_HALL_ON_MAP, title: "Town Hall: where time passes", text: ["Each month brings a news card about your creature's life and a few decision cards about money.", "Between chapters, Town Hall waits for your teacher to open the next one."] },
  { route: "month", target: ".quest-board", fallback: TOWN_HALL_ON_MAP, title: "The quest board", text: ["The board shows this month's cards. Do them in order. Each one gets a Done stamp.", "The last note is End Month."] },
  {
    route: "month",
    target: [".decision-card", ".end-month"],
    fallback: TOWN_HALL_ON_MAP,
    title: "Choices and how you pay",
    text: ["Some choices cost money. Then you pick how to pay.", "Debit uses money you already have. A credit card borrows money you pay back later. Buy now, pay later splits the cost into payments."],
    quiz: { q: "You buy something with a credit card. When do you pay for it?", choices: ["Never, it's free", "Later, when the bill comes", "It already came out of checking"], answer: 1, why: "A credit card is borrowed money. The bill comes after End Month. Pay it in full and there's no interest." },
  },
  { route: "month", target: [".end-month", ".quest-board"], fallback: TOWN_HALL_ON_MAP, title: "End Month", text: ["When you end the month, statements close, interest and fees are added, automatic payments come out, and lenders report to the credit bureau.", "Then your score updates, and it always tells you why it moved."] },

  // ---------- Guild Hall ----------
  { route: "guild", target: ".place-header", title: "The Guild Hall: earn money", text: ["Pick a job and play a short game. Better work means better pay, and pay grows as you get experience.", "You get a few shifts each month while a chapter is going."] },
  { route: "guild", target: [".job-board", ".callout", ".place-header"], title: "Three jobs", text: ["Ledger Sort: sort things into what you own, what you owe and investments.", "Cashier Rush: count back the right change. Check Writer: write a check and endorse your paycheck."] },

  // ---------- The Gilded Vault ----------
  { route: "accounts", click: tab("Wallet"), target: ".place-header", title: "The Gilded Vault: your bank", text: ["Time stops in the Vault, so take your time.", "This is where you pay bills, move money, check your score and read your letters."] },
  {
    route: "accounts",
    click: tab("Wallet"),
    target: [".bills", ".acct-body"],
    title: "Paying your bills",
    text: ["Each card shows what you owe and when it's due. Paying the full statement means no interest. Paying only the minimum keeps you on time, but interest is added.", "AutoPay pays for you each month. Just keep enough in checking."],
    quiz: { q: "Which payment avoids interest on a credit card?", choices: ["The minimum payment", "The full statement balance", "Skipping a month"], answer: 1, why: "Pay the full statement balance by the due date and the bank charges no interest. Skipping a month adds a late fee and a late mark." },
  },
  { route: "accounts", click: tab("Statements"), target: ".acct-body", title: "Statements", text: ["A statement is one month on a card: purchases, payments, interest, fees and the new balance.", "The stamp sums up the month in two words."] },
  { route: "accounts", click: tab("My Score"), target: ".acct-body", title: "My Score", text: ["Your score is built from 5 parts: payment history, amounts owed, length of history, credit mix and new credit.", "Open any part to see which choices move it up or down."] },
  { route: "accounts", click: tab("My Report"), target: ".acct-body", title: "My Report", text: ["Your credit report is what lenders see: every account, every late mark and every time you applied for credit."] },
  { route: "accounts", click: tab("Inbox"), target: ".acct-body", title: "The Inbox", text: ["Letters from the bank: bills coming due, fees, payments received and score changes. Check it often."] },

  // ---------- Shimmer Market ----------
  { route: "shop", target: [".shop-grid", ".place-header"], title: "Shimmer Market: spend money", text: ["Buy hats, outfits and backgrounds for your creature. New stock comes each chapter.", "Checkout works like real life: debit, credit card or buy now, pay later. Think before you buy."] },

  // ---------- The Academy ----------
  { route: "academy", target: [".academy-rank", ".place-header"], title: "The Academy: learn and earn XP", text: ["Practice Desk questions earn XP and Sparkle Points. XP raises your rank and unlocks new looks for your creature.", "Real math is fine. Grab a calculator if you want one."] },
  { route: "trophies", click: tab("Leaderboard"), target: [".acct-body", ".place-header"], title: "Trophies and the leaderboard", text: ["Earn achievements for smart money habits, climb the ranks from Apprentice to Grand Vizier, and see the class leaderboard.", "The leaderboard ranks by XP, not by who has the most money."] },

  // ---------- Friendship Plaza ----------
  { route: "friends", target: [".acct-tabs", ".place-header"], title: "Friendship Plaza", text: ["Add classmates as friends, start or join a group, and send a gift once every 40 hours.", "Everyone sees your creature with your name, so they know who sent what. Nobody sees your money or score."] },

  // ---------- The Cottage ----------
  { route: "cottage", target: ".cottage-stage", title: "Your Cottage", text: ["Customize your creature here. New bodies, colors and outfits unlock with XP, achievements and the shop."] },
  { route: "cottage", target: ".dream-card", title: "The dream's quest path", text: ["Here are your dream's 3 stages. Meet every goal in a stage, then pay its cost to move on.", "The last stage makes the dream come true."] },
  {
    route: "cottage",
    target: ".settings-card",
    title: "Settings",
    text: ["Dark mode, a dyslexia-friendly font and sound effects. They follow you to any computer."],
    quiz: { q: "Which choice helps your dream AND your credit score?", choices: ["Paying on time every month", "Opening lots of store cards", "Maxing out your credit card"], answer: 0, why: "Paying on time is the biggest part of your score, and on-time streaks are dream goals too." },
  },

  // ---------- Chapters ----------
  { route: "hub", target: [".practice-box", ".chapter-box"], title: "Chapter ends and practice", text: ["When a chapter ends, you see what changed and write a short reflection.", "You can replay old chapters in practice mode to try different choices. Practice never changes your real game."] },
  { route: "hub", title: "You've seen the whole kingdom!", text: ["Three habits make everything easier: pay on time, keep card balances low and save a little every month.", "You can take this tour again any time from the Academy or your Cottage. Good luck, Guardian!"] },
];
