import { test } from "node:test";
import assert from "node:assert/strict";
import { simulateLife } from "./sim/simulate.js";

test("the same seed replays to a byte-identical life", () => {
  for (const strategy of ["careful", "reckless"]) {
    const a = simulateLife(strategy, "replay-42", 24);
    const b = simulateLife(strategy, "replay-42", 24);
    assert.equal(JSON.stringify(a.life), JSON.stringify(b.life));
  }
});

test("different seeds give different lives", () => {
  const a = simulateLife("average", "seed-a", 24);
  const b = simulateLife("average", "seed-b", 24);
  assert.notEqual(JSON.stringify(a.life), JSON.stringify(b.life));
});

test("a life survives a save and load round trip", () => {
  const a = simulateLife("average", "save-load", 12);
  const loaded = JSON.parse(JSON.stringify(a.life));
  assert.deepEqual(loaded, a.life);
});
