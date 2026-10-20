// Card preview for Design Your Card. Brands show as emoji only, never logos (SPEC §4).
import { h } from "./dom.js";
import { ISSUERS, NETWORKS } from "../data/products.js";

// issuerText replaces the issuer's name (the Gilded Vault debit card has no issuer entry).
// A credit union's name badge in its own colors (no logos, SPEC §4).
export function brandStyle(brand) {
  return { background: brand.bg, color: brand.fg, boxShadow: brand.ring ? `inset 0 0 0 2px ${brand.ring}` : "" };
}

export function cardArt({ issuer, network, name, design = "plasticBlue", nickname = "", holder = "", size = "", issuerText = "" }) {
  const iss = ISSUERS[issuer];
  const net = NETWORKS[network];
  return h(
    "div.card-art",
    { class: `design-${design} ${size}`, role: "img", "aria-label": `${name || "Card"} preview` },
    h(
      "div.card-top",
      h(
        "span.card-issuer",
        !issuerText && iss?.brand ? { class: "brand-pill", style: brandStyle(iss.brand) } : {},
        issuerText || (iss ? `${iss.icon} ${iss.short || iss.name}` : "")
      ),
      h("span.card-nick", nickname)
    ),
    h("div.card-chip"),
    h("div.card-name", name || ""),
    h("div.card-bottom", h("span.card-holder", holder.toUpperCase()), h("span.card-network", net ? `${net.icon} ${net.name}` : ""))
  );
}
