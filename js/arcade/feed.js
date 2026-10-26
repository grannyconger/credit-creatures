// Feed Frenzy's rules (GAME-SPECS.md game 6). Pure and seeded.
// Four weeks, three posts a week. Needs first show up at a fake sale price and
// come back later at their normal price or lower. Wishlisted posts return next
// week with the tricks stripped. Free trials charge in week 3 or 4.
import { CONFIG } from "../data/config.js";
import { createRng } from "../engine/index.js";
import { FF_PERSONAS, FF_NEEDS, FF_WANTS, FF_TRIALS, FF_CREATORS, FF_TRICKS } from "../data/arcade/feed.js";

const C = () => CONFIG.arcade.games.feed;
export const WEEKS = 4;
export const PER_WEEK = 3;

function post(rng, fields) {
  return { id: fields.id, creator: FF_CREATORS[rng.int(0, FF_CREATORS.length - 1)], tricks: [], ...fields };
}

function dealOne(seed) {
  const c = C();
  const rng = createRng(seed);
  const persona = FF_PERSONAS[rng.int(0, FF_PERSONAS.length - 1)];
  const cash = rng.int(persona.cash[0] / 10, persona.cash[1] / 10) * 10;
  const slots = Array.from({ length: WEEKS }, () => []);
  let n = 0;
  // Each need: a fake-sale first post in week 1 or 2, then a normal post later.
  for (const key of persona.needs) {
    const need = FF_NEEDS[key];
    const normal = rng.int(need.price[0], need.price[1]);
    const first = Math.round(normal * rng.range(c.fakeSale[0], c.fakeSale[1]));
    const w1 = rng.int(0, 1);
    const w2 = rng.int(w1 + 1, WEEKS - 1);
    const out = rng.chance(c.outOfStock) && w2 < WEEKS - 1 ? 1 : 0;
    slots[w1].push(post(rng, { id: `p${n++}`, kind: "need", need: key, name: need.name, price: first, tricks: ["wasNow", rng.chance(0.5) ? "countdown" : "onlyX"], was: Math.round(first * rng.range(1.5, 1.9)) }));
    slots[w2 + out].push(post(rng, { id: `p${n++}`, kind: "need", need: key, name: need.name, price: Math.round(normal * rng.range(0.85, 1)), tricks: rng.chance(0.4) ? ["hiddenAd"] : [], late: true, restock: Boolean(out) }));
  }
  // One free trial, one creator's limited drop (chaos), and wants to fill the rest.
  const trial = FF_TRIALS[rng.int(0, FF_TRIALS.length - 1)];
  const tw = rng.int(0, 1);
  slots[tw].push(post(rng, { id: `p${n++}`, kind: "trial", name: trial[0], price: 0, monthly: trial[1], tricks: ["freeTrial", "hiddenAd"], chargeWeek: rng.int(2, 3) }));
  const pool = FF_WANTS.slice();
  const want = (tricks, extra = {}) => {
    const w = pool.splice(rng.int(0, pool.length - 1), 1)[0];
    return post(rng, { id: `p${n++}`, kind: "want", name: w[0], interest: w[1], price: rng.int(w[2][0], w[2][1]), tricks, ...extra });
  };
  const dw = rng.int(1, 2);
  const fav = pool.filter((w) => persona.interests.includes(w[1]));
  const dropW = fav.length ? fav[rng.int(0, fav.length - 1)] : null;
  if (dropW) {
    pool.splice(pool.indexOf(dropW), 1);
    slots[dw].push(post(rng, { id: `p${n++}`, kind: "want", name: `${dropW[0]}, LIMITED drop`, interest: dropW[1], price: rng.int(dropW[2][0], dropW[2][1]) + 10, tricks: ["countdown", "onlyX"], drop: true }));
  }
  const TRICKS = Object.keys(FF_TRICKS).filter((t) => t !== "freeTrial");
  for (let w = 0; w < WEEKS; w++) {
    while (slots[w].length < PER_WEEK) {
      const k = rng.int(0, 2);
      const tricks = [];
      while (tricks.length < k) {
        const t = TRICKS[rng.int(0, TRICKS.length - 1)];
        if (!tricks.includes(t)) tricks.push(t);
      }
      const p = want(tricks);
      if (tricks.includes("wasNow")) p.was = Math.round(p.price * rng.range(1.4, 1.9));
      slots[w].push(p);
    }
    for (let i = slots[w].length - 1; i > 0; i--) {
      const j = rng.int(0, i);
      [slots[w][i], slots[w][j]] = [slots[w][j], slots[w][i]];
    }
  }
  // Each bought want gets a seeded used-or-not roll, decided now so it can't be gamed.
  for (const wk of slots) for (const p of wk) p.useRoll = rng.next();
  const surprise = { week: rng.int(1, 3), amount: c.surprise };
  return { seed: String(seed), persona, cash, weeks: slots, surprise };
}

