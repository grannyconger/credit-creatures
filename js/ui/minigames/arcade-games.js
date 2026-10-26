// The UI module for each GAME-SPECS.md Arcade game, by its key in JOBS.
// Each exports start(ctx) (see js/ui/arcade/runner.js).
import * as billdrop from "./bill-drop.js";
import * as payin4 from "./pay-in-4.js";

export const GAME_UI = { billdrop, payin4 };
