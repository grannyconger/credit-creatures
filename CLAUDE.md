# Credit Creatures

A classroom personal-finance game. Each student is the Guardian of Coin for a fantasy creature in the Kingdom of Coinhaven, and their money choices shape its credit life and its dream. Home is `#/hub`, the Creature Cottage room (click glowing objects to go places). A persistent shell wraps every screen: the top bar has chapter progress, Coins, Energy, XP, streak, Wallet and Leaderboard, and the bottom bar has the creature, the Dock, today's challenges, Home, Arcade and Market shortcuts and Things To Do (press T). The kingdom map is `#/map`, now one tile in Things To Do. Student-facing names: the Market (route `shop`) and the Arcade (route `guild`). The UI plan is in `docs/UI-REBUILD.md`.

- `SPEC.md` is the source of truth. Read the relevant section before planning a phase.
- `docs/PROGRESS.md` has the current status, open decisions and the next step.
- `docs/STANDARDS.md` has the course standards (SC Personal Finance 5141, A to G). The game's "Std 1, 2, 3, 5" are D1, D2, D3 and D5.
- `docs/MINIGAMES.md` (side quests) and `docs/MODES.md` (Quest and Battle modes, a draft) hold the game plans.

## Resuming work ("keep going")
1. Read `docs/PROGRESS.md`, then run `npm test` to confirm the baseline is green.
2. If a phase is **awaiting approval**, "keep going" approves it. List its open decisions with their defaults in one short message, then continue with those defaults.
3. Start each phase with a short plan (note any SPEC §22 defaults it touches). End with the PROGRESS.md checklist, commit and push, then stop for approval, unless the teacher has asked for larger chunks without stopping.

## Architecture rules
- No framework, no build step, no TypeScript. Plain HTML, CSS and JavaScript ES modules served as-is by GitHub Pages. Firebase SDK from the gstatic CDN (pinned 12.19.0). Never `npm install` runtime dependencies. Dev tools (Playwright) are fine.
- Relative paths only. Everything must work under the `/credit-creatures/` subpath.
- `js/engine/` is pure JS: no DOM, no `window`, no Firebase, deterministic given a seed, tested in Node. UI code imports only from `js/engine/index.js`.
- Engine actions return `{ life, ok, message }` and never change their input. Append-only lists (log, history, statements, inquiries) are shared between copies, so never edit an entry after it's pushed.
- Money changes go through engine actions so the activity log and `replayLife` stay correct.
- Every tunable number lives in `js/data/config.js`. Scenarios, products and game content live in data files, never in engine code.
- Telemetry: every new screen, choice, minigame and question logs through `js/telemetry.js` (`docs/FEEDBACK.md`). Never ask students for personal info.

## Security
- No secrets in the repo. The Firebase web config is public by design. Firestore rules (`firestore.rules`) are the real gate.
- Sign-in is school-only (`@greermiddlecollege.org`). Teachers and the admin are listed in `js/firebase-config.js` and in the rules.
- Never change production Firebase data, auth settings or rules yourself. Any rules change is pasted into the Firebase console by the teacher (give click-by-click steps).
- Only generated SVG goes through `h(..., { html })`. Student-typed text is always set as text, never as HTML.
- `pilot-data/` and `docs/tuning v1/` hold student data and are gitignored. Never commit them. Don't touch the separate Credit Quest project.

## UI and writing
- The look is the Mossy Bestiary, a naturalist's field guide. For any screen or CSS work, use the `bestiary-design` skill (tokens, drawn pieces, voice, do and avoid).
- Style only with tokens from `css/tokens.css` (never raw colors), so light, dark and dyslexia modes keep working. Use `icon()` from `js/ui/icons.js` for UI icons, never emoji. Never use color alone for a state.
- Student-facing text: plain language for a 15-year-old with no credit knowledge. No em-dashes, no semicolons.
- Real brand names are fine. Real logos never are.
- Desktop first. No phone-layout work without the teacher's explicit OK.

## Run, test, deploy
- Local server: `python3 -m http.server 8000`.
  - Game: http://localhost:8000/?local (no sign-in, saves to localStorage, class code `TEST01`).
  - Teacher page: http://localhost:8000/teacher/?local. Admin page: http://localhost:8000/admin/?local.
- `npm test`: engine unit tests plus the 1,000-life simulation, under 1 second. Run it after any JS change.
- `npm run e2e`: Playwright smoke tests in `e2e/` (new student to Home, every screen, the teacher page, projector, admin). Use the `test-game` skill to decide what to run.
- `npm run sim`, `npm run tuning-report -- pilot-data/<file>.json`, `npm run replay -- pilot-data/<file>.json --set k=v`: tuning tools.
- Deploy: push to `main` on `grannyconger/credit-creatures` (gh is logged in). GitHub Pages serves https://www.coachw.club/credit-creatures/ within a couple of minutes. A GitHub Actions check (`.github/workflows/e2e.yml`) runs both on every push. Firebase project: `credit-life-38e4a` (`docs/setup-firebase.md`).

## Working efficiently
- Default to Sonnet. Switch to Opus (`/model opus`) only for hard design or architecture problems or tricky debugging.
- Read only the files and line ranges a task needs. Use `grep` to find code, not whole-repo scans. Don't re-read a file you just edited.
- Use subagents only for genuinely parallel or isolated investigation.
- Test in proportion to the change (see `test-game`): `npm test` for logic, one targeted browser check for a screen, the full e2e suite before a big push.
- Keep tool output short (`tail`, `grep`, `head`) and final reports brief: what changed, what was verified, what the teacher needs to do.
- Use MCP tools and connectors only when the task needs them.
