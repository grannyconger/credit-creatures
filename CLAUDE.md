# Credit Life

A classroom game where students raise a fantasy creature through its credit life. `SPEC.md` is the single source of truth. Read it before planning any phase.

## Rules

- Build one phase at a time. Stop at the end of each phase and wait for approval. Commit at the end of every phase.
- No framework, no build step. Plain HTML, CSS and JavaScript ES modules served as-is by GitHub Pages.
- Relative paths only. Everything must work under the `/credit-life/` subpath.
- The engine (`js/engine/`) is pure JS: no DOM, no `window`, no Firebase. Deterministic given a seed. Tested in Node.
- All tunable numbers live in `js/data/config.js`. Scenarios and products live in data files, never in engine code.
- No secrets in the repo. The Firebase web config is public by design. Security comes from Firestore rules.
- Do not touch the separate Credit Quest project or repo.
- Student-facing text: plain language for a 15-year-old with no credit knowledge. No em-dashes, no semicolons.
- Real brand names are fine. Real logos are never fine. Use the emoji map in SPEC §4.
- Follow the conflict defaults in SPEC §22 and mention them at the start of the phase they affect.
- Sign-in is school-only (`@greermiddlecollege.org`). Firestore rules are the real gate.

## Build phases (SPEC §23)

| Phase | Scope |
|---|---|
| 1 | Setup: repo, Firebase wiring, hello page live with school-only Google sign-in |
| 2 | Engine: accounts, month loop, score model, approvals, collections, 1,000-life sim tests |
| 3 | Onboarding: profile, creature creator, class codes, age 16 options, tutorial, Design Your Card |
| 4 | Simulation: hub, month loop, life events, ~20 scenarios, chapters, chapter release, reflections |
| 5 | Account Management: wallet, statements, bills, AutoPay, My Score, report, Practice Desk, inbox, themes, Sparkle Points |
| 6 | Economy and engagement: Ledger Sort, Cashier Rush, shop, BNPL checkout, 40+ achievements, XP, ranks, leaderboard |
| 7 | Teacher: dashboard, roster, controls, CSV export, rules hardening |
| 8 | Pilot: one class plays, tune numbers, add remaining content |

**Current phase:** 1 (built, awaiting Firebase config and approval). The approved plan for Phases 1 and 2 is in `~/.claude/plans/hidden-splashing-micali.md`.

## Run locally

```
python3 -m http.server 8000
```
Open http://localhost:8000/ (`localhost` is an authorized Firebase domain by default).

## Tests

- `npm test` runs `node --test` (engine unit tests plus the simulation assertions).
- `npm run sim` prints the 1,000-life score distribution report.

## Deploy

Push to `main` on `grannyconger/credit-life`. GitHub Pages serves it at https://www.coachw.club/credit-life/ (bare coachw.club redirects to www). Firebase setup steps: `docs/setup-firebase.md`.
