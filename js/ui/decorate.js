// Decorate mode for the Cottage room (docs/UI-REBUILD.md slice 5). Eight slots,
// no tile grid and no dragging: tap a slot chip, then pick a piece. Pieces you
// don't own yet can be previewed in the room before you buy them. Previews
// are never saved.
import { h, money } from "./dom.js";
import { icon } from "./icons.js";
import { decorThumb } from "./cottage-art.js";
import { DECOR, SLOTS, ownedDecor } from "../data/cottage.js";

// Where each slot's chip sits on the room (percent of the stage).
export const CHIP_SPOTS = {
  wallpaper: [40, 4],
  shelf: [62, 3],
  window: [18, 37],
  art: [57, 38],
  lamp: [75, 52],
  plant: [89, 70],
  rug: [70, 94],
  floor: [30, 94],
};

export function slotChips({ cottage, onSlot, current }) {
  return SLOTS.map((s) => {
    const [x, y] = CHIP_SPOTS[s.id];
    return h(
      "button.slot-chip",
      { type: "button", "data-slot": s.id, "aria-pressed": current === s.id ? "true" : "false", style: { left: `${x}%`, top: `${y}%` }, onclick: () => onSlot(s.id) },
      icon(s.icon, { size: 16 }),
      h("span", s.label)
    );
  });
}

// The tray under the room for one slot. cottage: what's placed (saved). preview: a piece being tried.
export function pieceTray({ play, slot, cottage, preview, onUse, onPreview, onMarket, onClose }) {
  const own = ownedDecor(play);
  const label = SLOTS.find((s) => s.id === slot).label;
  const pieces = DECOR.filter((d) => d.slot === slot).sort((a, b) => Number(own.has(b.id)) - Number(own.has(a.id)) || a.price - b.price);
  const previewing = preview ? pieces.find((d) => d.id === preview) : null;
  return h(
    "section.piece-tray",
    h("div.piece-head", h("h2", icon(SLOTS.find((s) => s.id === slot).icon, { size: 20 }), ` ${label}`), h("button.small.secondary", { type: "button", onclick: onClose }, "Done")),
    h(
      "ul.piece-list",
      pieces.map((d) => {
        const owned = own.has(d.id);
        const on = cottage[slot] === d.id;
        const trying = preview === d.id;
        return h(
          "li",
          h(
            "button.piece",
            { type: "button", "aria-pressed": on || trying ? "true" : "false", onclick: () => (owned ? onUse(d) : onPreview(d)) },
            h("span.piece-art", { html: decorThumb(d) }),
            h("strong", d.name),
            h("small", on ? "In your room" : owned ? "Yours. Click to use" : trying ? "Trying it on" : `${money(d.price)}. Click to preview`)
          )
        );
      })
    ),
    previewing
      ? h("p.piece-preview", icon("info", { size: 16 }), ` Previewing the ${previewing.name.toLowerCase()}. It costs ${money(previewing.price)} at the Market. `, h("button.small", { type: "button", onclick: onMarket }, icon("market", { size: 16 }), " Go to the Market"))
      : null
  );
}
