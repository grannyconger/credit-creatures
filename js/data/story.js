// The story that opens the game, so students know their job from minute one.
// Plain language for a 15-year-old. No em-dashes, no semicolons.

export const KINGDOM = "Coinhaven";

// Each panel is a few short beats, one idea per line with its own icon, so
// there's less to read at once (teacher request 2026-10-21). chips: a short
// list shown as tags instead of a long sentence.
export const INTRO_PANELS = [
  {
    scene: "kingdom",
    title: "Welcome to the Kingdom of Coinhaven",
    beats: [
      { icon: "🏰", text: "Coinhaven is a kingdom of creatures, market stalls and one very old bank, the Gilded Vault." },
      { icon: "🌱", text: "Every creature here grows up and has to learn to handle money." },
      { icon: "⚖️", text: "Some do great. Some get stuck in debt." },
    ],
  },
  {
    scene: "guardian",
    title: "You are a Guardian of Coin",
    beats: [
      { icon: "🥚", text: "A young creature is about to be put in your care." },
      { icon: "🤲", text: "It can't manage money on its own yet." },
      { icon: "🧭", text: "Your job is to make its money choices:", chips: ["Where it works", "What it buys", "Which loans and cards it takes", "When it pays its bills"] },
    ],
  },
  {
    scene: "dream",
    title: "Every choice changes its life",
    beats: [
      { icon: "📈", text: "Good choices build its savings and its credit score. They unlock its dream." },
      { icon: "📉", text: "Rough choices bring fees, debt and late marks. They push the dream away." },
      { icon: "👋", text: "Let's meet your creature!" },
    ],
  },
];

// The loop students repeat, shown on the hub.
export const HUB_HELP = "Your creature lives here. Work at the Guild Hall to earn, spend at the Market, learn at the Academy, manage money at the Vault, and make this month's decisions at Town Hall. Then come back home.";
