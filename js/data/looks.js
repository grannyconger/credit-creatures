// Every creature customization option and how it unlocks (Phase 9 additions).
// Free from the start, earned with XP or an achievement, or bought in the shop.
// Plain language for a 15-year-old. No em-dashes, no semicolons.
import { SPECIES, PALETTES, ACCESSORIES, MARKINGS, EYE_STYLES } from "./creatures.js";
import { SHOP_ITEMS } from "./shop.js";
import { ACHIEVEMENT_BY_ID, RANKS } from "./achievements.js";

const xp = (n) => ({ xp: n });
const ach = (id) => ({ achievement: id });

// field: where it lives on the creature. "accessories.x" means creature.accessories.x.
export const LOOK_SLOTS = [
  { key: "species", label: "Body", field: "species" },
  { key: "palette", label: "Colors", field: "palette" },
  { key: "pattern", label: "Pattern", field: "pattern", none: "none" },
  { key: "eyes", label: "Eyes", field: "eyes", none: "round" },
  { key: "eyeColor", label: "Eye color", field: "eyeColor", none: "default" },
  { key: "markings", label: "Marks", field: "markings", none: "none" },
  { key: "head", label: "Head", field: "accessories.head", none: "none" },
  { key: "neck", label: "Neck", field: "accessories.neck", none: "none" },
  { key: "face", label: "Face", field: "accessories.face", none: "none" },
  { key: "held", label: "Paw", field: "accessories.held", none: "none" },
  { key: "feet", label: "Feet", field: "accessories.feet", none: "none" },
  { key: "effect", label: "Magic", field: "accessories.effect", none: "none" },
  { key: "background", label: "Background", field: "background", none: "none" },
];

const list = (obj, extra = {}) => Object.entries(obj).map(([id, v]) => ({ id, name: typeof v === "string" ? v : v.label, ...(extra[id] ? { unlock: extra[id] } : {}) }));
const shop = (kind) => SHOP_ITEMS.filter((i) => i.kind === kind).map((i) => ({ id: i.id, name: `${i.icon} ${i.name}`, unlock: { shop: i.price } }));

export const LOOK_OPTIONS = {
  species: list(SPECIES, { crystalOwl: xp(100), mossDragon: xp(300), puddleGolem: xp(600), starJellycorn: xp(1000), emberPhoenix: xp(1600) }),
  palette: list(PALETTES, {
    goldLeaf: xp(1000),
    galaxy: xp(2400),
    cottonCandy: xp(150),
    apricot: xp(250),
    coralReef: xp(400),
    seafoam: xp(500),
    sunsetLagoon: xp(750),
    roseGarden: ach("fullyDressed"),
    meadowMist: ach("rainyDay"),
    fireAndTide: ach("workhorse"),
    berryTart: xp(1300),
    twilightBanner: xp(1800),
    royalVelvet: ach("dreamComeTrue"),
  }),
  pattern: [
    { id: "none", name: "None" },
    { id: "spots", name: "Spots" },
    { id: "stripes", name: "Stripes" },
    { id: "stars", name: "Stars", unlock: xp(100) },
    { id: "hearts", name: "Hearts", unlock: xp(300) },
    { id: "sparkles", name: "Sparkles", unlock: xp(600) },
  ],
  eyes: list(EYE_STYLES, { starry: xp(450) }),
  eyeColor: [
    { id: "default", name: "Natural" },
    { id: "blue", name: "Blue" },
    { id: "green", name: "Green" },
    { id: "amber", name: "Amber" },
    { id: "violet", name: "Violet" },
    { id: "pink", name: "Pink" },
  ],
  markings: list(MARKINGS),
  head: [
    ...list(ACCESSORIES.head),
    { id: "headphones", name: "Headphones", unlock: xp(100) },
    { id: "antlers", name: "Antlers", unlock: xp(300) },
    { id: "vikingHelmet", name: "Viking helmet", unlock: xp(600) },
    { id: "halo", name: "Golden halo", unlock: xp(1600) },
    { id: "graduationCap", name: "Graduation cap", unlock: ach("seasoned") },
    ...shop("head"),
  ],
  neck: [
    ...list(ACCESSORIES.neck),
    { id: "lei", name: "Flower lei", unlock: xp(100) },
    { id: "starNecklace", name: "Star necklace", unlock: xp(600) },
    { id: "royalSash", name: "Royal sash", unlock: xp(1000) },
    ...shop("neck"),
  ],
  face: [...list(ACCESSORIES.face), { id: "heartGlasses", name: "Heart glasses", unlock: xp(300) }, ...shop("face")],
  held: [
    ...list(ACCESSORIES.held),
    { id: "goldCoin", name: "Lucky coin", unlock: xp(100) },
    { id: "trophy", name: "Trophy", unlock: ach("perfectPractice") },
    { id: "shield", name: "Shield", unlock: ach("cleanRecord") },
    ...shop("held"),
  ],
  feet: [
    { id: "none", name: "None" },
    { id: "sneakers", name: "Sneakers" },
    { id: "slippers", name: "Fuzzy slippers" },
    { id: "boots", name: "Boots", unlock: xp(100) },
    { id: "goldBoots", name: "Golden boots", unlock: xp(1000) },
    ...shop("feet"),
  ],
  effect: [
    { id: "none", name: "None" },
    { id: "sparkles", name: "Sparkles", unlock: xp(300) },
    { id: "hearts", name: "Floating hearts", unlock: xp(600) },
    { id: "goldGlow", name: "Golden glow", unlock: xp(1000) },
    { id: "royalAura", name: "Royal aura", unlock: xp(2400) },
    ...shop("effect"),
  ],
  background: [{ id: "none", name: "Plain" }, ...shop("background")],
};

