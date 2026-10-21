// Each creature's dream (teacher request 2026-10-20). The student picks one at
// the start. Each dream has 3 stages, done in order. A stage has goals drawn
// from the whole game (savings, score, payment habits, utilization, credit
// mix, work and learning), and some stages cost money to finish, like a real
// application fee or deposit. Plain language for a 15-year-old. No em-dashes,
// no semicolons.
import { amountOwed, utilization, moveToChecking, debitPurchase } from "../engine/index.js";
import { onTimeStreaks, addXp } from "../progress.js";
import { hasFeature, opensText } from "../progression.js";

// Goal types. Each reads the life and the play state and returns
// { value, ok, share, text }. share (0 to 1) fills the progress bar.
const ratio = (v, goal) => Math.max(0, Math.min(1, goal ? v / goal : 1));
const own = (life) => life.accounts.filter((a) => a.owner === "self");
const GOALS = {
  savings: (n) => ({
    icon: "piggy",
    label: `Have $${n.toLocaleString()} in savings`,
    check: (life) => ({ value: life.savings || 0, ok: (life.savings || 0) >= n, share: ratio(life.savings || 0, n), text: `now $${Math.floor(life.savings || 0).toLocaleString()}` }),
  }),
  score: (n) => ({
    icon: "gauge",
    label: `Credit score of ${n} or more`,
    check: (life) => ({ value: life.score, ok: life.score != null && life.score >= n, share: life.score == null ? 0 : ratio(life.score - 300, n - 300), text: life.score == null ? "no score yet" : `now ${life.score}` }),
  }),
  onTime: (n) => ({
    icon: "check",
    label: `${n} months in a row of on-time payments`,
    check: (life) => {
      const s = onTimeStreaks(life).current;
      return { value: s, ok: s >= n, share: ratio(s, n), text: `now ${s}` };
    },
  }),
  utilization: (pct) => ({
    icon: "chart",
    label: `Card utilization under ${pct}%`,
    check: (life) => {
      const u = utilization(life);
      if (u == null) return { value: null, ok: false, share: 0, text: "you need a credit card first" };
      return { value: u, ok: u * 100 < pct, share: u * 100 < pct ? 1 : ratio(pct, u * 100), text: `now ${Math.round(u * 100)}%` };
    },
  }),
  mix: () => ({
    icon: "coins",
    label: "Have a card and a loan (credit mix)",
    check: (life) => {
      const live = own(life).filter((a) => ["open", "paid"].includes(a.status));
      const card = live.some((a) => a.kind === "revolving");
      const loan = live.some((a) => a.kind === "installment");
      return { value: Number(card) + Number(loan), ok: card && loan, share: (Number(card) + Number(loan)) / 2, text: card && loan ? "card and loan" : card ? "card only" : loan ? "loan only" : "neither yet" };
    },
  }),
  debtUnder: (n) => ({
    icon: "receipt",
    label: `Owe less than $${n.toLocaleString()} in total`,
    check: (life) => {
      const debt = own(life).filter((a) => ["open", "collections"].includes(a.status)).reduce((s, a) => s + amountOwed(a), 0);
      return { value: debt, ok: debt < n, share: debt < n ? 1 : ratio(n, debt), text: `now $${Math.round(debt).toLocaleString()}` };
    },
  }),
  fewInquiries: (n) => ({
    icon: "scroll",
    label: `No more than ${n} credit application${n === 1 ? "" : "s"} in the last year`,
    check: (life) => {
      const k = life.inquiries.filter((q) => q.hard !== false && q.month > life.month - 12).length;
      return { value: k, ok: k <= n, share: k <= n ? 1 : ratio(n, k), text: `now ${k}` };
    },
  }),
  noCollections: () => ({
    icon: "alert",
    label: "No accounts in collections",
    check: (life) => {
      const bad = own(life).some((a) => a.status === "collections");
      return { value: bad ? 1 : 0, ok: !bad, share: bad ? 0 : 1, text: bad ? "one is in collections" : "clear" };
    },
  }),
  noLate: () => ({
    icon: "alert",
    label: "No late payments in the last 6 months",
    check: (life) => {
      const late = life.accounts.some((a) => a.owner !== "authorized" && a.history.some((h) => h.month >= life.month - 6 && h.code !== "OK"));
      return { value: late ? 1 : 0, ok: !late, share: late ? 0 : 1, text: late ? "a late mark is still recent" : "clear" };
    },
  }),
  shifts: (n) => ({
    icon: "guild",
    label: `Work ${n} shifts at the Guild Hall`,
    check: (life, play) => {
      const k = play?.stats?.shifts || 0;
      return { value: k, ok: k >= n, share: ratio(k, n), text: `now ${k}` };
    },
  }),
  jobs: (n) => ({
    icon: "guild",
    label: `Try ${n} different jobs`,
    check: (life, play) => {
      const k = Object.keys(play?.jobs || {}).length;
      return { value: k, ok: k >= n, share: ratio(k, n), text: `now ${k}` };
    },
  }),
  desk: (n) => ({
    icon: "academy",
    label: `Finish ${n} Practice Desk session${n === 1 ? "" : "s"} at the Academy`,
    check: (life, play) => {
      const k = play?.desk?.finished || 0;
      return { value: k, ok: k >= n, share: ratio(k, n), text: `now ${k}` };
    },
  }),
  perfectDesk: (n) => ({
    icon: "trophy",
    label: `Get every question right in ${n} Practice Desk session${n === 1 ? "" : "s"}`,
    check: (life, play) => {
      const k = play?.desk?.perfect || 0;
      return { value: k, ok: k >= n, share: ratio(k, n), text: `now ${k}` };
    },
  }),
};

