// The creature's digital wallet (SPEC §14): the Vault debit card that
// comes with checking at 18, every open credit card, and loans at a glance.
import { moneyChipKeys } from "../progression.js";
import { h, money, percent } from "./dom.js";
import { icon } from "./icons.js";
import { countTo } from "./motion/ticker.js";
import { cardArt } from "./card-art.js";
import { ownCards, amountOwed, utilization } from "../engine/index.js";
import { fullName } from "../data/creatures.js";

// sparkle: Unicorn Sparkle Points, shown apart from the real score (SPEC §15).
// Only the numbers a student has learned about so far (js/progression.js):
// a piggy bank in the prologue, then checking and savings, then debt, a card
// and finally the score.
export function moneyChips(life, play) {
  const keys = moneyChipKeys(play, life);
  const sparkle = play?.sparkle?.total || 0;
  const util = utilization(life);
  const debt = life.accounts.filter((a) => a.owner === "self" && ["open", "collections"].includes(a.status)).reduce((s, a) => s + amountOwed(a), 0);
  const chips = {
    piggy: () => chip("piggy", "Piggy bank", money(life.checking), "", [life.checking, money]),
    checking: () => chip("vault", "Checking", money(life.checking), life.checking < 0 ? "bad" : "", [life.checking, money]),
    savings: () => chip("piggy", "Savings", money(life.savings), "", [life.savings, money]),
    score: () => chip("gauge", "Score", life.score == null ? "None yet" : sparkle ? `${life.score} + ${sparkle}✨` : life.score, "", life.score == null || sparkle ? null : [life.score, (n) => String(Math.round(n))]),
    util: () => (util != null ? chip("chart", "Card utilization", percent(util), util > 0.3 ? "warn" : "") : null),
    owed: () => chip("receipt", "You owe", money(debt), "", [debt, money]),
  };
  return h("ul.money-chips", { "aria-label": "Your money right now", class: `chips-${keys.length}` }, keys.map((k) => chips[k]()));
}

// roll: [number, format] makes the value roll from its last shown number.
function chip(ico, label, value, cls = "", roll = null) {
  const strong = h("strong", String(value));
  if (roll) countTo(strong, label, roll[0], roll[1]);
  return h("li", { class: cls }, icon(ico, { size: 22 }), h("small", label), strong);
}

// loans: false leaves the loan list out (the Vault shows loans under Manage Debt).
export function walletStrip(life, creature, { loans: showLoans = true } = {}) {
  const holder = fullName(creature);
  const items = [
    h(
      "figure.wallet-item",
      cardArt({ name: "Debit card", network: "visa", design: "vault", holder, issuerText: "🏦 The Vault", size: "mini" }),
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
    h("h3", icon("wallet", { size: 20 }), " Your digital wallet"),
    h("div.wallet-row", items),
    showLoans && loans.length
      ? h(
          "ul.loan-list",
          loans.map((a) => h("li", h("span", { "aria-hidden": "true" }, a.icon), ` ${a.name}: `, h("strong", money(amountOwed(a))), a.payment ? ` (${money(a.payment)}/month)` : ""))
        )
      : null
  );
}

