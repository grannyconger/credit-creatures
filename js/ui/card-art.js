// Card art for the wallet, Design Your Card and results. Brands show as a
// name badge or emoji, never logos (SPEC §4). Cards have a light sheen, an
// embossed look and a gentle tilt that follows the pointer (off with reduced motion).
import { h } from "./dom.js";
import { ISSUERS, NETWORKS } from "../data/products.js";

// A credit union's name badge in its own colors (no logos, SPEC §4).
export function brandStyle(brand) {
  return { background: brand.bg, color: brand.fg, boxShadow: brand.ring ? `inset 0 0 0 2px ${brand.ring}` : "" };
}

// Fancy materials get a holographic stripe.
const HOLO = new Set(["metal", "clear"]);
const CONTACTLESS = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 8a6 6 0 0 1 0 8M12 5a10 10 0 0 1 0 14M16 2.5a14 14 0 0 1 0 19"/></svg>';

function tilt(card) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    card.style.setProperty("--shine-x", `${(x + 0.5) * 100}%`);
  });
  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
}

// issuerText replaces the issuer's name (the Gilded Vault debit card has no issuer entry).
export function cardArt({ issuer, network, name, design = "plasticBlue", nickname = "", holder = "", size = "", issuerText = "", premium = false }) {
  const iss = ISSUERS[issuer];
  const net = NETWORKS[network];
  const card = h(
    "div.card-art",
    { class: `design-${design} ${size} ${HOLO.has(design) || premium ? "holo" : ""}`, role: "img", "aria-label": `${name || "Card"} preview` },
    h("span.card-sheen", { "aria-hidden": "true" }),
    h(
      "div.card-top",
      h(
        "span.card-issuer",
        !issuerText && iss?.brand ? { class: "brand-pill", style: brandStyle(iss.brand) } : {},
        issuerText || (iss ? `${iss.icon} ${iss.short || iss.name}` : "")
      ),
      h("span.card-nick", nickname)
    ),
    h("div.card-mid", h("div.card-chip", { "aria-hidden": "true" }, h("span"), h("span"), h("span")), h("span.card-tap", { html: CONTACTLESS })),
    h("div.card-name", name || ""),
    h("div.card-bottom", h("span.card-holder", holder.toUpperCase()), h("span.card-network", net ? `${net.icon} ${net.name}` : ""))
  );
  if (size !== "mini") tilt(card);
  return card;
}
