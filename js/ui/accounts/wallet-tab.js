// Wallet: the cards in the digital wallet, loans, BNPL plans and bills,
// with payments, AutoPay and payoff previews.
import { icon } from "../icons.js";
import { h, money, percent, toast } from "../dom.js";
import { pay, setAutopay, moveToSavings, moveToChecking, amountOwed, dollars } from "../../engine/index.js";
import { walletStrip } from "../wallet.js";
import { billsPanel } from "../bills-panel.js";
import { notePayment } from "../../progress.js";
import { hasFeature } from "../../progression.js";
import { sfx } from "../sound.js";

export function walletTab({ game, run, track, save, repaint, go }) {
  const life = run.life;
  const act = async (r, reason, data) => {
    if (!r.ok) return toast(r.message, "bad");
    run.life = r.life;
    track(reason, data);
    // A bill payment is a payment, so it gets the same chime a phone makes after a tap to pay.
    if (reason === "billPay") sfx.tapToPay();
    toast(r.message, "good");
    await save(reason);
    repaint();
  };
  const loans = life.accounts.filter((a) => a.kind === "installment" && a.status === "open" && a.owner !== "authorized");
  const plans = life.accounts.filter((a) => a.kind === "bnpl" && a.status === "open");
  // Phase 10: once cards unlock, a student without one can apply here.
  const noCard = hasFeature(run.play, "card", life) && !life.accounts.some((a) => a.kind === "revolving" && a.owner === "self" && a.status === "open");
  return h(
    "div",
    // The wallet and the credit card invitation sit side by side, so the page has no empty corner.
    h(
      "div.vault-top",
      walletStrip(life, game.save.creature),
      noCard && !run.practice
        ? h("section.callout.apply-card", h("p.tight", h("strong", icon("card", { size: 18 }), " Ready for your first credit card?")), h("p.tight", "Learn who's behind a card, design yours and apply. The Vault tells you why it says yes or no."), h("div.row", h("button", { type: "button", onclick: () => go("cardIntro") }, "Apply for a credit card")))
        : null
    ),
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
                  fact("Payments left", String(Math.max(0, a.termMonths - a.monthsPaid))),
                  fact("Next payment", a.firstDueMonth == null ? "After school + 6 months" : a.firstDueMonth > life.month ? `In ${a.firstDueMonth - life.month} month${a.firstDueMonth - life.month === 1 ? "" : "s"}` : "At this End Month")
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
    h("h3", "Cards and bills"),
    billsPanel({
      life,
      onPay: (id, amount, kind) => {
        const r = pay(run.life, id, amount);
        if (r.ok) notePayment(run.play, run.life, id, r.paid);
        return act(r, "billPay", { kind, amount, where: "wallet" });
      },
      onMove: (dir, amount) => act(dir === "toSavings" ? moveToSavings(run.life, amount) : moveToChecking(run.life, amount), "moveMoney", { dir, amount }),
      onAutopay: (id, mode) => act(setAutopay(run.life, id, mode), "autopaySet", { mode: mode || "off" }),
    })
  );
}

function fact(label, value) {
  return h("div", h("dt", label), h("dd", value));
}
