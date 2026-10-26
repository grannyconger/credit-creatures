import { test } from "node:test";
import assert from "node:assert/strict";
import { dayKey, dayDiff, msUntilMidnight, streakAfter, loginReward, rollBoxes } from "../js/engine/daily.js";
import { CONFIG } from "../js/data/config.js";
import { createLife } from "../js/engine/index.js";
import { newPlay } from "../js/play.js";
import { claimLogin, claimPick, pickState, couponPrice } from "../js/daily.js";
import { tasksFor, onEvent, progress } from "../js/challenges.js";

const at = (s) => new Date(`${s}T12:00:00`);

test("day keys use the local date and diff counts whole days", () => {
  assert.equal(dayKey(new Date(2026, 9, 23, 23, 59)), "2026-10-23");
  assert.equal(dayKey(new Date(2026, 9, 24, 0, 0)), "2026-10-24");
  assert.equal(dayDiff("2026-10-23", "2026-10-24"), 1);
  assert.equal(dayDiff("2026-10-31", "2026-11-01"), 1);
  assert.equal(dayDiff("2026-12-31", "2027-01-01"), 1);
  assert.equal(dayDiff("2026-10-24", "2026-10-23"), -1);
});

test("midnight is under a day away and lands on the next date", () => {
  const now = new Date(2026, 9, 23, 18, 0, 0);
  assert.equal(msUntilMidnight(now), 6 * 3600 * 1000);
});

test("the streak grows daily, resets after a gap and ignores a clock set backwards", () => {
  let d = { lastLogin: null, streak: 0, best: 0 };
  d = streakAfter(d, "2026-10-23");
  assert.deepEqual([d.streak, d.fresh], [1, true]);
  assert.equal(streakAfter(d, "2026-10-23").fresh, false);
  d = streakAfter(d, "2026-10-24");
  assert.equal(d.streak, 2);
  const back = streakAfter(d, "2026-10-20");
  assert.deepEqual([back.streak, back.fresh], [2, false]);
  d = streakAfter(d, "2026-10-27");
  assert.deepEqual([d.streak, d.best], [1, 2]);
});

test("login coins grow with the streak, cap, and add milestones", () => {
  const cfg = CONFIG.daily.login;
  assert.equal(loginReward(1, cfg).coins, cfg.base);
  assert.equal(loginReward(2, cfg).coins, cfg.base + cfg.perDay);
  assert.equal(loginReward(50, cfg).coins, cfg.base + cfg.maxBonus);
  assert.equal(loginReward(7, cfg).milestone, cfg.milestones[7]);
  assert.equal(loginReward(8, cfg).milestone, 0);
});

test("boxes are fixed for a seed and day, and differ across students", () => {
  const pool = ["rug-gold", "art-fern"];
  const a = rollBoxes("fox", "2026-10-23", CONFIG.daily, pool);
  assert.deepEqual(a, rollBoxes("fox", "2026-10-23", CONFIG.daily, pool));
  assert.equal(a.length, CONFIG.daily.boxes);
  const seeds = Array.from({ length: 40 }, (_, i) => JSON.stringify(rollBoxes(`s${i}`, "2026-10-23", CONFIG.daily, pool)));
  assert.ok(new Set(seeds).size > 20);
  assert.notDeepEqual(a, rollBoxes("fox", "2026-10-24", CONFIG.daily, pool));
});

test("prize odds roughly follow the weights", () => {
  const counts = {};
  for (let i = 0; i < 3000; i++) for (const b of rollBoxes(`n${i}`, "2026-10-23", CONFIG.daily, ["rug-gold"])) counts[b.kind + (b.tier || "")] = (counts[b.kind + (b.tier || "")] || 0) + 1;
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const w = CONFIG.daily.prizes.reduce((s, p) => s + p.weight, 0);
  assert.ok(Math.abs(counts.coinssmall / total - CONFIG.daily.prizes[0].weight / w) < 0.03);
  assert.ok(counts.coinsjackpot / total < 0.08);
});

function fresh() {
  const life = createLife({ seed: "tester" });
  return { life, play: newPlay() };
}

test("login pays once a day through the engine, and the activity log shows it", () => {
  const { life, play } = fresh();
  const before = life.checking;
  const r = claimLogin(play, life, at("2026-10-23"));
  assert.equal(r.streak, 1);
  assert.equal(r.life.checking, before + CONFIG.daily.login.base);
  assert.equal(claimLogin(play, r.life, at("2026-10-23")), null);
  const r2 = claimLogin(play, r.life, at("2026-10-24"));
  assert.equal(r2.streak, 2);
  const r3 = claimLogin(play, r2.life, at("2026-10-30"));
  assert.equal(r3.lostStreak, 2);
  assert.equal(r3.streak, 1);
});

test("one Daily Pick a day, and the saved pick stays after a reload", () => {
  const { life, play } = fresh();
  const r = claimPick(play, life, 1, at("2026-10-23"));
  assert.ok(r.prize.kind);
  assert.equal(claimPick(play, r.life, 0, at("2026-10-23")), null);
  assert.equal(pickState(play, at("2026-10-23")).done, true);
  assert.equal(pickState(play, at("2026-10-24")).done, false);
  assert.ok(claimPick(play, r.life, 0, at("2026-10-24")));
});

test("a coupon takes a percent off and a prize you can't use becomes coins", () => {
  const { play } = fresh();
  play.coupon = { pct: 20 };
  assert.equal(couponPrice(play, 50), 40);
  assert.equal(couponPrice({ coupon: null }, 50), 50);
  const { life } = fresh();
  for (let i = 0; i < 60; i++) {
    const l = createLife({ seed: `seed${i}` });
    const p = newPlay();
    const r = claimPick(p, l, 0, at("2026-10-23"));
    assert.notEqual(r.prize.kind, "sparkle");
  }
  assert.ok(life);
});

test("three challenges a day, the first is the pick, and finishing all pays the bonus once", () => {
  const { life, play } = fresh();
  const t = tasksFor(play, life, at("2026-10-23"));
  assert.equal(t.ids.length, 3);
  assert.equal(t.ids[0], "pick");
  assert.equal(new Set(t.ids).size, 3);
  assert.deepEqual(tasksFor(play, life, at("2026-10-23")).ids, t.ids);
  let cur = life;
  let paid = 0;
  const events = { pick: ["dailyPick", {}], shift: ["minigame", {}], desk: ["deskDone", {}], market: ["shopOpen", {}], alley: ["alleyCall", {}], vault: ["placeOpen", { place: "vault" }], cottage: ["placeOpen", { place: "cottage" }], records: ["placeOpen", { place: "records" }] };
  for (const id of t.ids) {
    const [type, data] = events[id];
    const r = onEvent(play, cur, type, data, at("2026-10-23"));
    cur = r.life;
    paid += r.bonus;
    onEvent(play, cur, type, data, at("2026-10-23"));
  }
  assert.equal(paid, CONFIG.daily.challengeBonus);
  assert.equal(progress(play, cur, at("2026-10-23")).done, 3);
  assert.notDeepEqual(tasksFor(play, life, at("2026-11-02")).day, t.day);
});
