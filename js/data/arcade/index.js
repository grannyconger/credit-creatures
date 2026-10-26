// Every Arcade game built the GAME-SPECS.md way, by its key in JOBS. Each entry
// is the game's meta (settings, ranked rules, beats, why reasons, mistakes)
// plus its bonus questions. The guides join GUIDES in js/data/guides.js.
import { BILLDROP_META, BILLDROP_BONUS } from "./billdrop.js";
import { PAYIN4_META, PAYIN4_BONUS } from "./payin4.js";
import { SCORECHASE_META, SCORECHASE_BONUS } from "./scorechase.js";
import { CASHIER_META, CASHIER_BONUS } from "./cashier.js";

export const ARCADE = {
  billdrop: { ...BILLDROP_META, bonus: BILLDROP_BONUS },
  payin4: { ...PAYIN4_META, bonus: PAYIN4_BONUS },
  scorechase: { ...SCORECHASE_META, bonus: SCORECHASE_BONUS },
  cashier: { ...CASHIER_META, bonus: CASHIER_BONUS },
};

export const isArcade = (key) => Boolean(ARCADE[key]);
