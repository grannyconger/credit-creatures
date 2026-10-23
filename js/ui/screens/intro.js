// The opening story: three panels that tell students their job before they
// meet their creature (teacher request 2026-10-20: make the purpose clear).
// A page of the Mossy Bestiary (2026-10-23): the field guide's preface. Each
// panel is a leaf with a picture plate taped in at its edge, and Next turns
// the page.
import { h, fill } from "../dom.js";
import { icon } from "../icons.js";
import { creatureSvg } from "../creature-art.js";
import { sealSvg, tapeSvg, fernSvg, mossSvg, inkRingSvg } from "../bestiary-art.js";
import { INTRO_PANELS } from "../../data/story.js";
import { DREAMS } from "../../data/dreams.js";

const CRITTERS = [
  { species: "lanternFox", palette: "ember", accessories: { neck: "scarf" } },
  { species: "cloudBunny", palette: "frost", accessories: { head: "crown" } },
  { species: "shellTurtle", palette: "moss", accessories: { face: "glasses" } },
];

function art(scene) {
  if (scene === "kingdom")
    return h(
      "div.bst-pref-art.is-kingdom",
      h("span.bst-pref-castle", icon("castle", { size: 96 })),
      h("div.bst-pref-row", CRITTERS.map((c) => h("span", { html: creatureSvg(c, { size: 92, label: "" }) }))),
      h("span.bst-pref-moss", { html: mossSvg({ seed: 71, width: 340, height: 40 }) })
    );
  if (scene === "guardian")
    return h(
      "div.bst-pref-art.is-guardian",
      h("span.bst-pref-fox", { html: creatureSvg({ species: "lanternFox", palette: "rose", eyes: "sparkle", accessories: {} }, { size: 180, label: "" }) }),
      h("span.bst-pref-coins", icon("coins", { size: 56 })),
      h("span.bst-pref-moss", { html: mossSvg({ seed: 73, width: 340, height: 40 }) })
    );
  return h(
    "ul.bst-pref-art.is-dreams",
    Object.entries(DREAMS).map(([id, d]) => h("li", { style: `--dr: var(--dr-${id})` }, icon(d.mark || "dream", { size: 40 }), h("span", d.title)))
  );
}

export function render(root, { advance, track }) {
  let k = 0;
  const page = h("div.bst-pref-page");
  root.append(
    h(
      "div.bestiary.bst-preface",
      h("div.bst-decor", { "aria-hidden": "true" },
        h("span.bst-fern-left", { html: fernSvg({ seed: 81, curl: 0.38, width: 150, height: 280 }) }),
        h("span.bst-fern-right", { html: fernSvg({ seed: 87, curl: -0.3, leaves: 11, width: 130, height: 240 }) })
      ),
      page
    )
  );
  const started = Date.now();

  const finish = async () => {
    track("intro", { panel: k + 1, seconds: Math.round((Date.now() - started) / 1000) });
    await advance("profile");
  };

  function paint(dir = 1) {
    const p = INTRO_PANELS[k];
    const last = k === INTRO_PANELS.length - 1;
    const forward = last
      ? h("button.bst-seal-btn", { type: "button", onclick: finish }, h("span.bst-seal-wax", { html: sealSvg({ seed: 43, size: 84, letter: "C" }) }), h("span.bst-seal-text", "Meet your creature"))
      : h("button", { type: "button", onclick: () => ((k += 1), paint(1)) }, "Turn the page");
    // A fresh leaf each time, so the page-turn plays again.
    fill(
      page,
      h(
        "article.bst-leaf",
        { class: dir < 0 ? "back" : null, "aria-labelledby": "bst-pref-title" },
        h(
          "figure.bst-pref-plate",
          { "aria-hidden": "true" },
          h("span.bst-pref-tape.one", { html: tapeSvg(k * 3 + 1) }),
          h("span.bst-pref-tape.two", { html: tapeSvg(k * 3 + 2) }),
          h("div.bst-pref-frame", art(p.scene)),
          h("figcaption", p.plate)
        ),
        h(
          "div.bst-pref-words",
          h("h1", { id: "bst-pref-title" }, p.title),
          // One beat per line, appearing one after another.
          h(
            "ul.bst-pref-beats",
            p.beats.map((b, i) =>
              h(
                "li",
                { style: `--i: ${i}` },
                h("span.bst-pref-mark", { "aria-hidden": "true" }, h("span.bst-pref-ring", { html: inkRingSvg(k * 5 + i) }), icon(b.mark, { size: 24 })),
                h("div", h("p", b.text), b.chips ? h("ul.bst-pref-tags", b.chips.map((c) => h("li", c))) : null)
              )
            )
          ),
          h("p.bst-margin.bst-pref-note", p.note),
          h(
            "div.bst-pref-foot",
            h("p.bst-folio", `Page ${k + 1} of ${INTRO_PANELS.length}`),
            h(
              "div.bst-actions",
              // No skipping (teacher request 2026-10-21): every student reads the story.
              k > 0 ? h("button.secondary", { type: "button", onclick: () => ((k -= 1), paint(-1)) }, "Back") : null,
              forward
            )
          )
        )
      )
    );
    forward.focus({ preventScroll: true });
  }
  paint();
}
