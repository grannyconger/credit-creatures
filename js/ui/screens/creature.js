// Creature creator (SPEC §3): body, colors, look, things to wear and a name.
// Looks unlock from the start, with XP or achievements, or in the shop (js/data/looks.js).
// Drawn as a page of the Mossy Bestiary (2026-10-21 redesign): the left page
// is a specimen board with all eight creatures, the right page is the chosen
// creature's entry with its label, an index of tabs and a wax seal to adopt.
import { h, clear } from "../dom.js";
import { burstFrom } from "../motion/particles.js";
import { icon } from "../icons.js";
import { creatureSvg } from "../creature-art.js";
import { pinSvg, tapeSvg, stringSvg, fernSvg, mossSvg, sealSvg, inkStampSvg, inkRingSvg, watercolorDefs, watercolorSvg } from "../bestiary-art.js";
import { SPECIES, PALETTES, NAME_IDEAS, LAST_NAME_IDEAS, NAME_MAX, nextIdea, defaultCreature } from "../../data/creatures.js";
import { LOOK_SLOTS, LOOK_OPTIONS, isUnlocked, lockText, getField, setField } from "../../data/looks.js";

const TABS = [
  { id: "coloring", label: "Coloring", slots: null },
  { id: "features", label: "Features", slots: ["pattern", "eyes", "eyeColor", "markings"] },
  { id: "adornments", label: "Things to wear", slots: ["head", "neck", "face", "held", "feet", "effect", "background"] },
];

// How each specimen is fixed to the board, in board order.
const ATTACH = ["pin", "tape", "string", "pin", "tape", "pin", "string", "tape"];

// What the page says after too many pokes at the plate.
const POKE_NOTES = [
  "The specimen would like you to stop poking it.",
  "It has asked politely. It will not ask a third time.",
  "It has decided this is a game now. You started it.",
];

// lockText (js/data/looks.js) starts with an emoji. The bestiary draws its
// own lock icon, so it keeps only the words.
const unlockNote = (o) => {
  const text = lockText(o).replace(/^\S+\s/, "");
  return text === "Shop item" ? "Sold at Market" : text;
};

