// Achievements, XP and ranks (SPEC §16). Each check reads a "facts" object
// built by js/progress.js from the life, the play state and the creature.
// Hidden achievements show as ??? until earned.
// Plain language for a 15-year-old. No em-dashes, no semicolons.

import { CONFIG } from "./config.js";

export const CATEGORIES = {
  payment: "Payment habits",
  owed: "Utilization",
  building: "Building credit",
  debt: "Debt",
  smart: "Smart choices",
  learning: "Learning",
  minigames: "Minigames",
  creature: "Creature",
  persistence: "Persistence",
  social: "Friends",
};

const chose = (f, id, keys) => f.decisions.some((d) => d.id === id && keys.includes(d.choice));

export const ACHIEVEMENTS = [
  // Payment habits
  { id: "firstOnTime", cat: "payment", icon: "✅", title: "First On-Time Payment", how: "Get your first on-time mark on your own account.", xp: 25, check: (f) => f.ownOnTimeMonths >= 1 },
  { id: "halfYear", cat: "payment", icon: "🗓️", title: "Half a Year Strong", how: "6 months in a row with every account on time.", xp: 50, check: (f) => f.longestOnTime >= 6 },
  { id: "perfectPayer", cat: "payment", icon: "🏅", title: "Perfect Payer", how: "12 months in a row with every account on time.", xp: 100, check: (f) => f.longestOnTime >= 12 },
  { id: "noLateChapter", cat: "payment", icon: "🛡️", title: "Never Paid a Late Fee", how: "Finish a chapter with no fees and no late marks, while you have a card or loan.", xp: 50, check: (f) => f.summaries.some((s) => s.fees === 0 && s.lates === 0 && s.hadCredit) },
  { id: "autopay", cat: "payment", icon: "🔁", title: "Set It and Forget It", how: "Turn on AutoPay for a card.", xp: 20, check: (f) => f.life.accounts.some((a) => a.autopay) },

  // Utilization
  { id: "under30", cat: "owed", icon: "📉", title: "Under 30 Club", how: "End a month with a card and utilization at 30% or less.", xp: 25, check: (f) => f.monthUtils.some((u) => u != null && u <= 0.3) },
  { id: "utilNinja", cat: "owed", icon: "🥷", title: "Utilization Ninja", how: "Keep utilization under 10% for a whole chapter.", xp: 75, check: (f) => f.summaries.some((s) => s.maxUtil != null && s.maxUtil < 0.1) },
  { id: "cleanSlate", cat: "owed", icon: "🧽", title: "Clean Slate", how: "Pay a statement in full.", xp: 20, check: (f) => f.stats.paidInFull >= 1 },
  { id: "paidInFull5", cat: "owed", icon: "💯", title: "Paid in Full x5", how: "Pay a statement in full 5 times.", xp: 60, check: (f) => f.stats.paidInFull >= 5 },

  // Building credit
  { id: "firstCard", cat: "building", icon: "💳", title: "First Card", how: "Open a credit card of your own.", xp: 30, check: (f) => f.life.accounts.some((a) => a.type === "card" && a.owner === "self") },
  { id: "thinToThick", cat: "building", icon: "🌱", title: "Thin to Thick", how: "Earn your first credit score.", xp: 50, check: (f) => f.bestScore != null },
  { id: "score700", cat: "building", icon: "⭐", title: "Score 700", how: "Reach a score of 700.", xp: 75, check: (f) => f.bestScore >= 700 },
  { id: "score750", cat: "building", icon: "🌟", title: "Score 750", how: "Reach a score of 750.", xp: 100, check: (f) => f.bestScore >= 750 },
  { id: "score800", cat: "building", icon: "💫", title: "Score 800", how: "Reach a score of 800.", xp: 150, check: (f) => f.bestScore >= 800 },
  { id: "mixMaster", cat: "building", icon: "🧩", title: "Credit Mix Master", how: "Have a card and a loan on your report at the same time.", xp: 50, check: (f) => f.hasRevolving && f.hasInstallment },
  { id: "graduated", cat: "building", icon: "🎓", title: "Graduated", how: "Upgrade a secured card to a regular card.", xp: 50, check: (f) => f.life.log.some((e) => e.action === "upgradeSecured") },
  { id: "builderDone", cat: "building", icon: "🧱", title: "Builder Finished", how: "Pay off a credit-builder loan.", xp: 75, check: (f) => f.life.accounts.some((a) => a.type === "creditBuilderLoan" && a.status === "paid") },

  // Debt
  { id: "debtFree", cat: "debt", icon: "🕊️", title: "Debt Free", how: "End a month owing $0 after having had debt.", xp: 50, check: (f) => f.hadDebt && f.debtNow === 0 },
  { id: "payoffSprint", cat: "debt", icon: "🏃", title: "Payoff Sprint", how: "Pay off a card balance of $100 or more in one go.", xp: 40, hidden: true, check: (f) => f.stats.payoffSprints >= 1 },
  { id: "cleanRecord", cat: "debt", icon: "📜", title: "Clean Record", how: "Reach Chapter 5 with nothing ever in collections.", xp: 75, check: (f) => f.play.chapter >= 5 && !f.life.accounts.some((a) => ["collections", "collectionPaid"].includes(a.status)) },

  // Smart choices
  { id: "noStoreCard", cat: "smart", icon: "🙅", title: "Said No to the Store Card", how: "Turn down a store card offer.", xp: 30, check: (f) => chose(f, "storeCard", ["pay", "skip"]) || chose(f, "threeCards", ["none"]) },
  { id: "paydaySurvivor", cat: "smart", icon: "🛟", title: "Payday Survivor", how: "Find a better way than a payday loan.", xp: 40, check: (f) => chose(f, "paydayLoan", ["creditUnion", "savings", "cutBack"]) },
  { id: "identityGuard", cat: "smart", icon: "🔐", title: "Identity Guard", how: "Freeze your credit when something looks wrong.", xp: 40, hidden: true, check: (f) => chose(f, "identityAlert", ["freeze"]) },
  { id: "reportDetective", cat: "smart", icon: "🔍", title: "Report Detective", how: "Check your own credit report.", xp: 30, check: (f) => chose(f, "checkReport", ["check"]) },
  { id: "kindCareful", cat: "smart", icon: "🤝", title: "Kind but Careful", how: "Say no to cosigning.", xp: 30, check: (f) => chose(f, "cosignPhone", ["no"]) },
  { id: "smartCommuter", cat: "smart", icon: "🚌", title: "Smart Commuter", how: "Skip the dealer's expensive financing.", xp: 30, check: (f) => chose(f, "carDecision", ["bus", "creditUnion"]) },
  { id: "onePlan", cat: "smart", icon: "🧾", title: "One Plan at a Time", how: "Don't stack buy now, pay later plans.", xp: 30, check: (f) => chose(f, "bnplStack", ["one", "debit", "none"]) },
  { id: "keepItOpen", cat: "smart", icon: "🗝️", title: "Keep It Open", how: "Keep your oldest card open.", xp: 30, hidden: true, check: (f) => chose(f, "closeOldest", ["keep"]) },
  { id: "rainyDay", cat: "smart", icon: "☔", title: "Rainy Day Fund", how: "Save $300.", xp: 40, check: (f) => f.life.savings >= 300 },
  { id: "treasureChest", cat: "smart", icon: "💰", title: "Treasure Chest", how: "Save $1,000.", xp: 75, check: (f) => f.life.savings >= 1000 },

  // Learning
  { id: "deskDuty", cat: "learning", icon: "🧮", title: "Desk Duty", how: "Finish a Practice Desk visit.", xp: 20, check: (f) => f.desk.finished >= 1 },
  { id: "perfectPractice", cat: "learning", icon: "🎯", title: "Perfect Practice", how: "Get 5 of 5 at the Practice Desk.", xp: 50, check: (f) => f.desk.perfect >= 1 },
  { id: "practiceStreak", cat: "learning", icon: "🔥", title: "Practice Streak", how: "Get 4 or more right on 3 Practice Desk visits in a row.", xp: 60, check: (f) => f.desk.bestStreak >= 3 },
  { id: "factorPro", cat: "learning", icon: "🧠", title: "Factor Pro", how: "Answer 10 Factor Checks right.", xp: 50, check: (f) => (f.desk.byType.factorCheck?.right || 0) >= 10 },
  { id: "wellRounded", cat: "learning", icon: "🌐", title: "Well Rounded", how: "Get 3 right in each of Standards 1, 2 and 3.", xp: 75, check: (f) => ["1", "2", "3"].every((s) => (f.desk.byStandard[s]?.right || 0) >= 3) },
  { id: "sparkleMax", cat: "learning", icon: "✨", title: "Sparkle Collector", how: "Earn every Sparkle Point in one chapter.", xp: 50, hidden: true, check: (f) => Object.values(f.play.sparkle.byChapter).some((n) => n >= f.sparkleCap) },

  // Minigames
  { id: "clockedIn", cat: "minigames", icon: "⏱️", title: "Clocked In", how: "Work your first shift.", xp: 10, check: (f) => f.stats.shifts >= 1 },
  { id: "workhorse", cat: "minigames", icon: "🐴", title: "Workhorse", how: "Work 25 shifts.", xp: 60, check: (f) => f.stats.shifts >= 25 },
  { id: "ledgerLegend", cat: "minigames", icon: "📒", title: "Ledger Legend", how: "Sort 12 items right in one Ledger Sort shift.", xp: 50, check: (f) => (f.jobs.ledger?.best || 0) >= 12 },
  { id: "cashMaster", cat: "minigames", icon: "🪙", title: "Cash Master", how: "Make exact change 6 times in one Cashier Rush shift.", xp: 50, check: (f) => (f.jobs.cashier?.best || 0) >= 6 },
  { id: "perfectCheck", cat: "minigames", icon: "✍️", title: "Perfect Check", how: "Fill in every part of a check correctly.", xp: 50, check: (f) => (f.jobs.checks?.best || 0) >= 6 },
  { id: "allJobs", cat: "minigames", icon: "🧰", title: "Jack of All Trades", how: "Work every job at least once.", xp: 40, check: (f) => ["ledger", "cashier", "checks"].every((j) => f.jobs[j]?.shifts > 0) },

  // Creature
  { id: "named", cat: "creature", icon: "🏷️", title: "Named Your Creature", how: "Give your creature a name.", xp: 10, check: (f) => Boolean(f.creature?.name) },
  { id: "fullName", cat: "creature", icon: "📛", title: "Full Name", how: "Give your creature a last name.", xp: 10, hidden: true, check: (f) => Boolean(f.creature?.lastName) },
  { id: "fullyDressed", cat: "creature", icon: "👗", title: "Fully Dressed", how: "Wear something on the head, neck and face.", xp: 25, check: (f) => ["head", "neck", "face"].every((s) => f.creature?.accessories?.[s] && f.creature.accessories[s] !== "none") },
  { id: "firstPurchase", cat: "creature", icon: "🛍️", title: "First Purchase", how: "Buy something in the shop.", xp: 15, check: (f) => f.play.owned.length >= 1 },
  { id: "decorator", cat: "creature", icon: "🖼️", title: "Room Decorator", how: "Own 3 backgrounds.", xp: 50, hidden: true, check: (f) => f.ownedBackgrounds >= 3 },

  // Persistence
  { id: "chapterDone", cat: "persistence", icon: "📖", title: "Chapter Complete", how: "Finish a chapter after Chapter 1.", xp: 50, check: (f) => f.play.history.length >= 1 },
  { id: "seasoned", cat: "persistence", icon: "📚", title: "Seasoned", how: "Finish 3 chapters after Chapter 1.", xp: 100, check: (f) => f.play.history.length >= 3 },
  { id: "veteran", cat: "persistence", icon: "🏛️", title: "Veteran", how: "Finish 6 chapters after Chapter 1.", xp: 150, check: (f) => f.play.history.length >= 6 },
  { id: "friendly", cat: "social", icon: "🤝", title: "Friendly", how: "Make your first friend.", xp: 20, check: (f) => f.play.social.friends >= 1 },
  { id: "generous", cat: "social", icon: "🎁", title: "Generous", how: "Send a gift to a friend.", xp: 30, check: (f) => f.play.social.giftsSent >= 1 },
  { id: "squad", cat: "social", icon: "🛡️", title: "Squad Goals", how: "Join or start a friend group.", xp: 20, check: (f) => f.play.social.groupJoined },
  { id: "deepThinker", cat: "persistence", icon: "💭", title: "Deep Thinker", how: "Write 3 chapter reflections.", xp: 50, check: (f) => f.play.history.filter((h) => h.reflection).length >= 3 },
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

// XP for things that aren't achievements, tuned in js/data/config.js.
export const XP = CONFIG.pacing.xp;

// Kingdom ranks by XP (SPEC §16).
export const RANKS = [
  { xp: 0, title: "Apprentice", icon: "🪶" },
  { xp: 100, title: "Squire", icon: "🛡️" },
  { xp: 300, title: "Knight", icon: "⚔️" },
  { xp: 600, title: "Baron", icon: "🏰" },
  { xp: 1000, title: "Treasurer", icon: "💰" },
  { xp: 1600, title: "Royal Advisor", icon: "📜" },
  { xp: 2400, title: "Grand Vizier", icon: "👑" },
];
