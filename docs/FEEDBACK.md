# Built-in feedback and tuning system (approved 2026-10-19)

## Context

The current plan has no automatic way to collect feedback. SPEC §8, §19 and §22 all say to "tune in the pilot": 5 decision cards per month, 3 to 4 minutes per month, $40 to $120 per shift, the 15-minute session, and a "$600 want every couple of chapters." Phase 9 (the pilot, Phase 8 before 2026-10-20) just says "tune numbers." As written, that would mean watching students and asking them questions. The teacher wants feedback collected automatically, inside the game.

Goal: every play session automatically produces tuning data. Students can flag problems in one tap. The teacher sees the results in a tuning view. Claude can turn an export into concrete config changes, checked by replaying real students' lives under the new numbers.

Constraints:
- Firebase Spark free plan (50k reads, 20k writes and 1 GiB per day).
- Store only "name, school email and game data" (SPEC §21).
- No build step.
- The engine stays pure.

## What gets built (folded into Phases 3 to 8, not a new phase)

### 1. Automatic play telemetry (no student effort)
A new `js/telemetry.js` module (browser side) collects events in memory and flushes them in one Firestore write at each End Month and on Save and Quit. Those are the same moments the autosave already writes, so it costs about 1 extra write per game month.

| What | Why it tunes something |
|---|---|
| Real minutes per game month, per chapter, per session. Where students stop | Tests the 3–4 min/month target, the 5 cards/month setting and the 15-minute session (§22.5) |
| Each Decision card: shown, choice picked, time to decide | Shows which cards always get the same answer (no real choice) and which are slow or confusing |
| End Month snapshot: score, delta, factor, checking, utilization, debt, fees paid | Real score distribution vs the 1,000-life sim. Shows whether the economy is too tight or too loose |
| Minigame results: score, pay, duration, retries | Pay balance against the $40–120 range and the "$600 want" target |
| Practice Desk / Factor Check: question type, standard, correct, seconds | Shows question types that are too hard or too easy |
| Shop: item, price, payment method | Shows whether students can afford wants, and BNPL and credit usage |
| Arcade shifts (GAME-SPECS.md games, 2026-10-26): each game logs its key choices through `ctx.track`, for example `skillMoment` (game, right), Money Tree `treeSplit`, `treeWater`, `treeCrash`, and Move-In Day `moveinSort`, `moveinSchool`, `moveinInspect`, `moveinApply`, `moveinFlag`, `moveinSign`, `moveinPhotos`, `moveinEvent`. The runner adds the shift result, mode and why answer | Shows which choices students get wrong, where they panic-sell or skip inspections, and whether pay is balanced across games |
| JS errors (`window.onerror`) with screen name, seed and engine version | Bugs reported without anyone filing them |

Storage:
- `telemetry/{uid}/months/{n}`: one doc per game month.
- `telemetry/{uid}`: a small rollup doc with running averages, updated in the same batch. The teacher view reads only rollups, which is about 25 reads per load instead of thousands.

### 2. One-tap student reactions (seconds of effort)
- **After each Decision card and minigame:** an optional 👍 / 😐 / 👎 plus a "This was confusing" chip. It's small, skippable, and logged into the same month flush.
- **Chapter summary:** the reflection screen (already in SPEC §9) adds a 1–5 "How fun was this chapter?" and "How clear was it?" rating.
- **A "🐞 Something's wrong" button on every screen.** It saves the current screen, seed, engine version, the last 20 actions and an optional short note. Because the engine replays exactly from a seed (Phase 2), Claude can reproduce the exact bug from that report.

Free text is limited to the bug note and the reflections, and is visible only to teachers. Students are told not to type personal info.

### 3. Tuning view on the teacher dashboard (Phase 7)
A **Tuning** tab next to the roster:
- Minutes per month vs the target band.
- Choice splits per Decision card, with lopsided ones highlighted.
- Most-flagged "confusing" cards and screens.
- Minigame pay distribution.
- Practice Desk accuracy by question type.
- Class score histogram next to the sim's histogram.
- Fun and clarity ratings by chapter.
- A bug report list.
- One button: **Export tuning data** (JSON).

### 4. Closing the loop with Claude (Phase 9, the pilot)
- `npm run tuning-report -- export.json` prints:
  - each tunable number,
  - what the real data says,
  - a suggested new value with the reason. For example: "Months average 6.1 min. Suggest 4 decision cards per month."
- `npm run replay -- export.json` re-runs every real student's action log through the engine with a candidate `config.js`, then prints how the class's scores, fees and debt would shift. This is the existing `life.log` plus the seed. Tuning is then tested against real play, not only bots.
- Settings that live in the class doc (months per chapter, cards per month, Sparkle caps) can be changed from the dashboard with no redeploy.

## Phase-by-phase placement
- **Phase 3:**
  - `js/telemetry.js` (queue, flush, error capture, session timer).
  - The 🐞 button.
  - Logging for onboarding and Design Your Card (time on screen, how many redesigns before applying, applications sent).
  - Firestore rules for `telemetry/{uid}` and `feedback/{id}`: create only, own uid, no student reads.
- **Phase 4:** card shown, choice and timing. Month and chapter timing. Card reactions. Fun and clarity ratings on the chapter summary.
- **Phase 5:** Practice Desk and Factor Check answer logging.
- **Phase 6:** minigame and shop logging. Minigame reactions.
- **Phase 7:** Tuning tab, rollup reads, JSON export. Teacher-editable class settings.
- **Phase 9 (pilot):** `scripts/tuning-report.js`, `scripts/replay.js`. One tuning pass after the first week of pilot play.

## Critical files
- New: `js/telemetry.js`, `js/ui/bug-button.js`, `scripts/tuning-report.js`, `scripts/replay.js`.
- Changed: `firestore.rules`, `teacher/index.html` (Phase 7 Tuning tab), `docs/PROGRESS.md` (add this plan to the Phase 3–8 notes and decisions), `CLAUDE.md` (one rule: every new screen and choice logs telemetry).
- Reused:
  - `life.log` and `seed` from `js/engine/life.js` (action log for replay).
  - `endMonth` events from `js/engine/month.js` (snapshot data).
  - `simulateLives`/`summarize` from `tests/sim/simulate.js` (sim vs class comparison).

## Quota check
25 students × about 8 game months per class day × 2 writes (save plus telemetry) is about 400 writes a day, plus a few reaction and bug writes. That is well under 20k. The teacher view reads about 25 rollups per load.

## Verification
- Unit tests for the telemetry queue (batching, flush on save, sizes stay small) and for `tuning-report`/`replay` on a fixture export. Replaying a real log with an unchanged config must reproduce the same final score.
- Manual checks:
  - Play 2 months locally and confirm `telemetry/{uid}/months/0..1` and the rollup appear.
  - Tap 🐞 and confirm a `feedback` doc with seed and actions appears.
  - In the Rules Playground, confirm a student can't read another student's telemetry.

## Replay requirement for the engine

`scripts/replay.js` needs each life to be rebuildable from its seed and its action log. Before Phase 4, make sure that:

- every engine action logs its exact arguments in `life.log`,
- End Month is logged as an action too,
- a test replays a simulated life from its seed and log alone, and reaches a byte-identical life.

Add this in Phase 3, when the UI starts calling the engine.
