// Battles (docs/BATTLES.md): two creatures, turn by turn. Pure and deterministic.
// A battle is its start plus every turn's two actions, so both players' browsers
// work out the same result from the same inputs (replayBattle), and a refresh
// can rebuild a battle from its stored turns.
//
// An action is { move, correct, frac }: the move id, whether the question was
// answered right, and how much of the timer was left (0 to 1, for the speed
// bonus). Moves and their numbers live in CONFIG.battle[ruleset].moves.
//
// Two rulesets (teacher request 2026-10-26): "simple" (Strike, Shield, Heal,
// hard hits, the live one) and "classic" (the first 6-move version, kept for
// tuning another day). A battle remembers its ruleset, so a replay always
// uses the rules it was played with.
import { CONFIG } from "../data/config.js";
import { createRng } from "./rng.js";

const B = () => CONFIG.battle;
const rulesOf = (battle) => B()[battle?.ruleset || B().ruleset] || B().classic;
const MOVE_IDS = (battle) => Object.keys(rulesOf(battle).moves);

export function newBattle({ seed, players, ruleset = B().ruleset }) {
  return {
    seed: String(seed),
    ruleset,
    turn: 0,
    sides: players.map((p) => ({ uid: p.uid, name: p.name, hp: B().hp, shield: 0, boost: 1, dots: [], cd: {} })),
    log: [],
    over: false,
    winner: null,
  };
}

// Moves a side can pick this turn (anything not cooling down).
export function availableMoves(battle, slot) {
  const cd = battle.sides[slot].cd;
  return MOVE_IDS(battle).filter((id) => !(cd[id] > 0));
}

// How strong a classic move lands: full power for a right answer plus up to
// speedBonus for a fast one, wrongPower for a wrong answer.
export function quality({ correct, frac = 0 }) {
  if (!correct) return B().classic.wrongPower;
  return speed(frac);
}
const speed = (frac) => 1 + B().speedBonus * Math.max(0, Math.min(1, Number(frac) || 0));

function copy(battle) {
  return {
    ...battle,
    sides: battle.sides.map((s) => ({ ...s, dots: s.dots.map((d) => ({ ...d })), cd: { ...s.cd } })),
    log: battle.log.slice(),
  };
}

// Plays one turn. actions: [action for side 0, action for side 1]. Returns a new
// battle and never changes the one it is given. A move that is cooling down (or
// unknown) is played as a strike, so a stale or tampered action can't break a match.
export function resolveTurn(battle, actions) {
  if (battle.over) return battle;
  if ((battle.ruleset || B().ruleset) === "simple") return resolveSimple(battle, actions);
  const cfg = { ...B(), ...B().classic };
  const next = copy(battle);
  const acts = [0, 1].map((i) => {
    const a = actions[i] || {};
    const ok = cfg.moves[a.move] && !(next.sides[i].cd[a.move] > 0);
    return { move: ok ? a.move : "strike", correct: Boolean(a.correct), frac: Number(a.frac) || 0 };
  });
  const out = acts.map((a) => ({ move: a.move, correct: a.correct, dealt: 0, blocked: 0, healed: 0, shield: 0, ticked: 0, boost: 0 }));
  const guardMult = [1, 1];

  // 1. Moves on yourself: guard, shield, heal and clearing debts.
  acts.forEach((a, i) => {
    const me = next.sides[i];
    const m = cfg.moves[a.move];
    const q = quality(a);
    if (a.move === "guard") {
      guardMult[i] = a.correct ? m.power : m.wrongPower;
      out[i].boost = a.correct ? m.boost : 1 + (m.boost - 1) / 2;
    }
    if (a.move === "fund") {
      const add = Math.round(m.power * q);
      me.shield = Math.min(cfg.shieldMax, me.shield + add);
      out[i].shield = add;
    }
    if (a.move === "payfull") {
      const heal = Math.round(m.power * q);
      const before = me.hp;
      me.hp = Math.min(cfg.hp, me.hp + heal);
      out[i].healed = me.hp - before;
      me.dots = [];
    }
  });

  // 2. Hits on the other side, after its guard and shield.
  acts.forEach((a, i) => {
    const m = cfg.moves[a.move];
    if (!["strike", "payday"].includes(a.move)) return;
    const them = next.sides[1 - i];
    const full = Math.round(m.power * quality(a) * next.sides[i].boost);
    const raw = Math.round(full * guardMult[1 - i]);
    const absorbed = Math.min(them.shield, raw);
    them.shield -= absorbed;
    them.hp -= raw - absorbed;
    out[i].dealt = raw - absorbed;
    out[i].blocked = full - out[i].dealt;
  });

  // 3. Lingering effects start: interest on them, a loan's payback on you.
  acts.forEach((a, i) => {
    const m = cfg.moves[a.move];
    const q = quality(a);
    if (a.move === "compound") next.sides[1 - i].dots.push({ kind: "compound", ticks: m.ticks.map((t) => Math.round(t * q)) });
    if (a.move === "payday") next.sides[i].dots.push({ kind: "payday", ticks: m.ticks.slice() });
  });

  // 4. End of the turn: lingering effects tick, cooldowns count down.
  next.sides.forEach((s, i) => {
    for (const d of s.dots) {
      const t = d.ticks.shift() || 0;
      s.hp -= t;
      out[i].ticked += t;
    }
    s.dots = s.dots.filter((d) => d.ticks.length);
    for (const id of Object.keys(s.cd)) if (s.cd[id] > 0) s.cd[id]--;
    const used = cfg.moves[acts[i].move];
    if (used.cd) s.cd[acts[i].move] = used.cd - 1;
    s.boost = out[i].boost || 1;
    if (s.hp < 0) s.hp = 0;
  });

  return endTurn(next, out);
}

