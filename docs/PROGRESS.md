# Progress and handoff

Update this file at the end of every phase (and whenever a decision is made) so the next session can resume from here alone.

Last updated: 2026-10-19

## Status

- **Phase 1: done, approved.** Live at https://www.coachw.club/credit-life/. The teacher verified school sign-in, personal Gmail rejection, the `users/{uid}` write and teacher access on `/teacher/`.
- **Phase 2: done, awaiting approval.** 67 tests pass. Commit `467103b`.
- **Next step:** get Phase 2 approval (the user saying "keep going" counts), then plan and build Phase 3.

## Open decisions (ask once, then use the default)

1. **First-score height.** Careful players get about 757 at 6 months and 774 at 12 months. Real first scores are closer to 680 to 720. "Score 700/750" achievements (Phase 6) would come almost instantly. **Default: leave as is.** To lower it, raise `score.lengthCurvePower` in `js/data/config.js` (for example 0.6 to 1.0), then rerun `npm run sim` to confirm the §24 targets still hold.
2. **Phase 3: how class codes exist before the Phase 7 dashboard.** **Default:** add a minimal "Create class" button on `teacher/index.html` that writes a class and shows its join code. Phase 7 builds the full dashboard around it.
3. **Phase 3: getting from age 16 to 18.** **Default:** the tutorial plays a few guided months, then a time-skip screen runs the rest of the months through `endMonth` (so a parent card's history builds up), then Design Your Card at 18.

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

## Code map

| Path | What it is |
|---|---|
| `index.html` | Hello page with sign-in (Phase 3 replaces it with the real app shell) |
| `teacher/index.html` | Teacher access check placeholder |
| `js/firebase-config.js` | Public web config, `SCHOOL_DOMAIN`, `TEACHER_EMAILS` |
| `js/firebase.js` / `js/auth.js` | SDK init. `signIn`, `signOut`, `onUser`, `isSchoolUser`, `isTeacher` |
| `firestore.rules` | Starter rules: only `users/{uid}` for self, school accounts only. Everything else is denied |
| `js/data/config.js` | Every tunable number (fees, score curves, parents, loans, approval) |
| `js/data/products.js` | Issuers, networks, products, offers, card designs |
| `js/engine/index.js` | Public engine API (import from here only) |
| `js/engine/life.js` | `createLife`, `copyLife`, helpers |
| `js/engine/accounts.js` | Player actions: earn, debit/card purchase, pay, AutoPay, close, upgrade, parent card, loans, cosign, BNPL |
| `js/engine/approval.js` | `quoteApplication` (pure, for the live slider) and `applyForCard` |
| `js/engine/month.js` | `endMonth(life)`, which returns `{ life, events, scoreChange }`. Events are typed for the Phase 5 inbox |
| `js/engine/report.js` | `buildReport`, `creditReport` (grid plus helping/hurting callouts), `paymentGrid` |
| `js/engine/score.js` | `computeScore`, `explainChange`, `FACTOR_LABELS` |
| `js/engine/payoff.js` | `minPayment`, `payoffPlan`, `minimumOnlyPlan`, `amortizedPayment` |
| `tests/` | Unit tests. `tests/sim/` has the bots, `simulateLives` and the §24 assertions |
| `scripts/sim-report.js` | `npm run sim` |

## Latest simulation (`npm run sim`, 1,000 lives, ages 18 to 22)

| Play style | Median | 700+ | Under 600 | Collections |
|---|---|---|---|---|
| Careful | 817 | 100% | 0% | 0% |
| Average | 746 | 70% | 14% | 6% |
| Minimum payer | 660 | 30% | 10% | 0% |
| Reckless | 455 | 0% | 100% | 93% |
| Never pays | 422 | 0% | 100% | 100% |

## Phase 3 starting notes (not yet planned in detail)

Scope from SPEC §3, §6, §7 and §21:
- **Flow:** sign-in, then profile (editable display name), then the creature creator, then joining a class with a code. Then the age 16 options (a parent's card and/or a teen debit card), the tutorial months, the lenders-vs-networks explainer (2 to 3 screens), and Design Your Card with the live tradeoff display. Then the approved/denied result with reasons, then save.
- **Suggested shape:** a hash router in `index.html` (`#/creature`, `#/join`, ...), with one module per screen under `js/ui/`. Species art is original inline SVG built from shapes and recolored by palette. Species: moss dragon, lantern fox, crystal owl, puddle golem.
- **Engine hooks already there:** `createLife({ ageMonths: 192 })`, `joinAsAuthorizedUser()` (picks the parent secretly), `earn`, `debitPurchase`, `quoteApplication`/`applyForCard`, `endMonth`. A teen debit card needs only a flag on the life, since checking is not reported.
- **Proposed Firestore shape** (rules must be updated, and the teacher pastes them in):
  - `users/{uid}`: profile, `classId`.
  - `saves/{uid}`: `{ life, creature, chapter, updatedAt }`.
  - `classes/{classId}`: `{ name, teacherEmail, code, releasedChapter, settings }`.
  - `classCodes/{code}`: `{ classId }`.
- **Saving:** at every End Month and on Save and Quit. The life is plain JSON (a round trip is tested).
- **Feedback work for this phase** (see `docs/FEEDBACK.md`):
  - `js/telemetry.js`: queue, flush with the autosave, `window.onerror` capture, session timer.
  - The 🐞 button, saving to `feedback/{id}` with screen, seed and last actions.
  - Logging for onboarding and Design Your Card.
  - Rules for `telemetry/{uid}` and `feedback/{id}`: create only, own uid.
  - Make the engine fully replayable from its seed and action log, with a test.

## End-of-phase checklist

1. `npm test` is green, and `npm run sim` still meets the §24 targets if engine numbers changed.
2. Check the live site after pushing (the files load under `/credit-life/`).
3. If `firestore.rules` changed, give the teacher click-by-click console steps.
4. Every new screen, choice, minigame and question logs telemetry as listed in `docs/FEEDBACK.md`.
5. Update this file (status, decisions, code map, next step) and the status column in `CLAUDE.md`.
6. Commit with a "Phase N: ..." message, push, and stop for approval.
