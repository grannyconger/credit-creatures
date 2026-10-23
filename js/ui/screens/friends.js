// Friends, friend groups and gifts (Phase 8). Classmates only, picked from
// the class leaderboard list. No free text: group names and gift messages are
// presets. Firestore rules enforce the class, friendship and the gift limit.
// A page of the Mossy Bestiary (2026-10-23): classmates are calling cards,
// requests are envelopes, a group is a gathering posed for its portrait, and
// gifts are parcels tied with string. The tabs are bookmark ribbons.
import { h, add, fill, money, toast } from "../dom.js";
import { coinsFly } from "../fx.js";
import { sfx } from "../sound.js";
import { firstVisitLesson } from "../guide.js";
import { placeHeader } from "../place-header.js";
import { icon } from "../icons.js";
import { creatureSvg } from "../creature-art.js";
import { sealSvg, mossSvg, stringSvg } from "../bestiary-art.js";
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
  root.append(h("div.bestiary.bst-plaza", panel));
  const data = { directory: [], requests: [], groups: [], gifts: { incoming: [], outgoing: [] }, giftLimit: null, loaded: false };

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
      const [directory, requests, groups, gifts, giftLimit] = await Promise.all([db.readLeaderboard(classId), db.listRequests(classId, me), db.listGroups(classId), db.listGifts(classId, me), db.giftLimit(me)]);
      Object.assign(data, { directory, requests, groups, gifts, giftLimit, loaded: true });
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
  const avatar = (d, size = 48) => h("span.fr-avatar", { "aria-hidden": "true", html: d ? creatureSvg(d.look || { species: d.species, palette: d.palette, accessories: {} }, { size, label: "" }) : "" });
  // A calling card: an oval portrait, the name, rank and XP, and what you can do.
  const person = (uid, name, extra, personName = "", kind = "") => {
    const d = who(uid);
    return h(
      "li.fr-card",
      { class: kind || null },
      h("span.fr-oval", avatar(d, 64)),
      h("span.fr-name", h("strong", labelOf(uid, name, personName)), h("small", d ? `${d.rank}. ${d.xp} XP` : "")),
      extra ? h("span.fr-actions", extra) : null
    );
  };
  const cards = (items) => h("ul.fr-cards", items);
  const note = (text) => h("p.bst-margin.fr-note", text);

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
        "nav.fr-ribbons",
        { "aria-label": "Friends" },
        tabs.map(([k, ico, label, n]) =>
          h(
            "button.fr-ribbon",
            { type: "button", "data-tab": k, "aria-current": tab === k ? "page" : null, onclick: () => ((tab = k), track("friendsTab", { tab: k }), paint()) },
            icon(ico, { size: 20 }),
            h("span.fr-ribbon-label", label),
            tab === k ? h("small.fr-open", "open") : null,
            n ? h("span.fr-new", `${n} new`) : null
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
            "section.fr-letters",
            h("h3", "Friend requests for you"),
            cards(st.incoming.map((r) =>
              person(
                r.uid,
                r.name,
                h(
                  "div.row.tight-row",
                  h("button.small", { type: "button", onclick: () => act(() => game.db.answerFriendRequest(classId, r.requestId, "accepted"), "friendAccept", {}, "You're friends now!") }, "Accept"),
                  h("button.small.secondary", { type: "button", onclick: () => act(() => game.db.answerFriendRequest(classId, r.requestId, "declined"), "friendDecline", {}) }, "No thanks")
                ),
                r.person,
                "letter"
              )
            ))
          )
        : null,
      h("h3", `Your friends (${st.friends.length})`),
      st.friends.length
        ? cards(st.friends.map((f) =>
            person(
              f.uid,
              f.name,
              h("button.small.secondary", { type: "button", onclick: () => confirm(`Unfriend ${labelOf(f.uid, f.name, f.person)}?`) && act(() => game.db.removeFriendRequest(classId, f.requestId), "unfriend", {}) }, "Unfriend"),
              f.person,
              "friend"
            )
          ))
        : note("No friends yet. A creature with no friends just has more shelf space. Add a classmate below."),
      st.outgoing.length
        ? h(
            "section",
            h("h3", "Requests you sent"),
            cards(st.outgoing.map((o) =>
              person(
                o.uid,
                o.name,
                o.status === "declined"
                  ? h("span", h("small.muted", "Declined "), h("button.small.secondary", { type: "button", onclick: () => act(() => game.db.removeFriendRequest(classId, o.requestId), "friendCancel", {}) }, "Remove"))
                  : h("span", h("small.muted", "Waiting "), h("button.small.secondary", { type: "button", onclick: () => act(() => game.db.removeFriendRequest(classId, o.requestId), "friendCancel", {}) }, "Cancel")),
                o.person,
                "sent"
              )
            ))
          )
        : null,
      h("h3", "Classmates"),
      classmates.length
        ? cards(classmates.map((d) =>
            person(
              d.uid,
              d.creatureName,
              h("button.small", { type: "button", onclick: () => act(() => game.db.sendFriendRequest(classId, me, d.uid, myName.slice(0, 41), d.creatureName.slice(0, 41), { fromPerson: myPerson, toPerson: (d.person || "").slice(0, 100) }), "friendRequest", {}, "Request sent!") }, "Add friend")
            )
          ))
        : note("Classmates show up here once they've played a bit.")
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
        // Your group, posed for its portrait on a strip of moss.
        h(
          "section.fr-gathering",
          h("h2", mine.name),
          h("p.fr-gathering-sub", `${mine.members.length} of ${max} members. Group XP: ${groupXp(mine)}`),
          h(
            "ul.fr-portrait",
            mine.members.map((uid) => h("li", avatar(who(uid), 96), h("span", labelOf(uid)), uid === me ? h("small", "You") : null))
          ),
          h("span.fr-portrait-moss", { "aria-hidden": "true", html: mossSvg({ seed: 44, width: 600, height: 44 }) }),
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
          "section.fr-start",
          h("h3", "Start a group"),
          note(`Naturalists call a group of creatures a gathering. Pick a name and up to ${max} classmates can gather.`),
          h(
            "div.fr-names",
            choices.map((c) =>
              h("button.fr-name-choice", { type: "button", onclick: () => act(() => game.db.createGroup(classId, me, c.name, c.icon), "groupCreate", { name: c.name }, `You started ${c.name}!`) }, `Start ${c.name}`)
            )
          )
        )
      );
    }
    add(
      box,
      h("h3", mine ? "Other groups" : "Join a group"),
      others.length
        ? h("div.fr-groups", others.map((g) =>
            h(
              "section.fr-group",
              h("div.fr-group-head", h("strong", g.name), h("small", `${g.members.length} of ${max} members. ${groupXp(g)} XP`)),
              h("div.fr-avatars", g.members.map((uid) => avatar(who(uid), 36))),
              h("p.tight.fr-members", g.members.map((uid) => labelOf(uid)).join(", ")),
              mine
                ? null
                : h(
                    "div.row",
                    h("button.small", { type: "button", disabled: g.members.length >= max, onclick: () => act(() => game.db.joinGroup(classId, g.id, me), "groupJoin", {}, `You joined ${g.name}!`) }, g.members.length >= max ? "Full" : `Join ${g.name}`)
                  )
            )
          ))
        : note("No other groups yet.")
    );
    return box;
  }

  // ---------- gifts ----------

  function giftsTab(st) {
    const win = S.giftWindow(data.giftLimit);
    const nameOf = (uid) => {
      const f = st.friends.find((x) => x.uid === uid);
      return who(uid) || f ? labelOf(uid, f?.name, f?.person) : "a friend";
    };
    const fromOf = (g) => labelOf(g.from, g.fromName, g.fromPerson);
    const unclaimed = data.gifts.incoming.filter((g) => !g.claimed);
    // Two columns: what came in the post (and the ledger) beside the tag for sending.
    const incoming = h(
      "div.fr-post-in",
      h("h3", "Gifts for you"),
      unclaimed.length
        ? h("ul.fr-parcels", unclaimed.map((g, i) =>
            // A parcel in brown paper, tied with string, with a tag saying who it's from.
            h(
              "li.fr-parcel",
              { style: `--i: ${i}` },
              h("span.fr-parcel-box", { "aria-hidden": "true" }, icon("gift", { size: 34 })),
              h("div", h("strong", `From ${fromOf(g)}`), h("p.tight", GIFT_MESSAGES[g.message] || ""), h("small", g.kind === "money" ? `Inside: ${money(g.amount)}` : `Inside: ${SHOP_BY_ID[g.itemId]?.name || "an item"}`)),
              h(
                "button",
                {
                  type: "button",
                  "data-sound": "none",
                  onclick: async (e) => {
                    const openBtn = e.currentTarget;
                    openBtn.disabled = true;
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
                    sfx.chestOpen();
                    // The coins chime after the gift opens, not on top of it.
                    if (g.kind === "money") coinsFly(openBtn, { chime: 450 });
                    toast(r.note, "good");
                    refreshWho();
                    await game.persist("giftClaim");
                    await load();
                  },
                },
                "Open it"
              )
            )
          ))
        : note("No new gifts. The post comes when it comes.")
    );
    const outgoing = h("div.fr-post-out", h("h3", "Send a gift"));
    const box = h("div.fr-post", incoming, outgoing);
    if (!st.friends.length) {
      add(outgoing, note("Make a friend first. Gifts go only to friends."));
    } else if (!win.left) {
      add(outgoing, h("p.callout", icon("calendar", { size: 16 }), ` You sent all ${CONFIG.social.giftsPerWindow} gifts. You can send more in ${S.waitText(win.waitMs)}.`));
    } else {
      add(outgoing, giftForm(st, nameOf, win));
    }

    const sent = data.gifts.outgoing.slice().sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0));
    const got = data.gifts.incoming.filter((g) => g.claimed);
    if (sent.length || got.length) {
      add(
        incoming,
        h("h3", "Gift history"),
        // The post ledger: one ruled line per gift, sent or received, said in words.
        h(
          "dl.fr-ledger",
          sent.flatMap((g) => [h("dt", `Sent to ${nameOf(g.to)}${g.claimed ? ", opened" : ""}`), h("dd", g.kind === "money" ? money(g.amount) : SHOP_BY_ID[g.itemId]?.name || "an item")]),
          got.flatMap((g) => [h("dt", `From ${fromOf(g)}`), h("dd", g.kind === "money" ? money(g.amount) : SHOP_BY_ID[g.itemId]?.name || "an item")])
        )
      );
    }
    return box;
  }

  function giftForm(st, nameOf, win) {
    const s = CONFIG.social;
    const friend = h("select", { id: "gift-to" }, st.friends.map((f) => h("option", { value: f.uid }, nameOf(f.uid))));
    let kind = "money";
    const amount = h("input", { type: "number", id: "gift-amount", min: s.giftMin, max: s.giftMax, step: 1, value: 10 });
    const owned = play.owned.map((id) => SHOP_BY_ID[id]).filter(Boolean);
    const item = h("select", { id: "gift-item" }, owned.map((i) => h("option", { value: i.id }, i.name)));
    const msg = h("select", { id: "gift-msg" }, GIFT_MESSAGES.map((m, i) => h("option", { value: i }, m)));
    const err = h("p.error", { role: "alert" });
    const kindRow = h("div.fr-kinds", { role: "group", "aria-label": "Gift type" });
    const what = h("div");
    const paintKind = () => {
      fill(
        kindRow,
        h("button.fr-kind", { type: "button", "aria-pressed": String(kind === "money"), onclick: () => ((kind = "money"), paintKind()) }, icon("coins", { size: 18 }), "Money", kind === "money" ? h("small", "chosen") : null),
        h("button.fr-kind", { type: "button", "aria-pressed": String(kind === "item"), disabled: !owned.length, onclick: () => ((kind = "item"), paintKind()) }, icon("shop", { size: 18 }), owned.length ? "A shop item" : "A shop item (you don't own any)", kind === "item" ? h("small", "chosen") : null)
      );
      fill(what, kind === "money" ? h("div", h("label", { for: "gift-amount" }, `Amount ($${s.giftMin} to $${s.giftMax}, from checking: ${money(game.life.checking)})`), amount) : h("div", h("label", { for: "gift-item" }, "Item (it leaves your closet)"), item));
    };
    paintKind();
    const send = h("button.bst-seal-btn", { type: "button" }, h("span.bst-seal-wax", { html: sealSvg({ seed: 53, size: 76, letter: "G" }) }), h("span.bst-seal-text", "Send the gift"));
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
      const after = win.left - 1;
      if (!confirm(`Send ${kind === "money" ? money(gift.amount) : SHOP_BY_ID[gift.itemId].name} to ${nameOf(to)}? ${after ? `You'll have ${after} gift${after === 1 ? "" : "s"} left.` : `That's your last gift for now. More open up ${CONFIG.social.giftHours} hours after your first one.`}`)) return;
      send.disabled = true;
      try {
        await game.db.sendGift(classId, gift, win);
      } catch (e) {
        console.error(e);
        err.textContent = e.code === "permission-denied" ? "That gift isn't allowed right now. You may need to wait, or you're not friends yet." : "The gift didn't send. Try again.";
        send.disabled = false;
        return;
      }
      game.life = S.applySentGift({ life: game.life, play, creature: game.save.creature, gift, toName: nameOf(to) });
      track("giftSend", { kind, amount: gift.amount || 0, item: gift.itemId || "" });
      toast("Gift sent. It's on its way.", "good");
      refreshWho();
      await game.persist("giftSend");
      await load();
    });
    // A shipping tag, tied on with string.
    return h(
      "section.fr-send",
      h("span.fr-send-string", { "aria-hidden": "true", html: stringSvg() }),
      h("p.fr-send-left", giftsLeftText(win)),
      h("label", { for: "gift-to" }, "To"),
      friend,
      h("p.fr-send-what", "What"),
      kindRow,
      what,
      h("label", { for: "gift-msg" }, "Message"),
      msg,
      err,
      h("div.bst-actions", send),
      note("Gifts come out of your checking. Generous is good. Broke is less good.")
    );
  }

  load();
  firstVisitLesson({ game, track, id: "plaza", route: "friends" });
}

// How many gifts are left in this window, in plain words.
function giftsLeftText(win) {
  const { giftsPerWindow: n, giftHours: hrs } = CONFIG.social;
  if (win.fresh) return `You can send ${n} gifts. The count starts over ${hrs} hours after your first one.`;
  return `${win.left} of ${n} gifts left. The count starts over ${hrs} hours after your first gift.`;
}
