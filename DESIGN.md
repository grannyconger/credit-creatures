---
name: Credit Creatures
description: The Mossy Bestiary, a naturalist's field guide to the creatures of Coinhaven
colors:
  moss-ground: "#2f4a3a"
  moss-ground-deep: "#1e3127"
  on-ground: "#dce2cc"
  on-ground-soft: "#b9c6ad"
  herbarium-paper: "#d9dec8"
  herbarium-paper-2: "#cbd2b8"
  paper-edge: "#aab394"
  paper-insert: "#dfe3cf"
  foxing: "rgba(150, 110, 50, 0.14)"
  ink: "#1b2420"
  ink-soft: "#4a5547"
  rule: "#8e977c"
  rust-seal: "#b5532e"
  rust-ink: "#93401f"
  on-rust: "#ffffff"
  seal-deep: "#7d3519"
  seal-shine: "#f3b08e"
  plum-chosen: "#5b2a4e"
  plum-wash: "rgba(91, 42, 78, 0.12)"
  gold: "#d9a441"
  gold-ink: "#7a5410"
  foxfire: "#c8e04b"
  pin-brass: "#c9a24a"
  pin-edge: "#7a5d1c"
  pin-shine: "#fff3c9"
  tape: "rgba(236, 232, 205, 0.72)"
  string: "#8a6a46"
  tracing-paper: "rgba(217, 222, 200, 0.82)"
  moss-1: "#4f7a3a"
  moss-2: "#6c9446"
  moss-3: "#3b5e33"
  moss-stalk: "#a8873e"
  fern: "#5f8a48"
  shadow-ink: "#0c1510"
  sp-lanternFox: "#8f4a12"
  sp-cloudBunny: "#4f6189"
  sp-shellTurtle: "#265e50"
  sp-crystalOwl: "#5a4a96"
  sp-mossDragon: "#3a6128"
  sp-puddleGolem: "#255a72"
  sp-starJellycorn: "#8e3f7d"
  sp-emberPhoenix: "#9e3420"
typography:
  display:
    fontFamily: "IM Fell English, Alegreya, Georgia, serif"
    fontSize: "clamp(2.5rem, 3.6vw, 3.8rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "0"
  headline:
    fontFamily: "IM Fell English, Alegreya, Georgia, serif"
    fontSize: "clamp(2.3rem, 3vw, 3.2rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0"
  title:
    fontFamily: "IM Fell English, Alegreya, Georgia, serif"
    fontSize: "1.3rem"
    fontWeight: 400
    lineHeight: 1.1
  lead:
    fontFamily: "IM Fell English, Alegreya, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.1
  body:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.35
  ui:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.35
  tiny:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.25
  hand:
    fontFamily: "Mynerve, Alegreya, cursive"
    fontSize: "1.15rem"
    fontWeight: 400
    lineHeight: 1.35
rounded:
  paper: "3px 7px 4px 6px / 6px 3px 7px 4px"
  tag: "4px 10px 6px 12px / 10px 5px 12px 6px"
  blob: "46% 54% 42% 58% / 55% 44% 56% 45%"
  sheet: "2px"
  tagtop: "28px 28px 4px 4px / 22px 22px 4px 4px"
  tab: "10px 14px 0 0 / 12px 10px 0 0"
  tab-alt: "14px 9px 0 0 / 10px 13px 0 0"
  insert: "2px 9px 5px 11px / 9px 4px 12px 5px"
  round: "999px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "20px"
  s5: "32px"
  s6: "52px"
components:
  seal-button:
    backgroundColor: "{colors.rust-seal}"
    textColor: "{colors.on-rust}"
    typography: "{typography.headline}"
    padding: "13px 34px 13px 52px"
  specimen-card:
    backgroundColor: "{colors.herbarium-paper-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.paper}"
    padding: "20px 8px 12px"
  specimen-label:
    backgroundColor: "{colors.herbarium-paper-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tag}"
    padding: "20px 20px 12px"
  index-tab:
    backgroundColor: "{colors.herbarium-paper-2}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.title}"
    padding: "8px 20px 10px"
  index-tab-selected:
    backgroundColor: "{colors.paper-insert}"
    textColor: "{colors.ink}"
  index-panel:
    backgroundColor: "{colors.paper-insert}"
    textColor: "{colors.ink}"
    padding: "20px 20px 12px"
  option-word:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "5px 11px"
  option-word-selected:
    textColor: "{colors.plum-chosen}"
  link-action:
    textColor: "{colors.plum-chosen}"
    typography: "{typography.label}"
    padding: "4px 2px"
  name-input:
    textColor: "{colors.ink}"
    typography: "{typography.hand}"
    padding: "2px 0 4px"
