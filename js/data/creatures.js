// Creature creator options (SPEC §3). All designs are original.
export const SPECIES = {
  // Starters first, then the ones that unlock with XP (js/data/looks.js).
  lanternFox: { label: "Lantern fox", blurb: "Its tail glows when it is thinking." },
  cloudBunny: { label: "Cloud bunny", blurb: "Soft as a cloud, hops when it's happy." },
  shellTurtle: { label: "Shell turtle", blurb: "Slow, steady and always prepared." },
  crystalOwl: { label: "Crystal owl", blurb: "Sees every number on the page." },
  mossDragon: { label: "Moss dragon", blurb: "Small wings, big heart, mossy back." },
  puddleGolem: { label: "Puddle golem", blurb: "Calm, squishy and very patient." },
};

// body, belly, accent (wings, ears, spots), eye
export const PALETTES = {
  moss: { label: "Moss", body: "#6fae5a", belly: "#dcebb5", accent: "#3f7a3a", eye: "#2b2340" },
  ember: { label: "Ember", body: "#e07a3f", belly: "#f8d6ad", accent: "#a8431f", eye: "#2b2340" },
  frost: { label: "Frost", body: "#7fb8e0", belly: "#e6f3fb", accent: "#3d78a8", eye: "#1d2b44" },
  royal: { label: "Royal", body: "#8a6fd1", belly: "#e8defb", accent: "#5a3fa0", eye: "#22183f" },
  sunny: { label: "Sunny", body: "#f2c84b", belly: "#fff2c4", accent: "#c0901a", eye: "#3a2a10" },
  midnight: { label: "Midnight", body: "#40456e", belly: "#a7acd8", accent: "#252848", eye: "#f6f1e7" },
  rose: { label: "Rose", body: "#e88aa8", belly: "#fcdde7", accent: "#b4506f", eye: "#3a1a26" },
  ocean: { label: "Ocean", body: "#2f8fa8", belly: "#c9eef5", accent: "#1d5f73", eye: "#0f2a33" },
  mint: { label: "Mint", body: "#8fd6b4", belly: "#e8f8ef", accent: "#3f9a75", eye: "#1d3a2e" },
  lavender: { label: "Lavender", body: "#b9a3e3", belly: "#f1ecfb", accent: "#7c62b8", eye: "#2a1f45" },
  copper: { label: "Copper", body: "#b8733d", belly: "#f1d9c0", accent: "#7a4520", eye: "#2b1a0e" },
  snow: { label: "Snow", body: "#eef1f6", belly: "#ffffff", accent: "#9aa7bd", eye: "#2b2340" },
  peach: { label: "Peach", body: "#f6b38f", belly: "#fde8da", accent: "#d97a55", eye: "#3a2218" },
  forest: { label: "Forest", body: "#4f7f4a", belly: "#cfe3bf", accent: "#2f5530", eye: "#1a2a16" },
  goldLeaf: { label: "Gold leaf", body: "#e2b23c", belly: "#fff4d0", accent: "#9a6f12", eye: "#3a2a10" },
  galaxy: { label: "Galaxy", body: "#3b2f7a", belly: "#b8a9f0", accent: "#e05ab0", eye: "#fff4c2" },
};

// Face markings and eye styles (Phase 8 customizer).
export const MARKINGS = { none: "None", blush: "Rosy cheeks", freckles: "Freckles", star: "Forehead star", heart: "Heart cheek" };
export const EYE_STYLES = { round: "Round", happy: "Happy", sleepy: "Sleepy", sparkle: "Sparkly" };

export const ACCESSORIES = {
  head: {
    none: "None",
    crown: "Tiny crown",
    wizardHat: "Wizard hat",
    flower: "Flower",
    beanie: "Beanie",
  },
  neck: {
    none: "None",
    scarf: "Scarf",
    bowtie: "Bow tie",
    medal: "Gold medal",
  },
  face: {
    none: "None",
    glasses: "Round glasses",
    monocle: "Monocle",
  },
  held: {
    none: "None",
    balloon: "Balloon",
    book: "Book",
    lantern: "Lantern",
  },
};

export const ACCESSORY_SLOTS = { head: "Head", neck: "Neck", face: "Face", held: "Paw" };

export const NAME_IDEAS = ["Pip", "Mossy", "Biscuit", "Nova", "Pebble", "Ziggy", "Clover", "Ember", "Waffles", "Juniper", "Puddles", "Sprout"];

export const LAST_NAME_IDEAS = ["Mossbright", "Puddleton", "Featherbottom", "Glimmerstone", "McScales", "Quillsworth", "Lanternby", "Pebblefoot", "Sparkwhistle", "Thistledown"];

export const NAME_MAX = 20;

// The name printed on cards and checks: first name plus the optional last name.
export function fullName(creature) {
  return [creature?.name, creature?.lastName].filter(Boolean).join(" ");
}

export function defaultCreature() {
  return { name: "", lastName: "", species: "lanternFox", palette: "ember", markings: "none", eyes: "round", accessories: { head: "none", neck: "none", face: "none", held: "none", feet: "none", effect: "none" } };
}
