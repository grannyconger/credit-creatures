import { test } from "node:test";
import assert from "node:assert/strict";
import { changePieces, countUp } from "../js/ui/minigames/change.js";

test("change uses the fewest bills and coins", () => {
  assert.deepEqual(changePieces(352), [100, 100, 100, 25, 25, 1, 1]);
  assert.deepEqual(changePieces(1999), [1000, 500, 100, 100, 100, 100, 25, 25, 25, 10, 10, 1, 1, 1, 1]);
  assert.deepEqual(changePieces(0), []);
  for (let c = 1; c < 5000; c += 37) assert.equal(changePieces(c).reduce((a, b) => a + b, 0), c);
});

test("counting up goes from the price to what was paid, small coins first", () => {
  const steps = countUp(648, 1000);
  assert.deepEqual(steps.map((s) => s.piece), [1, 1, 25, 25, 100, 100, 100]);
  assert.deepEqual(steps.map((s) => s.total), [649, 650, 675, 700, 800, 900, 1000]);
  assert.equal(countUp(1234, 2000).at(-1).total, 2000);
});
