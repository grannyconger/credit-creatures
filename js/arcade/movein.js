// Move-In Day's rules (GAME-SPECS.md game 14, re-themed for standard E). Pure
// and seeded. Dollars. Times are game seconds: viewing a unit and each
// inspection add to the clock, and Timed mode also adds real seconds (the UI
// calls wait()). A unit is gone once the clock passes its "taken at" time.
import { CONFIG } from "../data/config.js";
import { createRng } from "../engine/index.js";
import { MI_AID, MI_SCHOOLS, MI_SPOTS, MI_PROBLEMS, MI_UNITS, MI_BACKUP, MI_GOTCHAS, MI_FINE, MI_ROOMMATES, MI_EVENTS, MI_DAMAGE, MI_DECOYS } from "../data/arcade/movein.js";

const C = () => CONFIG.arcade.games.movein;
const r100 = (x) => Math.round(x / 100) * 100;

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Part 1: the aid letters ----------
export function letter(rng, t) {
  const cost = Object.entries(t.cost).map(([k, [lo, hi]]) => ({ key: k, amount: r100(rng.range(lo, hi)) }));
  const aid = t.aid.map(([type, lo, hi]) => ({ type, name: MI_AID[type].name, kind: MI_AID[type].kind, amount: r100(rng.range(lo, hi)) }));
  return { id: t.id, name: t.name, note: t.note, cost, aid, ...letterMath({ cost, aid }) };
}

export function letterMath({ cost, aid }) {
  const coa = cost.reduce((t, x) => t + x.amount, 0);
  const sum = (k) => aid.filter((a) => a.kind === k).reduce((t, a) => t + a.amount, 0);
  const free = sum("free");
  const earn = sum("earn");
  const borrow = sum("borrow");
  return { coa, free, earn, borrow, totalAid: free + earn + borrow, net: coa - free };
}

// ---------- The deal ----------
export function newShift(seed) {
  const c = C();
  for (let tries = 0; ; tries++) {
    const rng = createRng(`${seed}:movein:${tries}`);
    const [a, b] = shuffle(rng, MI_SCHOOLS).slice(0, 2);
    const schools = [letter(rng, a), letter(rng, b)];
    const [lo, hi] = schools[0].net < schools[1].net ? [0, 1] : [1, 0];
    // The trap: the school with the bigger aid total costs more to attend.
    if (schools[hi].totalAid <= schools[lo].totalAid || schools[hi].net - schools[lo].net < 1500) {
      if (tries < 40) continue;
    }
    const units = shuffle(rng, MI_UNITS)
      .slice(0, 2)
      .map((t, i) => {
        const rent = Math.round(rng.range(t.rent[0], t.rent[1]) / 10) * 10;
        const n = rng.int(t.problems[0], t.problems[1]);
        const problems = shuffle(rng, MI_PROBLEMS)
          .filter((p, k, all) => all.findIndex((q) => q.spot === p.spot) === k)
          .slice(0, n)
          .map((p) => ({ ...p, amount: Math.round(rng.range(p.cost[0], p.cost[1]) / 10) * 10, breaks: rng.chance(c.breakOdds) }));
        const g = MI_GOTCHAS[rng.int(0, MI_GOTCHAS.length - 1)];
        const fine = shuffle(rng, MI_FINE).slice(0, 2);
        const gotcha = { ...g, triggers: rng.chance(g.odds), amount: Array.isArray(g.cost) ? Math.round(rng.range(g.cost[0], g.cost[1]) / 5) * 5 : 0 };
        const clauses = shuffle(rng, [{ id: "g", text: g.text, gotcha: true }, ...fine.map((text, k) => ({ id: `f${k}`, text }))]);
        return { ...t, rent, deposit: rent, problems, gotcha, clauses, flagWorks: rng.chance(c.flagWorks), takenAt: rng.int(c.takenAt[i][0], c.takenAt[i][1]) };
      });
    const mate = MI_ROOMMATES[rng.int(0, MI_ROOMMATES.length - 1)];
    const damage = shuffle(rng, MI_DAMAGE).slice(0, 3);
    const spots = shuffle(rng, [...damage.map((d) => ({ ...d, real: true })), ...shuffle(rng, MI_DECOYS).slice(0, 2).map((d) => ({ ...d, real: false }))]);
    const events = shuffle(rng, MI_EVENTS).slice(0, c.events);
    return { seed: String(seed), schools, cheaper: lo, units, mate: { ...mate, leaves: !rng.chance(mate.stay) }, spots, events };
  }
}

export function newState(deal) {
  return { deal, phase: "school", sorts: {}, school: null, clock: 0, viewed: [], inspected: deal.units.map(() => new Set()), found: deal.units.map(() => []), mate: false, applied: null, fees: 0, backup: false, flagged: false, signed: false, gotchaKept: true, photos: new Set(), choices: [], log: [] };
}

