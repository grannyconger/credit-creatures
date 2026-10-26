// Every Arcade game built the GAME-SPECS.md way, by its key in JOBS. Each entry
// is the game's meta (settings, ranked rules, beats, why reasons, mistakes)
// plus its bonus questions. The guides join GUIDES in js/data/guides.js.
import { BILLDROP_META, BILLDROP_BONUS } from "./billdrop.js";

export const ARCADE = {
  billdrop: { ...BILLDROP_META, bonus: BILLDROP_BONUS },
};

export const isArcade = (key) => Boolean(ARCADE[key]);