// Keeps difficulty in a band (1.6) for fair class scores.
export function newShift(seed) {
  for (let t = 0; t < 60; t++) {
    const d = dealOne(`${seed}:${t}`);
    if (d.weeks.some((w) => w.length !== PER_WEEK)) continue;
    const sc = score(playDeal(d, thoughtfulPolicy)).score;
    if (sc >= C().band[0] && sc <= C().band[1]) return d;
  }
  return dealOne(`${seed}:0`);
}

export function newState(deal) {
  return { deal, week: 0, i: 0, queue: deal.weeks[0].slice(), cash: deal.cash, bought: [], skipped: [], wished: [], returning: [], subs: [], charged: [], spotted: {}, spots: 0, wrongTaps: 0, decided: {}, echoes: [], surpriseDone: false, done: false };
}

export const current = (s) => s.queue[s.i] || null;

// Taps a trick on a post: +10 if it's one, -5 for tapping the photo or caption.
export function tapTrick(s, postId, trick) {
  const p = findPost(s, postId);
  if (!p) return null;
  if (!trick || !p.tricks.includes(trick)) {
    s.wrongTaps++;
    return { ok: false };
  }
  s.spotted[postId] ??= [];
  if (s.spotted[postId].includes(trick)) return { ok: true, again: true };
  s.spotted[postId].push(trick);
  s.spots++;
  return { ok: true, truth: FF_TRICKS[trick].truth };
}

const findPost = (s, id) => s.queue.find((p) => p.id === id) || null;

// how: "buy" | "skip" | "wish"
export function decide(s, how) {
  const p = current(s);
  if (!p) return null;
  const out = { p, how };
  if (how === "buy") {
    if (p.price > s.cash) return { ...out, fail: "Not enough cash." };
    s.cash -= p.price;
    s.bought.push(p);
    if (p.kind === "trial") s.subs.push({ id: p.id, name: p.name, monthly: p.monthly, chargeWeek: p.chargeWeek, canceled: false });
  } else if (how === "wish" && !p.returned) {
    // It comes back next week with every trick stripped away.
    s.wished.push(p);
    s.returning.push({ ...p, id: `${p.id}w`, tricks: [], returned: true, was: null, from: p.id });
  } else {
    s.skipped.push(p);
    out.how = "skip";
  }
  s.decided[p.id] = out.how;
  s.i++;
  return out;
}

export function cancelSub(s, id) {
  const sub = s.subs.find((x) => x.id === id);
  if (!sub || sub.canceled) return false;
  sub.canceled = true;
  return true;
}

// Moves to the next week once this week's posts are done. Returns echoes.
export function nextWeek(s) {
  const ev = [];
  if (s.i < s.queue.length) for (let k = s.i; k < s.queue.length; k++) (s.skipped.push(s.queue[k]), (s.decided[s.queue[k].id] = "skip"));
  s.week++;
  if (s.week >= WEEKS) {
    s.done = true;
    return ev;
  }
  for (const sub of s.subs) {
    if (sub.canceled || sub.chargeWeek !== s.week) continue;
    s.cash -= sub.monthly;
    s.charged.push(sub);
    ev.push({ type: "charge", text: `${sub.name} charged ${sub.monthly} dollars. From: the free trial you started.`, sub });
  }
  if (!s.surpriseDone && s.week === s.deal.surprise.week) {
    s.surpriseDone = true;
    s.cash -= s.deal.surprise.amount;
    ev.push({ type: "surprise", text: `Surprise: a ${s.deal.surprise.amount} dollar field trip fee.` });
  }
  const back = s.returning.filter((p) => !s.decided[p.id] && Number(p.from.slice(1)) >= 0);
  s.queue = [...back, ...s.deal.weeks[s.week].map((p) => ({ ...p }))];
  s.returning = [];
  s.i = 0;
  for (const p of back) ev.push({ type: "wishlist", text: `${p.name} is back from your wishlist, with no tricks. Same price, still in stock.`, p });
  for (const p of s.queue) if (p.restock) ev.push({ type: "restock", text: `${p.name} was out of stock last week. It's back.` });
  return ev;
}

