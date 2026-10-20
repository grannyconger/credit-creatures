// Chapter 1 complete. Phase 4 replaces the "what's next" part with the hub.
import { h, money, ageLabel } from "../dom.js";
import { findAccount, hardInquiriesInWindow } from "../../engine/index.js";
import { CONFIG } from "../../data/config.js";
import { creatureSvg } from "../creature-art.js";
import { cardArt } from "../card-art.js";

export function render(root, { game, go, saveAndQuit }) {
  const life = game.life;
  const c = game.save.creature;
  const card = game.ob.cardId ? findAccount(life, game.ob.cardId) : null;

  root.append(
    h(
      "section.panel",
      h(
        "div.hero",
        h("div.hero-art", { html: creatureSvg(c, { size: 160 }) }),
        h(
          "div",
          h("p.step-label", "Chapter 1 complete"),
          h("h1", `Nice work, ${c.name}!`),
          h("p", `${ageLabel(life.ageMonths)}. Here is where your credit life stands.`)
        )
      ),
      h(
        "div.stat-grid",
        stat("Credit score", life.score ?? "None yet"),
        stat("In checking", money(life.checking)),
        stat("Hard inquiries", hardInquiriesInWindow(life)),
        stat("Applications sent", game.ob.applications || 0)
      ),
      card
        ? h(
            "div.done-card",
            cardArt({ issuer: card.issuer, network: card.network, name: card.name, design: card.design, nickname: card.nickname, holder: c.name }),
            h("p", `Limit ${money(card.limit)}. APR ${(card.apr * 100).toFixed(1)}%. Your first statement comes at the end of next month.`)
          )
        : h("div.callout", h("p", "You don't have a card yet. You will get more chances to apply in the chapters ahead.")),
      h("h3", "What's next"),
      h(
        "ul",
        h("li", `Starting now, ${c.name} pays a ${money(CONFIG.bills.phone)} phone bill and a ${money(CONFIG.bills.busPass)} bus pass each month.`),
        h("li", "Chapter 2 opens when your teacher releases it. A first real job, a car decision and student loan offers are coming.")
      ),
      h(
        "div.row",
        h("button.secondary", { type: "button", onclick: () => go("creature") }, "Edit my creature"),
        h("button", { type: "button", onclick: saveAndQuit }, "Save and quit")
      )
    )
  );
}

function stat(label, value) {
  return h("div.stat", h("span.stat-value", String(value)), h("span.stat-label", label));
}
