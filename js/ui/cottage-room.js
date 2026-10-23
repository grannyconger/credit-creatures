// The Creature Cottage room: the creature stands in a drawn room and every
// object is a real button that glows on hover and keyboard focus. A badge with
// a "!" and words shows when a place needs something (never color alone).
import { h } from "./dom.js";
import { icon } from "./icons.js";
import { creatureSvg } from "./creature-art.js";
import { roomSvg, OBJECT_ART } from "./cottage-art.js";
import { ROOM_OBJECTS, CREATURE_SPOT } from "../data/cottage-objects.js";
import { PLACES } from "../places.js";
import { cottageOf } from "../data/cottage.js";

const PLACE = Object.fromEntries(PLACES.map((p) => [p.id, p]));

// onPick(object, place): the screen decides what each click does.
export function cottageRoom({ creature, ageMonths, play, status, onPick, onCreature, preview = null, chips = null }) {
  // preview: a piece being tried on (never saved). chips: slot buttons for Decorate mode.
  const cottage = { ...cottageOf(play), ...(preview ? { [preview.slot]: preview.id } : {}) };
  const editing = Boolean(chips);
  const stage = h("div.cottage-stage", { class: editing ? "editing" : "" }, h("div.room-wall", { html: roomSvg(cottage), "aria-hidden": "true" }));
  stage.append(
    h("button.room-creature", { type: "button", "aria-label": `Open ${creature.name}'s cottage`, style: { left: `${CREATURE_SPOT.x}%`, top: `${CREATURE_SPOT.y}%`, width: `${CREATURE_SPOT.w}%` }, onclick: onCreature, html: creatureSvg(creature, { size: 200, ageMonths, label: "" }) })
  );
  for (const o of ROOM_OBJECTS) {
    const pl = o.place ? PLACE[o.place] : null;
    const st = o.status ? status[o.status] : pl ? status[pl.id] : null;
    const locked = st?.tone === "locked";
    const needs = st && ["action", "warn"].includes(st.tone);
    const note = locked ? st.text : needs ? st.text : o.hint;
    stage.append(
      h(
        "button.room-object",
        {
          type: "button",
          "data-object": o.id,
          class: `${locked ? "locked" : ""} ${needs ? "needs" : ""}`,
          "aria-disabled": locked ? "true" : null,
          disabled: editing,
          "aria-label": `${o.label}. ${note}.`,
          style: { left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%`, height: `${o.h}%` },
          onclick: () => onPick(o, pl),
        },
        h("span.room-object-art", { html: OBJECT_ART[o.art](cottage) }),
        h("span.room-tag", locked ? icon("lock", { size: 14 }) : needs ? icon(st.tone === "warn" ? "alert" : "sparkle", { size: 14 }) : null, h("strong", o.label), h("small", note)),
        needs ? h("span.room-badge", { "aria-hidden": "true" }, st.count || "!") : null
      )
    );
  }
  if (chips) stage.append(...chips);
  return stage;
}
