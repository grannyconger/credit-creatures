# Progress and handoff

Update this file at the end of every phase (and whenever a decision is made) so the next session can resume from here alone.

Last updated: 2026-10-20 (Phase 4)

## Status

- **Phase 1: done, approved.** Live at https://www.coachw.club/credit-life/.
- **Phase 2: done, approved** (2026-10-20).
- **Phase 3: done, approved** (2026-10-20, "keep going"). The teacher tested Chapter 1 live and published the Phase 3 rules.
- **Phase 4: done, awaiting approval.** 91 tests pass. A full run (onboarding, hub, Chapter 2 with 3 months, reflection, practice replay) was clicked through in headless Chrome at 1280px and 390px in `?local` mode with no errors.
- **Teacher action needed:** publish the Phase 4 `firestore.rules` (`docs/setup-firebase.md` section 10, adds `play` to saves). Then release Chapter 2 from `/teacher/` (section 11).
- **Next step:** get Phase 4 approval, then plan and build Phase 5 (Account Management).

## Open decisions (ask once, then use the default)

1. **Economy looks loose.** A careful bot that works every shift (3 of 4 right) saves about $200 a month, so it has about $2,500 after 4 chapters. SPEC §19 aims for about $100 a month ("one $600 want every couple of chapters"). **Default: leave it until the Phase 6 shop gives money somewhere to go, then tune in the pilot** (`CONFIG.play.shift`, bills).
2. **Card pacing.** 5 cards per month used up the ~20 pilot scenarios in about 4 months. **Default:** up to 2 new one-time cards and 1 everyday card per month, plus must-see priority cards (`CONFIG.pacing.newCardsPerMonth`, `everydayCardsPerMonth`). `decisionCardsPerMonth: 5` stays the cap. Raise these when Phase 8 adds the rest of the catalog.
3. **Check Writer minigame (SPEC §17).** **Default:** Phase 6. Part 1 writes a check from a bill and signs the front. Part 2 endorses the back of a paycheck. Full-screen signature pad (touch, pen or mouse) or "type my signature" in a self-hosted cursive font (OFL). Drawings are never saved.
4. **Creature aging (SPEC §3).** **Default:** after the pilot, small details only.
5. **Phase 5: Factor Check after Decision cards** (SPEC §11). Cards already show a factor chip ("📊 Amounts owed ▼ goes down"). **Default:** add the optional one-question Factor Check in Phase 5 with the Practice Desk, since both feed Sparkle Points.

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
- **First scores are moderate** (teacher request, 2026-10-20). Three tunables in `CONFIG.score`: `historyDepth` (payment history starts at 70% of full value and reaches 100% after 36 months on one account, and a parent's card counts at half its months), `authorizedAgeCapMonths: 12` (a parent's card counts as at most 1 year old for length), and a stricter length curve (`oldestFullMonths 96`, `averageFullMonths 60`, `lengthCurvePower 0.8`). Score at 18 with a parent's card: responsible about 735, average about 697, maxed about 513 (no parent: no score). Careful own card: about 695 at 6 months, 716 at 12, 749 at 24, 792 at 48.
- **Phase 3 tweaks** (2026-10-20): every button row is centered, the score-parts tour has a color per part with a numbered, accessible progress tracker, and creatures have an optional last name printed on cards (`fullName()`).
- **Phase 4 defaults** (announced 2026-10-20 with "keep going"):
  - **Replay (practice):** `startPractice()` rebuilds the life at a finished chapter's start with `replayLife(start, log, startLog)` and plays it in memory. Nothing is saved, and telemetry is tagged `practice`. Chapter 1 (onboarding) is not replayable.
  - **"Previously on..." recap:** built from the last chapter summary and the saved month records. Only the newest chapter keeps its month records, so the save stays small.
  - **Debit card and digital wallet:** everyone has a Gilded Vault debit card from 18 (UI only, it spends checking with `debitPurchase`). Costs open a "Pay with" picker that shows checking before and after, utilization before and after (red over 30%), or the BNPL split. The hub shows the wallet as card art.
  - **Chapters:** 3 months each. A chapter ends with a summary (score, checking, fees, lates, best and worst decision), a reflection (15 to 600 characters) and 1 to 5 fun and clarity ratings, saved in `saves/{uid}.play.history`.
  - **Release:** `classes/{id}.releasedChapter`, raised by "Release Chapter N" on `/teacher/`. Chapter 1 is always open.
  - **Work shifts:** placeholder asset/liability sort, $40 + $20 per right answer (4 items), up to 3 a month, until Ledger Sort (Phase 6).
  - **Bills:** Phase 4 has a basic bills panel (pay minimum, statement, all, or a custom amount, plus moving money to and from savings) and End Month warnings. Phase 5 builds full Account Management.
  - Payday, title, rent-to-own and store cards are one-time cards (SPEC §22.3). Payday and credit-union loans use `receiveCash` plus a limited bill. Store cards add a hard inquiry with `recordInquiry`.
