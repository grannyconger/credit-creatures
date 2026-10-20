// Creature creator options (SPEC §3). All designs are original.
export const SPECIES = {
  mossDragon: { label: "Moss dragon", blurb: "Small wings, big heart, mossy back." },
  lanternFox: { label: "Lantern fox", blurb: "Its tail glows when it is thinking." },
  crystalOwl: { label: "Crystal owl", blurb: "Sees every number on the page." },
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
};

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
};

export const ACCESSORY_SLOTS = { head: "Head", neck: "Neck", face: "Face" };

export const NAME_IDEAS = ["Pip", "Mossy", "Biscuit", "Nova", "Pebble", "Ziggy", "Clover", "Ember", "Waffles", "Juniper", "Puddles", "Sprout"];

export const NAME_MAX = 20;

export function defaultCreature() {
  return { name: "", species: "mossDragon", palette: "moss", accessories: { head: "none", neck: "none", face: "none" } };
}
