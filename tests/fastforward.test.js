import { test } from "node:test";
import assert from "node:assert/strict";
import { E } from "./helpers.js";
import * as P from "../js/play.js";
import { CONFIG } from "../js/data/config.js";
import { fastForward } from "../js/fastforward.js";
import { claimFastForwards } from "../js/daily.js";
import { hasFeature, stageOf } from "../js/progression.js";

const fresh = (seed) => ({ play: P.newPlay({ phased: true }), life: E.createLife({ seed, ageMonths: CONFIG.onboarding.startAgeMonths }) });

test("a brand new save can be moved to the end of Chapter 4, with XP, history and a replayable log", () => {
  for (const seed of ["ff-a", "ff-b", "ff-c", "ff-d"]) {
    const { play, life } = fresh(seed);
    const r = fastForward(play, life, { through: 4 });
    assert.ok(r, `${seed} did not finish`);
    assert.equal(play.chapter, 5);
    assert.equal(play.active, null);
    assert.equal(play.summary, null);
    assert.deepEqual(play.history.map((h) => h.chapter), [1, 2, 3, 4]);
    assert.ok(play.prologue.done);
    assert.equal(stageOf(play), 5);
    assert.ok(hasFeature(play, "score", r.life));
    const perChapter = CONFIG.pacing.xp.chapterDone + CONFIG.pacing.monthsPerChapter * CONFIG.pacing.xp.month + CONFIG.pacing.xp.answersPerChapter;
    assert.ok(play.xp >= perChapter * 4, `${seed}: only ${play.xp} XP`);
    assert.equal(JSON.stringify(E.replayLife(r.life.start, r.life.log)), JSON.stringify({ ...r.life, log: E.replayLife(r.life.start, r.life.log).log }), `${seed}: log should replay`);
    assert.ok(r.life.score != null, "Chapter 4 opens the score");
  }
});

test("a save already past the chapter is left alone, and a failed jump changes nothing", () => {
  const { play, life } = fresh("ff-late");
  assert.ok(fastForward(play, life, { through: 4 }));
  const snap = JSON.stringify(play);
  assert.equal(fastForward(play, life, { through: 4 }), null);
  assert.equal(JSON.stringify(play), snap);
});

test("the fast-forward is claimed once, by the right email and creature name only", () => {
  const list = [{ id: "ff1", email: "Teacher@school.org", creatureName: "Coco", through: 4 }];
  const a = fresh("ff-claim");
  assert.equal(claimFastForwards(a.play, a.life, { email: "other@school.org", creatureName: "Coco" }, 3, list), null);
  assert.equal(claimFastForwards(a.play, a.life, { email: "teacher@school.org", creatureName: "Pebble" }, 3, list), null);
  assert.equal(a.play.chapter, 1);
  const r = claimFastForwards(a.play, a.life, { email: "teacher@school.org", creatureName: "Coco" }, 3, list);
  assert.ok(r);
  assert.equal(a.play.chapter, 5);
  assert.ok(a.play.grants.includes("ff1"));
  assert.equal(claimFastForwards(a.play, r.life, { email: "teacher@school.org", creatureName: "Coco" }, 3, list), null);
});
