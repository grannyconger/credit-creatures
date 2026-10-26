// The Grind's rules (GAME-SPECS.md game 9). Pure and seeded. Two modes.
// Delivery runs on game minutes (a 4-hour evening) so the UI can map real
// seconds onto it and Node tests can play a whole evening instantly.
import { CONFIG } from "../data/config.js";
import { createRng } from "../engine/index.js";
import { GR_RESTAURANTS, GR_OFFERS, GR_STUB_ERRORS } from "../data/arcade/grind.js";

const C = () => CONFIG.arcade.games.grind;
const r2 = (x) => Math.round(x * 100) / 100;

// ======================= Delivery =======================

export function newDelivery(seed) {
  const c = C().delivery;
  const rng = createRng(`${seed}:delivery`);
  const offers = Array.from({ length: 60 }, (_, i) => {
    const bad = rng.chance(c.badShare);
    const miles = r2(bad ? rng.range(5.5, 9.5) : rng.range(1.2, 4.5));
    const base = r2(bad ? rng.range(2.5, 3.5) : rng.range(3.5, 6));
    const tip = r2(bad ? rng.range(0, 2) : rng.range(2.5, 8.5));
    const minutes = Math.round(8 + miles * 3 + rng.int(0, 6));
    return { i, restaurant: GR_RESTAURANTS[rng.int(0, GR_RESTAURANTS.length - 1)], base, tip, miles, minutes, bait: rng.chance(c.baitShare), wait: 0 };
  });
  offers[rng.int(4, 14)].wait = c.longWait;
  return { seed: String(seed), offers, surgeAt: rng.int(c.surgeAt[0], c.surgeAt[1]), carAt: rng.int(c.carAt[0], c.carAt[1]), gaps: Array.from({ length: 60 }, () => rng.int(c.gap[0], c.gap[1])) };
}

export function deliveryState(deal) {
  return { deal, t: 0, next: 0, offer: null, offerAt: 0, nextOfferAt: deal.gaps[0], busyUntil: 0, current: null, offered: 0, accepted: 0, declined: 0, earned: 0, miles: 0, done: [], lowRate: false, carDone: false, surge: false, surgeDone: false, baits: 0, ended: false };
}

export const surgeOn = (s, t = s.t) => t >= s.deal.surgeAt && t < s.deal.surgeAt + C().delivery.surgeMin;
export const offerPay = (s, o, t = s.t) => r2((o.base + o.tip) * (surgeOn(s, t) ? 2 : 1));
export const acceptRate = (s) => (s.offered ? s.accepted / s.offered : 1);
export const gasFor = (miles) => r2(miles * C().delivery.gasPerMile);

// Moves the evening to minute t. Returns events for the UI and its echoes.
export function deliveryTick(s, t) {
  const c = C().delivery;
  const ev = [];
  s.t = t;
  if (!s.carDone && t >= s.deal.carAt) {
    s.carDone = true;
    ev.push({ type: "car" });
    if (s.current) s.busyUntil += c.carMin;
    else s.nextOfferAt = Math.max(s.nextOfferAt, t + c.carMin);
    if (s.offer) {
      s.offer = null;
      s.nextOfferAt = t + c.carMin;
    }
  }
  if (!s.surge && surgeOn(s, t)) {
    s.surge = true;
    ev.push({ type: "surge" });
  }
  if (s.surge && !s.surgeDone && !surgeOn(s, t) && t >= s.deal.surgeAt) {
    s.surgeDone = true;
    ev.push({ type: "surgeEnd" });
  }
  if (s.current && t >= s.busyUntil) {
    const o = s.current;
    const tipPaid = o.bait ? r2(o.tip * c.baitKeep) : o.tip;
    const pay = r2((o.base + tipPaid) * (o.surge ? 2 : 1));
    s.earned = r2(s.earned + pay);
    s.miles = r2(s.miles + o.miles);
    s.done.push({ ...o, pay, tipPaid, endedAt: s.busyUntil });
    if (o.bait) s.baits++;
    ev.push({ type: "delivered", o, pay, bait: o.bait, promised: r2((o.base + o.tip) * (o.surge ? 2 : 1)) });
    s.current = null;
    s.nextOfferAt = s.busyUntil + gap(s);
  }
  if (s.offer && t >= s.offerAt + c.windowMin) {
    ev.push({ type: "missed", o: s.offer });
    decline(s, t, true);
  }
  if (!s.offer && !s.current && t >= s.nextOfferAt && t < c.shiftMin && s.next < s.deal.offers.length) {
    s.offer = s.deal.offers[s.next++];
    s.offerAt = t;
    s.offered++;
    ev.push({ type: "offer", o: s.offer });
  }
  return ev;
}

