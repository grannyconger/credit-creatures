// Bills and coins shared by Cashier Rush and Count the Drawer. Coins are
// sized from their real diameters (US Mint, millimeters), scaled up so the
// smallest one (the dime) is still a big touch target. Styles live under
// .bst-guild .cash-piece in css/bestiary.css.
import { h } from "../dom.js";

export const label = (c) => (c >= 100 ? `$${c / 100}` : `${c}¢`);
export const COIN = { 25: ["quarter", 24.26], 10: ["dime", 17.91], 5: ["nickel", 21.21], 1: ["penny", 19.05] };
const PX_PER_MM = 4.4;

export const pieceClass = (c) => (c >= 100 ? "bill" : `coin coin-${COIN[c][0]}${c === 1 ? " copper" : ""}`);
export const coinSize = (c, scale = 1) => `--coin: ${Math.round(COIN[c][1] * PX_PER_MM * scale)}px`;

// A bill or coin face: the value, plus the coin's name.
export function pieceFace(c) {
  return [h("span", label(c)), c < 100 ? h("small.coin-name", COIN[c][0]) : null];
}

// A button for one bill or coin. extra: more attributes and children.
export function pieceButton(c, { onclick, ariaLabel, key, scale = 1, quiet = false } = {}) {
  return h(
    "button.cash-piece",
    { type: "button", class: pieceClass(c), "data-sound": quiet ? "none" : null, "data-boop": quiet ? "none" : null, style: c < 100 ? coinSize(c, scale) : null, onclick, "aria-label": ariaLabel || `${label(c)}${c < 100 ? `, a ${COIN[c][0]}` : ""}`, "aria-keyshortcuts": key || null },
    ...pieceFace(c),
    key ? h("kbd.cash-key", { "aria-hidden": "true" }, key) : null
  );
}
