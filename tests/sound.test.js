import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { EVENTS, SOUND_EVENTS, MASTER_VOLUME, CALM_VOLUME, PITCH_SPREAD, pitchFor, allowPlay, sfx } from "../js/ui/sound.js";

const NAMED = ["tap", "coinGain", "coinLoss", "levelUp", "questComplete", "chestOpen", "purchase", "error", "creditScoreUp", "creditScoreDown"];

test("every named sound event exists and has a small .ogg and .m4a file", () => {
  for (const name of NAMED) assert.ok(SOUND_EVENTS.includes(name), `missing event ${name}`);
  for (const [name, ev] of Object.entries(EVENTS)) {
    assert.equal(typeof sfx[name], "function", `sfx.${name}`);
    for (const ext of ["ogg", "m4a"]) {
      const path = new URL(`../sounds/${ev.file}.${ext}`, import.meta.url);
      assert.ok(existsSync(path), `sounds/${ev.file}.${ext}`);
      assert.ok(statSync(path).size < 40 * 1024, `sounds/${ev.file}.${ext} is over 40 KB`);
    }
    assert.ok(ev.volume > 0 && ev.volume <= 1, `${name} volume`);
    assert.ok(ev.gap >= 50, `${name} gap`);
  }
});

test("volume stays low and the calm volume is lower", () => {
  assert.ok(MASTER_VOLUME <= 0.5);
  assert.ok(CALM_VOLUME < MASTER_VOLUME);
});

test("pitch varies by at most 5% either way", () => {
  assert.equal(pitchFor(0.5), 1);
  assert.ok(Math.abs(pitchFor(0) - (1 - PITCH_SPREAD)) < 1e-9);
  assert.ok(pitchFor(0.9999) <= 1 + PITCH_SPREAD);
  assert.ok(PITCH_SPREAD <= 0.05);
});

test("the same event can't fire again inside its gap", () => {
  const gap = EVENTS.levelUp.gap;
  assert.equal(allowPlay("levelUp", 10_000), true);
  assert.equal(allowPlay("levelUp", 10_000 + gap - 1), false);
  assert.equal(allowPlay("levelUp", 10_000 + gap), true);
  assert.equal(allowPlay("nope", 0), false);
});
