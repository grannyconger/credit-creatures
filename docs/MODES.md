# Quest mode and Battle mode (DRAFT, nothing built)

The teacher's answers from 2026-10-23, written down so they aren't lost. **Nothing here is approved for building yet.** The teacher wants to keep talking it through first ("Let's talk more"). Open questions are at the bottom. Course standards are in `docs/STANDARDS.md`, and minigames are in `docs/MINIGAMES.md`.

## The big idea
Two ways to play, and quests are the spine:
- **Quest mode** (most like today's game): scenario-based questions, reading, progressive learning in phases, new skills, new vocab and new kinds of scenarios, with coaching of thinking and thought processes. The language is about quests.
- **Battle mode** (students asked for it): turn-based, Pokemon style, against other creatures, built on minigames. Not every minigame can battle.

The class is about life's tradeoffs and making choices based on your values, so battles cost something real (Energy and a little money). Learning in Quest mode is what fuels battling.

## Quest mode (decided)
- **Main quests** are today's chapters, reshaped (Quest 1: Your first bank account, and so on). Each is a chain of quest steps: a new word or two for the field guide, a short reading, scenario questions, and a **Skill Sim** at the end.
- **Side quests** are optional, each tied to a standard, for example Fee Detective for C3 and C5.
- **Coaching is a hint ladder:** a nudge, then a hint, then a worked example, then a similar try with new numbers. It coaches the thinking, never just hands over the answer. Sage is the coach. The teacher page shows how many hints each student needed.

## Battle mode (decided)
- **Start with computer opponents** (100% reliable). Then add ranked matches, challenge a friend, and teacher pairings and brackets. The teacher wants all of these eventually.
- **A turn:** pick a move, then play one quick minigame round. **Accuracy sets most of the move's power, and speed adds a small bonus.** Students with extra time (IEP, 504, set by the teacher) get a longer timer, and the bonus scales to their timer.
- **Costs:** every battle costs **Energy** plus a small **entry fee from checking**, shown as "Entertainment" on statements. The fee is blocked if it would leave less than the bills due, so a battle can never cause an overdraft or a late payment. Fees go through engine actions so the activity log and replays stay correct.
- **Energy** is earned in Quest mode, refills slowly each day, and the teacher can grant it or set a cap.
- **Rewards:** a ranked ladder (the teacher chose the full ladder, visible to everyone), rewards just for playing, and a small optional wager, capped at a few coins.
- **Abilities** come from Skill Sims and badges. They're creature-themed moves whose names and effects echo money ideas.
- **Length:** 3 to 5 minutes, about 6 to 10 turns.
- **Which minigames can battle:** a rule decides. A round takes under about 20 seconds, has one clear right answer, and both players can get an equally hard round from a seed. Each player gets a *different* round of the same difficulty, so answers can't be shared across the room.
- **Rollout:** behind a teacher switch per class. Current saves carry over, with chapters mapped to quests.

## Feasibility (no game server: GitHub Pages plus Firestore)
- **Computer battles** run entirely in the browser. A pure battle engine in `js/engine/`, seeded and tested in Node like the life engine.
- **Live battles** use Firestore live updates, with one write per turn to a `battles/{id}` doc. That's about 20 writes and 40 reads per battle, small next to the free plan's 20,000 writes and 50,000 reads a day. **Upgrade to Blaze before live battles**, because on Spark, hitting a limit stops saves until midnight Pacific.
- **Cheating:** each client works out turns from the shared seed and both answers, and both must agree. Rules allow writing only your own turn, and a rank can change only by a fixed amount tied to a finished battle. Good enough for a classroom.
- **Dropped connections:** a turn timer. A stand-in move is played after the timeout, so every battle ends on schedule. No penalty for Wi-Fi trouble.

## A first proposal for the turn math (to discuss)
- Each creature has 100 HP. A move has a base power (an attack is 20).
- Power = base × (0.5 + 0.5 × accuracy) × (1 + up to 0.15 speed bonus). Accuracy is 1 for right and 0 for wrong, or partial for multi-part rounds. A wrong answer still lands a weak hit (half), so nobody is shut out.
- **Defend** halves the next hit. **Abilities** have a cooldown of 2 to 3 turns.
- These numbers would live in `CONFIG.battle`, with a balance test like the 1,000-life sim: no single move or ability should win more than about 60% of simulated battles.

## Ability ideas (to discuss), Banking (C) and Credit (D) first
| Ability | Skill | What it does in battle | What it echoes |
|---|---|---|---|
| Emergency Fund | Banking | Absorbs the next hit | Savings cushion a surprise |
| Balanced Books | Banking | Your next round is a little easier | Knowing your balance |
| Overdraft Guard | Banking | Blocks a big hit once, costs a turn | Opting out of overdraft |
| Pay in Full | Credit | Clears a debuff from you | No interest when paid in full |
| Compound Interest | Credit | A small hit that grows each turn | Interest grows on itself |
| Payday Loan | Credit | A big boost now, but you lose HP over the next turns | A quick fix that costs more later |

## Edge cases to plan for
Absent students and odd numbers (computer opponents and byes), farming computer wins (Energy limits, smaller rewards after N wins a day), gambling optics (cap the wager, the teacher can turn it off, frame it as an entry fee and prize pool), the full ladder discouraging students who struggle (rank tiers, rank-based matching, the teacher can hide or reset it), the teacher pausing mid-battle (it freezes and resumes), one dominant ability (cooldowns, costs, the balance sim), calculators in math rounds (allowed, the timer accounts for them), accessibility (dyslexia mode, Calm motion, health shown as numbers too), old saves (chapters map to quests), and new teacher page columns (quest step, hints used, skill levels, Sim passes, battle W/L and battle spending).

## Order (each phase stops for the teacher's approval)
1. Minigames: Fee Detective, Bank Reconciliation Match, Deposit Slip Filler, each with skill, standard, eligibility and hint data (see `docs/MINIGAMES.md`).
2. Quest mode behind the teacher switch, with one main quest built fully first as the template.
3. Skill Paths (Banking C, Credit D) and Skill Sims with the coach.
4. Battles against the computer: the engine, Energy, the entry fee, abilities and the arena screen. **Build the two-tab save protection here** (teacher, 2026-10-25: when it's relevant), because Energy makes a double-tab cheat worth trying. See `docs/BATTLE-SCALING.md`.
5. Live battles: friends, ranked matches and the ladder, brackets, the capped wager, and a rules change.

## Still open
- Battle rewards: Sparkle Points or a new coin?
- Energy numbers: cost per battle, daily refill, and earnings per quest step.
- Rank tier names, and when the ladder resets.
- The final ability list per skill.
- How Quest mode and today's Town Hall months fit together: do months stay inside quests?
