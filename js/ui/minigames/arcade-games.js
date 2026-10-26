// The UI module for each GAME-SPECS.md Arcade game, by its key in JOBS.
// Each exports start(ctx) (see js/ui/arcade/runner.js).
import * as billdrop from "./bill-drop.js";
import * as payin4 from "./pay-in-4.js";
import * as scorechase from "./score-chase.js";
import * as cashier from "./cashier-rush.js";

export const GAME_UI = { billdrop, payin4, scorechase, cashier };
