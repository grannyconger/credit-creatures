// A student's save is one Firestore document (saves/{uid}, 1 MiB limit) that is
// rewritten whole on every save. Battle mode will add more to it (Energy, a
// ladder rank, results), so this guards the budget: a bot that plays 12 chapters
// must stay far under the limit, and a chapter must not add more than a few KB.
// If this fails, something new is growing without a cap. Cap it (keep the last N,
// plus counters) before adding more. See docs/BATTLE-SCALING.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith } from "./helpers.js";
import * as P from "../js/play.js";
import { CONFIG } from "../js/data/config.js";

const FIRESTORE_DOC_LIMIT = 1024 * 1024;
const kb = (o) => JSON.stringify(o).length / 1024;
const pickMethod = (life, cost) => E.paymentOptions(life, cost).find((x) => x.ok)?.method ?? null;

test("a 12-chapter save stays far under the Firestore document limit and grows slowly", () => {
  let life = lifeWith({ seed: "size", checking: 400, ageMonths: 216 });
  life = E.addBill(life, "Phone", CONFIG.bills.phone).life;
  life = E.addBill(life, "Bus pass", CONFIG.bills.busPass).life;
  const play = P.newPlay();
  const sizes = [];
  for (let ch = 0; ch < 12; ch++) {
    P.startChapter(play, life);
    while (play.active) {
      const items = [...(play.active.month.life ? ["life"] : []), ...play.active.month.cards.map((_, i) => i)];
      for (const item of items) {
        if (!P.stillFits(play, life, item)) {
          P.skipItem(play, item);
          continue;
        }
        const choices = P.choicesFor(play, life, item).filter((c) => !c.cost || pickMethod(life, c.cost));
        const c = choices.find((x) => !x.disabled) || choices[0];
        const r = c ? P.choose(play, life, item, c.key, c.cost ? pickMethod(life, c.cost) : null) : { ok: false };
        if (!r.ok) {
          P.skipItem(play, item);
          continue;
        }
        life = r.life;
      }
      while (P.shiftsLeft(play) > 0) life = P.workShift(play, life, 90).life;
      for (const a of E.ownCards(life)) {
        const owed = E.amountOwed(a);
        if (owed > 0 && owed <= life.checking) life = E.pay(life, a.id, owed).life;
      }
      life = P.finishMonth(play, life).life;
    }
    P.submitReflection(play, { text: "ok", fun: 4, clear: 5 });
    sizes.push(kb(life) + kb(play));
  }
  const final = sizes.at(-1);
  assert.ok(final < 150, `12 chapters is ${final.toFixed(0)} KB, over the 150 KB budget`);
  assert.ok(final * 1024 < FIRESTORE_DOC_LIMIT / 6, "well under a sixth of the document limit");
  assert.ok((final - sizes[0]) / 11 < 12, `grows ${((final - sizes[0]) / 11).toFixed(1)} KB a chapter, over the 12 KB budget`);
});
