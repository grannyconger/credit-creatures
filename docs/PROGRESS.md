# Progress and handoff

Update this file at the end of every phase (and whenever a decision is made) so the next session can resume from here alone.

Last updated: 2026-10-20

## Status

- **Phase 1: done, approved.** Live at https://www.coachw.club/credit-life/.
- **Phase 2: done, approved** (2026-10-20, "pick up where we left off").
- **Phase 3: done, awaiting approval.** 82 tests pass. The full onboarding was clicked through in headless Chrome at 1280px and 390px in `?local` mode (both the parent card path and the debit-only path, approved and denied).
- **Teacher action needed before students can play:** publish the new `firestore.rules` (steps in `docs/setup-firebase.md`, section 8). Then create a class on `/teacher/` to get a join code.
- **Next step:** get Phase 3 approval, then plan and build Phase 4.

## Open decisions (ask once, then use the default)

1. **First-score height.** Careful players get about 757 at 6 months and 774 at 12 months. A responsible parent's card now also gives about 819 at age 18 (average parent 776, maxed 593, no parent: no score). "Score 700/750" achievements (Phase 6) would come almost instantly. **Default: leave as is.** To lower it, raise `score.lengthCurvePower` in `js/data/config.js`, then rerun `npm run sim`.
2. **Phase 4: replay rules for earlier chapters** (SPEC §5). **Default:** replay runs on a throwaway copy of the save from that chapter's start. Nothing is written back.
3. **Phase 4: "Previously on..." recap.** **Default:** built from the last chapter's saved month records and score history, with no extra storage.

## Decisions already made

- The GitHub account is `grannyconger`. Its Pages CNAME is `www.coachw.club`, so the authorized domains include both `www.coachw.club` and `coachw.club`.
- The Firebase project is `credit-life-38e4a` on the Spark plan, owned by the teacher's personal Google account (the school account could be added as an owner later). Firestore is in us-east1.
- No npm runtime dependencies. The Firebase SDK comes from the CDN. `package.json` has only scripts.
- **Phase 2 engine defaults** (announced and accepted):
  - The time step is 1 game month. A statement closes at End Month M and is due at End Month M+1.
  - AutoPay runs at step 0 (the due date), before the statement closes.
  - An unpaid minimum is reported 30, then 60, then 90 days late, then goes to collections at 120 days (4 missed cycles).
  - Grace period: no interest if the previous statement was paid in full.
  - BNPL: 25% at checkout, then 50% at this month's End Month and 25% at the next. $7 late fee for each missed installment. Never reported unless it goes to collections.
  - Federal student loan: subsidized-style. No interest while in school, and repayment starts 6 months after `leaveSchool`.
  - A debit purchase with too little in checking is declined. An automatic payment (AutoPay, loan, BNPL, bill) that can't be covered bounces with a $35 overdraft fee, and checking can go negative.
  - Closed cards drop out of the length factor (SPEC §11 "your oldest account disappears").
  - Cards in collections count in utilization at their unpaid balance.
  - Premium cards: odds are 0 with no score, and very low under 24 months of history. If approved, a premium card acts as a normal card.
  - Payday loans, title loans, rent-to-own and store cards are not accounts. They come in Phase 4 as one-time Decision cards.
