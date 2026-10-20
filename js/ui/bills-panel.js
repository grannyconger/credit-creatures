// Pay your cards, set AutoPay, preview payoff time, and see what comes out of
// checking at End Month. Used by the month's bills task and the Wallet tab.
import { h, add, money, percent } from "./dom.js";
import { ownCards, amountOwed, upcomingPayments, minimumOnlyPlan, payoffPlan } from "../engine/index.js";
import { CONFIG } from "../data/config.js";

// onPay(accountId, amount, kind) runs the payment and repaints.
// onMove("toSavings" | "toChecking", amount) moves money between accounts.
// onAutopay(accountId, mode) sets AutoPay: null, "min" or "full".
export function billsPanel({ life, onPay, onMove, onAutopay }) {
  const cards = ownCards(life);
  const cosigned = life.accounts.filter((a) => a.owner === "cosigned" && a.status === "open" && a.pastDue > 0);
  const collections = life.accounts.filter((a) => a.status === "collections" && amountOwed(a) > 0);
  const up = upcomingPayments(life);
  const el = h("div.bills");

  if (!cards.length) add(el, h("p.muted", "No credit card bills right now."));
  for (const a of cards) {
    const owed = amountOwed(a);
    const due = a.due;
    const minLeft = due ? Math.max(0, Math.round((due.minDue - a.paidThisCycle) * 100) / 100) : 0;
    const stmtLeft = due ? Math.max(0, Math.round((Math.min(due.statementBalance, owed) - a.paidThisCycle) * 100) / 100) : 0;
    const btn = (label, amount, kind) =>
      h("button", { type: "button", class: kind === "min" ? "secondary" : "", disabled: amount <= 0 || amount > life.checking, onclick: () => onPay(a.id, amount, kind) }, `${label} ${money(amount)}`);
    const custom = h("input", { type: "number", min: 1, max: owed, step: "0.01", inputmode: "decimal", "aria-label": `Custom payment to ${a.name}`, placeholder: "Other amount" });
    const plan = due && due.statementBalance > 0 ? minimumOnlyPlan(due.statementBalance, a.apr) : null;
    add(
      el,
      h(
        "div.bill-card",
        h("div.bill-head", h("strong", a.name), a.autopay ? h("span.badge", `AutoPay: ${a.autopay === "min" ? "minimum" : a.autopay === "full" ? "full" : money(a.autopay)}`) : null),
        h(
          "dl.bill-facts",
          fact("Owed now", money(owed)),
          fact("Limit", money(a.limit)),
          fact("APR", percent(a.apr, 1)),
          fact("Utilization", h("span", percent(owed / a.limit), utilBar(owed / a.limit))),
          due ? fact("Last statement", money(due.statementBalance)) : fact("Last statement", "None yet"),
          due ? fact("Minimum still due", minLeft > 0 ? money(minLeft) : "✓ Paid") : null,
          fact("Due", !due ? "after your first statement" : minLeft > 0 || stmtLeft > 0 ? "at this End Month" : "Nothing due")
        ),
        minLeft > 0 && !a.autopay ? h("p.warn-text", `⚠️ Pay at least ${money(minLeft)} before End Month or it will be late.`) : null,
        h(
          "div.row.pay-buttons",
          minLeft > 0 ? btn("Pay minimum", minLeft, "min") : null,
          stmtLeft > 0 ? btn("Pay statement", stmtLeft, "statement") : null,
          owed > 0 ? btn("Pay all", owed, "all") : null,
          owed <= 0 ? null : h(
            "form.custom-pay",
            {
              onsubmit: (e) => {
                e.preventDefault();
                const v = Math.round(Number(custom.value) * 100) / 100;
                if (v > 0) onPay(a.id, Math.min(v, owed), "custom");
              },
            },
            custom,
            h("button.secondary", { type: "submit" }, "Pay")
          ),
          owed <= 0 ? h("p.muted", "Nothing owed on this card.") : null
        ),
        plan && plan.months > 1 ? h("p.note.tight", `If you paid only minimums on ${money(due.statementBalance)}: ${plan.months} months and ${money(plan.totalInterest)} in interest.`) : null,
        owed > 0 ? payoffPreview(a, owed) : null,
        onAutopay ? autopayControl(a, onAutopay) : null
      )
    );
  }

  for (const a of collections) {
    const owed = amountOwed(a);
    add(
      el,
      h(
        "div.bill-card.bad",
        h("div.bill-head", h("strong", `🚨 ${a.name}`)),
        h("p", "This is on your credit report as a collection. Paying it won't erase the mark, but a paid collection hurts much less than an unpaid one."),
        h("div.row", h("button", { type: "button", disabled: owed > life.checking, onclick: () => onPay(a.id, owed, "collection") }, `Pay ${money(owed)} to settle it`))
      )
    );
  }

  for (const a of cosigned) {
    const need = a.pastDue;
    add(
      el,
      h(
        "div.bill-card.bad",
        h("div.bill-head", h("strong", a.name)),
        h("p", `${a.friend} missed ${money(need)}. It shows as late on YOUR report until someone pays it.`),
        h("div.row", h("button", { type: "button", disabled: need > life.checking, onclick: () => onPay(a.id, need, "cosigned") }, `Cover ${money(need)}`))
      )
    );
  }

  add(
    el,
    h("h3", "Comes out of checking at End Month"),
    up.auto.length
      ? h(
          "ul.upcoming",
          up.auto.map((x) => h("li", h("span", x.name, x.monthsLeft ? ` (${x.monthsLeft} left)` : ""), h("strong", money(x.amount)))),
          h("li.total", h("span", "Total"), h("strong", money(up.total)))
        )
      : h("p.muted", "Nothing automatic this month."),
    up.short > 0
      ? h("p.callout.warn", `⚠️ Checking is ${money(up.short)} short. Each payment that bounces costs a ${money(CONFIG.fees.overdraft)} overdraft fee. Work a shift or move money from savings.`)
      : h("p.note.tight", `After these, checking would have ${money(life.checking - up.total)} left.`),
    savingsMover(life, onMove)
  );
  return el;
}

