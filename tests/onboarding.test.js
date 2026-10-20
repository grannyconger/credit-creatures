import { test } from "node:test";
import assert from "node:assert/strict";
import { E, deepFreeze } from "./helpers.js";
import { CONFIG } from "../js/data/config.js";

const teen = (seed = "teen") => E.createLife({ seed, ageMonths: CONFIG.onboarding.startAgeMonths });

test("the teen debit card is a flag only and builds no credit", () => {
  const life = deepFreeze(teen());
  const r = E.getTeenDebitCard(life);
  assert.ok(r.ok);
  assert.equal(r.life.teenDebit, true);
  assert.equal(life.teenDebit, false);
  assert.equal(r.life.accounts.length, 0);
  assert.equal(E.getTeenDebitCard(r.life).ok, false);
});

test("tutorial shift pay grows with correct answers", () => {
  assert.ok(E.tutorialShiftPay(4) > E.tutorialShiftPay(0));
  assert.equal(E.tutorialShiftPay(0), CONFIG.onboarding.tutorialShift.base);
});

test("the time skip ages the creature from 16 to 18 without changing its input", () => {
  const months = CONFIG.onboarding.cardAgeMonths - CONFIG.onboarding.startAgeMonths;
  const life = deepFreeze(teen());
  const r = E.timeSkip(life, months);
  assert.equal(r.life.ageMonths, CONFIG.onboarding.cardAgeMonths);
  assert.equal(r.life.month, months);
  assert.equal(life.month, 0);
  assert.ok(r.earned > 0 && r.spent > 0 && r.spent < r.earned);
  assert.equal(r.scoreChanges.length, months);
});

test("a teen with no parent card reaches 18 with no score, and enough saved for a secured deposit", () => {
  for (let i = 0; i < 20; i++) {
    const r = E.timeSkip(teen(`no-parent-${i}`), 24);
    assert.equal(r.life.score, null);
    assert.ok(r.life.checking >= 200, `checking ${r.life.checking}`);
  }
});

test("a parent's card gives the creature a score by 18, and the parent's habits show in it", () => {
  const at18 = (profile) => {
    const life = E.joinAsAuthorizedUser(teen(`parent-${profile}`), profile).life;
    return E.timeSkip(life, 24).life.score;
  };
  const responsible = at18("responsible");
  const maxed = at18("maxed");
  assert.ok(responsible != null && maxed != null);
  assert.ok(responsible > maxed + 50, `${responsible} vs ${maxed}`);
});

test("the time skip is deterministic", () => {
  const a = E.timeSkip(teen("same"), 10).life;
  const b = E.timeSkip(teen("same"), 10).life;
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});
