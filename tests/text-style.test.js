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
