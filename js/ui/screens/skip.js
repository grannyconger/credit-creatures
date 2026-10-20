// Time skip from the end of the tutorial to age 18.
import { h, money, ageLabel } from "../dom.js";
import { timeSkip } from "../../engine/index.js";
import { CONFIG } from "../../data/config.js";
import { creatureSvg } from "../creature-art.js";
import { monthSummary } from "../month-summary.js";

export function render(root, { game, advance, track, refreshWho }) {
  const target = CONFIG.onboarding.cardAgeMonths;
  const panel = h("section.panel");
  root.append(panel);

  if (game.ob.skip) return showSummary();

  const counter = h("div.big-number", ageLabel(game.life.ageMonths));
  const btn = h("button.big", { type: "button" }, "Skip ahead to age 18");
  panel.append(
    monthSummary(game.ob.lastEnd),
    h("p.step-label", "Chapter 1: growing up"),
    h("h1", "Fast forward"),
    h(
      "p",
      `${game.save.creature.name} keeps a part-time job and spends some of the pay each month. Let's skip ahead until the big day: turning 18 and applying for a first credit card.`
    ),
    h("div.skip-art", { html: creatureSvg(game.save.creature, { size: 160 }) }),
    counter,
    h("div.row.center", btn)
  );

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    const months = target - game.life.ageMonths;
    const startAge = game.life.ageMonths;
    const r = timeSkip(game.life, months);
    await animate(counter, startAge, target);
    game.life = r.life;
    game.ob.skip = { months, earned: r.earned, spent: r.spent, startScore: r.startScore, endScore: r.endScore, lastReason: r.scoreChanges.at(-1)?.message || "" };
    track("timeSkip", { months, earned: r.earned, spent: r.spent, score: r.endScore ?? -1, checking: r.life.checking });
    await game.persist("timeSkip");
    refreshWho();
    panel.replaceChildren();
    showSummary();
  });

  function showSummary() {
    const s = game.ob.skip;
    const scoreText =
      s.endScore == null
        ? "Still no score. Nothing has been reported yet, so there is no history to score."
        : s.startScore == null
          ? `You have a score now: ${s.endScore}.`
          : `Your score went from ${s.startScore} to ${s.endScore}.`;
    panel.append(
      h("p.step-label", "Chapter 1: age 18"),
      h("h1", `Happy 18th birthday, ${game.save.creature.name}! 🎂`),
      h(
        "div.stat-grid",
        stat("Months that went by", s.months),
        stat("Earned at work", money(s.earned)),
        stat("Spent", money(s.spent)),
        stat("In checking now", money(game.life.checking)),
        stat("Credit score", s.endScore ?? "None yet")
      ),
      h("div.callout", h("p", scoreText), s.endScore != null && s.lastReason ? h("p.note.tight", s.lastReason) : null),
      h("p", "At 18 you can apply for your own credit card. First, a quick lesson on who is behind a card."),
      h("div.row", h("button", { type: "button", onclick: () => advance("networks") }, "Next"))
    );
  }
}

function stat(label, value) {
  return h("div.stat", h("span.stat-value", String(value)), h("span.stat-label", label));
}

function animate(el, from, to) {
  return new Promise((resolve) => {
    const ms = 1800;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      el.textContent = ageLabel(Math.round(from + (to - from) * p));
      if (p < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}
