// The same header on every place in the kingdom: where you are, what it's for,
// and the way back to the map (teacher request 2026-10-22: the map has its own
// page now, and Home is in the top bar).
import { h } from "./dom.js";
import { icon } from "./icons.js";

// The kicker sits under the title as a note, never above it as an eyebrow
// (Mossy Bestiary rules, 2026-10-22).

export function placeHeader({ go, iconName, kicker = "Coinhaven", title, subtitle = "", practice = false }) {
  return h(
    "div.place-header-wrap",
    practice ? h("p.callout.warn.practice", "Practice mode. Nothing you do here is saved.") : null,
    h(
      "header.place-header",
      h("button.back-home", { type: "button", onclick: () => go("map") }, icon("back", { size: 18 }), " Back to the map"),
      h("div.place-title", h("span.place-icon", icon(iconName, { size: 30 })), h("div", h("h1", title), h("p.step-label.place-kicker", kicker), subtitle ? h("p.muted.tight", subtitle) : null))
    )
  );
}
