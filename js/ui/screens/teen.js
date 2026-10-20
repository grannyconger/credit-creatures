// Age 16 options (SPEC §6): a parent's card, a teen debit card, or both.
import { h } from "../dom.js";
import { createLife, joinAsAuthorizedUser, getTeenDebitCard } from "../../engine/index.js";
import { CONFIG } from "../../data/config.js";
import { TEEN_OPTIONS } from "../../data/onboarding.js";
import { creatureSvg } from "../creature-art.js";

export function render(root, { game, advance, track }) {
  const picked = { parentCard: false, teenDebit: false };
  const btn = h("button", { type: "button", disabled: true }, "Start the tutorial");

  const cards = Object.entries(TEEN_OPTIONS).map(([key, o]) => {
    const card = h(
      "button.option",
      { type: "button", "aria-pressed": "false" },
      h("span.option-icon", o.icon),
      h("strong", o.title),
      h("span", o.text),
      h("span.option-catch", o.catch),
      h("span.option-check", "✓ Picked")
    );
    card.addEventListener("click", () => {
      picked[key] = !picked[key];
      card.setAttribute("aria-pressed", String(picked[key]));
      btn.disabled = !picked.parentCard && !picked.teenDebit;
    });
    return card;
  });

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    let life = createLife({ seed, name: game.save.creature.name, ageMonths: CONFIG.onboarding.startAgeMonths });
    if (picked.parentCard) life = joinAsAuthorizedUser(life).life;
    if (picked.teenDebit) life = getTeenDebitCard(life).life;
    game.life = life;
    game.ob.teen = { ...picked };
    track("teenOptions", picked);
    await advance("tutorial");
  });

  root.append(
    h(
      "section.panel",
      h(
        "div.hero",
        h("div.hero-art", { html: creatureSvg(game.save.creature, { size: 140 }) }),
        h(
          "div",
          h("p.step-label", "Chapter 1: age 16"),
          h("h1", `${game.save.creature.name} just turned 16`),
          h("p", "Before you can get your own credit card at 18, you can start with one or both of these. Pick at least one.")
        )
      ),
      h("div.option-row", cards),
      h("div.row", btn)
    )
  );
}
