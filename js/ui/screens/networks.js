// Lesson moment: lenders vs payment networks (SPEC §7), 3 screens and a quick check.
// Phase 10: the first step of applying for a card at the Vault (route cardIntro).
import { h, add, clear } from "../dom.js";
import { NETWORK_SLIDES, NETWORK_QUIZ } from "../../data/onboarding.js";

export function render(root, { go, track }) {
  const panel = h("section.panel.narrow");
  root.append(panel);
  const started = Date.now();
  let k = 0;

  function show() {
    clear(panel);
    panel.append(h("p.step-label", "Before you apply: who is behind a card"));
    if (k === NETWORK_SLIDES.length) return quiz();
    const s = NETWORK_SLIDES[k];
    add(
      panel,
      h("div.slide-icon", s.icon),
      h("h1", s.title),
      s.body.map((p) => h("p", p)),
      h("div.dots", NETWORK_SLIDES.map((_, i) => h("span", { class: i === k ? "on" : "" }))),
      h(
        "div.row",
        k > 0 ? h("button.secondary", { type: "button", onclick: () => (k--, show()) }, "Back") : null,
        h("button", { type: "button", onclick: () => (k++, show()) }, "Next")
      )
    );
  }

  function quiz() {
    const q = NETWORK_QUIZ;
    const asked = Date.now();
    const out = h("div");
    const buttons = q.options.map((o) =>
      h(
        "button.big",
        {
          type: "button",
          onclick: () => {
            buttons.forEach((b) => (b.disabled = true));
            track("question", { id: "networkQuiz", right: o.correct, seconds: Math.round((Date.now() - asked) / 1000) });
            out.replaceChildren(
              h("div.callout", { class: o.correct ? "good" : "bad" }, o.correct ? q.right : q.wrong),
              h(
                "div.row",
                h(
                  "button",
                  {
                    type: "button",
                    onclick: () => {
                      track("networkLesson", { seconds: Math.round((Date.now() - started) / 1000) });
                      go("cardDesign");
                    },
                  },
                  "Design your card"
                )
              )
            );
          },
        },
        o.text
      )
    );
    panel.append(h("h1", "Quick check"), h("p", q.question), h("div.row.center", buttons), out);
  }

  show();
}
