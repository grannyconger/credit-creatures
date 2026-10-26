// Fee Detective's rules (GAME-SPECS.md game 12, upgrade). Pure and seeded.
// Three cases. Case 3 is always Case 1's client a month later: skip the right
// habit in Case 1 and its fee is back.
import { CONFIG } from "../data/config.js";
import { createRng } from "../engine/index.js";
import { FD_CHARGES, FD_DECOYS, FD_STORES, FD_CLIENTS } from "../data/arcade/fees.js";

const C = () => CONFIG.arcade.games.fees;
const r2 = (x) => Math.round(x * 100) / 100;
export const ACTIONS = ["refund", "dispute", "cancel", "accept"];
export const COSTS_CALL = new Set(["refund", "dispute"]);

function feeLine(rng, kind, difficulty, id, { repeat = false, amount = null } = {}) {
  const ch = FD_CHARGES[kind];
  const store = FD_STORES[rng.int(0, FD_STORES.length - 1)];
  const v = difficulty === "easy" ? 0 : difficulty === "hard" ? 2 : rng.int(0, 1);
  const amt = amount ?? r2(rng.int(ch.amount[0] * 100, ch.amount[1] * 100) / 100);
  return { id, fee: true, kind, label: ch.label, text: ch.name[v].replace("{store}", store.toUpperCase()), amount: Math.round(amt), right: ch.right, repeat, waive: rng.next() };
}

function decoyLine(rng, doc, id, used) {
  const pool = FD_DECOYS[doc].filter((d) => !used.has(d[0]));
  const d = pool[rng.int(0, pool.length - 1)];
  used.add(d[0]);
  const amt = d[1][0] === d[1][1] ? d[1][0] : r2(d[1][0] + rng.next() * (d[1][1] - d[1][0]));
  return { id, fee: false, kind: "decoy", text: d[0], amount: amt < 1 ? amt : Math.round(amt * 100) / 100, credit: Boolean(d[2]) };
}

function buildCase(rng, { client, doc, intro }, difficulty, n, { noFee = false, forced = null, avoid = [] } = {}) {
  const c = C();
  const lines = [];
  const used = new Set();
  const kinds = Object.keys(FD_CHARGES).filter((k) => FD_CHARGES[k].docs.includes(doc) && !avoid.includes(k));
  const feeCount = noFee ? 0 : rng.int(c.fees[0], c.fees[1]);
  const pick = [];
  if (forced) pick.push(forced);
  while (pick.length < feeCount && kinds.some((k) => !pick.includes(k))) {
    const k = kinds[rng.int(0, kinds.length - 1)];
    if (!pick.includes(k)) pick.push(k);
  }
  // Leave at least one decoy unused, for the client's callback line.
  const total = Math.min(rng.int(c.lines[0], c.lines[1]), pick.length + FD_DECOYS[doc].length - 1);
  pick.forEach((k, i) => lines.push(feeLine(rng, k, difficulty, `c${n}f${i}`, { repeat: k === forced })));
  while (lines.length < total) lines.push(decoyLine(rng, doc, `c${n}d${lines.length}`, used));
  for (let i = lines.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [lines[i], lines[j]] = [lines[j], lines[i]];
  }
  // The "key" fee a habit can stop: the first one that has a habit fix.
  const key = lines.find((l) => l.fee) || null;
  return { n, client, doc, intro, lines, noFee, key: key?.kind || null };
}

// The seed keeps difficulty in a band (1.6): thoughtful play must land in
// CONFIG band, so class top scores from different seeds compare fairly.
export function newShift(seed, difficulty) {
  for (let t = 0; t < 60; t++) {
    const deal = dealOne(`${seed}:${t}`, difficulty);
    const sc = score(playDeal(deal, thoughtfulPolicy)).score;
    if (sc >= C().band[0] && sc <= C().band[1]) return deal;
  }
  return dealOne(`${seed}:0`, difficulty);
}

