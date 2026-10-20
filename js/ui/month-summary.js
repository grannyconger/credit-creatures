// "Month N is over" card from the events End Month returned.
import { h } from "./dom.js";

const ICONS = {
  fee: "💸",
  paymentReceived: "✅",
  statement: "🧾",
  reported: "📨",
  scoreChange: "📈",
  bill: "🧾",
  late: "⏰",
  collections: "🚨",
};

// Keeps only what the screen needs, small enough to save.
export function monthRecord(month, result) {
  return {
    month,
    score: result.life.score,
    delta: result.scoreChange.delta,
    events: result.events.map((e) => ({ type: e.type, message: e.message })),
  };
}

export function monthSummary(record) {
  if (!record) return "";
  return h(
    "div.callout.month-summary",
    h("h3", `Month ${record.month + 1} is over`),
    h(
      "ul.event-list",
      record.events.map((e) => h("li", h("span.event-icon", e.type === "scoreChange" && record.delta < 0 ? "📉" : ICONS[e.type] || "•"), e.message))
    )
  );
}
