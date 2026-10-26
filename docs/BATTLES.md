# Battles (started 2026-10-26)

The teacher asked to begin the multiplayer battles component. This is the first build: battles against the computer and live battles with a classmate, both from one Battle Arena screen. It follows `docs/MODES.md` (the battle plan) and `docs/BATTLE-SCALING.md` (what keeps it cheap on Firestore).

## How a battle plays
- Both creatures start with 100 HP. A battle lasts up to 8 rounds. Whoever has more HP at the end wins, or whoever knocks the other to 0 first.
- A round: pick a move, then answer one quick money question (30 seconds). A right answer plays the move at full power, plus up to 15% for a fast answer. A wrong answer, or running out of time, plays it at half power. The worked math shows after every round.
- Both moves happen at the same time.
- The questions come from the Practice Desk types that are quick and have one clear answer (`ROUND_TYPES` in `js/data/battle.js`). Both players get the same kind of question with different numbers, so answers can't be passed across the room.

## Moves (numbers in `CONFIG.battle.moves`, words in `js/data/battle.js`)
| Move | What it does | Money idea |
|---|---|---|
| Coin Toss | A steady hit (17) | Small, steady choices add up |
| Budget Guard | Take half the hit this round, and your next hit is 30% stronger | A budget softens a bad month |
| Emergency Fund | A cushion (20) that soaks up hits until it runs out. Every 3 rounds | Savings cushion a surprise |
| Compound Interest | 5, then 8, then 11 at the end of each round. Every 3 rounds | Interest grows on itself |
| Payday Loan | A big hit (34) now, then you lose 4 a round for 3 rounds. Every 4 rounds | A quick fix that costs more later |
| Pay in Full | Heal 18 and wipe out interest and loan payback on you. Every 3 rounds | Paying in full means no interest |

**Balance:** `tests/battle.test.js` plays 400 battles per move against the sensible computer player at the same accuracy. No one-move habit wins more than 60% (today: 36% to 46%, the sensible mix does best), and a player who is right 90% of the time beats one who is right 50% of the time at least 75% of the time. Knowing the money is what wins.

## Costs and prizes (`CONFIG.battle`)
- Every battle costs **2 Energy** and a **$5 entry fee** from checking ("Battle entry (Entertainment)" on the statement, through the engine's `debitPurchase`). The fee is blocked if it would leave less than this month's bills and card minimums, so a battle can never cause an overdraft or a late payment.
- **Prizes** (coins, through `receiveCash`): win $25, tie $10. A loss to a classmate pays $5 for playing. A loss to the computer pays nothing, and computer prizes stop after 3 a day, so computer bouts can't be farmed. No XP (the Arcade split stands).
- A student keeps their wins, losses, ties, streak and the last 25 results (`play.battle`).

## Computer opponents
Pip the Sprout (right 55% of the time), Mossbeard (70%) and Old Ledgerhorn (85%). Their moves come from `botAction`, seeded per battle and round. Leaving the Arena in the middle of a bout counts as giving up.

## Live battles with a classmate
- Challenge anyone on the class board. They see the challenge in their Arena right away and can accept or say no thanks. A challenge closes itself after 10 minutes.
- Each player pays when the battle starts on their screen. One write per round per player, and the game saves only at the start and the end.
- Both browsers rebuild the battle from the seed and both players' answers (`replayBattle`), and each grades the other's answer from the seed, so neither has to trust the other.
- If the other player stops answering for 60 seconds, the one still there can end it with no winner, and gets their Energy and fee back.
- **Teacher switch:** "Classmate battles" on the teacher page (on by default). Practice bouts always work.
- **Trying it on one computer:** open http://localhost:8000/?local in one tab and http://localhost:8000/?local&player=2 in another. Each is a different pretend student.

## Code map
- `js/engine/battle.js`: the pure turn math (`newBattle`, `resolveTurn`, `replayBattle`, `availableMoves`, `resultFor`, `botAction`).
- `js/battle.js`: rounds (`roundFor`, `actionFrom`, `turnsFrom`), costs (`canEnter`, `payEntry`, `refundEntry`) and the record (`finishBattle`, `botPrizesLeft`). Tested in Node.
- `js/ui/screens/arena.js` (route `arena`, feature `arena` from Chapter 1, a tile in Things To Do), styles at the end of `css/bestiary.css`.
- `js/db.js` and `js/db-local.js`: `createBattle`, `watchMyBattles`, `watchBattle`, `setBattleStatus`, `submitTurn`, `endBattle`.
- `firestore.rules`: the `battles/{battleId}` block and the class's `battles` switch.
- Telemetry: `arenaOpen`, `battleInvite`, `battleAccept`, `battleDecline`, `battleCancel`, `battleStart`, one compact `battleEnd` (result, prize, rounds, right answers, HP, moves, seconds), `battleGiveUp`, `battleAbandoned`, `battleError`.

## The Firestore battle doc (`battles/{id}`)
`classId`, `players` [challenger, challenged], `live` (both while open, empty once it ends, so one narrow listener finds a student's open battles), `names`, `seed`, `status` (invited, active, done, declined, cancelled, abandoned), `p0` and `p1` (each side's answers by round: move, choice, time left), `winner` (0, 1 or -1 for a tie), `endedBy`.

The rules let only the two players read it (and the class's teacher), only the challenged player accept or decline, only the challenger cancel, each player add exactly one new answer to their own side at a time and never change an old one, and the battle end only once.

## Not built yet (next steps)
- **Blaze:** upgrade before live battles are used by a whole class (`docs/BATTLE-SCALING.md`, item 4), with a budget alert.
- **Two-tab save protection** (`saveVersion` plus a second-tab warning). Energy makes a double-tab cheat worth trying.
- The ranked ladder, teacher pairings and brackets, the small optional wager, extra time for students with accommodations, abilities earned from Skill Sims, secret-nonce rounds and server time for ranked play, and emulator tests for the battle rules.
- Battle stats on the teacher page.
