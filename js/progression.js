// What's unlocked so far (Phase 10, docs/PROGRESSION.md). Accounts and places
// phase in one chapter at a time, so the game starts very simple. Every screen
// asks hasFeature() instead of guessing. Pure, so it runs in Node tests.
import { CONFIG } from "./data/config.js";
import { addBill, moveToSavings, timeSkip } from "./engine/index.js";

export const PROGRESSION_VERSION = 2;

// at: the stage it unlocks in. 0 is the prologue, then chapter numbers.
export const FEATURES = {
  piggy: { at: 0 },
  cottage: { at: 0 },
  guild: { at: 0 },
  market: { at: 0 },
  cashier: { at: 0 },
  // GAME-SPECS.md games, opened by chapter topic (teacher decision 2026-10-25).
  billdrop: { at: 0 },
  payin4: { at: 3 },
  scorechase: { at: 4 },
  phish: { at: 1 },
  grind: { at: 1 },
  checking: { at: 1 },
  savings: { at: 1 },
  debit: { at: 1 },
  bills: { at: 1 },
  vault: { at: 1 },
  townhall: { at: 1 },
  plaza: { at: 1 },
  academy: { at: 1 },
  inbox: { at: 1 },
  checks: { at: 1 },
  // Five more Arcade jobs, all in Chapter 1 (teacher request 2026-10-22).
  overdraft: { at: 1 },
  register: { at: 1 },
  checkhunt: { at: 1 },
  drawer: { at: 1 },
  unitprice: { at: 1 },
  fees: { at: 1 },
  loans: { at: 2 },
  garage: { at: 2 },
  homeLoan: { at: 2 },
  ledger: { at: 2 },
  card: { at: 3 },
  statements: { at: 3 },
  bnpl: { at: 3 },
  score: { at: 4 },
  report: { at: 4 },
  records: { at: 4 },
  pitfalls: { at: 5 },
};

// Old saves (before Phase 10) keep everything unlocked.
export function isLegacy(play) {
  return !play || play.progression !== PROGRESSION_VERSION;
}

// 0 during the prologue, otherwise the chapter being played or up next.
export function stageOf(play) {
  if (isLegacy(play)) return 99;
  if (!play.prologue?.done) return 0;
  return play.active?.chapter ?? play.chapter;
}

// Owning an account always unlocks its feature, whatever the stage.
function owned(life, feature) {
  if (!life) return false;
  const own = life.accounts.filter((a) => a.owner === "self");
  if (feature === "card" || feature === "statements") return own.some((a) => a.kind === "revolving");
  if (feature === "loans") return own.some((a) => a.kind === "installment");
  if (feature === "bnpl") return own.some((a) => a.kind === "bnpl");
  return false;
}

export function hasFeature(play, feature, life = null) {
  const f = FEATURES[feature];
  if (!f) return true;
  return stageOf(play) >= f.at || owned(life, feature);
}

export function unlockStage(feature) {
  return FEATURES[feature]?.at ?? 0;
}

// Words for a locked thing: "Opens in Chapter 2".
export function opensText(feature) {
  const at = unlockStage(feature);
  return at === 0 ? "Open now" : `Opens in Chapter ${at}`;
}

// The money chips a student can read yet. Piggy bank alone in the prologue.
export function moneyChipKeys(play, life) {
  if (stageOf(play) === 0) return ["piggy"];
  return ["checking", "savings", hasFeature(play, "score", life) && "score", hasFeature(play, "card", life) && "util", hasFeature(play, "loans", life) && "owed"].filter(Boolean);
}

// How a student can pay right now ("Pay with" picker and the shop).
export function payMethods(play, life) {
  return ["debit", hasFeature(play, "card", life) && "card", hasFeature(play, "bnpl", life) && "bnpl"].filter(Boolean);
}

// Every Arcade cabinet in the order the hall shows them.
export const ARCADE_ORDER = ["cashier", "checks", "billdrop", "phish", "grind", "payin4", "scorechase", "overdraft", "register", "checkhunt", "drawer", "unitprice", "fees", "ledger"];

// The jobs at the Arcade so far.
export function openJobs(play) {
  if (play.prologue && !play.prologue.done) return PROLOGUE_JOBS;
  return ARCADE_ORDER.filter((j) => hasFeature(play, j));
}

