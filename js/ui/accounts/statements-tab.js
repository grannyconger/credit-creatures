// Statements: purchases, payments, interest, fees, new balance and minimum
// due, month by month for each card (SPEC §14).
import { h, money, ageLabel } from "../dom.js";

let chosen = null;

export function statementsTab({ run, track, repaint }) {
  const life = run.life;
  const cards = life.accounts.filter((a) => a.type === "card" && a.owner === "self");
  if (!cards.length) return h("p.callout", "You don't have a credit card yet, so there are no statements.");
  if (!cards.some((a) => a.id === chosen)) chosen = cards[0].id;
  const a = cards.find((x) => x.id === chosen);
  const ageAt = (m) => ageLabel(life.start.ageMonths + m);
  const list = (a.statements || []).slice().reverse();
  return h(
    "div",
    cards.length > 1
      ? h(
          "div.chip-group",
          { role: "group", "aria-label": "Pick a card" },
          cards.map((c) =>
            h("button.chip", { type: "button", "aria-pressed": String(c.id === chosen), onclick: () => ((chosen = c.id), track("statementCard", {}), repaint()) }, c.name)
          )
        )
      : null,
    h("h2", a.name),
    a.pending?.length
      ? h("div.callout", h("p", h("strong", "Not on a statement yet")), h("ul.stmt-items", a.pending.map((p) => h("li", h("span", p.item), h("strong", money(p.amount))))), h("p.note.tight", "These post to your card at the next End Month."))
      : null,
    list.length
      ? list.map((s) =>
          h(
            "article.statement",
            h("h3", `Statement closed at ${ageAt(s.month + 1)}`),
            s.purchases.length ? h("ul.stmt-items", s.purchases.map((p) => h("li", h("span", p.item), h("strong", money(p.amount))))) : h("p.muted", "No purchases."),
            h(
              "dl.stmt-lines",
              line("Purchases", `+ ${money(s.purchaseTotal)}`),
              line("Payments", `− ${money(s.payments)}`),
              line("Interest", `+ ${money(s.interest)}`, s.interest > 0 ? "bad" : ""),
              line("Fees", `+ ${money(s.fees)}`, s.fees > 0 ? "bad" : ""),
              line("New balance", money(s.balance), "total"),
              line("Minimum due", money(s.minDue))
            )
          )
        )
      : h("p.muted", "Your first statement comes at the next End Month.")
  );
}

function line(label, value, cls = "") {
  return h("div", { class: cls }, h("dt", label), h("dd", value));
}