function gap(s) {
  const c = C().delivery;
  const g = s.deal.gaps[s.next % s.deal.gaps.length];
  return s.lowRate ? Math.round(g * c.lowRateGap) : g;
}

export function accept(s, t = s.t) {
  if (!s.offer) return null;
  const o = { ...s.offer, surge: surgeOn(s, t) };
  s.offer = null;
  s.accepted++;
  s.current = o;
  s.busyUntil = t + o.minutes + o.wait;
  return o;
}

function decline(s, t, timedOut = false) {
  const c = C().delivery;
  s.offer = null;
  s.declined++;
  if (!s.lowRate && s.offered >= c.lowRateAfter && acceptRate(s) < c.lowRate) s.lowRate = true;
  s.nextOfferAt = t + gap(s);
  return timedOut;
}
export const declineOffer = (s, t = s.t) => (s.offer ? (decline(s, t), true) : false);

// Payday: the tax jar against a simplified tax bill on profit.
export function deliveryPayday(s, jarPct) {
  const c = C().delivery;
  const hours = Math.max(c.shiftMin, s.done.at(-1)?.endedAt || 0) / 60;
  const gas = gasFor(s.miles);
  const profit = r2(s.earned - gas);
  const tax = r2(Math.max(0, profit) * c.taxRate);
  const jar = r2(Math.max(0, profit) * jarPct);
  const short = r2(Math.max(0, tax - jar));
  const penalty = short > 0 ? r2(Math.max(c.penaltyMin, short * c.penaltyRate)) : 0;
  const net = r2(profit - tax - penalty);
  const rate = r2(net / hours);
  return { earned: s.earned, gas, profit, tax, jar, short, penalty, net, hours: r2(hours), rate, metric: Math.round(rate * 100), points: Math.round(profit - short - penalty), deliveries: s.done.length, acceptRate: acceptRate(s) };
}

// Bots for the acceptance tests. decide(s, offer) -> true to accept.
export function playDelivery(seed, decide, { thinkMin = 2 } = {}) {
  const c = C().delivery;
  const s = deliveryState(newDelivery(seed));
  for (let t = 0; t <= c.shiftMin + 120; t++) {
    deliveryTick(s, t);
    if (s.offer && t >= s.offerAt + thinkMin) (decide(s, s.offer) ? accept : declineOffer)(s, t);
    if (t >= c.shiftMin && !s.current) break;
  }
  return s;
}
export const acceptAllBot = () => true;
export function selectiveBot(s, o) {
  const c = C().delivery;
  const keep = (offerPay(s, o) - gasFor(o.miles)) / (o.minutes + o.wait);
  if (keep >= c.goodPerMin) return true;
  // A weak offer, but take it anyway if declining would sink the acceptance rate.
  return s.accepted / s.offered < c.lowRate + 0.05;
}

// ======================= Store =======================

export function newStore(seed) {
  const c = C().store;
  const rng = createRng(`${seed}:store`);
  const pool = GR_OFFERS.filter((o) => o.kind !== "cut");
  const pick = (kind, n) => {
    const p = pool.filter((o) => o.kind === kind);
    return Array.from({ length: n }, () => p[rng.int(0, p.length - 1)]);
  };
  const offers = [...pick("extra", 3), ...pick("overtime", 2), ...pick("swap", rng.int(1, 2)), ...pick("cover", 1)].map((o) => ({ ...o, week: rng.int(1, 2) }));
  for (let i = offers.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [offers[i], offers[j]] = [offers[j], offers[i]];
  }
  const cut = rng.chance(c.cutChance) ? { ...GR_OFFERS.find((o) => o.kind === "cut"), week: rng.int(1, 2), at: rng.int(2, offers.length - 2) } : null;
  const errors = GR_STUB_ERRORS;
  return { seed: String(seed), offers, cut, stubError: errors[rng.int(0, errors.length - 1)], swapError: errors.filter((e) => e.kind !== "overtime1x")[rng.int(0, 9)] };
}

export function storeState(deal) {
  const c = C().store;
  return { deal, i: 0, hours: [c.baseHours, c.baseHours], energy: c.energy, sick: 0, sickWeeks: [], decisions: [], cutDone: false };
}

export const currentOffer = (s) => s.deal.offers[s.i] || null;

