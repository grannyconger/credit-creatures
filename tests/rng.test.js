import { test } from "node:test";
import assert from "node:assert/strict";
import { createRng, rngOn, seedFrom } from "../js/engine/rng.js";

test("same seed gives the same sequence", () => {
  const a = createRng("moss-dragon");
  const b = createRng("moss-dragon");
  for (let i = 0; i < 100; i++) assert.equal(a.next(), b.next());
});

test("different seeds give different sequences", () => {
  const a = createRng(1);
  const b = createRng(2);
  assert.notEqual(a.next(), b.next());
});

test("values stay in range", () => {
  const r = createRng("range");
  for (let i = 0; i < 1000; i++) {
    const v = r.next();
    assert.ok(v >= 0 && v < 1);
    const n = r.int(40, 120);
    assert.ok(Number.isInteger(n) && n >= 40 && n <= 120);
  }
});

test("saved state resumes the sequence exactly", () => {
  const holder = { rng: seedFrom("save") };
  const r = rngOn(holder);
  r.next();
  r.next();
  const saved = JSON.parse(JSON.stringify(holder));
  const expected = [r.next(), r.next(), r.next()];
  const resumed = rngOn(saved);
  assert.deepEqual([resumed.next(), resumed.next(), resumed.next()], expected);
});
