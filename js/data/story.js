// The story that opens the game, so students know their job from minute one.
// Plain language for a 15-year-old. No em-dashes, no semicolons.

export const KINGDOM = "Coinhaven";

export const INTRO_PANELS = [
  {
    scene: "kingdom",
    title: "Welcome to the Kingdom of Coinhaven",
    text: [
      "Coinhaven is a kingdom of creatures, market stalls and one very old bank called the Gilded Vault.",
      "Every creature here grows up and has to learn to handle money. Some do great. Some get stuck in debt.",
    ],
  },
  {
    scene: "guardian",
    title: "You are a Guardian of Coin",
    text: [
      "A young creature is about to be put in your care. It can't manage money on its own yet.",
      "Your job: make its money choices. Where it works, what it buys, which loans and cards it takes, and when it pays its bills.",
    ],
  },
  {
    scene: "dream",
    title: "Every choice changes its life",
    text: [
      "Good choices build its savings and its credit score. Those unlock its dream: a home, a shop, an adventure or school.",
      "Rough choices bring fees, debt and late marks. Those make the dream harder to reach. Let's meet your creature.",
    ],
  },
];

// The loop students repeat, shown on the hub.
export const HUB_HELP = "Your creature lives here. Work at the Guild Hall to earn, spend at the Market, learn at the Academy, manage money at the Vault, and make this month's decisions at Town Hall. Then come back home.";
