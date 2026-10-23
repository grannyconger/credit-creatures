// Today's three challenges, kept in play.daily.tasks (docs/UI-REBUILD.md slice 4).
// Chosen from the day and the student's seed, so a refresh keeps the same three.
import { CONFIG } from "./data/config.js";
import { CHALLENGES, CHALLENGE_BY_ID } from "./data/challenges.js";
import { createRng, receiveCash } from "./engine/index.js";
import { dayKey } from "./engine/daily.js";
import { ensureDaily } from "./daily.js";

// The set for today. Rolls it again when the day changes.
export function tasksFor(play, life, now = new Date()) {
  const d = ensureDaily(play);
  const key = dayKey(now);
  if (d.tasks?.day === key) return d.tasks;
  const rng = createRng(`${life.seed}:challenges:${key}`);
  const pool = CHALLENGES.filter((c) => !c.always && (!c.needs || c.needs(play, life)));
  const ids = ["pick"];
  while (ids.length < 3 && pool.length) ids.push(pool.splice(Math.floor(rng.next() * pool.length), 1)[0].id);
  d.tasks = { day: key, ids, count: {}, bonus: false };
  return d.tasks;
}

// A game event happened. Returns { finished: [challenge], bonus: coins, life } for the UI.
export function onEvent(play, life, type, data = {}, now = new Date()) {
  const t = tasksFor(play, life, now);
  const finished = [];
  for (const id of t.ids) {
    const c = CHALLENGE_BY_ID[id];
    if (c.event !== type || (c.match && !c.match(data)) || (t.count[id] || 0) >= c.target) continue;
    t.count[id] = (t.count[id] || 0) + 1;
    if (t.count[id] >= c.target) finished.push(c);
  }
  let out = life;
  let bonus = 0;
  if (finished.length && !t.bonus && t.ids.every((id) => (t.count[id] || 0) >= CHALLENGE_BY_ID[id].target)) {
    t.bonus = true;
    bonus = CONFIG.daily.challengeBonus;
    out = receiveCash(life, bonus, "Daily challenges").life;
  }
  return { finished, bonus, life: out };
}

export function progress(play, life, now = new Date()) {
  const t = tasksFor(play, life, now);
  const rows = t.ids.map((id) => ({ ...CHALLENGE_BY_ID[id], have: Math.min(t.count[id] || 0, CHALLENGE_BY_ID[id].target), done: (t.count[id] || 0) >= CHALLENGE_BY_ID[id].target }));
  return { rows, done: rows.filter((r) => r.done).length, total: rows.length, bonus: t.bonus };
}