// Sort an aid line: "free", "earn" or "borrow".
export function sortAid(s, school, i, kind) {
  s.sorts[`${school}:${i}`] = kind;
  return s.deal.schools[school].aid[i].kind === kind;
}
export function sortRight(s) {
  let right = 0;
  let total = 0;
  s.deal.schools.forEach((sc, k) =>
    sc.aid.forEach((a, i) => {
      total++;
      if (s.sorts[`${k}:${i}`] === a.kind) right++;
    })
  );
  return { right, total };
}
export function pickSchool(s, i) {
  s.school = i;
  s.phase = "tour";
  return i === s.deal.cheaper;
}

// ---------- Part 2: the tour ----------
export const yourRent = (s, u) => (s.mate ? Math.round(u.rent / 2) : u.rent);
export const moveInTotal = (s, u) => yourRent(s, u) * 2 + C().appFee;
export const incomeOk = (s, u) => C().income >= C().incomeRule * yourRent(s, u);
export const available = (s, i) => s.clock < s.deal.units[i].takenAt;
// Seconds until the next open unit is taken, for the warning bar.
export function warning(s) {
  const open = s.deal.units.map((u, i) => ({ i, left: u.takenAt - s.clock })).filter((x) => x.left > 0);
  const next = open.sort((a, b) => a.left - b.left)[0];
  return next && next.left <= C().warnSeconds ? next : null;
}

export function wait(s, seconds) {
  s.clock += seconds;
  return checkGone(s);
}
function checkGone(s) {
  if (s.phase === "tour" && s.deal.units.every((_, i) => !available(s, i))) {
    s.backup = true;
    s.applied = null;
    s.phase = "roommate";
    return true;
  }
  return false;
}

export function view(s, i) {
  if (s.phase !== "tour" || !available(s, i)) return false;
  if (!s.viewed.includes(i)) {
    s.viewed.push(i);
    s.clock += C().viewSeconds;
  }
  checkGone(s);
  return true;
}

export function inspect(s, i, spot) {
  if (s.phase !== "tour" || !available(s, i) || s.inspected[i].has(spot)) return null;
  s.inspected[i].add(spot);
  s.clock += C().inspectSeconds;
  const p = s.deal.units[i].problems.find((x) => x.spot === spot) || null;
  if (p) s.found[i].push(p.id);
  s.log.push({ type: "inspect", unit: i, spot, found: Boolean(p) });
  checkGone(s);
  return { problem: p };
}

export function setMate(s, on) {
  s.mate = Boolean(on);
}

// Returns { ok, text }.
export function apply(s, i) {
  const u = s.deal.units[i];
  if (s.phase !== "tour") return { ok: false, text: "" };
  if (!available(s, i)) return { ok: false, text: "Someone else already signed for it." };
  if (!incomeOk(s, u)) return { ok: false, text: `Your income needs to be 3 times your rent. ${s.mate ? "" : "A roommate would halve it."}` };
  s.fees += C().appFee;
  s.applied = i;
  s.phase = "lease";
  return { ok: true, text: "Approved. Here's the lease." };
}

// ---------- The lease ----------
export const unit = (s) => (s.backup ? { ...MI_BACKUP, deposit: MI_BACKUP.rent, problems: [], gotcha: null, clauses: [] } : s.deal.units[s.applied]);

// Flag a clause. Returns { removed, standard }.
export function flag(s, id) {
  const u = unit(s);
  const cl = u.clauses.find((x) => x.id === id);
  if (s.phase !== "lease" || !cl) return null;
  if (!cl.gotcha) return { removed: false, standard: true };
  s.flagged = true;
  if (u.flagWorks) s.gotchaKept = false;
  return { removed: u.flagWorks, standard: false };
}
export function sign(s) {
  if (s.phase !== "lease") return false;
  s.signed = true;
  s.phase = "photos";
  return true;
}
// The landlord won't remove it: walk away to the backup.
export function walkToBackup(s) {
  s.backup = true;
  s.gotchaKept = false;
  s.phase = "photos";
}

export function photo(s, id) {
  if (s.phase !== "photos") return;
  if (s.photos.has(id)) s.photos.delete(id);
  else s.photos.add(id);
}
export function donePhotos(s) {
  s.phase = "year";
}

// ---------- The year ----------
export function choose(s, k, pick) {
  s.choices[k] = pick;
}

