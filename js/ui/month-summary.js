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

export { monthRecord } from "../play.js";

export function monthSummary(record, title = null) {
  if (!record) return "";
  return h(
    "div.callout.month-summary",
    h("h3", title || `Month ${record.month + 1} is over`),
    h(
      "ul.event-list",
      record.events.map((e) => h("li", h("span.event-icon", e.type === "scoreChange" && record.delta < 0 ? "📉" : ICONS[e.type] || "•"), e.message))
    )
  );
}
