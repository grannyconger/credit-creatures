import { test } from "node:test";
import assert from "node:assert/strict";
import { LOOK_SLOTS, LOOK_OPTIONS, isUnlocked, lockText, newlyUnlocked, publicLook, setField, getField } from "../js/data/looks.js";
import { creatureSvg } from "../js/ui/creature-art.js";
import { SHOP_ITEMS } from "../js/data/shop.js";
import { ACHIEVEMENT_BY_ID } from "../js/data/achievements.js";
import * as P from "../js/play.js";

const base = { species: "mossDragon", palette: "moss", accessories: {} };

test("every look option draws something different from the plain creature", () => {
  for (const sl of LOOK_SLOTS) {
    if (sl.key === "background") continue; // drawn by CSS behind the creature
    for (const o of LOOK_OPTIONS[sl.key]) {
      if (o.id === sl.none) continue;
      const c = structuredClone(base);
      setField(c, sl.field, o.id);
      if (sl.key === "species" && o.id === "mossDragon") continue;
      if (sl.key === "palette" && o.id === "moss") continue;
      assert.notEqual(creatureSvg(c), creatureSvg(base), `${sl.key}:${o.id}`);
    }
  }
});

test("there are lots of looks, with every unlock type and a reachable requirement", () => {
  const all = Object.values(LOOK_OPTIONS).flat();
  assert.ok(all.length >= 100, `${all.length} looks`);
  assert.ok(all.some((o) => o.unlock?.xp) && all.some((o) => o.unlock?.achievement) && all.some((o) => o.unlock?.shop));
  for (const o of all.filter((x) => x.unlock?.achievement)) assert.ok(ACHIEVEMENT_BY_ID[o.unlock.achievement], o.id);
  for (const i of SHOP_ITEMS) assert.ok(LOOK_OPTIONS[i.kind].some((o) => o.id === i.id), `shop item ${i.id} appears in the editor`);
  for (const o of all) assert.ok(!o.name.includes("—") && !o.name.includes(";"), o.name);
  for (const k of ["cloudBunny", "shellTurtle"]) assert.ok(LOOK_OPTIONS.species.find((o) => o.id === k).unlock.xp > 0, k);
});

test("looks unlock with XP, achievements and shop purchases", () => {
  const play = P.newPlay();
  const bunny = LOOK_OPTIONS.species.find((o) => o.id === "cloudBunny");
  const cap = LOOK_OPTIONS.head.find((o) => o.id === "graduationCap");
  const hat = LOOK_OPTIONS.head.find((o) => o.id === "topHat");
  assert.ok(!isUnlocked(bunny, play) && !isUnlocked(cap, play) && !isUnlocked(hat, play));
  assert.match(lockText(bunny), /100 XP \(Squire\)/);
  assert.match(lockText(cap), /Seasoned/);
  play.xp = 100;
  play.achievements.seasoned = { month: 1, chapter: 4 };
  play.owned.push("topHat");
  assert.ok(isUnlocked(bunny, play) && isUnlocked(cap, play) && isUnlocked(hat, play));
});

test("new unlocks are announced once, and an old save isn't flooded the first time", () => {
  const play = P.newPlay();
  play.xp = 300;
  assert.deepEqual(newlyUnlocked(play), [], "first run marks what's already earned");
  play.xp = 600;
  const fresh = newlyUnlocked(play).map((o) => o.key);
  assert.ok(fresh.includes("head:vikingHelmet") && fresh.includes("pattern:sparkles"), fresh.join(","));
  assert.deepEqual(newlyUnlocked(play), []);
});

test("the public look carries every layer and fills in defaults", () => {
  const look = publicLook({ species: "shellTurtle", palette: "galaxy", pattern: "stars", accessories: { head: "halo", effect: "royalAura" } });
  assert.equal(look.species, "shellTurtle");
  assert.equal(look.accessories.effect, "royalAura");
  assert.equal(look.accessories.feet, "none");
  assert.ok(Object.keys(look).length <= 12, "firestore.rules allows up to 12 keys");
  assert.equal(getField(look, "accessories.head"), "halo");
  assert.equal(creatureSvg(look), creatureSvg(look), "same look, same drawing");
});