function dealOne(seed, difficulty) {
  const rng = createRng(`${seed}:fees:${difficulty}`);
  const types = ["bank", "phone", "gym"];
  const t1 = types[rng.int(0, 2)];
  const t2 = types.filter((t) => t !== t1)[rng.int(0, 1)];
  const pickClient = (t) => {
    const p = FD_CLIENTS.filter((x) => x[1] === t);
    const [client, doc, intro] = p[rng.int(0, p.length - 1)];
    return { client, doc, intro };
  };
  const first = pickClient(t1);
  const second = pickClient(t2);
  const noFee2 = rng.chance(C().noFeeChance);
  const c1 = buildCase(rng, first, difficulty, 1);
  const c2 = buildCase(rng, second, difficulty, 2, { noFee: noFee2 });
  // The client's callback line in Case 2 (chaos, once a shift).
  const cbKinds = Object.keys(FD_CHARGES).filter((k) => FD_CHARGES[k].docs.includes(t2) && !c2.lines.some((l) => l.kind === k));
  const callback = rng.chance(0.65) && cbKinds.length ? feeLine(rng, cbKinds[rng.int(0, cbKinds.length - 1)], difficulty, "c2cb") : decoyLine(rng, t2, "c2cb", new Set(c2.lines.map((l) => l.text)));
  return { seed: String(seed), difficulty, cases: [c1, c2], first, rngSeed: `${seed}:fees3:${difficulty}`, callback };
}

// Case 3 is built when it's reached: the same client a month later, with Case
// 1's key fee back if its habit wasn't fixed.
export function caseThree(deal, habitFixed) {
  const rng = createRng(deal.rngSeed);
  const c1 = deal.cases[0];
  const forced = habitFixed || !c1.key ? null : c1.key;
  const c3 = buildCase(rng, { ...deal.first, intro: `${deal.first.client} is back a month later.` }, deal.difficulty, 3, { forced, avoid: habitFixed && c1.key ? [c1.key] : [] });
  return c3;
}

export function newState(deal) {
  return { deal, at: 0, cases: [deal.cases[0], deal.cases[1]], calls: C().calls, results: [], callbackShown: false };
}

// A case's grade. marks: Set of line ids. noFeeClaim: the student pressed N.
// actions: { lineId: action }. habit: the picked habit text. Returns the
// result and uses up calls on the state.
export function closeCase(s, kase, { marks, noFeeClaim = false, actions = {}, habit = null }) {
  const c = C();
  const lines = kase.lines;
  const fees = lines.filter((l) => l.fee);
  const found = fees.filter((l) => marks.has(l.id));
  const wrongMarks = lines.filter((l) => !l.fee && marks.has(l.id));
  const missed = fees.filter((l) => !marks.has(l.id));
  let recovered = 0;
  const outcomes = [];
  const disputedLegit = [];
  for (const l of lines.filter((x) => marks.has(x.id))) {
    let a = actions[l.id] || "accept";
    if (COSTS_CALL.has(a)) {
      if (s.calls <= 0) a = "accept";
      else s.calls--;
    }
    let got = 0;
    let note;
    if (!l.fee) {
      if (a === "dispute") disputedLegit.push(l);
      note = a === "dispute" ? "That charge was real. The dispute was denied." : "That line wasn't a fee.";
    } else if (a === "refund" && l.right.includes("refund")) {
      const odds = l.repeat ? c.refundOdds.repeat : c.refundOdds.first;
      got = l.waive < odds ? l.amount : 0;
      note = got ? "They waived it." : l.repeat ? "They said no. It's a repeat fee." : "They said no this time.";
    } else if (a === "dispute" && l.right.includes("dispute")) {
      got = l.amount;
      note = "Dispute won. The charge was reversed.";
    } else if (a === "cancel" && l.right.includes("cancel")) {
      got = l.amount;
      note = "Canceled. That charge won't come back.";
    } else if (a === "accept" && l.right.includes("accept")) note = "Fair enough. Fix it with a habit.";
    else if (a === "dispute") {
      disputedLegit.push(l);
      note = "Disputes are for errors. This fee was real, so it was denied.";
    } else note = `Not the best move. ${l.right.includes("refund") ? "Asking for a refund works here." : l.right.includes("dispute") ? "This one is an error you can dispute." : l.right.includes("cancel") ? "Canceling stops this one." : "Accept it and fix the habit."}`;
    recovered = r2(recovered + got);
    outcomes.push({ line: l, action: a, got, note, right: l.fee ? l.right.includes(a) : a !== "dispute" });
  }
  const habitRight = Boolean(kase.key && habit && habit === FD_CHARGES[kase.key].habit[0]);
  const noFeeRight = kase.noFee && noFeeClaim && !marks.size;
  const score = c.perFound * found.length - c.perWrong * wrongMarks.length - c.perMissed * missed.length + recovered / 2 + (habitRight ? c.habit : 0) + (noFeeRight ? c.noFee : 0);
  const res = { n: kase.n, client: kase.client, doc: kase.doc, found: found.length, fees: fees.length, wrongMarks: wrongMarks.length, missed, recovered, habitRight, noFeeRight, outcomes, disputedLegit, score: Math.round(score), monthly: r2(fees.reduce((t, l) => t + l.amount, 0)), key: kase.key, repeatBack: fees.some((l) => l.repeat) };
  s.results.push(res);
  if (kase.n === 1) s.cases.push(caseThree(s.deal, habitRight));
  s.at++;
  return res;
}

