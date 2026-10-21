# Progression: accounts phase in one at a time (Phase 10)

Teacher request 2026-10-20: the first version of the game should be very simple, and
each chapter adds one new kind of account, teaching it before the next one arrives.
`js/progression.js` is the single source of truth for what's unlocked. Every screen,
the map, the money chips, the "Pay with" picker, the job board and the decision deck
ask it.

## The ladder

| Stage | Age | Unlocks | New on the map | Jobs |
|---|---|---|---|---|
| Prologue | 16 | Piggy bank (cash) | Cottage, Guild Hall, Shimmer Market | Cashier Rush |
| Chapter 1: Your first bank account | 16 | Checking, savings, debit card, a phone bill, overdraft fees, Inbox | Gilded Vault, Town Hall, Friendship Plaza, Academy | + Check Writer |
| Chapter 2: Borrow and pay back | 18 (time skip at the end of Ch 1) | Installment loans: vehicles (Garage), cottage upgrades (home improvement loan), credit-builder and student loans | The Garage | + Ledger Sort |
| Chapter 3: Your first credit card | 18 | Credit card (Design Your Card at the end of Ch 2), statements, utilization, card AutoPay, credit and buy now, pay later at checkout | | |
| Chapter 4: Your credit score | 19 | The score, My Score and My Report, score-based offers | The Hall of Records | |
| Chapter 5 | 19 | Pitfalls: payday and title loans, rent-to-own, settlement ads, cosigning, collections | Lantern Alley (Phase 12) | |
| Chapter 6: Moving out | 19+ | Rent, utilities, renter's insurance, roommates (Phase 13 cards) | | |
| Chapter 7: Setbacks and comebacks | | Emergencies, hardship plans, goodwill letters, fake collectors | | |
| Chapter 8: Building your future | | Retirement match, emergency fund, credit freeze, mortgage readiness | | |
| Chapter 9 and on | | The deck reshuffles: played cards can come back, milestones never | | |

A feature unlocks when the student reaches its stage (`play.chapter`, or the prologue
before that). Owning an account always unlocks its feature too (safety net).

## How it plays

- **Prologue** is played in the real kingdom, not a separate screen. Sage (the Royal
  Treasurer) gives one objective at a time in a coach panel: earn coins at the Guild
  Hall, decide whether to spend at the Market, look at the dream in the Cottage, then
  open a bank account at the Gilded Vault. Opening the account deposits the piggy bank
  into checking and starts Chapter 1 (already released for every class).
- **Every unlock** gets a celebration pop-up and a short spotlight lesson at that place
  (`js/data/lessons.js`, run by `js/ui/guide.js`). The Academy's Lessons shelf replays
  any lesson already unlocked. The old Kingdom Tour is gone.
- **Locked places** show on the map as construction sites with "Opens in Chapter N".
- **Chapter ends**: Ch 1 ends with a time skip to 18. Ch 2 ends at Design Your Card.
  Ch 3 ends with the score reveal.
- **First visits** to Town Hall, the Academy and Friendship Plaza play a short lesson. Chapter 5
  opens with "Watch out for traps". Dream goals that need a later feature say when it opens.
- **Lantern Alley** (Chapter 5): 10 stalls, each a pitch plus fine print. Trap or fair deal?
  Then the real cost is worked out. Seven traps and three fair deals, so "trap" every time loses.

## Old saves

Saves made before Phase 10 have no `play.progression`. They keep everything unlocked,
so nothing they own disappears. New saves get `play.progression = 2`.
