# Minigames: what exists, what's next, and how each one plugs in

The teacher's Oct 22 idea doc ("Personal Finance Mini Games: Build Specs", 27 games, the full 17-page PDF arrived 2026-10-23) is folded in here. **The teacher's rule: educational tool first, engaging game second, and simple beats complex.** Nothing in the doc has to be built the way it's written. The doc was written by a chatbot without our project's context, so **these rules from it don't apply**: a separate game shell with stars and Easy/Medium/Hard menus, no real brands, and localStorage-only progress. Our games are Arcade jobs (the job board, the No timer toggle, the Shift over screen, `jobPay`), saved with the game, and real brand names are fine (CLAUDE.md).

**What we keep from it:** money in integer cents, every number in `js/data/config.js`, seeded rounds, wrong answers never ending a game, a one-sentence why after every miss, 44px or bigger tap targets, keyboard support, and no color alone.

## Every game carries this data (so Quests, Skill Sims and Battles can reuse it)
Added to each entry in `JOBS` (`js/data/minigames.js`) when the game is built or next touched:
- `skill`: "banking", "credit", "spending" and so on (the Skill Path it feeds).
- `standards`: for example `["C3", "C5"]` (see `docs/STANDARDS.md`).
- `battle`: true only if a round takes under about 20 seconds, has one clear right answer, and a seed can make an equally hard round for each player.
- `simStep`: the one smaller task this game gives to a Skill Sim (for example "find the fee").
- `hints`: a nudge, a hint and a worked-example line for the coach's hint ladder.
- Rounds come from pure seeded makers in `js/ui/minigames/gen.js`, tested in `tests/jobs.test.js`.

## Built (all open in Chapter 1)
| Game | Doc # | Skill | Standards | Battle? | Sim step |
|---|---|---|---|---|---|
| Ledger Sort | (original) | spending | G1 | Yes, one item per round | Sort one item |
| Cashier Rush | (original) | spending | A3 | No, rounds are long | Give exact change |
| Check Writer | (original) | banking | C2 | No, a multi-part form | Write and sign a check |
| Spot the Overdraft | 2 | banking | C2, C5 | Yes, one stop per feed | Stop the overdraft |
| Register Balancer | 1 | banking | C2, C4 | Yes, one line per round | Update the running balance |
| Check Anatomy Hunt | 5 | banking | C2 | Yes, one tap per prompt | Find a part of a check |
| Count the Drawer | 7 | spending | A3 | No, two long steps | Over, short or exact |
| Unit Price Showdown | 11 | spending | A3 | Yes, one pick per round | Pick the better buy |

## Next to build (specs survive)
**6. Fee Detective** (BUILT 2026-10-23, see PROGRESS.md) (banking, C3 and C5, Battle: yes for single-line rounds)
- Goal: tap every fee on a monthly statement, then say how each could have been avoided.
- Keep simple: 12 to 15 lines in Chapter 1 (the doc said 20 to 25, too long for a shift), 3 or 4 fees, and decoys (purchases, a deposit, interest earned).
- After the hunt: one avoid-it question per fee found, and "These fees cost you $X a month, $Y a year."
- Faults to plan for: "interest charged" on a card counts as a fee or not? (Decide: it's a cost of borrowing, not an avoidable bank fee, so it's a decoy with a why.) Vague names like "SVC CHG" belong in later chapters only. Tapping the same line twice shouldn't double-score.
- Battle round: one statement line, fee or not, under 10 seconds.

**3. Bank Reconciliation Match** (banking, C3 and C4, Battle: no)
- Goal: make the register and the bank statement agree.
- Keep simple: Chapter 1 has 5 lines on each side and only one leftover type per round (an outstanding check, a fee, or interest). The doc's 12 lines with a transposition error is a later chapter or a Skill Sim.
- Faults to plan for: two lines with the same amount (match by date and amount, and accept either). The "error" label needs the clearest why of all.
- Best use: a Banking **Skill Sim** step, since it combines several skills.

**4. Deposit Slip Filler** (banking, C2, Battle: no)
- Goal: fill out a deposit slip with the right totals.
- Keep simple: currency, coins, one or two checks, then subtotal and net deposit. Cash back comes later. An unendorsed check (tap Endorse first) is a good Chapter 2 twist.
- Reuse the bills and coins from `money-art.js` and the keypad from `keypad.js`.
- Faults to plan for: students entering cents in the dollars box. The keypad should say "dollars and cents" and show the slip format.

## The rest of the doc (games 13 to 49), adapted

**How to read this:** "Fits as" says where it lives in our game. A Arcade job is a timed shift for pay. A quest step is a Quest mode activity (later). A Skill Sim is one step of a combined pass/fail task. **Learning-first change** is what we'd change so the game teaches before it entertains.

