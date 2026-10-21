# Progress and handoff

Update this file at the end of every phase (and whenever a decision is made) so the next session can resume from here alone.

Last updated: 2026-10-20 (redesign: kingdom hub and story)

## Status

- **Phases 1 to 8: done, approved.** Phase 8 was approved 2026-10-20 ("keep going").
- **Phase 9 (pilot): code done, waiting for pilot data.** 138 tests pass.
  - 11 more decision cards (37 in total, the full SPEC §13 catalog).
  - `addCollection` and delayed bills in the engine.
  - Anonymous tuning export, `npm run tuning-report`, `npm run replay`, and the `pilot-data/` folder (gitignored).
  - `docs/PILOT.md` is the teacher's run-book.
- **Teacher action needed:** publish the newest `firestore.rules` (it covers Phases 7 and 8 and creature looks on the leaderboard), then follow `docs/PILOT.md`.
- **Renamed 2026-10-20:** the repo is `grannyconger/credit-creatures` and the site is https://www.coachw.club/credit-creatures/. The Firebase project id stays `credit-life-38e4a`, because Firebase ids can't change. Browser test-storage keys keep the `credit-life:` prefix.
- **Redesign (plan approved 2026-10-20), awaiting the teacher's review.** 148 tests pass.
  - Part 1, design system: tokens with light and dark modes, a color-blind-safe factor palette, dyslexia mode (OpenDyslexic), Fredoka headings, a custom icon set, shinier cards, the "Credit Creatures" name.
  - Part 2, purpose and hub: a 3-panel story intro, a dream for each creature (4 dreams with savings, score and habit meters), and an illustrated kingdom map as home base. Places: Town Hall (decisions and End Month), Guild Hall (shifts), Gilded Vault (accounts), Shimmer Market (shop), Academy (Practice Desk and trophies), Friendship Plaza (friends) and Your Cottage (creature, dream, settings). Every place has "Back to the kingdom". The top-right creature opens the Cottage from anywhere.
  - Equity in Ledger Sort now means investments (stocks, index funds, owning part of a business).
  - No Firestore rules change.
  - Students who already started get the dream picker from the hub and the Cottage.
- **Visual quality:** more options are in `docs/VISUAL-PLAN.md`. Don't start any of them without a plan the teacher approves.
- **Next step:** wait for the teacher's review of the redesign. Then,  when the teacher says pilot data is in `pilot-data/`, run `npm run tuning-report` on it, test any engine changes with `npm run replay`, make the config changes, run the tests and push. Also replay any 🐞 bug report the teacher downloads.

## Open decisions (ask once, then use the default)

1. **Economy is loose** in bot play (about $87 to $144 saved a month for steady players). **Default:** decide from real pilot data with `npm run tuning-report`.
2. **Card pacing.** **Default:** up to 2 new and 1 everyday card per month. Revisit with real minutes per month.
3. **Extra minigames** (SPEC §17 "Later": Check & Tip, Delivery Dash, and others). **Default:** only if pilot ratings show students want more variety.

## Definition of done (SPEC §24)

