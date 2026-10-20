// After Save and quit.
import { h } from "../dom.js";
import { creatureSvg } from "../creature-art.js";

export function render(root, { game, back }) {
  const c = game.save.creature;
  root.append(
    h(
      "section.panel.narrow.center",
      c ? h("div", { html: creatureSvg(c, { size: 140 }) }) : null,
      h("h1", "Saved ✅"),
      h("p", c ? `${c.name} will be right here next time you sign in.` : "Your progress will be right here next time you sign in."),
      h("p.note", "You can close this tab now."),
      h("div.row.center", h("button", { type: "button", onclick: back }, "Keep playing"))
    )
  );
}
