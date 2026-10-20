// Card preview for Design Your Card. Brands show as emoji only, never logos (SPEC §4).
import { h } from "./dom.js";
import { ISSUERS, NETWORKS } from "../data/products.js";

export function cardArt({ issuer, network, name, design = "plasticBlue", nickname = "", holder = "", size = "" }) {
  const iss = ISSUERS[issuer];
  const net = NETWORKS[network];
  return h(
    "div.card-art",
    { class: `design-${design} ${size}`, role: "img", "aria-label": `${name || "Card"} preview` },
    h("div.card-top", h("span.card-issuer", iss ? `${iss.icon} ${iss.name}` : ""), h("span.card-nick", nickname)),
    h("div.card-chip"),
    h("div.card-name", name || ""),
    h("div.card-bottom", h("span.card-holder", holder.toUpperCase()), h("span.card-network", net ? `${net.icon} ${net.name}` : ""))
  );
}