// Accept or decline the current offer. Returns what happened.
export function storeDecide(s, yes) {
  const c = C().store;
  const o = currentOffer(s);
  if (!o) return null;
  s.i++;
  const out = { o, yes, sick: false };
  if (yes) {
    s.hours[o.week - 1] += o.hours;
    s.energy--;
    if (s.energy <= 0) {
      // Worn out: the next shift becomes a sick day (lost pay), then some rest.
      s.sick++;
      s.sickWeeks.push(o.week);
      s.hours[o.week - 1] -= c.shiftHours;
      s.energy = c.restTo;
      out.sick = true;
    }
  }
  s.decisions.push(out);
  // A schedule cut can land partway through.
  if (s.deal.cut && !s.cutDone && s.i >= s.deal.cut.at) {
    s.cutDone = true;
    s.hours[s.deal.cut.week - 1] += s.deal.cut.hours;
    out.cut = s.deal.cut;
  }
  return out;
}

export function weekPay(h, wage) {
  const reg = Math.min(40, h);
  const ot = Math.max(0, h - 40);
  return { reg, ot, regPay: r2(reg * wage), otPay: r2(ot * wage * 1.5) };
}

// The stub as it should be, and the one payroll printed (with its error).
export function stub(s) {
  const c = C().store;
  const w = s.hours.map((h) => weekPay(h, c.wage));
  const reg = w.reduce((t, x) => t + x.reg, 0);
  const ot = w.reduce((t, x) => t + x.ot, 0);
  const real = lines(reg, ot, c.wage);
  let err = s.deal.stubError;
  if (err.kind === "overtime1x" && !ot) err = s.deal.swapError;
  let printed;
  if (err.kind === "hours") printed = lines(reg - (Number(err.text.match(/\d+/)?.[0]) || 4), ot, c.wage);
  else if (err.kind === "rate") printed = lines(reg, ot, c.wage - (/50 cents/.test(err.text) ? 0.5 : 1), c.wage);
  else if (err.kind === "overtime1x") printed = lines(reg, ot, c.wage, c.wage, 1);
  else printed = lines(Math.max(0, reg - c.shiftHours), ot, c.wage);
  const bad = err.kind === "rate" ? "rate" : err.kind === "overtime1x" ? "otRate" : "regHours";
  return { real, printed, error: err, bad, missing: r2(real.net - printed.net) };
}

function lines(reg, ot, rate, otBase = rate, otMult = 1.5) {
  const c = C().store;
  const regPay = r2(reg * rate);
  const otRate = r2(otBase * otMult);
  const otPay = r2(ot * otRate);
  const gross = r2(regPay + otPay);
  const fed = r2(gross * c.tax.federal);
  const state = r2(gross * c.tax.state);
  const ss = r2(gross * c.tax.socialSecurity);
  const med = r2(gross * c.tax.medicare);
  return { regHours: reg, rate, regPay, otHours: ot, otRate, otPay, gross, fed, state, ss, med, net: r2(gross - fed - state - ss - med) };
}

// Payday Score = net pay / 5 + a prediction bonus (up to 50) + 40 for finding
// the stub error. Missing the error means the missing pay is lost.
export function storePayday(s, { predicted, found }) {
  const c = C().store;
  const st = stub(s);
  const net = found ? st.real.net : st.printed.net;
  const off = Math.abs(predicted - st.real.net) / Math.max(1, st.real.net);
  const bonus = Math.round(c.predictMax * Math.max(0, 1 - off / c.predictBand));
  const hours = s.hours.reduce((a, b) => a + b, 0);
  const score = Math.round(net / 5 + bonus + (found ? c.stubBonus : 0));
  return { score, net, bonus, found, missing: st.missing, sick: s.sick, hours, rate: r2(net / Math.max(1, hours)), stub: st };
}

// Bots for the acceptance tests.
export function playStore(seed, yesBot) {
  const s = storeState(newStore(seed));
  while (currentOffer(s)) storeDecide(s, yesBot(s, currentOffer(s)));
  return s;
}
export const yesAllBot = () => true;
export const carefulBot = (s, o) => (o.kind === "extra" || o.kind === "overtime") && s.energy >= 2;

// ======================= Both =======================

// Salary at 40 and 50 hours a week, after the same simplified taxes.
export function compareRates() {
  const c = C();
  const t = c.store.tax;
  const keep = 1 - t.federal - t.state - t.socialSecurity - t.medicare;
  return { store: r2(c.store.wage * keep), salary40: r2((c.salary / (52 * 40)) * keep), salary50: r2((c.salary / (52 * 50)) * keep), keep };
}
