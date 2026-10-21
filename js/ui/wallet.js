// The creature's digital wallet (SPEC §14): the Gilded Vault debit card that
// comes with checking at 18, every open credit card, and loans at a glance.
import { h, money, percent } from "./dom.js";
import { icon } from "./icons.js";
import { cardArt } from "./card-art.js";
import { ownCards, amountOwed, utilization } from "../engine/index.js";
import { fullName } from "../data/creatures.js";

// sparkle: Unicorn Sparkle Points, shown apart from the real score (SPEC §15).
export function moneyChips(life, sparkle = 0) {
  const util = utilization(life);
  const debt = life.accounts.filter((a) => a.owner === "self" && ["open", "collections"].includes(a.status)).reduce((s, a) => s + amountOwed(a), 0);
  return h(
    "ul.money-chips",
    { "aria-label": "Your money right now" },
    chip("vault", "Checking", money(life.checking), life.checking < 0 ? "bad" : ""),
    chip("piggy", "Savings", money(life.savings)),
    chip("gauge", "Score", life.score == null ? "None yet" : sparkle ? `${life.score} + ${sparkle}✨` : life.score),
    util != null ? chip("chart", "Card utilization", percent(util), util > 0.3 ? "warn" : "") : null,
    chip("receipt", "You owe", money(debt))
  );
}

function chip(ico, label, value, cls = "") {
  return h("li", { class: cls }, icon(ico, { size: 22 }), h("small", label), h("strong", String(value)));
}

export function walletStrip(life, creature) {
  const holder = fullName(creature);
  const items = [
    h(
      "figure.wallet-item",
      cardArt({ name: "Debit card", network: "visa", design: "vault", holder, issuerText: "🏦 The Gilded Vault", size: "mini" }),
      h("figcaption", h("strong", "Debit"), ` ${money(life.checking)} in checking`)
    ),
  ];
  for (const a of ownCards(life)) {
    const owed = amountOwed(a);
    items.push(
      h(
        "figure.wallet-item",
        cardArt({ issuer: a.issuer, network: a.network, name: a.name, design: a.design || "plasticBlue", nickname: a.nickname, holder, size: "mini" }),
        h("figcaption", h("strong", money(owed)), ` owed of ${money(a.limit)}`, h("span.util-bar", { "aria-hidden": "true" }, h("span", { class: owed / a.limit > 0.3 ? "high" : "", style: { width: `${Math.min(100, Math.round((owed / a.limit) * 100))}%` } })))
      )
    );
  }
  const loans = life.accounts.filter((a) => a.owner !== "authorized" && a.kind !== "revolving" && a.status === "open");
  return h(
    "section.wallet",
    { "aria-label": "Your digital wallet" },
    h("h3", "📱 Your digital wallet"),
    h("div.wallet-row", items),
    loans.length
      ? h(
          "ul.loan-list",
          loans.map((a) => h("li", h("span", { "aria-hidden": "true" }, a.icon), ` ${a.name}: `, h("strong", money(amountOwed(a))), a.payment ? ` (${money(a.payment)}/month)` : ""))
        )
      : null
  );
}

// Buttons into Account Management, with the inbox's unread count.
export function accountButtons(game, go, unread) {
  const open = (tab) => () => {
    game.accountsTab = tab;
    go("accounts");
  };
  return h(
    "div.acct-buttons",
    h("button.secondary", { type: "button", onclick: open("wallet") }, "🏦 Accounts"),
    h("button.secondary", { type: "button", onclick: open("score") }, "⭐ My Score"),
    h("button.secondary", { type: "button", onclick: open("desk") }, "🧮 Practice Desk"),
    h("button.secondary", { type: "button", onclick: () => go("shop") }, "🛍️ Shop"),
    h("button.secondary", { type: "button", onclick: () => go("trophies") }, "🏆 Trophies"),
    game.classInfo?.social === false ? null : h("button.secondary", { type: "button", onclick: () => go("friends") }, "👥 Friends"),
    h(
      "button.secondary",
      { type: "button", onclick: open("inbox"), "aria-label": unread ? `Inbox, ${unread} unread` : "Inbox" },
      "📬 Inbox",
      unread ? h("span.count-badge", { "aria-hidden": "true" }, String(unread)) : null
    )
  );
}
