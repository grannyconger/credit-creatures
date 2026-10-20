// Approved or denied, with terms and plain-language reasons (SPEC §7).
import { h, money, percent } from "../dom.js";
import { fullName } from "../../data/creatures.js";
import { addBill, hardInquiriesInWindow } from "../../engine/index.js";
import { CONFIG } from "../../data/config.js";
import { cardArt } from "../card-art.js";

export function render(root, { game, advance, track }) {
  const r = game.ob.lastResult;
  const inquiries = hardInquiriesInWindow(game.life);
  const card = cardArt({ issuer: r.issuer, network: r.network, name: r.name, design: r.design, nickname: r.nickname, holder: fullName(game.save.creature), size: "large" });

  const inquiryNote = h(
    "p.note",
    `This application added a hard inquiry to your report. You now have ${inquiries} in the last 12 months.`,
    inquiries >= CONFIG.approval.inquiryPenaltyFrom ? " Lenders get nervous when these pile up." : ""
  );

  async function finish(hasCard) {
    let life = game.life;
    life = addBill(life, "Phone", CONFIG.bills.phone).life;
    life = addBill(life, "Bus pass", CONFIG.bills.busPass).life;
    game.life = life;
    game.ob.chapter1Done = true;
    track("chapterComplete", { chapter: 1, hasCard, applications: game.ob.applications, score: life.score ?? -1, inquiries });
    await advance("done");
  }

  const redesign = () => {
    track("redesign", { after: r.approved ? "approved" : "denied" });
    advance("design");
  };

  if (r.approved) {
    root.append(
      h(
        "section.panel.result",
        h("p.step-label", "Chapter 1: your application"),
        h("h1", "🎉 Approved!"),
        h("div.result-card", card),
        h(
          "div.stat-grid",
          stat("Credit limit", money(r.limit)),
          stat("APR", percent(r.apr, 1)),
          stat("Annual fee", money(r.annualFee))
        ),
        r.secured ? h("p", `Your ${money(r.limit)} deposit came out of checking. You get it back when you close the card or it upgrades.`) : null,
        h("h3", "Why the issuer said yes"),
        h("ul.reasons", r.reasons.map((x) => h("li", x))),
        inquiryNote,
        h("div.row", h("button.big", { type: "button", onclick: () => finish(true) }, "Finish Chapter 1"))
      )
    );
    return;
  }

  root.append(
    h(
      "section.panel.result",
      h("p.step-label", "Chapter 1: your application"),
      h("h1", "😬 Denied"),
      h("p", `${r.name} said no this time.`),
      h("h3", "Why the issuer said no"),
      h("ul.reasons", r.reasons.map((x) => h("li", x))),
      h(
        "div.callout",
        h("p", h("strong", "Tip: "), "Cards made for beginners, like a secured or student card, are much easier to get. Asking for a lower limit or a plain design helps too."),
        h("p", "Every new application adds another hard inquiry, so think before you apply again.")
      ),
      inquiryNote,
      h(
        "div.row",
        h("button.secondary", { type: "button", onclick: () => finish(false) }, "Keep going without a card"),
        h("button", { type: "button", onclick: redesign }, "Redesign and apply again")
      )
    )
  );
}

function stat(label, value) {
  return h("div.stat", h("span.stat-value", value), h("span.stat-label", label));
}