---

# Design System: Credit Creatures

## Overview

**Creative North Star: "The Mossy Bestiary"**

The app is a naturalist's field guide to the creatures of Coinhaven. Screens are pages and spreads of that book lying open on a deep moss ground, not app panels floating on a background. Grey-green herbarium paper carries dark ink, a dry and affectionate naturalist writes margin notes by hand, and the things on the page are physical: brass pins, torn tape, string tags, tracing paper over the specimens not yet observed, watercolor samples, hand-drawn ink rings, a wax seal and a rubber stamp. Ferns and moss grow over the page edges. The kingdom, the map and Sage stay. The bestiary is the look.

**Scope today.** This is the project's design system going forward, but it is live on one screen only. Every token is scoped under the `.bestiary` class in `css/tokens.css` and applied only to the adoption and edit screen (`js/ui/screens/creature.js`, styled by `css/bestiary.css`) until the teacher approves a rollout. On rollout the `--b-*` tokens move up to `:root`. The `:root` tokens in `css/tokens.css` (cream ground, purple accent, Fraunces headings, system body font) are legacy, kept only for the screens not yet moved. They are not the system and new work must not extend them. The top bar and the feedback button still render in the legacy look above the bestiary page.

Density is generous and the grid is broken on purpose. Pages tilt a fraction of a degree, specimens are pinned at different angles and heights, notes sit crooked in the margins, and the two pages of a spread are never the same width. Color carries meaning, not decoration: rust seals a decision, plum marks what is chosen, gold is money and XP, foxfire is a creature's glow on the dark ground. Learning clarity still wins. Texture and whimsy never cost contrast or plain words.

**Key Characteristics:**
- An open book on a moss ground: asymmetric two-page spreads that stack into one column on narrow screens.
- Grey-green herbarium paper, never cream, with grain, fibers and foxing spots.
- Three voices in type: IM Fell English for headings and names, Alegreya for reading, Mynerve for the naturalist's hand.
- Authored inline SVG for every drawn piece, seeded so it looks the same on every visit.
- Imperfect paper radii and soft lifted shadows instead of uniform rounded cards.
- One authored entrance per screen, then living creatures that idle and blink, all still under Calm and reduce motion.
- Every state carries a word, an icon or a shape as well as a color.

## Colors

A dark moss ground, pale grey-green paper and near-black green ink, with four jewel tones that each mean one thing.

### Primary
- **Wax-Seal Rust** (`rust-seal`): the color of a decision. It fills the wax seal and the ribbon of the main action button, always with white text (`on-rust`, measured 5.0:1). `seal-deep` and `seal-shine` are the pressed ring, letter and highlight inside the seal. When rust is text on paper (error messages) it is `rust-ink`, measured 5.1:1.

### Secondary
- **Herbarium Plum** (`plum-chosen`): what is chosen, and the naturalist's hand. The ring around the chosen specimen, the hand-drawn ink ring around a chosen option, the bold chosen option word, the selected tab underline, the selected swatch ring and check, link actions, the margin notes, the focus trace and the ADOPTED stamp. Measured 8.1:1 on paper. `plum-wash` is its faint tint.

### Tertiary
- **Ledger Gold** (`gold`, with `gold-ink` on paper, measured 4.9:1): money and XP. Defined and contrast checked, but the adoption screen shows no money, so it is not yet used in the build. The first screen with money will be its first real use.
- **Foxfire** (`foxfire`): a creature's glow, for the dark ground only (measured 6.6:1 on moss). In the build it appears only as the text selection highlight, with `shadow-ink` text on it.

### Neutral
- **Moss Ground** (`moss-ground`, `moss-ground-deep`): the sanctuary floor the book lies on, with grain and a vignette that deepens toward the edges. Text on it is `on-ground` (7:1) or `on-ground-soft`.
- **Herbarium Paper** (`herbarium-paper`): the page itself. `herbarium-paper-2` is a slightly darker sheet for specimens, labels and resting tabs. `paper-insert` is a lighter cut sheet for the selected tab and its panel. `paper-edge` is the cut edge of a sheet.
- **Specimen Ink** (`ink`, measured 11.5:1 on paper) for all reading text and headings. `ink-soft` (5.7:1) for Latin names, field labels, notes and resting tabs. `rule` for dashed dividers, the double plate frame and the dotted underline on pickable options.
- **Page materials** (`foxing`, `tape`, `string`, `tracing-paper`, `pin-brass`, `pin-edge`, `pin-shine`, `moss-1` to `moss-3`, `moss-stalk`, `fern`, `shadow-ink`): only for the drawn pieces they are named after, never for text or UI chrome.
- **Species accents** (`sp-<species>`): each creature's own ink. Its name on the board and in the entry heading, and its wavy underline. Set once on the spread as `--sp` and read by children. Dark mode lifts each to a pale tint.

