// Battles (docs/BATTLES.md): the turn math, replays, rounds, costs and the record.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../js/data/config.js";
import { MOVES } from "../js/data/battle.js";
import { newBattle, resolveTurn, replayBattle, availableMoves, resultFor, botAction, createLife, createRng, replayLife, addBill } from "../js/engine/index.js";
import { roundFor, actionFrom, turnsFrom, canEnter, payEntry, refundEntry, finishBattle, botPrizesLeft, ensureBattle } from "../js/battle.js";
import { newPlay } from "../js/play.js";

const start = (seed = "b1") => ({ seed, players: [{ uid: "a", name: "A" }, { uid: "b", name: "B" }] });
const right = (move, frac = 0) => ({ move, correct: true, frac });
const wrong = (move) => ({ move, correct: false, frac: 0 });

test("every move has its numbers in CONFIG and its words in the data file", () => {
  assert.deepEqual(MOVES.map((m) => m.id).sort(), Object.keys(CONFIG.battle.moves).sort());
});

test("a turn never changes the battle it is given, and a strike hits harder with a right, fast answer", () => {
  const b = newBattle(start());
  const snap = JSON.stringify(b);
  const n = resolveTurn(b, [right("strike", 1), wrong("strike")]);
  assert.equal(JSON.stringify(b), snap);
  const s = CONFIG.battle.moves.strike.power;
  assert.equal(n.sides[1].hp, CONFIG.battle.hp - Math.round(s * (1 + CONFIG.battle.speedBonus)));
  assert.equal(n.sides[0].hp, CONFIG.battle.hp - Math.round(s * CONFIG.battle.wrongPower));
  assert.equal(n.turn, 1);
});

test("guard halves the hit and boosts the next one, a fund soaks hits, and pay in full clears interest", () => {
  const s = CONFIG.battle.moves.strike.power;
  let b = resolveTurn(newBattle(start()), [right("guard"), right("strike")]);
  assert.equal(b.sides[0].hp, CONFIG.battle.hp - Math.round(s * CONFIG.battle.moves.guard.power));
  b = resolveTurn(b, [right("strike"), right("strike")]);
  assert.equal(b.log[1][0].dealt, Math.round(s * CONFIG.battle.moves.guard.boost));

  let f = resolveTurn(newBattle(start()), [right("fund"), right("guard")]);
  assert.equal(f.sides[0].shield, CONFIG.battle.moves.fund.power);
  f = resolveTurn(f, [right("guard"), right("strike")]);
  assert.equal(f.sides[0].hp, CONFIG.battle.hp, "the cushion took the hit");

  let c = resolveTurn(newBattle(start()), [right("compound"), right("guard")]);
  const first = CONFIG.battle.moves.compound.ticks[0];
  assert.equal(c.sides[1].hp, CONFIG.battle.hp - first);
  c = resolveTurn(c, [right("guard"), right("payfull")]);
  assert.equal(c.sides[1].dots.length, 0, "pay in full wiped the interest");
});

test("a move cooling down can't be picked, and a stale one is played as a strike", () => {
  let b = resolveTurn(newBattle(start()), [right("payday"), right("guard")]);
  assert.ok(!availableMoves(b, 0).includes("payday"));
  const hp = b.sides[1].hp;
  b = resolveTurn(b, [right("payday"), wrong("strike")]);
  assert.equal(b.log[1][0].move, "strike");
  assert.ok(b.sides[1].hp < hp);
  for (let i = 0; i < CONFIG.battle.moves.payday.cd - 1; i++) b = resolveTurn(b, [right("guard"), right("guard")]);
  assert.ok(availableMoves(b, 0).includes("payday") || b.over);
});

test("a battle ends by knockout or on time, and replays exactly", () => {
  const turns = [];
  let b = newBattle(start("r"));
  while (!b.over) {
    const t = [botAction(b, 0, "elder"), botAction(b, 1, "sprout")];
    turns.push(t);
    b = resolveTurn(b, t);
  }
  assert.ok(b.turn <= CONFIG.battle.maxTurns);
  assert.deepEqual(replayBattle(start("r"), turns), b);
  assert.ok(["win", "loss", "draw"].includes(resultFor(b, 0)));
  assert.equal(resultFor(b, 0) === "win", resultFor(b, 1) === "loss");
});

