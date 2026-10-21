import { test } from "node:test";
import assert from "node:assert/strict";
import * as onboarding from "../js/data/onboarding.js";
import * as creatures from "../js/data/creatures.js";

function strings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}

test("student-facing onboarding text has no em-dashes or semicolons", () => {
  for (const s of strings([onboarding, creatures])) {
    assert.ok(!s.includes("—"), `em-dash in: ${s}`);
    assert.ok(!s.includes(";"), `semicolon in: ${s}`);
  }
});

test("the tutorial shift has enough items and every item has a reason", () => {
  assert.ok(onboarding.SHIFT_ITEMS.length >= onboarding.SHIFT_ITEMS_PER_SHIFT);
  for (const it of onboarding.SHIFT_ITEMS) {
    assert.ok(["asset", "liability"].includes(it.answer));
    assert.ok(it.why.length > 10);
  }
});

test("the factor tour covers all 5 factors", () => {
  assert.deepEqual(onboarding.FACTOR_TOUR.map((f) => f.key).sort(), ["length", "mix", "newCredit", "owed", "payment"]);
});

test("name ideas: lots of them, short enough, and dealt with no repeats", async () => {
  const { NAME_IDEAS, LAST_NAME_IDEAS, NAME_MAX, nextIdea } = creatures;
  assert.ok(NAME_IDEAS.length >= 150 && LAST_NAME_IDEAS.length >= 100);
  for (const list of [NAME_IDEAS, LAST_NAME_IDEAS]) {
    assert.equal(new Set(list).size, list.length);
    for (const n of list) assert.ok(n.length <= NAME_MAX, n);
    // One full deck shows every name once, and the next deck doesn't start with the last name.
    let bag = [];
    let current = "";
    const seen = [];
    for (let i = 0; i < list.length; i++) {
      ({ pick: current, bag } = nextIdea(list, bag, current));
      seen.push(current);
    }
    assert.equal(new Set(seen).size, list.length);
    const next = nextIdea(list, bag, current);
    assert.notEqual(next.pick, current);
  }
});
