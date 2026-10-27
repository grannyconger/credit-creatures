// The Arcade's shared rules (GAME-SPECS.md Part 2): pay, safe and risky mode,
// getting fired, personal bests and the shift result report. Pure functions over
// the save's `play` object, so they run in Node tests. Functions that take
// `play` change it in place.
import { CONFIG } from "../data/config.js";
import { createRng } from "../engine/index.js";

const A = () => CONFIG.arcade;

export function ensureArcade(play) {
  play.arcade ??= {};
  const a = play.arcade;
  a.plays ??= 0;
  a.best ??= {};
  a.fired ??= {};
  a.last ??= {};
  a.log ??= [];
  a.trained ??= {};
  a.live ??= null;
  return a;
}

// coins = round(payCap x min(1, score / maxPayScore)). A multiplier (Cashier Rush
// Speed doubles coins) still stays under the cap. Never below 0.
// maxPayScore can be one number or one per tier (a difficulty or a mode).
function maxPay(gameId, tier) {
  const m = A().games[gameId]?.maxPayScore ?? 100;
  return typeof m === "object" ? m[tier] ?? Object.values(m)[0] : m;
}

export function payFor(gameId, score, { multiplier = 1, tier = null } = {}) {
  const max = maxPay(gameId, tier);
  const ratio = Math.max(0, Math.min(1, score / max));
  return Math.min(A().payCap, Math.round(A().payCap * ratio * multiplier));
}

export function payRatio(gameId, score, tier = null) {
  const max = maxPay(gameId, tier);
  return Math.max(0, Math.min(1, score / max));
}

// ---------- Fired (2.3) ----------

// The real time (ms) a fired game opens again, or 0 if it's open now.
export function firedUntil(play, game, now = Date.now()) {
  const at = ensureArcade(play).fired[game] || 0;
  return at > now ? at : 0;
}

export function minutesLeft(play, game, now = Date.now()) {
  const at = firedUntil(play, game, now);
  return at ? Math.ceil((at - now) / 60000) : 0;
}

function fire(play, game, now) {
  ensureArcade(play).fired[game] = now + A().cooldownMinutes * 60000;
}

// ---------- A shift in progress ----------

// Safe mode is always open, so a student can always earn (teacher request
// 2026-10-27). Risky mode never opens in the prologue (the piggy bank year is
// for learning). shiftsLeft is kept for callers but no longer limits play.
export function canStart(play, game, { mode, training, shiftsLeft, prologue = false, now = Date.now() }) {
  if (firedUntil(play, game, now)) return { ok: false, reason: `You were fired from this game. It opens again in ${minutesLeft(play, game, now)} minute${minutesLeft(play, game, now) === 1 ? "" : "s"}.` };
  if (training) return { ok: true };
  if (mode === "risky" && prologue) return { ok: false, reason: "Risky mode opens once your bank account does." };
  return { ok: true };
}

// The seed for a new shift. Training always uses the game's fixed seed.
export function nextSeed(play, lifeSeed, game, training) {
  if (training) return `train:${game}`;
  const a = ensureArcade(play);
  a.plays++;
  return `${lifeSeed}:arc:${game}:${a.plays}`;
}

// A risky shift is tracked while it runs, so closing the tab can't dodge a firing.
export function beginLive(play, game, mode) {
  ensureArcade(play).live = mode === "risky" ? { game, mistakes: 0 } : null;
}

// One risky mistake. Returns how many this shift so far.
export function noteMistake(play) {
  const live = ensureArcade(play).live;
  if (!live) return 0;
  live.mistakes++;
  return live.mistakes;
}

// Ends the shift (finished or left). Mistakes already made always count.
// Returns true if this shift got the student fired.
export function endLive(play, now = Date.now()) {
  const a = ensureArcade(play);
  const live = a.live;
  a.live = null;
  if (!live || live.mistakes < A().fireAfter) return false;
  fire(play, live.game, now);
  return true;
}

// A risky shift that was still running when the save loaded was abandoned
// (the tab closed). Its mistakes count, so it may still fire the student.
export function settleAbandoned(play, now = Date.now()) {
  const live = ensureArcade(play).live;
  if (!live) return null;
  const fired = endLive(play, now);
  return { game: live.game, mistakes: live.mistakes, fired };
}

// ---------- Scores ----------

// Is a better than b? Scores are higher-is-better. tie: "high" or "low".
export function beats(a, b, tie = "high") {
  if (!b) return true;
  if (a.s !== b.s) return a.s > b.s;
  if (a.t == null || b.t == null || a.t === b.t) return false;
  return tie === "low" ? a.t < b.t : a.t > b.t;
}

export function bestOf(play, board) {
  return ensureArcade(play).best[board] || null;
}

// The record of one shift (2.5), kept small for the save. Ranked shifts also
// update the personal best. Returns { prevBest, newBest }.
export function recordResult(play, report, { tie = "high", now = Date.now() } = {}) {
  const a = ensureArcade(play);
  const entry = {
    g: report.game,
    seed: report.seed,
    set: report.settings,
    rk: report.ranked,
    tr: report.training,
    mode: report.mode,
    sc: report.score,
    t: report.tie ?? null,
    sub: report.sub || null,
    coins: report.coins,
    xp: 0,
    mistakes: (report.mistakes || []).map((m) => ({ type: m.type, cost: m.cost })),
    why: report.why || null,
    sec: report.seconds,
    at: now,
  };
  if (!report.training) {
    a.log.push(entry);
    a.log = a.log.slice(-A().resultsKept);
  }
  const prevBest = report.board ? a.best[report.board] || null : null;
  let newBest = false;
  if (report.ranked && !report.training && report.board) {
    const mine = { s: report.score, t: report.tie ?? null, at: now };
    if (beats(mine, prevBest, tie)) {
      a.best[report.board] = mine;
      newBest = true;
    }
  }
  return { entry, prevBest, newBest };
}

// The class top for one board, from every classmate's bests (from the db).
// rows: [{ creatureName, best: { [board]: { s, t, at } } }].
export function classTop(rows, board, tie = "high") {
  let top = null;
  for (const r of rows || []) {
    const b = r?.best?.[board];
    if (!b || typeof b.s !== "number") continue;
    if (!top || beats(b, top.best, tie)) top = { creatureName: r.creatureName || "A creature", best: b };
  }
  return top;
}

// ---------- Bonus round ----------

// One bonus question per shift, picked by the seed, avoiding the last few seen.
export function pickBonus(questions, seed, recent = []) {
  if (!questions?.length) return null;
  const rng = createRng(`${seed}:bonus`);
  const fresh = questions.filter((q) => !recent.includes(q.id));
  const pool = fresh.length ? fresh : questions;
  return pool[Math.floor(rng.next() * pool.length)];
}

// A typed answer counts if it's within the question's tolerance (default a cent).
export function bonusRight(q, answer) {
  if (q.type === "number") {
    const n = Number(String(answer).replace(/[$,\s]/g, ""));
    return Number.isFinite(n) && Math.abs(n - q.answer) <= (q.tolerance ?? 0.01);
  }
  return Number(answer) === q.answer;
}