// Goals that need a feature from a later chapter (js/progression.js).
const GOAL_FEATURE = { score: "score", utilization: "card", mix: "card", onTime: "loans", fewInquiries: "loans" };

// stage: { title, story, goals: [[type, arg]], cost, costFor, xp }
export const DREAMS = {
  home: {
    icon: "🏡",
    title: "A home of its own",
    story: "Move out and rent a cozy cottage on Maple Lane.",
    why: "Landlords check your credit and want a deposit. A good score means a yes and a smaller deposit.",
    finish: "You paid the deposit and got the keys. Your creature has a home of its own!",
    stages: [
      { title: "Make a plan", story: "Start a moving fund and learn what renting costs.", goals: [["savings", 300], ["shifts", 6], ["desk", 2]], xp: 30 },
      { title: "Build a renter's record", story: "Landlords look for on-time payments and low card balances.", goals: [["score", 650], ["onTime", 6], ["utilization", 30]], cost: 40, costFor: "the rental application fee", xp: 50 },
      { title: "Get the keys", story: "Pay the deposit and first month's rent, and keep a cushion for emergencies.", goals: [["savings", 1500], ["score", 700], ["noCollections"], ["noLate"], ["debtUnder", 3000]], cost: 1200, costFor: "the deposit and first month's rent", xp: 150 },
    ],
  },
  shop: {
    icon: "🏪",
    title: "Its own shop",
    story: "Open a little shop in the Market Village.",
    why: "Lenders look at your credit before a business loan. Savings show you can handle the start-up costs.",
    finish: "The sign is up and the doors are open. Your creature runs its own shop!",
    stages: [
      { title: "Learn the trade", story: "Work different jobs to learn how a business runs.", goals: [["shifts", 10], ["jobs", 2], ["savings", 250]], xp: 30 },
      { title: "Write a business plan", story: "Show lenders you can handle more than one kind of credit.", goals: [["score", 640], ["mix"], ["desk", 3]], cost: 75, costFor: "a business license", xp: 50 },
      { title: "Open the doors", story: "Buy your first stock and pay the first month's rent on the shop.", goals: [["savings", 1200], ["score", 680], ["utilization", 30], ["noLate"]], cost: 1000, costFor: "first stock and the shop's rent", xp: 150 },
    ],
  },
  adventure: {
    icon: "🗺️",
    title: "A grand adventure",
    story: "Travel to the far islands of the kingdom.",
    why: "Trips cost a lot up front. Paying cash from savings means no debt waiting at home.",
    finish: "Bags packed, tickets paid in full. Your creature sets sail with no debt behind it!",
    stages: [
      { title: "Dream big", story: "Start a travel fund and earn some extra money.", goals: [["savings", 200], ["shifts", 4]], xp: 30 },
      { title: "Get travel-ready", story: "Pay on time and don't open lots of new accounts before a big trip.", goals: [["onTime", 4], ["fewInquiries", 2], ["noCollections"]], cost: 60, costFor: "your travel papers", xp: 50 },
      { title: "Set sail", story: "Buy the tickets with cash, so no debt waits for you at home.", goals: [["savings", 1000], ["score", 650], ["debtUnder", 2000], ["noLate"]], cost: 900, costFor: "the tickets", xp: 150 },
    ],
  },
  scholar: {
    icon: "🎓",
    title: "Scholar of Coinhaven",
    story: "Study at the Royal Academy across the river.",
    why: "Schools and student lenders like a clean record, and savings cover books and fees.",
    finish: "Enrolled and ready. Your creature is off to the Royal Academy!",
    stages: [
      { title: "Study up", story: "Practice at the Academy and start a book fund.", goals: [["desk", 3], ["savings", 150]], xp: 30 },
      { title: "Apply", story: "Schools want a clean record. Work some shifts to pay the fee.", goals: [["score", 620], ["noCollections"], ["shifts", 6]], cost: 35, costFor: "the application fee", xp: 50 },
      { title: "Enroll", story: "Pay for books and fees, and show you've mastered the basics.", goals: [["savings", 800], ["score", 650], ["noLate"], ["perfectDesk", 1]], cost: 700, costFor: "books and fees", xp: 150 },
    ],
  },
};

