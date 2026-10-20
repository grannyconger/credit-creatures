// Wallet: the cards in the digital wallet, loans, BNPL plans and bills,
// with payments, AutoPay and payoff previews.
import { h, money, percent, toast } from "../dom.js";
import { pay, setAutopay, moveToSavings, moveToChecking, amountOwed, dollars } from "../../engine/index.js";
import { walletStrip } from "../wallet.js";
import { billsPanel } from "../bills-panel.js";
import { notePayment } from "../../progress.js";

export function walletTab({ game, run, track, save, repaint }) {
  const life = run.life;
  const act = async (r, reason, data) => {
    if (!r.ok) return toast(r.message, "bad");
    run.life = r.life;
    track(reason, data);
    toast(r.message, "good");
    await save(reason);
    repaint();
  };
  const loans = life.accounts.filter((a) => a.kind === "installment" && a.status === "open" && a.owner !== "authorized");
  const plans = life.accounts.filter((a) => a.kind === "bnpl" && a.status === "open");
  return h(
    "div",
    walletStrip(life, game.save.creature),
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
