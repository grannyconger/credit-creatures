// Move-In Day's rules and acceptance tests (GAME-SPECS.md game 14, re-themed for standard E).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as M from "../js/arcade/movein.js";
import { MI_UNITS, MI_GOTCHAS, MI_ROOMMATES, MI_EVENTS } from "../js/data/arcade/movein.js";
import { ARCADE } from "../js/data/arcade/index.js";

const seeds = Array.from({ length: 20 }, (_, i) => `mi-${i}`);
const play = (seed, bot) => M.play(seed, M.BOTS[bot]);

test("content: 12 units, 12 gotchas, 10 roommates, 15 events, and standard E", () => {
  assert.equal(MI_UNITS.length, 12);
  assert.equal(MI_GOTCHAS.length, 12);
  assert.equal(MI_ROOMMATES.length, 10);
  assert.equal(MI_EVENTS.length, 15);
  assert.ok(ARCADE.movein.standards.some((s) => s.startsWith("E")));
});

test("the same seed deals the same shift, and the bigger aid total usually hides the higher net price", () => {
  assert.deepEqual(JSON.stringify(M.newShift("x")), JSON.stringify(M.newShift("x")));
  let trap = 0;
  for (const seed of seeds) {
    const d = M.newShift(seed);
    const hi = 1 - d.cheaper;
    if (d.schools[hi].totalAid > d.schools[d.cheaper].totalAid) trap++;
    for (const sc of d.schools) assert.equal(sc.net, sc.coa - sc.free);
  }
  assert.ok(trap >= 15, `trap ${trap}`);
});

test("the move-in total, the income rule and the roommate halving", () => {
  const s = M.newState(M.newShift("rules"));
  const u = { rent: 900 };
  assert.equal(M.moveInTotal(s, u), 1850);
  assert.equal(M.incomeOk(s, { rent: 1000 }), false);
  M.setMate(s, true);
  assert.equal(M.yourRent(s, { rent: 1000 }), 500);
  assert.equal(M.incomeOk(s, { rent: 1000 }), true);
});

test("photographed damage is protected at move-out", () => {
  const a = play("photo", "balanced");
  const b = M.play("photo", { ...M.BOTS.balanced, photos: false });
  if (!a.backup) assert.ok(M.year(a).back > M.year(b).back);
});

test("acceptance: never inspecting leads to hidden problem costs on most seeds", () => {
  const hit = seeds.filter((seed) => M.year(play(seed, "neverInspect")).problems.length > 0).length;
  assert.ok(hit > seeds.length / 2, `hit ${hit}`);
});

test("acceptance: inspecting every spot on both units loses both to applicants on most seeds", () => {
  const lost = seeds.filter((seed) => play(seed, "inspectAll").backup).length;
  assert.ok(lost > seeds.length / 2, `lost ${lost}`);
});

test("acceptance: a balanced player outscores a careless one and never inspecting on average", () => {
  const avg = (bot) => seeds.reduce((t, seed) => t + M.score(play(seed, bot)).score, 0) / seeds.length;
  assert.ok(avg("balanced") > avg("neverInspect"));
  assert.ok(avg("neverInspect") > avg("careless"));
});

test("acceptance: a timed shift fits in 3 to 4 minutes", async () => {
  const { CONFIG } = await import("../js/data/config.js");
  const c = CONFIG.arcade.games.movein;
  const longest = c.schoolSeconds + 15 + c.tourSeconds + c.leaseSeconds + c.photoSeconds + c.events * c.cardSeconds;
  assert.ok(longest >= 180 && longest <= 240, `${longest} s`);
});