### Budgeting
**13. Needs vs. Wants Sorter**: A2 (needs and wants), A4. Fits as a quest step early in Quest 1, and as a Arcade job. Battle: yes, clear cards only.
- Keep the third bin, "Depends", and the persona flip (a car for a rural commuter or a city dweller). That's the real lesson: needs depend on your life.
- Learning-first change: points for a *sound reason*, never a fixed answer, on gray-area cards, and the reasons come from the student's own creature's situation when possible. The doc's results-screen "discussion prompt" goes to the teacher page instead (Reteach list) for a class debate.
- Fault to plan for: students arguing that a phone is a need. That's the point, so accept a well-reasoned "Depends".

**15. Budget Fix-It**: A4, A2. Fits as a quest step or Skill Sim (Spending), not a timed job. Battle: no.
- Keep the two meters (Stability and Fun) and the floors on fixed bills. It teaches the tradeoff without a single right answer, which is exactly the class's theme.
- Learning-first change: each cut shows its consequence in plain words ("No more gym. Stress goes up.") before it's applied, so the student thinks first. Use the creature's own bills where possible.
- Overlap: our game already has bills, AutoPay and a monthly budget. This game should read the same categories rather than a separate persona list.

### Paychecks and taxes (fills standards F, which have nothing today)
All rates are simplified teaching values in config, labeled "simplified for learning, not tax advice". Never ask for a real Social Security number.

**17. Paystub Decoder**: F4, F6. Fits as a Arcade job ("Payroll clerk") and a Banking or Earning Skill Sim step. Battle: yes, one tap per round.
- Same tap-the-part mechanic as Check Anatomy Hunt, so reuse that code.
- Learning-first change: every right tap shows the line's plain meaning, and every wrong tap says what the tapped line actually is.