// The balance check (MODES.md): against the sensible computer player at the same
// accuracy, no one-move habit wins more than about 60%. Knowing the answers matters most.
test("no single move wins more than 60% against a sensible player, and right answers win battles", () => {
  const N = 400;
  const run = (pick0, acc0, acc1) => {
    let wins = 0;
    for (let i = 0; i < N; i++) {
      const rng = createRng(`bal:${i}`);
      let b = newBattle(start(`bal${i}`));
      while (!b.over) {
        const bot = { ...botAction(b, 1, "grove"), correct: rng.next() < acc1 };
        const mine = pick0(b, rng);
        b = resolveTurn(b, [{ ...mine, correct: rng.next() < acc0, frac: rng.range(0.1, 0.7) }, bot]);
      }
      if (b.winner === 0) wins++;
    }
    return wins / N;
  };
  for (const id of Object.keys(CONFIG.battle.moves)) {
    const rate = run((b) => ({ move: availableMoves(b, 0).includes(id) ? id : "strike" }), 0.7, 0.7);
    assert.ok(rate <= 0.6, `${id} won ${rate}`);
  }
  const smart = run((b) => botAction(b, 0, "grove"), 0.9, 0.5);
  assert.ok(smart >= 0.75, `90% right beat 50% right only ${smart}`);
});

test("rounds: the same kind of question for both sides with different numbers, and graded from the seed", () => {
  let differ = 0;
  for (let t = 0; t < 20; t++) {
    const a = roundFor("seedX", t, 0);
    const b = roundFor("seedX", t, 1);
    assert.equal(a.type, b.type);
    if (JSON.stringify(a.prompt) !== JSON.stringify(b.prompt)) differ++;
    assert.deepEqual(roundFor("seedX", t, 0), a, "the same seed builds the same round");
    assert.equal(actionFrom("seedX", t, 0, { m: "strike", c: a.answer, f: 0.5 }).correct, true);
    assert.equal(actionFrom("seedX", t, 0, { m: "strike", c: (a.answer + 1) % a.choices.length, f: 0.5 }).frac, 0);
  }
  assert.ok(differ >= 12, `only ${differ} of 20 rounds had different numbers`);
  const p0 = { 0: { m: "strike", c: 0, f: 0.2 }, 1: { m: "guard", c: 1, f: 0 } };
  const p1 = { 0: { m: "fund", c: 2, f: 0.9 } };
  assert.equal(turnsFrom("s", p0, p1).length, 1, "a turn counts once both sides answered");
});

test("entry costs Energy and a fee through the engine, never more than the bills leave", () => {
  const play = newPlay();
  let life = createLife({ seed: "fee" });
  life = { ...life, checking: 200 };
  play.energy = 1;
  assert.equal(canEnter(life, play).ok, false, "not enough Energy");
  play.energy = 5;
  const tight = addBill(life, "Rent", 196).life;
  assert.equal(canEnter(tight, play).ok, false, "the fee would eat into the bills");
  const paid = payEntry(life, play);
  assert.ok(paid.ok);
  assert.equal(paid.life.checking, 200 - CONFIG.battle.fee);
  assert.equal(play.energy, 5 - CONFIG.battle.energy);
  const back = refundEntry(paid.life, play);
  assert.equal(back.life.checking, 200);
  assert.equal(play.energy, 5);
});

test("finishing records the result, pays the prize, and computer prizes stop after the daily limit", () => {
  const play = newPlay();
  let life = createLife({ seed: "prize" });
  const day = new Date("2026-10-26T12:00:00");
  let b = newBattle(start());
  while (!b.over) b = resolveTurn(b, [right("strike", 1), wrong("guard")]);
  const before = life.checking;
  for (let i = 0; i < CONFIG.battle.botPrizesPerDay; i++) life = finishBattle(life, play, b, 0, { name: "Mossbeard", kind: "bot", level: "grove" }, day).life;
  assert.equal(life.checking, before + CONFIG.battle.prize.win * CONFIG.battle.botPrizesPerDay);
  assert.equal(botPrizesLeft(play, day), 0);
  const capped = finishBattle(life, play, b, 0, { name: "Mossbeard", kind: "bot" }, day);
  assert.equal(capped.prize, 0);
  const live = finishBattle(life, play, b, 1, { name: "Rival", kind: "live" }, day);
  assert.equal(live.result, "loss");
  assert.equal(live.prize, CONFIG.battle.prize.loss, "live battles always pay something for playing");
  const rec = ensureBattle(play);
  assert.equal(rec.wins, CONFIG.battle.botPrizesPerDay + 1);
  assert.equal(rec.losses, 1);
  assert.equal(rec.streak, 0);
  for (let i = 0; i < 40; i++) finishBattle(life, play, b, 0, { name: "x", kind: "bot" }, day);
  assert.equal(rec.log.length, CONFIG.battle.resultsKept);
  assert.equal(botPrizesLeft(play, new Date("2026-10-27T12:00:00")), CONFIG.battle.botPrizesPerDay);
  // Prizes and fees replay exactly.
  assert.equal(replayLife({ seed: "prize" }, life.log).checking, life.checking);
});
