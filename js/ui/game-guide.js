// The guide for a side quest (docs/MINIGAMES.md): three tabs, How to play,
// Vocab and IRL. Vocab words in the steps show a tooltip on hover and on
// keyboard focus. Opening it and changing tabs are logged.
import { h } from "./dom.js";
import { icon } from "./icons.js";
import { GUIDES } from "../data/guides.js";
import { JOBS } from "../data/minigames.js";

export const hasGuide = (key) => Boolean(GUIDES[key]);

// "A [[fee]] is money" becomes text with a focusable vocab word.
function withTerms(text, vocab) {
  const by = Object.fromEntries(vocab.map((v) => [v.term.toLowerCase(), v]));
  return text.split(/(\[\[.*?\]\])/).map((part) => {
    const m = part.match(/^\[\[(.*)\]\]$/);
    if (!m) return part;
    const v = by[m[1].toLowerCase()];
    return h("span.vocab-term", { tabindex: "0", "data-def": v ? v.def : "", "aria-label": v ? `${m[1]}: ${v.def}` : m[1] }, m[1]);
  });
}

export function openGameGuide(key, { track, tab = "how" } = {}) {
  const g = GUIDES[key];
  if (!g) return null;
  track?.("guideOpen", { game: key });
  const dialog = h("dialog.game-guide.bst-scope", { "aria-labelledby": "guide-title" });
  const close = () => {
    dialog.close();
    dialog.remove();
  };
  const body = h("div.guide-body");
  const TABS = [
    ["how", "How to play"],
    ["vocab", "Vocab"],
    ["irl", "IRL"],
  ];
  const panels = {
    how: () => [
      h("p.guide-goal", h("strong", "Goal: "), g.how.goal),
      h("ol.guide-steps", g.how.steps.map((s) => h("li", withTerms(s, g.vocab)))),
      h("p.guide-example", h("strong", "Example: "), g.how.example),
    ],
    vocab: () => [h("dl.guide-vocab", g.vocab.map((v) => [h("dt", v.term), h("dd", v.def, h("small", ` Example: ${v.example}`))]))],
    irl: () => [
      h("p.muted", g.irl.intro),
      h("ul.guide-facts", g.irl.facts.map((f) => h("li", f.stat, h("small", h("a", { href: f.url, target: "_blank", rel: "noopener noreferrer" }, `${f.source}, ${f.year}`))))),
      h("p.guide-checked", `Stats checked against their sources on ${g.irl.checked}.`),
    ],
  };
  const tabs = h("div.guide-tabs", { role: "tablist", "aria-label": "Guide" });
  const show = (id, logIt = true) => {
    tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === id)));
    body.replaceChildren(...panels[id]());
    if (logIt) track?.("guideTab", { game: key, tab: id });
  };
  for (const [id, label] of TABS) tabs.append(h("button", { type: "button", role: "tab", "data-tab": id, onclick: () => show(id) }, label));
  dialog.append(
    h("div.guide-head", h("h2", { id: "guide-title" }, icon(JOBS[key].mark || "scroll", { size: 24 }), ` ${JOBS[key].title}`), h("button.small.secondary", { type: "button", onclick: close }, "Close")),
    tabs,
    body
  );
  dialog.addEventListener("cancel", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  document.body.append(dialog);
  show(tab, false);
  dialog.showModal();
  return dialog;
}