function utilBar(u) {
  return h("span.util-bar", { "aria-hidden": "true" }, h("span", { class: u > 0.3 ? "high" : "", style: { width: `${Math.min(100, Math.round(u * 100))}%` } }));
}

// "Minimum only: 14 months, $86 interest. $60 a month: 4 months, $19 interest." (SPEC §14)
function payoffPreview(a, owed) {
  const id = `payoff-${a.id}`;
  const out = h("p.payoff-out", { "aria-live": "polite" });
  const input = h("input", { type: "number", id, min: 1, step: "1", inputmode: "decimal", value: Math.max(25, Math.ceil(owed / 4)) });
  const paint = () => {
    const monthly = Number(input.value);
    const min = minimumOnlyPlan(owed, a.apr);
    const lines = [`Minimum only: ${min.months} month${min.months === 1 ? "" : "s"}, ${money(min.totalInterest)} interest.`];
    if (monthly > 0) {
      const p = payoffPlan(owed, a.apr, monthly);
      lines.push(p.neverPaysOff ? `${money(monthly)} a month never pays it off. It doesn't even cover the interest.` : `${money(monthly)} a month: ${p.months} month${p.months === 1 ? "" : "s"}, ${money(p.totalInterest)} interest.`);
    }
    out.textContent = lines.join(" ");
  };
  input.addEventListener("input", paint);
  paint();
  return h("div.payoff", h("label", { for: id }, `Payoff preview for ${money(owed)} at ${percent(a.apr, 1)} APR. If I pay this much a month:`), input, out);
}

const AUTOPAY = [
  [null, "Off"],
  ["min", "Minimum"],
  ["full", "Full statement"],
];

function autopayControl(a, onAutopay) {
  return h(
    "div.autopay",
    h("span.autopay-label", "AutoPay"),
    h(
      "div.chip-group",
      { role: "group", "aria-label": `AutoPay for ${a.name}` },
      AUTOPAY.map(([mode, label]) =>
        h("button.chip", { type: "button", "aria-pressed": String((a.autopay || null) === mode), onclick: () => onAutopay(a.id, mode) }, label)
      )
    ),
    h("p.note.tight", "AutoPay pays from checking at End Month. If checking runs short, the payment bounces with an overdraft fee.")
  );
}

function savingsMover(life, onMove) {
  const amount = h("input", { type: "number", min: 1, step: "1", inputmode: "decimal", id: "move-amount", placeholder: "Amount" });
  const go = (dir) => {
    const v = Math.round(Number(amount.value) * 100) / 100;
    if (v > 0) onMove(dir, v);
  };
  return h(
    "div.mover",
    h("h3", h("label", { for: "move-amount" }, "Move money")),
    h("p.note.tight", `Checking ${money(life.checking)} · Savings ${money(life.savings)}`),
    h(
      "div.custom-pay",
      amount,
      h("button.secondary", { type: "button", onclick: () => go("toSavings") }, "To savings"),
      h("button.secondary", { type: "button", onclick: () => go("toChecking") }, "To checking")
    )
  );
}

function fact(label, value) {
  return h("div", h("dt", label), h("dd", value));
}
