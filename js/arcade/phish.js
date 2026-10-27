// Phish Tank's rules (GAME-SPECS.md game 5). Pure and seeded. Time is passed
// in as milliseconds since the shift began, so the UI owns the clock and Node
// tests can play whole shifts instantly.
import { CONFIG } from "../data/config.js";
import { createRng } from "../engine/index.js";
import { PHISH_TEMPLATES, PHISH_CHAIN, PHISH_HACKED, PHISH_FALLOUT } from "../data/arcade/phish.js";

const C = () => CONFIG.arcade.games.phish;

// "Pay at {{link|x.co}} now" -> [{ text: "Pay at " }, { text: "x.co", flag: "link" }, { text: " now" }]
export function parts(text) {
  const out = [];
  const re = /\{\{(\w+)\|([^}]*)\}\}/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[2], flag: m[1] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
export const plain = (text) => parts(text).map((p) => p.text).join("");

// "Bank of America" -> "bankofamerica", for a look-alike link.
export const slug = (a) => String(a ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function build(t, a, uid) {
  const fill = (x) => String(x || "").replace(/\{\{link\|((?:\{a\}|[^}])*)\}\}/g, (_, link) => `{{link|${link.replaceAll("{a}", slug(a))}}}`).replaceAll("{a}", a ?? "");
  const text = parts(fill(t.text));
  const sender = parts(fill(t.sender));
  const flags = [...sender, ...text].filter((p) => p.flag).map((p) => ({ type: p.flag, text: p.text }));
  return { uid, id: t.id, scam: t.scam, kind: t.kind, sender, text, flags, loss: t.loss, credential: Boolean(t.credential), urgent: Boolean(t.urgent), truth: fill(t.truth) };
}

export function newShift(seed, { timed = true } = {}) {
  const c = C();
  const rng = createRng(`${seed}:phish`);
  const n = c.messages;
  const legitN = Math.round(n * (c.legit[0] + rng.next() * (c.legit[1] - c.legit[0])));
  const scams = PHISH_TEMPLATES.filter((t) => t.scam);
  const reals = PHISH_TEMPLATES.filter((t) => !t.scam);
  const take = (pool, k) => {
    const p = pool.slice();
    const out = [];
    while (out.length < k && p.length) out.push(p.splice(rng.int(0, p.length - 1), 1)[0]);
    return out;
  };
  // Chaos: the romance scam across 3 messages and a real friend's hacked number.
  const scamSlots = n - legitN - PHISH_CHAIN.length - 1;
  let list = [...take(reals, legitN).map((t) => ({ t })), ...take(scams, scamSlots).map((t) => ({ t })), { t: PHISH_HACKED }];
  for (let i = list.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [list[i], list[j]] = [list[j], list[i]];
  }
  // The romance chain spreads out: early, middle, late.
  const marks = [rng.int(1, 4), rng.int(6, 9), rng.int(12, 15)];
  PHISH_CHAIN.forEach((t, k) => list.splice(Math.min(marks[k], list.length), 0, { t }));
  list = list.slice(0, n);
  const msgs = list.map(({ t }, i) => build(t, t.a ? t.a[rng.int(0, t.a.length - 1)] : null, `m${i}`));
  // Arrivals speed up over the shift.
  let at = c.firstMs;
  msgs.forEach((m, i) => {
    m.arriveAt = timed ? Math.round(at) : null;
    at += c.gapStart - ((c.gapStart - c.gapEnd) * i) / Math.max(1, n - 1);
  });
  return { seed: String(seed), timed, msgs };
}

export function newState(deal) {
  return { deal, t: 0, next: 0, queue: [], done: {}, expired: [], correct: 0, wrong: 0, flagsFound: 0, flagTaps: {}, lost: 0, saved: 0, takeovers: 0, lock: null, fallout: 0, log: [] };
}

// Moves the clock to t. Returns { arrived: [...], expired: [...] }.
export function advance(s, t) {
  const c = C();
  s.t = t;
  const arrived = [];
  const expired = [];
  if (s.deal.timed) {
    while (s.next < s.deal.msgs.length && s.deal.msgs[s.next].arriveAt <= t) {
      const m = s.deal.msgs[s.next++];
      m.shownAt = m.arriveAt;
      s.queue.push(m);
      arrived.push(m);
    }
    for (const m of s.queue.slice()) {
      if (t - m.shownAt < c.expiryMs) continue;
      s.queue = s.queue.filter((x) => x !== m);
      const rec = { m, action: "expired", correct: !m.scam ? false : null, loss: m.scam ? 0 : 0 };
      s.done[m.uid] = rec;
      s.expired.push(m);
      expired.push(m);
    }
  } else if (!s.queue.length && s.next < s.deal.msgs.length) {
    const m = s.deal.msgs[s.next++];
    m.shownAt = t;
    s.queue.push(m);
    arrived.push(m);
  }
  return { arrived, expired };
}

export const isOver = (s) => s.next >= s.deal.msgs.length && !s.queue.length;
export const find = (s, uid) => s.queue.find((m) => m.uid === uid) || null;

