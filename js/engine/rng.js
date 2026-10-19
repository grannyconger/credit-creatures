// Seeded random numbers (mulberry32). The whole generator state is one
// 32-bit integer, so it saves with the game and replays exactly.

export function seedFrom(seed) {
  if (typeof seed === "number") return seed >>> 0;
  // FNV-1a hash for string seeds.
  let h = 0x811c9dc5;
  for (const ch of String(seed)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Returns [value in [0, 1), nextState].
export function step(state) {
  const t = (state + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), t | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  return [((r ^ (r >>> 14)) >>> 0) / 4294967296, t];
}

// A generator that keeps its state on any object with an `rng` field
// (a life, or a plain { rng } holder used by tests and sims).
export function rngOn(holder) {
  const next = () => {
    const [v, s] = step(holder.rng);
    holder.rng = s;
    return v;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    range: (min, max) => min + next() * (max - min),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

export function createRng(seed) {
  return rngOn({ rng: seedFrom(seed) });
}
