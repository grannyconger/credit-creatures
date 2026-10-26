// Guides for the side quests (docs/MINIGAMES.md: every game gets How to play,
// Vocab and IRL). One entry per game key in JOBS. Plain words for a
// 15-year-old, a wry line or two, no em-dashes, no semicolons.
// In how.steps and how.example, [[word]] is a vocab term: it gets a tooltip
// on hover and on keyboard focus, from the vocab list.
// IRL facts are real. Each names its source, year and link, and was checked
// against that source on the date in `checked`. Never invent one.

import { BILLDROP_GUIDE } from "./arcade/billdrop.js";
import { PAYIN4_GUIDE } from "./arcade/payin4.js";
import { SCORECHASE_GUIDE } from "./arcade/scorechase.js";
import { CASHIER_GUIDE } from "./arcade/cashier.js";
import { CHECKS_GUIDE } from "./arcade/checks.js";
import { PHISH_GUIDE } from "./arcade/phish.js";
import { GRIND_GUIDE } from "./arcade/grind.js";
import { FEES_GUIDE } from "./arcade/fees.js";
import { FEED_GUIDE } from "./arcade/feed.js";
import { RAINY_GUIDE } from "./arcade/rainy.js";
import { TREE_GUIDE } from "./arcade/tree.js";
import { DASH_GUIDE } from "./arcade/dash.js";
import { LOT_GUIDE } from "./arcade/lot.js";

export const GUIDES = {
  billdrop: BILLDROP_GUIDE,
  payin4: PAYIN4_GUIDE,
  scorechase: SCORECHASE_GUIDE,
  cashier: CASHIER_GUIDE,
  checks: CHECKS_GUIDE,
  phish: PHISH_GUIDE,
  grind: GRIND_GUIDE,
  fees: FEES_GUIDE,
  feed: FEED_GUIDE,
  rainy: RAINY_GUIDE,
  tree: TREE_GUIDE,
  dash: DASH_GUIDE,
  lot: LOT_GUIDE,
};