### Named Rules
**The One Meaning Rule.** Rust seals, plum chooses, gold counts, foxfire glows. A jewel tone is never used for anything outside its meaning, and a meaning never borrows another's color.

**The Herbarium Rule.** The paper is grey-green. A cream or warm white page with a purple or indigo accent is the legacy look and never returns.

**The Night Sanctuary Rule.** Dark mode darkens the paper to deep green (`#1f2b24`), turns the ink pale (`#dce2cc`) and lifts plum, rust ink, gold ink and every species accent to pale tints. Rust as a fill stays the same. Watercolor dabs stop multiplying on a dark page. Both the system preference and the in-game appearance setting drive it.

## Typography

**Display Font:** IM Fell English (with Alegreya, Georgia, serif)
**Body Font:** Alegreya (with Georgia, serif)
**Hand Font:** Mynerve (with Alegreya, cursive)

**Character:** IM Fell is an old printer's face with uneven ink, so headings read as a book set in metal type. Alegreya is a warm literary serif that stays readable at length. Mynerve is the naturalist's pen, used only for what the naturalist writes by hand. All three are self-hosted in `fonts/` with their OFL files.

### Hierarchy
- **Display** (400, clamp(2.5rem, 3.6vw, 3.8rem), 0.98): the page heading, top left of the left page, balanced, at most 15ch wide.
- **Headline** (400, clamp(2.3rem, 3vw, 3.2rem), 1): the species name heading the entry, in its species accent. The seal button text uses the display face at 1.45rem.
- **Title** (400, 1.2rem to 1.35rem, 1.1): the specimen label title, index tabs, option group labels (1.12rem) and specimen names on the board (1.32rem, species accent, wavy underline).
- **Body** (400, 1.1875rem, 1.5): all reading text. Ledes are capped at 44ch. Latin names are Alegreya italic in `ink-soft`.
- **Label** (700, 1rem): field labels, link actions and short notes. Smaller notes go down to 0.95rem and swatch names to 0.82rem, never lower.
- **Hand** (400, 1.08rem to 1.55rem, 1.35): margin notes, the plate caption, "chosen", the next-step note and the text a student writes into the name field (1.55rem).

### Named Rules
**The Three Voices Rule.** Fell prints, Alegreya reads, Mynerve writes. Mynerve never carries instructions a student must understand to proceed, and never sets a button.

**The Weight Comes From Size Rule.** Display headings stay at weight 400 with no letter spacing. Hierarchy comes from size and the face, not from bolding Fell.

**The OpenDyslexic Rule.** Dyslexia mode swaps all three voices to OpenDyslexic, sets body to 1.05rem at 1.7 leading, drops headings a step, removes italics, straightens every tilted note and label, and replaces wavy underlines with a plain rule. Text aligns left.

## Layout

The page is an open book. The bestiary fills the width under the top bar on the moss ground (padding 52px top, clamp(16px, 4vw, 64px) at the sides), and the book is a two-column grid capped at 1380px. The left page is a little wider (1.12fr to 1fr) and both pages tilt a fraction of a degree toward the binding (-0.5deg and 0.6deg, the right page dropped 10px). A shade gradient on each inner edge draws the fold.

Spacing runs on one rhythm (`s1` 4px to `s6` 52px), deliberately uneven so the page does not feel gridded. Pages pad with `s6` and `s5` on alternating sides. Boards space their items 34px by 20px, and each item carries its own rotation and vertical offset so no two sit at the same angle or height.

The right page is its own grid: head across the top, plate and label side by side, then the error line, the actions row and the index. On every width, screen order and keyboard order match: label, seal, then the index of optional choices.

Responsive behavior:
- Above 1180px the left page is sticky so the board stays in view while the entry scrolls.
- At 1400px and below both pages become equal width with tighter padding.
- At 1180px and below the book stacks into one column, the tilts and fold shading drop away.
- At 760px and below the board becomes two columns, the right page becomes one column, the plate is capped at 300px and centered, tabs scroll sideways, and the decorative fern on the right is hidden.

