// Cashier Rush's upgraded rules and acceptance tests (GAME-SPECS.md game 1).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as R from "../js/arcade/cashier.js";
import { CONFIG } from "../js/data/config.js";
import { createRng } from "../js/engine/index.js";

const C = CONFIG.arcade.games.cashier;
const seeds = Array.from({ length: 20 }, (_, i) => `cr-${i}`);

test("the same seed deals the same customers", () => {
  assert.deepEqual(R.newShift("s", { difficulty: "hard", round: "speed" }), R.newShift("s", { difficulty: "hard", round: "speed" }));
});

test("smart payers make the change cleaner, and change never needs a $20", () => {
  let smart = 0;
  let all = 0;
  for (const seed of seeds) {
    for (const difficulty of ["easy", "medium", "hard"]) {
      const d = R.newShift(seed, { difficulty, round: "speed" });
      for (const c of d.customers) {
        all += difficulty === "easy" ? 0 : 1;
        if (c.short) continue;
        const ch = c.paid - c.price;
        assert.ok(ch > 0 && ch < 2000, `${seed} ${difficulty}: ${ch}`);
        assert.ok(R.makeChange(ch, R.DRAWERS[difficulty]), "the drawer can always make it");
        if (c.smart) {
          smart++;
          assert.notEqual(difficulty, "easy");
          assert.equal(ch % 25, 0, "a smart payer's change has no small coins");
        }
      }
    }
  }
  const share = smart / all;
  assert.ok(share > 0.1 && share < 0.3, `smart share ${share}`);
});

test("one short customer on Medium and Hard, 25 to 60 cents short, none on Easy", () => {
  for (const seed of seeds) {
    assert.equal(R.newShift(seed, { difficulty: "easy", round: "chill" }).customers.filter((c) => c.short).length, 0);
    for (const difficulty of ["medium", "hard"]) {
      const shorts = R.newShift(seed, { difficulty, round: "chill" }).customers.filter((c) => c.short);
      assert.equal(shorts.length, 1);
      assert.ok(shorts[0].short >= 25 && shorts[0].short <= 60);
    }
  }
});

test("count up lands exactly on what they paid", () => {
  for (const seed of seeds) {
    for (const difficulty of ["easy", "medium", "hard"]) {
      for (const c of R.newShift(seed, { difficulty, round: "chill" }).customers.filter((x) => !x.short)) {
        const steps = R.countUp(c.price, c.paid, R.DRAWERS[difficulty]);
        assert.ok(steps.length, `${c.price} to ${c.paid}`);
        assert.equal(steps.at(-1).total, c.paid);
        assert.equal(steps.reduce((t, s) => t + s.piece, 0), c.paid - c.price);
      }
    }
  }
  assert.deepEqual(R.countUp(730, 1000, R.DRAWERS.medium).map((s) => s.piece), [10, 10, 25, 25, 100, 100]);
});

// A bot plays a Chill round: it serves each customer after `ms`, giving `pick`.
function chill(seed, difficulty, { ms, pick, cover = true }) {
  const s = R.newState(R.newShift(seed, { difficulty, round: "chill" }));
  let t = 0;
  const rng = createRng(`${seed}:bot`);
  while (s.current) {
    t += ms;
    if (s.current.short) R.decideShort(s, cover, t);
    else R.give(s, pick(s.current, rng, difficulty), t);
  }
  R.guessDrawer(s, R.drawerState(s));
  return R.score(s);
}
const exact = (c) => c.paid - c.price;
const spam = (c, rng, d) => Array.from({ length: rng.int(1, 6) }, () => rng.pick(R.DRAWERS[d])).reduce((a, b) => a + b, 0);

test("acceptance: random coin spamming scores lower than slow, accurate play", () => {
  for (const seed of seeds) {
    for (const d of ["easy", "medium", "hard"]) {
      const slow = chill(seed, d, { ms: 20000, pick: exact });
      const fast = chill(seed, d, { ms: 2000, pick: spam });
      assert.ok(slow.score > fast.score, `${seed} ${d}: ${slow.score} vs ${fast.score}`);
    }
  }
});

test("acceptance: always covering the short customer and always refusing average about the same", () => {
  for (const d of ["medium", "hard"]) {
    const avg = (cover) => seeds.reduce((t, seed) => t + chill(seed, d, { ms: 8000, pick: exact, cover }).score, 0) / seeds.length;
    const yes = avg(true);
    const no = avg(false);
    assert.ok(Math.abs(yes - no) <= 3, `${d}: cover ${yes} vs refuse ${no}`);
  }
});

test("wrong change stays in the drawer, and the guess is checked", () => {
  const s = R.newState(R.newShift("drawer", { difficulty: "easy", round: "chill" }));
  const want = R.changeDue(s.current);
  const sale = R.give(s, want + 100, 1000);
  assert.equal(sale.ok, false);
  assert.equal(s.drawer, -100, "giving $1 too much leaves the drawer $1 short");
  assert.equal(R.drawerState(s), "short");
  assert.match(R.drawerLines(s)[0], /^Short \$1\.00\./);
  assert.ok(R.guessDrawer(s, "short"));
  assert.equal(R.score(s).score, C.guessBonus);
});

test("a Speed round is 3:00 and customers keep coming, with one rush of three", () => {
  assert.equal(C.speedSeconds, 180);
  const s = R.newState(R.newShift("rush", { difficulty: "easy", round: "speed" }));
  let rush = 0;
  for (let t = 0; t <= 180000; t += 1000) {
    if (R.tick(s, t).rush) rush++;
    if (s.current && t % 4000 === 0) R.give(s, R.changeDue(s.current), t);
  }
  assert.equal(rush, 1);
  assert.ok(s.served >= 30, `served ${s.served}`);
  assert.ok(R.tipFor(1) === C.tipMax && R.tipFor(0) === 0);
});