function endTurn(next, out) {
  next.turn++;
  next.log.push(out);
  const [a, b] = next.sides;
  if (a.hp <= 0 || b.hp <= 0 || next.turn >= B().maxTurns) {
    next.over = true;
    next.winner = a.hp === b.hp ? null : a.hp > b.hp ? 0 : 1;
  }
  return next;
}

// The simple ruleset. Heals land first, then Shields stand, then Strikes hit.
// A Shield blocks its share of the hit coming in and throws part of what it
// blocked back as a counter, so a Shield beats a Strike, a Strike beats a
// Heal, and a Heal beats a Shield (a Shield against no hit does nothing).
// crit marks a right, fast Strike for the screen's bigger hit effect.
function resolveSimple(battle, actions) {
  const R = rulesOf({ ruleset: "simple" }).moves;
  const next = copy(battle);
  const acts = [0, 1].map((i) => {
    const a = actions[i] || {};
    return { move: R[a.move] ? a.move : "strike", correct: Boolean(a.correct), frac: Number(a.frac) || 0 };
  });
  const out = acts.map((a) => ({ move: a.move, correct: a.correct, dealt: 0, blocked: 0, healed: 0, countered: 0, crit: false }));

  acts.forEach((a, i) => {
    if (a.move !== "heal") return;
    const me = next.sides[i];
    const add = a.correct ? Math.round(R.heal.power * speed(a.frac)) : R.heal.wrongPower;
    const before = me.hp;
    me.hp = Math.min(B().hp, me.hp + add);
    out[i].healed = me.hp - before;
  });
  const block = acts.map((a) => (a.move === "shield" ? (a.correct ? R.shield.block : R.shield.wrongBlock) : 0));
  acts.forEach((a, i) => {
    if (a.move !== "strike") return;
    const crit = a.correct && a.frac >= R.strike.critFrac;
    const full = !a.correct ? R.strike.wrongPower : crit ? Math.round(R.strike.power * R.strike.critMult) : R.strike.power;
    const stopped = Math.round(full * block[1 - i]);
    const counter = Math.round(stopped * R.shield.counter);
    next.sides[1 - i].hp -= full - stopped;
    next.sides[i].hp -= counter;
    out[i].dealt = full - stopped;
    out[i].crit = crit;
    out[1 - i].blocked = stopped;
    out[1 - i].countered = counter;
  });
  // A Shield that nothing hit banks a little HP, so it is never wasted.
  acts.forEach((a, i) => {
    if (a.move !== "shield" || acts[1 - i].move === "strike") return;
    const me = next.sides[i];
    const before = me.hp;
    me.hp = Math.min(B().hp, me.hp + (a.correct ? R.shield.idleHeal : R.shield.wrongIdleHeal));
    out[i].healed = me.hp - before;
  });
  next.sides.forEach((s) => (s.hp = Math.max(0, s.hp)));
  return endTurn(next, out);
}

// Rebuilds a battle from its start and its turns ([[action0, action1], ...]).
export function replayBattle(start, turns) {
  let b = newBattle(start);
  for (const t of turns) {
    if (b.over) break;
    b = resolveTurn(b, t);
  }
  return b;
}

// "win", "loss" or "draw" for one side of a finished battle.
export function resultFor(battle, slot) {
  if (!battle.over) return null;
  if (battle.winner == null) return "draw";
  return battle.winner === slot ? "win" : "loss";
}

// A computer opponent. Picks a sensible move with some randomness, and answers
// right as often as its level says. The rng is seeded per battle and turn, so a
// computer battle replays exactly.
export function botAction(battle, slot, level = "grove", seed = battle.seed) {
  const rng = createRng(`${seed}:bot:${slot}:${battle.turn}`);
  const me = battle.sides[slot];
  const them = battle.sides[1 - slot];
  const can = availableMoves(battle, slot);
  const simple = (battle.ruleset || B().ruleset) === "simple";
  const weight = simple
    ? { strike: 4, shield: them.hp > me.hp ? 1 : 1.6, heal: me.hp < 45 ? 2.2 : me.hp < 80 ? 1 : 0.2 }
    : {
      strike: me.boost > 1 ? 6 : 4,
      guard: me.boost > 1 ? 0.2 : 1,
      fund: me.shield < 8 ? 1.5 : 0.2,
      compound: them.dots.some((d) => d.kind === "compound") ? 0.3 : 2,
      payday: me.hp > 40 ? 1.5 : 0.3,
      payfull: me.dots.length || me.hp < 50 ? 2.5 : 0.3,
    };
  const pool = can.map((id) => [id, weight[id] ?? 1]);
  const total = pool.reduce((s, [, w]) => s + w, 0);
  let r = rng.next() * total;
  const move = (pool.find(([, w]) => (r -= w) < 0) || pool[0])[0];
  const right = B().bots[level]?.right ?? 0.7;
  return { move, correct: rng.next() < right, frac: rng.range(0.1, 0.7) };
}
