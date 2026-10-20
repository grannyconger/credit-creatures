// Rebuilds a life from how it began plus its action log. Bug reports and the
// Phase 8 tuning replay depend on this giving back the exact same life.
import { createLife } from "./life.js";
import { ACTIONS } from "./actions.js";

// upTo: replay only the first n log entries (to look at the life mid-game).
export function replayLife(start, log, upTo = log.length) {
  let life = createLife(start);
  for (const entry of log.slice(0, upTo)) {
    const fn = ACTIONS[entry.action];
    if (!fn) throw new Error(`Replay does not know the action "${entry.action}".`);
    life = fn(life, ...entry.args).life;
  }
  return life;
}