export function year(s) {
  const c = C();
  const u = unit(s);
  const rent = s.backup ? u.rent : yourRent(s, u);
  const lines = [];
  // Hidden problems not found on the tour (found ones the landlord fixed first).
  const found = s.backup ? [] : s.found[s.applied];
  const problems = u.problems.filter((p) => p.breaks && !found.includes(p.id)).map((p) => ({ text: p.broke, amount: p.amount }));
  const mateLeft = !s.backup && s.mate && s.deal.mate.leaves;
  const mateCost = mateLeft ? Math.round(u.rent / 2) * (12 - c.leaveMonth) : 0;
  const g = !s.backup && s.gotchaKept ? u.gotcha : null;
  let gotchaCost = 0;
  if (g && g.triggers) gotchaCost = g.cost === "twoMonths" ? u.rent * 2 : g.cost === "deposit" ? 0 : g.amount;
  const fixes = s.deal.events.reduce((t, e, k) => t + (e.choices ? e.choices[s.choices[k] ?? 1].cost || 0 : 0), 0);
  const eventDamage = s.deal.events.flatMap((e, k) => (e.choices && e.choices[s.choices[k] ?? 1].damage ? [{ text: e.title, amount: e.choices[s.choices[k] ?? 1].damage }] : []));
  // Move-out: damage already there at move-in that wasn't photographed.
  const undocumented = s.backup ? [] : s.deal.spots.filter((d) => d.real && !s.photos.has(d.id)).map((d) => ({ text: `${d.spot}: ${d.text} (no move-in photo)`, amount: d.cost }));
  const deposit = u.deposit ?? u.rent;
  const nonRefund = g && g.cost === "deposit";
  for (const d of [...undocumented, ...eventDamage]) lines.push(d);
  const deducted = nonRefund ? deposit : Math.min(deposit, lines.reduce((t, x) => t + x.amount, 0));
  const back = deposit - deducted;
  const surprise = problems.reduce((t, p) => t + p.amount, 0) + mateCost + gotchaCost;
  const yearly = rent * 12 + (u.far || 0) * 12 + s.fees + fixes;
  return { rent, deposit, lines, nonRefund, deducted, back, problems, mateLeft, mateCost, gotcha: g, gotchaCost, fixes, surprise, yearly, undocumented };
}

export const backupYearly = () => MI_BACKUP.rent * 12 + MI_BACKUP.far * 12;

// Move-In Score = the school part (10 per aid line sorted right, 150 for the
// lower net price) + the Lease Score (deposit back + (backup's yearly cost -
// yours) / 10 - surprise costs / 2). At least 0.
export function score(s) {
  const c = C();
  const y = year(s);
  const sorts = sortRight(s);
  const school = sorts.right * c.sortPoints + (s.school === s.deal.cheaper ? c.schoolPoints : 0);
  const lease = y.back + (backupYearly() - y.yearly) / c.savingsDiv - y.surprise / c.surpriseDiv;
  return { score: Math.max(0, Math.round(school + lease)), school, lease: Math.round(lease), sorts, y };
}

export function biggest(s) {
  if (s.school !== s.deal.cheaper) return { text: `choosing ${s.deal.schools[s.school].name}` };
  if (s.backup) return { text: "ending up at the backup", reasons: { weak: "I wanted to see everything first.", okay: "The first place had problems.", strong: "I should have checked the key spots and applied before the other applicant came." } };
  return { text: `applying to ${s.deal.units[s.applied].name}${s.mate ? " with a roommate" : " on your own"}` };
}

// ---------- Bots ----------
const KEY_SPOTS = ["kitchen", "bath", "locks"];
export function play(seed, bot) {
  const s = newState(newShift(seed));
  s.deal.schools.forEach((sc, k) => sc.aid.forEach((a, i) => sortAid(s, k, i, bot.sortRight ? a.kind : "free")));
  pickSchool(s, bot.cheapSchool ? s.deal.cheaper : 1 - s.deal.cheaper);
  setMate(s, bot.mate === "smart" ? s.deal.mate.stay >= 0.8 : Boolean(bot.mate));
  const spots = bot.inspect === "all" ? MI_SPOTS.map((x) => x.id) : bot.inspect === "key" ? KEY_SPOTS : [];
  const order = [0, 1];
  for (const i of order) {
    if (s.phase !== "tour") break;
    view(s, i);
    for (const sp of spots) inspect(s, i, sp);
    if (bot.inspect !== "all" && incomeOk(s, s.deal.units[i]) && available(s, i)) apply(s, i);
  }
  if (s.phase === "tour") for (const i of order) if (s.phase === "tour" && available(s, i)) apply(s, i);
  if (s.phase === "tour") {
    s.backup = true;
    s.phase = "roommate";
  }
  if (s.phase === "lease") {
    if (bot.flag) {
      const r = flag(s, "g");
      if (r && !r.removed && bot.flag === "walk") walkToBackup(s);
    }
    if (s.phase === "lease") sign(s);
  }
  if (s.phase === "roommate") s.phase = "photos";
  if (bot.photos) for (const d of s.deal.spots) if (d.real) photo(s, d.id);
  donePhotos(s);
  s.deal.events.forEach((e, k) => e.choices && choose(s, k, bot.fix ? 0 : 1));
  return s;
}

export const BOTS = {
  balanced: { sortRight: true, cheapSchool: true, mate: "smart", inspect: "key", flag: true, photos: true, fix: true },
  neverInspect: { sortRight: true, cheapSchool: true, mate: "smart", inspect: "none", flag: true, photos: true, fix: true },
  inspectAll: { sortRight: true, cheapSchool: true, mate: "smart", inspect: "all", flag: true, photos: true, fix: true },
  careless: { sortRight: false, cheapSchool: false, mate: true, inspect: "none", flag: false, photos: false, fix: false },
};
