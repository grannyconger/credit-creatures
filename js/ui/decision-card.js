// One life card or Decision card: the situation, the choices, the "Pay with"
// picker when a choice costs money, then the outcome with a 👍/😐/👎 reaction.
import { h, add, fill } from "./dom.js";
import { payWith } from "./pay-with.js";
import { sfx } from "./sound.js";
import { FACTOR_LABELS } from "../engine/index.js";
import { GROUP_LABELS } from "../data/scenarios.js";
import { icon } from "./icons.js";
import { sealSvg } from "./bestiary-art.js";

// The naturalist's aside after a good or a bad choice, so the result is
// never shown by color alone. Gentle, never shaming.
const VERDICT = {
  good: ["check", "Nicely done. Your creature looks quietly impressed."],
  bad: ["alert", "That one stung a little. Creatures bounce back, and so do scores."],
};

const FACTOR_ICONS = { payment: "⏰", owed: "📊", length: "🌳", mix: "🧩", newCredit: "🆕" };
const REACTIONS = [
  ["up", "👍", "I liked this card"],
  ["meh", "😐", "This card was okay"],
  ["down", "👎", "I didn't like this card"],
];

// choose(key, method) runs the choice and returns play.choose's result.
// onContinue({ reaction, confusing }) moves on.
// factorCheck(choice) returns an optional Factor Check (SPEC §11) or null.
// payAllowed: the ways to pay unlocked so far (js/progression.js payMethods).
export function decisionCard({ def, kind, life, ctx, choices, choose, onContinue, track, factorCheck, payAllowed = null }) {
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
        h("h2", { id: `dc-${def.id}` }, def.title),
        h("p.dc-kind", kind === "life" ? "Life card" : `Decision card · ${GROUP_LABELS[def.group]}`)
      )
    ),
    h("div.dc-text", [].concat(def.text(life, ctx)).map((t) => h("p", t))),
    body
  );
  track(kind === "life" ? "lifeCardShown" : "cardShown", { id: def.id, choices: choices.length });

  // Tapping a choice only selects it. "Lock in my choice" makes it count
  // (bug fix 2026-10-22: a student scrolling on a touch screen picked an
  // answer by accident and it lowered her score).
  function showChoices(error = "") {
    let selected = null;
    const submit = h("button.dc-submit", { type: "button", disabled: true }, "Lock in my choice");
    const buttons = choices.map((c) =>
      h(
        "button.dc-choice",
        {
          type: "button",
          "data-sound": "none",
          "aria-pressed": "false",
          disabled: Boolean(c.disabled),
          onclick: (e) => {
            selected = c;
            buttons.forEach((b) => {
              const on = b === e.currentTarget;
              b.setAttribute("aria-pressed", String(on));
              b.querySelector(".dc-chosen")?.remove();
              if (on) b.append(h("small.dc-chosen", "Chosen"));
            });
            submit.disabled = false;
          },
        },
        h("strong", c.label),
        c.detail ? h("small", c.detail) : null,
        c.cost ? h("small", "Choose how to pay next") : null,
        c.disabled ? h("small.error-text", c.disabled) : null
      )
    );
    submit.addEventListener("click", () => {
      if (!selected || submit.disabled) return;
      submit.disabled = true;
      buttons.forEach((b) => (b.disabled = true));
      pick(selected);
    });
    fill(
      body,
      h("div.dc-choices", { role: "group", "aria-label": "Your choices" }, buttons),
      h("div.dc-submit-row", h("small.dc-submit-hint", "Tap a choice, then lock it in."), submit),
      error ? h("p.error", { role: "alert" }, error) : null
    );
  }

  function pick(c) {
    if (!c.cost) return run(c, null);
    fill(body, payWith({ life, cost: c.cost, allowed: payAllowed, onPick: (method) => run(c, method), onBack: () => showChoices() }));
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
    sfx.cardFlip();
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
    const cont = h(
      "button.big.bst-seal-btn",
      { type: "button", onclick: () => onContinue({ reaction, confusing }) },
      h("span.bst-seal-wax", { html: sealSvg({ seed: 31, size: 72 }) }),
      h("span.bst-seal-text", "Continue")
    );
    const verdict = VERDICT[c.quality];
    fill(
      body,
      h(
        "div.callout.dc-outcome",
        { class: c.quality === "bad" ? "bad" : c.quality === "good" ? "good" : "", role: "status" },
        h("p", h("strong", c.label)),
        r.outcome ? h("p", r.outcome) : null,
        verdict && !r.denied ? h("p.dc-verdict", icon(verdict[0], { size: 16 }), h("span", verdict[1])) : null,
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
