# Minigames: what exists, what's next, and how each one plugs in

The teacher's Oct 22 idea doc ("Personal Finance Mini Games: Build Specs", 27 games) is folded in here. Only games 1 to 7 and 11 were pasted. The rest (13, 15, 17 to 22, 24, 28, 30, 39 to 42, 45 to 47, 49) still need their specs. The doc was written by a chatbot without our project's context, so **these rules from it don't apply**: a separate game shell with stars and Easy/Medium/Hard menus, no real brands, and localStorage-only progress. Our games are Guild Hall jobs (the job board, the No timer toggle, the Shift over screen, `jobPay`), saved with the game, and real brand names are fine (CLAUDE.md).

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
**6. Fee Detective** (banking, C3 and C5, Battle: yes for single-line rounds)
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

## Ideas for uncovered standards (once the rest of the doc arrives)
Taxes (F) and insurance (B) have no games yet. Paystub games (gross to net, F6), a W-4 or W-2 hunt (F4), sales tax at the register (F3) and a deductible-or-premium sort (B1) would fill the biggest gaps, and most could battle.
