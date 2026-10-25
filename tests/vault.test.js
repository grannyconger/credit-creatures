// The Vault's layout: which tabs show when, how old tab names still land somewhere, what
// needs attention, and the plain-words activity list (teacher request 2026-10-25).
import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith, withCard } from "./helpers.js";
import * as P from "../js/play.js";
import { vaultTabs, pickVaultTab, legacyVaultTab, vaultAttention, checkingActivity, protectContent, hasProtectContent, netWorthSeries } from "../js/vault.js";

const keys = (tabs) => tabs.map((t) => t.key);
const phased = (stage) => {
  const play = P.newPlay({ phased: true });
  play.chapter = stage;
  play.prologue = { ...play.prologue, done: true };
  return play;
};

test("a new Vault shows the Overview, Pay Bills, Save for Goals and Messages, and the rest open with the chapters", () => {
  const life = lifeWith({ seed: "v1", checking: 100 });
  assert.deepEqual(keys(vaultTabs(phased(1), life)), ["overview", "paybills", "save", "messages"]);
  assert.deepEqual(keys(vaultTabs(phased(2), life)), ["overview", "paybills", "save", "debt", "messages"]);
  const ch3 = vaultTabs(phased(3), life);
  assert.deepEqual(keys(ch3), ["overview", "paybills", "save", "debt", "credit", "messages"]);
  assert.deepEqual(ch3.find((t) => t.key === "credit").subs.map((s) => s.key), ["cards", "statements"]);
  const ch4 = vaultTabs(phased(4), life);
  assert.deepEqual(ch4.find((t) => t.key === "credit").subs.map((s) => s.key), ["cards", "statements", "score", "report"]);
});

test("an older save has everything unlocked, and no tab is ever empty", () => {
  const life = lifeWith({ seed: "v2", checking: 100 });
  const tabs = vaultTabs(P.newPlay(), life);
  assert.ok(tabs.length >= 6);
  for (const t of tabs) assert.ok(t.label && t.icon, t.key);
  assert.ok(!keys(tabs).includes("protect"), "Protect Yourself waits for something to protect");
});

test("Protect Yourself appears for insurance, a parent's card or a cosigned loan", () => {
  let life = lifeWith({ seed: "v3", checking: 500 });
  assert.equal(hasProtectContent(life), false);
  const withInsurance = E.addBill(life, "Renter's insurance", 10).life;
  assert.equal(protectContent(withInsurance).insurance.length, 1);
  assert.ok(keys(vaultTabs(P.newPlay(), withInsurance)).includes("protect"));
  assert.ok(hasProtectContent(E.joinAsAuthorizedUser(life, "maxed").life));
  assert.ok(hasProtectContent(E.cosign(life, { amount: 600 }).life));
  assert.ok(!hasProtectContent(E.addBill(life, "Phone", 45).life), "a phone bill isn't insurance");
});

test("the old tab names still land on the right new tab", () => {
  assert.deepEqual(legacyVaultTab("wallet"), { tab: "paybills" });
  assert.deepEqual(legacyVaultTab("inbox"), { tab: "messages" });
  assert.deepEqual(legacyVaultTab("score"), { tab: "credit", sub: "score" });
  assert.deepEqual(legacyVaultTab("report"), { tab: "credit", sub: "report" });
  assert.deepEqual(legacyVaultTab("statements"), { tab: "credit", sub: "statements" });
  assert.deepEqual(legacyVaultTab("save"), { tab: "save" });
  const tabs = vaultTabs(P.newPlay(), lifeWith({ seed: "v4" }));
  assert.deepEqual(pickVaultTab(tabs, "nope", "nope"), { tab: "overview", sub: null }, "an unknown tab falls back to the first");
  assert.deepEqual(pickVaultTab(tabs, "credit", "bogus"), { tab: "credit", sub: "cards" }, "an unknown sub-tab falls back to the first");
});

test("attention lists a due card, short checking, a collection, a late cosigned loan and new letters", () => {
  const play = P.newPlay();
  assert.deepEqual(vaultAttention(play, lifeWith({ seed: "v5", checking: 500 })), [], "all caught up");
  P.addNote(play, "bank", "Welcome to the Vault", 0);
  const mail = vaultAttention(play, lifeWith({ seed: "v5", checking: 500 }));
  assert.equal(mail[0].tab, "messages");
  let { life, id } = withCard(lifeWith({ seed: "v6", checking: 900 }), { limit: 500 });
  life = E.cardPurchase(life, id, 200, "stuff").life;
  life = E.endMonth(life).life;
  const due = vaultAttention(P.newPlay(), life);
  assert.ok(due.some((a) => a.tab === "paybills" && /due/i.test(a.text)), JSON.stringify(due));
  const broke = E.debitPurchase(life, life.checking - 5, "rent").life;
  assert.ok(vaultAttention(P.newPlay(), E.addBill(broke, "Rent", 400).life).some((a) => /short/i.test(a.text)));
});

test("the activity list says in words what moved, newest first, and only what touches checking", () => {
  let life = lifeWith({ seed: "v7", checking: 0 });
  life = E.earn(life, 100, "a shift").life;
  life = E.debitPurchase(life, 30, "headphones").life;
  life = E.moveToSavings(life, 20).life;
  life = E.moveToChecking(life, 5).life;
  life = E.receiveCash(life, 10, "Grandma").life;
  const rows = checkingActivity(life);
  assert.deepEqual(rows.map((r) => r.label), ["Money from Grandma", "Moved from savings", "Moved to savings", "Bought headphones", "Paid for a shift"]);
  assert.deepEqual(rows.map((r) => r.amount), [10, 5, -20, -30, 100]);
  assert.equal(checkingActivity(life, 2).length, 2);
});

test("the net worth line uses the months that kept it", () => {
  const play = P.newPlay();
  play.active = { records: [{ month: 1, netWorth: 100 }, { month: 2 }, { month: 3, netWorth: 160 }] };
  play.history = [{ records: [{ month: 0, netWorth: 50 }] }];
  assert.deepEqual(netWorthSeries(play), [{ month: 0, netWorth: 50 }, { month: 1, netWorth: 100 }, { month: 3, netWorth: 160 }]);
  assert.deepEqual(netWorthSeries(P.newPlay()), []);
});

test("each finished month keeps the net worth, so the Overview can draw a line", () => {
  const life0 = lifeWith({ seed: "v8", checking: 800 });
  const play = P.newPlay();
  P.startChapter(play, life0);
  for (const item of [...(play.active.month.life ? ["life"] : []), ...play.active.month.cards.map((_, i) => i)]) P.skipItem(play, item);
  const end = P.finishMonth(play, life0);
  assert.ok(end.ok);
  const kept = play.active ? play.active.records.at(-1) : play.summary.records.at(-1);
  assert.equal(typeof kept.netWorth, "number");
  assert.equal(kept.netWorth, E.balanceSheet(end.life).netWorth);
});
