import { test } from "node:test";
import assert from "node:assert/strict";
import { E, lifeWith } from "./helpers.js";
import * as S from "../js/social.js";
import * as P from "../js/play.js";
import { GIFT_MESSAGES, GROUP_ADJECTIVES, GROUP_NOUNS } from "../js/data/social.js";
import { CONFIG } from "../js/data/config.js";

test("friend requests split into friends, incoming and outgoing", () => {
  const reqs = [
    { id: "me_a", from: "me", to: "a", toName: "A", status: "accepted" },
    { id: "b_me", from: "b", to: "me", fromName: "B", status: "pending" },
    { id: "me_c", from: "me", to: "c", toName: "C", status: "pending" },
    { id: "me_d", from: "me", to: "d", toName: "D", status: "declined" },
    { id: "e_me", from: "e", to: "me", fromName: "E", status: "accepted" },
  ];
  const st = S.friendState(reqs, "me");
  assert.deepEqual(st.friends.map((f) => f.uid).sort(), ["a", "e"]);
  assert.deepEqual(st.incoming.map((f) => f.uid), ["b"]);
  assert.deepEqual(st.outgoing.map((f) => f.status), ["pending", "declined"]);
  assert.ok(st.friendIds.has("e"));
});

test("gifts wait 40 hours between sends", () => {
  const h = 3600000;
  const now = 1_000_000_000_000;
  assert.equal(S.giftWaitMs(null, now), 0);
  assert.equal(S.giftWaitMs(now - 10 * h, now), (CONFIG.social.giftHours - 10) * h);
  assert.equal(S.giftWaitMs(now - 41 * h, now), 0);
  assert.equal(S.waitText(29.5 * h), "29 hours and 30 minutes");
  assert.equal(S.waitText(40 * h - 1000), "40 hours and 0 minutes");
  assert.equal(S.waitText(30 * 60000), "30 minutes");
});

test("money gifts move through logged engine actions on both sides", () => {
  const play = P.newPlay();
  let sender = lifeWith({ seed: "sender", checking: 100 });
  assert.match(S.checkGift({ life: sender, play, kind: "money", amount: 60 }), /\$5 to \$50/);
  assert.match(S.checkGift({ life: lifeWith({ seed: "poor", checking: 10 }), play, kind: "money", amount: 20 }), /checking/);
  assert.equal(S.checkGift({ life: sender, play, kind: "money", amount: 20 }), null);
  sender = S.applySentGift({ life: sender, play, creature: { accessories: {} }, gift: { kind: "money", amount: 20 }, toName: "Nova" });
  assert.equal(sender.checking, 80);
  assert.equal(sender.incomeThisMonth, 100);
  const rp = P.newPlay();
  const got = S.applyClaimedGift({ life: lifeWith({ seed: "receiver", checking: 0 }), play: rp, gift: { kind: "money", amount: 20, fromName: "Pip" } });
  assert.equal(got.life.checking, 20);
  assert.equal(got.life.incomeThisMonth, 0, "gifts are not income");
  for (const l of [sender, got.life]) assert.equal(JSON.stringify(E.replayLife(l.start, l.log)), JSON.stringify(l));
  assert.equal(play.social.giftsSent, 1);
  assert.equal(rp.social.giftsReceived, 1);
});

test("item gifts leave the sender's closet and come off the creature", () => {
  const play = P.newPlay();
  play.owned = ["topHat", "meadow"];
  const creature = { accessories: { head: "topHat" }, background: "meadow" };
  assert.match(S.checkGift({ life: lifeWith(), play, kind: "item", itemId: "castle" }), /own/);
  S.applySentGift({ life: lifeWith(), play, creature, gift: { kind: "item", itemId: "topHat" }, toName: "Nova" });
  assert.deepEqual(play.owned, ["meadow"]);
  assert.equal(creature.accessories.head, "none");
  const rp = P.newPlay();
  S.applyClaimedGift({ life: lifeWith(), play: rp, gift: { kind: "item", itemId: "topHat" } });
  assert.deepEqual(rp.owned, ["topHat"]);
  assert.match(S.applyClaimedGift({ life: lifeWith(), play: rp, gift: { kind: "item", itemId: "topHat" } }).note, /already/);
});

test("group names come from presets and skip taken ones", () => {
  const a = S.groupNameChoices("seed", 4);
  assert.equal(a.length, 4);
  for (const g of a) assert.match(g.name, new RegExp(`^The (${GROUP_ADJECTIVES.join("|")}) (${GROUP_NOUNS.join("|")})$`));
  const b = S.groupNameChoices("seed", 4, [a[0].name]);
  assert.ok(!b.some((g) => g.name === a[0].name));
});

test("social text follows the student text rules and fits the rules' limits", () => {
  for (const m of GIFT_MESSAGES) assert.ok(!m.includes("—") && !m.includes(";"), m);
  assert.ok(GIFT_MESSAGES.length < 20, "firestore.rules allows message indexes 0 to 19");
  assert.equal(CONFIG.social.giftHours, 40);
  assert.equal(CONFIG.social.groupMax, 6);
});

test("the creature looks a little older as it ages, and new face options draw", async () => {
  const { creatureSvg } = await import("../js/ui/creature-art.js");
  const c = { species: "lanternFox", palette: "ocean", accessories: { held: "balloon" } };
  const teen = creatureSvg(c, { ageMonths: 200 });
  const at18 = creatureSvg(c, { ageMonths: 216 });
  const at20 = creatureSvg(c, { ageMonths: 240 });
  const at22 = creatureSvg(c, { ageMonths: 264 });
  assert.notEqual(teen, at18, "teens have bigger eyes");
  assert.notEqual(at18, at20, "eyebrows at 20");
  assert.notEqual(at20, at22, "whisker tufts at 22");
  assert.match(at22, /#b9b9c2/);
  for (const eyes of ["happy", "sleepy", "sparkle"]) assert.notEqual(creatureSvg({ ...c, eyes }), creatureSvg(c), eyes);
  for (const markings of ["blush", "freckles", "star", "heart"]) assert.notEqual(creatureSvg({ ...c, markings }), creatureSvg(c), markings);
  assert.notEqual(creatureSvg(c), creatureSvg({ ...c, accessories: {} }), "held item draws");
});
