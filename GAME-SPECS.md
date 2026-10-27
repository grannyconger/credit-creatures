# Credit Creatures: Arcade Side Quest Spec Sheet

Version 2, 2026-10-25. This replaces Version 1 completely. The teacher approved this design direction. Build from this file only.

---

# PART 0: HOW TO USE THIS FILE

- Part 1 holds rules every game follows. Read it before building any game.
- Part 2 holds the shared systems and components. Build these first.
- Part 3 holds the 14 games. Each uses the same headings so you can compare them.
- Part 4 holds retired games, the code reuse map, the proposed build order and open items for the teacher.
- Every number marked **(config)** lives in a config file, not in code. Values here are starting points for playtesting.
- Standard codes are carried over from Version 1. **Verify every code against `docs/STANDARDS.md` before building.** No game in Version 1 listed a category E standard. Check what E is, report it, and map it to a game (Lease Life is the likely fit).
- If anything here conflicts with how the current game engine works, stop and ask the teacher. Do not guess.

---

# PART 1: RULES EVERY GAME FOLLOWS

## 1.1 Design pillars
1. **Decisions, not drills.** Every round is a choice with a tradeoff. Math is a tool, never the main loop. Math appears once at the start of a shift (the skill moment), then the game does it for the student.
2. **React to chaos.** Seeded random events interrupt the plan. Students adapt in the moment.
3. **Consequences echo.** Some choices pay off or bite later in the same shift. Time is compressed so this happens within 3 to 4 minutes.
4. **Subtle emotion.** The creature and the story carry the feeling. The creature reacts. The game never lectures.
5. **Compete and replay.** One clear score, a personal best and a class top score. A loss should make students want "one more."
6. **Risk with a lesson attached.** Loot box and gambling style mechanics are allowed when odds are visible and the skill persists.
7. **Reasoning is the output.** The teacher measures success by students explaining real decisions using game experience. Every game captures one "why" at the end.
8. **No dominant strategy.** Each game lists the lazy strategies students will try. Each one must score worse than thoughtful play. These are acceptance tests.

## 1.2 Shift length
- **Target: 3 to 4 minutes per shift, hard limit.** Budget:
  - Settings modal: student controlled, not counted.
  - Setup and skill moment: 20 seconds or less.
  - Play: 2 to 2.5 minutes.
  - Results: 30 seconds or less.
  - Bonus round: optional, after results, not counted.
- Playtest every game against this budget. If a shift runs long, cut content, not time per decision.

## 1.3 Student-facing text
- Plain words for a 15 to 16 year old. Short sentences.
- No em-dashes and no semicolons in any student-facing text.
- Every right or wrong answer shows a one-sentence why. For tradeoff choices with no right answer, show a one-sentence consequence instead.
- A wrong answer never ends a game.
- Simplified rates (tax, fees, interest, insurance prices) carry the label "simplified for learning". Tax and insurance content also carries "not tax advice" or "not insurance advice" where it fits.
- Never ask for real personal information (no real Social Security numbers, addresses, passwords).

## 1.4 Brand names
- Use near-identical parody names, never real brand names. Never use real logos.
- Exception (teacher decision 2026-10-26): Phish Tank uses real company names (Chase, UPS, Venmo and so on), so students judge the scam tells, not odd spellings. Still no real logos.
- Starter list (add more in the same style):
  - Stores: Trader Zoe's, Barnes and Noodle, Chick Filet, Sneaker Hut, Targit, Mallwart.
  - Pay apps: Venmoo, Cash Ap.
  - BNPL apps: Klarma, AfterPlay, Afirm.
  - Shopping and media: Amazin, Netflicks.
  - Shipping: UPZ, FedEz.
  - Delivery apps: DashDash, GrubHop.
  - Banks: Chaise Bank, Bank of Americana.
  - Cars: Hondo Civil, Toyoda Corola, Fjord Mustang.

## 1.5 Accessibility and platform
- Never use color alone for a state. Pair color with an icon, a text label or a pattern (for example, a dashed line plus a warning icon plus "Below $0").
- Fully keyboard playable. Every game lists its key map. Visible focus rings. Hover tooltips also appear on keyboard focus.
- Desktop first. No phone layout yet. Must fit one 1366 by 768 screen without page scrolling during play.
- Respect reduced motion settings. Card flips and storms fall back to fades.

## 1.6 Seeds
- Every shift is generated from a seed. The same seed deals the same game, including chaos events and echo timing.
- The seed generator must keep difficulty inside a band so that scores from different seeds compare fairly on the class top score.
- Store the seed with every shift result.

## 1.7 Per game requirements
Every game must have:
- Its own Arcade cabinet look and sounds.
- The shared settings modal (2.1), training shift (2.2), results screen (2.6), why capture (2.7) and bonus round (2.8).
- A "Back to the games" button with a "Leave without pay?" confirm.
- A Guide with three tabs:
  - How to play.
  - Vocab, with hover and keyboard-focus tooltips.
  - IRL: real stats with source and year. Check every stat against the source when you write it. Do not invent stats.
- A list of standards covered. Every standards category A to G needs at least one game. Not every standard needs one.

---

# PART 2: SHARED SYSTEMS AND COMPONENTS

Build these before any game.

## 2.1 Settings modal (opens before every shift)
Contents, top to bottom:
1. **Cabinet header:** game name, cabinet art, one-line pitch.
2. **Class top score card:**
   - The game's ranked metric (named in each game's spec), the value, the holder's creature name (never the student's real name) and the date.
   - "Your best" below it.
   - If no class score exists: "No class score yet. Be the first."
   - Scope: the student's own class section.
3. **Settings:**
   - Difficulty (where the game has it).
   - Timer: "Timed" or "No timer".
   - Game-specific options listed in each game's spec.
4. **Training shift toggle:** OFF by default. Label: "Training shift (guided, no pay)".
5. **Play mode panel:**
   - Safe mode: "Safe mode. X shifts left this month."
   - Risky mode warning: lists what mistakes cost in this game, using the game's risky mode mistakes list.
   - If the student is fired from this game, show the cooldown and disable Start.
6. **Ranked badge:** shows "Ranked" when the chosen settings count toward the class top score. Each game defines its ranked settings. Training shifts never count.
7. **Buttons:** Start (Enter) and Back (Esc).

## 2.2 Training shift
- Off by default. Turned on in the settings modal.
- A short scripted shift that uses a fixed training seed.
- Exactly three coach beats. Each beat is a coach mark pointing at one UI element with one sentence and a "Got it" button (Enter). Each game lists its three beats.
- Pays no coins or XP. Does not use safe mode allowance. Never risky. Never ranked.
- Ends on the normal results screen with a "Play for real" button.

## 2.3 Safe mode and risky mode (global mechanic, new)
Teacher instruction: add a new game mechanic so all side quests can be played at the current allowance per month in safe mode.
- **Safe mode:**
  - Uses the game's existing monthly allowance.
  - Safe mode does not affect the creature's life. Mistakes cost nothing.
  - Earnings still pay out (confirm with the teacher, see open items).
  - When the safe mode allowance is empty, the student can complete more months to refill it, or play risky mode.
- **Risky mode:**
  - Unlimited plays.
  - Mistakes have real consequences for the creature: they cost money, increase debt, or get the student fired from that game.
  - A mistake that costs more than the creature's checking balance adds the rest as debt, using the game's existing debt or credit card system.
- **Fired:**
  - Default: 3 risky mode mistakes in one shift (config).
  - The game locks with a cooldown of 15 minutes. The timer runs in real time, even when the student is logged off. Store an unlock timestamp on the server or in the saved profile, not a client countdown.
  - The settings modal shows the remaining time.
- **Mistake events:** each game emits a mistake event the moment a risky mode mistake happens. Every event has a type, a dollar cost (config) and a one-line label. Each game lists its mistake types.
- **Edge cases to plan:**
  - Quitting mid-shift in risky mode (do mistakes already made still count?).
  - Firing on the last mistake of a shift.
  - Cooldown across devices.
  - Allowance running out mid-month.
  - Training shifts.
  - Debt created during a shift.

## 2.4 Going broke and time travel (global mechanic, new)
- A creature can go broke. This sends the creature back to the beginning of Chapter 2.
- The student keeps everything except their coin balance, which resets to $500.
- This is not built yet. Build it to work with the current game, including all edge cases. Examples to plan:
  - What counts as "broke".
  - Going broke during a risky shift.
  - Going broke while fired.
  - Active quests and in-progress months.
  - Debt balances.
  - Battle mode data.
- Context: a month passes after about 6 life questions and 3 arcade shifts. 3 months make 1 chapter.