- **Built-in feedback and tuning** (approved 2026-10-19): automatic play telemetry, one-tap student reactions, a 🐞 bug button with seed for replay, a teacher Tuning tab, and Phase 8 `tuning-report`/`replay` scripts. Full design in `docs/FEEDBACK.md`. It's built inside Phases 3 to 8, not as a separate phase.
- **Brands:** the credit union is "Market Village Credit Union" 🤝. Product names are in `js/data/products.js`.
- **Phase 3 defaults** (announced 2026-10-20):
  - Class codes come from a minimal "Create class" form on `/teacher/`. Phase 7 builds the full dashboard around it.
  - Age 16 to 18: 2 guided tutorial months, then `timeSkip()` runs the other 22 months with part-time pay and spending (`CONFIG.onboarding`). A parent's card builds history during the skip.
  - Students must pick at least one teen option (a parent's card, a teen debit card, or both).
  - The tutorial shift is a 4-item asset/liability sort, a small preview of Ledger Sort (Phase 6).
  - Bills (phone $45, bus pass $30) start when Chapter 1 ends.
  - After a denial, students can redesign and reapply or keep going without a card.
  - Premium cards are almost always denied with no history (SPEC §22.2).
- **Replay:** every engine action logs `{ month, action, args }` with its exact arguments, End Month included. `life.start` holds how the life began. `replayLife(start, log)` rebuilds a byte-identical life (`tests/replay.test.js`).
- **Saves:** `saves/{uid}` stores the life as a JSON string (`lifeJson`) plus summary fields (score, month, step) for the Phase 7 roster. It saves at every step, every End Month, and on Save and Quit.
- **Telemetry:** `telemetry/{uid}/events/{autoId}` (one doc per flush, not per month as FEEDBACK.md first said, because flushes happen at every save and create-only rules forbid overwriting) plus the `telemetry/{uid}` rollup (merge with increments).
- **Display name:** Google's name goes in `googleName`. `displayName` is the student's own choice and sign-in no longer overwrites it.

## Code map

| Path | What it is |
|---|---|
| `index.html` | App shell: top bar, `#app` root, loads `js/app.js` |
| `js/app.js` | Boot, sign-in (or `?local`), hash router with step guards, Save and Quit, session nudge |
| `js/game.js` | The student's game: profile, save, `STEPS`, `persist()` (save plus telemetry flush) |
| `js/db.js` / `js/db-local.js` | Firestore reads and writes / the same API on localStorage for `?local` |
| `js/telemetry.js` | Event queue, `track`, `screenView`, `flush`, error capture, 15-minute nudge |
| `js/ui/dom.js` | `h()` element builder, money and age formatting, toasts |
| `js/ui/creature-art.js` | Original SVG creatures (4 species), palettes and accessories |
| `js/ui/card-art.js` | Credit card preview with emoji brands |
| `js/ui/bug-button.js` | 🐞 button and dialog, writes `feedback/{id}` |
| `js/ui/month-summary.js` | "Month N is over" card from End Month events |
| `js/ui/screens/*.js` | One module per step: profile, creature, join, teen, tutorial, skip, networks, design, result, done, saved |
| `teacher/index.html` | Teacher access check, class list and "Create class" |
| `js/firebase-config.js` | Public web config, `SCHOOL_DOMAIN`, `TEACHER_EMAILS` |
| `js/firebase.js` / `js/auth.js` | SDK init. `signIn`, `signOut`, `onUser`, `isSchoolUser`, `isTeacher` |
| `firestore.rules` | users, saves, classes, classCodes, telemetry, feedback. Everything else denied |
| `js/data/config.js` | Every tunable number (now with `onboarding`) |
| `js/data/products.js` | Issuers, networks, products, offers, card designs |
| `js/data/creatures.js` / `js/data/onboarding.js` | Creature options / onboarding text (shift items, factor tour, network slides) |
| `js/engine/index.js` | Public engine API (import from here only) |
| `js/engine/life.js` | `createLife`, `copyLife`, `logAction`, helpers |
| `js/engine/accounts.js` | Player actions |
| `js/engine/approval.js` | `quoteApplication` and `applyForCard` |
| `js/engine/month.js` | `endMonth(life)` |
| `js/engine/onboarding.js` | `getTeenDebitCard`, `tutorialShiftPay`, `timeSkip` |
| `js/engine/replay.js` | `replayLife(start, log, upTo)` |
| `js/engine/report.js`, `score.js`, `payoff.js` | Report, score, payoff math |
| `tests/` | Unit tests. `tests/sim/` has the bots and the §24 assertions |
| `scripts/sim-report.js` | `npm run sim` |

## Latest simulation (`npm run sim`, 1,000 lives, ages 18 to 22)

| Play style | Median | 700+ | Under 600 | Collections |
|---|---|---|---|---|
| Careful | 817 | 100% | 0% | 0% |
| Average | 746 | 70% | 14% | 6% |
| Minimum payer | 660 | 30% | 10% | 0% |
| Reckless | 455 | 0% | 100% | 93% |
| Never pays | 422 | 0% | 100% | 100% |

## Phase 4 starting notes (not yet planned in detail)

Scope from SPEC §5, §8, §9, §13:
- The hub replaces `done.js` as the home screen after Chapter 1. Add `"hub"` (and month and chapter screens) after `"done"` in `STEPS`, or switch the router to a hub mode once `ob.chapter1Done` is true.
- Students can't play past `classes/{classId}.releasedChapter`. Phase 4 needs a minimal "Release next chapter" button on `/teacher/` (rules already allow the class owner to update the class).
- Month loop: a life card, up to 5 decision cards, work shifts (placeholder pay until Phase 6), End Month with `monthRecord`/`monthSummary`, and a save each month.
- Scenarios go in `js/data/scenarios.js`, one object per scenario with standards tags and a `fits(life)` check. Payday, title, rent-to-own and store card stay as one-time cards.
- Telemetry: card shown, choice and time to decide, 👍/😐/👎 reaction, month and chapter timing, fun/clarity ratings on the chapter summary.
- Reflections: save to the student's save doc (or a `reflections/{id}` collection with rules) so the teacher can read them in Phase 7.

## End-of-phase checklist

1. `npm test` is green, and `npm run sim` still meets the §24 targets if engine numbers changed.
2. Check the live site after pushing (the files load under `/credit-life/`).
3. If `firestore.rules` changed, give the teacher click-by-click console steps.
4. Every new screen, choice, minigame and question logs telemetry as listed in `docs/FEEDBACK.md`.
5. Update this file (status, decisions, code map, next step) and the status column in `CLAUDE.md`.
6. Commit with a "Phase N: ..." message, push, and stop for approval.
