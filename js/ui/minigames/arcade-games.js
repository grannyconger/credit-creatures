// The UI module for each GAME-SPECS.md Arcade game, by its key in JOBS.
// Each exports start(ctx) (see js/ui/arcade/runner.js).
import * as billdrop from "./bill-drop.js";
import * as payin4 from "./pay-in-4.js";
import * as scorechase from "./score-chase.js";
import * as cashier from "./cashier-rush.js";
import * as checks from "./check-writer.js";
import * as phish from "./phish-tank.js";
import * as grind from "./the-grind.js";
import * as fees from "./fee-detective.js";
import * as feed from "./feed-frenzy.js";
import * as rainy from "./rainy-day.js";

export const GAME_UI = { billdrop, payin4, scorechase, cashier, checks, phish, grind, fees, feed, rainy };