// One celebration per stage, shown when the stage starts.
export const UNLOCKS = {
  1: {
    icon: "🏦",
    title: "Your first bank account",
    text: "The Vault opened a checking account and a savings account for you, with a debit card. Town Hall, Friendship Plaza and the Academy are open too, and the Arcade has a new job: Check Writer.",
    lesson: "checking",
  },
  2: {
    icon: "🚗",
    title: "Loans are here",
    text: "You're 18! Now you can borrow money and pay it back over time with an installment loan. The Garage is open, and your Cottage can be fixed up. The Arcade has a new job: Ledger Sort.",
    lesson: "loans",
  },
  3: {
    icon: "💳",
    title: "Credit cards",
    text: "You can now carry a credit card. Statements, card AutoPay and buy now, pay later are open at the Vault and the Market.",
    lesson: "card",
  },
  4: {
    icon: "📜",
    title: "Your credit score",
    text: "Your credit score is open in the Vault, under Build Credit. It shows your credit report and your credit score. From now on, offers depend on your score.",
    lesson: "score",
  },
  5: {
    icon: "⚠️",
    title: "Bigger decisions",
    text: "Coinhaven gets trickier. Watch for quick-cash offers, deals that hide their cost, and friends who need a cosigner.",
    lesson: "pitfalls",
  },
};

// Stages unlocked but not yet celebrated. Marks them seen.
export function newUnlocks(play) {
  if (isLegacy(play)) return [];
  play.unlocksSeen ??= [];
  const stage = stageOf(play);
  const fresh = Object.keys(UNLOCKS)
    .map(Number)
    .filter((n) => n <= stage && !play.unlocksSeen.includes(n));
  play.unlocksSeen.push(...fresh);
  return fresh.map((n) => ({ stage: n, ...UNLOCKS[n] }));
}

// ---------- The prologue ----------

// Each step is done when its check passes. The coach panel shows the first
// step that isn't done yet. 0 is the welcome on the hub.
export const PROLOGUE_STEPS = [
  { id: "welcome", place: "hub", check: (s) => s.welcomed },
  { id: "firstShift", place: "guild", check: (s) => s.shifts >= 1 },
  { id: "moreShifts", place: "guild", check: (s) => s.shifts >= 3 },
  { id: "market", place: "market", check: (s) => s.marketVisited },
  { id: "cottage", place: "cottage", check: (s) => s.cottageVisited },
  { id: "bank", place: "vault", check: (s) => s.bankOpened },
];

// The three shifts of the prologue, one of each, in any order.
// Bill Drop on Easy replaced Spot the Overdraft (teacher decision 2026-10-25).
export const PROLOGUE_JOBS = ["cashier", "checks", "billdrop"];

export function newPrologue() {
  return { done: false, welcomed: false, shifts: 0, worked: [], marketVisited: false, cottageVisited: false, bankOpened: false };
}

export function prologueStep(play) {
  const s = play.prologue;
  if (!s || s.done) return null;
  return PROLOGUE_STEPS.find((st) => !st.check(s)) || null;
}

// Opening the bank account ends the prologue: the piggy bank becomes checking
// (it already lives in life.checking), a little goes to savings, the phone
// bill starts and Chapter 1 begins.
export function openBankAccount(play, life, { toSavings = 0 } = {}) {
  let next = life;
  const save = Math.max(0, Math.min(toSavings, life.checking));
  if (save > 0) next = moveToSavings(next, save).life;
  next = addBill(next, "Phone", CONFIG.bills.teenPhone).life;
  Object.assign(play.prologue, { bankOpened: true, done: true });
  play.chapter = 1;
  return { life: next, ok: true };
}

// Things that happen between chapters. After Chapter 1, time jumps to age 18.
export function afterChapter(play, life, finished) {
  if (isLegacy(play)) return { life, skipped: null };
  if (finished === 1 && life.ageMonths < CONFIG.onboarding.cardAgeMonths) {
    const r = timeSkip(life, CONFIG.onboarding.cardAgeMonths - life.ageMonths);
    let next = r.life;
    next = addBill(next, "Bus pass", CONFIG.bills.busPass).life;
    return { life: next, skipped: r };
  }
  return { life, skipped: null };
}
