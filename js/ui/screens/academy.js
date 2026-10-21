// The Academy: practice questions for XP and Sparkle Points, and a door to
// trophies and ranks. Learning is how creatures rise in Coinhaven.
import { h, fill } from "../dom.js";
import { icon } from "../icons.js";
import { deskTab } from "../accounts/desk-tab.js";
import { placeHeader } from "../place-header.js";
import { xpBar } from "./trophies.js";
import { runTour } from "../tour.js";

export function render(root, { game, go, track, refreshWho }) {
  const run = game.run;
  const panel = h("section.panel.place-screen.academy");
  root.append(panel);
  const ctx = {
    game,
    run,
    track,
    async save(reason) {
      refreshWho();
      await run.persist(reason);
    },
    repaint: () => paint(),
  };
  function paint() {
    fill(
      panel,
      placeHeader({ go, iconName: "academy", title: "The Academy", subtitle: "Answer questions to earn XP and Sparkle Points. XP raises your rank and unlocks new looks.", practice: run.practice }),
      h(
        "div.academy-rank",
        xpBar(run.play.xp),
        h("span.row.tight-row", h("button.secondary.small", { type: "button", onclick: () => runTour({ game, track }) }, "🧭 Kingdom Tour"), h("button.secondary.small", { type: "button", onclick: () => go("trophies") }, icon("trophy", { size: 16 }), " Trophies and ranks"))
      ),
      deskTab(ctx)
    );
  }
  paint();
}
