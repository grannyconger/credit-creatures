import { test } from "node:test";
import assert from "node:assert/strict";
import { E } from "./helpers.js";
import * as G from "../js/ui/minigames/gen.js";
import { keyCents } from "../js/ui/minigames/keypad.js";
import { JOBS, DENOMINATIONS, CHECK_PARTS, amountInWords } from "../js/data/minigames.js";
import { CONFIG } from "../js/data/config.js";
import { jobPay } from "../js/progress.js";
import * as P from "../js/play.js";
import { unlockStage } from "../js/progression.js";

const seeds = Array.from({ length: 60 }, (_, i) => `s${i}`);

test("every overdraft feed has exactly one right place to stop", () => {
  for (const s of seeds) {
    const f = G.overdraftFeed(E.createRng(s), { length: 7 });
    const bals = G.runningBalances(f.start, f.items);
    const first = bals.findIndex((b) => b < 0);
    assert.equal(first, f.stop, s);
    assert.ok(f.items.every((it) => Number.isInteger(it.amount)), "whole cents");
    assert.equal(f.items.length, f.stop + 1);
  }
});

test("the register's math is right in cents, and its mistakes never change the balance", () => {
  for (const s of seeds) {
    const { start, lines } = G.registerLines(E.createRng(s), { count: 10 });
    let bal = start;
    let errors = 0;
    for (const l of lines) {
      if (l.error) {
        errors++;
        assert.equal(l.balance, bal, `${s}: a mistake keeps the balance`);
        if (l.error === "amount") assert.ok(-l.amount > l.receipt * 5, "the wrong charge is far from its receipt");
      } else bal += l.amount;
      assert.equal(l.balance, bal);
      assert.ok(l.balance >= 0, `${s}: never below $0`);
      assert.ok(Number.isInteger(l.amount));
    }
    assert.ok(errors >= 1 && errors <= 2, `${s}: ${errors} mistakes`);
  }
});

test("check hunts cover the parts, and the checks to judge have the planted problem", () => {
  for (const s of seeds.slice(0, 20)) {
    const rounds = G.checkHuntRounds(E.createRng(s));
    assert.equal(rounds.length, 10);
    const finds = rounds.filter((r) => r.type === "find");
    assert.equal(finds.length, 8);
    for (const r of finds) assert.ok(CHECK_PARTS[r.part]);
    const judges = rounds.filter((r) => r.type === "judge");
    assert.equal(new Set(judges.map((r) => r.flaw)).size, 2, "two different checks to judge");
    for (const r of judges) {
      const c = r.check;
      assert.equal(c.signed, r.flaw !== "unsigned");
      assert.equal(c.date === "", r.flaw === "nodate");
      assert.equal(c.words === amountInWords(c.amount), r.flaw !== "mismatch");
      assert.equal(c.routing.length, 9);
    }
  }
});

test("a drawer's over or short matches its count, float and sales", () => {
  const seen = new Set();
  for (const s of seeds) {
    const d = G.makeDrawer(E.createRng(s));
    assert.equal(d.total, DENOMINATIONS.reduce((sum, x) => sum + x * d.counts[x], 0));
    assert.equal(d.diff, d.total - d.float - d.sales);
    assert.ok(d.sales > 0);
    seen.add(G.overShort(d.diff));
  }
  assert.deepEqual([...seen].sort(), ["exact", "over", "short"]);
  assert.equal(G.overShort(-27), "short");
});

test("unit price rounds have one clear winner, with coupons and conversions counted", () => {
  for (const s of seeds.slice(0, 30)) {
    const rounds = G.unitRounds(E.createRng(s), { count: 10 });
    assert.equal(rounds.length, 10, s);
    for (const r of rounds) {
      const prices = r.options.map(G.unitPrice);
      const min = Math.min(...prices);
      assert.equal(prices[r.best], min);
      assert.ok(prices.filter((p) => p < min * 1.04).length === 1, "a clear winner");
    }
    assert.ok(rounds.slice(8).every((r) => r.options.length === 3 && r.options.some((o) => o.coupon)));
  }
  // A coupon comes off the price before dividing. 16 oz shown as 1 lb still compares per ounce.
  assert.equal(G.unitPrice({ price: 500, coupon: 100, baseQty: 10 }), 4000);
  assert.equal(G.unitText({ price: 529, baseQty: 16, baseUnit: "oz" }), "$0.33 per oz");
});

test("the money keypad fills from the right in whole cents", () => {
  const typed = (keys) => keys.reduce(keyCents, 0);
  assert.equal(typed(["1", "2", "3", "4"]), 1234);
  assert.equal(typed(["5", "0", "0", "⌫"]), 50);
  assert.equal(typed(["9", "C", "7"]), 7);
  assert.equal(typed(Array(12).fill("9")), 99999999, "no more than 8 digits");
});

