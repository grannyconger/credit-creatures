import { test } from "node:test";
import assert from "node:assert/strict";
import { DECOR, DECOR_BY_ID, SLOTS, DEFAULT_COTTAGE, STARTERS, cottageOf, ownedDecor } from "../js/data/cottage.js";
import { ROOM_OBJECTS } from "../js/data/cottage-objects.js";
import { PLACES } from "../js/places.js";

test("every piece belongs to a real slot and ids are unique", () => {
  const slots = new Set(SLOTS.map((s) => s.id));
  assert.equal(new Set(DECOR.map((d) => d.id)).size, DECOR.length);
  for (const d of DECOR) {
    assert.ok(slots.has(d.slot), d.id);
    assert.ok(Number.isInteger(d.price) && d.price >= 0, d.id);
  }
});

test("each slot has a free default and it is the starter", () => {
  for (const s of SLOTS) {
    const id = DEFAULT_COTTAGE[s.id];
    assert.equal(DECOR_BY_ID[id].slot, s.id);
    assert.equal(DECOR_BY_ID[id].price, 0);
    assert.ok(STARTERS.includes(id));
  }
});

test("cottageOf falls back for old or bad saves", () => {
  assert.deepEqual(cottageOf({}), DEFAULT_COTTAGE);
  assert.equal(cottageOf({ cottage: { rug: "rug-gold" } }).rug, "rug-gold");
  assert.equal(cottageOf({ cottage: { rug: "nope", floor: "rug-gold" } }).rug, DEFAULT_COTTAGE.rug);
  assert.equal(cottageOf({ cottage: { floor: "rug-gold" } }).floor, DEFAULT_COTTAGE.floor);
});

test("bought pieces and starters are owned", () => {
  const own = ownedDecor({ decorOwned: ["rug-gold"] });
  assert.ok(own.has("rug-gold") && own.has("wall-moss") && !own.has("rug-rust"));
});

test("room objects point at real places and stay inside the room", () => {
  const places = new Set(PLACES.map((p) => p.id));
  for (const o of ROOM_OBJECTS) {
    if (o.place) assert.ok(places.has(o.place), o.id);
    assert.ok(o.x >= 0 && o.y >= 0 && o.x + o.w <= 100 && o.y + o.h <= 100, o.id);
    assert.ok(o.route || o.place || o.act, o.id);
  }
});
