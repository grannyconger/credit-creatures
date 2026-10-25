// Save for Goals: savings, moving money, a safety net of three months of bills, and
// savings locked by a credit-builder loan.
import { h, money } from "../dom.js";
import { icon } from "../icons.js";
import { savingsMover } from "../bills-panel.js";
import { segmentBar } from "../segment-bar.js";
import { upcomingPayments } from "../../engine/index.js";
import { vaultActions } from "./actions.js";

export function saveTab(ctx) {
  const { run, go } = ctx;
  const life = run.life;
  const { onMove } = vaultActions(ctx);
  // The safety net: about 3 months of what comes out of checking (the Emergency fund card's rule).
  const monthly = upcomingPayments(life).total;
  const goal = Math.round(monthly * 3);
  const have = life.savings;
  const months = monthly > 0 ? have / monthly : null;
  return h(
    "section.vault-save",
    h("h2", "Save for goals"),
    h("div.save-top", h("article.nw-card", h("small.nw-title", "In savings"), h("strong.nw-total", money(have)), h("p.muted.tight", `Checking has ${money(life.checking)}.`))),
    h(
      "article.save-goal",
      h("h3", icon("piggy", { size: 20 }), " Your safety net"),
      goal > 0
        ? [
            h("p", `Experts say to keep about 3 months of bills in savings, so a surprise doesn't turn into debt. For you that's ${money(goal)}.`),
            segmentBar({ parts: [{ key: "savings", amount: Math.min(have, goal) }], scale: goal, label: "Safety net" }),
            h("p", h("strong", months >= 3 ? "You've reached your safety net." : `${money(have)} of ${money(goal)}, about ${months.toFixed(1)} months of bills.`))
          ]
        : h("p", "You don't have any monthly bills yet, so any savings is a head start.")
    ),
    life.heldSavings > 0 ? h("p.callout", icon("alert", { size: 16 }), ` ${money(life.heldSavings)} is locked for your credit-builder loan. It's yours once the loan is paid off.`) : null,
    savingsMover(life, onMove),
    h("p", h("button.secondary", { type: "button", onclick: () => go("dream") }, icon("dream", { size: 16 }), " See your dream"))
  );
}
