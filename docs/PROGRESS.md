# Progress and handoff

Update this file at the end of every phase (and whenever a decision is made) so the next session can resume from here alone.

Last updated: 2026-10-20 (redesign: kingdom hub and story)

## Status

- **Phase 11, filling out the ladder (2026-10-21): awaiting the teacher's review.**
  - 4 more Chapter 2 loan cards (a loan payment due, shop around for a loan, a laptop: save or borrow, pay it off early). Chapter 2 now has 10 loan cards.
  - New lessons: Town Hall, the Academy and Friendship Plaza on first visit, and "Watch out for traps" when Chapter 5 unlocks.
  - Dream goals that need a later feature say "opens in Chapter N".
- **Phase 10, progressive unlocks (2026-10-21): approved ("keep going").** Design: `docs/PROGRESSION.md`. 159 tests pass, and the simulation is unchanged (careful 793, reckless 429).
  - Checked end to end in headless Chrome: prologue, Ch 1, time skip, Ch 2 with the Garage, card application, Ch 3, score reveal in Ch 4. An old save still loads with everything unlocked and no lessons. Phone and dark mode checked on the new screens.
  - Auto loans now also need the payment to fit income (`CONFIG.loans.autoAfford`).
  - Next ideas: more Ch 2 and Ch 3 cards, a Ch 5 lesson, and a "pitfalls" place on the map.
