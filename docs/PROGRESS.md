# Progress and handoff

Update this file at the end of every phase (and whenever a decision is made) so the next session can resume from here alone.

Last updated: 2026-10-21 (Phase 12: Lantern Alley)

## Status

- **Phase 15, motion foundation and font (2026-10-21): awaiting the teacher's review.** Plan: Phase 15 motion, 16 particles, sparkles and animated icons, 17 detailed creatures with eyes that follow the mouse.
  - Font: Fraunces (OFL, `fonts/Fraunces.woff2`, soft and wonky axes on) replaces Fredoka for headings. Brasika is free for personal use only, so it waits for a web license. Swapping is one line in `css/tokens.css`.
  - `js/ui/motion/spring.js`: spring physics on one shared animation loop, plus spring curves published as CSS easings (`--ease-gentle`, `--ease-bouncy`, `--ease-snappy`, `--ease-wobbly`).
  - `js/ui/motion/boop.js`: hover boops on every button, chip and map place (the icon twists and springs back), and a squish on press.
  - Screens morph into each other (View Transitions), pop-ups spring open, and money chips roll to new values (`js/ui/motion/ticker.js`).
  - Motion setting (Full or Calm) in Account settings and the first-time pop-up. Calm and the computer's reduce-motion setting turn the motion off.
- **Story, names and title (teacher request 2026-10-21):** the opening story is wider (art beside the words on big screens) and each panel is 3 short beats with an icon, appearing one at a time, plus tags for lists. The title tagline is "Raise a creature. Build its credit." The name step asks for First name and Last name (real names, not a gamer tag), kept in `onboarding.firstName/lastName` (no rules change) and joined into the display name. The roster sorts by last name, then first name, and the CSV starts with Last name, First name. Older students fall back to their Google name split in two. The tuning export strips the new names. Account settings has "Change my name".
- **Title and settings (teacher request 2026-10-21):** Begin sits at the bottom center below the creatures, and the sign-in card appears there too. The sign-in button is a standard Google-style button with the Google "G": "Sign in with your greermiddlecollege.org account". Look, reading and sound left the sign-in card. They pop up once after signing in on each browser (`js/ui/settings-dialog.js`) and live on a new Account settings page (`#/settings`, `js/ui/screens/settings.js`) opened by the cog in the top bar. That page also has Save and exit, Save and sign out, and a link to the Cottage. The Cottage points to it instead of repeating the switches. Telemetry: `settingsOpen`, `settingsFirst`, `settingsPage`, `settingsChanged`.
- **Phase 14, the teacher sees the new game (2026-10-21): awaiting the teacher's review.**
  - Roster and CSV: Lantern Alley (called right of checked), Sage's lessons finished, dream stage, and a new 🛻 title loan flag.
  - Under the roster: "Lantern Alley: which offers fool the class", one row per offer with % called right, % who read the fine print first, and % right when they did. Traps first, hardest at the top.
  - Student detail: their Lantern Alley calls. Alley calls now save whether the fine print was read first.
- **Phase 13, the late game (2026-10-21): approved ("continue").**
  - Before this, the deck ran dry after Chapter 5 (0.6 new cards a month in Chapter 6, none by Chapter 9).
  - Chapters 6 to 8 get their own titles, intros and reflection questions: Moving out, Setbacks and comebacks, Building your future (`js/data/chapters.js`). Old saves get them too.
  - 20 new cards in `js/data/scenarios-late.js`. Ch 6: a place of your own (alone, roommate or family), moving day, the power company's credit check, renter's insurance, a roommate who's short, furnishing on store credit. Ch 7: payday is a week away, a broken laptop (insurance pays off), call before you miss, a goodwill letter, a fake debt collector, a ride repair next to a title-loan sign. Ch 8: a retirement match, a 3-month emergency fund, lifestyle creep after a raise, a data breach and credit freeze, shopping insurance, mortgage readiness, pay off debt or save, refinancing an auto loan.
  - From Chapter 9 the deck reshuffles: once the new cards run out, cards already played can come back (`CONFIG.pacing.replayFromChapter`). Milestones never repeat (`replay: false`). Earlier chapters draw exactly as before.
  - Now about 2 new cards a month in every chapter from 1 to 10. The simulation is unchanged (careful 793, average 716).
- **Phase 12, Lantern Alley: approved ("continue").**
- **Teacher requests after Phase 12 (2026-10-21):**
  - The opening story can't be skipped.
  - Sign in once: Google remembers the student in that browser. "Save and exit" (was "Save and sign out") saves and goes back to the title. Begin resumes the game. The title shows "Signed in as ... Not you? Sign out" for shared laptops. A refresh mid-game goes straight back in (`sessionStorage` flag).
  - Hub layout: the map is the focal point and always fits on screen. 1400px and wider: creature and money on the left, this chapter on the right. 900 to 1400px: both on the left. Phones: chapter box, map, then the creature. Map labels scale with the map.
  - One sentence per line everywhere in the game (`js/ui/sentences.js`): a plain line break between sentences in paragraphs, list items, pop-ups and toasts. Buttons, headings, labels and the map are left alone.
- **Phase 12, Lantern Alley (2026-10-21):**
  - A new Chapter 5 place on the map (`js/data/alley.js`, `js/ui/screens/alley.js`). 10 stalls with a loud pitch and fine print one tap away: payday loan, title loan, rent-to-own, debt settlement, credit repair, deferred interest, pawn (traps) and a credit union small loan, a secured card, the free credit report (fair deals).
  - The student calls each one a trap or a fair deal, then sees the real cost worked out. A right call gives +10 bonus XP once (`CONFIG.pacing.xp.alleyStall`) and counts toward Standard 5 accuracy at the Academy. New achievement: Trap Spotter (8 right).
  - The Chapter 5 unlock lesson now points to the alley, and the first visit plays a "Read the fine print" lesson. Telemetry: `alleyOpen`, `alleyFinePrint`, `alleyCall` (with whether the fine print was read first).
  - Old saves see the alley right away (everything is unlocked for them). No rules change.
- **Phase 11, filling out the ladder (2026-10-21): approved ("keep going").**
  - 4 more Chapter 2 loan cards (a loan payment due, shop around for a loan, a laptop: save or borrow, pay it off early). Chapter 2 now has 10 loan cards.
  - New lessons: Town Hall, the Academy and Friendship Plaza on first visit, and "Watch out for traps" when Chapter 5 unlocks.
  - Dream goals that need a later feature say "opens in Chapter N".
- **Phase 10, progressive unlocks (2026-10-21): approved ("keep going").** Design: `docs/PROGRESSION.md`. 159 tests pass, and the simulation is unchanged (careful 793, reckless 429).
  - Checked end to end in headless Chrome: prologue, Ch 1, time skip, Ch 2 with the Garage, card application, Ch 3, score reveal in Ch 4. An old save still loads with everything unlocked and no lessons. Phone and dark mode checked on the new screens.
  - Auto loans now also need the payment to fit income (`CONFIG.loans.autoAfford`).
  - Next ideas: more Ch 2 and Ch 3 cards, a Ch 5 lesson, and a "pitfalls" place on the map.