export const currentCase = (s) => s.cases[s.at] || null;
export const habitOptions = (kase, rng) => {
  if (!kase.key) return [];
  const list = FD_CHARGES[kase.key].habit.slice();
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

export function score(s) {
  const total = s.results.reduce((t, r) => t + r.score, 0);
  const monthly = r2(s.results.reduce((t, r) => t + r.monthly, 0));
  const saved = r2(s.results.reduce((t, r) => t + r.recovered, 0));
  return { score: Math.round(total), wrongMarks: s.results.reduce((t, r) => t + r.wrongMarks, 0), missed: s.results.reduce((t, r) => t + r.missed.length, 0), monthly, yearly: r2(monthly * 12), saved, habits: s.results.filter((r) => r.habitRight).length };
}

export function biggest(s) {
  const calls = s.results.flatMap((r) => r.outcomes).filter((o) => COSTS_CALL.has(o.action)).sort((a, b) => b.line.amount - a.line.amount)[0];
  const missedRefund = s.results.flatMap((r) => r.outcomes).find((o) => o.action === "accept" && o.line.fee && o.line.right.includes("refund") && !o.line.right.includes("accept"));
  if (missedRefund) return { text: `accepting the $${missedRefund.line.amount} ${missedRefund.line.label.toLowerCase()} instead of asking for a refund` };
  if (calls) return { text: `spending a call on the $${calls.line.amount} ${calls.line.label.toLowerCase()}` };
  return { text: "how you used your three calls" };
}

// ---------- Bots ----------
// policy(state, case) -> { marks, noFeeClaim, actions, habit }
export function play(seed, difficulty, policy) {
  return playDeal(newShift(seed, difficulty), policy);
}

function playDeal(deal, policy) {
  const s = newState(deal);
  while (currentCase(s)) closeCase(s, currentCase(s), policy(s, currentCase(s)));
  return s;
}

const feeIds = (k) => new Set(k.lines.filter((l) => l.fee).map((l) => l.id));
export function thoughtfulPolicy(s, k) {
  const marks = feeIds(k);
  const actions = {};
  // Calls go to the biggest refundable or disputable charges first.
  let calls = s.calls;
  const fees = k.lines.filter((l) => l.fee).sort((a, b) => b.amount - a.amount);
  for (const l of fees) {
    const want = l.right.includes("dispute") ? "dispute" : l.right.includes("cancel") ? "cancel" : l.right.includes("refund") && !l.right.includes("accept") ? "refund" : "accept";
    if (COSTS_CALL.has(want) && calls > 0 && l.amount >= C().callWorth) {
      actions[l.id] = want;
      calls--;
    } else actions[l.id] = COSTS_CALL.has(want) ? "accept" : want;
  }
  return { marks, noFeeClaim: !marks.size, actions, habit: k.key ? FD_CHARGES[k.key].habit[0] : null };
}
export function disputeAllPolicy(s, k) {
  const marks = feeIds(k);
  // The lazy bots still pick the right habit, so the test isolates how calls get used.
  return { marks, noFeeClaim: !marks.size, actions: Object.fromEntries([...marks].map((id) => [id, "dispute"])), habit: k.key ? FD_CHARGES[k.key].habit[0] : null };
}
export function acceptAllPolicy(s, k) {
  const marks = feeIds(k);
  return { marks, noFeeClaim: !marks.size, actions: Object.fromEntries([...marks].map((id) => [id, "accept"])), habit: k.key ? FD_CHARGES[k.key].habit[0] : null };
}
