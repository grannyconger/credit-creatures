# Credit Life

A classroom game where students raise a fantasy creature through its credit life. `SPEC.md` is the single source of truth. Read it before planning any phase.

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
- Real brand names are fine. Real logos are never fine. Use the emoji map in SPEC §4.
- Feedback is built in (`docs/FEEDBACK.md`). Every new screen, choice, minigame and question logs telemetry through `js/telemetry.js`. Never ask students for personal info.
- Sign-in is school-only (`@greermiddlecollege.org`). Firestore rules are the real gate. Any rules change must be pasted into the Firebase console by the teacher (give click-by-click steps).

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
