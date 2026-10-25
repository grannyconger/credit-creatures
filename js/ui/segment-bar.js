// A stacked bar that shows what a total is made of, one color and one pattern per
// part (teacher request 2026-10-25: color instead of word descriptions in the
// Tradeoffs). The pattern means color is never the only cue, and the bar says its
// parts in words for screen readers and on hover. Used by the card Tradeoffs and the
// Vault Overview, with the parts from js/engine/balance.js.
import { h } from "./dom.js";
import { dollars } from "../engine/index.js";

export const SEGMENT_LABELS = { checking: "Checking", savings: "Savings", locked: "Locked savings", car: "Car", cards: "Credit cards", loans: "Loans", later: "Pay later", qol: "Quality of life" };

// parts: [{ key, amount }]. scale: the amount a full bar stands for, so bars
// side by side compare (leave it out for a bar that always fills).
export function segmentBar({ parts, scale = null, label = "", start = null, max = 100 }) {
  const shown = parts.filter((p) => p.amount > 0);
  const total = shown.reduce((s, p) => s + p.amount, 0);
  const width = scale ? Math.min(100, (total / scale) * 100) : 100;
  const words = shown.length ? shown.map((p) => `${SEGMENT_LABELS[p.key]} ${p.key === "qol" ? p.amount : dollars(p.amount)}`).join(", ") : "nothing";
  return h(
    "div.seg-bar",
    { role: "img", "aria-label": `${label}: ${words}`.replace(/^: /, ""), title: words },
    h("div.seg-fill", { style: { width: `${width}%` } }, shown.map((p) => h("span.seg", { class: `seg-${p.key}`, style: { flex: `${p.amount} 1 0` } }))),
    // A tick where the meter started, so a move is easy to see (Quality of Life).
    start != null ? h("span.seg-tick", { "aria-hidden": "true", style: { left: `${Math.max(0, Math.min(100, (start / max) * 100))}%` } }) : null
  );
}

// One legend for a whole panel: a swatch (with its pattern) and the word, for the parts shown.
export function segmentLegend(keys) {
  return h(
    "ul.seg-legend",
    { "aria-label": "What the colors mean" },
    keys.map((k) => h("li", h("span.seg-swatch", { class: `seg-${k}`, "aria-hidden": "true" }), SEGMENT_LABELS[k]))
  );
}