// action: "trust" | "block" | "verifyApp" | "verifyCall".
export function act(s, uid, action, t = s.t) {
  const m = find(s, uid);
  if (!m || s.lock) return null;
  s.queue = s.queue.filter((x) => x !== m);
  let correct;
  let note = "";
  if (action === "trust") correct = !m.scam;
  else if (action === "block") correct = m.scam;
  else if (action === "verifyApp") {
    correct = true;
    note = m.truth;
  } else if (action === "verifyCall") {
    // Calling the number in a scam reaches the scammer: the same as trusting it.
    correct = !m.scam;
    note = m.scam ? "The number in the message went straight to the scammer." : `${m.truth} Next time, the official app is the safer habit.`;
  }
  const trustedScam = m.scam && !correct;
  const blockedReal = !m.scam && !correct;
  const loss = trustedScam || blockedReal ? m.loss : 0;
  const rec = { m, action, correct, loss, note, takeover: false, at: t };
  if (correct) s.correct++;
  else s.wrong++;
  s.lost += loss;
  if (correct && m.scam) s.saved += m.loss;
  if (trustedScam && m.credential) takeover(s, t, rec);
  s.done[m.uid] = rec;
  s.log.push(rec);
  return rec;
}

// Trusting a credential scam hands over the account: friends start replying to
// scams sent "from you", and a lockdown task blocks the queue until it's done.
function takeover(s, t, rec) {
  const c = C();
  rec.takeover = true;
  s.takeovers++;
  s.lock = { taps: 0, need: c.lockTaps, since: t };
  // Confused friends reply after the first takeover only.
  if (s.takeovers > 1) return;
  const fall = PHISH_FALLOUT.slice(0, 2).map((f, k) => {
    const m = build(f, null, `f${s.fallout++}`);
    m.arriveAt = t + 500 * (k + 1);
    return m;
  });
  // The confused friends cut in line next.
  s.deal.msgs.splice(s.next, 0, ...fall);
  if (!s.deal.timed) return;
  for (const m of fall) m.arriveAt = Math.min(m.arriveAt, s.deal.msgs[s.next + 2]?.arriveAt ?? m.arriveAt);
}

// One tap on the lockdown (change your password, turn on two-step login).
export function lockTap(s) {
  if (!s.lock) return false;
  s.lock.taps++;
  if (s.lock.taps >= s.lock.need) s.lock = null;
  return true;
}

// After a right Block, tap the red flags for +10 each.
export function flagTap(s, uid, index) {
  const rec = s.done[uid];
  if (!rec || rec.action !== "block" || !rec.correct) return false;
  const f = rec.m.flags[index];
  if (!f) return false;
  const key = `${uid}:${index}`;
  if (s.flagTaps[key]) return false;
  s.flagTaps[key] = true;
  s.flagsFound++;
  return true;
}

// Safety Score = 20 per right call + 10 per red flag - 15 per wrong call
// - 5 per real message that expired (or was left at the end).
export function score(s) {
  const c = C();
  const missed = s.expired.filter((m) => !m.scam).length + s.queue.filter((m) => !m.scam).length;
  const total = c.perRight * s.correct + c.perFlag * s.flagsFound - c.perWrong * s.wrong - c.perMissed * missed;
  return { score: Math.round(total), correct: s.correct, wrong: s.wrong, flags: s.flagsFound, missed, lost: s.lost, saved: s.saved, takeovers: s.takeovers };
}

// The biggest decision (2.7): the costliest wrong call, else the hardest right
// one (a real urgent message trusted).
export function biggest(s) {
  const wrong = s.log.filter((r) => !r.correct).sort((a, b) => b.loss - a.loss)[0];
  if (wrong) return { text: `${wrong.action === "block" ? "blocking" : "trusting"} the ${wrong.m.kind.toLowerCase()} from ${wrong.m.sender.map((p) => p.text).join("").replace(/\.$/, "")}` };
  const hard = s.log.find((r) => r.correct && !r.m.scam && r.m.urgent) || s.log.find((r) => r.correct && r.action.startsWith("verify")) || s.log[0];
  if (hard) return { text: `${hard.action === "trust" ? "trusting" : hard.action === "block" ? "blocking" : "verifying"} the ${hard.m.kind.toLowerCase()}` };
  return { text: "how fast to answer versus how carefully" };
}

// ---------- Bots (acceptance tests) ----------

// pick(m) -> action. thinkMs: how long each decision takes.
export function play(seed, pick, { thinkMs = 3000, timed = true } = {}) {
  const c = C();
  const s = newState(newShift(seed, { timed }));
  let t = 0;
  const end = timed ? c.seconds * 1000 : Infinity;
  advance(s, 0);
  while (t < end && !(isOver(s) && !s.lock)) {
    if (s.lock) {
      t += c.tapMs;
      advance(s, t);
      lockTap(s);
      continue;
    }
    if (!s.queue.length) {
      t += 250;
      advance(s, t);
      continue;
    }
    const m = s.queue[0];
    const action = pick(m);
    t += action.startsWith("verify") ? thinkMs + c.verifyMs : thinkMs;
    advance(s, t);
    if (find(s, m.uid)) act(s, m.uid, action, t);
    if (!timed) advance(s, t);
  }
  return s;
}

export const thoughtfulPick = (m) => (m.flags.length ? "block" : "trust");
export const blockAllPick = () => "block";
export const trustAllPick = () => "trust";
export const verifyAllPick = () => "verifyApp";
