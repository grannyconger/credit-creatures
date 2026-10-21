// Creature creator (SPEC §3): body, colors, look, things to wear and a name.
// Looks unlock from the start, with XP or achievements, or in the shop (js/data/looks.js).
import { h, clear } from "../dom.js";
import { creatureSvg } from "../creature-art.js";
import { SPECIES, PALETTES, NAME_IDEAS, LAST_NAME_IDEAS, NAME_MAX, defaultCreature, fullName } from "../../data/creatures.js";
import { LOOK_SLOTS, LOOK_OPTIONS, isUnlocked, lockText, getField, setField } from "../../data/looks.js";

export function render(root, { game, advance, back, editing, track, refreshWho }) {
  const start = game.save.creature || defaultCreature();
  const draft = { lastName: "", ...start, accessories: { ...start.accessories } };
  const play = game.save.play || null;
  let ideaUsed = false;
  let lastIdeaUsed = false;

  const preview = h("div.creature-preview");
  const speciesRow = h("div.tile-row");
  const paletteRow = h("div.swatch-row");
  const lookRows = h("div");
  const wearRows = h("div");
  const progress = h("p.note.tight");
  const nameInput = h("input", { type: "text", maxlength: NAME_MAX, value: draft.name, id: "creature-name", autocomplete: "off" });
  const lastInput = h("input", { type: "text", maxlength: NAME_MAX, value: draft.lastName, id: "creature-last-name", autocomplete: "off", placeholder: "Optional" });
  const error = h("p.error", { role: "alert" });
  const caption = () => fullName(draft) || "Your creature";
  const slot = (key) => LOOK_SLOTS.find((x) => x.key === key);

  // One row of chips. Locked looks show what it takes to unlock them.
  function chipRow(key) {
    const sl = slot(key);
    const current = getField(draft, sl.field) || sl.none;
    const opts = LOOK_OPTIONS[key];
    const open = opts.filter((o) => isUnlocked(o, play));
    const locked = opts.filter((o) => !isUnlocked(o, play));
    return h(
      "div.chip-group",
      h("span.chip-label", sl.label),
      open.map((o) => h("button.chip", { type: "button", "aria-pressed": String(current === o.id), onclick: () => set(sl.field, o.id) }, o.name)),
      locked.length
        ? h(
            "details.locked-more",
            h("summary", `🔒 ${locked.length} more to unlock`),
            locked.map((o) => h("button.chip.locked", { type: "button", disabled: true, title: lockText(o), "aria-label": `${o.name}, locked. ${lockText(o)}` }, o.name, h("small", ` ${lockText(o)}`)))
          )
        : null
    );
  }

  function paint() {
    preview.innerHTML = creatureSvg(draft, { size: 260, ageMonths: game.life?.ageMonths || 0 });
    preview.append(h("p.creature-caption", caption(), h("small", SPECIES[draft.species].blurb)));
    preview.className = `creature-preview ${draft.background && draft.background !== "none" ? `creature-stage bg-${draft.background}` : ""}`;

    clear(speciesRow);
    for (const o of LOOK_OPTIONS.species) {
      const ok = isUnlocked(o, play);
      speciesRow.append(
        h(
          "button.tile",
          { type: "button", class: ok ? "" : "locked", disabled: !ok, "aria-pressed": String(draft.species === o.id), onclick: () => set("species", o.id), title: ok ? "" : lockText(o) },
          h("span.tile-art", { html: creatureSvg({ ...draft, species: o.id, accessories: {}, pattern: "none" }, { size: 72, label: o.name }) }),
          h("span", o.name),
          ok ? null : h("small", lockText(o))
        )
      );
    }

    clear(paletteRow);
    for (const o of LOOK_OPTIONS.palette) {
      const p = PALETTES[o.id];
      const ok = isUnlocked(o, play);
      paletteRow.append(
        h(
          "button.swatch",
          { type: "button", class: ok ? "" : "locked", disabled: !ok, title: ok ? p.label : `${p.label}: ${lockText(o)}`, "aria-label": ok ? p.label : `${p.label}, locked. ${lockText(o)}`, "aria-pressed": String(draft.palette === o.id), onclick: () => set("palette", o.id) },
          h("span", { style: { background: `linear-gradient(135deg, ${p.body} 55%, ${p.accent} 55%)` } }, ok ? null : "🔒")
        )
      );
    }

    clear(lookRows).append(...["pattern", "eyes", "eyeColor", "markings"].map(chipRow));
    clear(wearRows).append(...["head", "neck", "face", "held", "feet", "effect", "background"].map(chipRow));

    const all = Object.values(LOOK_OPTIONS).flat();
    progress.textContent = `You've unlocked ${all.filter((o) => isUnlocked(o, play)).length} of ${all.length} looks. Earn more with XP and achievements, or buy them in the shop.`;
  }

  function set(field, value) {
    setField(draft, field, value);
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
      progress,
      h("h3", "Body"),
      speciesRow,
      h("h3", "Colors"),
      paletteRow,
      h("h3", "Look"),
      lookRows,
      h("h3", "Wear"),
      wearRows,
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
      eyes: draft.eyes || "round",
      eyeColor: draft.eyeColor || "default",
      pattern: draft.pattern || "none",
      markings: draft.markings || "none",
      held: draft.accessories.held || "none",
      feet: draft.accessories.feet || "none",
      effect: draft.accessories.effect || "none",
      background: draft.background || "none",
      editing,
    });
    refreshWho();
    if (editing) {
      await game.persist("creatureEdit");
      back();
    } else {
      await advance("dream");
    }
  });

  paint();
  root.append(form);
}