const reduced = () => document.documentElement.dataset.motion === "calm" || globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function render(root, { game, advance, back, editing, track, refreshWho }) {
  const start = game.save.creature || defaultCreature();
  const draft = { lastName: "", ...start, accessories: { ...start.accessories } };
  const play = game.save.play || null;
  let ideaUsed = false;
  let lastIdeaUsed = false;
  let tab = "coloring";
  let pokes = 0;
  const slot = (key) => LOOK_SLOTS.find((x) => x.key === key);
  const sp = () => SPECIES[draft.species];

  // ---- Left page: the specimen board --------------------------------------
  const board = h("ul.bst-board", { "aria-label": "The eight creatures" });
  LOOK_OPTIONS.species.forEach((o, i) => {
    const ok = isUnlocked(o, play);
    const info = SPECIES[o.id];
    const attach = ATTACH[i % ATTACH.length];
    const btn = h(
      "button.bst-specimen",
      {
        type: "button",
        class: `attach-${attach}${ok ? "" : " locked"}`,
        "data-species": o.id,
        "data-sound": "none",
        disabled: !ok,
        "aria-pressed": String(draft.species === o.id),
        "aria-label": ok ? `${o.name}, ${info.latin}` : `${o.name}, not unlocked yet. Opens at ${unlockNote(o)}`,
        style: `--i: ${i}; --sp: var(--sp-${o.id})`,
        onclick: () => {
          if (draft.species === o.id) return;
          setField(draft, "species", o.id);
          track("creatureSpecies", { species: o.id });
          paint({ swap: true });
        },
      },
      h("span.bst-attach", { html: attach === "pin" ? pinSvg() : attach === "tape" ? tapeSvg(i + 1) : stringSvg() }),
      h(
        "span.bst-specimen-art",
        h("span", { html: creatureSvg({ species: o.id, palette: info.natural, accessories: {}, pattern: "none" }, { size: 132, label: "" }) }),
        ok ? null : h("span.bst-locknote", icon("lock", { size: 16 }), h("b", "Not yet observed"), h("span", `Opens at ${unlockNote(o)}`))
      ),
      h("span.bst-specimen-label", h("strong", o.name), h("em", info.latin))
    );
    board.append(h("li", { style: `--i: ${i}` }, btn));
  });

  const unlockedCount = h("span");
  const leftPage = h(
    "section.bst-page.bst-left",
    { "aria-labelledby": "bst-title" },
    h("span.bst-moss-corner", { "aria-hidden": "true", html: mossSvg({ seed: 4, width: 340, height: 46 }) }),
    h(
      "header.bst-head",
      h("h1", { id: "bst-title" }, editing ? "Your creature's entry" : "Choose a creature to raise"),
      h(
        "p.bst-lede",
        editing
          ? "Change its look or its name. It will pretend not to notice. It will notice."
          : "You'll make its money choices until it's grown. It trusts you completely. It has no idea what credit is."
      )
    ),
    board,
    h(
      "div.bst-foot",
      h(
        "div.bst-pressed",
        { "aria-hidden": "true" },
        h("span", { html: fernSvg({ seed: 21, curl: 0.2, leaves: 10, width: 92, height: 170 }) }),
        h("span", { html: tapeSvg(9) }),
        h("p.bst-pressed-note", "Pressed fern, found by the Vault. Not up for adoption. It has been told.")
      ),
      h("p.bst-margin.bst-margin-board", unlockedCount, " The rest turn up with XP, achievements and the shop.")
    )
  );

  // ---- Right page: the entry -----------------------------------------------
  const entryName = h("h2.bst-entry-name");
  const entryLatin = h("p.bst-entry-latin");
  const plateArt = h("div.bst-plate-art");
  const stampSlot = h("div.bst-stamp-slot", { "aria-hidden": "true" });
  const notes = h("figcaption.bst-notes");
  const plate = h(
    "figure.bst-plate",
    { "data-sound": "none" },
    h("div.bst-plate-frame", { onclick: poke }, plateArt, stampSlot),
    notes
  );

  const nameInput = h("input.bst-input", { type: "text", maxlength: NAME_MAX, value: draft.name, id: "creature-name", autocomplete: "off", placeholder: "Write here" });
  const lastInput = h("input.bst-input", { type: "text", maxlength: NAME_MAX, value: draft.lastName, id: "creature-last-name", autocomplete: "off", placeholder: "Optional" });
  const error = h("p.bst-error", { role: "alert" });

  // The rest of each shuffled deck is kept in this browser, so names don't
  // repeat after a reload either. Storage can be blocked, so it's optional.
  const deal = (kind, list, current) => {
    const key = `credit-creatures:ideas:${kind}`;
    let bag = [];
    try {
      bag = JSON.parse(localStorage.getItem(key) || "[]");
    } catch {}
    const r = nextIdea(list, bag, current);
    try {
      localStorage.setItem(key, JSON.stringify(r.bag));
    } catch {}
    return r.pick;
  };
  const ideaBtn = h("button.bst-link", { type: "button" }, "Suggest one");
  ideaBtn.addEventListener("click", () => {
    draft.name = deal("first", NAME_IDEAS, draft.name);
    nameInput.value = draft.name;
    ideaUsed = true;
    paintSeal();
  });
  const lastIdeaBtn = h("button.bst-link", { type: "button" }, "Suggest one");
  lastIdeaBtn.addEventListener("click", () => {
    draft.lastName = deal("last", LAST_NAME_IDEAS, draft.lastName);
    lastInput.value = draft.lastName;
    lastIdeaUsed = true;
  });
  // One word each, no spaces (teacher request 2026-10-27).
  const oneWord = (input) => {
    if (!/\s/.test(input.value)) return void (error.textContent = "");
    const at = input.selectionStart - (input.value.slice(0, input.selectionStart).match(/\s/g) || []).length;
    input.value = input.value.replace(/\s+/g, "");
    input.setSelectionRange(at, at);
    error.textContent = "Names are one word each, with no spaces.";
  };
  nameInput.addEventListener("input", () => {
    oneWord(nameInput);
    draft.name = nameInput.value;
    paintSeal();
    paintMirrorNote();
  });
  lastInput.addEventListener("input", () => {
    oneWord(lastInput);
    draft.lastName = lastInput.value;
  });

  const label = h(
    "div.bst-label",
    h("p.bst-label-title", "Specimen label"),
    h("div.bst-field", h("label", { for: "creature-name" }, "Name"), h("div.bst-field-row", nameInput, ideaBtn)),
    h("div.bst-field", h("label", { for: "creature-last-name" }, "Family name"), h("div.bst-field-row", lastInput, lastIdeaBtn)),
    h("p.bst-label-note", "One word each, no spaces. Use a made-up name, not your real one. It goes on your creature's bank cards. You can change it later.")
  );

  // The index: paper tabs along the top of the panel. Arrow keys move between them.
  const tabButtons = TABS.map((t) =>
    h("button.bst-tab", { type: "button", role: "tab", id: `bst-tab-${t.id}`, "aria-controls": "bst-panel", "data-tab": t.id, onclick: () => chooseTab(t.id) }, t.label)
  );
  const tabList = h("div.bst-tabs", { role: "tablist", "aria-label": "Change its look" }, tabButtons);
  tabList.addEventListener("keydown", (e) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : null;
    if (next == null) return;
    e.preventDefault();
    chooseTab(TABS[(next + TABS.length) % TABS.length].id);
    tabButtons.find((b) => b.dataset.tab === tab).focus();
  });
  const panel = h("div.bst-panel", { role: "tabpanel", id: "bst-panel", tabindex: "0" });
  // A live portrait beside the options, so the creature stays in view while
  // you scroll through colors and things to wear. The big plate above has
  // the accessible name, so this copy is hidden from screen readers.
  const mirrorArt = h("div.bst-mirror-art");
  const mirrorNote = h("figcaption.bst-mirror-note");
  const mirror = h("figure.bst-mirror", { "aria-hidden": "true" }, h("span.bst-attach", { html: pinSvg() }), mirrorArt, mirrorNote);

  const sealLabel = h("span.bst-seal-text");
  const sealWax = h("span.bst-seal-wax");
  const submit = h("button.bst-seal-btn", { type: "submit" }, sealWax, sealLabel);
  const actions = h(
    "div.bst-actions",
    editing ? h("button.bst-link.bst-cancel", { type: "button", onclick: back }, "Cancel") : null,
    submit,
    editing ? null : h("p.bst-next", "Next, you'll choose its dream.")
  );

  const rightPage = h(
    "form.bst-page.bst-right",
    { "aria-label": "Your creature's entry", novalidate: true },
    h("header.bst-entry-head", entryName, entryLatin),
    plate,
    label,
    error,
    actions,
    h("div.bst-index", tabList, h("div.bst-index-body", panel, mirror)),
    h("span.bst-moss-corner", { "aria-hidden": "true", html: mossSvg({ seed: 7, width: 300, height: 54 }) })
  );

  // ---- The ground the book lies on -----------------------------------------
  const spread = h(
    "div.bestiary.bst-adopt",
    h("div.bst-decor", { "aria-hidden": "true", html: watercolorDefs() },
      h("span.bst-fern-left", { html: fernSvg({ seed: 3, curl: 0.42, width: 150, height: 280 }) }),
      h("span.bst-fern-right", { html: fernSvg({ seed: 9, curl: -0.3, leaves: 11, width: 120, height: 230 }) })
    ),
    h("div.bst-book", leftPage, rightPage)
  );

  // ---- Painting --------------------------------------------------------------
  function optionRow(key) {
    const sl = slot(key);
    const current = getField(draft, sl.field) || sl.none;
    const opts = LOOK_OPTIONS[key];
    const open = opts.filter((o) => isUnlocked(o, play));
    const locked = opts.filter((o) => !isUnlocked(o, play));
    return h(
      "div.bst-opts",
      { role: "group", "aria-label": sl.label },
      h("span.bst-opts-label", sl.label),
      h(
        "div.bst-opts-list",
        open.map((o, i) =>
          h(
            "button.bst-opt",
            { type: "button", "aria-pressed": String(current === o.id), "data-opt": `${key}:${o.id}`, onclick: () => set(sl.field, o.id) },
            current === o.id ? h("span.bst-opt-ring", { html: inkRingSvg(i + 2) }) : null,
            o.name
          )
        ),
        locked.length
          ? h(
              "details.bst-undiscovered",
              h("summary", icon("lock", { size: 14 }), ` ${locked.length} not discovered yet`),
              h("ul", locked.map((o) => h("li", h("b", o.name), " ", unlockNote(o))))
            )
          : null
      )
    );
  }

  function swatches() {
    const opts = LOOK_OPTIONS.palette;
    const open = opts.filter((o) => isUnlocked(o, play));
    const locked = opts.filter((o) => !isUnlocked(o, play));
    return h(
      "div.bst-opts.bst-opts-swatches",
      { role: "group", "aria-label": "Colors" },
      h("p.bst-panel-note", "Watercolor samples from the paint box. Pick one for its body, belly and markings."),
      h(
        "div.bst-swatches",
        open.map((o, i) => {
          const p = PALETTES[o.id];
          const on = draft.palette === o.id;
          return h(
            "button.bst-swatch",
            { type: "button", "aria-pressed": String(on), "aria-label": p.label, title: p.label, "data-opt": `palette:${o.id}`, style: `--i: ${i}`, onclick: () => set("palette", o.id) },
            h("span.bst-dab", { html: watercolorSvg(p, i + 3) }),
            on ? h("span.bst-swatch-check", icon("check", { size: 14 })) : null,
            h("span.bst-swatch-name", p.label)
          );
        })
      ),
      locked.length
        ? h(
            "details.bst-undiscovered",
            h("summary", icon("lock", { size: 14 }), ` ${locked.length} colors not discovered yet`),
            h("ul", locked.map((o) => h("li", h("b", PALETTES[o.id].label), " ", unlockNote(o))))
          )
        : null
    );
  }

  function paintPanel() {
    // Keep keyboard focus on the same option after a repaint.
    const focused = panel.contains(document.activeElement) ? document.activeElement.dataset?.opt : null;
    const t = TABS.find((x) => x.id === tab);
    clear(panel).append(...(t.slots ? t.slots.map(optionRow) : [swatches()]));
    panel.setAttribute("aria-labelledby", `bst-tab-${tab}`);
    for (const b of tabButtons) {
      const on = b.dataset.tab === tab;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
    }
    if (focused) panel.querySelector(`[data-opt="${focused}"]`)?.focus();
  }

  function paintMirrorNote() {
    mirrorNote.textContent = `${draft.name.trim() || `Your ${sp().label.toLowerCase()}`}, right now`;
  }

  function paintSeal() {
    const name = draft.name.trim();
    sealLabel.textContent = editing ? "Save changes" : name ? `Adopt ${name}` : `Adopt the ${sp().label.toLowerCase()}`;
    // The seal is pressed with the creature's initial.
    const letter = (name || sp().label).charAt(0).toUpperCase();
    if (sealWax.dataset.letter !== letter) {
      sealWax.dataset.letter = letter;
      sealWax.innerHTML = sealSvg({ seed: 11, size: 84, letter });
    }
  }

  function paint({ swap = false } = {}) {
    const s = sp();
    spread.style.setProperty("--sp", `var(--sp-${draft.species})`);
    spread.dataset.species = draft.species;
    for (const b of board.querySelectorAll(".bst-specimen")) b.setAttribute("aria-pressed", String(b.dataset.species === draft.species));
    entryName.textContent = s.label;
    entryLatin.textContent = s.latin;
    plateArt.innerHTML = creatureSvg(draft, { size: 250, ageMonths: game.life?.ageMonths || 0 });
    const frame = plate.querySelector(".bst-plate-frame");
    const stage = draft.background && draft.background !== "none" ? ` creature-stage bg-${draft.background}` : "";
    frame.className = `bst-plate-frame${stage}`;
    mirrorArt.className = `bst-mirror-art${stage}`;
    mirrorArt.innerHTML = creatureSvg(draft, { size: 190, label: "", ageMonths: game.life?.ageMonths || 0 });
    paintMirrorNote();
    clear(notes).append(h("span", s.blurb), " ", h("span", pokes >= 5 ? POKE_NOTES[Math.min(pokes - 5, POKE_NOTES.length - 1)] : s.note));
    if (swap && !reduced()) {
      rightPage.classList.remove("bst-swap");
      void rightPage.offsetWidth;
      rightPage.classList.add("bst-swap");
    }
    const all = Object.values(LOOK_OPTIONS).flat();
    unlockedCount.textContent = `${all.filter((o) => isUnlocked(o, play)).length} of ${all.length} looks discovered so far.`;
    paintSeal();
    paintPanel();
  }

  function chooseTab(id) {
    if (id === tab) return;
    tab = id;
    track("creatureTab", { tab: id });
    paintPanel();
  }

  function set(field, value) {
    setField(draft, field, value);
    paint();
  }

  // A small easter egg: poke the plate enough and the naturalist says something.
  function poke() {
    pokes++;
    const art = plateArt.firstElementChild;
    burstFrom(art, "hearts");
    if (art && !reduced()) {
      art.classList.remove("bst-poked");
      void art.getBoundingClientRect();
      art.classList.add("bst-poked");
    }
    if (pokes === 5) track("creaturePoke", { species: draft.species });
    if (pokes >= 5) paint();
  }

  rightPage.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = nameInput.value.replace(/\s+/g, "");
    if (!name) {
      error.textContent = "Every specimen needs a name. Even a temporary one will do.";
      nameInput.focus();
      return;
    }
    submit.disabled = true;
    draft.name = name;
    draft.lastName = lastInput.value.replace(/\s+/g, "");
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
    // The seal presses and the entry gets its stamp before the page turns.
    stampSlot.innerHTML = inkStampSvg(editing ? "UPDATED" : "ADOPTED");
    submit.classList.add("pressed");
    spread.classList.add("bst-stamped");
    if (!reduced()) await new Promise((r) => setTimeout(r, 900));
    if (editing) {
      await game.persist("creatureEdit");
      back();
    } else {
      await advance("dream");
    }
  });

  paint();
  root.append(spread);
}