export function isUnlocked(opt, play) {
  const u = opt.unlock;
  if (!u) return true;
  if (u.xp != null) return (play?.xp || 0) >= u.xp;
  if (u.achievement) return Boolean(play?.achievements?.[u.achievement]);
  if (u.shop != null) return Boolean(play?.owned?.includes(opt.id));
  return false;
}

function rankAt(n) {
  return [...RANKS].reverse().find((r) => n >= r.xp)?.title || "";
}

// "🔒 300 XP (Knight)", "🔒 Earn Seasoned", "🛍️ Shop $45".
export function lockText(opt) {
  const u = opt.unlock;
  if (!u) return "";
  if (u.xp != null) return `🔒 ${u.xp} XP (${rankAt(u.xp)})`;
  if (u.achievement) return `🔒 Earn "${ACHIEVEMENT_BY_ID[u.achievement]?.title || u.achievement}"`;
  return `🛍️ Shop item`;
}

export function getField(creature, field) {
  const [a, b] = field.split(".");
  return b ? creature?.[a]?.[b] : creature?.[a];
}

export function setField(creature, field, value) {
  const [a, b] = field.split(".");
  if (b) creature[a] = { ...(creature[a] || {}), [b]: value };
  else creature[a] = value;
}

// Looks earned with XP or an achievement that the student hasn't been shown yet.
// The first time this runs for a save, it quietly marks everything already earned.
export function newlyUnlocked(play) {
  const earned = [];
  for (const slot of LOOK_SLOTS) {
    for (const o of LOOK_OPTIONS[slot.key]) {
      if (!o.unlock || o.unlock.shop != null) continue;
      if (isUnlocked(o, play)) earned.push({ ...o, slot: slot.label, key: `${slot.key}:${o.id}` });
    }
  }
  if (!play.looksSeen) {
    play.looksSeen = earned.map((e) => e.key);
    return [];
  }
  const fresh = earned.filter((e) => !play.looksSeen.includes(e.key));
  play.looksSeen.push(...fresh.map((e) => e.key));
  return fresh;
}

// The parts of a creature shown to classmates (leaderboard, friends).
export function publicLook(c) {
  return {
    species: c.species,
    palette: c.palette,
    pattern: c.pattern || "none",
    eyes: c.eyes || "round",
    eyeColor: c.eyeColor || "default",
    markings: c.markings || "none",
    background: c.background || "none",
    accessories: { head: "none", neck: "none", face: "none", held: "none", feet: "none", effect: "none", ...(c.accessories || {}) },
  };
}
