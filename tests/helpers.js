// Shared test setup.
import * as E from "../js/engine/index.js";
import { openCard } from "../js/engine/accounts.js";
import { copyLife } from "../js/engine/life.js";

export { E };

export function lifeWith({ checking = 1000, seed = "test", ...opts } = {}) {
  let life = E.createLife({ seed, ...opts });
  if (checking) life = E.earn(life, checking, "test money").life;
  return life;
}

// Opens a card directly, skipping the approval roll.
export function withCard(life, { limit = 500, apr = 0.24, annualFee = 0, name = "Test Card" } = {}) {
  const next = copyLife(life);
  const a = openCard(next, { product: "student", name, issuer: "chase", network: "visa", icon: "🏛️", limit, apr, annualFee });
  return { life: next, id: a.id };
}

export function months(life, n, each = (l) => l) {
  const events = [];
  for (let i = 0; i < n; i++) {
    life = each(life);
    const r = E.endMonth(life);
    life = r.life;
    events.push(...r.events);
  }
  return { life, events };
}

export function card(life, id) {
  return E.findAccount(life, id);
}

export function deepFreeze(o) {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
}
