// One life card or Decision card: the situation, the choices, the "Pay with"
// picker when a choice costs money, then the outcome with a 👍/😐/👎 reaction.
import { h, add, fill } from "./dom.js";
import { payWith } from "./pay-with.js";
import { sound } from "./sound.js";
import { FACTOR_LABELS } from "../engine/index.js";
import { GROUP_LABELS } from "../data/scenarios.js";

const FACTOR_ICONS = { payment: "⏰", owed: "📊", length: "🌳", mix: "🧩", newCredit: "🆕" };
const REACTIONS = [
  ["up", "👍", "I liked this card"],
  ["meh", "😐", "This card was okay"],
  ["down", "👎", "I didn't like this card"],
];

// choose(key, method) runs the choice and returns play.choose's result.
// onContinue({ reaction, confusing }) moves on.
// factorCheck(choice) returns an optional Factor Check (SPEC §11) or null.
export function decisionCard({ def, kind, life, ctx, choices, choose, onContinue, track, factorCheck }) {
  const shownAt = Date.now();
  const body = h("div.dc-body");
  const card = h(
    "article.decision-card",
    { class: kind === "life" ? "life-card" : "", "aria-labelledby": `dc-${def.id}` },
    h(
      "header.dc-head",
      h("span.dc-icon", { "aria-hidden": "true" }, def.icon),
      h(
        "div",
        h("p.dc-kind", kind === "life" ? "Life card" : `Decision card · ${GROUP_LABELS[def.group]}`),
        h("h2", { id: `dc-${def.id}` }, def.title)
      )
    ),
    h("div.dc-text", [].concat(def.text(life, ctx)).map((t) => h("p", t))),
    body
  );
  track(kind === "life" ? "lifeCardShown" : "cardShown", { id: def.id, choices: choices.length });

  function showChoices(error = "") {
    fill(
      body,
      h(
        "div.dc-choices",
        choices.map((c) =>
          h(
            "button.dc-choice",
            { type: "button", "data-sound": "none", disabled: Boolean(c.disabled), onclick: () => pick(c) },
            h("strong", c.label),
            c.detail ? h("small", c.detail) : null,
            c.cost ? h("small", "Choose how to pay next") : null,
            c.disabled ? h("small.error-text", c.disabled) : null
          )
        )
      ),
      error ? h("p.error", { role: "alert" }, error) : null
    );
  }

  function pick(c) {
    if (!c.cost) return run(c, null);
    fill(body, payWith({ life, cost: c.cost, onPick: (method) => run(c, method), onBack: () => showChoices() }));
    body.querySelector("button.pay-option:not([disabled])")?.focus();
  }

  async function run(c, method) {
    const r = await choose(c.key, method);
    const seconds = Math.round((Date.now() - shownAt) / 1000);
    track(kind === "life" ? "lifeCardChoice" : "cardChoice", { id: def.id, choice: c.key, method: method || "", ok: r.ok, seconds, quality: c.quality || "" });
    if (!r.ok) return showChoices(r.message);
    showOutcome(c, r);
  }

  // The card flips over to its outcome (visual plan item 7).
  function showOutcome(c, r) {
    const still = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (still || !card.isConnected) return fillOutcome(c, r);
    sound("flip");
    card.classList.add("flip-out");
    setTimeout(() => {
      fillOutcome(c, r);
      card.classList.remove("flip-out");
      card.classList.add("flip-in");
      setTimeout(() => card.classList.remove("flip-in"), 260);
    }, 230);
  }

  function fillOutcome(c, r) {
    let reaction = "";
    let confusing = false;
    const factor = c.factor && !r.denied ? h("p.factor-chip", { class: c.factor.dir }, `${FACTOR_ICONS[c.factor.key]} ${FACTOR_LABELS[c.factor.key]} ${c.factor.dir === "up" ? "▲ goes up" : "▼ goes down"}`) : null;
    const reactRow = h(
      "div.reactions",
      { role: "group", "aria-label": "How was this card?" },
      REACTIONS.map(([key, emoji, label]) =>
        h(
          "button.reaction",
          {
            type: "button",
            "aria-label": label,
            "aria-pressed": "false",
            onclick: (e) => {
              reaction = key;
              reactRow.querySelectorAll(".reaction").forEach((b) => b.setAttribute("aria-pressed", String(b === e.currentTarget)));
            },
          },
          emoji
        )
      ),
      h(
        "button.chip.confusing",
        {
          type: "button",
          "aria-pressed": "false",
          onclick: (e) => {
            confusing = !confusing;
            e.currentTarget.setAttribute("aria-pressed", String(confusing));
          },
        },
        "This was confusing"
      )
    );
    const cont = h("button.big", { type: "button", onclick: () => onContinue({ reaction, confusing }) }, "Continue");
    fill(
      body,
      h(
        "div.callout.dc-outcome",
        { class: c.quality === "bad" ? "bad" : c.quality === "good" ? "good" : "", role: "status" },
        h("p", h("strong", c.label)),
        r.outcome ? h("p", r.outcome) : null,
        r.message && !c.quiz ? h("p.note.tight", r.message) : null,
        factor
      ),
      c.math ? h("details.math", { open: true }, h("summary", "Show the math"), h("p", c.math)) : null,
      !r.denied && !c.quiz && factorCheck ? quickCheck(factorCheck(c)) : null,
      reactRow,
      h("div.row", cont)
    );
    cont.focus();
  }

  showChoices();
  return card;
}

// Optional one-question Factor Check after a decision (SPEC §11).
function quickCheck(fc) {
  if (!fc) return null;
  const box = h("div.quick-check");
  const buttons = fc.choices.map((c, i) =>
    h(
      "button.chip",
      {
        type: "button",
        onclick: async () => {
          const correct = i === fc.answer;
          buttons.forEach((b, j) => {
            b.disabled = true;
            if (j === fc.answer) b.classList.add("right");
            else if (j === i) b.classList.add("wrong");
          });
          const got = await fc.onAnswer(correct);
          add(box, h("p", { role: "status" }, correct ? `Right! ${got ? "+1 ✨ Sparkle Point" : ""}` : `Not quite. It's ${fc.explain}.`));
        },
      },
      c
    )
  );
  return add(box, h("p", h("strong", "🧠 Quick check (optional): "), "Which part of your score moves, and which way?"), h("div.chip-group", buttons));
}