export const DREAM_STAGES = 3;

// The headline numbers for a dream: the last stage's savings and score goals,
// and the total cost of all its stages.
export function dreamSummary(d) {
  const last = d.stages.at(-1).goals;
  const find = (t) => last.find(([type]) => type === t)?.[1] ?? null;
  return { savings: find("savings"), score: find("score"), cost: d.stages.reduce((s, st) => s + (st.cost || 0), 0) };
}

// Where a dream stands. done: stages already finished (play.dreamStage).
// Returns { dream, stages: [{ ...stage, goals: [{ label, icon, ok, share, text }],
// ready, done, current }], stage (the current one, or null when all done),
// stageIndex, overall (0 to 1 across the whole dream), ready, complete }.
export function dreamProgress(life, dreamId, play = null) {
  const d = DREAMS[dreamId];
  if (!d || !life) return null;
  const done = Math.min(d.stages.length, play?.dreamStage || 0);
  const stages = d.stages.map((st, i) => {
    const goals = st.goals.map(([type, arg]) => {
      const g = GOALS[type](arg);
      // A goal about something not unlocked yet says when it opens (Phase 10).
      const feature = GOAL_FEATURE[type];
      const locked = feature && play && !hasFeature(play, feature, life) ? opensText(feature) : null;
      return { type, label: g.label, icon: g.icon, locked, ...g.check(life, play) };
    });
    const ready = goals.every((g) => g.ok) && (!st.cost || (life.savings || 0) + Math.max(0, life.checking) >= st.cost);
    return { ...st, index: i, goals, ready, done: i < done, current: i === done };
  });
  const cur = stages[done] || null;
  const share = cur ? cur.goals.reduce((s, g) => s + g.share, 0) / cur.goals.length : 1;
  return {
    dream: d,
    stages,
    stage: cur,
    stageIndex: done,
    overall: (done + (cur ? share : 0)) / d.stages.length,
    ready: Boolean(cur?.ready),
    complete: done >= d.stages.length,
  };
}

// Plain words for the money a stage costs, with the cushion it leaves.
export function stageCostText(stage, life) {
  if (!stage.cost) return "";
  const left = (life.savings || 0) - stage.cost;
  return `Costs $${stage.cost.toLocaleString()} for ${stage.costFor}. ${left >= 0 ? `You'd still have $${Math.floor(left).toLocaleString()} in savings for emergencies.` : "Some of it would come out of checking."}`;
}

// Finishes the current stage once it's ready: pays its cost (from savings
// first, then checking, as logged engine actions so replay works), moves to
// the next stage and adds the stage's XP. The last stage makes the dream come
// true (play.dreamDone). Returns { life, ok, message, stage, complete }.
export function finishStage(life, play, dreamId) {
  const prog = dreamProgress(life, dreamId, play);
  if (!prog || prog.complete) return { life, ok: false, message: "There's no stage left to finish." };
  const st = prog.stage;
  if (!st.ready) return { life, ok: false, message: "This stage isn't ready yet." };
  let next = life;
  if (st.cost) {
    const fromSavings = Math.min(next.savings || 0, st.cost);
    if (fromSavings > 0) {
      const r = moveToChecking(next, fromSavings);
      if (!r.ok) return { life, ok: false, message: r.message };
      next = r.life;
    }
    const r = debitPurchase(next, st.cost, `dream: ${prog.dream.title}, ${st.title.toLowerCase()}`);
    if (!r.ok) return { life, ok: false, message: r.message };
    next = r.life;
  }
  play.dreamStage = st.index + 1;
  addXp(play, st.xp);
  const complete = play.dreamStage >= prog.dream.stages.length;
  if (complete) play.dreamDone = { dream: dreamId, month: next.month };
  return { life: next, ok: true, message: complete ? prog.dream.finish : `Stage ${st.index + 1} done: ${st.title}!`, stage: st, complete };
}
