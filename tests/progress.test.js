import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith, withCard } from "./helpers.js";
import * as M from "../js/data/minigames.js";
import { ACHIEVEMENTS, RANKS, CATEGORIES } from "../js/data/achievements.js";
import { SHOP_ITEMS, stockFor } from "../js/data/shop.js";
import * as G from "../js/progress.js";
import * as P from "../js/play.js";
import { creatureSvg } from "../js/ui/creature-art.js";
import { CONFIG } from "../js/data/config.js";

function strings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}
const clean = (s, where) => {
  assert.ok(!s.includes("—"), `em-dash in ${where}: ${s}`);
  assert.ok(!s.includes(";"), `semicolon in ${where}: ${s}`);
};

test("amounts are written in words the way checks need", () => {
  assert.equal(M.amountInWords(4725), "Forty-seven and 25/100");
  assert.equal(M.amountInWords(100000), "One thousand and 00/100");
  assert.equal(M.amountInWords(21309), "Two hundred thirteen and 09/100");
  assert.equal(M.amountInWords(5), "Zero and 05/100");
  assert.equal(M.amountInWords(1250075), "Twelve thousand five hundred and 75/100");
  assert.equal(M.amountInWords(1900), "Nineteen and 00/100");
});

test("check words accept small differences but not wrong amounts", () => {
  assert.ok(M.wordsMatch("forty-seven and 25/100", 4725));
  assert.ok(M.wordsMatch("Forty seven and 25/100 dollars", 4725));
  assert.ok(M.wordsMatch("FORTY-SEVEN 25/100", 4725));
  assert.ok(!M.wordsMatch("forty-seven", 4725));
  assert.ok(!M.wordsMatch("forty-six and 25/100", 4725));
  assert.ok(M.amountMatch("$47.25", 4725) && M.amountMatch("47.25", 4725) && !M.amountMatch("47.52", 4725));
  const g = M.gradeCheck({ date: "April 12", payee: "gaspen dental", amount: "47.25", words: "Forty-seven and 25/100", memo: "acct 7718", signed: true }, { dateText: "April 12", payee: "Gaspen Dental", cents: 4725, memo: "Acct 7718" });
  assert.deepEqual(Object.values(g), [true, true, true, true, true, true]);
});

test("minigame and shop text follows the student text rules", () => {
  for (const s of strings([M.JOBS, M.LEDGER_BINS, M.LEDGER_ITEMS, M.CASHIER_ITEMS, M.CHECK_BILLS, SHOP_ITEMS, ACHIEVEMENTS.map(({ check, ...a }) => a), RANKS, CATEGORIES])) clean(s, "phase 6 text");
  for (const bin of Object.keys(M.LEDGER_BINS)) assert.ok(M.LEDGER_ITEMS.filter((i) => i.answer === bin).length >= 6, bin);
});

test("there are 40+ achievements with unique ids in every SPEC category", () => {
  assert.ok(ACHIEVEMENTS.length >= 40, `${ACHIEVEMENTS.length}`);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
  for (const c of Object.keys(CATEGORIES)) assert.ok(ACHIEVEMENTS.some((a) => a.cat === c), c);
  assert.ok(ACHIEVEMENTS.some((a) => a.hidden));
});

test("ranks climb with XP", () => {
  assert.equal(G.rankFor(0).title, "Apprentice");
  assert.equal(G.rankFor(299).title, "Squire");
  assert.equal(G.rankFor(300).title, "Knight");
  assert.equal(G.rankFor(99999).title, "Grand Vizier");
  assert.equal(G.rankFor(99999).next, null);
});

test("achievements are earned once, give XP, and land in the inbox", () => {
  const play = P.newPlay();
  let { life, id } = withCard(lifeWith({ seed: "ach", checking: 900 }), { limit: 500 });
  for (let i = 0; i < 7; i++) {
    life = E.cardPurchase(life, id, 20, "x").life;
    life = E.endMonth(life).life;
    const a = E.findAccount(life, id);
    life = E.pay(life, id, a.due.statementBalance).life;
  }
  const save = { life, play, creature: { name: "Pip", lastName: "Moss", accessories: { head: "crown", neck: "none", face: "none" } } };
  const first = G.evaluate(save);
  const ids = first.map((a) => a.id);
  for (const want of ["firstOnTime", "halfYear", "firstCard", "thinToThick", "named", "fullName", "under30"].filter((x) => x !== "under30")) assert.ok(ids.includes(want), `${want} in ${ids}`);
  assert.equal(play.xp, first.reduce((s, a) => s + a.xp, 0));
  assert.equal(G.evaluate(save).length, 0, "nothing is earned twice");
  assert.ok(play.inbox.some((n) => n.type === "achievement"));
  assert.equal(play.records.longestOnTime >= 6, true);
});

test("every achievement check runs without throwing on a fresh and a played save", () => {
  const fresh = { life: lifeWith({ seed: "fresh-ach" }), play: P.newPlay(), creature: { name: "A", accessories: {} } };
  for (const a of ACHIEVEMENTS) a.check(G.facts(fresh));
});

test("on-time streaks reset after a late month", () => {
  let { life, id } = withCard(lifeWith({ seed: "streak", checking: 900 }), { limit: 500 });
  life = E.cardPurchase(life, id, 100, "x").life;
  for (let i = 0; i < 3; i++) life = E.endMonth(life).life; // no payments: lates
  for (let i = 0; i < 4; i++) {
    const a = E.findAccount(life, id);
    if (E.amountOwed(a) > 0) life = E.pay(life, id, E.amountOwed(a)).life;
    life = E.endMonth(life).life;
  }
  const s = G.onTimeStreaks(life);
  assert.ok(s.current >= 3 && s.current <= 4, JSON.stringify(s));
});

