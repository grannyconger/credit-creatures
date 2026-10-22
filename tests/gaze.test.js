import { test } from "node:test";
import assert from "node:assert/strict";
import { lookAt } from "../js/ui/motion/gaze.js";
import { creatureSvg } from "../js/ui/creature-art.js";
import { SPECIES } from "../js/data/creatures.js";

test("pupils look toward the pointer and never leave the eye", () => {
  const right = lookAt(100, 100, 400, 100, 3);
  assert.equal(right.x, 3);
  assert.equal(right.y, 0);
  const near = lookAt(100, 100, 140, 100, 3);
  assert.ok(near.x > 0 && near.x < 3, "closer targets move the pupil less");
  const diag = lookAt(0, 0, -500, -500, 4);
  assert.ok(Math.hypot(diag.x, diag.y) <= 4 + 1e-9);
  assert.ok(diag.x < 0 && diag.y < 0);
  assert.deepEqual(lookAt(5, 5, 5, 5, 3), { x: 0, y: 0 });
});

test("open eyes have a white and a pupil, drawn eyes only blink", () => {
  const base = { species: "lanternFox", palette: "moss", accessories: {} };
  for (const eyes of ["round", "sparkle", "starry"]) {
    const svg = creatureSvg({ ...base, eyes });
    assert.equal((svg.match(/class="cc-pupil"/g) || []).length, 2, eyes);
    assert.equal((svg.match(/data-max="/g) || []).length, 2, eyes);
  }
  for (const eyes of ["happy", "sleepy"]) {
    const svg = creatureSvg({ ...base, eyes });
    assert.equal((svg.match(/class="cc-pupil"/g) || []).length, 0, eyes);
    assert.equal((svg.match(/class="cc-eye"/g) || []).length, 2, eyes);
  }
  const wink = creatureSvg({ ...base, eyes: "wink" });
  assert.equal((wink.match(/class="cc-pupil"/g) || []).length, 1);
});

test("big drawings get storybook detail, small avatars stay light, and both are stable", () => {
  for (const species of Object.keys(SPECIES)) {
    const look = { species, palette: "ember", accessories: {}, pattern: "spots" };
    const big = creatureSvg(look, { size: 220 });
    const small = creatureSvg(look, { size: 40 });
    assert.ok(big.includes(`id="cc-${species}-shade"`) && big.includes("cc-full"), species);
    assert.ok(!small.includes("<defs>") && !small.includes("cc-full"), species);
    assert.equal(creatureSvg(look, { size: 220 }), big, `${species}: same look, same drawing`);
    assert.equal(creatureSvg(look, { size: 40, detail: "full" }).includes("cc-full"), true, "detail can be forced");
  }
});
