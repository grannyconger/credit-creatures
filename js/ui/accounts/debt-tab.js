// Manage Debt: everything you owe, by kind, with each loan and pay-later plan, and any
// debt that went to collections.
import { h, money, percent } from "../dom.js";
import { icon } from "../icons.js";
import { amountOwed, balanceSheet, dollars } from "../../engine/index.js";
import { exposureBills } from "../bills-panel.js";
import { segmentBar, SEGMENT_LABELS } from "../segment-bar.js";
import { vaultActions } from "./actions.js";

export function debtTab(ctx) {
  const { run } = ctx;
  const life = run.life;
  const { onPay } = vaultActions(ctx);
  const sheet = balanceSheet(life);
  const parts = sheet.liabilities.parts.filter((p) => p.amount > 0);
  const loans = life.accounts.filter((a) => a.kind === "installment" && a.status === "open" && a.owner !== "authorized");
  const plans = life.accounts.filter((a) => a.kind === "bnpl" && a.status === "open");
  const monthsLeft = (a) => Math.max(0, a.termMonths - a.monthsPaid);
  return h(
    "section.vault-debt",
    h("h2", "Manage your debt"),
    h(
      "article.nw-card",
      h("small.nw-title", "You owe"),
      h("strong.nw-total", money(sheet.liabilities.total)),
      segmentBar({ parts: sheet.liabilities.parts, label: "What you owe" }),
      parts.length ? h("ul.nw-parts", parts.map((p) => h("li", h("span.seg-swatch", { class: `seg-${p.key}`, "aria-hidden": "true" }), h("span", SEGMENT_LABELS[p.key]), h("strong", money(p.amount))))) : h("p.muted.tight", "Nothing owed. Nice.")
    ),
    exposureBills({ life, onPay, kinds: ["collections"] }),
    loans.length
      ? h(
          "section",
          h("h3", "Loans"),
          h(
            "div.loan-cards",
            loans.map((a) =>
              h(
                "div.bill-card",
                h("div.bill-head", h("strong", `${a.icon} ${a.name}`), a.owner === "cosigned" ? h("span.badge", "You cosigned") : null),
                h(
                  "dl.bill-facts",
                  fact("Still owed", money(amountOwed(a))),
                  fact("Payment", `${money(a.payment)}/month`),
                  fact("APR", percent(a.apr, 1)),
                  fact("Payments left", String(monthsLeft(a))),
                  fact("Next payment", a.firstDueMonth == null ? "After school + 6 months" : a.firstDueMonth > life.month ? `In ${a.firstDueMonth - life.month} month${a.firstDueMonth - life.month === 1 ? "" : "s"}` : "At End Month")
                ),
                a.held ? h("p.note.tight", `${dollars(a.held)} is locked in savings until this loan is paid off.`) : null
              )
            )
          )
        )
      : null,
    plans.length
      ? h(
          "section",
          h("h3", "Buy now, pay later plans"),
          plans.map((a) =>
            h(
              "div.bill-card",
              h("div.bill-head", h("strong", `${a.icon} ${a.name}`)),
              h("p", a.installments.filter((i) => i.paid < i.amount).map((i) => `${money(i.amount - i.paid)} ${i.dueMonth <= life.month ? "at this End Month" : "at the next End Month"}`).join(", then "))
            )
          )
        )
      : null,
    !loans.length && !plans.length && !parts.length ? h("p.callout.good", icon("check", { size: 16 }), " You're debt free. Keep it that way.") : null
  );
}

function fact(label, value) {
  return h("div", h("dt", label), h("dd", value));
}
