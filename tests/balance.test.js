// The balance sheet behind the Vault Overview and the card Tradeoffs: assets,
// liabilities and net worth, with the parts a color-coded bar draws.
import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith, withCard } from "./helpers.js";
import { balanceSheet, lifeMetrics, compareChoices, startRow } from "../js/engine/index.js";
import { vehicleValue } from "../js/data/garage.js";

const part = (sheet, side, key) => sheet[side].parts.find((p) => p.key === key).amount;

test("assets are checking, savings, locked savings and the car, and they add up", () => {
  let life = lifeWith({ seed: "bs1", checking: 1000 });
  life = E.moveToSavings(life, 300).life;
  life = E.openCreditBuilderLoan(life).life;
  const sheet = balanceSheet(life, { vehicleValue: 2500 });
  assert.equal(part(sheet, "assets", "checking"), life.checking);
  assert.equal(part(sheet, "assets", "savings"), 300);
  assert.equal(part(sheet, "assets", "locked"), life.heldSavings);
  assert.ok(life.heldSavings > 0);
  assert.equal(part(sheet, "assets", "car"), 2500);
  assert.equal(sheet.assets.total, sheet.assets.parts.reduce((s, p) => s + p.amount, 0));
});

test("liabilities split into cards, loans and pay-later plans, and total what you owe", () => {
  let { life, id } = withCard(lifeWith({ seed: "bs2", checking: 2000 }), { limit: 800 });
  life = E.cardPurchase(life, id, 180, "stuff").life;
  life = E.openPurchaseLoan(life, { item: "couch", price: 600, termMonths: 12 }).life;
  life = E.buyWithBnpl(life, 80, "sneakers").life;
  const sheet = balanceSheet(life);
  assert.equal(part(sheet, "liabilities", "cards"), 180);
  assert.ok(part(sheet, "liabilities", "loans") > 0);
  assert.ok(part(sheet, "liabilities", "later") > 0);
  assert.equal(sheet.liabilities.total, lifeMetrics(life).owed, "the same total the Tradeoffs always used");
  assert.equal(sheet.netWorth, Math.round((sheet.assets.total - sheet.liabilities.total) * 100) / 100);
});

test("a parent's card isn't yours to owe, and a cosigned loan is shown apart", () => {
  let life = lifeWith({ seed: "bs3", checking: 500 });
  life = E.joinAsAuthorizedUser(life, "maxed").life;
  assert.equal(balanceSheet(life).liabilities.total, 0, "authorized-user debt is the parent's");
  life = E.cosign(life, { amount: 600 }).life;
  const sheet = balanceSheet(life);
  assert.equal(sheet.liabilities.total, 0, "cosigned debt isn't in liabilities");
  assert.ok(sheet.cosigned > 0, "but it is the 'you could owe' line");
});

test("the car is half its price, and no ride is worth nothing", () => {
  assert.equal(vehicleValue({ garage: { vehicle: "car" } }), 2500);
  assert.equal(vehicleValue({ garage: { vehicle: "bike" } }), 90);
  assert.equal(vehicleValue({}), 0);
  assert.equal(vehicleValue(null), 0);
});

test("a choice that moves money to savings changes only the savings part, and the sheet never touches the life", () => {
  const life = lifeWith({ seed: "bs4", checking: 600 });
  const before = JSON.stringify(life);
  const choices = [
    { key: "save", label: "Save", steps: [["moveToSavings", 100]], qol: 0 },
    { key: "spend", label: "Spend", cost: { amount: 100, item: "x" }, qol: 3 },
  ];
  const rows = compareChoices(life, choices, { qol: 50, vehicleValue: 2500 });
  const start = startRow(life, 50, 2500);
  const save = rows.find((r) => r.key === "save");
  assert.equal(part(save.sheet, "assets", "savings"), part(start.sheet, "assets", "savings") + 100);
  assert.equal(part(save.sheet, "assets", "checking"), part(start.sheet, "assets", "checking") - 100);
  assert.equal(save.sheet.assets.total, start.sheet.assets.total, "moving money between your own accounts keeps assets the same");
  assert.equal(part(save.sheet, "assets", "car"), 2500, "the car stays put");
  const spend = rows.find((r) => r.key === "spend");
  assert.equal(spend.sheet.assets.total, start.sheet.assets.total - 100);
  assert.equal(JSON.stringify(life), before);
});