Margin notes are placed asymmetrically and rotated a degree or two. Decorative pieces (ferns, moss corners, the pressed fern) are `aria-hidden` and never take pointer events.

## Elevation & Depth

Depth is paper lifted off the ground: soft, offset, downward shadows tinted with the ground's own dark green (`shadow-ink`), never black and never hard. Surfaces carry grain and fiber textures so they read as material. Inside a sheet, depth is inset (the plate frame's inner shadow, the resting tab's inner shading). Lift is a response to touch: hover raises a specimen and swaps to the lift shadow.

### Shadow Vocabulary
- **Page** (`box-shadow: 0 18px 40px -18px rgba(12, 21, 16, 0.75), 0 2px 4px rgba(12, 21, 16, 0.3)`): a whole page lying on the ground.
- **Card** (`box-shadow: 0 10px 18px -10px rgba(12, 21, 16, 0.6), 0 1px 2px rgba(12, 21, 16, 0.25)`): a specimen, a label or a panel resting on the page.
- **Lift** (`box-shadow: 0 22px 30px -14px rgba(12, 21, 16, 0.7), 0 3px 6px rgba(12, 21, 16, 0.25)`): a piece picked up by hover or chosen.

### Named Rules
**The Lifted Paper Rule.** Shadows are soft, blurred and offset downward like paper above the ground. Hard offset shadows and glows are not part of this world.

## Shapes

Paper is never quite square. Sheets use asymmetric elliptical radii (`paper`, `tag`) so each corner differs slightly. Taped sheets and the specimen plate are almost square (`sheet`, 2px). String tags get a luggage-tag top (28px rounded upper corners). Watercolor swatches are blobs (`blob`). Index tabs are rounded only on top, with each tab cut a little differently. The wax seal is a lumpy disc and its ribbon ends in a swallowtail notch.

Borders are material, not hairline chrome: a 1px cut edge (`paper-edge`) on specimens and labels, an inner ruled line inset 7px on the specimen label, a 4px double rule framing the plate like an engraving, and dashed `rule` lines between option groups. Rotation is part of the form language. Almost every sheet, note and tag carries its own small tilt.

## Components

### Wax Seal Button (primary action)
The one decision on a screen, pressed like a seal on a letter.
- **Shape:** a lumpy rust wax disc (84px) overlapping a rust ribbon with a swallowtail notch, grain over the fill.
- **Text:** display face at 1.45rem in white, naming the action and the creature ("Adopt Pebble", "Save changes"). The disc carries the creature's initial.
- **Hover / Active:** the disc turns and grows a little (-14deg, 1.05) on a wobbly spring. Pressing squashes it (0.9, 0.84).
- **After:** the seal presses and an uneven rubber-stamp mark ("ADOPTED" or "UPDATED") lands on the plate in plum before the page turns. Under Calm it appears without moving.
- **Phone:** the ribbon wraps and centers.

### Specimen Card
A creature pinned to the board.
- **Corner Style:** `paper` radius, or a luggage-tag top when tied with string, or 2px when taped.
- **Background:** `herbarium-paper-2` with grain, 1px `paper-edge`, card shadow.
- **Attachment:** a brass pin, a torn strip of tape or a string loop, in a fixed order across the board.
- **Content:** the creature drawing (132px), its name in the species accent with a wavy underline, its Latin name in italic.
- **Hover:** lifts 8px, straightens most of the way, lift shadow, magnifier cursor.
- **Chosen:** lifts 10px, sits straight at 1.05, a plum ring outside a paper gap, and the word "chosen" written in the hand under it.
- **Locked:** the drawing sits faded under a sheet of tracing paper with a lock icon, "Not yet observed" and what opens it. It is disabled with a full sentence as its accessible name.

### Specimen Label (form fields)
- **Style:** a crooked tag (`tag` radius, 1.3deg) tied on with a string line, with an inner ruled border.
- **Inputs:** no box. Text is written in the hand at 1.55rem on a dashed `rule` baseline. Focus turns the baseline solid and adds the dashed plum trace.
- **Helpers:** link actions beside each field ("Suggest one").
- **Error:** a bold `rust-ink` line in its own row above the actions, naming the problem and the fix.

