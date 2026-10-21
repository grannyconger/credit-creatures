import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { lifeWith } from "./helpers.js";
import * as P from "../js/play.js";
import { PLACES, placeStatus, nextStep } from "../js/places.js";
import { ICON_NAMES } from "../js/ui/icons.js";
import { HUB_HELP, INTRO_PANELS } from "../js/data/story.js";

function jsFiles(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) jsFiles(p, out);
    else if (p.endsWith(".js")) out.push(p);
  }
  return out;
}

test("every icon name written in the code exists in the icon set", () => {
  const used = new Set();
  for (const f of jsFiles("js")) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/\bicon(?:Svg)?\(\s*"([a-zA-Z]+)"/g)) used.add(m[1]);
    for (const m of src.matchAll(/\biconName:\s*"([a-zA-Z]+)"/g)) used.add(m[1]);
  }
  for (const pl of PLACES) used.add(pl.icon);
  assert.ok(used.size > 10);
  for (const name of used) assert.ok(ICON_NAMES.includes(name), `missing icon: ${name}`);
});

test("the kingdom has ten places, each with a route, a feature, a spot on the map and plain text", async () => {
  const { FEATURES } = await import("../js/progression.js");
  assert.equal(PLACES.length, 10);
  assert.equal(new Set(PLACES.map((p) => p.id)).size, 10);
  for (const p of PLACES) {
    assert.ok(p.route && p.name && p.does, p.id);
    assert.ok(FEATURES[p.feature], `${p.id} has a feature`);
    assert.ok(p.x > 0 && p.x < 100 && p.y > 0 && p.y < 100, p.id);
    assert.ok(!/[—;]/.test(p.does + p.name), p.id);
  }
  assert.ok(!/[—;]/.test(HUB_HELP));
  assert.equal(INTRO_PANELS.length, 3);
});

const life = () => lifeWith({ seed: "places", checking: 500 });

test("before a chapter starts: Town Hall says what to do and the Guild waits", () => {
  const play = P.newPlay();
  const s = placeStatus({ life: life(), play, creature: { name: "Pip" }, classInfo: { releasedChapter: 2 } });
  assert.equal(s.townhall.text, "Chapter 2 is open");
  assert.equal(s.guild.tone, "off");
  assert.equal(s.cottage.text, "Pick your creature's dream");
  assert.match(nextStep({ play, classInfo: { releasedChapter: 2 }, status: s }), /Start it at Town Hall/);
  const waiting = placeStatus({ life: life(), play, creature: { dream: "home" }, classInfo: { releasedChapter: 1 } });
  assert.equal(waiting.townhall.text, "Waiting for your teacher");
  assert.match(waiting.cottage.text, /Dream \d+% there/);
  assert.match(nextStep({ play, classInfo: { releasedChapter: 1 }, status: waiting }), /teacher opens the next chapter/);
});

test("during a month: decisions first, then shifts, then End Month", () => {
  const l = life();
  const play = P.newPlay();
  P.startChapter(play, l);
  const ci = { releasedChapter: 2 };
  let s = placeStatus({ life: l, play, creature: { dream: "home" }, classInfo: ci });
  assert.match(s.townhall.text, /decisions? waiting/);
  assert.ok(s.townhall.count > 0);
  assert.match(nextStep({ play, classInfo: ci, status: s }), /Town Hall/);

  // Every card done: the Guild is next while shifts are left.
  if (play.active.month.life) play.active.month.life.done = true;
  for (const c of play.active.month.cards) c.done = true;
  s = placeStatus({ life: l, play, creature: { dream: "home" }, classInfo: ci });
  assert.equal(s.townhall.text, "Ready for End Month");
  assert.ok(s.guild.count > 0);
  assert.match(nextStep({ play, classInfo: ci, status: s }), /Guild Hall/);

  play.active.month.shifts = 99;
  s = placeStatus({ life: l, play, creature: { dream: "home" }, classInfo: ci });
  assert.equal(s.guild.text, "Done for this month");
  assert.match(nextStep({ play, classInfo: ci, status: s }), /End the month at Town Hall/);
});

test("a paused class and closed social show as off", () => {
  const play = P.newPlay();
  const ci = { releasedChapter: 2, paused: true, social: false };
  const s = placeStatus({ life: life(), play, creature: {}, classInfo: ci });
  assert.equal(s.townhall.tone, "off");
  assert.equal(s.plaza.tone, "off");
  assert.match(nextStep({ play, classInfo: ci, status: s }), /paused/);
});

test("old saves get the dream and settings fields", () => {
  const old = P.ensurePlay({ chapter: 3, active: null, summary: null, history: [], seen: [], theme: "night" });
  assert.equal(old.dreamDone, null);
  assert.deepEqual(old.settings, { appearance: "dark", reading: "standard" });
  assert.equal(P.ensurePlay({ chapter: 3, active: null, summary: null, history: [], seen: [] }).settings, null);
});

test("onboarding starts with the story and asks for a dream after the creature", async () => {
  const { STEPS, EDITABLE, HUB_SCREENS } = await import("../js/game.js");
  assert.equal(STEPS[0], "intro");
  assert.equal(STEPS.indexOf("dream"), STEPS.indexOf("creature") + 1);
  assert.ok(EDITABLE.has("dream"));
  for (const p of PLACES) assert.ok(HUB_SCREENS.has(p.route), p.route);
});

test("lessons cover every unlock, follow the text rules and have fair quizzes", async () => {
  const { LESSONS, LESSON_ORDER, GUIDE } = await import("../js/data/lessons.js");
  const { UNLOCKS, FEATURES } = await import("../js/progression.js");
  assert.ok(GUIDE.name && GUIDE.look.species);
  for (const u of Object.values(UNLOCKS)) if (u.lesson) assert.ok(LESSONS[u.lesson], u.lesson);
  assert.deepEqual([...LESSON_ORDER].sort(), Object.keys(LESSONS).sort());
  for (const [id, lesson] of Object.entries(LESSONS)) {
    assert.ok(FEATURES[lesson.feature], `${id} feature`);
    for (const s of lesson.steps) {
      const words = [s.title, ...s.text, s.quiz?.q || "", ...(s.quiz?.choices || []), s.quiz?.why || ""];
      for (const w of words) assert.ok(!w.includes("—") && !w.includes(";"), w);
      if (s.quiz) assert.ok(s.quiz.answer >= 0 && s.quiz.answer < s.quiz.choices.length, s.title);
      // A lesson may only click tabs, never something that changes the game.
      if (s.click) assert.match(s.click.sel, /acct-tabs/, s.title);
    }
  }
});
