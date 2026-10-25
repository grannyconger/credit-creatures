// Chapter 2 (Phase 10): installment loans for things you can see. Rides at the
// Garage and upgrades for your Cottage. Cash or a loan, with every number shown.
// Plain language for a 15-year-old. No em-dashes, no semicolons.
import { quoteAutoLoan, quotePurchaseLoan } from "../engine/index.js";

// bonus: extra pay per shift (a ride gets you to better jobs). bill: its
// monthly running cost. loan: the terms you can pick, or null for cash only.
export const VEHICLES = [
  { id: "bike", icon: "🚲", name: "Trail bike", price: 180, bonus: 2, bill: null, dropsBus: true, loan: null, about: "Free to ride and good exercise. You can drop the $30 bus pass." },
  { id: "moped", icon: "🛵", name: "Moss moped", price: 1400, bonus: 5, bill: ["Moped gas and insurance", 35], dropsBus: true, loan: { terms: [12, 24], downs: [0, 200, 400] }, about: "Gets you to jobs across town. Gas and insurance cost $35 a month." },
  { id: "car", icon: "🚗", name: "Used car", price: 5000, bonus: 10, bill: ["Gas and insurance", 90], dropsBus: true, loan: { terms: [36, 48, 60], downs: [0, 500, 1000] }, about: "Reliable and roomy. Gas and insurance cost $90 a month." },
  { id: "newCar", icon: "🏎️", name: "Shiny new car", price: 16000, bonus: 10, bill: ["Gas and insurance", 120], dropsBus: true, loan: { terms: [60, 72], downs: [0, 1000, 2000] }, about: "So shiny! It gets you to the same jobs as the used car. Gas and insurance cost $120 a month." },
];
export const VEHICLE_BY_ID = Object.fromEntries(VEHICLES.map((v) => [v.id, v]));

// A home improvement loan is a purchase loan for your Cottage. effect.bonus
// adds pay per shift (a workshop lets you take craft jobs at home).
export const HOME_UPGRADES = [
  { id: "rug", icon: "🧶", name: "Cozy rug", price: 120, loan: null, about: "Warm feet and a homier Cottage." },
  { id: "garden", icon: "🥕", name: "Veggie garden", price: 300, loan: { terms: [12], apr: 0.1 }, about: "Fresh vegetables and flowers by the door." },
  { id: "roof", icon: "🏠", name: "New roof", price: 1500, loan: { terms: [12, 24], apr: 0.09 }, about: "No more drips when it rains. Your Cottage gets a shiny gold roof." },
  { id: "workshop", icon: "🛠️", name: "Crafting workshop", price: 2400, bonus: 5, loan: { terms: [24, 36], apr: 0.11 }, about: "A shed for making things to sell. +$5 on every shift." },
];
export const HOME_BY_ID = Object.fromEntries(HOME_UPGRADES.map((u) => [u.id, u]));

// The numbers for one way to pay. plan = { cash: true } or { term, down }.
export function vehicleQuote(life, v, plan) {
  if (plan.cash) return { cash: true, today: v.price, total: v.price };
  const q = quoteAutoLoan(life, { price: v.price, downPayment: plan.down, termMonths: plan.term });
  return { ...q, today: plan.down, total: Math.round((q.payment * plan.term + plan.down) * 100) / 100 };
}

export function homeQuote(life, u, plan) {
  if (plan.cash) return { cash: true, today: u.price, total: u.price };
  const q = quotePurchaseLoan(life, { price: u.price, termMonths: plan.term, apr: u.loan.apr });
  return { ...q, today: 0, total: Math.round(q.payment * plan.term * 100) / 100 };
}

// Engine steps to buy it (logged, so replay redoes them).
export function vehicleSteps(life, v, plan) {
  const steps = plan.cash ? [["debitPurchase", v.price, v.name.toLowerCase()]] : [["openAutoLoan", { price: v.price, downPayment: plan.down, termMonths: plan.term, lender: "creditUnion" }]];
  if (v.dropsBus && life.bills.some((b) => b.name === "Bus pass")) steps.push(["removeBill", "Bus pass"]);
  if (v.bill) steps.push(["addBill", ...v.bill]);
  return steps;
}

export function homeSteps(u, plan) {
  if (plan.cash) return [["debitPurchase", u.price, u.name.toLowerCase()]];
  return [["openPurchaseLoan", { item: u.name.toLowerCase(), price: u.price, termMonths: plan.term, apr: u.loan.apr, lender: "creditUnion", type: "homeLoan", icon: u.icon }]];
}

// What the student's ride is worth now, for net worth: half its price. 0 with no ride.
export function vehicleValue(play) {
  const v = VEHICLE_BY_ID[play?.garage?.vehicle];
  return v ? Math.round(v.price / 2) : 0;
}

// Selling a ride gets back half its price. Any loan on it keeps going.
export function sellSteps(life, v) {
  const steps = [["receiveCash", Math.round(v.price / 2), `sold the ${v.name.toLowerCase()}`]];
  if (v.bill) steps.push(["removeBill", v.bill[0]]);
  if (v.dropsBus && !life.bills.some((b) => b.name === "Bus pass")) steps.push(["addBill", "Bus pass", 30]);
  return steps;
}
