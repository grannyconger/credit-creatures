// "Pay with" picker (SPEC §14): every way to pay, with live balances, so the
// choice is made from real numbers. The debit card and credit cards live in
// the creature's digital wallet.
import { h, add, fill, money, percent } from "./dom.js";
import { paymentOptions, findAccount } from "../engine/index.js";

const WHAT = {
  debit: "Spends your own money right now. Not on your credit report.",
  card: "Borrows from the bank. Due after your next statement. Raises your utilization until you pay it.",
  bnpl: "Splits it into 3 payments from checking. Not on your report unless you miss and it goes to collections.",
};

// allowed: the methods unlocked so far (js/progression.js payMethods). piggy:
// the prologue, before the bank, when "debit" means coins from the piggy bank.
export function payWith({ life, cost, onPick, onBack, allowed = null, piggy = false }) {
  const methods = (cost.methods || ["debit", "card", "bnpl"]).filter((m) => !allowed || allowed.includes(m));
  const options = paymentOptions(life, { ...cost, methods });
  const list = h("div.pay-options", { role: "list" });
  for (const o of options) {
    let icon = "🏦";
    let name = "Vault debit card";
    let numbers;
    if (o.kind === "debit" && piggy) {
      icon = "🐷";
      name = "Coins from your piggy bank";
      numbers = h("span.pay-numbers", `Piggy bank ${money(o.before)} → ${money(o.after)}`);
    } else if (o.kind === "debit") {
      numbers = h("span.pay-numbers", `Checking ${money(o.before)} → ${money(o.after)}`);
    } else if (o.kind === "card") {
      const a = findAccount(life, o.accountId);
      icon = "💳";
      name = a.nickname ? `${a.name} "${a.nickname}"` : a.name;
      const high = o.utilAfter > 0.3;
      numbers = h(
        "span.pay-numbers",
        `Utilization ${percent(o.utilBefore)} → ${percent(Math.min(o.utilAfter, 9.99))}`,
        h("span.util-bar", { "aria-hidden": "true" }, h("span", { class: high ? "high" : "", style: { width: `${Math.min(100, Math.round(o.utilAfter * 100))}%` } })),
        high && o.ok ? h("small.warn-text", "Over 30% can lower your score.") : null
      );
    } else {
      icon = "🧾";
      name = "Pay later (BNPL)";
      numbers = h("span.pay-numbers", `${money(o.first)} today, then ${o.later.map(money).join(" and ")} at the next ${o.later.length} End Months`);
    }
    list.append(
      h(
        "button.pay-option",
        { type: "button", role: "listitem", disabled: !o.ok, onclick: () => onPick(o.method, o) },
        h("span.pay-icon", { "aria-hidden": "true" }, icon),
        h("span.pay-text", h("strong", name), h("small", piggy && o.kind === "debit" ? "Cash you already have. Once it's spent, it's gone." : WHAT[o.kind]), numbers, o.ok ? null : h("small.error-text", o.reason))
      )
    );
  }
  const none = options.every((o) => !o.ok);
  return h(
    "div.pay-with",
    h("h3", `Pay ${money(cost.amount)} with...`),
    piggy ? null : h("p.note.tight", "📱 Your digital wallet holds your debit card and any credit cards."),
    list,
    none ? h("p.error-text", piggy ? "Your piggy bank doesn't have enough yet. Work a shift at the Guild Hall." : "Nothing in your wallet can cover this right now.") : null,
    h("div.row", h("button.secondary", { type: "button", onclick: onBack }, "Back"))
  );
}

// Short words for telemetry and the decision log.
export function methodLabel(method, life) {
  if (!method) return "";
  if (method === "debit") return "debit card";
  if (method === "bnpl") return "pay later";
  const a = findAccount(life, method.slice(5));
  return a ? a.name : "credit card";
}