**18. Gross to Net Estimator**: F6, F5. Fits as a quest step when the creature gets its first paycheck. Battle: no (it's a guess and a reveal).
- Keep the waterfall reveal (gross stepping down to net). It's the clearest picture of where pay goes.
- Learning-first change: the student estimates first, then sees each deduction with a one-line why. Scored by closeness, not stars.

**19. W-4 Mini Form**: F4. Fits as a quest step (first job). Battle: no.
- Learning-first change: keep it to a clearly labeled practice form, and show the result as "likely refund or likely owe, and why", the actual lesson.

**20. Hourly vs. Salary**: F6, A2. Fits as a quest step or a Arcade job. Battle: yes, simple version (which pays more this week?).
- Keep the reveal of the salaried job's effective hourly rate on long weeks.
- Fault to plan for: overtime math. Show the formula on the first wrong answer.

**21. Tax Bracket Bucket Fill**: F1, F2. Fits as an Academy lesson or quest step. Battle: no.
- The myth buster ("Can a raise make your take-home smaller? No.") is the most valuable part, so lead with it.
- Learning-first change: the buckets fill as the student drags income, with four round brackets so the math is doable by hand.

### Credit and debt
**22. Credit Score Factors**: D3. Fits as a quest step and a Credit Skill Sim step. Battle: yes, the sort rounds.
- Overlap: the game already teaches the 5 factors live (My Score, Practice Desk factor checks). Use the *same* factor names, weights and wording from `js/engine/` so students never see two versions.
- Keep the tricky cards (checking your own score doesn't hurt, and closing an old card can).

**24. Loan Offer Compare (play as a Credit Advisor)**: D2, D6, D7. Fits as a Credit Skill Sim or quest step, not a timed job. Battle: no.
- Overlap: the Garage deal sheet and `vehicleQuote` already compute payment, APR, interest and total. Reuse that math and the shared amortization helper the doc asks for (one helper in the engine, unit tested, for example $10,000 at 6% for 36 months is about $304.22).
- Keep the role-play (you advise a client with a stated priority) and the trap offer (a low payment but a very long term). The amortization table (early payments are mostly interest) finally covers D6 and D7, which the game left out.

### Saving and investing
**28. Compound Interest Garden (the doc's flagship)**: G1, G3, G5. Fits as its own place on the map, or as a Cottage room tied to the dream. Battle: no.
- Strong idea: deposits are seeds, interest is trees dropping seeds, and the ghost line shows starting 5 years later. "Time beats amount" is the lesson.
- Learning-first change: start with the Early Eva vs. Late Leo prediction (level 4 in the doc), since it's the most memorable lesson, and keep the levels short.
- Overlap: the doc makes the Garden the main menu and plants "seed money" from every game. Our map and dream already do that job. **Don't make it the hub.** Make it one place, and maybe let Subscription Audit and Gig Income Tracker show "what this could grow into".
- Uses the compound-interest helper (monthly loop in cents, unit tested).

**30. Risk/Return Sorter**: G2, G1. Fits as a quest step or Academy lesson. Battle: yes, the scenario-match rounds.
- Keep the time-horizon scenarios ("car in 1 year" versus "retirement at 16"). That's the real skill.
- Keep the "insured" tag and the "general ideas, not advice" note. No real funds.

### Accounting (games 39 to 42)
**These aren't in the SC Personal Finance standards** (only G1 touches assets and equity, through Ledger Sort). The teacher marked 42 "LOVE IT: build this one deep". **Decided (teacher, 2026-10-23): keep them as an optional Business side path** (a teen-run snack shack or T-shirt shop), built after the standards games.
- **39. Debit/Credit Tug-of-War**: the rope that centers when debits equal credits is a great visual. Battle: yes.
- **40. Journal Entry Builder**: the most complex form in the doc. If built, it's a Skill Sim, not a job.
- **41. Income Statement Sort**: the "Neither" bin (a loan isn't revenue, and profit isn't cash) is the lesson. Battle: yes.
- **42. Balance Sheet Builder**: the balance scale extends Ledger Sort's assets, liabilities and equity. Story mode (5 business days) would make a strong Business Skill Sim.

### Consumer smarts
**45. Receipt Error Hunt**: A3, F3 (sales tax). Fits as a Arcade job ("Market checker"). Battle: yes, one line per round.
- Keep "Looks Good" for receipts with no errors, so students can't assume there's always a mistake. Apply the same rule to Fee Detective.

**46. Subscription Audit**: A2, A3, A4. Fits as a quest step or job. Battle: no.
- Keep the usage meters and the yearly savings reveal. Keep the annual plan that shows up once but recurs. That's a real trap.
- Learning-first change: the "Regret" meter teaches that cutting things you use isn't saving. Frame it as matching spending to your values, the class's theme.

**47. Price Per Use**: A3. Fits as a Arcade job beside Unit Price Showdown. Battle: yes, the simple pick.
- Keep the break-even slider (the winner flips at the marked point) and the counter-examples (a costume worn once).

**49. Gig Income Tracker**: A2, F6, A4. Fits as a quest step (side-hustle quest), not a timed job. Battle: no.
- The "true hourly rate after gas, fees and travel time" reveal is the lesson.

## Shared helpers to build once (in `js/engine/`, pure and tested)
- Amortization schedule (games 24 and Garage): payment, rows, total interest, last-month fix to zero.
- Compound growth (game 28): monthly loop in cents with year-end snapshots.
- Simplified payroll (games 17, 18, 20): gross, the listed deductions, net. Rates in `CONFIG`, labeled as teaching values.
- The fake document renderer (statement, receipt, paystub): one renderer for Fee Detective, Receipt Error Hunt, Paystub Decoder and Subscription Audit.

## Suggested order (by standards gaps, learning value, then reuse)
1. **Fee Detective** (C3, C5) and **Receipt Error Hunt** (A3, F3), which share the document renderer and tap-the-line mechanic.
2. **Paystub Decoder** (F4, F6) and **Needs vs. Wants Sorter** (A2), quick and filling empty standards.
3. **Credit Score Factors** (D3) and **Risk/Return Sorter** (G1, G2), sorters that are battle-ready.
4. **Loan Offer Compare** with the amortization helper (D2, D6, D7).
5. **Gross to Net**, **Hourly vs. Salary**, **Tax Brackets** and **W-4** as Quest mode steps once Quest mode exists.
6. **Compound Interest Garden** as its own place.
7. Accounting (39 to 42), only if the teacher wants a Business path.

## The spirit (teacher, 2026-10-23)
This game teaches the next generation to manage money in a complex world. That's an inspiring job, so keep spirits high and **prioritize fun**. No game gets built if it would be "meh", because students won't play it and the effort is wasted.

## Decisions (teacher, 2026-10-23)
- Accepted as least practical: W-4 Mini Form, Deposit Slip Filler, Tax Bracket Bucket Fill as a minigame, Journal Entry Builder, and the Garden as a hub.
- **Bank Reconciliation goes inside a Banking Skill Sim**, not a standalone game.
- **Tax Bracket Bucket Fill stays in the game, but not as a minigame** (for example, a lesson or an Academy exhibit).
- **Journal Entry Builder:** saved for another day.
- **Crossword and logic grid:** saved for another project.
- **Compound Interest Garden:** small, in each student's **Cottage**, needing routine care like a tree simulator. Seeds (account types) are bought at Market, and gadgets like a self-waterer (automatic contributions) are bought too. See below.
- **Games to find for the biggest engagement:** A6 (scams), A5 (social media marketing), B4 (a trivia game of all-true, shocking stats about what changes insurance rates and costs), F6 (gross to net pay) and G1 (compound interest).
- **Estimate It:** the teacher wants to know exactly how it works before it's built.

## Naming, rewards and tech (teacher, 2026-10-23, later the same day)
- **Every non-quest activity is a "side quest":** the minigames and arcade games, including today's Arcade jobs. Side quests are skill based.
- **Quests earn XP** and are the most informative. **Side quests earn Coins (checking money), Energy and Sparkle Points.** **Built 2026-10-25:** shifts no longer pay XP. They pay coins for each right answer (floor 10, cap 120, a perfect shift pays the cap), Energy and Sparkle (see PROGRESS.md). Quests pay XP per decision card and finished month.
- **Where'd My Paycheck Go** is a lesson only (taxes don't come out of the creature's pay). Later, a teacher switch can turn on real taxes for a class.
- **Tech:** stay vanilla JS, DOM, SVG and CSS. No game engine (Phaser, Godot, Three.js).

## Concepts to review with the teacher before building (2026-10-23)
These are pitched concepts, not approved specs. The teacher wants to review each spec first.
- **Scam or Legit?** (A6): a phone screen of texts, DMs, emails and payment requests patterned on the FTC's top scams. Swipe Scam or Legit, then tap the red flag for a bonus. About a third are legit.
- **Hype Check** (A5): a feed of made-up influencer posts. Tap the trick (fake countdown, "only 2 left", hidden sponsorship, filtered before-and-after). The last card is buy or skip, against the creature's budget and dream.
- **Rate Shock** (B4): trivia of all-true, sourced, surprising facts about what changes car insurance costs. Formats: "Which costs more to insure?" and higher or lower.
- **Where'd My Paycheck Go?** (F6): guess the take-home from the creature's real shifts, watch the deductions drain it line by line, then a Paystub Decoder tap round. Lesson only.
- **The Cottage Garden** (G1): plant seeds (account types bought at Market) by moving money from checking. Trees grow and drop seeds (interest on interest). Weeds are fees, and a self-waterer is automatic saving. It opens with Early Eva vs. Late Leo. Needs engine work (a real savings-like account).
- **Estimate It** (D2, F6, G1, A4): one money question with a dollar answer and 6 guesses. Each guess shows Higher or Lower plus a closeness word (Bullseye within 5% wins, Hot within 10%, Warm within 25%, else Cold). Clues after guesses 2 and 4, then the worked math. A first-guess score stops halving the range. A shared daily puzzle with a streak, plus practice. In battles, both players guess once and the closer guess hits harder. **Open:** the Bullseye range (5%, or 10% for beginners) and whether the calculator is off (recommended) or on.

## Every game gets a guide with three tabs (teacher, 2026-10-23)
Each game has a guide the student can open anytime (before playing, or from the Shift over screen):
1. **How to play:** the goal in one sentence, the steps, and one worked example.
2. **Vocab:** each word with a plain definition, a tooltip that opens on hover (and on keyboard focus, so keyboard users get it too), and an example sentence.
3. **IRL:** where this shows up for real, with a few interesting, factual stats. **Credible sources only** (CFPB, the Federal Reserve, FDIC, BLS, IRS, SSA, FTC, the Census Bureau, NAIC and similar). Each stat names its source and year, and is checked against the source when written. Never invented.
- Written so students *enjoy* reading it: short paragraphs, a wry line or two in the naturalist's voice, plain words for a 15-year-old, no em-dashes, no semicolons.
- Content lives in data files (one per game), and opening the guide logs telemetry (`guideOpen`, `guideTab`).

## Insurance (B) ideas, high level (teacher asked, 2026-10-23)
- **Deductible or premium:** pick a plan for a person and a year of events, to see the tradeoff of a low premium with a high deductible (B1, B5).
- **Which policy pays?** An event happens (a fender bender, a stolen laptop, an ER visit), and the student matches it to the policy and coverage that pays (B3, B5, B7).
- **Risk manager:** sort situations into avoid, reduce, keep or transfer (B2).
- **What changes the price?** What raises or lowers a teen driver's car insurance (B4).

## Logic and puzzle games inspired by NYT Games (teacher asked, 2026-10-23)
Not specs yet. Ranked by learning yield:
- **Money Connections** (like Connections): 16 terms in 4 hidden groups. Vocab across every standard, quick, replayable, and a seeded daily puzzle the whole class shares.
- **Estimate It** (a Wordle-style higher or lower): guess a total cost, a payment or a balance in 6 tries, with higher or lower clues. Builds number sense about money.
- **Money Mini** (like the Mini crossword): 5 by 5 with definition clues. Vocab review.
- **Logic grid** (classic logic puzzles): who took which loan, from clues. Reasoning, a smaller audience.
