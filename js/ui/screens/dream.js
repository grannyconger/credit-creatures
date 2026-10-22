// Pick your creature's dream (teacher request 2026-10-20). Savings, a good
// credit score and good habits make it possible. Shown after the creature is
// made, and from the Cottage to change it.
// A page of the Mossy Bestiary (2026-10-21): each dream is a seed packet
// hung on a string line, because a dream grows in 3 stages. Picking one
// stamps it PLANTED before the page moves on.
import { h, money } from "../dom.js";
import { icon } from "../icons.js";
import { creatureSvg } from "../creature-art.js";
import { pegSvg, lineSvg, fernSvg, mossSvg, inkStampSvg } from "../bestiary-art.js";
import { DREAMS, dreamSummary } from "../../data/dreams.js";

const reduced = () => document.documentElement.dataset.motion === "calm" || globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function render(root, { game, advance, editing, go, track }) {
  const c = game.save.creature;
  const back = () => go(game.step === "hub" ? "cottage" : game.step);
  let busy = false;

  const pick = async (id, packet) => {
    if (busy) return;
    busy = true;
    c.dream = id;
    if (game.save.play) {
      game.save.play.dreamDone = null;
      game.save.play.dreamStage = 0;
    }
    track("dreamChosen", { dream: id, editing });
    for (const b of packets.querySelectorAll(".bst-packet")) b.setAttribute("aria-pressed", String(b === packet));
    packet.querySelector(".bst-stamp-slot").innerHTML = inkStampSvg("PLANTED", { seed: 9 });
    packet.classList.add("bst-stamped");
    if (!reduced()) await new Promise((r) => setTimeout(r, 850));
    if (editing) {
      await game.persist("dream");
      back();
    } else {
      await advance("join");
    }
  };

  const packets = h(
    "ul.bst-packets",
    { "aria-label": "Dreams to choose from" },
    Object.entries(DREAMS).map(([id, d], i) => {
      const sum = dreamSummary(d);
      const packet = h(
        "button.bst-packet",
        {
          type: "button",
          "aria-pressed": String(c.dream === id),
          "data-dream": id,
          "data-sound": "none",
          style: `--i: ${i}; --dr: var(--dr-${id})`,
          onclick: (e) => pick(id, e.currentTarget),
        },
        h("span.bst-packet-flap", { "aria-hidden": "true" }),
        h("span.bst-packet-icon", icon(d.mark || "dream", { size: 44 })),
        h("strong.bst-packet-title", d.title),
        h("span.bst-packet-story", d.story),
        h(
          "span.bst-packet-needs",
          h("span", icon("piggy", { size: 16 }), ` Save ${money(sum.savings)}`),
          h("span", icon("gauge", { size: 16 }), ` Score ${sum.score}+`)
        ),
        h("span.bst-packet-grows", "Grows in 3 stages:"),
        h("ol.bst-packet-stages", d.stages.map((st) => h("li", st.title))),
        h("span.bst-packet-why", d.why),
        h("span.bst-stamp-slot", { "aria-hidden": "true" })
      );
      return h("li", { style: `--i: ${i}` }, h("span.bst-peg-wrap", { html: pegSvg() }), packet);
    })
  );

  const restart = editing && (game.save.play?.dreamStage || 0) > 0;
  root.append(
    h(
      "div.bestiary.bst-dream",
      h("div.bst-decor", { "aria-hidden": "true" },
        h("span.bst-fern-left", { html: fernSvg({ seed: 5, curl: 0.36, width: 140, height: 260 }) }),
        h("span.bst-fern-right", { html: fernSvg({ seed: 13, curl: -0.28, leaves: 11, width: 120, height: 230 }) })
      ),
      h(
        "section.bst-sheet",
        { "aria-labelledby": "bst-dream-title" },
        h("span.bst-moss-corner", { "aria-hidden": "true", html: mossSvg({ seed: 12, width: 320, height: 46 }) }),
        h(
          "header.bst-dream-head",
          h(
            "figure.bst-dream-portrait",
            { "aria-hidden": "true" },
            h("span.bst-dream-art", { html: creatureSvg(c, { size: 150, label: "", ageMonths: game.life?.ageMonths || 0 }) }),
            h("figcaption.bst-margin", `${c.name} has been thinking about this since breakfast.`)
          ),
          h(
            "div.bst-dream-words",
            h("h1", { id: "bst-dream-title" }, editing ? `A new dream for ${c.name}?` : `What does ${c.name} dream of?`),
            h(
              "p.bst-lede",
              "Every creature in Coinhaven has a dream. Your money choices decide whether it comes true. Each dream grows in 3 stages. It takes savings, a good credit score, good habits, work and learning."
            ),
            restart ? h("p.bst-warning", icon("alert", { size: 18 }), h("span", "Picking a different dream starts it over at stage 1. The old one will understand.")) : null
          )
        ),
        h("div.bst-line-wrap", { "aria-hidden": "true", html: lineSvg() }),
        packets,
        editing ? h("div.bst-dream-foot", h("button.bst-link", { type: "button", onclick: back }, "Keep my dream")) : null
      )
    )
  );
}
