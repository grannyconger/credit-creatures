import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith, withCard } from "./helpers.js";
import { SCENARIOS } from "../js/data/scenarios.js";
import { LIFE_EVENTS } from "../js/data/life-events.js";
import * as P from "../js/play.js";
import { CONFIG } from "../js/data/config.js";

const asList = (t) => (Array.isArray(t) ? t : [t]);

function checkText(s, where) {
  assert.equal(typeof s, "string", where);
  assert.ok(s.length > 0, where);
  assert.ok(!s.includes("—"), `em-dash in ${where}: ${s}`);
  assert.ok(!s.includes(";"), `semicolon in ${where}: ${s}`);
  assert.ok(!/undefined|NaN|\[object/.test(s), `bad value in ${where}: ${s}`);
}

import { sampleLives, CTXS } from "./sample-lives.js";

function pickMethod(life, cost) {
  const o = E.paymentOptions(life, cost).find((x) => x.ok);
  return o ? o.method : null;
}

test("every card and life event has unique ids and valid fields", () => {
  const ids = [...SCENARIOS, ...LIFE_EVENTS].map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(SCENARIOS.length >= 20, `only ${SCENARIOS.length} scenarios`);
  for (const s of SCENARIOS) {
    assert.ok(["banking", "types", "costs", "pitfalls", "profile"].includes(s.group), s.id);
    assert.ok(s.standards.length > 0, s.id);
    checkText(s.title, s.id);
  }
  for (const g of ["banking", "types", "costs", "pitfalls", "profile"]) assert.ok(SCENARIOS.filter((s) => s.group === g).length >= 3, g);
});

test("every card fits some life, and every choice runs, logs and replays", () => {
  const lives = sampleLives();
  const fitted = new Set();
  for (const def of [...SCENARIOS, ...LIFE_EVENTS]) {
    for (const [name, life] of Object.entries(lives)) {
      // Test lives made with withCard skip the log, so only some can replay.
      const replayable = JSON.stringify(E.replayLife(life.start, life.log)) === JSON.stringify(life);
      for (const base of CTXS) {
        const ctx = { ...base, amount: def.amount ? def.amount[0] : 0 };
        if (def.fits && !def.fits(life, ctx)) continue;
        fitted.add(def.id);
        const where = `${def.id} on ${name}`;
        asList(def.text(life, ctx)).forEach((t) => checkText(t, where));
        const choices = def.choices(life, ctx);
        assert.ok(choices.length >= 1, where);
        for (const c of choices) {
          checkText(c.label, `${where} label`);
          if (c.detail) checkText(c.detail, `${where} detail`);
          if (c.math) checkText(c.math, `${where} math`);
          if (c.disabled) {
            checkText(c.disabled, `${where} disabled`);
            continue;
          }
          const method = c.cost ? pickMethod(life, c.cost) : null;
          if (c.cost && !method) continue;
          const r = E.resolveChoice(life, c, method);
          assert.ok(r.ok, `${where} ${c.key}: ${r.message}`);
          const out = typeof c.outcome === "function" ? c.outcome(r, r.life) : c.outcome;
          checkText(out, `${where} ${c.key} outcome`);
          if (replayable) assert.equal(JSON.stringify(E.replayLife(r.life.start, r.life.log)), JSON.stringify(r.life), `${where} ${c.key} replay`);
        }
      }
    }
  }
  const never = [...SCENARIOS, ...LIFE_EVENTS].map((s) => s.id).filter((id) => !fitted.has(id));
  assert.deepEqual(never, [], "cards that never fit a sample life");
});

// A bot that plays chapters the way a careful student would.
function playChapters(seed, chapters, pick = (choices) => choices.find((c) => !c.disabled)) {
  let life = lifeWith({ seed, checking: 400, ageMonths: 216 });
  life = E.addBill(life, "Phone", CONFIG.bills.phone).life;
  life = E.addBill(life, "Bus pass", CONFIG.bills.busPass).life;
  const play = P.newPlay();
  for (let ch = 0; ch < chapters; ch++) {
    P.startChapter(play, life);
    while (play.active) {
      const items = [...(play.active.month.life ? ["life"] : []), ...play.active.month.cards.map((_, i) => i)];
      for (const item of items) {
        if (!P.stillFits(play, life, item)) {
          P.skipItem(play, item);
          continue;
        }
        const choices = P.choicesFor(play, life, item).filter((c) => !c.cost || pickMethod(life, c.cost));
        const c = pick(choices) || choices[0];
        let r = c ? P.choose(play, life, item, c.key, c.cost ? pickMethod(life, c.cost) : null) : { ok: false };
        if (!r.ok) {
          P.skipItem(play, item);
          continue;
        }
        life = r.life;
      }
      while (P.shiftsLeft(play) > 0) life = P.workShift(play, life, 100).life;
      for (const a of E.ownCards(life)) {
        const owed = E.amountOwed(a);
        if (owed > 0 && owed <= life.checking) life = E.pay(life, a.id, owed).life;
      }
      const end = P.finishMonth(play, life);
      assert.ok(end.ok);
      life = end.life;
    }
    assert.ok(play.summary);
    P.completeChapter(play);
  }
  return { life, play };
}

test("a careful bot plays 4 chapters, and the life replays byte for byte", () => {
  const { life, play } = playChapters("bot-careful", 4);
  assert.equal(play.chapter, 6);
  assert.equal(play.history.length, 4);
  assert.equal(life.log.filter((e) => e.action === "endMonth").length, 4 * CONFIG.pacing.monthsPerChapter);
  assert.equal(JSON.stringify(E.replayLife(life.start, life.log)), JSON.stringify(life));
  // Only the newest chapter keeps month records.
  assert.ok(play.history.at(-1).records.length === CONFIG.pacing.monthsPerChapter);
  assert.ok(play.history.slice(0, -1).every((h) => !h.records));
});

test("a reckless bot plays too, and the summary names a worst decision", () => {
  const worstFirst = (choices) => choices.find((c) => !c.disabled && c.quality === "bad") || choices.find((c) => !c.disabled);
  const { life, play } = playChapters("bot-reckless", 3, worstFirst);
  assert.equal(JSON.stringify(E.replayLife(life.start, life.log)), JSON.stringify(life));
  assert.ok(play.history.some((h) => h.worst));
});

test("the same month always draws the same cards, and once-only cards don't repeat", () => {
  const life = lifeWith({ seed: "draw", checking: 500 });
  const ctx = { chapter: 4, seen: [], lastChange: null };
  const a = E.drawDecisionCards(life, SCENARIOS, ctx);
  assert.deepEqual(E.drawDecisionCards(life, SCENARIOS, ctx), a);
  assert.ok(a.length <= CONFIG.pacing.decisionCardsPerMonth);
  const again = E.drawDecisionCards(life, SCENARIOS, { ...ctx, seen: a });
  for (const id of again) assert.ok(!a.includes(id) || SCENARIOS.find((s) => s.id === id).once === false, id);
});

test("chapter release gates play", () => {
  const play = P.newPlay();
  assert.equal(P.canPlay(play, 1), false);
  assert.equal(P.canPlay(play, 2), true);
});

test("practice mode rebuilds the life at a chapter's start and replays the same cards", () => {
  const { life, play } = playChapters("bot-practice", 2);
  const save = { life, play };
  const h = play.history[0];
  const p = P.startPractice(save, h.chapter);
  assert.equal(p.life.month, h.startMonth);
  assert.equal(p.life.score, h.startScore);
  assert.equal(p.play.active.chapter, h.chapter);
  // The live save is untouched.
  assert.equal(save.play.chapter, 4);
});

test("a work shift pays into checking as income, and the month asks for 3 shifts but never caps them", () => {
  const play = P.newPlay();
  let life = lifeWith({ seed: "shift", checking: 100 });
  P.startChapter(play, life);
  for (let i = 0; i < 3; i++) life = P.workShift(play, life, 80).life;
  assert.equal(life.checking, 340);
  assert.equal(life.incomeThisMonth, 340);
  assert.equal(P.shiftsLeft(play), 0);
  const more = P.workShift(play, life, 80);
  assert.ok(more.ok, "a fourth shift still pays");
  assert.equal(more.life.checking, 420);
});

test("limited bills end after their months, and a bounced one stays", () => {
  let life = lifeWith({ seed: "bills", checking: 500 });
  life = E.addBill(life, "Plan", 100, 2).life;
  life = E.endMonth(life).life;
  assert.equal(life.bills.find((b) => b.name === "Plan").monthsLeft, 1);
  life = E.endMonth(life).life;
  assert.equal(life.bills.find((b) => b.name === "Plan"), undefined);
  let broke = lifeWith({ seed: "bills2", checking: 10 });
  broke = E.addBill(broke, "Payback", 345, 1).life;
  broke = E.endMonth(broke).life;
  assert.equal(broke.bills.find((b) => b.name === "Payback").monthsLeft, 1);
});

test("a bill can wait months before its first payment", () => {
  let life = lifeWith({ seed: "later", checking: 2000 });
  life = E.addBill(life, "Later", 381, 1, 5).life;
  for (let i = 0; i < 5; i++) {
    assert.ok(life.bills.some((b) => b.name === "Later"), `still waiting after ${i} months`);
    assert.equal(E.upcomingPayments(life).auto.some((x) => x.name === "Later"), false);
    life = E.endMonth(life).life;
  }
  assert.ok(E.upcomingPayments(life).auto.some((x) => x.name === "Later"));
  const before = life.checking;
  life = E.endMonth(life).life;
  assert.equal(before - life.checking, 381);
  assert.equal(life.bills.some((b) => b.name === "Later"), false);
  assert.equal(JSON.stringify(E.replayLife(life.start, life.log)), JSON.stringify(life));
});

test("quests earn XP: each card by how well the choice went, and each finished month", () => {
  const { play } = playChapters("bot-careful", 1);
  const x = CONFIG.pacing.xp;
  const decisions = play.history[0].decisions.length;
  const months = play.history[0].months;
  const base = months * x.month + x.chapterDone;
  assert.ok(play.xp >= base + decisions * x.card.bad, `xp ${play.xp} is at least ${base} plus ${decisions} cards`);
  assert.ok(play.xp <= base + decisions * x.card.good, `xp ${play.xp} is at most ${base} plus ${decisions} good cards`);
  assert.equal(play.stats.shifts, 0, "this bot's shifts went through workShift, which never pays XP");
});

test("a choice returns its XP, better choices earn more, and a finished month earns the month XP", () => {
  const life = lifeWith({ seed: "xp", checking: 600 });
  const play = P.newPlay();
  P.startChapter(play, life);
  const item = play.active.month.life ? "life" : 0;
  const choice = P.choicesFor(play, life, item).find((c) => !c.cost && !c.disabled);
  const r = P.choose(play, life, item, choice.key);
  assert.ok(r.ok);
  assert.equal(r.xp, CONFIG.pacing.xp.card[choice.quality] ?? CONFIG.pacing.xp.card.none);
  assert.equal(play.xp, r.xp);
  assert.ok(CONFIG.pacing.xp.card.good > CONFIG.pacing.xp.card.ok && CONFIG.pacing.xp.card.ok > CONFIG.pacing.xp.card.bad);
});

test("the Arcade works between chapters: a shift pays coins and counts toward nothing", () => {
  const { life, play } = playChapters("bot-between", 1);
  assert.equal(play.active, null);
  assert.equal(P.shiftsLeft(play), 0);
  const r = P.workShift(play, life, 80);
  assert.ok(r.ok);
  assert.equal(r.life.checking, life.checking + 80);
});
