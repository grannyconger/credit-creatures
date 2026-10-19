// Player bots for the 1,000-life simulation. They use only the public engine API.
import * as E from "../../js/engine/index.js";

const cards = (life) => life.accounts.filter((a) => a.type === "card" && a.status === "open");

function tryApply(life, app) {
  const r = E.applyForCard(life, app);
  return r.ok ? r.life : life;
}

// Spends a share of each card's limit, but no more than `budget` in total this month.
function spendOnCards(life, rng, [lo, hi], budget = Infinity) {
  for (const c of cards(life)) {
    const target = c.limit * rng.range(lo, hi);
    const room = c.limit - E.amountOwed(c);
    const amount = Math.round(Math.min(target, room, budget) * 100) / 100;
    budget -= amount;
    if (amount > 1) life = E.cardPurchase(life, c.id, amount, "stuff").life;
  }
  return life;
}

// Pays each card's statement. how(card) returns "full", "min", "none" or a dollar amount.
function payCards(life, how) {
  for (const c of cards(life)) {
    if (!c.due || c.due.minDue <= 0) continue;
    const mode = how(c);
    let amount = 0;
    if (mode === "full") amount = c.due.statementBalance;
    else if (mode === "min") amount = c.due.minDue;
    else if (typeof mode === "number") amount = mode;
    amount = Math.min(amount, life.checking);
    if (amount > 0) {
      const r = E.pay(life, c.id, amount);
      if (r.ok) life = r.life;
    }
  }
  return life;
}

function workShifts(life, rng) {
  for (let i = 0; i < 3; i++) life = E.earn(life, rng.int(40, 120)).life;
  return life;
}

export const STRATEGIES = {
  careful: {
    reckless: false,
    setup(life, rng) {
      life = E.earn(life, 400, "saved birthday money").life;
      if (rng.chance(0.4)) life = E.joinAsAuthorizedUser(life).life;
      return life;
    },
    month(life, rng) {
      life = workShifts(life, rng);
      const m = life.month;
      const au = life.accounts.find((a) => a.owner === "authorized");
      if (au && au.parentProfile === "maxed") life = E.removeAuthorizedUser(life).life;
      if (cards(life).length === 0) {
        life = tryApply(life, { issuer: "capitalOne", product: "secured", requestedLimit: 300 });
        for (const c of cards(life)) life = E.setAutopay(life, c.id, "full").life;
      }
      if (m === 8 && rng.chance(0.5)) life = E.openCreditBuilderLoan(life).life;
      if (m === 20 && life.score >= 680 && cards(life).length < 2) {
        life = tryApply(life, { issuer: "discover", product: "student", requestedLimit: 700 });
        for (const c of cards(life)) life = E.setAutopay(life, c.id, "full").life;
      }
      life = payCards(life, () => "full");
      return spendOnCards(life, rng, [0.03, 0.12]);
    },
  },

  average: {
    reckless: false,
    setup(life, rng) {
      life = E.earn(life, 200, "saved birthday money").life;
      if (rng.chance(0.4)) life = E.joinAsAuthorizedUser(life).life;
      return life;
    },
    month(life, rng) {
      life = workShifts(life, rng);
      if (cards(life).length === 0 && life.month % 3 === 0) {
        life = tryApply(life, { issuer: "chase", product: "student", requestedLimit: 600 });
      }
      if (life.month === 15) life = tryApply(life, { issuer: "creditUnion", product: "creditBuilder", requestedLimit: 400 });
      life = payCards(life, () => (rng.chance(0.04) ? "none" : rng.chance(0.7) ? "full" : "min"));
      return spendOnCards(life, rng, [0.15, 0.4], rng.range(90, 160));
    },
  },

  minimumPayer: {
    reckless: false,
    setup(life, rng) {
      if (rng.chance(0.4)) life = E.joinAsAuthorizedUser(life).life;
      return life;
    },
    month(life, rng) {
      life = workShifts(life, rng);
      if (cards(life).length === 0 && life.month % 3 === 0) {
        life = tryApply(life, { issuer: "discover", product: "student", requestedLimit: 800 });
      }
      life = payCards(life, () => "min");
      return spendOnCards(life, rng, [0.1, 0.2]);
    },
  },

  reckless: {
    reckless: true,
    setup(life, rng) {
      if (rng.chance(0.5)) life = E.joinAsAuthorizedUser(life).life;
      return life;
    },
    month(life, rng) {
      life = workShifts(life, rng);
      if (life.month % 6 === 0) {
        life = tryApply(life, { issuer: "capitalOne", product: "premium", requestedLimit: 15000, design: "metal" });
        life = tryApply(life, { issuer: "chase", product: "student", requestedLimit: 1000, design: "metal" });
        life = tryApply(life, { issuer: "creditUnion", product: "creditBuilder", requestedLimit: 600 });
      }
      if (rng.chance(0.3)) {
        for (let i = 0; i < 2; i++) {
          const r = E.buyWithBnpl(life, rng.int(80, 250), "gadget");
          if (r.ok) life = r.life;
        }
      }
      life = payCards(life, () => (rng.chance(0.3) ? "none" : "min"));
      return spendOnCards(life, rng, [0.6, 1]);
    },
  },

  ghost: {
    reckless: true,
    setup(life) {
      return life;
    },
    month(life, rng) {
      life = workShifts(life, rng);
      if (cards(life).length < 2 && life.month % 4 === 0) {
        life = tryApply(life, { issuer: "creditUnion", product: "creditBuilder", requestedLimit: 600 });
        life = tryApply(life, { issuer: "discover", product: "student", requestedLimit: 1000 });
      }
      return spendOnCards(life, rng, [0.8, 1]);
    },
  },
};
