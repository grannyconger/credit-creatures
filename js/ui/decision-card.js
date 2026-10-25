// One life card or Decision card: the situation, the choices, the "Pay with"
// picker when a choice costs money, then the outcome with a 👍/😐/👎 reaction.
import { h, add, fill } from "./dom.js";
import { burstFrom } from "./motion/particles.js";
import { payWith, methodLabel } from "./pay-with.js";
import { sfx } from "./sound.js";
import { FACTOR_LABELS, compareChoices, allSame, startRow, dollars } from "../engine/index.js";
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
  // The coin balance is the first thing to weigh, so it sits big in the card's corner
  // and updates after the choice (teacher request 2026-10-23).
  const balance = h("div.dc-balance", { role: "status", "aria-label": `Coins in checking: ${dollars(life.checking)}` });
  const paintBalance = (amount, note = "") => balance.replaceChildren(icon("coins", { size: 30 }), h("span.dc-balance-text", h("small", note || "Coins in checking"), h("strong", dollars(amount))));
  paintBalance(life.checking);
  let lastMethod = null;
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
      ),
      balance
    ),
    h("div.dc-text", [].concat(def.text(life, ctx)).map((t) => h("p", t))),
    body
  );
  track(kind === "life" ? "lifeCardShown" : "cardShown", { id: def.id, choices: choices.length });

  // "If you pay with coins, you'd have $X left." Shown right on the choice so the
  // balance is part of weighing it.
  function afterLine(c) {
    const left = life.checking - c.cost.amount;
    return left >= 0
      ? h("small.dc-after", icon("coins", { size: 14 }), ` Pay with coins: you'd have ${dollars(left)} left`)
      : h("small.dc-after.short", icon("alert", { size: 14 }), ` You have ${dollars(life.checking)} in checking, ${dollars(-left)} short`);
  }

  // Tapping a choice only selects it. "Lock in my choice" makes it count
  // (bug fix 2026-10-22: a student scrolling on a touch screen picked an
  // answer by accident and it lowered her score).
  function showChoices(error = "") {
    card.classList.remove("is-outcome", "is-paying");
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
              b.querySelector(".pick-tag")?.remove();
              if (on) b.prepend(h("span.pick-tag", icon("check", { size: 14 }), " Your pick"));
            });
            submit.disabled = false;
          },
        },
        h("strong", c.label),
        c.detail ? h("small", c.detail) : null,
        c.cost ? h("small", "Choose how to pay next") : null,
        c.cost ? afterLine(c) : null,
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
      h("div.dc-choices", { role: "group", "aria-label": "Your choices", style: { "--cols": choices.length } }, buttons),
      h("div.dc-submit-row", h("small.dc-submit-hint", "Tap a choice, then lock it in."), submit),
      error ? h("p.error", { role: "alert" }, error) : null
    );
  }

  function pick(c) {
    if (!c.cost) return run(c, null);
    card.classList.add("is-paying");
    fill(body, payWith({ life, cost: c.cost, allowed: payAllowed, onPick: (method) => run(c, method), onBack: () => showChoices() }));
    body.querySelector("button.pay-option:not([disabled])")?.focus({ preventScroll: true });
  }

  async function run(c, method) {
    lastMethod = method;
    const r = await choose(c.key, method);
    const seconds = Math.round((Date.now() - shownAt) / 1000);
    track(kind === "life" ? "lifeCardChoice" : "cardChoice", { id: def.id, choice: c.key, method: method || "", ok: r.ok, seconds, quality: c.quality || "" });
    if (!r.ok) return showChoices(r.message);
    showOutcome(c, r);
  }

  // The outcome replaces the choices in place. The card keeps its shape and its
  // spot on the page, so nothing slides or flips under the student's eyes
  // (teacher request 2026-10-25: the flip made the screen feel like it moved).
  function showOutcome(c, r) {
    sfx.cardFlip();
    fillOutcome(c, r);
  }

  function fillOutcome(c, r) {
    card.classList.add("is-outcome");
    if (r.life) paintBalance(r.life.checking, "Coins in checking now");
    let reaction = "";
    let confusing = false;
    const factor = c.factor && !r.denied ? h("p.factor-chip", { class: c.factor.dir }, `${FACTOR_ICONS[c.factor.key]} ${FACTOR_LABELS[c.factor.key]} ${c.factor.dir === "up" ? "▲ goes up" : "▼ goes down"}`) : null;
    // Life cards ask one new question: did this make sense? (teacher request
    // 2026-10-23). It's recorded as clarity, apart from the old thumbs.
    let clarity = "";
    const reactRow =
      kind === "life"
        ? h(
            "div.reactions.clarity-row",
            { role: "group", "aria-label": "Did this card make sense?" },
            [
              ["clear", "Makes sense", "check"],
              ["confusing", "That was confusing", "info"],
            ].map(([key, label, ico]) =>
              h(
                "button.chip.clarity-btn",
                {
                  type: "button",
                  "data-clarity": key,
                  "aria-pressed": "false",
                  onclick: (e) => {
                    clarity = clarity === key ? "" : key;
                    confusing = clarity === "confusing";
                    reactRow.querySelectorAll(".clarity-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.clarity === clarity)));
                  },
                },
                icon(ico, { size: 16 }),
                ` ${label}`
              )
            )
          )
        : h(
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
      { type: "button", onclick: () => onContinue({ reaction, confusing, clarity }) },
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
        // A digital receipt for what was paid, like the one a phone shows after a tap to pay.
        c.cost && lastMethod && !r.denied ? h("p.dc-receipt", icon("receipt", { size: 16 }), h("span", ` Paid ${dollars(c.cost.amount)} with ${methodLabel(lastMethod, life)}`)) : null,
        // Quests earn XP.
        r.xp ? h("p.dc-xp", icon("star", { size: 16 }), h("span", ` +${r.xp} XP`)) : null,
        verdict && !r.denied ? h("p.dc-verdict", icon(verdict[0], { size: 16 }), h("span", verdict[1])) : null,
        r.message && !c.quiz ? h("p.note.tight", r.message) : null,
        factor
      ),
      c.math ? h("details.math", { open: true }, h("summary", "Show the math"), h("p", c.math)) : null,
      c.quiz ? null : tradeoffs(c),
      !r.denied && !c.quiz && factorCheck ? quickCheck(factorCheck(c)) : null,
      // Reactions and Continue stay in view at the bottom of the card, so moving on never needs a scroll.
      h("div.dc-footer", reactRow, h("div.row", cont))
    );
    cont.focus({ preventScroll: true });
  }

  // After locking in: every choice side by side, from the same starting point.
  function tradeoffs(chosen) {
    let rows;
    try {
      rows = compareChoices(life, choices, { chosenKey: chosen.key, chosenMethod: lastMethod, allowed: payAllowed });
    } catch {
      return null;
    }
    // One choice has nothing to sit beside, so it sits beside where you started.
    if (rows.filter((r) => r.ok).length < 2) rows = [startRow(life), ...rows];
    if (rows.filter((r) => r.ok && !r.start).every((r) => Object.values(r.delta).every((d) => !d) && !r.effect)) return null;
    return tradeoffPanel(rows, life);
  }

  showChoices();
  return card;
}

