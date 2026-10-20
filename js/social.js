// Friends, groups and gifts (Phase 8). Pure functions, so they run in Node
// tests. The money side of a gift is a logged engine action, so replay works.
import { CONFIG } from "./data/config.js";
import { GROUP_ADJECTIVES, GROUP_NOUNS, GROUP_ICONS } from "./data/social.js";
import { SHOP_BY_ID } from "./data/shop.js";
import { debitPurchase, receiveCash, createRng } from "./engine/index.js";

// requests -> who is a friend, who asked me, who I asked.
export function friendState(requests, uid) {
  const friends = [];
  const incoming = [];
  const outgoing = [];
  for (const r of requests) {
    const other = r.from === uid ? r.to : r.from;
    const otherName = r.from === uid ? r.toName : r.fromName;
    const entry = { uid: other, name: otherName, requestId: r.id, status: r.status };
    if (r.status === "accepted") friends.push(entry);
    else if (r.status === "pending" && r.to === uid) incoming.push(entry);
    else if (r.from === uid) outgoing.push(entry);
  }
  return { friends, incoming, outgoing, friendIds: new Set(friends.map((f) => f.uid)) };
}

export function giftWaitMs(lastSentAt, now = Date.now()) {
  if (!lastSentAt) return 0;
  return Math.max(0, lastSentAt + CONFIG.social.giftHours * 60 * 60 * 1000 - now);
}

export function waitText(ms) {
  const total = Math.ceil(ms / 60000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h} hour${h === 1 ? "" : "s"} and ${m} minute${m === 1 ? "" : "s"}` : `${m} minute${m === 1 ? "" : "s"}`;
}

// A few preset group names to pick from (no free text to moderate).
export function groupNameChoices(seed, n = 4, taken = []) {
  const rng = createRng(seed);
  const out = [];
  for (let tries = 0; out.length < n && tries < 50; tries++) {
    const i = Math.floor(rng.next() * GROUP_ADJECTIVES.length);
    const j = Math.floor(rng.next() * GROUP_NOUNS.length);
    const name = `The ${GROUP_ADJECTIVES[i]} ${GROUP_NOUNS[j]}`;
    if (!taken.includes(name) && !out.some((o) => o.name === name)) out.push({ name, icon: GROUP_ICONS[j] });
  }
  return out;
}

// Before sending: is this gift allowed for this student right now?
export function checkGift({ life, play, kind, amount, itemId }) {
  const s = CONFIG.social;
  if (kind === "money") {
    if (!Number.isInteger(amount) || amount < s.giftMin || amount > s.giftMax) return `Gifts are $${s.giftMin} to $${s.giftMax}.`;
    if (amount > life.checking) return "You don't have that much in checking.";
    return null;
  }
  if (!play.owned.includes(itemId)) return "You can only give an item you own.";
  return null;
}

// Sender's side, after the gift is saved: money leaves checking, or the item
// leaves the closet (and comes off the creature if it was being worn).
export function applySentGift({ life, play, creature, gift, toName }) {
  play.social.giftsSent++;
  if (gift.kind === "money") return debitPurchase(life, gift.amount, `gift to ${toName}`).life;
  play.owned = play.owned.filter((id) => id !== gift.itemId);
  const item = SHOP_BY_ID[gift.itemId];
  if (item?.kind === "background" && creature.background === item.id) creature.background = null;
  else if (item && creature.accessories?.[item.kind] === item.id) creature.accessories[item.kind] = "none";
  return life;
}

// Receiver's side, when they claim it. Gifted money isn't income.
export function applyClaimedGift({ life, play, gift }) {
  play.social.giftsReceived++;
  if (gift.kind === "money") return { life: receiveCash(life, gift.amount, `gift from ${gift.fromName}`).life, note: `$${gift.amount} went into checking.` };
  if (play.owned.includes(gift.itemId)) return { life, note: "You already had this one, but it's the thought that counts." };
  play.owned.push(gift.itemId);
  return { life, note: `The ${SHOP_BY_ID[gift.itemId]?.name.toLowerCase() || "item"} is in your closet. Wear it from Edit my creature.` };
}
