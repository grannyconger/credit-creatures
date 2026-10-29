// The Shop (SPEC §18): creature accessories and backgrounds. Stock rotates
// each chapter, with one limited item and one big-ticket item.
// Plain language for a 15-year-old. No em-dashes, no semicolons.

import { createRng } from "../engine/index.js";

// kind: "head" | "neck" | "face" | "held" | "feet" | "effect" | "background". Accessory ids are drawn by
// js/ui/creature-art.js and backgrounds by the .bg-<id> classes in css/app.css.
export const SHOP_ITEMS = [
  { id: "topHat", kind: "head", name: "Top hat", icon: "🎩", price: 45 },
  { id: "pirateHat", kind: "head", name: "Pirate hat", icon: "🏴‍☠️", price: 55 },
  { id: "flowerCrown", kind: "head", name: "Flower crown", icon: "🌸", price: 35 },
  { id: "pearls", kind: "neck", name: "Pearl necklace", icon: "📿", price: 60 },
  { id: "bandana", kind: "neck", name: "Bandana", icon: "🧣", price: 20 },
  { id: "starGlasses", kind: "face", name: "Star glasses", icon: "🤩", price: 40 },
  { id: "sunglasses", kind: "face", name: "Sunglasses", icon: "😎", price: 30 },
  { id: "wand", kind: "held", name: "Sparkle wand", icon: "🪄", price: 45 },
  { id: "mug", kind: "held", name: "Cocoa mug", icon: "☕", price: 20 },
  { id: "chefHat", kind: "head", name: "Chef hat", icon: "👨‍🍳", price: 35 },
  { id: "bow", kind: "head", name: "Big bow", icon: "🎀", price: 20 },
  { id: "tie", kind: "neck", name: "Necktie", icon: "👔", price: 25 },
  { id: "eyePatch", kind: "face", name: "Eye patch", icon: "🏴‍☠️", price: 15 },
  { id: "plant", kind: "held", name: "Potted sprout", icon: "🪴", price: 15 },
  { id: "rainBoots", kind: "feet", name: "Rain boots", icon: "🥾", price: 25 },
  { id: "rocketSneakers", kind: "feet", name: "Rocket sneakers", icon: "🚀", price: 70 },
  { id: "confetti", kind: "effect", name: "Confetti burst", icon: "🎊", price: 120 },
  { id: "meadow", kind: "background", name: "Meadow", icon: "🌼", price: 40 },
  { id: "beach", kind: "background", name: "Glimmer Bay beach", icon: "🏖️", price: 70 },
  { id: "library", kind: "background", name: "Cozy library", icon: "📚", price: 60 },
  { id: "market", kind: "background", name: "Market square", icon: "🏪", price: 50 },
  { id: "volcano", kind: "background", name: "Ember volcano", icon: "🌋", price: 90 },
  // Limited: each shows up for one chapter only.
  { id: "snowGlobe", kind: "background", name: "Snow globe", icon: "❄️", price: 75, limited: true },
  { id: "partyHat", kind: "head", name: "Party hat", icon: "🥳", price: 25, limited: true },
  { id: "lanternGlow", kind: "background", name: "Lantern festival", icon: "🏮", price: 85, limited: true },
  { id: "starryNight", kind: "background", name: "Starry night", icon: "🌌", price: 80, limited: true },
  // Big-ticket wants (SPEC §19: about one $300 to $600 want every couple of chapters).
  { id: "royalCrown", kind: "head", name: "Royal jeweled crown", icon: "👑", price: 450, big: true },
  { id: "dragonCape", kind: "neck", name: "Dragon-scale cape", icon: "🐉", price: 350, big: true },
  { id: "castle", kind: "background", name: "Your own castle", icon: "🏰", price: 600, big: true },
  { id: "rainbowBridge", kind: "background", name: "Rainbow bridge", icon: "🌈", price: 300, big: true },
];

export const SHOP_BY_ID = Object.fromEntries(SHOP_ITEMS.map((i) => [i.id, i]));

export const BACKGROUND_LABELS = { none: "Plain" };
for (const i of SHOP_ITEMS) if (i.kind === "background") BACKGROUND_LABELS[i.id] = i.name;

export const STOCK_SIZE = { regular: 5 };

// The stock: 5 regular items, 1 limited item (each limited item
// gets its own chapter in turn) and 1 big-ticket item. Same seed and chapter,
// same stock.
// day (a dayKey like "2026-10-29") makes the regular items and the big-ticket item change every
// day (teacher request 2026-10-29). The limited item stays for the whole chapter.
export function stockFor(seed, chapter, day = "") {
  const rng = createRng(`${seed}:shop:${chapter}${day ? `:${day}` : ""}`);
  const regular = SHOP_ITEMS.filter((i) => !i.limited && !i.big);
  const picks = [];
  while (picks.length < STOCK_SIZE.regular && regular.length) picks.push(regular.splice(Math.floor(rng.next() * regular.length), 1)[0]);
  const limited = SHOP_ITEMS.filter((i) => i.limited);
  const big = SHOP_ITEMS.filter((i) => i.big);
  return [...picks, limited[chapter % limited.length], big[Math.floor(rng.next() * big.length)]].map((i) => i.id);
}

// BNPL is offered only from this price up.
export const BNPL_MIN = 50;
