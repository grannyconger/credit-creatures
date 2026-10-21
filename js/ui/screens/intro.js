// The opening story: three panels that tell students their job before they
// meet their creature (teacher request 2026-10-20: make the purpose clear).
import { h, fill } from "../dom.js";
import { icon } from "../icons.js";
import { creatureSvg } from "../creature-art.js";
import { INTRO_PANELS } from "../../data/story.js";
import { DREAMS } from "../../data/dreams.js";

const CRITTERS = [
  { species: "lanternFox", palette: "ember", accessories: { neck: "scarf" } },
  { species: "cloudBunny", palette: "frost", accessories: { head: "crown" } },
  { species: "shellTurtle", palette: "moss", accessories: { face: "glasses" } },
];

function art(scene) {
  if (scene === "kingdom") return h("div.intro-art", h("span.intro-castle", icon("castle", { size: 96 })), h("div.intro-row", CRITTERS.slice(0, 3).map((c) => h("span", { html: creatureSvg(c, { size: 90, label: "" }) }))));
  if (scene === "guardian") return h("div.intro-art", h("div.intro-row", h("span", { html: creatureSvg({ species: "lanternFox", palette: "rose", eyes: "sparkle", accessories: {} }, { size: 150, label: "" }) }), h("span.intro-coins", icon("coins", { size: 64 }))));
  return h("div.intro-art", h("div.intro-row.dreams", Object.values(DREAMS).map((d) => h("span.intro-dream", h("span", d.icon), h("small", d.title)))));
}

export function render(root, { advance, track }) {
  let k = 0;
  const panel = h("section.panel.intro");
  root.append(panel);
  const started = Date.now();

  const finish = async (skipped) => {
    track("intro", { skipped, panel: k + 1, seconds: Math.round((Date.now() - started) / 1000) });
    await advance("profile");
  };

  function paint() {
    const p = INTRO_PANELS[k];
    const last = k === INTRO_PANELS.length - 1;
    fill(
      panel,
      art(p.scene),
      h("p.step-label", `${k + 1} of ${INTRO_PANELS.length}`),
      h("h1", p.title),
      p.text.map((t) => h("p.intro-text", t)),
      h("div.dots", { "aria-hidden": "true" }, INTRO_PANELS.map((_, i) => h("span", { class: i === k ? "on" : "" }))),
      h(
        "div.row",
        k > 0 ? h("button.secondary", { type: "button", onclick: () => ((k -= 1), paint()) }, "Back") : h("button.link", { type: "button", onclick: () => finish(true) }, "Skip the story"),
        h("button.big", { type: "button", onclick: () => (last ? finish(false) : ((k += 1), paint())) }, last ? "Meet your creature" : "Next")
      )
    );
    panel.querySelector("button.big").focus();
  }
  paint();
}
