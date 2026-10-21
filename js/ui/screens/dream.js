// Pick your creature's dream (teacher request 2026-10-20). Savings, a good
// credit score and good habits make it possible. Shown after the creature is
// made, and from the Cottage to change it.
import { h, money } from "../dom.js";
import { icon } from "../icons.js";
import { DREAMS } from "../../data/dreams.js";

export function render(root, { game, advance, editing, go, track }) {
  const c = game.save.creature;
  const pick = async (id) => {
    c.dream = id;
    if (game.save.play) game.save.play.dreamDone = null;
    track("dreamChosen", { dream: id, editing });
    if (editing) {
      await game.persist("dream");
      go(game.step === "hub" ? "cottage" : game.step);
    } else {
      await advance("join");
    }
  };
  root.append(
    h(
      "section.panel.dream-pick",
      h("p.step-label", editing ? "Change the dream" : "Step 3: a dream"),
      h("h1", `What does ${c.name} dream of?`),
      h("p", "Every creature in Coinhaven has a dream. Your money choices decide whether it comes true. You'll need savings, a good credit score and good habits."),
      h(
        "div.dream-options",
        Object.entries(DREAMS).map(([id, d]) =>
          h(
            "button.dream-option",
            { type: "button", "aria-pressed": String(c.dream === id), onclick: () => pick(id) },
            h("span.dream-icon", { "aria-hidden": "true" }, d.icon),
            h("strong", d.title),
            h("span", d.story),
            h("small.dream-needs", icon("piggy", { size: 14 }), ` Save ${money(d.savings)}`, "  ", icon("gauge", { size: 14 }), ` Score ${d.score}+`),
            h("small.muted", d.why)
          )
        )
      ),
      editing ? h("div.row", h("button.secondary", { type: "button", onclick: () => go(game.step === "hub" ? "cottage" : game.step) }, "Keep my dream")) : null
    )
  );
}
