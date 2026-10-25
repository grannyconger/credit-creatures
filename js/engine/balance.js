// What you have, what you owe, and the difference (teacher request 2026-10-25).
// Assets are checking, savings, savings locked by a credit-builder loan, and a car
// at resale value (the engine doesn't know about the car, so the caller passes it
// in). Liabilities are everything owed on the student's own accounts, split into
// cards, loans and pay-later plans. An authorized-user card is the parent's debt, so
// it isn't counted. A cosigned loan is shown apart, as what you could owe.
// Pure: it reads a life and changes nothing. The Vault Overview and the card
// Tradeoffs both use it, so they always agree.
import { amountOwed, isOpen } from "./accounts.js";
import { money } from "./util.js";

const sum = (list) => money(list.reduce((s, a) => s + amountOwed(a), 0));

// parts keep their order: the bars draw them left to right in this order.
export function balanceSheet(life, { vehicleValue = 0 } = {}) {
  const own = life.accounts.filter((a) => a.owner === "self" && (isOpen(a) || a.status === "collections"));
  const cards = own.filter((a) => a.kind === "revolving");
  const later = own.filter((a) => a.kind === "bnpl");
  const loans = own.filter((a) => a.kind !== "revolving" && a.kind !== "bnpl");
  const assetParts = [
    { key: "checking", amount: life.checking },
    { key: "savings", amount: life.savings },
    { key: "locked", amount: life.heldSavings || 0 },
    { key: "car", amount: vehicleValue },
  ];
  const liabilityParts = [
    { key: "cards", amount: sum(cards) },
    { key: "loans", amount: sum(loans) },
    { key: "later", amount: sum(later) },
  ];
  const assets = money(assetParts.reduce((s, p) => s + p.amount, 0));
  const liabilities = money(liabilityParts.reduce((s, p) => s + p.amount, 0));
  const cosigned = sum(life.accounts.filter((a) => a.owner === "cosigned" && isOpen(a)));
  return { assets: { total: assets, parts: assetParts }, liabilities: { total: liabilities, parts: liabilityParts }, netWorth: money(assets - liabilities), cosigned };
}

// A car's resale value is half its price (what selling it pays, js/data/garage.js sellSteps).
export const resaleValue = (price) => Math.round(price / 2);
