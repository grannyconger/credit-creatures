// Lesson moment: lenders vs payment networks (SPEC §7), 3 screens and a quick check.
// Phase 10: the first step of applying for a card at the Vault (route cardIntro).
// A page of the Mossy Bestiary (2026-10-26): a bank leaflet pinned on the moss,
// one fold at a time, with a drawn icon in an ink ring and the fold count in
// words. The quick check is a tick-the-box question, and Design your card is
// a wax seal.
import { h, fill } from "../dom.js";
import { icon } from "../icons.js";
import { pinSvg, sealSvg } from "../bestiary-art.js";
import { NETWORK_SLIDES, NETWORK_QUIZ } from "../../data/onboarding.js";

export function render(root, { go, track }) {
  const sheet = h("section.panel.ci-sheet");
  root.append(h("div.bestiary.bst-cardapp.bst-cardintro", sheet));
  const started = Date.now();
  let k = 0;

  const head = () => [h("span.bst-attach", { "aria-hidden": "true", html: pinSvg() }), h("p.ci-kicker", "The Vault, before you apply: who is behind a card")];

  function show() {
    if (k === NETWORK_SLIDES.length) return quiz();
    const s = NETWORK_SLIDES[k];
    fill(
      sheet,
      ...head(),
      h("div.ci-mark", { "aria-hidden": "true" }, icon(s.mark || "card", { size: 44 })),
      h("h1", s.title),
      h("div.ci-body", s.body.map((p) => h("p", p))),
      h("p.ci-count", `Page ${k + 1} of ${NETWORK_SLIDES.length}`),
      h(
        "div.ci-actions",
        k > 0 ? h("button.secondary", { type: "button", onclick: () => (k--, show()) }, icon("back", { size: 16 }), " Back") : h("span"),
        h("button", { type: "button", onclick: () => (k++, show()) }, k === NETWORK_SLIDES.length - 1 ? "Take the quick check " : "Next ", icon("next", { size: 16 }))
      )
    );
    sheet.querySelector(".ci-actions button:last-child").focus();
  }

  function quiz() {
    const q = NETWORK_QUIZ;
    const asked = Date.now();
    const out = h("div.ci-out", { "aria-live": "polite" });
    const buttons = q.options.map((o, i) =>
      h(
        "button.ci-option",
        {
          type: "button",
          onclick: () => {
            buttons.forEach((b) => (b.disabled = true));
            buttons[i].classList.add("picked", o.correct ? "right" : "wrong");
            buttons[i].append(h("small.ci-verdict", o.correct ? "✓ Right" : "✗ Not this one"));
            track("question", { id: "networkQuiz", right: o.correct, seconds: Math.round((Date.now() - asked) / 1000) });
            fill(
              out,
              h("p.ci-answer", { class: o.correct ? "good" : "bad" }, o.correct ? q.right : q.wrong),
              h(
                "div.bst-actions",
                h(
                  "button.bst-seal-btn",
                  {
                    type: "button",
                    onclick: () => {
                      track("networkLesson", { seconds: Math.round((Date.now() - started) / 1000) });
                      go("cardDesign");
                    },
                  },
                  h("span.bst-seal-wax", { html: sealSvg({ seed: 52, size: 76 }) }),
                  h("span.bst-seal-text", "Design your card")
                )
              )
            );
            out.querySelector("button").focus();
          },
        },
        h("span.ci-box", { "aria-hidden": "true" }),
        h("strong", o.text)
      )
    );
    fill(sheet, ...head(), h("div.ci-mark", { "aria-hidden": "true" }, icon("search", { size: 44 })), h("h1", "Quick check"), h("p.ci-question", q.question), h("div.ci-options", buttons), out);
  }

  show();
}