## 2.5 Shift result report (interface every game returns)
Every game returns one result object to the main game:
- game id, seed, settings, ranked yes or no, training yes or no, play mode (safe or risky)
- score (the game's ranked metric), plus any sub-scores
- coins earned and XP earned
- mistakes (list of mistake events, risky mode only)
- why capture answer (2.7)
- duration in seconds

**Pay formula:**
- coins = round(payCap × min(1, score ÷ maxPayScore))
- payCap is 120 (config). maxPayScore is set per game (config) so a strong but not perfect shift pays about 100.
- XP uses the same ratio. The base value comes from the existing engine (config).
- Built games currently pay a base of $40 to $120 per shift plus extras. Replace that with this formula. Keep existing experience, ride and home bonuses on top, if the teacher confirms.

## 2.6 Results screen (shared layout)
1. Big score with personal best and class top comparison.
2. Coins and XP earned.
3. The game's main reveal (each game names it).
4. Echo recap: every echo callout from the shift, in order.
5. Why capture (2.7).
6. Bonus round button (2.8).
7. Buttons: Play again (Enter), Back to the games (Esc).

## 2.7 Why capture
- Shown on the results screen, never during play.
- Format: "Your biggest decision this shift: [decision]. Why did you choose it?"
- Three reasons to pick from: one weak, one okay, one strong. Each game lists an example.
- An optional typed line, 140 characters max.
- Saved with the shift result and shown on the teacher page. Mirrors the teacher's graded assessments.
- **The "biggest decision" is picked by a rule per game** (each game names its rule). Default rule: the decision with the largest dollar impact.

## 2.8 Bonus round
- After results, a flashy button: "Earn 50 extra coins".
- One question about the game's topic: a math problem, a vocab match or a scenario.
- One attempt. Right answer pays 50 coins (config). Shows a one-sentence why either way.
- Skipping is fine. Does not affect the score. Available in safe and risky mode, not in training.
- Question pool sources: the retired Estimate It and Money Connections formats, plus per-game vocab and scenarios. At least 20 questions per game (content).

## 2.9 Echo callout
- When a delayed consequence lands, show a small tag tied to its cause, for example "Late fee $10. From: Pay in 4 at Sneaker Hut, week 2."
- The tag stays visible for 3 seconds and is logged for the results screen echo recap.

## 2.10 Reusable components
Build each once and theme it per game.

| Component | What it does | Used in |
|---|---|---|
| Cash timeline | Horizontal day or week axis, a balance forecast line, event chips on dates. Below $0 shows as a dashed red segment plus a warning icon plus text like "Below $0 on day 14". | Bill Drop, Pay in 4, The Grind |
| Event card | A situation card with 2 choices (Left and Right arrow keys) or a flip reveal (Space). Optional per-card timer ring with seconds as text. | Score Chase, Rainy Day, The Lot, Lease Life |
| Document inspector | A document of tappable lines. Tab moves focus, Enter or Space marks. A marked line shows an outline, an icon and the text "Marked". Tap again to unmark. | Check Writer, Fee Detective, Market Dash receipt, Lease Life clauses |
| 100-run simulator | Replays the player's plan on seeds seed+1 to seed+100 and two benchmark plans. Shows average, best and worst 5 percent as labeled bars with numbers. | Rainy Day, Money Tree |
| Timer ring | A ring plus a seconds number for any per-item deadline. | Many games |

---

# PART 3: THE 14 GAMES

## Contents
1. Cashier Rush (built, upgrade)
2. Check Writer (built, upgrade)
3. Bill Drop (new, liquidity anchor)
4. Pay in 4 (new, BNPL anchor)
5. Phish Tank (new)
6. Feed Frenzy (new)
7. Score Chase (new)
8. The Lot (new)
9. The Grind (new)
10. Rainy Day (new)
11. Money Tree (new)
12. Fee Detective (built, upgrade)
13. Market Dash (new)
14. Lease Life (new)

---

## 1. Cashier Rush
**Status:** Ready to build (upgrade of a built game). **Skill (XP):** spending. **Standards (verify):** A3.
**Pitch:** Your first job at a corner store. Make change fast, read your customers and close your drawer clean.
**Cabinet look:** retro cash register, store bell, coin clinks. Keep the current skin.

**Settings modal**
- Difficulty: Easy, Medium, Hard (current rules, remembered from last shift).
- Round: Speed (as many customers as you can in 3:00, double coins) or Chill (6 customers, no timer).
- Ranked settings: Speed at any difficulty. The class top score shows for the selected difficulty.
- Class top score metric: **Rush Score** (Speed round, per difficulty). Tiebreak: fewer wrong sales.

**Training shift beats**
1. "Read what they hand you and what they were charged."
2. "Count up from the charge to what they handed you."
3. "Watch the patience bar. Faster service, bigger tip."

**Shift flow**
Setup 10 s, then the rush (3:00 Speed or 6 customers Chill), drawer reveal 15 s, results.

**Screen and controls**
- Keep the current layout: money amounts top, cash drawer, tray, Undo, Clear, Give change. The page header folds away during play.
- New: a line of waiting customers on the left, each with a patience bar (bar plus seconds number plus a face icon with 3 states).
- Keys: 1 to 7 for denominations (current order), U Undo, C Clear, Enter Give change, K calculator (Easy only), Y and N for the short customer prompt.

**Rules and mechanics**
- Difficulty rules stay as they are now:
  - Easy: whole dollar prices, bills only.
  - Medium: cents in multiples of 5, bills and coins, no pennies.
  - Hard: any cents, all coins.
- **Remove the calculator** on Medium and Hard.
- **Smart payers:** about 1 in 5 customers on Medium and Hard hand an odd amount so the change comes out cleaner (for example $20.05 on a $7.30 charge, change $12.75). The why line explains the trick when the sale is graded.
- **Tips:** each right sale earns a tip based on the remaining patience: tip = round(patience fraction × 5) coins-worth of score (config).
- **Short customer:** once per shift (seeded, Medium and Hard only). A customer is 25 to 60 cents short.
  - Y covers it from your tips. N turns them away.
  - The outcome is seeded and uncertain. About half return later in the shift with a 3x tip (config). The rest never return.
  - Turning them away has no penalty except the customer's sad face.
  - One-sentence consequence shown either way. No lecture.
- **Wrong change:** says how far over or short. Adds a 2-second pause. The difference stays in the drawer.
- **Count the Drawer is retired** and replaced by the drawer reveal.

**Chaos**
Short customer, smart payers, a rush of 3 customers arriving at once (Speed only, once per shift).

**Echo**
Drawer reveal at closing. Every change mistake is already in the drawer: "Short $1.35. Customer 3: you gave $0.25 too much." Before the reveal, the student guesses Over, Short or Exact for +10.

**Skill moment**
First customer of the shift: the "count up" method is shown step by step on the tray. After that, normal play.

**Scoring and pay**
- Rush Score = sum of (right sale × difficulty points) + tips + drawer guess bonus.
- Difficulty points: Easy 10, Medium 20, Hard 30 (config).
- Speed doubles coins, not score. maxPayScore (config).
- Fix the Version 1 conflict: config says Hard pays 15 coins per sale, while the doc note says 40 for a Hard Chill round. This formula replaces both.

**Risky mode mistakes**
- Each wrong change: cost = the amount over or short, minimum $1 (config).
- Drawer over or short by more than $2 at closing: extra $5 (config).

**Why capture**
- Biggest decision: the short customer choice. If there was none, the largest wrong sale.
- Example reasons: "I didn't want to lose my tips" (weak), "It was only 40 cents" (okay), "I had enough tips to cover it and keep a cushion" (strong).

**Guide**
- Vocab: change, denomination, count up, float, over, short.
- IRL: how often people still pay with cash. Source: Federal Reserve Diary of Consumer Payment Choice, checked when written.

**Content and config**
- Customer name pool: 40.
- Short customer outcome odds, tip multiplier, patience drain rate per difficulty.

**Acceptance tests**
- Random coin spamming scores lower than slow, accurate play.
- Always covering the short customer and always refusing average about the same over 20 seeds. Neither is dominant.
- A Speed shift ends in 3:00 to 3:30 total.

---

## 2. Check Writer
**Status:** Ready to build (upgrade of a built game). **Skill (XP):** banking. **Standards (verify):** C2.
**Pitch:** Write a check carefully, deposit your paycheck, then judge checks at the Vault. One of them might be yours, altered.
**Cabinet look:** blotter desk and bank counter. Pen scratch and stamp sounds.

**Settings modal**
- Timer: Timed (3:30) or No timer.
- Ranked settings: Timed.
- Class top score metric: **Vault Score.** Tiebreak: fastest time.

**Training shift beats**
1. "Write the payee exactly as the bill says."
2. "Build the amount in words from these tiles."
3. "Draw a line through empty space so no one can add to it."

**Shift flow**
Read the bill 15 s, write the check 60 to 75 s, mobile deposit 20 s, judge 3 checks 60 s, results 20 s.

**Screen and controls**
- **Phase 1:** the bill on the left, the check front on the right. Fields: date, payee, numeric amount, written amount, memo (optional, no points), signature.
- The **word tile tray** sits under the check (ONE to NINETEEN, TWENTY to NINETY, HUNDRED, THOUSAND, AND, and cents tiles like 17/100).
- **Line tool:** draws a line through the empty space at the end of the payee and written amount fields.
- **Phase 2:** the back of the paycheck with an endorsement area and 3 choices:
  - "Signature only"
  - "For mobile deposit only" plus signature
  - "Pay to the order of a friend" plus signature
- **Phase 3:** the Vault counter. One check at a time, the customer's signature card on file beside it, and three buttons: Cash, Hold, Reject.
- **Keys:**
  - Tab moves between fields and tiles. Enter places a tile. Backspace removes the last tile.
  - L draws the line in the focused field. S signs.
  - In the judge phase: C Cash, H Hold, R Reject.

**Rules and mechanics**
- **Story:** your landlord only takes checks. One check per shift. Payee names, amounts and dates are seeded.
- Written words must match the numbers.
- **Line rule:** if the line is missing in either the payee or the written amount field, the check can be washed (see Echo).
- **Mobile deposit:** "For mobile deposit only" plus signature is correct. The other two get a one-sentence why.
- **Judge phase:** 3 checks per shift, drawn from the problem types below. 0 to 2 clean checks (seeded).

| Problem | Correct call |
|---|---|
| Clean check | Cash |
| Signature doesn't match the card on file | Reject |
| Amount altered (numbers don't match words, or alteration marks) | Reject |
| Stale (more than 6 months old) | Reject |
| Postdated (future date) | Hold |
| Missing endorsement | Reject ("ask them to sign the back") |
| Large check from a new customer, otherwise clean | Hold |

**Chaos**
The judge checks are seeded. A customer may push: "I need this cash today." This is flavor text only and never changes the right call.

**Echo (check washing)**
If the student skipped the line in phase 1, one of the judge checks is the student's own landlord check, altered (for example $42 became $942). The correct call is Reject, and the reveal says: "This is your check. Someone added to the empty space." If the student drew both lines, a normal check takes its place.

**Skill moment**
The check-writing itself in phase 1. After the first shift, the date field auto-fills.

**Scoring and pay**
- Vault Score:
  - 10 per correct field (date, payee, numbers, words, signature, both lines = 6 fields)
  - +10 correct endorsement
  - +20 per correct judge call
  - +20 if washing was avoided
- Max 150. maxPayScore (config).

**Risky mode mistakes**
- Cashing a bad check: $50 (config).
- Your own check gets washed: $25 (config).
- Wrong endorsement: $5 (config).

**Why capture**
- Biggest decision: any Hold call. If none, the washed check (if any). Otherwise, the hardest judge call.
- Example reasons: "It looked fine" (weak), "The customer seemed honest" (okay), "The bank can wait for it to clear before giving cash" (strong).

**Guide**
- Vocab: payee, endorse, memo, routing number, hold, stale check, postdated, check washing.
- IRL: check fraud trends. Sources to check when written: FinCEN or the Federal Reserve.

**Content and config**
- 30 bill templates.
- 40 judge check templates across the problem types.
- Penalty values. Hold and reject feedback lines.

**Acceptance tests**
- Cash everything, Hold everything and Reject everything each score below thoughtful play.
- Skipping the line always triggers the washed check.
- A timed shift ends in 3:00 to 4:00.

---

## 3. Bill Drop
**Status:** Ready to build (new, teacher priority: payment deadline liquidity). **Skill (XP):** banking. **Standards (verify):** A4, C4, D-category (credit card payments).
**Pitch:** Bills from different companies show up all month in different places. Log them, schedule them and keep your balance above $0 every single day.
**Cabinet look:** a desk with a phone, a laptop and a mailbox. Notification pings.

**Settings modal**
- Timer: Timed (days tick automatically) or No timer (Space advances one day).
- Difficulty:
  - Easy: 5 bills, no forgotten autopays.
  - Medium: 7 bills, 1 forgotten autopay.
  - Hard: 8 bills, 2 forgotten autopays, a credit card.
- Ranked settings: Timed, any difficulty. The class top score shows for the selected difficulty.
- Class top score metric: **Month Score.** Tiebreak: fewer fees.

**Training shift beats**
1. "A bill arrived. Add it to your calendar so you can see it."
2. "This line shows your balance every day this month. Keep it above $0."
3. "Drag a bill to a day before it's due. Pay after a paycheck lands."

**Shift flow**
Skill moment 15 s, a 30-day month at about 4 seconds per day (about 2:00 plus chaos pauses), results 30 s.

**Screen and controls**
- **Top:** the cash timeline (2.10) for days 1 to 30. Paychecks are green chips with a plus icon on their days. Logged bills are chips on their due dates. Below the line, a dashed red segment with a warning icon and text marks any day below $0.
- **Left:** a notification tray. New bills arrive here in their channel style:
  - text bubble
  - email card
  - paper mail (lands in the mailbox, shows only when the mailbox is opened)
  - app badge
- **Right:** today's balance (big number), the day counter and the fix menu.
- **Keys:**
  - N opens the next notification. M opens the mailbox.
  - A adds the open bill to the calendar.
  - Left and Right arrows move a selected bill's pay date. Enter confirms.
  - T toggles autopay on the selected bill. F opens the fix menu.
  - P pauses (Timed). Space advances a day (No timer).

**Rules and mechanics**
- **Start:** a seeded starting balance ($300 to $500), paychecks on two fixed days ($600 to $700 each).
- **Bills:**
  - From a pool: rent, electric, water, internet, phone, car payment, student loan, credit card, a streaming subscription.
  - Each bill arrives 3 to 10 days before its due date in its channel.
  - Each company has its own name, style and due date.
- **Logging:** a bill only appears on the timeline after the student adds it. Unlogged bills are invisible on the forecast.
- **Scheduling:**
  - A logged bill can be paid on any day up to its due date, or set to autopay, which pays on the due date.
  - Paying on a chosen day moves the money that day.
- **Forgotten autopays (Medium and Hard):** 1 or 2 bills start with autopay already on and never send a notification. They draft without warning. A "Check your bank app" action (key K, once per shift) reveals all autopays.
- **Late:** a bill unpaid after its due date gets a late fee (config, $10 to $35, simplified) and a "Late" stamp. Rent late fee is larger.
- **Overdraft:** a balance below $0 at end of day costs an overdraft fee per item (config, $35, simplified).
- **Credit card (Hard):** pay minimum or full. Minimum leaves a balance, and the interest charge shows on the results screen as next month's cost (echo).
- **Fix menu** (2 uses per shift, config):
  - Call to move a due date 5 days later. Works for utilities and phone, not rent or car.
  - Cancel the subscription.
  - Pick up an extra shift: adds $80 to $120 on a day 7 days later.

**Chaos**
2 to 3 events per shift from a pool, each paused with an event card:
- A surprise vet bill.
- A paycheck arrives one day late.
- The electric bill comes in higher than usual (summer AC).
- A refund arrives (positive).
- A friend pays back $40 (positive).

**Echo**
- Forgotten autopays hit with an echo callout ("Autopay: Hondo Finance car payment $289. You set this up months ago").
- Late fees and overdrafts link to their bill.
- Minimum card payment shows its interest on results.

**Skill moment**
Before day 1, one question: "Balance $400. Rent $850 is due day 3. Paycheck $650 lands day 5. Can you pay rent on time?" Yes or No, then "How much short?" (typed). After that, the forecast line does the math.

**Scoring and pay**
- Month Score = (50 × bills paid on time) + min(ending balance, 500) ÷ 5 − total fees − (75 × bills never paid).
- maxPayScore (config).
- The main reveal on results: the full month timeline with every fee marked.

**Risky mode mistakes**
- Each overdraft: the overdraft fee.
- Each late bill: the late fee.
- Each unpaid bill: the bill amount added as debt.

**Why capture**
- Biggest decision: the payment that came closest to causing an overdraft, or the fix used.
- Example reasons: "I paid it when I saw it" (weak), "I waited until it was due" (okay), "I paid it after my paycheck landed so my balance stayed above zero" (strong).

**Guide**
- Vocab: due date, autopay, late fee, overdraft, cash flow, minimum payment.
- IRL: how many households pay a late fee or overdraft each year. Source: CFPB, checked when written.

**Content and config**
- 30 company templates across bill types.
- 15 chaos cards. Fee values. Day length. Fix uses.

**Acceptance tests**
- Paying every bill the moment it arrives overdrafts before payday on most seeds.
- Never logging bills leads to overdrafts or late fees.
- Autopay on everything fails on Hard because of forgotten and overlapping drafts.
- A timed shift ends in 3:00 to 4:00.

---

## 4. Pay in 4
**Status:** Ready to build (new, teacher priority: BNPL, Buy Now Pay Later). **Skill (XP):** credit. **Standards (verify):** D2, A4.
**Pitch:** Twelve weeks of temptations. Every checkout offers "4 easy payments." Pay cash, split it or skip it, and see where the payments land.
**Cabinet look:** a glossy shopping app. Cha-ching sounds that slowly turn into draft buzzes.

**Settings modal**
- Timer: Timed (about 10 seconds per week) or No timer (Space advances a week).
- Ranked settings: Timed.
- Class top score metric: **Shopping Score.** Tiebreak: higher ending cash.

**Training shift beats**
1. "Pay in 4 splits the price into 4 payments, 2 weeks apart."
2. "Each app only shows its own payments."
3. "Press W to open your Wallet and see every payment coming."

**Shift flow**
Skill moment 15 s, 12 weeks at about 10 s each (2:00 plus pauses), results 30 s.

**Screen and controls**
- **Center:** the item card (name, store, price, Vibes value with a star icon and number).
- **Bottom:** three buttons. Cash (1), Pay in 4 (2, then pick one of the 2 apps offered with 1 or 2), Skip (3).
- **Left:** BNPL app icons (Klarma, AfterPlay, Afirm). Each shows only its own next payment.
- **Right:** the creature with a mood face (5 states, each with a text label), cash balance and the week counter.
- **Wallet** (W): the cash timeline (2.10) by week, with every upcoming draft from every app stacked.
- **Keys:** 1, 2, 3, W, Space (No timer), P pause.

**Rules and mechanics**
- **Start:**
  - Cash $250 to $350 (seeded).
  - Paycheck $260 to $300 every 2 weeks.
  - A fixed $80 to $100 of weekly living costs auto-deducts (food, gas).
- **Items:** 1 or 2 per week, price $40 to $300, Vibes 5 to 40 (seeded). Pay in 4 is offered on items over $50.
- **Pay in 4 plan:** 25 percent today, then 3 more payments every 2 weeks from that app. 0 percent interest if all are paid on time.
- **There is no limit on plans.** Stacking is the trap.
- **Drafts:** each payment drafts automatically on its week.
- **Failed draft** (not enough cash):
  - Late fee (config, $7 to $10, simplified).
  - That app locks and is no longer offered.
  - The payment retries the next week.
  - The creature's mood drops one step.
- **Emergency:** one seeded emergency lands between weeks 9 and 11 ($150 to $250). If cash can't cover it, the penalty applies and mood drops two steps.
- **Mood** rises one step for each item bought (cap) and drops for failed drafts and the emergency. It is flavor and feeds no math.

**Chaos**
- Hours get cut: one paycheck is 30 percent smaller.
- A "flash sale" item with double Vibes.
- A birthday gift of $50 (positive).

**Echo**
Every failed draft and fee shows a callout naming the item and week it came from.

**Skill moment**
Before week 1: "Sneakers cost $120 with Pay in 4. How much is due today, and how much every 2 weeks after?" Typed answers. After that, plan amounts show automatically.

**Scoring and pay**
- Shopping Score = total Vibes + floor(ending cash ÷ 4) − (3 × total fees) − (150 if the emergency was not covered).
- maxPayScore (config).
- The main reveal on results: the "phantom debt" chart. A stacked bar per week shows drafts from each app (pattern plus label per app) against the cash line. The heaviest week is marked.

**Risky mode mistakes**
- Each failed draft: the late fee.
- An uncovered emergency: the shortfall added as debt.

**Why capture**
- Biggest decision: the purchase whose plan failed first. If none failed, the most expensive purchase.
- Example reasons: "It was only $30 today" (weak), "I could afford the payments" (okay), "I checked my Wallet and no other payments landed those weeks" (strong).

**Guide**
- Vocab: Buy Now Pay Later, installment, draft, late fee, stacking.
- IRL: how many BNPL users report a late payment, and BNPL use by young adults. Sources: CFPB and Federal Reserve surveys, checked when written.

**Content and config**
- 60 item templates (parody stores, prices, Vibes).
- App schedules, fee values, emergency pool.

**Acceptance tests**
- Never buying scores below thoughtful play (low Vibes).
- Pay in 4 on everything causes failed drafts on most seeds.
- Cash for everything leaves the emergency uncovered on most seeds.
- A timed shift ends in 3:00 to 4:00.

---

## 5. Phish Tank
**Status:** Ready to build (new). **Skill (XP):** consumer smarts. **Standards (verify):** A6.
**Pitch:** Your phone is blowing up. Some messages are scams, some are real. Trust, Block or Verify before they pile up.
**Cabinet look:** a phone frame with buzzing notifications. Dark aquarium theme with fish hooks.

**Settings modal**
- Timer: Timed (2:30 of messages) or No timer (the next message comes after each decision).
- Ranked settings: Timed.
- Class top score metric: **Safety Score.** Tiebreak: more red flags found.

**Training shift beats**
1. "Trust it, Block it or Verify it."
2. "Verify takes time, but it is always safe if you use the official app."
3. "Ignored messages expire. Missing a real one costs you too."

**Shift flow**
Skill moment 15 s, 2:30 of messages (about 18), results 30 s.

**Screen and controls**
- **Center:** a phone with a queue of up to 4 visible messages. Each has a sender, a preview and an expiry timer ring (20 seconds).
- **The selected message** expands: sender, full text (25 words max), links and phone numbers as text.
- **Buttons:** Trust (T), Block (B), Verify (V).
  - Verify plays a 5-second "checking" animation, then asks: "Call the number in the message" (1) or "Open the official app" (2).
- **Right:** a running loss total and the Safety Score.
- **Keys:** Up and Down select a message, T, B, V, 1, 2. During the red flag bonus, Tab moves between flags and Enter taps.

**Rules and mechanics**
- About 35 to 40 percent of messages are legit (config), so blocking everything fails.
- **Message types:**
  - Scams: fake delivery, fake bank alert, payment app request, fake job offer, prize, "friend in trouble", account verification, a 2-step code request ("we sent you a code, read it back to us").
  - Legit: real appointment reminder, real bank fraud alert, school or club notice, real delivery update.
- Some legit messages are urgent, so urgency alone is not the tell.
- **Verify outcomes:**
  - Official app: always shows the truth, then auto-resolves correctly.
  - Calling the number in a scam message: counts as Trust on a scam.
  - Calling the number in a legit message: resolves correctly, with a one-line note that the official app is the safer habit.
- **Trust a scam:** dollar loss by type (config). Credential scams trigger account takeover (see Echo).
- **Block a legit message:** a loss by type (missed package fee, missed real job, an unblocked fraudulent charge).
- **Expired message:** an expired legit message counts as a miss. An expired scam is neutral.
- **Red flag bonus:** after a correct Block, the message stays 3 seconds with 2 to 3 tappable flags (look-alike link such as "venmoo-secure.co", urgency, gift card request, typo, unknown sender, request for a code). A correct flag tap is +10.
- The message arrival rate speeds up over the shift (config).

**Chaos**
- A romance scam that builds across 3 messages.
- A message from a real friend's number that was hacked.

**Echo (account takeover)**
Trusting a credential scam hands over the student's account. The next 2 messages are confused friends replying to scams sent "from you." A lockdown task appears (change password, turn on 2-step login, 2 taps each) and blocks the queue for about 8 seconds.

**Skill moment**
One sample message before play: "Tap what looks wrong." There is one obvious flag. After that, normal play.

**Scoring and pay**
- Safety Score = 20 per correct call + 10 per red flag − 15 per wrong call − 5 per expired legit message.
- maxPayScore (config).
- The main reveal on results: "Scams you caught, scams that caught you" with the dollar total saved and lost.

**Risky mode mistakes**
- Trusting a scam: its dollar loss.
- Blocking a legit message: its loss.
- An account takeover: an extra $20 (config).

**Why capture**
- Biggest decision: the costliest wrong call. If there were no wrong calls, the hardest correct call (a legit urgent message trusted).
- Example reasons: "It looked real" (weak), "The link looked weird" (okay), "I opened the official app instead of the link, so I knew for sure" (strong).

**Guide**
- Vocab: phishing, smishing, red flag, two-step login, account takeover, look-alike link.
- IRL: top reported scams and losses by age group. Source: FTC Consumer Sentinel Data Book, checked when written.

**Content and config**
- At least 80 messages built from templates with real company names (2026-10-26).
- Loss amounts per type, legit ratio, arrival speed curve.

**Acceptance tests**
- Block everything scores below thoughtful play.
- Verify everything overflows the queue and causes expired legit messages.
- Trust everything scores lowest.
- A timed shift ends in 3:00 to 4:00.

---

## 6. Feed Frenzy
**Status:** Ready to build (new). **Skill (XP):** spending. **Standards (verify):** A2, A4, A5.
**Pitch:** Scroll your feed for a month while saving for a goal. Spot the marketing tricks, buy what you need, and see what still matters a week later.
**Cabinet look:** a neon social media feed with heart and fire effects.

**Settings modal**
- Timer: Timed (2:30) or No timer.
- Ranked settings: Timed.
- Class top score metric: **Feed Score.** Tiebreak: more tricks spotted.

**Training shift beats**
1. "This is your situation. These are your real needs this month."
2. "Tap the trick in a post to see the truth."
3. "Wishlist it to decide later."

**Shift flow**
Persona card 15 s, 4 weeks at about 35 s each (12 posts), results 30 s.

**Screen and controls**
- **Top:** the persona card, collapsed after the intro. It shows:
  - situation (for example "New job at a cafe, needs black work shoes")
  - 2 to 3 needs
  - 2 interests
  - a dream goal with a progress bar
  - starting cash
- **Center:** a feed of post cards, one in focus at a time. Each post has a product, a price, a creator name and 0 to 2 trick hotspots.
- **Bottom:** Buy (B), Skip (S), Wishlist (W).
- **Right:** cash, goal progress and the week counter. C opens Subscriptions.
- **Keys:** Down for the next post, Tab cycles hotspots, Enter taps a hotspot, B, S, W, C, P pause.

**Rules and mechanics**
- **Five trick types,** each with an icon. Introduced in training and in the Guide.

| Trick | Truth shown when spotted |
|---|---|
| Countdown chip | The deal comes back |
| "Only X left" badge | Plenty in stock |
| Hidden "#ad" in tiny text | The creator is paid |
| Was/now price | It was never the higher price |
| "Free trial" banner | It becomes a monthly charge |

- **Spotting:** tap a trick for +10, and it pops to show the truth. Tapping a non-trick part of the post is −5 ("That's just the product photo").
- **Needs:**
  - Persona needs appear as posts, often with tricks attached.
  - Some need posts are at a fake sale price. The same need appears again later at its normal price or lower.
  - A need never bought by the end of week 4 is a penalty.
  - Lesson: a trick does not mean the product is bad. It means slow down.
- **Wishlist reveal:** a wishlisted item returns the next week with tricks stripped away (same price, still in stock, sale still running). The student decides again.
- **Free trials:** buying a free-trial item adds a subscription that charges in week 3 or 4 unless canceled in Subscriptions (C).
- **Regret reveal at the end:**
  - Each bought want gets a stamp: "Used it" if it matches a persona interest, "Never used" otherwise (seeded).
  - Never-used items are regrets.

**Chaos**
- A creator the persona follows drops a "limited" item.
- A need goes out of stock for one week.
- A surprise $40 expense.

**Echo**
- Free trial charges with callouts.
- The wishlist returns.
- Regret stamps.

**Skill moment**
The persona card read. One question: "Which of these is a need for you this month?" (pick 1 of 3).

**Scoring and pay**
- Feed Score = goal savings ÷ 2 (cap 300) + 50 per need met + 10 per trick spotted − 40 per regret − subscription charges − 60 per unmet need.
- maxPayScore (config).
- The main reveal on results: the wishlist truth recap and the regret stamps.

**Risky mode mistakes**
- Each regret: its price.
- Each subscription charge not canceled: its price.

**Why capture**
- Biggest decision: the most expensive purchase, or the first wishlist item that was later skipped.
- Example reasons: "I wanted it" (weak), "It was on sale" (okay), "I waited a week and still needed it for my job" (strong).

**Guide**
- Vocab: need, want, impulse buy, sponsored post, free trial, price anchoring.
- IRL: impulse spending and influencer marketing rules. Sources: FTC endorsement guides, plus a credible consumer survey, checked when written.

**Content and config**
- 15 personas.
- 80 post templates tagged by item, trick and need or want per persona.

**Acceptance tests**
- Skipping everything scores below thoughtful play (unmet needs).
- Buying needs the moment they appear overpays on most seeds.
- Buying everything scores lowest.
- A timed shift ends in 3:00 to 4:00.

---

## 7. Score Chase
**Status:** Ready to build (new). **Skill (XP):** credit. **Standards (verify):** D3, plus other D standards as mapped.
**Pitch:** You need a 700 credit score in 18 months to rent the apartment you want. You start with no score at all.
**Cabinet look:** a climbing gauge, card swipes and a chime when the score updates.

**Settings modal**
- Timer: Timed (10 seconds per card) or No timer.
- Ranked settings: Timed.
- Class top score metric: **Final credit score** at month 18. Tiebreak: higher cash.

**Training shift beats**
1. "Pick left or right. Each choice changes your credit."
2. "These five bars are what your score is made of."
3. "Changes show up next month when your card company reports them."

**Shift flow**
Setup card 15 s, 18 months with 1 card per month plus 3 to 5 surprise cards (about 2:30), results 30 s.

**Screen and controls**
- **Center:** the event card (2.10), with situation text (35 words max) and two choices (6 words max each) on the left and right.
- **Top:** the score gauge, or "No score yet". Month counter. Goal marker at 700.
- **Right:** five factor bars with names and a weight label each.
  - The game must reuse the factor names, weights and wording already in the game's My Score and Practice Desk. Do not create a second version.
  - A "Pending: reports next month" chip shows on any change waiting to report.
- **Bottom:** the change log (L toggles full view). For example "−30, Payment history, late payment in month 7."
- **Keys:** Left and Right arrows choose, L opens the log, P pauses.

**Rules and mechanics**
- **Setup card:** set autopay to Full, Minimum or Off. It runs every month.
  - Off means a monthly "pay your card" card appears, a repeated task that shows why autopay helps.
- **Month 1:** choose how to start: secured card, authorized user on a parent's card, or a store card.
- **No score yet:** a score appears once the first account is 6 months old (config). The game says "No score is not the same as a bad score."
- **Timed mode timeouts:** if a card times out, the card's "ignore" outcome happens. Each card defines one (for example, an ignored medical bill goes to collections).
- **Card pool (about 30 cards, seeded order with fixed early cards):**
  - Store card for 20 percent off today
  - A friend asks you to cosign
  - A credit limit increase offer
  - Close your oldest card
  - Credit repair "we erase bad history for $199" (scam)
  - Check your own score (no effect, myth buster)
  - A friend asks to borrow your card
  - A medical bill you didn't know about
  - Your card expired and autopay failed
  - A big purchase that would push utilization high
  - An apartment pre-check (hard inquiry)
  - A balance transfer offer
  - "Pay the full balance or the minimum this month?"
- **Utilization:** monthly card spending from card choices shows as a percent next to the Amounts owed bar.

**Chaos**
3 to 5 surprise cards, for example an autopay failure or a sudden expense that tempts a cash advance.

**Echo**
- **Cosigning:** 4 to 8 months later the friend misses payments. The student chooses to pay for them (costs cash) or take the score hit.
- Every score change reports a month later with a callout naming the cause.

**Skill moment**
One question before month 1: "Which factor counts the most in your score?" (pick 1 of 5). After that, the bars show it.

**Scoring and pay**
- Ranked metric: final credit score. Shift points for pay = final score − 300, + 100 if 700 or higher, + cash ÷ 10.
- maxPayScore (config).
- The main reveal on results: a score-over-time chart with each change labeled.

**Risky mode mistakes**
- A late payment: $25 late fee (config).
- An account sent to collections: the bill amount added as debt.
- Paying the credit repair scam: $199 (config).

**Why capture**
- Biggest decision: the choice with the largest score impact.
- Example reasons: "It sounded like a good deal" (weak), "I didn't want a hard inquiry" (okay), "Closing my oldest card would raise my utilization and lower my history length" (strong).

**Guide**
- Vocab: credit score, payment history, utilization, hard inquiry, cosign, authorized user, secured card.
- IRL: the five factor weights and what share of young adults have no score. Sources: myFICO and CFPB, checked when written.

**Content and config**
- 30 or more cards with both outcomes and the ignore outcome.
- Score engine values shared with the existing My Score.

**Acceptance tests**
- Declining every offer fails to reach 700 on most seeds (too little history).
- Accepting every offer scores below thoughtful play.
- A timed shift ends in 3:00 to 4:00.

---

## 8. The Lot
**Status:** Ready to build (new). **Skill (XP):** credit. **Standards (verify):** D2, D6, D7, B4.
**Pitch:** A slick salesman, three cars and a deal that sounds great every month. Find the real cost and drive off without getting taken.
**Cabinet look:** a used car lot with flags, a showroom desk and the salesman's catchphrases.

**Settings modal**
- Timer: Timed (3:30) or No timer.
- Ranked settings: Timed.
- Class top score metric: **Deal Score.** Tiebreak: lower 2-year total cost.

**Training shift beats**
1. "He talks about monthly payments. Turn on Total cost to see the real price."
2. "Counter, accept or walk away. Walking away is a gamble."
3. "Read the contract. Strike add-ons you don't want."

**Shift flow**
- Preapproval (optional) 15 s
- Pick a car 20 s
- Skill moment 20 s
- Negotiation up to 3 rounds, 75 s
- Contract 20 s
- 2-year fast-forward 20 s
- Results 30 s

**Screen and controls**
- **Preapproval:** "Visit the credit union first?" Yes shows a rate card (APR, Annual Percentage Rate, and max loan) that stays pinned on screen. No skips it.
- **Lot:** 3 car cards with name, price, Ride rating (1 to 5 stars with a number), reliability label and monthly insurance quote.
  - The 3 types: new and flashy, certified used, older reliable.
- **Negotiation:**
  - The salesman's offer card shows the monthly payment in big type. Term, APR and add-on count sit in small print.
  - Moves: Accept (A), Counter (C, then pick 1 of 3: lower price, shorter term, beat my credit union rate), Walk away (W).
  - The Total cost toggle (T) appears after the skill moment.
- **Contract:** the document inspector (2.10) with line items. Add-ons are tappable to strike: extended warranty, paint protection, VIN etching (engraving the vehicle ID number on the windows), fabric protection.
- **Fast-forward:** an event card montage over 2 years.
- **Keys:** 1, 2, 3 pick a car, A, C, W, T, Enter signs, Tab and Enter strike add-ons.

**Rules and mechanics**
- The salesman's first offer always uses a long term (60 to 84 months) to make the payment look small.
- **Counter outcomes** are seeded and depend on leverage:
  - "Beat my credit union rate" only works if preapproved.
  - "Lower price" works once.
  - "Shorter term" raises the payment but lowers the total.
- **Walk away:** seeded callback chance (config, about 60 percent). A callback brings a better offer. Otherwise the car is sold, and the student must take a worse car or leave with no car (a big score penalty).
- **Salesman lines** (flavor, never change math): "This price is only good today", "What monthly payment works for you?", "Let me talk to my manager."
- **Amortization helper:** standard loan payment formula. Example check: $10,000 at 6 percent for 36 months is about $304.22 a month.
- **Insurance:** the monthly quote for the chosen car adds to the 2-year total. Flashy cars cost more to insure.

**Chaos**
- A "manager special" mid-negotiation.
- A second buyer looking at the same car (raises walk-away risk).

**Echo**
The 2-year fast-forward shows repair events by reliability (older and flashy cars have more), insurance renewal, and the total 2-year cost against the first offer.

**Skill moment**
After picking a car, the first offer appears: "$389 a month for 72 months, $1,000 down. What is the total you pay?" Typed. After that, the Total cost toggle shows totals on every offer.

**Scoring and pay**
- Deal Score = Ride × 50 + (first offer 2-year cost − your 2-year cost) ÷ 10, minimum 0.
- Leaving with no car: Deal Score = 50.
- maxPayScore (config).
- The main reveal on results: monthly payment vs. total cost, side by side for the first offer and your deal.

**Risky mode mistakes**
- Signing with any add-on left in: its price.
- Signing at a rate above the preapproval rate: the extra interest added as debt.

**Why capture**
- Biggest decision: the final deal choice (which car and which term).
- Example reasons: "The monthly payment was low" (weak), "I liked the car" (okay), "The shorter term cost more each month but saved over $2,000 in total" (strong).

**Guide**
- Vocab: APR, loan term, down payment, total cost, preapproval, add-on, depreciation.
- IRL: average new and used car loan terms and payments. Sources: Experian State of Automotive Finance, Edmunds, checked when written.

**Content and config**
- 9 car templates (3 per type).
- Offer generation rules, callback chance, repair event pool.

**Acceptance tests**
- Always picking the cheapest car scores below a balanced choice on most seeds.
- Always walking away loses the car often enough to score lower.
- Accepting the first offer scores lowest.
- A timed shift ends in 3:00 to 4:00.

---

## 9. The Grind
**Status:** Ready to build (new). **Skill (XP):** earning. **Standards (verify):** F4, F5, F6, A2.
**Pitch:** Deliver food on DashDash or work shifts at the store. Find out what each job really pays per hour.
**Cabinet look:**
- Delivery mode: a phone app with a city map.
- Store mode: a schedule board with a time clock punch sound.

**Settings modal**
- Mode: Delivery or Store. Defaults to the mode not played last time.
- Timer: Timed or No timer.
- Ranked settings: Timed. Each mode has its own class top score.
- Class top score metric:
  - Delivery: **True hourly rate** (net after gas and taxes saved, divided by hours).
  - Store: **Payday Score.**

**Training shift beats**
- Delivery:
  1. "Accept or decline each order. Look at pay and miles."
  2. "Gas and waiting time are not paid."
  3. "No taxes are taken out. Save some in your tax jar."
- Store:
  1. "Extra shifts mean more pay but less energy."
  2. "Predict your take-home before you see it."
  3. "Check your paystub for a mistake."

**Shift flow**
- Delivery: skill moment 15 s, an evening of orders 2:30, payday 30 s, results 20 s.
- Store: two-week schedule 1:30, payday 1:00 (predict, waterfall, stub check), results 20 s.

**Screen and controls**
- **Delivery mode:**
  - Map background. Order offers pop up with pay, miles, estimated minutes, restaurant and tip estimate. Each offer has a 7-second timer ring.
  - Accept (A) or Decline (D). An accepted order shows a progress bar.
  - Side panel: earned, miles, time online, acceptance rate.
- **Store mode:**
  - A two-week calendar with base shifts.
  - Offers pop up (extra shift, swap request, overtime, schedule cut). Accept (A) or Decline (D).
  - Energy meter: 5 pips with a number.
- **Payday (both modes):**
  - Predict slider (Left and Right arrows, Enter).
  - Deduction waterfall.
  - Store mode: tap the stub error with the document inspector.
  - Delivery mode: a tax jar slider (0 to 40 percent).
- **Keys:** A, D, arrows, Enter, P pause.

**Rules and mechanics**
- **Delivery:**
  - One order at a time. Offers appear only while idle. Idle time is unpaid.
  - Gas cost per mile (config, simplified).
  - Declining more than 60 percent of offers triggers "Acceptance rate low. Fewer offers" (fewer offers for the rest of the shift).
  - A 30-second surge window with 2x pay, once per shift.
  - Tip bait: some tip estimates shrink after delivery (seeded, about 1 in 6).
- **Delivery taxes:**
  - Pay has no taxes taken out.
  - At payday the student sets the tax jar.
  - Then a simplified tax bill (config, about 25 percent, labeled "simplified for learning, not tax advice") is compared to the jar.
  - Any shortfall is owed plus a small penalty.
- **Store:**
  - Base hourly wage (config).
  - Overtime at 1.5x after 40 hours in a week.
  - Each extra shift costs 1 energy. At 0 energy the next shift becomes a sick day (lost pay).
  - A schedule cut can arrive (chaos).
- **Store payday:**
  - The student predicts take-home.
  - The waterfall shows gross, federal tax, state tax, Social Security, Medicare, net (simplified config rates).
  - One planted stub error: wrong hours, wrong rate, overtime paid at 1x, or missing hours.
- **Salary comparison:** the results screen shows a salaried job's effective hourly rate at 40 and 50 hour weeks next to the student's rate.

**Chaos**
- Delivery: a car problem (lose 20 seconds), a long wait at a restaurant, a surge.
- Store: a schedule cut, a coworker begging for a swap.

**Echo**
- Delivery: the tax bill arrives at payday. Tip bait reveals after delivery.
- Store: a missed stub error shows as lost pay on results.

**Skill moment**
- Delivery: before play, "You earned $60 in 4 hours and spent $12 on gas. What is your true hourly rate?" Typed. After that, the side panel shows it live.
- Store: the take-home prediction at payday.

**Scoring and pay**
- Delivery ranked metric: true hourly rate. Shift points = net earnings after gas and tax shortfall.
- Store Payday Score = net pay ÷ 5 + prediction bonus (up to 50, by closeness) + 40 for finding the stub error.
- maxPayScore per mode (config).
- The main reveal on results: true hourly rates side by side (Delivery, Store, Salary).

**Risky mode mistakes**
- Delivery: a tax shortfall (the amount owed plus the penalty).
- Store: a missed stub error (the missing pay is lost).
- Both: a sick day (lost pay).

**Why capture**
- Delivery biggest decision: the tax jar setting. Store: the extra shift decision.
- Example reasons: "I want all my money now" (weak), "I saved a little" (okay), "Gig pay has no taxes taken out, so I saved about a quarter for the tax bill" (strong).

**Guide**
- Vocab: gross pay, net pay, withholding, overtime, gig work, self-employment, true hourly rate.
- IRL: gig worker earnings after expenses and the share of workers doing gig work. Sources: Bureau of Labor Statistics, IRS gig economy pages, checked when written.

**Content and config**
- 40 restaurant names.
- Order generation rules. Wage, tax and gas values. 15 stub error templates.

**Acceptance tests**
- Delivery: accepting every order gives a lower true hourly rate than selective play on most seeds.
- Delivery: a tax jar of 0 always produces a shortfall.
- Store: accepting every extra shift triggers a sick day on most seeds.
- A timed shift ends in 3:00 to 4:00 in each mode.

---

## 10. Rainy Day
**Status:** Ready to build (new). **Skill (XP):** insurance. **Standards (verify):** B1 to B7.
**Pitch:** Buy insurance, set aside an emergency fund, then open a year of life one card at a time. Will you be covered when it storms?
**Cabinet look:** a stormy sky, umbrella icons and a trading card pack opening.

**Settings modal**
- Timer: Timed (8 seconds per card) or No timer (Space flips).
- Ranked settings: Timed.
- Class top score metric: **Plan Strength** = the average ending money across the 100-run simulator for the student's plan. This rewards a good plan, not a lucky year. Tiebreak: higher worst 5 percent result.

**Training shift beats**
1. "A premium is what you pay every month for insurance."
2. "A deductible is what you pay first when something happens."
3. "Your emergency fund pays for anything insurance doesn't."

**Shift flow**
Shop 60 s, year of 12 cards (about 1:40), results with the simulator 30 s.

**Screen and controls**
- **Shop:**
  - 4 policy cards: car, renters, health, phone. Each has 3 options: No coverage, Low deductible (higher premium), High deductible (lower premium).
  - An emergency fund slider from starting cash.
  - A yearly cost total.
- **Year:**
  - A "Life Pack" opens (card pack animation, a fade with reduced motion).
  - 12 event cards, one per month, using the event card component (2.10).
  - Each resolved card shows the event cost, which policy paid (if any), the deductible, and what the student paid.
  - Payment order: fund first, then checking, then debt.
- **Keys:** Tab and arrows in the shop, Enter to choose, Space to flip.

**Rules and mechanics**
- **Starting cash and income** are seeded.
- **Premiums** are deducted monthly. Unused fund money is kept at year end.
- **Event deck weights** (config, tuned so this is true over many runs):
  - Small events are cheaper to self-cover with savings.
  - Rare catastrophic events are ruinous without insurance.

| Event type | Examples | Cost range | Rarity |
|---|---|---|---|
| Small | cracked phone, minor scrape, urgent care visit | $150 to $600 | Common |
| Medium | fender bender, ER visit | $2,000 to $4,000 | Uncommon |
| Catastrophic | major accident, apartment fire, hospital stay | $15,000 to $30,000 | Rare |
| Quiet or good | nothing happens, small refund | $0 or positive | Common |

- **One exclusion in the pool:** flood damage is not covered by renters insurance. When drawn, the card explains it.
- **Renewal at month 6:** an at-fault car event raises the car premium for the rest of the year.
- **Debt** from uncovered costs carries simplified interest shown on results.

**Chaos**
The deck itself.

**Echo**
- The month 6 renewal callout.
- Debt interest on results.

**Skill moment**
In the shop, one question: "Your deductible is $500. A $2,000 repair happens. How much do you pay?" Typed. After that, every card shows the split automatically.

**Scoring and pay**
- Ranked metric: Plan Strength (simulator average).
- Shift points for pay = year-end money (cash + fund − debt) ÷ 20, so the actual year still matters for pay.
- maxPayScore (config).
- The main reveal on results: the 100-run simulator comparing three plans (your plan, no insurance, full low-deductible insurance) by average, best and worst 5 percent.

**Risky mode mistakes**
- Each uncovered cost over $1,000: the uncovered amount added as debt.

**Why capture**
- Biggest decision: the coverage choice for the event that cost the most this year. If nothing big happened, the highest premium chosen.
- Example reasons: "I didn't think anything would happen" (weak), "I wanted to be safe" (okay), "I can cover small stuff from my fund, so I only insured the big risks" (strong).

**Guide**
- Vocab: premium, deductible, covered, exclusion, emergency fund, risk.
- IRL: average ER visit cost, renters insurance usage, average car insurance premium. Sources: NAIC, Insurance Information Institute, KFF, checked when written.

**Content and config**
- 40 event cards.
- Policy prices, deductible options, deck weights, debt interest.

**Acceptance tests**
- Full low-deductible insurance has a lower Plan Strength than a balanced plan.
- No insurance has a much worse worst 5 percent result.
- A timed shift ends in 3:00 to 4:00.

---

## 11. Money Tree
**Status:** Ready to build (new). **Skill (XP):** investing. **Standards (verify):** G1, G2, G3, G5.
**Pitch:** Plant your money in a garden and grow it for 40 years. Storms will come. Will you hold on?
**Cabinet look:** a cottage garden with seasons, rain and storms. Uses the Cottage Garden idea as the skin, not the full Cottage engine.

**Settings modal**
- Timer: Timed (15 seconds per season) or No timer.
- Ranked settings: Timed.
- Class top score metric: **Goal Score.** Tiebreak: higher final wealth.

**Training shift beats**
1. "Each plot grows differently. Some are safe, some are wild."
2. "You need car money in 3 years and retirement money in 40."
3. "When a storm hits, you can sell or hold."

**Shift flow**
Intro (first training shift only: Early Eva vs. Late Leo, 10 s), 8 or 9 checkpoints at about 15 s each plus 2 to 3 crash interrupts (about 2:30), results with the simulator 30 s.

**Screen and controls**
- **Garden:** 4 plots. Each shows a plant, a dollar value and a growth label.
  - Savings (steady sprout)
  - CD, Certificate of Deposit (fenced plot with a lock and its maturity year)
  - Index fund (tree)
  - Hype coin (glowing mushroom)
- **Top:** age and year, the car goal marker at year 3 and the retirement goal marker at year 40, each with a progress bar.
- **Checkpoint panel:** set the split of yearly contributions across plots (plus and minus buttons in 10 percent steps) and move money between plots. Early CD withdrawals show their penalty first.
- **Crash interrupt:** a storm overlay with Hold (H) or Sell everything (S).
- **Keys:** Up and Down select a plot, Left and Right adjust percent, Enter confirms, H, S, Space to water (manual mode).

**Rules and mechanics**
- **Start:** age 22, $2,000, plus $1,200 per year in contributions (config).
- **Checkpoints:** years 0, 3, 5, 10, 15, 20, 25, 30, 35, then the end at 40.
- **Growth model** (seeded, labeled "simplified for learning, not investment advice"):

| Plot | Behavior |
|---|---|
| Savings | 2 to 4 percent a year |
| CD | 4 to 5 percent, locked 5 years, penalty to withdraw early |
| Index fund | Averages about 7 percent with yearly swings, 2 to 3 crashes of 30 to 40 percent that recover over a few years |
| Hype coin | Huge swings. Often near zero. Expected value lower than the index fund. |

- **Car goal:** at year 3, the student needs $X available (config). Money in the index fund or Hype coin during a crash may fall short. The game takes car money from plots in this order: savings, CD (with penalty), index, coin.
- **Auto-water:**
  - On (default): contributions happen automatically.
  - Off: each checkpoint shows a temptation offer ("Skip this year's contribution and get a +15 point treat now"). The student must also press Space within 5 seconds to water, or the contribution is missed.
  - Auto-water hides temptations, which teaches why automatic saving wins.
- **Crash:** Sell converts the plot to savings at the crash price. After the next checkpoint, a ghost line shows what holding would have done (or what selling would have done, if the student held).

**Chaos**
- Crashes.
- A Hype coin mania season (the coin spikes, tempting a move).
- A surprise expense at year 15 that tempts selling.

**Echo**
- Ghost lines after crashes.
- The car goal check at year 3.
- Missed contributions shown as lost growth on results.

**Skill moment**
At year 0: "$1,000 grows 7 percent a year. About how much after 10 years?" Pick 1 of 4 (about $1,970 is correct). After that, growth labels show automatically.

**Scoring and pay**
- Goal Score = 500 if the car goal is hit + up to 500 for retirement (proportional to the target) + min(200, money above target ÷ 1,000) + treats taken.
- maxPayScore (config).
- The main reveal on results: the 100-run simulator for the student's plan vs. all savings vs. all Hype coin.

**Risky mode mistakes**
- Missing the car goal: the shortfall added as debt.
- Selling during a crash: $20 (config).

**Why capture**
- Biggest decision: the first crash choice. If there was no crash, the year 0 split.
- Example reasons: "I panicked" or "I wanted to get rich" (weak), "I didn't want to lose more" (okay), "I don't need this money for decades, so I held and let it recover" (strong).

**Guide**
- Vocab: compound interest, index fund, CD, diversification, volatility, time horizon.
- IRL: long-run stock market average returns and how often crashes happen. Sources: SEC Investor.gov, Federal Reserve data, checked when written.

**Content and config**
- Growth parameters and crash schedule rules.
- Goal amounts, temptation offers, CD penalty.

**Acceptance tests**
- All Hype coin misses the car goal on most seeds and scores below a balanced plan.
- All savings misses the retirement target.
- Panic selling scores lower than holding across 20 seeds.
- A timed shift ends in 3:00 to 4:00.

---

## 12. Fee Detective
**Status:** Ready to build (upgrade of a built game). Guide written, update its vocab. **Skill (XP):** banking. **Standards (verify):** C3, C5.
**Pitch:** Clients bring you their statements and bills. Find every fee, choose how to fight it and stop it from coming back.
**Cabinet look:** keep the current noir skin with the spotlight on the statement.

**Settings modal**
- Difficulty:
  - Easy: clear fee names.
  - Medium: mixed names.
  - Hard: vague names like "SVC CHG".
- Timer: Timed (3:30) or No timer.
- Ranked settings: Timed, any difficulty. The class top score shows for the selected difficulty.
- Class top score metric: **Case Score.** Tiebreak: fewer wrong marks.

**Training shift beats**
1. "Mark every line that's a fee."
2. "Pick how to handle each one. Refunds and disputes cost a phone call."
3. "Pick the habit that stops it next time."

**Shift flow**
3 cases at about 60 s each, results 30 s.

**Screen and controls**
- **Client intro line** (one sentence), then the document inspector (2.10) with 10 to 13 lines.
- **Button:** "That's all the fees" or "No fees on this one".
- **For each marked line, pick an action:** Ask for a refund (1), Dispute (2), Cancel (3), Accept (4).
- **Calls left:** shown as 3 phone icons with a number.
- **Habit fix:** pick 1 of 3.
- **Keys:** Tab and Enter to mark, 1 to 4 for actions, F for "That's all the fees", N for "No fees".

**Rules and mechanics**
- **Documents:** bank statement, phone bill, gym or subscription statement (one of each per shift, seeded order).
- **Fee and charge types and their correct action:**

| Charge | Correct action |
|---|---|
| Monthly maintenance fee | Ask for a refund |
| Overdraft fee | Ask for a refund |
| Out-of-network ATM fee | Accept and fix the habit |
| Paper statement fee | Accept and fix the habit |
| Inactivity fee | Ask for a refund |
| Duplicate charge | Dispute |
| Unknown third-party charge on a phone bill (cramming) | Dispute |
| Gym charge after canceling | Dispute |
| Unwanted subscription | Cancel |
| Late fee | Accept and fix the habit, or ask for a refund on a first offense (both accepted) |

- **Decoys:** purchases, deposits, a transfer, interest earned. Interest earned is a decoy because the bank pays you.
- Fees never repeat on one document. 0 to 1 cases per shift have no fees (seeded).
- **3 calls per shift** (config). Ask for a refund and Dispute each cost a call. Cancel and Accept are free.
- **With no calls left,** Refund and Dispute are disabled, with the label "No calls left."
- **Refund outcomes are seeded:** first-time fees are usually waived, repeat fees less often.

**Chaos**
A client calls back mid-case with a second document line to check (once per shift).

**Echo**
Case 3 is always Case 1's client a month later. If the habit wasn't fixed in Case 1, the same fee is back, with a callout.

**Skill moment**
Case 1 shows the annual cost math once: "This $12 fee every month costs how much a year?" Typed. After that, annual costs show automatically.

**Scoring and pay**
- Case Score = 10 per fee found − 5 per wrong mark − 10 per missed fee + money recovered ÷ 2 + 15 per correct habit fix + 2 for correctly saying a case has no fees.
- maxPayScore (config).
- The main reveal on results: "These fees would have cost your clients $X a month, $Y a year. You saved $Z."

**Risky mode mistakes**
- Each missed fee: its monthly amount.
- Disputing a legit charge: $10 (config).

**Why capture**
- Biggest decision: the call spent on the largest charge, or a fee accepted that could have been refunded.
- Example reasons: "I disputed everything" (weak), "It was a big fee" (okay), "I saved my calls for the charges worth the most and fixed the small ones with a habit" (strong).

**Guide**
- Already written: How to play, 7 vocab words, 3 sourced IRL facts from the CFPB.
- Add vocab: dispute, refund, cramming, cancellation.
- Update How to play for calls and actions.

**Content and config**
- 30 document templates across the three types.
- Fee name variants per difficulty. Refund odds. Call count.

**Acceptance tests**
- Disputing everything runs out of calls and scores below thoughtful play.
- Accepting everything scores lower.
- A timed shift ends in 3:00 to 4:00.

---

## 13. Market Dash
**Status:** Ready to build (new). **Skill (XP):** spending. **Standards (verify):** A3, A4, F3.
**Pitch:** Shop for a week of meals on a budget, against the clock. Catch the receipt error, then see what you actually ate.
**Cabinet look:** a bright supermarket with aisle signs, a shopping cart rattle and a scanner beep.

**Settings modal**
- Timer: Timed (2:00 shopping) or No timer.
- Difficulty:
  - Easy: 4 meals, no spoilage.
  - Medium: 5 meals, spoilage.
  - Hard: 5 meals, spoilage, a roommate request, a tighter budget.
- Ranked settings: Timed, any difficulty. The class top score shows for the selected difficulty.
- Class top score metric: **Shop Score.** Tiebreak: more budget left.

**Training shift beats**
1. "Your meal list shows what ingredients you need."
2. "Compare price per ounce, not the sticker price."
3. "Check the receipt before you pay."

**Shift flow**
Skill moment 20 s, shopping 2:00, checkout receipt 20 s, week fast-forward 15 s, results 20 s.

**Screen and controls**
- **Left:** the meal list (4 to 5 meals). Each needs 2 to 3 ingredient types. Checkmarks fill in as the cart covers them.
- **Center:** aisle tabs (Produce, Dairy, Pantry, Protein, Frozen, Household) with item cards. Each card shows price, size, unit price (after the skill moment), store brand or name brand, a sale tag and a "good for X days" tag on perishables.
- **Right:** the cart with a running total against the budget (bar plus number), with servings per item.
- **Checkout:** the receipt in the document inspector (2.10). Tap the one error, or press "Looks good".
- **Keys:** 1 to 6 aisles, Left and Right items, Enter adds, Backspace removes, G goes to checkout.

**Rules and mechanics**
- **No nutrition, calorie or "healthy" scoring or labels anywhere.** Meals are just meals.
- **Ingredients:** any brand covers an ingredient type. Items give servings.
- **Bulk items** are cheaper per unit but perishable ones spoil after their "good for" days (Medium and Hard).
- **Sales tax:** simplified, applies only to taxable items (household goods). Labeled "simplified for learning, rules vary by state".
- **Receipt check:** exactly one error from these types: price doesn't match the shelf, double scan, wrong quantity math, wrong tax, wrong total. Catching it refunds the difference. "Looks good" on a receipt with an error means paying it.
- **Running out of time** sends the student to checkout with the current cart.

**Chaos**
- A 30-second flash sale in one aisle.
- An item out of stock (substitute needed).
- Hard only: a roommate adds a request mid-shop.

**Echo**
The week fast-forward (15 seconds, day by day):
- Each meal is cooked if its ingredients are there.
- A missing meal becomes takeout with a delivery fee (config).
- Spoiled food shows as waste in dollars.

**Skill moment**
Two products side by side: "Which is the better buy?" Then: "What is the price per ounce of the 24 oz jar at $3.60?" Typed ($0.15). After that, all tags show unit price.

**Scoring and pay**
- Shop Score = 60 per meal covered + budget left ÷ 2 − waste dollars − takeout dollars + 30 for catching the receipt error.
- maxPayScore (config).
- The main reveal on results: the week strip (cooked, takeout, spoiled) with dollar labels.

**Risky mode mistakes**
- Going over budget: the overage.
- Missing the receipt error: the error amount.
- Each takeout meal: its delivery fee.

**Why capture**
- Biggest decision: the most expensive single item, or the first bulk purchase.
- Example reasons: "It was the biggest one" (weak), "It was on sale" (okay), "The bigger size was cheaper per ounce and I could use it all before it spoiled" (strong).

**Guide**
- Vocab: unit price, store brand, bulk, perishable, sales tax, receipt.
- IRL: share of items mispriced at checkout and grocery spending on food waste. Sources: FTC price check studies, USDA, checked when written.

**Content and config**
- 80 item templates.
- 25 meal templates (each with ingredient types and servings).
- Budget per difficulty, takeout fee, tax rate.

**Acceptance tests**
- Grabbing the cheapest of everything causes spoilage on Medium and Hard on most seeds.
- Buying almost nothing produces expensive takeout and scores lower.
- A timed shift ends in 3:00 to 4:00.

---

## 14. Lease Life
**Status:** Ready to build (new). **Skill (XP):** spending (or a new housing skill if category E is housing). **Standards (verify):** check category E. Likely a housing or consumer contracts standard.
**Pitch:** Find your first apartment before someone else grabs it. Inspect, read the lease and protect your deposit.
**Cabinet look:** an apartment listing app, keys jingling, a clipboard.

**Settings modal**
- Timer: Timed or No timer. In No timer mode, the other applicant arrives after a fixed number of inspections instead of seconds.
- Ranked settings: Timed.
- Class top score metric: **Lease Score.** Tiebreak: more deposit returned.

**Training shift beats**
1. "Inspect spots to find problems. Each look takes time."
2. "Another applicant is coming. Apply before they do."
3. "Photograph damage at move-in so you don't pay for it later."

**Shift flow**
- Skill moment 15 s
- Tour 2 units, 75 s
- Lease 30 s
- Move-in photos 20 s
- Year fast-forward 30 s
- Deposit return 15 s
- Results 20 s

**Screen and controls**
- **Tour:**
  - A simple floorplan with 5 inspect spots (kitchen, bathroom, windows, door locks, walls and ceiling).
  - Inspecting shows a short line with an icon (for example "Water stain on ceiling" or "Looks fine") and costs 6 seconds.
  - Side panel: rent, the income check ("Your income is 3x rent: Yes or No", icon plus text), roommate option and the warning bar "Another applicant arriving soon".
  - Buttons: Apply (A), Next unit (N).
- **Roommate choice:** Solo or Roommate. Two short profile clues hint at the roommate's reliability.
- **Lease:** the document inspector (2.10) with 3 clauses. Flag (F) a clause or Sign (Enter).
- **Move-in:** the floorplan with existing damage spots. Tap to photograph.
- **Fast-forward:** event cards (2.10).
- **Keys:** Tab and Enter to inspect, A, N, F, Enter, Space during the fast-forward in No timer mode.

**Rules and mechanics**
- **Units:** 2 per shift from a pool of 12. Each has 0 to 2 hidden problems (mold under the sink, a broken lock, dead outlets, signs of pests, a window that won't latch, broken AC).
- **Applicant timing:**
  - Each unit has a seeded "taken at" time (unit 1 between 45 and 60 seconds, unit 2 between 65 and 75 seconds).
  - Warnings appear 15 seconds before.
  - If both units are taken, the student gets a worse backup unit.
- **Income rule:** the persona's income must be at least 3x rent to apply. Applying costs an application fee (config).
- **Roommate:** halves rent. Both names are on the lease. A seeded chance (higher with bad clues) the roommate leaves mid-year, and the student owes the full rent.
- **Lease gotchas** (1 per lease from a pool):
  - Auto-renew with a 60-day notice
  - Early termination fee of 2 months' rent
  - Pet rent
  - Tenant pays all repairs
  - Landlord can enter without notice
- **Flagging a gotcha:** the landlord removes it half the time (seeded). Otherwise the student signs anyway or loses the unit to the backup.
- **Move-in photos:** 3 existing damage spots plus 2 decoy spots. Photographed damage is protected at move-out.

**Chaos**
- The roommate leaves.
- A hidden problem breaks (if it wasn't found on the tour): a repair cost or a slow fix.
- Rent rises at renewal (if auto-renew was signed).

**Echo**
- Deposit return at move-out: undocumented damage is deducted, with callouts.
- Roommate departure and gotcha effects link back to the choices that caused them.

**Skill moment**
Before the tour: "Rent $900, security deposit $900, application fee $50, first month due at signing. How much do you need to move in?" Typed ($1,850). After that, every unit shows its move-in total.

**Scoring and pay**
- Lease Score = deposit returned + (money left vs. the backup unit's yearly cost) ÷ 10 − surprise costs ÷ 10.
- maxPayScore (config).
- The main reveal on results: the move-out deposit sheet, line by line.

**Risky mode mistakes**
- Each undocumented damage deduction: its amount.
- A roommate's unpaid half: added as debt.
- An unflagged gotcha that triggers: its cost.

**Why capture**
- Biggest decision: which unit the student applied to, or the roommate choice.
- Example reasons: "It looked nice" (weak), "It was cheaper" (okay), "I checked the locks and the sink first, and the move-in total fit my savings" (strong).

**Guide**
- Vocab: lease, security deposit, application fee, auto-renew, move-in inspection, joint lease.
- IRL: average rent for young adults and common deposit disputes. Sources: U.S. Census Bureau, HUD, a state tenant rights guide, checked when written.

**Content and config**
- 12 unit templates, 12 gotcha clauses, 10 roommate profiles, 15 fast-forward events.
- Timing and odds.

**Acceptance tests**
- Never inspecting leads to hidden problem costs on most seeds.
- Inspecting every spot on both units loses both to applicants on most seeds.
- A timed shift ends in 3:00 to 4:00.

---

# PART 4: RETIREMENTS, REUSE, BUILD ORDER AND OPEN ITEMS

## 4.1 Retired games and where their code goes
Built games leave the Arcade but their code becomes parts of new games. Do not delete code until its new home works.

| Retired game (Version 1) | Status in Version 1 | New home |
|---|---|---|
| Ledger Sort | Built | Net worth shown on the Money Tree results. Remove the cabinet. |
| Spot the Overdraft | Built | Overdraft logic and balance feed reused in Bill Drop and Pay in 4 |
| Register Balancer | Built | Running balance and dispute logic reused in Bill Drop and Fee Detective |
| Check Anatomy Hunt | Built | Check parts and judge logic reused in the Check Writer judge phase |
| Count the Drawer | Built | Replaced by the Cashier Rush drawer reveal. Bills and coins code reused. |
| Unit Price Showdown | Built | Unit price logic reused in the Market Dash skill moment and tags |
| Receipt Error Hunt | Cut (teacher, 2026-10-25), prototype deleted | Nothing left to reuse from the prototype. |
| Paystub Decoder, Where'd My Paycheck Go, Gross to Net, Hourly vs. Salary, Gig Income Tracker | Planned | The Grind |
| Needs vs. Wants, Hype Check, Subscription Audit | Planned | Feed Frenzy |
| Budget Fix-It | Planned | The Bill Drop fix menu |
| Credit Score Factors | Planned | Score Chase |
| Loan Offer Compare, Rate Shock | Planned | The Lot |
| Risk/Return Sorter, The Cottage Garden | Planned | Money Tree |
| Insurance games (four ideas) | Ideas | Rainy Day |
| Scam or Legit | Concept | Phish Tank |
| Estimate It, Money Connections | Concepts | The bonus round question pool (2.8) |

Still parked from Version 1: Journal Entry Builder, crossword and logic grid, the accounting side path, Tax Bracket Bucket Fill (as an Academy lesson). Skill Sims are not designed yet.

## 4.2 Standards coverage check (verify all codes)
| Category | Games |
|---|---|
| A | Cashier Rush, Pay in 4, Phish Tank, Feed Frenzy, Bill Drop, Market Dash, The Grind |
| B | Rainy Day, The Lot |
| C | Check Writer, Bill Drop, Fee Detective |
| D | Pay in 4, Score Chase, The Lot, Bill Drop |
| E | **Unknown. Check `docs/STANDARDS.md`.** Lease Life is the likely fit. Report back. |
| F | The Grind, Market Dash |
| G | Money Tree |

## 4.3 Proposed build order (the teacher can reorder)
1. Shared systems and components (Part 2): settings modal, training shift, result report, results screen, why capture, bonus round, echo callout, cash timeline, event card, document inspector, timer ring.
2. Safe mode and risky mode (2.3).
3. Bill Drop (teacher priority).
4. Pay in 4 (teacher priority).
5. Score Chase (the namesake topic).
6. Cashier Rush upgrade.
7. Check Writer upgrade.
8. Phish Tank.
9. The Grind.
10. Fee Detective upgrade.
11. Feed Frenzy.
12. Rainy Day, with the 100-run simulator.
13. Market Dash.
14. The Lot.
15. Money Tree.
16. Lease Life.
17. Going broke and time travel (2.4). Can be built in parallel at any point.

After each game, write its Guide, run its acceptance tests and time 5 full shifts before moving on.

## 4.4 Open items for the teacher
Ask about these before building the affected parts.
1. What is standards category E, and does Lease Life cover it?
2. Firing threshold: 3 risky mode mistakes in one shift is the default. Keep it?
3. Does safe mode still pay coins and XP? This spec assumes yes, with mistakes costing nothing.
4. What exactly counts as "broke" for the Chapter 2 reset?
5. Pay cap: 120 coins for a strong shift. Keep the existing experience, ride and home bonuses on top?