- **New engine actions (all logged, all in `js/engine/actions.js`):** `receiveCash` (money that isn't income), `recordInquiry` (hard or soft), `raiseLimit`, `openPrivateStudentLoan`, `addBill(name, amount, months)` for bills that end, and `openAutoLoan({ aprBump })` for dealer markups. Cards run through `runSteps`, so `replayLife` rebuilds card results too.

## Tweaks after the teacher's Chapter 1 test (2026-10-20)

- Every button row is centered (`.row` in `css/app.css`), right under the content it belongs to. The shift's "Next item" button sits in a centered row.
- "The 5 parts of a credit score" has a color per part (`.f0` to `.f4`). The weight bar fades parts not reached yet and checks off finished ones, a numbered stepper (1 to 5, ✓ when done, `aria-current="step"`, readable labels) lets students jump back to parts they have seen, a "Part N of 5" line with a meter is announced to screen readers, and the card takes the part's color. Telemetry: `factorPart` {part, n, how}.
- Creatures have an optional last name (`creature.lastName`, idea button, `fullName()` in `js/data/creatures.js`). The full name prints on the card art. Existing students can add one with "Edit my creature". No rules change was needed (`creatureName` stays the first name).

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
| `js/ui/screens/*.js` | One module per step: profile, creature, join, teen, tutorial, skip, networks, design, result, done, saved, plus hub, month and chapter-end |
| `js/play.js` | Pure month and chapter logic on `save.play`: start chapter, draw cards, choose, shifts, End Month, summary, reflection, recap, practice |
| `js/ui/decision-card.js`, `pay-with.js`, `bills-panel.js`, `wallet.js`, `shift.js` | Card with choices, outcome and reactions. "Pay with" picker. Bills panel. Wallet strip and money chips. Shared work shift |
| `js/data/scenarios.js` / `life-events.js` / `chapters.js` | 26 Decision cards (23 one-time, 3 everyday) / 14 life cards / chapter titles, intros and reflection questions |
| `js/engine/cards.js`, `actions.js` | Card runner (`runSteps`, `drawLifeEvent`, `drawDecisionCards`, `paymentOptions`, `upcomingPayments`) / the named action map shared with replay |
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
| `tests/` | Unit tests. `tests/play.test.js` checks every card on sample lives and plays whole chapters with bots. `tests/sim/` has the bots and the §24 assertions |
| `scripts/sim-report.js` | `npm run sim` |

## Latest simulation (`npm run sim`, 1,000 lives, ages 18 to 22)

| Play style | Median | 700+ | Under 600 | Collections |
|---|---|---|---|---|
| Careful | 793 | 99% | 0% | 0% |
| Average | 716 | 59% | 18% | 6% |
| Minimum payer | 639 | 19% | 10% | 0% |
| Reckless | 429 | 0% | 100% | 93% |
| Never pays | 397 | 0% | 100% | 100% |

## Phase 5 starting notes (not yet planned in detail)

Scope from SPEC §14, §15, §11:
- Account Management opens from the hub and the month screen without using game time. It replaces `js/ui/bills-panel.js` (keep its "comes out of checking" list and End Month warnings).
- Wallet screen with full card art, statements month by month, payoff previews (`payoffPlan`, `minimumOnlyPlan`), AutoPay settings (`setAutopay` already exists), My Score (gauge, 5 factors with life-choice explainers, history chart from `life.scoreHistory`), My Credit Report (`creditReport`, the 24-month grid).
- Practice Desk and Factor Check with Sparkle Points (caps in `CONFIG.pacing.sparkle`). Log every answer (type, standard, correct, seconds).
- Notifications inbox from End Month events, plus a theme picker for the Account Management screens.

## End-of-phase checklist

1. `npm test` is green, and `npm run sim` still meets the §24 targets if engine numbers changed.
2. Check the live site after pushing (the files load under `/credit-life/`).
3. If `firestore.rules` changed, give the teacher click-by-click console steps.
4. Every new screen, choice, minigame and question logs telemetry as listed in `docs/FEEDBACK.md`.
5. Update this file (status, decisions, code map, next step) and the status column in `CLAUDE.md`.
6. Commit with a "Phase N: ..." message, push, and stop for approval.
