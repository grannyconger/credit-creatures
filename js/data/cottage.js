// The Creature Cottage room (docs/UI-REBUILD.md). The room has eight slots and
// each slot holds one piece. A piece is a name, a price in dollars and a
// variant the drawing in js/ui/cottage-art.js knows. One drawing makes several
// pieces by changing its palette, so new pieces cost almost nothing to add.
// Student text: plain words, no em-dashes, no semicolons.

export const SLOTS = [
  { id: "wallpaper", label: "Wallpaper", icon: "palette" },
  { id: "floor", label: "Floor", icon: "home" },
  { id: "rug", label: "Rug", icon: "card" },
  { id: "art", label: "Wall art", icon: "star" },
  { id: "lamp", label: "Lamp", icon: "lantern" },
  { id: "plant", label: "Plant", icon: "dream" },
  { id: "window", label: "Window view", icon: "compass" },
  { id: "shelf", label: "Shelf item", icon: "scroll" },
];

// Every slot starts with a free starter, or nothing for the extras.
// price 0 means you already own it.
export const DECOR = [
  { id: "wall-moss", slot: "wallpaper", name: "Mossy green wall", variant: "moss", price: 0 },
  { id: "wall-cream", slot: "wallpaper", name: "Cream wall", variant: "cream", price: 30 },
  { id: "wall-plum", slot: "wallpaper", name: "Plum wall", variant: "plum", price: 45 },
  { id: "wall-dots", slot: "wallpaper", name: "Polka dot wall", variant: "dots", price: 60 },
  { id: "wall-stripes", slot: "wallpaper", name: "Striped wall", variant: "stripes", price: 60 },

  { id: "floor-oak", slot: "floor", name: "Oak boards", variant: "oak", price: 0 },
  { id: "floor-slate", slot: "floor", name: "Slate tiles", variant: "slate", price: 40 },
  { id: "floor-moss", slot: "floor", name: "Mossy flagstones", variant: "moss", price: 40 },
  { id: "floor-checker", slot: "floor", name: "Checkerboard", variant: "checker", price: 70 },

  { id: "rug-none", slot: "rug", name: "No rug", variant: "none", price: 0 },
  { id: "rug-gold", slot: "rug", name: "Round gold rug", variant: "gold", price: 25 },
  { id: "rug-rust", slot: "rug", name: "Round rust rug", variant: "rust", price: 25 },
  { id: "rug-plum", slot: "rug", name: "Plum oval rug", variant: "plum", price: 40 },
  { id: "rug-fern", slot: "rug", name: "Fern oval rug", variant: "fern", price: 40 },

  { id: "art-none", slot: "art", name: "Bare wall", variant: "none", price: 0 },
  { id: "art-fern", slot: "art", name: "Pressed fern frame", variant: "fern", price: 20 },
  { id: "art-moon", slot: "art", name: "Moon frame", variant: "moon", price: 30 },
  { id: "art-coin", slot: "art", name: "Lucky coin frame", variant: "coin", price: 30 },
  { id: "art-pennant", slot: "art", name: "Pennant", variant: "pennant", price: 15 },

  { id: "lamp-none", slot: "lamp", name: "No lamp", variant: "none", price: 0 },
  { id: "lamp-gold", slot: "lamp", name: "Gold floor lamp", variant: "gold", price: 35 },
  { id: "lamp-rust", slot: "lamp", name: "Rust floor lamp", variant: "rust", price: 35 },
  { id: "lamp-lantern", slot: "lamp", name: "Standing lantern", variant: "lantern", price: 55 },

  { id: "plant-none", slot: "plant", name: "No plant", variant: "none", price: 0 },
  { id: "plant-fern", slot: "plant", name: "Potted fern", variant: "fern", price: 15 },
  { id: "plant-cactus", slot: "plant", name: "Tiny cactus", variant: "cactus", price: 20 },
  { id: "plant-sprout", slot: "plant", name: "Money sprout", variant: "sprout", price: 30 },
  { id: "plant-bonsai", slot: "plant", name: "Bonsai tree", variant: "bonsai", price: 80 },

  { id: "window-day", slot: "window", name: "Sunny day", variant: "day", price: 0 },
  { id: "window-dusk", slot: "window", name: "Orange dusk", variant: "dusk", price: 25 },
  { id: "window-night", slot: "window", name: "Starry night", variant: "night", price: 25 },
  { id: "window-hills", slot: "window", name: "Rolling hills", variant: "hills", price: 40 },

  { id: "shelf-none", slot: "shelf", name: "Empty shelf", variant: "none", price: 0 },
  { id: "shelf-books", slot: "shelf", name: "Stack of books", variant: "books", price: 15 },
  { id: "shelf-coins", slot: "shelf", name: "Coin tower", variant: "coins", price: 25 },
  { id: "shelf-clock", slot: "shelf", name: "Little clock", variant: "clock", price: 30 },
  { id: "shelf-teapot", slot: "shelf", name: "Teapot", variant: "teapot", price: 20 },
];

export const DECOR_BY_ID = Object.fromEntries(DECOR.map((d) => [d.id, d]));

// What every new cottage wears.
export const DEFAULT_COTTAGE = { wallpaper: "wall-moss", floor: "floor-oak", rug: "rug-none", art: "art-none", lamp: "lamp-none", plant: "plant-none", window: "window-day", shelf: "shelf-none" };

// Pieces that cost nothing are always owned.
export const STARTERS = DECOR.filter((d) => d.price === 0).map((d) => d.id);

// The student's own picture for the photo frame (play.photo). It is a small JPEG the game made
// itself from their upload (js/ui/photo-frame.js). Anything else is ignored, so a bad save
// can never put odd text into the room's drawing.
export const PHOTO_MAX_CHARS = 200000;
export function validPhoto(s) {
  return typeof s === "string" && s.length <= PHOTO_MAX_CHARS && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(s) ? s : null;
}

export function ownedDecor(play) {
  return new Set([...STARTERS, ...(play.decorOwned || [])]);
}

// The cottage a student sees. A saved id that no longer exists falls back to the default.
export function cottageOf(play) {
  const out = { ...DEFAULT_COTTAGE };
  for (const [slot, id] of Object.entries(play.cottage || {})) if (DECOR_BY_ID[id]?.slot === slot) out[slot] = id;
  return out;
}
