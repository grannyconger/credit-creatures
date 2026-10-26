// Phish Tank's rules and acceptance tests (GAME-SPECS.md game 5).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as F from "../js/arcade/phish.js";
import { PHISH_TEMPLATES, PHISH_CHAIN, PHISH_HACKED, PHISH_FALLOUT } from "../js/data/arcade/phish.js";
import { CONFIG } from "../js/data/config.js";

const seeds = Array.from({ length: 30 }, (_, i) => `ph-${i}`);
const run = (seed, pick) => F.score(F.play(seed, pick));

test("at least 80 different messages, each 25 words or less, with red flags only on scams", () => {
  const all = [...PHISH_TEMPLATES, ...PHISH_CHAIN, PHISH_HACKED, ...PHISH_FALLOUT];
  let count = 0;
  for (const t of all) {
    for (const a of t.a || [null]) {
      count++;
      const text = F.plain(String(t.text).replaceAll("{a}", a ?? ""));
      assert.ok(text.split(/\s+/).length <= 25, `${t.id}: ${text}`);
      assert.ok(!text.includes("—") && !text.includes(";"), t.id);
      const fill = (x) => String(x).replaceAll("{a}", a ?? "");
      const flags = F.parts(fill(t.text)).filter((p) => p.flag).length + F.parts(fill(t.sender)).filter((p) => p.flag).length;
      if (t.scam) assert.ok(flags >= 2, `${t.id} needs 2 or 3 red flags`);
      else assert.equal(flags, 0, `${t.id} is real, so no red flags`);
    }
  }
  assert.ok(count >= 80, `${count} messages`);
});

test("each shift deals 18 messages, 35 to 40 percent real, with the romance chain and a hacked friend", () => {
  for (const seed of seeds) {
    const d = F.newShift(seed);
    assert.equal(d.msgs.length, CONFIG.arcade.games.phish.messages);
    const real = d.msgs.filter((m) => !m.scam).length / d.msgs.length;
    assert.ok(real >= 0.3 && real <= 0.45, `${seed}: ${real}`);
    assert.equal(d.msgs.filter((m) => m.kind === "Romance scam").length, 3);
    assert.ok(d.msgs.some((m) => m.id === "hacked"));
    const gaps = d.msgs.slice(1).map((m, i) => m.arriveAt - d.msgs[i].arriveAt);
    assert.ok(gaps[0] > gaps.at(-1), "messages arrive faster as the shift goes");
  }
});

test("Verify with the official app always resolves right, calling the number in a scam counts as trusting it", () => {
  const s = F.newState(F.newShift("verify", { timed: false }));
  F.advance(s, 0);
  const m = s.queue[0];
  assert.equal(F.act(s, m.uid, "verifyApp").correct, true);
  F.advance(s, 1);
  const scam = s.deal.msgs.find((x) => x.scam && !x.shownAt);
  s.queue = [scam];
  const rec = F.act(s, scam.uid, "verifyCall");
  assert.equal(rec.correct, false);
  assert.equal(rec.loss, scam.loss);
});

test("trusting a credential scam is an account takeover: a lockdown and two confused friends", () => {
  const s = F.newState(F.newShift("take", { timed: false }));
  const cred = s.deal.msgs.find((m) => m.scam && m.credential);
  s.queue = [cred];
  const rec = F.act(s, cred.uid, "trust");
  assert.ok(rec.takeover);
  assert.ok(s.lock);
  assert.equal(F.act(s, "nope", "trust"), null, "the queue is blocked during the lockdown");
  for (let i = 0; i < CONFIG.arcade.games.phish.lockTaps; i++) F.lockTap(s);
  assert.equal(s.lock, null);
  assert.deepEqual(s.deal.msgs.slice(s.next, s.next + 2).map((m) => m.kind), ["Confused friend", "Confused friend"]);
});

test("red flags count only after a right Block, once each", () => {
  const s = F.newState(F.newShift("flags", { timed: false }));
  const scam = s.deal.msgs.find((m) => m.scam && m.flags.length >= 2);
  s.queue = [scam];
  F.act(s, scam.uid, "block");
  assert.ok(F.flagTap(s, scam.uid, 0));
  assert.ok(!F.flagTap(s, scam.uid, 0));
  assert.ok(F.flagTap(s, scam.uid, 1));
  assert.equal(F.score(s).flags, 2);
});

test("acceptance: Block everything scores below thoughtful play", () => {
  for (const seed of seeds) assert.ok(run(seed, F.blockAllPick).score < run(seed, F.thoughtfulPick).score, seed);
});

test("acceptance: Verify everything overflows the queue and lets real messages expire", () => {
  const expired = seeds.filter((seed) => run(seed, F.verifyAllPick).missed > 0).length;
  assert.ok(expired >= seeds.length * 0.75, `${expired} of ${seeds.length}`);
  for (const seed of seeds) assert.ok(run(seed, F.verifyAllPick).score < run(seed, F.thoughtfulPick).score, seed);
});

test("acceptance: Trust everything scores lowest", () => {
  const lowest = seeds.filter((seed) => {
    const t = run(seed, F.trustAllPick).score;
    return t < run(seed, F.blockAllPick).score && t < run(seed, F.verifyAllPick).score && t < run(seed, F.thoughtfulPick).score;
  }).length;
  assert.ok(lowest >= seeds.length * 0.8, `${lowest} of ${seeds.length}`);
  const avg = (pick) => seeds.reduce((t, seed) => t + run(seed, pick).score, 0) / seeds.length;
  assert.ok(avg(F.trustAllPick) < avg(F.blockAllPick));
});
