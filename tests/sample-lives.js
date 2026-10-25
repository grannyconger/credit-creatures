// Sample lives and contexts shared by the card tests: a spread of situations so
// every card fits at least one of them.
import { E, lifeWith, withCard } from "./helpers.js";

export function sampleLives() {
  const lives = {};
  lives.fresh = lifeWith({ seed: "fresh", checking: 600 });
  lives.subscribed = E.addBill(lifeWith({ seed: "sub", checking: 300 }), "Botify", 10).life;
  lives.smallLoan = E.openPurchaseLoan(lifeWith({ seed: "sl", checking: 700 }), { item: "bike", price: 300, termMonths: 6 }).life;
  lives.broke = lifeWith({ seed: "broke", checking: 60 });
  lives.broke = E.moveToSavings(E.receiveCash(lives.broke, 300, "gift").life, 250).life;
  let { life, id } = withCard(lifeWith({ seed: "card", checking: 900 }), { limit: 500 });
  life = E.cardPurchase(life, id, 220, "stuff").life;
  for (let i = 0; i < 7; i++) {
    life = E.endMonth(life).life;
    const a = E.findAccount(life, id);
    if (a.due) life = E.pay(life, id, a.due.statementBalance).life;
  }
  life = E.cardPurchase(life, id, 150, "more").life;
  life = E.endMonth(life).life;
  lives.withDue = life;
  lives.zeroBalance = E.pay(life, id, E.amountOwed(E.findAccount(life, id))).life;
  let late = E.endMonth(lives.withDue).life;
  lives.late = E.endMonth(late).life;
  lives.lowCashCard = (() => {
    let r = withCard(lifeWith({ seed: "lowcash", checking: 90 }), { limit: 600 });
    return r.life;
  })();
  let secured = lifeWith({ seed: "secured", checking: 800 });
  secured = E.applyForCard(secured, { issuer: "greenvilleFcu", product: "secured", requestedLimit: 200 }).life;
  for (let i = 0; i < 8; i++) secured = E.endMonth(secured).life;
  lives.secured = secured;
  let au = E.joinAsAuthorizedUser(lifeWith({ seed: "au", checking: 700 }), "maxed").life;
  for (let i = 0; i < 7; i++) au = E.endMonth(au).life;
  lives.parentMaxed = au;
  let school = E.startSchool(lifeWith({ seed: "school", checking: 500 })).life;
  for (let i = 0; i < 7; i++) school = E.endMonth(school).life;
  lives.school = school;
  let car = E.openAutoLoan(lifeWith({ seed: "car", checking: 1500 }), { price: 4000, downPayment: 500, termMonths: 48 }).life;
  lives.car = car;
  lives.carBroke = E.debitPurchase(car, car.checking - 150, "repairs").life;
  // Years of careful use: a high score.
  let strong = withCard(lifeWith({ seed: "strong", checking: 3000 }), { limit: 2000 });
  let sl = strong.life;
  for (let i = 0; i < 30; i++) {
    sl = E.cardPurchase(sl, strong.id, 40, "x").life;
    sl = E.endMonth(sl).life;
    const a = E.findAccount(sl, strong.id);
    if (a.due) sl = E.pay(sl, strong.id, a.due.statementBalance).life;
  }
  lives.strong = sl;
  lives.strongCar = E.openAutoLoan(sl, { price: 4000, downPayment: 500, termMonths: 48 }).life;
  const big = withCard(lifeWith({ seed: "bigbal", checking: 900 }), { limit: 1000, annualFee: 39 });
  lives.bigBalance = E.cardPurchase(big.life, big.id, 450, "laptop").life;
  let payday = lifeWith({ seed: "payday", checking: 100 });
  payday = E.receiveCash(payday, 300, "Check Into Dash payday loan").life;
  payday = E.addBill(payday, "Payday loan payback", 345, 1).life;
  lives.paydayDue = E.debitPurchase(payday, 250, "rent").life;
  // Phase 13: out on their own, with a roommate and a car, or alone and insured.
  let renter = lifeWith({ seed: "renter", checking: 900 });
  for (const [name, amount] of [["Rent (shared)", 140], ["Phone", 45], ["Gas and insurance", 90]]) renter = E.addBill(renter, name, amount).life;
  lives.renter = renter;
  let solo = lifeWith({ seed: "solo", checking: 900 });
  solo = E.moveToSavings(solo, 400).life;
  for (const [name, amount] of [["Rent", 240], ["Renter's insurance", 10]]) solo = E.addBill(solo, name, amount).life;
  lives.soloInsured = solo;
  return lives;
}

export const CTXS = [
  { chapter: 2, seen: [], lastChange: null },
  { chapter: 5, seen: [], lastChange: { delta: -14, factor: "owed", message: "Score -14: your utilization went up." } },
];

