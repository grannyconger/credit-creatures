// Feed Frenzy's rules and acceptance tests (GAME-SPECS.md game 6).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as F from "../js/arcade/feed.js";
import { FF_PERSONAS, FF_NEEDS, FF_WANTS, FF_TRIALS } from "../js/data/arcade/feed.js";

const seeds = Array.from({ length: 40 }, (_, i) => `ff-${i}`);
const run = (seed, p) => F.score(F.play(seed, p));

test("content: 15 personas and at least 80 post templates", () => {
  assert.equal(FF_PERSONAS.length, 15);
  assert.ok(Object.keys(FF_NEEDS).length + FF_WANTS.length + FF_TRIALS.length >= 80);
  for (const p of FF_PERSONAS) for (const k of p.needs) assert.ok(FF_NEEDS[k], `${p.name}: ${k}`);
});

test("each need shows first at a fake sale price, then again later for less", () => {
  for (const seed of seeds) {
    const d = F.newShift(seed);
    const posts = d.weeks.flat();
    assert.equal(posts.length, F.WEEKS * F.PER_WEEK);
    for (const k of d.persona.needs) {
      const ps = posts.filter((p) => p.need === k);
      assert.equal(ps.length, 2, `${seed}: ${k}`);
      const [first, later] = ps.sort((a, b) => Number(a.late) - Number(b.late));
      assert.ok(first.tricks.includes("wasNow"));
      assert.ok(later.price <= first.price, `${seed}: ${k} later ${later.price} vs first ${first.price}`);
      assert.ok(d.weeks.findIndex((w) => w.includes(later)) > d.weeks.findIndex((w) => w.includes(first)));
    }
    assert.equal(posts.filter((p) => p.kind === "trial").length, 1);
  }
});

test("a wishlisted post comes back next week with no tricks, and a trial charges unless canceled", () => {
  const s = F.newState(F.newShift("wish"));
  const p = F.current(s);
  F.decide(s, "wish");
  while (F.current(s)) F.decide(s, "skip");
  F.nextWeek(s);
  const back = s.queue.find((x) => x.from === p.id);
  assert.ok(back && back.tricks.length === 0 && back.price === p.price);
  const t = F.newState(F.newShift("trial"));
  let sawTrial = false;
  while (!t.done) {
    while (F.current(t)) F.decide(t, F.current(t).kind === "trial" ? ((sawTrial = true), "buy") : "skip");
    F.nextWeek(t);
  }
  assert.ok(sawTrial);
  assert.equal(t.charged.length, 1);
});

test("tapping a trick is +10, tapping the photo is -5", () => {
  const s = F.newState(F.newShift("tap"));
  while (!F.current(s).tricks.length) F.decide(s, "skip");
  const p = F.current(s);
  assert.ok(F.tapTrick(s, p.id, p.tricks[0]).ok);
  assert.ok(!F.tapTrick(s, p.id, null).ok);
  const sc = F.score(s);
  assert.equal(sc.spots, 1);
});

test("acceptance: skipping everything scores below thoughtful play", () => {
  for (const seed of seeds) assert.ok(run(seed, F.skipAllPolicy).score < run(seed, F.thoughtfulPolicy).score, seed);
});

test("acceptance: buying needs the moment they appear overpays on most seeds", () => {
  const worse = seeds.filter((seed) => run(seed, F.needsNowPolicy).savings < run(seed, F.thoughtfulPolicy).savings).length;
  assert.ok(worse >= seeds.length * 0.75, `${worse} of ${seeds.length}`);
});

test("acceptance: buying everything scores lowest", () => {
  const lowest = seeds.filter((seed) => run(seed, F.buyAllPolicy).score < Math.min(run(seed, F.skipAllPolicy).score, run(seed, F.thoughtfulPolicy).score, run(seed, F.needsNowPolicy).score)).length;
  assert.ok(lowest >= seeds.length * 0.85, `${lowest} of ${seeds.length}`);
});
