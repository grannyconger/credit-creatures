// Creature creator (SPEC §3): species, palette, accessories and a name.
import { h, clear } from "../dom.js";
import { creatureSvg } from "../creature-art.js";
import { SHOP_BY_ID } from "../../data/shop.js";
import { SPECIES, PALETTES, ACCESSORIES, ACCESSORY_SLOTS, NAME_IDEAS, LAST_NAME_IDEAS, NAME_MAX, defaultCreature, fullName } from "../../data/creatures.js";

export function render(root, { game, advance, back, editing, track, refreshWho }) {
  const start = game.save.creature || defaultCreature();
  const draft = { lastName: "", ...start, accessories: { ...start.accessories } };
  let ideaUsed = false;
  let lastIdeaUsed = false;

  const preview = h("div.creature-preview");
  const speciesRow = h("div.tile-row");
  const paletteRow = h("div.swatch-row");
  const accessoryRows = h("div");
  const backgroundRow = h("div.chip-group");
  const nameInput = h("input", { type: "text", maxlength: NAME_MAX, value: draft.name, id: "creature-name", autocomplete: "off" });
  const lastInput = h("input", { type: "text", maxlength: NAME_MAX, value: draft.lastName, id: "creature-last-name", autocomplete: "off", placeholder: "Optional" });
  const error = h("p.error", { role: "alert" });
  const caption = () => fullName(draft) || "Your creature";

  function paint() {
    preview.innerHTML = creatureSvg(draft, { size: 260 });
    preview.append(h("p.creature-caption", caption(), h("small", SPECIES[draft.species].blurb)));

    clear(speciesRow);
    for (const [key, s] of Object.entries(SPECIES)) {
      speciesRow.append(
        h(
          "button.tile",
          { type: "button", "aria-pressed": String(draft.species === key), onclick: () => set("species", key) },
          h("span.tile-art", { html: creatureSvg({ ...draft, species: key, accessories: {} }, { size: 72, label: s.label }) }),
          h("span", s.label)
        )
      );
    }

    clear(paletteRow);
    for (const [key, p] of Object.entries(PALETTES)) {
      paletteRow.append(
        h(
          "button.swatch",
          { type: "button", title: p.label, "aria-label": p.label, "aria-pressed": String(draft.palette === key), onclick: () => set("palette", key) },
          h("span", { style: { background: `linear-gradient(135deg, ${p.body} 55%, ${p.accent} 55%)` } })
        )
      );
    }

    clear(backgroundRow);
    for (const [key, text] of [["none", "Plain"], ...ownedOf("background")]) {
      backgroundRow.append(h("button.chip", { type: "button", "aria-pressed": String((draft.background || "none") === key), onclick: () => set("background", key === "none" ? null : key) }, text));
    }
    preview.className = `creature-preview ${draft.background ? `creature-stage bg-${draft.background}` : ""}`;

    clear(accessoryRows);
    for (const [slot, label] of Object.entries(ACCESSORY_SLOTS)) {
      accessoryRows.append(
        h(
          "div.chip-group",
          h("span.chip-label", label),
          [...Object.entries(ACCESSORIES[slot]), ...ownedOf(slot)].map(([key, text]) =>
            h("button.chip", { type: "button", "aria-pressed": String(draft.accessories[slot] === key), onclick: () => setAccessory(slot, key) }, text)
          )
        )
      );
    }
  }

  // Items bought in the shop join the choices (SPEC §18).
  function ownedOf(kind) {
    return (game.save.play?.owned || []).map((id) => SHOP_BY_ID[id]).filter((i) => i && i.kind === kind).map((i) => [i.id, `${i.icon} ${i.name}`]);
  }

  function set(field, value) {
    draft[field] = value;
    paint();
  }

  function setAccessory(slot, value) {
    draft.accessories[slot] = value;
    paint();
  }

  nameInput.addEventListener("input", () => {
    draft.name = nameInput.value;
    preview.querySelector(".creature-caption").firstChild.textContent = caption();
  });
  lastInput.addEventListener("input", () => {
    draft.lastName = lastInput.value;
    preview.querySelector(".creature-caption").firstChild.textContent = caption();
  });

  const lastIdeaBtn = h("button.link", { type: "button" }, "Give me an idea");
  lastIdeaBtn.addEventListener("click", () => {
    const options = LAST_NAME_IDEAS.filter((n) => n !== draft.lastName);
    draft.lastName = options[Math.floor(Math.random() * options.length)];
    lastInput.value = draft.lastName;
    lastIdeaUsed = true;
    paint();
  });

  const ideaBtn = h("button.link", { type: "button" }, "Give me an idea");
  ideaBtn.addEventListener("click", () => {
    const options = NAME_IDEAS.filter((n) => n !== draft.name);
    draft.name = options[Math.floor(Math.random() * options.length)];
    nameInput.value = draft.name;
    ideaUsed = true;
    paint();
  });

  const btn = h("button", { type: "submit" }, editing ? "Save changes" : "Next: join your class");
  const form = h(
    "form.panel.creator",
    h(
      "div.creator-left",
      h("p.step-label", editing ? "Edit your creature" : "Step 2: your creature"),
      h("h1", "Adopt a creature"),
      h("p", "You will make money choices for this creature until it is grown. Make it yours."),
      h("h3", "Species"),
      speciesRow,
      h("h3", "Colors"),
      paletteRow,
      h("h3", "Accessories"),
      h("p.note.tight", "Buy more in the shop after Chapter 1."),
      accessoryRows,
      ownedOf("background").length ? h("h3", "Background") : null,
      ownedOf("background").length ? backgroundRow : null,
      h("h3", h("label", { for: "creature-name" }, "Name")),
      h("div.name-row", nameInput, ideaBtn),
      h("h3", h("label", { for: "creature-last-name" }, "Last name")),
      h("div.name-row", lastInput, lastIdeaBtn),
      h("p.note.tight", "Pick fun names, not your real name. The full name goes on your bank cards. You can change it later."),
      error,
      h("div.row", editing ? h("button.secondary", { type: "button", onclick: back }, "Cancel") : null, btn)
    ),
    h("div.creator-right", preview)
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim().replace(/\s+/g, " ");
    if (!name) {
      error.textContent = "Your creature needs a name.";
      nameInput.focus();
      return;
    }
    btn.disabled = true;
    draft.name = name;
    draft.lastName = lastInput.value.trim().replace(/\s+/g, " ");
    game.save.creature = draft;
    track("creatureSaved", {
      species: draft.species,
      palette: draft.palette,
      head: draft.accessories.head,
      neck: draft.accessories.neck,
      face: draft.accessories.face,
      ideaUsed,
      hasLastName: Boolean(draft.lastName),
      lastIdeaUsed,
      editing,
    });
    refreshWho();
    if (editing) {
      await game.persist("creatureEdit");
      back();
    } else {
      await advance("join");
    }
  });

  paint();
  root.append(form);
}
