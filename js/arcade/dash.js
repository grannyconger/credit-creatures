// Market Dash's rules (GAME-SPECS.md game 13). Pure and seeded. Money in cents.
// Shop for a week of meals, check the receipt, then the week plays out: meals
// get cooked if their ingredients are there and fresh, takeout otherwise, and
// fresh food that's still left when it goes bad is waste.
import { CONFIG } from "../data/config.js";
import { createRng } from "../engine/index.js";
import { DASH_ITEMS, DASH_MEALS, DASH_ROOMMATE } from "../data/arcade/dash.js";

const C = () => CONFIG.arcade.games.dash;
export const ITEMS = DASH_ITEMS.map((it, i) => ({ ...it, i }));
export const unitPrice = (it) => it.price / it.size;

function dealOne(seed, difficulty) {
  const c = C();
  const rng = createRng(`${seed}:dash:${difficulty}`);
  const n = c.meals[difficulty];
  const pool = DASH_MEALS.slice();
  const meals = [];
  while (meals.length < n) meals.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
  const days = [1, 2, 3, 4, 5, 6, 7];
  const picks = [];
  while (picks.length < n) picks.push(days.splice(rng.int(0, days.length - 1), 1)[0]);
  picks.sort((a, b) => a - b);
  const plan = meals.map((m, k) => ({ ...m, day: picks[k] }));
  if (difficulty === "hard") plan.push({ ...DASH_ROOMMATE, day: 7, late: true });
  const needTypes = [...new Set(plan.flatMap((m) => m.needs))];
  // Out of stock: a store-brand item that has a substitute on the shelf.
  const cands = ITEMS.filter((it) => needTypes.includes(it.type) && it.brand === "store" && ITEMS.filter((x) => x.type === it.type).length > 1);
  const out = cands.length ? cands[rng.int(0, cands.length - 1)].i : null;
  const saleAisle = ["Produce", "Dairy", "Pantry", "Protein", "Frozen"][rng.int(0, 4)];
  const errors = ["price", "double", "qty", "tax", "total"];
  return { seed: String(seed), difficulty, plan, out, saleAisle, error: errors[rng.int(0, errors.length - 1)], errRoll: rng.next(), budget: 0 };
}

// The budget comes from what careful shopping costs, so every seed is fair (1.6).
// Also re-rolls until careful shopping can cook every meal (nothing needed late
// in the week spoils before it's needed).
export function newShift(seed, difficulty) {
  let d = dealOne(seed, difficulty);
  for (let t = 1; t < 60 && week(d, thoughtfulCart(d)).cooked < d.plan.length; t++) d = dealOne(`${seed}:${t}`, difficulty);
  const cost = cartTotal(d, thoughtfulCart(d)).total;
  d.budget = Math.round((cost * C().budgetFactor[difficulty]) / 500) * 500;
  return d;
}

export const spoils = (d) => d.difficulty !== "easy";
export const onSale = (d, it, saleOn) => saleOn && it.aisle === d.saleAisle;
export const priceOf = (d, it, saleOn = false) => (onSale(d, it, saleOn) ? Math.round(it.price * (1 - C().saleOff)) : it.price);

// cart: [{ i, sale }] lines (one per unit put in the cart).
export function cartTotal(d, cart) {
  const c = C();
  let sub = 0;
  let taxable = 0;
  for (const line of cart) {
    const it = ITEMS[line.i];
    const p = line.price ?? it.price;
    sub += p;
    if (it.taxable) taxable += p;
  }
  const tax = Math.round(taxable * c.taxRate);
  return { sub, tax, total: sub + tax };
}

// ---------- The week ----------

export function week(d, cart) {
  const c = C();
  const units = cart.map((line) => {
    const it = ITEMS[line.i];
    return { it, left: it.servings, good: spoils(d) ? it.good : 0, paid: line.price ?? it.price };
  });
  const days = [];
  for (const meal of d.plan.slice().sort((a, b) => a.day - b.day)) {
    const use = [];
    for (const t of meal.needs) {
      const ok = units.filter((u) => u.it.type === t && u.left > 0 && (u.good === 0 || meal.day <= u.good)).sort((a, b) => (a.good || 99) - (b.good || 99))[0];
      if (!ok) break;
      use.push(ok);
    }
    const cooked = use.length === meal.needs.length;
    if (cooked) for (const u of use) u.left--;
    days.push({ meal, cooked, takeout: cooked || meal.roommate ? 0 : c.takeout, missing: cooked ? [] : meal.needs.filter((t) => !use.some((u) => u.it.type === t)) });
  }
  // Fresh food that went bad before the week ended, with servings still left, is waste.
  const spoiled = units.filter((u) => u.good && u.good < 7 && u.left > 0).map((u) => ({ name: u.it.name, cents: Math.round((u.paid * u.left) / u.it.servings), day: u.good + 1 }));
  return { days, spoiled, waste: spoiled.reduce((t, x) => t + x.cents, 0), takeout: days.reduce((t, x) => t + x.takeout, 0), cooked: days.filter((x) => x.cooked).length };
}

// ---------- The receipt ----------

