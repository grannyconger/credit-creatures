// Daily challenges (docs/UI-REBUILD.md slice 4). Three a day, the first is
// always the Daily Pick. Each one listens for a telemetry event (js/telemetry.js)
// so screens never have to report to it. needs() keeps a challenge out of the
// pool until the place it uses is open, so nobody gets one they can't do.
// Student text: plain words, no em-dashes, no semicolons.
import { hasFeature } from "../progression.js";

export const CHALLENGES = [
  { id: "pick", text: "Open a box in your Daily Pick", event: "dailyPick", target: 1, always: true },
  { id: "shift", text: "Work a shift in the Arcade", event: "minigame", target: 1, needs: (play) => Boolean(play.active) && hasFeature(play, "guild") },
  { id: "desk", text: "Finish a Practice Desk round", event: "deskDone", target: 1, needs: (play, life) => hasFeature(play, "vault", life) },
  { id: "market", text: "Browse the Market", event: "shopOpen", target: 1, needs: (play) => hasFeature(play, "market") },
  { id: "alley", text: "Call a stall in Lantern Alley", event: "alleyCall", target: 1, needs: (play) => hasFeature(play, "pitfalls") },
  { id: "vault", text: "Visit the Vault", event: "placeOpen", match: (d) => d.place === "vault", target: 1, needs: (play, life) => hasFeature(play, "vault", life) },
  { id: "cottage", text: "Visit your Cottage", event: "placeOpen", match: (d) => d.place === "cottage", target: 1, needs: (play) => hasFeature(play, "cottage") },
  { id: "records", text: "Check the Hall of Records", event: "placeOpen", match: (d) => d.place === "records", target: 1, needs: (play) => hasFeature(play, "records") },
];

export const CHALLENGE_BY_ID = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]));
