---
version: 1
slug: "js-ui-screens-creature-js"
primary_target: "js/ui/screens/creature.js"
related_targets: ["css/bestiary.css","js/ui/bestiary-art.js"]
---

# Adoption screen (Mossy Bestiary, first page)

Scope: the creature adoption and edit screen (`#/creature`), mode Experience. Students (about 15) pick one of eight creatures, color it, dress it, name it and adopt it. It is also the Cottage's "Edit my creature" screen. New world scoped to `.bestiary` until the teacher approves a rollout.

Constraints: plain HTML/CSS/JS, `--b-*` tokens only, light, dark and dyslexia modes, Calm motion and reduce motion, 1280px desktop first, phone at 390px, telemetry on every choice, no em-dashes or semicolons in student text.

## Direction contract

THESIS: the screen is a page of a naturalist's field guide, an open book with a specimen board on the left and the chosen creature's entry on the right. It refuses the centered card wizard with a tile grid, color circles and pill chips.

OWN-WORLD: deep moss ground with grain, grey-green herbarium paper (not cream), ink #1B2420, rust wax seals, plum ink for chosen things, gold and foxfire only on dark. IM Fell English headings, Alegreya body, Patrick Hand margin notes. Pins, tape, string tags, tracing paper, watercolor dabs, hand-drawn ink rings, fern fronds and moss over page edges.

STORY: the student sees all eight creatures at once, learns which are locked and what opens them, picks one, sees its entry and the naturalist's dry note, changes its look through paper index tabs, writes its name on the specimen label, and presses the wax seal to adopt it.

FIRST VIEWPORT: at 1440x900, the left page holds a large IM Fell heading at top left over a three-line lede, then a 4x2 board of tilted specimens (three open, five under tracing paper). The right page holds the species name in its accent color, a framed plate, the crooked specimen label beside it, and the wax seal in a full-width row under them, inside the first viewport. The index tabs for coloring, features and things to wear start just below the fold, because changing the look is optional and adopting is the main action. On every width, the screen order and the keyboard order are the same: label, seal, then the index.

FORM: field-guide spread, pinned by the user's brief. The user explicitly waived the concept roll on 2026-10-21, answering "Waive it" when asked, so no seed reference exists. The user also chose to keep the Adopt seal above the index tabs on desktop.

Signature interaction: specimens drop onto the board and settle on their pins, the chosen one lifts with "chosen" written under it, and adopting presses the seal and thumps an ADOPTED ink stamp onto the plate before the page turns. Each creature idles in its own way and blinks.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