- [x] A student can sign in with a school account, create and name a creature, play Chapter 1 through Design Your Card, and play released chapters with saves surviving a closed browser. (Saves go to `saves/{uid}` at every step and End Month. Checked in headless Chrome and by the teacher's Chapter 1 test.)
- [x] Score changes always come with a plain-language reason tied to a factor (`explainChange`, checked in the 1,000-life sim test).
- [x] Achievements, XP and the leaderboard update live (54 achievements, `evaluate()` on every save, leaderboard written when XP changes).
- [x] The teacher can release chapters, see the roster, read reflections and export CSV (`/teacher/`).
- [x] Engine tests pass, and the 1,000-life simulation gives sensible scores (careful median 793 with 99% at 700+, reckless median 429 with 100% under 600).
- [ ] Works in current Chrome on school laptops at 1280px wide and up. Checked in headless Chrome at 1280px and 390px. Still needs a check on a real classroom touch-screen laptop during the pilot (signature pad, touch targets).

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
- **Customization expansion** (2026-10-20, teacher request):
  - Two new body types: cloud bunny and shell turtle.
  - **Starters changed 2026-10-20 (teacher):** new students pick from the lantern fox, cloud bunny and shell turtle. The crystal owl unlocks at 100 XP, the moss dragon at 300 XP and the puddle golem at 600 XP. Students who already have one of those keep it.
  - New layers: body pattern (clipped to the body via `area`), eye color, feet (via `feet` anchors), magic effects (a glow behind and/or sparkles in front), and 4 new palettes (2 earned with XP).
  - About 17 new items for head, neck, face and paw.
  - Every option and how it unlocks is in `js/data/looks.js` (`LOOK_OPTIONS`): free, `{ xp }`, `{ achievement }` or `{ shop: price }`. There are 112 looks in total.
  - The editor shows unlocked choices plus a "🔒 N more to unlock" toggle listing what each locked look needs.
  - `newlyUnlocked()` adds an "New look unlocked!" pop-up on save. The first run on an old save doesn't flood it.
  - **Leaderboard look:** `syncLeaderboard` writes `look: publicLook(creature)` and rewrites when XP or the look changes. The rules allow a `look` map of up to 12 keys. Leaderboard and Friends draw it.
- **Phase 9 changes** (2026-10-20):
  - **11 new cards:** car lease, a rewards card, a balance transfer, deferred interest, an annual fee, a payday rollover, a title loan, a settlement ad, a medical final notice, an error on your report, and an apartment landlord check.
  - **`addCollection(name, amount)`** puts an ignored bill on the report as a collection. Students can pay it from the bills panel or Wallet, which turns it into a paid collection.
  - **`addBill(name, amount, months, startIn)`** delays the first payment. Deferred interest lands after 6 months.
  - **Tuning export** (`tuningExport` in `js/teacher/analyze.js`): anonymous ("Student N", no emails or creature names) and includes each life's `start` and `log`.
  - **Scripts:** `scripts/tuning-lib.js` (suggestions and money saved per month after 18) and `scripts/replay-lib.js` (`withConfig` overrides and `compare`). The CLIs are `scripts/tuning-report.js` and `scripts/replay.js`.
- **Phase 8 defaults** (2026-10-20):
  - **Social data** lives under `social/{classId}/requests|groups|gifts`, plus `giftLimits/{uid}`. The class check comes from the path, the same as the leaderboard. The class directory is the leaderboard list. Students show up once they've earned XP.
  - **Friend requests:** the id is `fromUid_toUid`. accepted means friends. Only the person asked can accept or decline, and either person can cancel or unfriend.
  - **Groups:** preset names ("The Golden Lanterns") from `js/data/social.js`, up to 6 members. Students only add or remove themselves, and the last one out deletes the group. The group view shows members' creature, rank and XP, plus the group's XP total.
  - **Gifts:** to accepted friends only, $5 to $50 or an owned shop item, with a preset message index. One every 40 hours, enforced by writing the gift and `giftLimits/{uid}.lastSentAt == request.time` in one batch. The sender's money leaves through `debitPurchase` ("gift to ..."). The receiver gets it through `receiveCash` when they open it, so it isn't income. Logic is in `js/social.js`.
  - **Teacher:** a **Friends and gifts** on/off control (`classes/{id}.social`, which the rules check). Student detail lists friends and gifts.
  - **Customizer:** 5 new palettes, eye styles (round, happy, sleepy, sparkly), face markings (blush, freckles, forehead star, heart cheek), and a Paw slot (balloon, book, lantern, plus a shop wand and mug).
  - **Aging:** `creatureSvg(c, { ageMonths })` gives bigger eyes before 18, eyebrows from 20 and gray whisker tufts from 22. Used on the hub, the top bar and the editor.
  - **New achievements:** Friendly, Generous and Squad Goals (54 in total). `play.social` keeps the counts.
- **Phase 7 defaults and changes** (2026-10-20):
  - **Dashboard** (`teacher/index.html` loads `js/teacher/dashboard.js`, with the math in `js/teacher/analyze.js`, which is tested in Node):
    - roster with sort and CSV, student detail, controls (release, pause, leaderboard, months per chapter, reset)
    - the Tuning tab with a JSON export, and bug reports with downloads
    - `?local` on localhost runs it on the browser test save
  - **How the teacher finds students:** every save now carries `teacherEmail` (from the class doc), `studentEmail`, `studentName`, `displayName` and `xp`. Rules let a teacher read and delete only saves with their email. Event logs (`telemetry/{uid}/events`) are readable when the student's save names that teacher, so the teacher's per-student queries need no collection-group index. Feedback docs carry `teacherEmail`.
  - **Class settings honored by the game:** `paused` stops the month screen and chapter starts (Accounts, the Practice Desk, the shop and Trophies still work). `monthsPerChapter` is stored on each chapter when it starts (`play.active.months`), and practice replays use the original length.
  - **"Numbers don't match the log" flag:** `logMismatches()` replays the life and compares checking, savings, held savings and every account's balance and status. Scores aren't compared, because score tuning changes them legitimately.
  - **Local credit unions:** "Market Village Credit Union" is replaced by Greenville Federal Credit Union (🌲, blue #1D61B1 with cream text and a gold #DFB50C ring, colors from the teacher) and Truliant Federal Credit Union (🌟, #0033a0 and #fdda24 from truliantfcu.org). Old saves keep the hidden `creditUnion` issuer and offers, so they still show and replay.
  - **Unlock pop-ups** (`js/ui/celebrate.js`): full-screen and dismissable (Continue or Escape) for new achievements, rank-ups (`play.rankSeen`) and new chapters. More than 3 at once fold into one summary pop-up. Motion is off with reduced-motion.
  - **Signature font:** Dancing Script (OFL) is in `fonts/` with `OFL.txt`.
  - **Telemetry fix:** event fields can no longer overwrite an event's `type`. Practice Desk answers log `qtype`.
- **Phase 6 defaults** (announced 2026-10-20):
  - **Jobs:** a job board replaces the placeholder shift in the month. Ledger Sort is 45 seconds of asset, liability or equity. Cashier Rush is 60 seconds of exact change. Check Writer means writing a check from a bill and signing the front, then endorsing the back of the paycheck, with an optional "For deposit only". Every game has a "No timer" mode with a set number of items. Pay is $40 + performance, capped at $120, plus experience (+$5 every 3 shifts at a job, up to +$20) and any raise. Everything is in `CONFIG.play.jobs`. The tutorial keeps its guided 4-item sort (`js/ui/shift.js`).
  - **Signature pad** (`js/ui/signature-pad.js`): a full-screen `<dialog>` with a canvas (pointer events, so touch, pen and mouse all work, `touch-action: none`), or "Type my signature" in script. The drawing is shown on the check only and is never saved or sent.
  - **Shop** (`js/data/shop.js`): 20 items (accessories and backgrounds). Stock is 5 regular items, 1 limited item and 1 big item ($300 to $600), the same for a given seed and chapter. Checkout goes through the "Pay with" picker, with BNPL from $50. Owned items go in `play.owned` and appear in the creature editor and on the hub. Needs (shoes, textbooks) stay as life cards.
  - **Achievements:** 51 in 9 categories (`js/data/achievements.js`), 6 hidden. `evaluate()` runs on every save once the student is in the hub, gives XP, adds an inbox note and shows a toast.
  - **XP:** achievements, +5 for each right answer, +5 for each shift, +25 for each reflection. It never goes down. **XP cap (teacher-approved 2026-10-20):** no lifetime cap, but XP from right answers stops at 100 per chapter (`CONFIG.pacing.xp.answersPerChapter`), so replaying the Practice Desk can't flood the leaderboard. Accuracy still counts after the cap. Expected totals over about 10 chapters: strong student about 3,500, typical about 1,500 to 2,200, so Grand Vizier (2,400) is a strong student's goal around Chapter 8. 7 kingdom ranks, from Apprentice (0) to Grand Vizier (2,400). Records: highest score, longest on-time streak, best XP chapter.
  - **Leaderboard:** `leaderboards/{classId}/players/{uid}` holds creature name, display name, XP, rank, species and palette, written when XP changes. Rules let only classmates and the class's teacher read it, and XP can't go down. The teacher toggle sets `classes/{id}.leaderboard`.
- **Phase 5 defaults** (announced 2026-10-20):
  - Account Management is one screen (`#/accounts`) with tabs: Wallet, Statements, My Score, My Report, Practice Desk and Inbox. It opens from the hub and the month screen and goes back to the same place. Time is paused there.
  - Wallet uses the shared bills panel, now with limit, APR, a utilization bar, a payoff preview ("Minimum only: N months, $X interest. $Y a month: ...") and AutoPay (off, minimum, full statement).
  - Practice Desk: 5 multiple-choice questions per visit from 9 types (`js/data/practice-questions.js`), new numbers every visit, with the worked math after each answer. Accuracy is kept by standard and by type in `play.desk`.
  - Factor Check: an optional one-question check after any decision with a factor chip. It counts as a `factorCheck` answer (Std 3).
  - Sparkle Points: +1 for each right answer, capped at 10 per chapter and 30 total (`CONFIG.pacing.sparkle`). They show as "735 + 6✨" and are labeled a classroom bonus. They never change the engine score.
  - Inbox: notes come from End Month events (fees, payments, statements, late marks, collections, score changes), plus "due soon" reminders for card minimums without AutoPay and a "Chapter N is open" note. It keeps the newest 40. There's an unread badge on the hub and month buttons.
  - Themes: Royal, Forest, Ocean, Ember and Night (dark), applied only to Account Management, saved in `play.theme`.
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
| `js/ui/screens/*.js` | One module per step: intro, profile, creature, dream, join, teen, tutorial, skip, networks, design, result, done, saved. Kingdom places: hub (the map), month (Town Hall), guild, accounts (Vault), shop (Market), academy, friends (Plaza), cottage, plus trophies and chapter-end |
| `js/places.js` | The 7 places, map positions, `placeStatus` badges and `nextStep` sentence (pure, tested) |
| `js/ui/kingdom-map.js`, `place-header.js` | Code-drawn SVG village with building buttons (a list on phones) / shared place header with "Back to the kingdom" |
| `js/data/story.js` / `dreams.js` | Kingdom name, intro panels, hub help / the 4 dreams and `dreamProgress` |
| `css/tokens.css`, `js/ui/icons.js`, `js/ui/settings.js`, `settings-controls.js` | Design tokens (light, dark, dyslexia) / icon set / appearance and reading settings |
| `js/play.js` | Pure month and chapter logic on `save.play`: start chapter, draw cards, choose, shifts, End Month, summary, reflection, recap, practice |
| `js/ui/decision-card.js`, `pay-with.js`, `bills-panel.js`, `wallet.js`, `shift.js` | Card with choices, outcome and reactions. "Pay with" picker. Bills panel. Wallet strip and money chips. Shared work shift |
| `js/data/scenarios.js` / `life-events.js` / `chapters.js` | 37 Decision cards (34 one-time, 3 everyday) / 14 life cards / chapter titles, intros and reflection questions |
| `scripts/tuning-report.js`, `scripts/replay.js` (+ `-lib.js`) | Pilot tuning: suggestions from the export / re-run real games with new settings |
| `docs/PILOT.md` | Teacher's pilot run-book |
| `js/data/looks.js` | Every customization option, its unlock rule, `publicLook`, `newlyUnlocked` |
| `docs/VISUAL-PLAN.md` | Visual quality options to plan with the teacher later |
| `js/social.js`, `js/ui/screens/friends.js`, `js/data/social.js` | Friend, group and gift logic / Friends screen / preset group names and gift messages |
| `js/teacher/dashboard.js` / `analyze.js` | Teacher dashboard UI / roster rows, flags, log check, CSV, tuning math |
| `js/ui/celebrate.js` | Full-screen unlock pop-ups |
| `fonts/` | Fredoka (headings), OpenDyslexic (dyslexia mode), Dancing Script (signatures), all OFL |
| `js/progress.js` | XP, ranks, achievements (`evaluate`), job pay and experience, payment and desk stats, records |
| `js/ui/job-board.js`, `js/ui/minigames/*.js`, `js/ui/signature-pad.js` | Job picker and results. Ledger Sort, Cashier Rush, Check Writer. Full-screen signature pad |
| `js/ui/screens/shop.js`, `trophies.js` | Shop with checkout / achievements, rank and records, leaderboard |
| `js/data/minigames.js` / `shop.js` / `achievements.js` | Minigame content and check grading (`amountInWords`) / shop items and stock / achievements, XP and ranks |
| `js/ui/screens/accounts.js`, `js/ui/accounts/*.js` | Account Management shell and its tabs: wallet, statements, score (gauge and history chart), report, desk, inbox |
| `js/data/practice-questions.js` / `explainers.js` | Practice Desk and Factor Check generators / factor explainers, score bands, inbox types, themes |
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
| `tests/` | Unit tests. `tests/desk.test.js` checks every question type 300 times, the Sparkle caps and the inbox. `tests/play.test.js` checks every card on sample lives and plays whole chapters with bots. `tests/sim/` has the bots and the §24 assertions |
| `scripts/sim-report.js` | `npm run sim` |

## Latest simulation (`npm run sim`, 1,000 lives, ages 18 to 22)

| Play style | Median | 700+ | Under 600 | Collections |
|---|---|---|---|---|
| Careful | 793 | 99% | 0% | 0% |
| Average | 716 | 59% | 18% | 6% |
| Minimum payer | 639 | 19% | 10% | 0% |
| Reckless | 429 | 0% | 100% | 93% |
| Never pays | 397 | 0% | 100% | 100% |

## When pilot data arrives

1. `npm run tuning-report -- pilot-data/<file>.json`. Read the suggestions and the per-student money lines.
2. For engine numbers (fees, APR rules, score weights): `npm run replay -- pilot-data/<file>.json --set <setting>=<value>` to see the effect on real games before changing them.
3. For pacing and pay (`pacing.*`, `play.jobs.*`): change `js/data/config.js` directly. These only affect future play.
4. `npm test` (and `npm run sim` if score numbers changed), update the simulation table above, commit, push, and tell the teacher what changed and why.

## End-of-phase checklist

1. `npm test` is green, and `npm run sim` still meets the §24 targets if engine numbers changed.
2. Check the live site after pushing (the files load under `/credit-creatures/`).
3. If `firestore.rules` changed, give the teacher click-by-click console steps.
4. Every new screen, choice, minigame and question logs telemetry as listed in `docs/FEEDBACK.md`.
5. Update this file (status, decisions, code map, next step) and the status column in `CLAUDE.md`.
6. Commit with a "Phase N: ..." message, push, and stop for approval.
