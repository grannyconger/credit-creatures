// The RED ALERT for going broke (GAME-SPECS.md 2.4, teacher decision 2026-10-25).
// A warning the first broke month, then the time travel back a chapter.
// broke: the { type, ... } from finishMonth. Resolves when the student closes it.
import { h, money } from "./dom.js";
import { icon } from "./icons.js";
import { CONFIG } from "../data/config.js";

export function brokeText(broke, name, chapter) {
  if (broke.type === "warning")
    return {
      title: "RED ALERT: You're broke",
      lines: [
        `${name}'s checking is below $0, and savings can't cover the ${money(broke.shortBy)} gap.`,
        `If ${name} is still broke at the end of next month, time travels back to the start of Chapter ${Math.max(CONFIG.broke.fromChapter, chapter - 1)}.`,
        `Every debt gets wiped and checking resets to ${money(CONFIG.broke.resetChecking)}. But your credit report gets a fresh-start mark that drags your score down for a long time.`,
      ],
      steps: ["Move money from savings into checking.", "Work a shift at the Arcade.", "Skip the wants this month and pay only what you must."],
    };
  return {
    title: "Time travel! A fresh start",
    lines: [
      `${name} stayed broke two months in a row, so the story jumps back to the start of Chapter ${broke.to}.`,
      broke.wiped > 0 ? `${money(broke.wiped)} of debt was wiped.` : "There was no debt to wipe.",
      `Checking is now ${money(broke.checking)}. Your XP, your creature and your things are all still yours.`,
      "Your credit report now shows a fresh-start mark. It hurts your score most right now and fades over time.",
    ],
    steps: [],
  };
}

export function showBrokeAlert(broke, { name = "Your creature", chapter = 2, track } = {}) {
  if (!broke || (broke.type !== "warning" && broke.type !== "reset")) return Promise.resolve();
  track?.("brokeAlert", { type: broke.type, chapter, to: broke.to ?? null, wiped: broke.wiped ?? null });
  const t = brokeText(broke, name, chapter);
  return new Promise((resolve) => {
    const ok = h("button.big", { type: "button" }, broke.type === "warning" ? "I'll fix it" : "Start over smarter");
    const dialog = h(
      "dialog.broke-alert.bst-scope",
      { role: "alertdialog", "aria-labelledby": "broke-title", class: broke.type },
      h("div.broke-siren", { "aria-hidden": "true" }, icon("alert", { size: 44 })),
      h("h2", { id: "broke-title" }, t.title),
      t.lines.map((l) => h("p", l)),
      t.steps.length ? h("div.broke-steps", h("strong", "How to get out of it:"), h("ul", t.steps.map((s) => h("li", s)))) : null,
      h("div.row", ok)
    );
    const close = () => {
      dialog.close();
      dialog.remove();
      resolve();
    };
    ok.addEventListener("click", close);
    dialog.addEventListener("cancel", (e) => (e.preventDefault(), close()));
    document.body.append(dialog);
    dialog.showModal();
    ok.focus();
  });
}
