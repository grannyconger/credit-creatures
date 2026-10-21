// Pick your creature's dream (teacher request 2026-10-20). Savings, a good
// credit score and good habits make it possible. Shown after the creature is
// made, and from the Cottage to change it.
import { h, money } from "../dom.js";
import { icon } from "../icons.js";
import { DREAMS, dreamSummary } from "../../data/dreams.js";

export function render(root, { game, advance, editing, go, track }) {
  const c = game.save.creature;
  const pick = async (id) => {
    c.dream = id;
    if (game.save.play) {
      game.save.play.dreamDone = null;
      game.save.play.dreamStage = 0;
    }
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
      h("p", "Every creature in Coinhaven has a dream. Your money choices decide whether it comes true. Each dream has 3 stages. You'll need savings, a good credit score, good habits, work and learning."),
      editing && (game.save.play?.dreamStage || 0) > 0 ? h("p.callout.warn", icon("alert", { size: 16 }), " Picking a different dream starts it over at stage 1.") : null,
      h(
        "div.dream-options",
        Object.entries(DREAMS).map(([id, d]) =>
          h(
            "button.dream-option",
            { type: "button", "aria-pressed": String(c.dream === id), onclick: () => pick(id) },
            h("span.dream-icon", { "aria-hidden": "true" }, d.icon),
            h("strong", d.title),
            h("span", d.story),
            h("small.dream-needs", icon("piggy", { size: 14 }), ` Save ${money(dreamSummary(d).savings)}`, "  ", icon("gauge", { size: 14 }), ` Score ${dreamSummary(d).score}+`),
            h("ol.dream-stage-list", d.stages.map((st) => h("li", st.title))),
            h("small.muted", d.why)
          )
        )
      ),
      editing ? h("div.row", h("button.secondary", { type: "button", onclick: () => go(game.step === "hub" ? "cottage" : game.step) }, "Keep my dream")) : null
    )
  );
}
