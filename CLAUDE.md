# Credit Creatures

A classroom game (formerly Credit Life) where students are the Guardian of Coin for a fantasy creature in the Kingdom of Coinhaven. Their money choices shape its credit life and decide whether its dream comes true. Home (`#/hub`) shows the creature, the next step and the places that need you. The illustrated kingdom map has its own page (`#/map`), opened from the top bar, and every place comes back to it. The top bar always has the chapter's progress, Home, Map, Wallet and Leaderboard. `SPEC.md` is the single source of truth. Read it before planning any phase.

## Resuming work ("keep going", "pick up where you left off")

1. Read `docs/PROGRESS.md`. It has the current status, open decisions and the exact next step.
2. Run `npm test` to confirm the baseline is green.
3. If a phase is marked **awaiting approval**, the user saying "keep going" counts as approval. List the open decisions from PROGRESS.md with their defaults in one short message, then start the next phase using those defaults unless the user says otherwise.
4. Start each phase with a short plan, and mention any SPEC §22 defaults it touches. End each phase with the checklist in PROGRESS.md, then stop and wait.

## Rules

- Build one phase at a time. Stop at the end of each phase and wait for approval. Commit and push at the end of every phase.
- No framework, no build step. Plain HTML, CSS and JavaScript ES modules served as-is by GitHub Pages. Firebase SDK comes from the gstatic CDN (pinned 12.19.0). Never `npm install` runtime dependencies.
- Relative paths only. Everything must work under the `/credit-creatures/` subpath.
- The engine (`js/engine/`) is pure JS: no DOM, no `window`, no Firebase. Deterministic given a seed. Tested in Node.
- Engine actions return `{ life, ok, message }` and never change their input. Entries in append-only lists (log, history, statements, inquiries) are shared between copies, so never edit one after it is pushed. UI code imports only from `js/engine/index.js`.
- All tunable numbers live in `js/data/config.js`. Scenarios and products live in data files, never in engine code.
- No secrets in the repo. The Firebase web config is public by design. Security comes from Firestore rules.
- Do not touch the separate Credit Quest project or repo.
- Student-facing text: plain language for a 15-year-old with no credit knowledge. No em-dashes, no semicolons.
- Style with the tokens in `css/tokens.css` (never raw colors) so light, dark and dyslexia modes keep working. Use `icon()` from `js/ui/icons.js` for UI icons. Never use color alone for a state.
- Real brand names are fine. Real logos are never fine. Use the emoji map in SPEC §4.
- Feedback is built in (`docs/FEEDBACK.md`). Every new screen, choice, minigame and question logs telemetry through `js/telemetry.js`. Never ask students for personal info.
- Sign-in is school-only (`@greermiddlecollege.org`). Firestore rules are the real gate. Any rules change must be pasted into the Firebase console by the teacher (give click-by-click steps).

## Design world: The Mossy Bestiary (2026-10-21, adoption screen only until the teacher approves a rollout)

The app is the naturalist's field guide to Coinhaven's creatures. Screens are pages and spreads of that book, not app panels. The kingdom, the map and Sage stay. The bestiary is the look, and a deadpan naturalist narrates creature and choice text. Live example: `js/ui/screens/creature.js` with `css/bestiary.css`. Direction contract: `.impeccable/surfaces/js-ui-screens-creature-js.md`.

- **Tokens:** the `.bestiary` block in `css/tokens.css` (all `--b-*`, plus `--sp-<species>` accents). They're scoped to `.bestiary` for now, and on rollout they move up to `:root`. Never use raw colors in bestiary CSS.
  - Ground: moss `--b-ground` #2F4A3A, `--b-ground-deep`. Paper: grey-green herbarium `--b-paper` #D9DEC8 (never cream), `--b-paper-2`, `--b-paper-edge`. Ink: `--b-ink` #1B2420, `--b-ink-soft`.
  - Meaning: rust `--b-rust` #B5532E seals decisions (`--b-rust-ink` when it's text), plum `--b-plum` #5B2A4E marks what's chosen, gold `--b-gold` #D9A441 is money and XP (`--b-gold-ink` on paper), and foxfire `--b-foxfire` #C8E04B is a creature's glow, used on the dark ground only.
  - Type: `--b-display` IM Fell English (headings, specimen names), `--b-body` Alegreya (reading, at 1.1875rem), `--b-hand` Patrick Hand (margin notes only). All are self-hosted in `fonts/` with OFL files. Dyslexia mode swaps all three to OpenDyslexic.
  - Space `--b-s1` to `--b-s6`. Imperfect radii `--b-r-paper`, `--b-r-tag`, `--b-r-blob`. Offset soft shadows `--b-shadow-page`, `--b-shadow-card`, `--b-shadow-lift`. Textures `--b-grain`, `--b-fibers`, and the magnifier cursor `--b-cursor-lens`. Motion uses the `--ease-*` springs, with `--b-settle` and `--b-quick`.
