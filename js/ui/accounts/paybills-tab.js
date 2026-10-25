// Pay Bills: what comes out of checking, your card bills with the buttons to pay them
// and AutoPay, and the money that moved lately.
import { h, money, ageLabel } from "../dom.js";
import { cardBills, upcomingBlock } from "../bills-panel.js";
import { checkingActivity } from "../../vault.js";
import { vaultActions } from "./actions.js";

export function payBillsTab(ctx) {
  const { run } = ctx;
  const life = run.life;
  const { onPay, onAutopay } = vaultActions(ctx);
  const activity = checkingActivity(life, 10);
  const ageAt = (m) => ageLabel(life.start.ageMonths + m);
  return h(
    "section.vault-paybills",
    h("h2", "Pay your bills"),
    h("p.muted", `Checking has ${money(life.checking)}. Bills come out of it at End Month, so keep enough in it.`),
    upcomingBlock({ life }),
    life.accounts.some((a) => a.kind === "revolving" && a.owner === "self") ? h("h3", "Credit card bills") : null,
    life.accounts.some((a) => a.kind === "revolving" && a.owner === "self") ? cardBills({ life, onPay, onAutopay }) : null,
    h("h3", "Money in and out of checking"),
    activity.length
      ? h(
          "ul.activity",
          activity.map((r) => h("li", { class: r.amount < 0 ? "out" : "in" }, h("span.act-when", ageAt(r.month)), h("span.act-what", r.label), h("strong.act-amount", `${r.amount < 0 ? "−" : "+"}${money(Math.abs(r.amount))}`)))
        )
      : h("p.muted", "Nothing has moved yet.")
  );
}