test("job pay is coins for each right answer, between the floor and the cap, and grows with experience", () => {
  const play = P.newPlay();
  const j = CONFIG.play.jobs;
  assert.equal(G.jobPay(play, "ledger", { right: 0, wrong: 9 }), j.pay.min, "finishing always pays the floor");
  assert.equal(G.jobPay(play, "ledger", { right: 30, wrong: 0 }), j.pay.max);
  assert.equal(G.jobPay(play, "checks", { right: 3 }), 3 * j.checks.perField, "no base pay on top");
  assert.equal(G.jobPay(play, "checks", { right: 6 }), j.pay.max, "a perfect Check Writer shift pays the cap");
  for (let i = 0; i < 6; i++) G.recordShift(play, "cashier", { right: 3, pay: 80 });
  assert.equal(G.experienceBonus(play, "cashier"), 2 * j.experience.bonus);
  assert.equal(G.jobPay(play, "cashier", { right: 99 }), j.pay.max + 2 * j.experience.bonus);
  assert.equal(play.stats.shifts, 6);
  assert.equal(play.jobs.cashier.best, 3);
});

test("shop stock is 7 items, the same for the same chapter, with one limited and one big item", () => {
  const a = stockFor("seed", 3);
  assert.deepEqual(stockFor("seed", 3), a);
  assert.equal(a.length, 7);
  assert.equal(new Set(a).size, 7);
  const items = a.map((id) => SHOP_ITEMS.find((i) => i.id === id));
  assert.equal(items.filter((i) => i.limited).length, 1);
  assert.equal(items.filter((i) => i.big).length, 1);
  assert.notDeepEqual(stockFor("seed", 4), a);
});

test("every shop accessory draws something", () => {
  const base = creatureSvg({ species: "mossDragon", palette: "moss", accessories: {} });
  for (const i of SHOP_ITEMS.filter((x) => x.kind !== "background")) {
    const svg = creatureSvg({ species: "mossDragon", palette: "moss", accessories: { [i.kind]: i.id } });
    assert.notEqual(svg, base, i.id);
  }
});

test("Practice Desk visits track perfect runs and streaks", () => {
  const play = P.newPlay();
  G.finishDeskVisit(play, 5, 5);
  G.finishDeskVisit(play, 4, 5);
  G.finishDeskVisit(play, 4, 5);
  G.finishDeskVisit(play, 2, 5);
  assert.equal(play.desk.finished, 4);
  assert.equal(play.desk.perfect, 1);
  assert.equal(play.desk.bestStreak, 3);
  assert.equal(play.desk.streak, 0);
});

test("side quests pay Energy and Sparkle and no XP, and Energy stops at its cap", () => {
  const play = P.newPlay();
  const r = CONFIG.pacing.rewards;
  // Finishing, doing well and a perfect shift each add Energy.
  assert.deepEqual(G.shiftRewards(play, { right: 1, wrong: 2 }), { energy: r.energy.finish, sparkle: 0, perfect: false, strong: false });
  const strong = G.shiftRewards(play, { right: 8, wrong: 2 });
  assert.equal(strong.energy, r.energy.finish + r.energy.strong);
  assert.equal(strong.sparkle, 0, "only a perfect shift earns Sparkle");
  const perfect = G.shiftRewards(play, { right: 6, wrong: 0 });
  assert.equal(perfect.sparkle, r.perfectSparkle);
  assert.equal(play.sparkle.total, r.perfectSparkle);
  // Too few scored answers can't earn a bonus.
  const tiny = G.shiftRewards(P.newPlay(), { right: r.minAnswers - 1, wrong: 0 });
  assert.deepEqual([tiny.energy, tiny.sparkle], [r.energy.finish, 0]);
  // Energy is held at the cap.
  for (let i = 0; i < 10; i++) G.shiftRewards(play, { right: 6, wrong: 0 });
  assert.equal(play.energy, r.energy.max);
  assert.equal(G.shiftRewards(play, { right: 6, wrong: 0 }).energy, 0, "nothing more at the cap");
  // Sparkle stays inside the chapter cap.
  assert.ok(play.sparkle.total <= CONFIG.pacing.sparkle.perChapter);
  // A shift never gives XP.
  const xpPlay = P.newPlay();
  G.recordShift(xpPlay, "ledger", { right: 5, pay: 50 });
  assert.equal(xpPlay.xp, 0);
});

test("a perfect shift pays the cap in every game, and the average student keeps about the old income", () => {
  const j = CONFIG.play.jobs;
  const most = { ledger: j.ledger.untimedItems, checks: 6, overdraft: j.overdraft.rounds, register: j.register.lines, checkhunt: 10, drawer: j.drawer.drawers * 10, unitprice: j.unitprice.rounds, fees: 16 };
  for (const [job, n] of Object.entries(most)) {
    const play = P.newPlay();
    const top = G.jobPay(play, job, { right: n, wrong: 0 });
    assert.ok(top >= 110 && top <= j.pay.max, `${job} perfect pays ${top}`);
    const mid = G.jobPay(play, job, { right: Math.round(n * 0.75), wrong: n - Math.round(n * 0.75) });
    assert.ok(mid >= 65 && mid <= 100, `${job} at 75% pays ${mid}`);
  }
});
