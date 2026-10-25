// Protect Yourself: the insurance you pay for, and accounts where someone else's choices
// can land on you (a parent's card, a friend's loan you cosigned). It only appears when
// there is something here, so it never shows empty.
import { h, money } from "../dom.js";
import { icon } from "../icons.js";
import { amountOwed } from "../../engine/index.js";
import { exposureBills } from "../bills-panel.js";
import { protectContent } from "../../vault.js";
import { vaultActions } from "./actions.js";

export function protectTab(ctx) {
  const { run } = ctx;
  const life = run.life;
  const { onPay, onLeaveParentCard } = vaultActions(ctx);
  const { insurance, authorized, cosigned } = protectContent(life);
  return h(
    "section.vault-protect",
    h("h2", "Protect yourself"),
    insurance.length
      ? h(
          "article.bill-card",
          h("h3", icon("lock", { size: 20 }), " Insurance you pay for"),
          h("ul.upcoming", insurance.map((b) => h("li", h("span", b.name), h("strong", `${money(b.amount)} a month`)))),
          h("p.note.tight", "Insurance costs a little every month so one big surprise doesn't wreck your savings. You still pay a small part yourself, called the deductible.")
        )
      : null,
    authorized.length
      ? h(
          "article.bill-card",
          h("h3", icon("card", { size: 20 }), " A parent's card with your name on it"),
          authorized.map((a) => h("p", `${a.name}: ${money(amountOwed(a))} owed. You aren't the one paying it, but how it is used shows on your report.`)),
          h("div.row", h("button.secondary", { type: "button", onclick: onLeaveParentCard }, "Ask to be removed"))
        )
      : null,
    cosigned.length
      ? h(
          "article.bill-card",
          h("h3", icon("alert", { size: 20 }), " A loan you cosigned"),
          cosigned.map((a) => h("p", `${a.name}: ${money(amountOwed(a))} left. If ${a.friend || "your friend"} stops paying, you owe it.`)),
          exposureBills({ life, onPay, kinds: ["cosigned"] })
        )
      : null
  );
}