- **Drawn pieces:** `js/ui/bestiary-art.js` (pin, tape, string tag, fern, moss, wax seal, ink stamp, ink ring). Creatures get idle hooks in `js/ui/creature-art.js` (`.cc-eyes`, `.cc-lantern`, `.cc-puddle`, `.cc-spark`, `.cc-crest`, `.cc-twinkle`, `.cc-facet`, `.cc-wing`), styled only under `.bestiary`. Use `icon()` for UI icons, never emoji.
- **Voice:** a dry, affectionate field naturalist. It's understated, specific and a little wry, and never sarcastic at the player. Bad choices get gentle, funny consequences, never shame. Financial terms stay accurate and plain, and whimsy never replaces clarity. The house rules still hold: plain words for a 15-year-old, no em-dashes, no semicolons. Write new lines rather than reusing examples. Buttons name their action ("Adopt Pebble", "Suggest one"), and errors name the problem and the fix.
- **AVOID:** a cream ground with an indigo or purple accent. Eyebrow labels (small tracked caps above a heading, like the old "Step 2: your creature"). Uniform rounded cards with hairline borders, or the same card repeated. Inter, Roboto, system fonts, Fraunces, Fredoka, Baloo, Nunito, Quicksand, Poppins. Purple or blue gradients, glassmorphism, generic icon sets, emoji as icons. Centered step-wizard boxes on every screen. Bland microcopy ("Make it yours", "Get started"). Color alone for any state: pair it with a word, an icon or a shape (for example "chosen" is written under the chosen specimen, and focus is a dashed trace, not a solid ring).
- **DO:** break the grid on purpose (tilts, overlaps, margin notes, asymmetric spreads), and don't give two screens in a row the same skeleton. Use texture and authored SVG. Motion should have weight and a small overshoot, with one authored entrance per screen, and everything goes still under Calm and reduce motion. Check AA contrast over textures (the measured ratios are listed in tokens.css).

## Build phases (SPEC §23, renumbered 2026-10-20: social is Phase 8, the pilot is Phase 9)

| Phase | Scope | Status |
|---|---|---|
| 1 | Setup: repo, Firebase wiring, hello page with school-only sign-in | Done, approved |
| 2 | Engine: accounts, month loop, score, approvals, collections, 1,000-life sim | Done, approved |
| 3 | Onboarding: profile, creature creator, class codes, age 16 options, tutorial, Design Your Card, saving | Done, approved |
| 4 | Simulation: hub, month loop, life events, ~20 scenarios, chapters, chapter release, reflections | Done, approved |
| 5 | Account Management: wallet, statements, bills, AutoPay, My Score, report, Practice Desk, inbox, themes, Sparkle Points | Done, approved |
| 6 | Economy and engagement: Ledger Sort, Cashier Rush, Check Writer, shop, BNPL checkout, 40+ achievements, XP, ranks, leaderboard | Done, approved |
| 7 | Teacher: dashboard, roster, controls, CSV export, Tuning tab, rules hardening (plus unlock pop-ups, local credit unions, signature font) | Done, approved |
| 8 | Social and customization: friend requests, friend groups, gifts every 40 hours, bigger creature customizer | Done, approved |
| 9 | Pilot: one class plays, tune numbers, add remaining content | Built, waiting for pilot data (docs/PILOT.md) |
| Redesign | Design system (tokens, dark, dyslexia, icons, shiny cards), story intro, dreams, illustrated kingdom hub | Done |
| 10 | Progressive unlocks: piggy-bank prologue, one new account per chapter, Garage, Hall of Records, Sage's lessons (`docs/PROGRESSION.md`) | Done, approved |
| 11 | Fill out the ladder: more Chapter 2 loan cards, Town Hall/Academy/Plaza/pitfalls lessons, locked dream goals say when they open | Done, approved |
| 12 | Lantern Alley: a Chapter 5 place to read the fine print on 10 offers, trap or fair deal, with the real cost worked out | Done, approved |
| 13 | The late game: Chapters 6 to 8 (moving out, setbacks, building your future) with 20 new cards, and the deck reshuffles from Chapter 9 | Done, approved |
| 14 | Teacher view of the new game: Lantern Alley, lessons, dream stage and title-loan columns, and a class table of which traps fool students | Done, approved |
| 15 | Motion: spring physics, boops, page morphs, rolling numbers, a Motion setting, and Fraunces for headings (`docs/MOTION.md`) | Done, awaiting the teacher's review |
| 16 | Particles, sparkles, animated icons, a living map (`docs/MOTION.md`) | Done, awaiting the teacher's review |
| 17 | Detailed storybook creatures, eyes that follow the mouse, blinks and reactions (`docs/MOTION.md`) | Done, awaiting the teacher's review |

## Run locally

```
python3 -m http.server 8000
```
Open http://localhost:8000/ (`localhost` is an authorized Firebase domain).
Open http://localhost:8000/?local to play with no sign-in. It saves to localStorage (`js/db-local.js`) and the class code is `TEST01`. On the hub, a "release Chapter N" link stands in for the teacher's release button.

## Tests

- `npm test` runs `node --test` (engine unit tests plus the 1,000-life simulation assertions, under 1 second).
- `npm run sim` prints the score distribution report by play style.
- `npm run tuning-report -- pilot-data/<file>.json` suggests config changes from a dashboard tuning export.
- `npm run replay -- pilot-data/<file>.json --set <setting>=<value>` re-runs real students' games with new values.
- `pilot-data/` is gitignored. Never commit student data.

## Deploy

Push to `main` on `grannyconger/credit-creatures` (gh CLI is logged in as grannyconger). GitHub Pages serves it at https://www.coachw.club/credit-creatures/ within a minute or two. Firebase project: `credit-life-38e4a`. Setup steps: `docs/setup-firebase.md`.
