// The same header on every place in the kingdom: where you are, what it's for,
// and the way back home (teacher request: everything comes back to the hub).
import { h } from "./dom.js";
import { icon } from "./icons.js";

export function placeHeader({ go, iconName, kicker = "Coinhaven", title, subtitle = "", practice = false }) {
  return h(
    "div.place-header-wrap",
    practice ? h("p.callout.warn.practice", "Practice mode. Nothing you do here is saved.") : null,
    h(
      "header.place-header",
      h("button.back-home", { type: "button", onclick: () => go("hub") }, icon("back", { size: 18 }), " Back to the kingdom"),
      h("div.place-title", h("span.place-icon", icon(iconName, { size: 30 })), h("div", h("p.step-label", kicker), h("h1", title), subtitle ? h("p.muted.tight", subtitle) : null))
    )
  );
}