const money0 = (c) => dollars(c);
const signed = (d) => `${d > 0 ? "+" : d < 0 ? "−" : ""}${dollars(Math.abs(d))}`;

// Columns of bars, one per choice. Words say better or worse, never color alone.
function tradeoffPanel(rows, life) {
  const ok = rows.filter((r) => r.ok);
  const hasCards = ok.some((r) => r.metrics.util != null);
  const hasScore = ok.some((r) => r.metrics.score != null);
  const best = (key, low = false) => {
    const vals = ok.map((r) => r.metrics[key]).filter((v) => v != null);
    if (new Set(vals).size < 2) return null;
    return low ? Math.min(...vals) : Math.max(...vals);
  };
  const hasSavings = ok.some((r) => r.delta.savings);
  const BEST = { checking: best("checking"), savings: best("savings"), owed: best("owed", true), util: best("util", true), score: best("score") };
  const max = (key) => Math.max(1, ...ok.map((r) => Math.max(0, r.metrics[key] ?? 0)));
  const MAX = { checking: max("checking"), savings: max("savings"), owed: max("owed") };
  const row = (r, key, label, fmt, { low = false, pct = false } = {}) => {
    const v = r.metrics[key];
    if (v == null) return null;
    const width = pct ? Math.min(100, Math.round(v * 100)) : Math.round((Math.max(0, v) / MAX[key]) * 100);
    const d = r.delta[key];
    const isBest = BEST[key] != null && v === BEST[key];
    const dir = !d ? "same" : (d > 0) !== low ? "better" : "worse";
    return h(
      "div.trade-metric",
      h("small", label),
      h("strong", fmt(v)),
      h("div.trade-bar", { "aria-hidden": "true" }, h("span", { class: dir, style: { width: `${Math.max(width, v > 0 ? 3 : 0)}%` } })),
      h("small.trade-delta", { class: dir }, !d ? "No change" : `${key === "checking" || key === "owed" || key === "savings" ? signed(d) : key === "util" ? `${d > 0 ? "+" : "−"}${Math.abs(Math.round(d * 100))} points` : `${d > 0 ? "+" : "−"}${Math.abs(d)} points`} (${dir})`),
      isBest ? h("small.trade-best", icon("star", { size: 12 }), " Best of these") : null
    );
  };
  return h(
    "section.dc-tradeoffs",
    h("h3", icon("chart", { size: 22 }), " Tradeoffs"),
    h("p.muted.tight", "Here's where each choice leaves your numbers. Yours is outlined."),
    h(
      "div.trade-grid",
      { style: { "--cols": rows.length } },
      rows.map((r, i) =>
        h(
          "article.trade-col",
          { class: `col-${(i % 4) + 1} ${r.chosen ? "chosen" : ""} ${r.start ? "start" : ""} ${r.ok ? "" : "off"}` },
          h("header", r.chosen ? h("span.pick-tag", icon("check", { size: 14 }), " Your pick") : null, h("strong", r.label)),
          r.ok
            ? [
                row(r, "checking", "Coins in checking", money0),
                hasSavings ? row(r, "savings", "Coins in savings", money0) : null,
                row(r, "owed", "What you owe", money0, { low: true }),
                hasCards ? row(r, "util", "Credit used", (v) => `${Math.round(v * 100)}%`, { low: true, pct: true }) : null,
                hasScore ? row(r, "score", "Credit score", (v) => String(v)) : null,
                r.effect?.shiftsCut ? h("p.trade-effect", icon("calendar", { size: 14 }), ` ${r.effect.shiftsCut} fewer shift${r.effect.shiftsCut === 1 ? "" : "s"} this month`) : null,
                r.effect?.shiftBonus ? h("p.trade-effect", icon("coins", { size: 14 }), ` ${dollars(r.effect.shiftBonus)} more pay on every shift`) : null,
                r.denied ? h("p.trade-effect", icon("alert", { size: 14 }), " The lender would say no.") : null
              ]
            : h("p.trade-effect", icon("lock", { size: 14 }), ` ${r.reason || "Not possible right now."}`)
        )
      )
    )
  );
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
        onclick: async (e) => {
          const correct = i === fc.answer;
          if (correct) burstFrom(e.currentTarget, "motes");
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
