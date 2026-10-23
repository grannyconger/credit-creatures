// The story that opens the game, so students know their job from minute one.
// Plain language for a 15-year-old. No em-dashes, no semicolons.

export const KINGDOM = "Coinhaven";

// Each panel is a few short beats, one idea per line with its own icon, so
// there's less to read at once (teacher request 2026-10-21). chips: a short
// list shown as tags instead of a long sentence. mark: an icon name from
// js/ui/icons.js. plate and note: the caption under the picture and the
// naturalist's margin note (Mossy Bestiary, 2026-10-23).
export const INTRO_PANELS = [
  {
    scene: "kingdom",
    plate: "Plate I. The Kingdom of Coinhaven",
    note: "The Vault was here before the oldest turtle. The turtle checked.",
    title: "Welcome to the Kingdom of Coinhaven",
    beats: [
      { mark: "castle", text: "Coinhaven is a kingdom of creatures, market stalls and one very old bank, the Vault." },
      { mark: "piggy", text: "Every creature here grows up and has to learn to handle money." },
      { mark: "chart", text: "Some do great. Some get stuck in debt." },
    ],
  },
  {
    scene: "guardian",
    plate: "Plate II. A creature, about to need you",
    note: "It can count to three. Money goes higher than that.",
    title: "You are a Guardian of Coin",
    beats: [
      { mark: "sparkle", text: "A young creature is about to be put in your care." },
      { mark: "people", text: "It can't manage money on its own yet." },
      { mark: "compass", text: "Your job is to make its money choices:", chips: ["Where it works", "What it buys", "Which loans and cards it takes", "When it pays its bills"] },
    ],
  },
  {
    scene: "dream",
    plate: "Plate III. Four dreams worth growing",
    note: "Dreams take a while to grow. So do creatures.",
    title: "Every choice changes its life",
    beats: [
      { mark: "up", text: "Good choices build its savings and its credit score. They unlock its dream." },
      { mark: "down", text: "Rough choices bring fees, debt and late marks. They push the dream away." },
      { mark: "star", text: "Let's meet your creature!" },
    ],
  },
];

// The loop students repeat, shown on the hub.
export const HUB_HELP = "This is your Cottage. Click things in the room to go places. Things To Do at the bottom opens every place in Coinhaven, and your Wallet and the Leaderboard are at the top.";
