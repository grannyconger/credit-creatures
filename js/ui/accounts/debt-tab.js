// Loans and Debt: everything you owe, by kind, with each loan and pay-later plan, and any
// debt that went to collections.
import { h, money } from "../dom.js";
import { icon } from "../icons.js";
import { amountOwed, balanceSheet, arcadeIou } from "../../engine/index.js";
import { exposureBills, loanBills } from "../bills-panel.js";
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
  // Risky mode mistakes that checking couldn't cover (GAME-SPECS.md 2.3).
  const iou = arcadeIou(life);
  const iouOwed = iou ? amountOwed(iou) : 0;
  const payIou = (amount) => () => onPay(iou.id, Math.min(amount, iouOwed, life.checking), "arcadeIou");
  return h(
    "section.vault-debt",
    h("h2", "Your loans and debt"),
    h(
      "article.nw-card",
      h("small.nw-title", "You owe"),
      h("strong.nw-total", money(sheet.liabilities.total)),
      segmentBar({ parts: sheet.liabilities.parts, label: "What you owe" }),
      parts.length ? h("ul.nw-parts", parts.map((p) => h("li", h("span.seg-swatch", { class: `seg-${p.key}`, "aria-hidden": "true" }), h("span", SEGMENT_LABELS[p.key]), h("strong", money(p.amount))))) : h("p.muted.tight", "Nothing owed. Nice.")
    ),
    exposureBills({ life, onPay, kinds: ["collections"] }),
    iouOwed > 0
      ? h(
          "section.iou-card",
          h("h3", icon("alert", { size: 18 }), " Owed to the Arcade"),
          h("p", `${money(iouOwed)} from risky mode mistakes your checking couldn't cover. It charges no interest and isn't on your credit report, but it counts against your net worth until you pay it.`),
          h(
            "div.row",
            h("button", { type: "button", disabled: life.checking <= 0, onclick: payIou(iouOwed) }, `Pay ${money(Math.min(iouOwed, life.checking))}`),
            iouOwed > 20 ? h("button.secondary", { type: "button", disabled: life.checking < 20, onclick: payIou(20) }, "Pay $20") : null
          )
        )
      : null,
    loans.length
      ? h(
          "section",
          h("h3", "Loans"),
          loanBills({ life, onPay })
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
