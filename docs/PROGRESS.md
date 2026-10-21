# Progress and handoff

Update this file at the end of every phase (and whenever a decision is made) so the next session can resume from here alone.

Last updated: 2026-10-20 (redesign: kingdom hub and story)

## Status

- **Phase 10, progressive unlocks (in progress, committed locally, NOT pushed). Resume here.** Design: `docs/PROGRESSION.md`. 159 tests pass, and the simulation is unchanged.
  - Working end to end (headless run, scratchpad `p10.mjs`): prologue (piggy bank, Cashier Rush, Market, Cottage, bank opening), Ch 1 checking cards, time skip to 18, Ch 2 loans with the Garage and Cottage upgrades, card application at the Vault, Ch 3, score reveal and the Hall of Records in Ch 4. Lessons from Sage replace the Kingdom Tour. The Academy has a Lessons shelf.
  - Still to do before pushing:
    1. The Garage label overlaps the Vault's badge on the map. Move the Garage (places.js x/y).
    2. Check phone width and dark mode for the new screens (bank opening, Garage, Hall of Records, prologue box).
    3. A Ch 1 reflection checkpoint: Ch 1 cards drawn per month look right, but tune `newCardsPerMonth` for Ch 1.
    4. Update the teacher dashboard wording (chapters now start at 1, with no release needed for Ch 1), SPEC.md and CLAUDE.md.
    5. Rerun p6/p8 (they assume an old save), then push.