// Builds the printed receipt with exactly one planted error. Returns lines,
// the wrong line's id, and how much it overcharges.
export function receipt(d, cart) {
  const groups = [];
  for (const line of cart) {
    const g = groups.find((x) => x.i === line.i && x.price === (line.price ?? ITEMS[line.i].price));
    if (g) g.qty++;
    else groups.push({ i: line.i, qty: 1, price: line.price ?? ITEMS[line.i].price });
  }
  const lines = groups.map((g, k) => ({ id: `r${k}`, name: ITEMS[g.i].name, qty: g.qty, unit: g.price, total: g.qty * g.price, taxable: Boolean(ITEMS[g.i].taxable) }));
  const t = cartTotal(d, cart);
  let kind = d.error;
  if (kind === "qty" && !lines.some((l) => l.qty > 1)) kind = "price";
  if (kind === "tax" && !t.tax) kind = "total";
  let bad = null;
  let over = 0;
  const pick = lines[Math.floor(d.errRoll * lines.length)];
  if (!lines.length) return { lines: [], sub: 0, tax: 0, total: 0, bad: null, over: 0, kind: null };
  if (kind === "price") {
    over = 50 + Math.round(d.errRoll * 50);
    pick.unit += over;
    pick.total = pick.unit * pick.qty;
    over *= pick.qty;
    bad = pick.id;
  } else if (kind === "double") {
    const dup = { ...pick, id: "rdup" };
    lines.splice(lines.indexOf(pick) + 1, 0, dup);
    over = dup.total;
    bad = "rdup";
  } else if (kind === "qty") {
    const q = lines.find((l) => l.qty > 1);
    over = q.unit;
    q.total += q.unit;
    bad = q.id;
  }
  const sub = lines.reduce((s, l) => s + l.total, 0);
  let tax = Math.round(lines.filter((l) => l.taxable).reduce((s, l) => s + l.total, 0) * C().taxRate);
  if (kind === "tax") {
    over = Math.max(25, Math.round(tax * 0.5));
    tax += over;
    bad = "tax";
  }
  let total = sub + tax;
  if (kind === "total") {
    over = 100;
    total += over;
    bad = "total";
  }
  return { lines, sub, tax, total, bad, over, kind };
}

// ---------- Score ----------

// Shop Score = 60 per meal covered + budget left / 2 - waste - takeout + 30 for
// catching the receipt error. Dollars, not cents.
export function score(d, cart, { caught }) {
  const c = C();
  const w = week(d, cart);
  const r = receipt(d, cart);
  const paid = r.total - (caught ? r.over : 0);
  const left = (d.budget - paid) / 100;
  const total = c.perMeal * w.cooked + left / 2 - w.waste / 100 - w.takeout + (caught && r.bad ? c.catchBonus : 0);
  return { score: Math.round(total), cooked: w.cooked, meals: d.plan.length, left: Math.round(left * 100) / 100, waste: w.waste / 100, takeout: w.takeout, paid: paid / 100, over: Math.max(0, -left), week: w, receipt: r, caught: Boolean(caught && r.bad) };
}

export function biggest(d, cart) {
  const bulk = cart.find((l) => ITEMS.some((x) => x.type === ITEMS[l.i].type && x.size < ITEMS[l.i].size));
  if (bulk) return { text: `buying the ${ITEMS[bulk.i].name}` };
  const top = cart.slice().sort((a, b) => (b.price ?? ITEMS[b.i].price) - (a.price ?? ITEMS[a.i].price))[0];
  if (top) return { text: `buying the ${ITEMS[top.i].name}` };
  return { text: "not buying much at all", reasons: { weak: "I didn't have time.", okay: "I wanted to save money.", strong: "I should have planned each meal first, because takeout costs more than groceries." } };
}

// ---------- Bots ----------

// How many servings of each type the plan needs, and the last day each is needed.
function needs(d) {
  const out = {};
  for (const m of d.plan) for (const t of m.needs) {
    out[t] ??= { count: 0, last: 0 };
    out[t].count++;
    out[t].last = Math.max(out[t].last, m.day);
  }
  return out;
}

// Careful: for each needed type, the cheapest way to get enough servings that
// stay fresh until the last meal that needs them.
export function thoughtfulCart(d) {
  const cart = [];
  for (const [t, n] of Object.entries(needs(d))) {
    const opts = ITEMS.filter((it) => it.type === t && it.i !== d.out && (!spoils(d) || !it.good || it.good >= n.last));
    let best = null;
    for (const it of opts) {
      const k = Math.ceil(n.count / it.servings);
      const cost = k * it.price;
      if (!best || cost < best.cost) best = { it, k, cost };
    }
    if (best) for (let j = 0; j < best.k; j++) cart.push({ i: best.it.i });
  }
  return cart;
}

// The lowest unit price for everything (often the bulk pack).
export function cheapestUnitCart(d) {
  const cart = [];
  for (const [t, n] of Object.entries(needs(d))) {
    const it = ITEMS.filter((x) => x.type === t && x.i !== d.out).sort((a, b) => unitPrice(a) - unitPrice(b))[0];
    if (it) for (let j = 0; j < Math.ceil(n.count / it.servings); j++) cart.push({ i: it.i });
  }
  return cart;
}

// Almost nothing: one meal's worth.
export function almostNothingCart(d) {
  const first = d.plan[0];
  return first.needs.map((t) => ({ i: ITEMS.filter((x) => x.type === t && x.i !== d.out).sort((a, b) => a.price - b.price)[0].i }));
}