### Index Tabs and Panel
- **Tabs:** paper tabs in the display face, rounded on top, resting slightly lower with inner shading and `ink-soft` text. Hover raises a tab.
- **Selected:** the tab rises flush, turns `paper-insert` and gains a 2px plum underline, so selection is shape and line as well as color.
- **Panel:** the same `paper-insert` cut sheet with an irregular radius and the card shadow. Arrow, Home and End keys move between tabs.
- **Live portrait:** a pinned, framed copy of the creature sits beside the panel and stays in view (sticky, below the top bar) while the student scrolls the options, so every change is visible as it's made.

### Option Words
Choices are words on the page, not chips.
- **Resting:** body text with a dotted `rule` underline that says it can be picked.
- **Hover:** the underline turns wavy plum.
- **Chosen:** bold plum, the underline drops, and a hand-drawn plum ink ring is drawn around the word.
- **Not yet discovered:** collapsed into a lock-icon disclosure listing each option and what opens it.

### Watercolor Swatches
- **Style:** three dabs of paint (body, belly, markings) on a ragged watercolor filter, each swatch tilted a little differently.
- **Chosen:** a solid plum blob ring, a plum check badge and the color's name shown below.

### Link Action
- **Style:** plum, bold, 1rem, underlined at 1px with a 4px offset, no background. Hover turns the underline wavy. Used for secondary actions such as "Suggest one" and "Cancel".

### Focus
Focus is a 2.5px dashed plum outline with a 5px offset, a pencil trace, so it can never be mistaken for the solid ring that means chosen.

### Living Creatures (signature)
Drawings come from `creatureSvg()` in `js/ui/creature-art.js`, which exposes idle hooks (eyes, lantern, puddle, spark, crest, twinkle, facet, wing) styled only under `.bestiary`. Every creature breathes and blinks on its own offset so they never blink together, and each species has its own idle: the lantern flickers, the bunny drifts, the golem's puddle ripples, the phoenix throws sparks and sways its crest, the jellycorn twinkles and bobs, the owl's facets shimmer, the dragon's wings flap, the turtle breathes slowest. Poking the plate squashes the creature and, after enough pokes, the naturalist comments.

### Motion
One authored entrance per screen. On the adoption screen the pages rise in, the ferns unfurl and the specimens drop onto the board one after another and settle on their pins. Motion uses the shared spring curves (`--ease-gentle`, `--ease-bouncy`, `--ease-snappy`, `--ease-wobbly`) with `--b-settle` (0.7s) for weighty settles and `--b-quick` (0.22s) for small responses. Under the Calm setting every animation and transition in the bestiary stops, and the computer's reduce motion setting does the same through `css/tokens.css`. Final states (the stamp, the chosen lift) still show without moving.

## Do's and Don'ts

### Do:
- **Do** style bestiary pages only with the `--b-*` and `--sp-*` tokens under `.bestiary`, so light, dark and dyslexia modes keep working.
- **Do** draw page pieces as authored inline SVG from `js/ui/bestiary-art.js` (pin, tape, string, fern, moss, seal, stamp, ink ring, watercolor), colored by tokens and seeded so they never shift.
- **Do** use `icon()` from `js/ui/icons.js` for UI icons such as lock and check.
- **Do** pair every state with a word, an icon or a shape: "chosen" under the chosen specimen, a check on the chosen swatch, an ink ring around the chosen option, a lock and a sentence on anything locked.
- **Do** break the grid on purpose with tilts, overlaps, offsets and margin notes, and give the next screen a different skeleton from the last.
- **Do** give each screen one authored entrance with weight and a small overshoot, and make everything still under Calm and reduce motion.
- **Do** check AA contrast over the textures. The measured ratios live in the comment above the `.bestiary` block in `css/tokens.css`.
- **Do** write student text in plain language for a 15-year-old, with no em-dashes and no semicolons, and name the action on every button.

### Don't:
- **Don't** use a cream ground with a purple or indigo accent, or extend the legacy `:root` tokens on any new or moved screen.
- **Don't** use eyebrow labels (small tracked caps above a heading).
- **Don't** repeat identical rounded cards with hairline borders, or box a screen as a centered step wizard.
- **Don't** use Inter, Roboto, system fonts, Fraunces, Fredoka, Baloo, Nunito, Quicksand or Poppins in the bestiary.
- **Don't** use purple or blue gradients, glassmorphism, generic icon sets or emoji as icons.
- **Don't** use color alone for any state, or a solid ring for focus.
- **Don't** put foxfire or gold text on paper. They belong to the dark ground, and gold on paper is `gold-ink`.
- **Don't** use bland microcopy such as "Make it yours" or "Get started".