// Feed Score = goal savings / 2 (cap 300) + 50 per need met + 10 per trick spotted
// - 40 per regret - subscription charges - 60 per unmet need (and -5 per wrong tap).
export function score(s) {
  const c = C();
  const needs = s.deal.persona.needs;
  const met = needs.filter((k) => s.bought.some((p) => p.need === k));
  const unmet = needs.length - met.length;
  const wants = s.bought.filter((p) => p.kind === "want");
  const stamps = wants.map((p) => ({ p, used: s.deal.persona.interests.includes(p.interest) ? p.useRoll < c.usedIfInterest : p.useRoll < c.usedOtherwise }));
  const regrets = stamps.filter((x) => !x.used);
  const subCharges = s.charged.reduce((t, x) => t + x.monthly, 0);
  const savings = Math.max(0, s.cash);
  const total = Math.min(c.savingsCap, savings / 2) + c.perNeed * met.length + c.perTrick * s.spots - c.perRegret * regrets.length - subCharges - c.perUnmet * unmet - c.perWrongTap * s.wrongTaps;
  return { score: Math.round(total), savings, met: met.length, unmet, spots: s.spots, regrets, stamps, subCharges, goal: s.deal.persona.goal };
}

export function biggest(s) {
  const firstWishSkipped = s.wished.find((p) => s.skipped.some((x) => x.from === p.id));
  if (firstWishSkipped) return { text: `skipping ${firstWishSkipped.name} after it came back from your wishlist` };
  const top = s.bought.slice().sort((a, b) => b.price - a.price)[0];
  if (top) return { text: `buying ${top.name} for $${top.price}` };
  return { text: "skipping everything", reasons: { weak: "I didn't want anything.", okay: "I wanted to save.", strong: "I only buy what I need, and nothing I needed was at a fair price yet." } };
}

// ---------- Bots ----------
export function playDeal(deal, policy) {
  const s = newState(deal);
  while (!s.done) {
    while (current(s)) {
      const p = current(s);
      if (policy.spot) for (const t of p.tricks) tapTrick(s, p.id, t);
      const r = decide(s, policy.pick(s, p));
      // Can't afford it: it's a skip.
      if (r?.fail) decide(s, "skip");
    }
    if (policy.cancel) for (const sub of s.subs) cancelSub(s, sub.id);
    nextWeek(s);
  }
  return s;
}
export const play = (seed, policy) => playDeal(newShift(seed), policy);

// Thoughtful: buy needs when they're at their normal price, a want that matches
// an interest only after wishlisting it, cancel trials, spot every trick.
export const thoughtfulPolicy = {
  spot: true,
  cancel: true,
  pick: (s, p) => {
    if (p.kind === "need") return s.bought.some((x) => x.need === p.need) ? "skip" : p.late ? "buy" : "skip";
    if (p.kind === "want" && s.deal.persona.interests.includes(p.interest) && !p.drop) return p.returned ? (p.price <= 45 ? "buy" : "skip") : "wish";
    return "skip";
  },
};
export const skipAllPolicy = { spot: false, cancel: false, pick: () => "skip" };
export const buyAllPolicy = { spot: false, cancel: false, pick: () => "buy" };
export const needsNowPolicy = { ...thoughtfulPolicy, pick: (s, p) => (p.kind === "need" ? (s.bought.some((x) => x.need === p.need) ? "skip" : "buy") : thoughtfulPolicy.pick(s, p)) };