test("the five new jobs open in Chapter 1 and pay inside the usual range", () => {
  const play = P.newPlay();
  for (const key of ["overdraft", "register", "checkhunt", "drawer", "unitprice"]) {
    assert.ok(JOBS[key]?.title, key);
    assert.equal(unlockStage(key), 1, `${key} opens in Chapter 1`);
    const c = CONFIG.play.jobs[key];
    const most = { overdraft: c.rounds, register: c.lines, checkhunt: 10, drawer: c.drawers * (DENOMINATIONS.length + 2), unitprice: c.rounds }[key];
    const top = jobPay(play, key, { right: most, wrong: 0 });
    assert.ok(top >= 100 && top <= CONFIG.play.jobs.pay.max, `${key} pays ${top} for a perfect shift`);
    assert.equal(jobPay(play, key, { right: 0, wrong: most }), CONFIG.play.jobs.pay.min);
  }
});

test("Fee Detective: every statement is fair, one has no fees, and a perfect shift pays inside the range", () => {
  const c = CONFIG.play.jobs.fees;
  for (const s of seeds) {
    const { statements, most } = G.feeStatements(E.createRng(s), { statements: c.statements, lines: c.lines, noFeePoints: c.noFeePoints });
    assert.equal(statements.length, c.statements);
    assert.equal(statements.filter((st) => st.noFee).length, 1, `${s}: exactly one fee-free statement`);
    for (const st of statements) {
      assert.equal(st.lines.length, c.lines);
      assert.ok(st.noFee ? st.fees.length === 0 : st.fees.length >= 3 && st.fees.length <= 4, s);
      assert.ok(st.lines.every((l) => Number.isInteger(l.amount)), "whole cents");
      for (const l of st.lines) {
        if (l.type === "fee") assert.ok(l.amount < 0 && st.fees.includes(l.id));
        else assert.ok(!st.fees.includes(l.id));
      }
      assert.equal(new Set(st.lines.filter((l) => l.type === "fee").map((l) => l.fee)).size, st.fees.length, "no repeated fee kinds");
      assert.ok(st.lines.some((l) => l.type === "interest") && st.lines.some((l) => l.type === "transfer"), "has tricky decoys");
      assert.deepEqual(st.lines.map((l) => l.day), [...st.lines.map((l) => l.day)].sort((a, b) => a - b), "dates run forward");
      assert.equal(st.total, st.lines.filter((l) => l.type === "fee").reduce((n, l) => n - l.amount, 0));
    }
    const top = jobPay(P.newPlay(), "fees", { right: most, wrong: 0 });
    assert.ok(top >= 100 && top <= CONFIG.play.jobs.pay.max, `${s}: perfect pays ${top}`);
  }
  assert.equal(jobPay(P.newPlay(), "fees", { right: 0, wrong: 20 }), CONFIG.play.jobs.pay.min);
  assert.equal(unlockStage("fees"), 1);
  assert.ok(JOBS.fees.title);
});

test("Fee Detective: same seed deals the same shift, and each avoid question has one right answer", () => {
  const a = G.feeStatements(E.createRng("same"));
  assert.deepEqual(a, G.feeStatements(E.createRng("same")));
  for (const fee of ["maintenance", "overdraft", "atm", "paper", "inactive"]) {
    const opts = G.avoidOptions(E.createRng(fee), fee);
    assert.equal(opts.length, 3);
    assert.equal(opts.filter((o) => o.right).length, 1);
  }
});

test("Cashier Rush customers match their difficulty, and coins are paid per right sale", () => {
  const items = ["a scarf", "a map"];
  for (const s of seeds) {
    const rng = E.createRng(s);
    for (let i = 0; i < 20; i++) {
      const e = G.cashierCustomer(rng, "easy", items);
      const m = G.cashierCustomer(rng, "medium", items);
      const h = G.cashierCustomer(rng, "hard", items);
      for (const c of [e, m, h]) assert.ok(Number.isInteger(c.price) && c.price > 0 && c.paid > c.price && [500, 1000, 2000].includes(c.paid), s);
      assert.ok((e.paid - e.price) % 100 === 0 && e.paid - e.price >= 100, "easy change is whole dollars");
      assert.ok((m.paid - m.price) % 5 === 0 && m.price % 100 !== 0, "medium cents are multiples of 5 and not whole dollars");
      assert.ok((h.paid - h.price) % 5 !== 0, "hard cents are not multiples of 5");
      assert.ok(e.paid - e.price < 2000 && m.paid - m.price < 2000 && h.paid - h.price < 2000, "change never needs a $20 bill");
    }
  }
  assert.equal(G.overShortText(410, 365), "$0.45 over");
  assert.equal(G.overShortText(300, 365), "$0.65 short");
  assert.equal(G.overShortText(365, 365), "exact");
});
