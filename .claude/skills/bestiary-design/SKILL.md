---
name: bestiary-design
description: The Mossy Bestiary design system for Credit Creatures. Use for any screen, CSS, artwork, layout or student-facing copy work, including restyling a screen, adding a new side quest UI, or writing naturalist voice lines.
---

# The Mossy Bestiary

The app is the naturalist's field guide to Coinhaven's creatures. Screens are pages and spreads of that book, not app panels. The kingdom, the map and Sage stay. A deadpan naturalist narrates creature and choice text. Full system: `DESIGN.md`. Examples to copy from: `js/ui/screens/creature.js` (spread), `dream.js` (sheet), `garage.js` (bays), `alley.js` (night ground), with `css/bestiary.css` (one section per screen, at the end of the file).

## How a screen joins the look
- Wrap the screen: `root.append(h("div.bestiary.bst-<name>", panel))`, then style its existing classes under `.bst-<name>` in a new section of `css/bestiary.css`.
- Tokens apply under `.bestiary` and `.bst-scope` (the top bar, pop-ups, the teacher page body).
- Don't give two screens in a row the same skeleton (spread, sheet, cards, night ground, index cards and so on).

## Tokens (in `css/tokens.css`, never raw colors)
- Ground: moss `--b-ground`, `--b-ground-deep`, text on it `--b-on-ground`, `--b-on-ground-soft`.
- Paper: grey-green herbarium `--b-paper`, `--b-paper-2`, `--b-paper-edge`, `--b-paper-insert` (never cream). Ink: `--b-ink`, `--b-ink-soft`. Rules: `--b-rule`.
- Meaning: rust `--b-rust` seals decisions (`--b-rust-ink` as text). Plum `--b-plum` marks what's chosen. Gold `--b-gold` is money and XP (`--b-gold-ink` on paper). Foxfire `--b-foxfire` is a creature's glow, on the dark ground only. Real objects that look the same in dark mode use fixed inks like `--b-money-ink`.
- Type: `--b-display` IM Fell English (headings), `--b-body` Alegreya (reading), `--b-hand` Patrick Hand (margin notes only). Ramp: `--b-fs-tiny`, `--b-fs-ui`, `--b-fs-hand`, `--b-fs-title`, `--b-fs-lead`, plus `--b-text` and `--b-small`. Dyslexia mode swaps all fonts to OpenDyslexic.
- Space `--b-s1` to `--b-s6`. Radii `--b-r-paper`, `--b-r-tag`, `--b-r-sheet`, `--b-r-insert`, `--b-r-round`, `--b-r-blob`. Shadows `--b-shadow-page`, `--b-shadow-card`, `--b-shadow-lift`. Textures `--b-grain`, `--b-fibers`, `--b-foxing`. Motion: `--ease-*` springs, `--b-settle`, `--b-quick`.
- Plum and moss-3 flip to light or dark in dark mode. Check text on them in both modes (use `--b-paper` text on plum).

## Drawn pieces
`js/ui/bestiary-art.js`: pin, tape, string tag, fern, moss, wax seal (`sealSvg`), ink stamp (`inkStampSvg`), ink ring, peg, string line, rides (`rideSvg`). Creatures: `creatureSvg` from `js/ui/creature-art.js`, with idle hooks styled only under `.bestiary`. Big actions are wax-seal buttons (`.bst-seal-btn`). A plain `<button>` on a bestiary page is a rust ribbon. `button.secondary` is a plum outline.

## Voice
A dry, affectionate field naturalist: understated, specific, a little wry, never sarcastic at the player. Bad choices get gentle, funny consequences, never shame. Financial terms stay accurate and plain, and whimsy never replaces clarity. Plain words for a 15-year-old, no em-dashes, no semicolons. Write new lines rather than reusing examples. Buttons name their action ("Adopt Pebble"), and errors name the problem and the fix.

## Avoid
Never name "the naturalist" (or any narrator) in student-facing text (teacher request 2026-10-26: no one knows who that is). The voice stays, the character never appears. 
A cream ground with an indigo accent. Eyebrow labels (small caps above a heading). Uniform rounded cards with hairline borders, or one card repeated. Thick colored side stripes on cards. Inter, Roboto, system fonts, Fraunces, Fredoka, Baloo, Nunito, Quicksand, Poppins. Purple or blue gradients, glassmorphism, generic icon sets, emoji as icons. Centered step-wizard boxes. Bland microcopy ("Get started"). Color alone for any state: pair it with a word, an icon or a shape ("chosen" written under it, focus as a dashed trace).

## Do
Break the grid on purpose (tilts, overlaps, margin notes, asymmetric spreads). Use texture and authored SVG. Give motion weight and a small overshoot, with one authored entrance per screen, and make everything go still under Calm motion (`:root[data-motion="calm"]`) and reduce motion. Turn off tilts and italics in dyslexia mode (`:root[data-reading="dyslexia"]`). Check AA contrast over textures (measured ratios are in tokens.css).

## Verify
Screenshot the screen at 1440 in light and dark, plus 1280 in dyslexia mode (see the `test-game` skill), and fix overlaps or contrast before reporting. No phone layout without the teacher's OK.
