// Friends, friend groups and gifts (Phase 8). Classmates only, picked from
// the class leaderboard list. No free text: group names and gift messages are
// presets. Firestore rules enforce the class, friendship and the 40-hour gift limit.
import { h, add, fill, money, toast } from "../dom.js";
import { placeHeader } from "../place-header.js";
import { icon } from "../icons.js";
import { creatureSvg } from "../creature-art.js";
import { fullName } from "../../data/creatures.js";
import { SHOP_BY_ID } from "../../data/shop.js";
import { GIFT_MESSAGES } from "../../data/social.js";
import { CONFIG } from "../../data/config.js";
import * as S from "../../social.js";

let tab = "friends";

export function render(root, { game, go, track, refreshWho }) {
  const play = game.play;
  const me = game.user.uid;
  const classId = game.profile.classId;
  const panel = h("section.panel.friends");
  root.append(panel);
  const data = { directory: [], requests: [], groups: [], gifts: { incoming: [], outgoing: [] }, lastGift: null, loaded: false };

  const header = () => placeHeader({ go, iconName: "plaza", kicker: "Your class", title: "Friendship Plaza", subtitle: "Only classmates can see you here. Nobody sees your money, score or report." });

  if (game.classInfo?.social === false) {
    fill(panel, header(), h("p.callout", "Your teacher has friends and gifts turned off for your class right now."));
    return;
  }
  if (!classId) {
    fill(panel, header(), h("p.callout", "Join a class to make friends."));
    return;
  }

  async function load() {
    fill(panel, header(), h("p.muted", "Loading your classmates..."));
    try {
      await game.syncLeaderboard();
      const db = game.db;
      const [directory, requests, groups, gifts, lastGift] = await Promise.all([db.readLeaderboard(classId), db.listRequests(classId, me), db.listGroups(classId), db.listGifts(classId, me), db.lastGiftAt(me)]);
      Object.assign(data, { directory, requests, groups, gifts, lastGift, loaded: true });
    } catch (err) {
      console.error(err);
      return fill(panel, header(), h("p.error", "Couldn't load friends right now. Try again in a minute."));
    }
    // Keep the counts achievements use up to date.
    const st = S.friendState(data.requests, me);
    const inGroup = data.groups.some((g) => g.members.includes(me));
    if (play.social.friends !== st.friends.length || (inGroup && !play.social.groupJoined)) {
      play.social.friends = st.friends.length;
      if (inGroup) play.social.groupJoined = true;
      await game.persist("social");
    }
    paint();
  }

  // Wrap a database call: run it, log it, reload. Firestore errors become plain words.
  const act = async (fn, event, info, okText) => {
    try {
      await fn();
      track(event, info);
      if (okText) toast(okText, "good");
    } catch (err) {
      console.error(err);
      toast(err.code === "permission-denied" ? "That isn't allowed right now." : "That didn't work. Try again.", "bad");
    }
    await load();
  };

  const who = (uid) => data.directory.find((d) => d.uid === uid);
  // Me as classmates see me: creature name, then my Google name.
  const myPerson = (game.user.displayName || "").slice(0, 100);
  const myLabel = () => S.withPerson(fullName(game.save.creature), myPerson);
  // Any classmate's label. The class list's name is checked by the rules, so it wins.
  const labelOf = (uid, name = "", person = "") => {
    if (uid === me) return myLabel();
    const d = who(uid);
    return S.withPerson(d?.creatureName || name || "Classmate", d?.person || person);
  };
  const avatar = (d, size = 48) => h("span.fr-avatar", { html: d ? creatureSvg(d.look || { species: d.species, palette: d.palette, accessories: {} }, { size, label: "" }) : "" });
  const person = (uid, name, extra, personName = "") => {
    const d = who(uid);
    return h("div.fr-person", avatar(d), h("span.fr-name", h("strong", labelOf(uid, name, personName)), h("small", d ? `${d.rank} · ${d.xp} XP` : "")), h("span.fr-actions", extra));
  };

  function paint() {
    const st = S.friendState(data.requests, me);
    const unclaimed = data.gifts.incoming.filter((g) => !g.claimed).length;
    const tabs = [
      ["friends", "people", "Friends", st.incoming.length],
      ["groups", "plaza", "Groups", 0],
      ["gifts", "gift", "Gifts", unclaimed],
    ];
    fill(
      panel,
      header(),
      h(
        "nav.acct-tabs",
        { "aria-label": "Friends" },
        tabs.map(([k, ico, label, n]) =>
          h(
            "button",
            { type: "button", "aria-current": tab === k ? "page" : null, onclick: () => ((tab = k), track("friendsTab", { tab: k }), paint()) },
            icon(ico),
            ` ${label}`,
            n ? h("span.count-badge", { "aria-label": `${n} new` }, String(n)) : null
          )
        )
      ),
      tab === "friends" ? friendsTab(st) : tab === "groups" ? groupsTab(st) : giftsTab(st)
    );
  }

  // ---------- friends ----------

  function friendsTab(st) {
    const myName = fullName(game.save.creature);
    const known = new Set([...st.friends, ...st.incoming, ...st.outgoing].map((x) => x.uid));
    const classmates = data.directory.filter((d) => d.uid !== me && !known.has(d.uid));
    return h(
      "div",
      st.incoming.length
        ? h(
            "section",
            h("h3", "Friend requests for you"),
            st.incoming.map((r) =>
              person(
                r.uid,
                r.name,
                h(
                  "div.row.tight-row",
                  h("button.small", { type: "button", onclick: () => act(() => game.db.answerFriendRequest(classId, r.requestId, "accepted"), "friendAccept", {}, "You're friends now!") }, "Accept"),
                  h("button.small.secondary", { type: "button", onclick: () => act(() => game.db.answerFriendRequest(classId, r.requestId, "declined"), "friendDecline", {}) }, "No thanks")
                ),
                r.person
              )
            )
          )
        : null,
      h("h3", `Your friends (${st.friends.length})`),
      st.friends.length
        ? st.friends.map((f) =>
            person(
              f.uid,
              f.name,
              h("button.small.secondary", { type: "button", onclick: () => confirm(`Unfriend ${labelOf(f.uid, f.name, f.person)}?`) && act(() => game.db.removeFriendRequest(classId, f.requestId), "unfriend", {}) }, "Unfriend"),
              f.person
            )
          )
        : h("p.muted", "No friends yet. Add a classmate below."),
      st.outgoing.length
        ? h(
            "section",
            h("h3", "Requests you sent"),
            st.outgoing.map((o) =>
              person(
                o.uid,
                o.name,
                o.status === "declined"
                  ? h("span", h("small.muted", "Declined "), h("button.small.secondary", { type: "button", onclick: () => act(() => game.db.removeFriendRequest(classId, o.requestId), "friendCancel", {}) }, "Remove"))
                  : h("span", h("small.muted", "Waiting "), h("button.small.secondary", { type: "button", onclick: () => act(() => game.db.removeFriendRequest(classId, o.requestId), "friendCancel", {}) }, "Cancel")),
                o.person
              )
            )
          )
        : null,
      h("h3", "Classmates"),
      classmates.length
        ? classmates.map((d) =>
            person(
              d.uid,
              d.creatureName,
              h("button.small", { type: "button", onclick: () => act(() => game.db.sendFriendRequest(classId, me, d.uid, myName.slice(0, 41), d.creatureName.slice(0, 41), { fromPerson: myPerson, toPerson: (d.person || "").slice(0, 100) }), "friendRequest", {}, "Request sent!") }, "Add friend")
            )
          )
        : h("p.muted", "Classmates show up here once they've played a bit.")
    );
  }

  // ---------- groups ----------

  function groupsTab() {
    const mine = data.groups.find((g) => g.members.includes(me));
    const max = CONFIG.social.groupMax;
    const others = data.groups.filter((g) => g !== mine);
    const groupXp = (g) => g.members.reduce((s, uid) => s + (who(uid)?.xp || 0), 0);
    const box = h("div");
    if (mine) {
      add(
        box,
        h(
          "section.fr-group.mine",
          h("h2", `${mine.icon} ${mine.name}`),
          h("p", `${mine.members.length} of ${max} members · Group XP: ${groupXp(mine)}`),
          mine.members.map((uid) => person(uid, "Classmate", uid === me ? h("small.muted", "You") : null)),
          h(
            "div.row",
            h("button.secondary", { type: "button", onclick: () => confirm(`Leave ${mine.name}?`) && act(() => game.db.leaveGroup(classId, mine.id, me, mine.members.length === 1), "groupLeave", {}) }, "Leave the group")
          )
        )
      );
    } else {
      const choices = S.groupNameChoices(`${me}:${data.groups.length}`, 4, data.groups.map((g) => g.name));
      add(
        box,
        h(
          "section.fr-group",
          h("h3", "Start a group"),
          h("p.muted.tight", `Pick a name. Up to ${max} classmates can join.`),
          h(
            "div.chip-group",
            choices.map((c) =>
              h("button.chip", { type: "button", onclick: () => act(() => game.db.createGroup(classId, me, c.name, c.icon), "groupCreate", { name: c.name }, `You started ${c.name}!`) }, `${c.icon} ${c.name}`)
            )
          )
        )
      );
    }
    add(
      box,
      h("h3", mine ? "Other groups" : "Join a group"),
      others.length
        ? others.map((g) =>
            h(
              "section.fr-group",
              h("div.bill-head", h("strong", `${g.icon} ${g.name}`), h("small.muted", `${g.members.length} of ${max} · ${groupXp(g)} XP`)),
              h("div.fr-avatars", g.members.map((uid) => avatar(who(uid), 36))),
              h("p.tight.fr-members", g.members.map((uid) => labelOf(uid)).join(", ")),
              mine
                ? null
                : h(
                    "div.row",
                    h("button.small", { type: "button", disabled: g.members.length >= max, onclick: () => act(() => game.db.joinGroup(classId, g.id, me), "groupJoin", {}, `You joined ${g.name}!`) }, g.members.length >= max ? "Full" : "Join")
                  )
            )
          )
        : h("p.muted", "No other groups yet.")
    );
    return box;
  }

  // ---------- gifts ----------

  function giftsTab(st) {
    const wait = S.giftWaitMs(data.lastGift);
    const nameOf = (uid) => {
      const f = st.friends.find((x) => x.uid === uid);
      return who(uid) || f ? labelOf(uid, f?.name, f?.person) : "a friend";
    };
    const fromOf = (g) => labelOf(g.from, g.fromName, g.fromPerson);
    const unclaimed = data.gifts.incoming.filter((g) => !g.claimed);
    const box = h(
      "div",
      h("h3", "Gifts for you"),
      unclaimed.length
        ? unclaimed.map((g) =>
            h(
              "div.fr-gift",
              h("span.fr-gift-icon", { "aria-hidden": "true" }, "🎁"),
              h("div", h("strong", `From ${fromOf(g)}`), h("p.tight", GIFT_MESSAGES[g.message] || ""), h("small", g.kind === "money" ? money(g.amount) : `${SHOP_BY_ID[g.itemId]?.icon || ""} ${SHOP_BY_ID[g.itemId]?.name || "An item"}`)),
              h(
                "button",
                {
                  type: "button",
                  onclick: async (e) => {
                    e.currentTarget.disabled = true;
                    try {
                      await game.db.claimGift(classId, g.id);
                    } catch (err) {
                      console.error(err);
                      toast("Couldn't open the gift. Try again.", "bad");
                      return load();
                    }
                    const r = S.applyClaimedGift({ life: game.life, play, gift: g });
                    game.life = r.life;
                    track("giftClaim", { kind: g.kind, amount: g.amount || 0 });
                    toast(r.note, "good");
                    refreshWho();
                    await game.persist("giftClaim");
                    await load();
                  },
                },
                "Open"
              )
            )
          )
        : h("p.muted", "No new gifts.")
    );

    add(box, h("h3", "Send a gift"));
    if (!st.friends.length) {
      add(box, h("p.muted", "Make a friend first. Gifts go only to friends."));
    } else if (wait > 0) {
      add(box, h("p.callout", `⏳ You can send your next gift in ${S.waitText(wait)}. Everyone gets one gift every ${CONFIG.social.giftHours} hours.`));
    } else {
      add(box, giftForm(st, nameOf));
    }

    const sent = data.gifts.outgoing.slice().sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0));
    const got = data.gifts.incoming.filter((g) => g.claimed);
    if (sent.length || got.length) {
      add(
        box,
        h("h3", "Gift history"),
        h(
          "ul.plain",
          sent.map((g) => h("li", `📤 To ${nameOf(g.to)}: ${g.kind === "money" ? money(g.amount) : SHOP_BY_ID[g.itemId]?.name || "an item"}${g.claimed ? " (opened)" : ""}`)),
          got.map((g) => h("li", `📥 From ${fromOf(g)}: ${g.kind === "money" ? money(g.amount) : SHOP_BY_ID[g.itemId]?.name || "an item"}`))
        )
      );
    }
    return box;
  }

  function giftForm(st, nameOf) {
    const s = CONFIG.social;
    const friend = h("select", { id: "gift-to" }, st.friends.map((f) => h("option", { value: f.uid }, nameOf(f.uid))));
    let kind = "money";
    const amount = h("input", { type: "number", id: "gift-amount", min: s.giftMin, max: s.giftMax, step: 1, value: 10 });
    const owned = play.owned.map((id) => SHOP_BY_ID[id]).filter(Boolean);
    const item = h("select", { id: "gift-item" }, owned.map((i) => h("option", { value: i.id }, `${i.icon} ${i.name}`)));
    const msg = h("select", { id: "gift-msg" }, GIFT_MESSAGES.map((m, i) => h("option", { value: i }, m)));
    const err = h("p.error", { role: "alert" });
    const kindRow = h("div.chip-group", { role: "group", "aria-label": "Gift type" });
    const what = h("div");
    const paintKind = () => {
      fill(
        kindRow,
        h("button.chip", { type: "button", "aria-pressed": String(kind === "money"), onclick: () => ((kind = "money"), paintKind()) }, "💵 Money"),
        h("button.chip", { type: "button", "aria-pressed": String(kind === "item"), disabled: !owned.length, onclick: () => ((kind = "item"), paintKind()) }, owned.length ? "🛍️ A shop item" : "🛍️ A shop item (you don't own any)")
      );
      fill(what, kind === "money" ? h("div", h("label", { for: "gift-amount" }, `Amount ($${s.giftMin} to $${s.giftMax}, from checking: ${money(game.life.checking)})`), amount) : h("div", h("label", { for: "gift-item" }, "Item (it leaves your closet)"), item));
    };
    paintKind();
    const send = h("button.big", { type: "button" }, "Send gift");
    send.addEventListener("click", async () => {
      err.textContent = "";
      const to = friend.value;
      const gift = { from: me, to, fromName: fullName(game.save.creature).slice(0, 41), fromPerson: myPerson, kind, message: Number(msg.value) };
      if (kind === "money") gift.amount = Math.round(Number(amount.value));
      else gift.itemId = item.value;
      const problem = S.checkGift({ life: game.life, play, kind, amount: gift.amount, itemId: gift.itemId });
      if (problem) {
        err.textContent = problem;
        return;
      }
      if (!confirm(`Send ${kind === "money" ? money(gift.amount) : SHOP_BY_ID[gift.itemId].name} to ${nameOf(to)}? You can send another gift in ${CONFIG.social.giftHours} hours.`)) return;
      send.disabled = true;
      try {
        await game.db.sendGift(classId, gift);
      } catch (e) {
        console.error(e);
        err.textContent = e.code === "permission-denied" ? "That gift isn't allowed right now. You may need to wait, or you're not friends yet." : "The gift didn't send. Try again.";
        send.disabled = false;
        return;
      }
      game.life = S.applySentGift({ life: game.life, play, creature: game.save.creature, gift, toName: nameOf(to) });
      track("giftSend", { kind, amount: gift.amount || 0, item: gift.itemId || "" });
      toast("Gift sent! 🎁", "good");
      refreshWho();
      await game.persist("giftSend");
      await load();
    });
    return h(
      "section.fr-send",
      h("label", { for: "gift-to" }, "To"),
      friend,
      h("p.tight", h("strong", "What")),
      kindRow,
      what,
      h("label", { for: "gift-msg" }, "Message"),
      msg,
      err,
      h("div.row", send)
    );
  }

  load();
}

