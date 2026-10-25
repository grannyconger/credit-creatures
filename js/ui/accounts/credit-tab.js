// Build Credit, the Cards view: the cards in the wallet, and the invitation to apply for
// your first one. Statements, My Score and My Report are the other views.
import { h } from "../dom.js";
import { icon } from "../icons.js";
import { walletStrip } from "../wallet.js";
import { hasFeature } from "../../progression.js";

export function cardsTab({ game, run, go }) {
  const { life, play } = run;
  // Once cards unlock, a student without one can apply here.
  const noCard = hasFeature(play, "card", life) && !life.accounts.some((a) => a.kind === "revolving" && a.owner === "self" && a.status === "open");
  return h(
    "section.vault-cards",
    h("h2", "Your cards"),
    h(
      "div.vault-top",
      walletStrip(life, game.save.creature, { loans: false }),
      noCard && !run.practice
        ? h(
            "section.callout.apply-card",
            h("p.tight", h("strong", icon("card", { size: 18 }), " Ready for your first credit card?")),
            h("p.tight", "Learn who's behind a card, design yours and apply. The Vault tells you why it says yes or no."),
            h("div.row", h("button", { type: "button", onclick: () => go("cardIntro") }, "Apply for a credit card"))
          )
        : null
    )
  );
}
