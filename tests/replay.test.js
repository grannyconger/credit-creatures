import { test } from "node:test";
import assert from "node:assert/strict";
import { E } from "./helpers.js";
import { simulateLife } from "./sim/simulate.js";
import { STRATEGIES } from "./sim/strategies.js";

test("every play style replays from its seed and log to a byte-identical life", () => {
  for (const strategy of Object.keys(STRATEGIES)) {
    const { life } = simulateLife(strategy, `replay-${strategy}`, 36);
    const again = E.replayLife(life.start, life.log);
    assert.equal(JSON.stringify(again), JSON.stringify(life), strategy);
  }
});

test("a replay works from a saved copy of the life", () => {
  const { life } = simulateLife("average", "replay-saved", 18);
  const saved = JSON.parse(JSON.stringify(life));
  assert.equal(JSON.stringify(E.replayLife(saved.start, saved.log)), JSON.stringify(life));
});

test("onboarding (age 16, parent card, debit card, time skip, card) replays exactly", () => {
  let life = E.createLife({ seed: "onboard-replay", name: "Mossy", ageMonths: 192 });
  life = E.joinAsAuthorizedUser(life).life;
  life = E.getTeenDebitCard(life).life;
  life = E.earn(life, E.tutorialShiftPay(3), "first shift").life;
  life = E.debitPurchase(life, 12, "lantern oil").life;
  life = E.endMonth(life).life;
  life = E.timeSkip(life, 23).life;
  life = E.applyForCard(life, { issuer: "capitalOne", product: "premium", requestedLimit: 9000, design: "metal" }).life;
  life = E.applyForCard(life, { issuer: "discover", product: "secured", requestedLimit: 300, nickname: "Moss" }).life;
  life = E.addBill(life, "Phone", 45).life;
  assert.equal(JSON.stringify(E.replayLife(life.start, life.log)), JSON.stringify(life));
});

test("replay can stop partway through the log", () => {
  const { life } = simulateLife("careful", "replay-partial", 12);
  const firstEnd = life.log.findIndex((e) => e.action === "endMonth");
  const mid = E.replayLife(life.start, life.log, firstEnd + 1);
  assert.equal(mid.month, 1);
});

test("every logged entry names an action and its arguments", () => {
  const { life } = simulateLife("reckless", "replay-shape", 12);
  for (const e of life.log) {
    assert.equal(typeof e.action, "string");
    assert.ok(Array.isArray(e.args), e.action);
  }
  assert.equal(life.log.filter((e) => e.action === "endMonth").length, 12);
});

test("replay refuses an action it does not know", () => {
  const life = E.createLife({ seed: "x" });
  assert.throws(() => E.replayLife(life.start, [{ month: 0, action: "teleport", args: [] }]), /teleport/);
});
