// Re-runs real students' action logs with candidate config values and reports
// how scores, interest, fees and money would shift (docs/FEEDBACK.md section 4).
// Logged amounts stay the same (a student who paid $50 still pays $50), so this
// tests engine numbers like fees, APR rules and the score model.
import { CONFIG } from "../js/data/config.js";
import { replayLife, amountOwed } from "../js/engine/index.js";

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function setPath(obj, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k], obj);
  if (!(last in target)) throw new Error(`Unknown setting "${path}".`);
  target[last] = value;
}

// overrides = { "fees.late": 40, ... }. Restores CONFIG afterward.
export function withConfig(overrides, fn) {
  const old = {};
  for (const [k, v] of Object.entries(overrides)) {
    old[k] = structuredClone(getPath(CONFIG, k));
    setPath(CONFIG, k, v);
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(old)) setPath(CONFIG, k, v);
  }
}

function measure(life) {
  let interest = 0;
  let fees = 0;
  for (const a of life.accounts) for (const s of a.statements || []) {
    interest += s.interest;
    fees += s.fees;
  }
  const debt = life.accounts.filter((a) => a.owner === "self" && ["open", "collections"].includes(a.status)).reduce((s, a) => s + amountOwed(a), 0);
  return { score: life.score, checking: Math.round(life.checking), interest: Math.round(interest), fees: Math.round(fees), debt: Math.round(debt) };
}

const median = (xs) => {
  const a = xs.filter(Number.isFinite).sort((x, y) => x - y);
  return a.length ? a[Math.floor((a.length - 1) / 2)] : null;
};

export function compare(lives, overrides) {
  const rows = lives.map((l) => {
    const base = measure(replayLife(l.start, l.log));
    const cand = withConfig(overrides, () => measure(replayLife(l.start, l.log)));
    return { student: l.student, base, cand };
  });
  const sum = (k) => ({
    before: median(rows.map((r) => r.base[k])),
    after: median(rows.map((r) => r.cand[k])),
  });
  return {
    rows,
    medians: { score: sum("score"), interest: sum("interest"), fees: sum("fees"), debt: sum("debt"), checking: sum("checking") },
    scoreMoved10: rows.filter((r) => r.base.score != null && r.cand.score != null && Math.abs(r.cand.score - r.base.score) >= 10).length,
  };
}

// "--set fees.late=40" -> { "fees.late": 40 }
export function parseSets(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== "--set") continue;
    const [k, raw] = argv[++i].split("=");
    let v;
    try {
      v = JSON.parse(raw);
    } catch {
      v = raw;
    }
    out[k] = v;
  }
  return out;
}
