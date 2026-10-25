# Battle mode: what will strain, and what to do first

Written 2026-10-25, before any Battle code exists. It reads the real code (saves, telemetry, Firestore calls, minigames) and `docs/MODES.md`, measures what it can, and ranks what is likely to break when Battles arrive. Read it before phase 4 (computer battles) and again before phase 5 (live battles).

**The short version:** the game as built is light (a save is about 100 KB at chapter 12, a class period is a few thousand writes). Computer battles will be fine. Live battles are fine on paper, but five habits in today's code would hurt them: every action saves the whole document plus two telemetry writes, nothing listens in real time yet, two tabs overwrite each other, the device clock decides Energy and streaks, and the minigames are not shaped for a head-to-head round. None of that is a reason to wait. Each has a cheap fix, listed below with the phase it belongs in.

## 1. What the game costs today (measured and counted)

- **A save is one document, `saves/{uid}`, rewritten whole.** A bot that plays 12 chapters ends at about **94 KB** (life 33 KB, play 61 KB), growing about **7 KB a chapter**. The Firestore limit is 1 MiB, so there is room, but only if new data is capped. `tests/save-size.test.js` now fails if 12 chapters passes 150 KB or a chapter adds more than 12 KB.
- **Every `persist()` is 3 or 4 writes:** the save, a telemetry events document, the telemetry rollup (a merge), and now and then a leaderboard entry. It runs after every choice, shift and purchase, and again when the tab is hidden.
- **Reads:** list calls only. There is no `onSnapshot` anywhere in the game, so Battles will be the first real-time listeners. The leaderboard, friends, gifts and the teacher page all read a whole list each time they open.
- **A typical session** is about 15 minutes and 20 to 30 saves, so roughly 60 to 100 writes a student. About 25 to 50 students play on a given day, so **2,500 to 5,000 writes a day**, which is 12% to 25% of Spark's 20,000.

## 2. What a battle adds (my count, higher than the 20 writes in MODES.md)

| Item | Writes | Notes |
|---|---|---|
| Create and accept the battle | 2 | |
| Turns (8 turns, each player writes their answer) | 16 | one document, never above 1 write a second |
| Finish and result | 1 | |
| Each player saves once at the start (Energy and the entry fee) | 2 | Must be saved before the match, or a refresh gets the Energy back |
| Each player saves once at the end | 2 | |
| Telemetry for both | 4 | 2 each |
| Ladder entries | 2 | one small document each |
| **Total** | **about 29** | against computers: only the 4 saves, 4 telemetry and 0 for the match, **about 8** |

Reads per live battle: about 12 a player (the opponent's writes plus one to open it), so **about 25**, plus the lobby.

| Scenario | Writes | Reads |
|---|---|---|
| Normal play for 50 students | about 5,000 | about 3,000 |
| Plus 100 live battles in a day (each student about 4) | +2,900 | +2,500 |
| **Same, if every turn also calls `persist()` (the easy mistake)** | **+6,400 more** | |
| Ladder shown on a screen that re-reads all 50 entries on every visit, 10 visits each | | **+25,000** |

So the plan fits Spark comfortably **if** battles save only at the start and the end, and the ladder is not re-read on every visit. A per-turn save or a re-read ladder is what would use up the day.

## 3. Risks, most likely first

### High: fix before the phase named
1. **Per-action saves (phase 4).** Battle turns must never call `game.persist`. Save at the start (Energy and the fee, through engine actions, so a refresh can't refund them) and once at the end. Telemetry gets one compact `battleEnd` event.
2. **Polling instead of listening (phase 5).** A lobby that re-lists open challenges every few seconds is the single quickest way to burn the 50,000 daily reads (50 students polling every 5 seconds for 15 minutes is about 9,000). Use one `onSnapshot` on a narrow query (`battles` where `players` array-contains me and status is open), and only while the Arena screen is open. Cache the ladder for a couple of minutes, or listen to it only on the ladder screen.
3. **Two tabs or two devices (phase 4).** `writeSave` replaces the whole document, so the last tab to save wins. Today that can lose a card. With Energy and a ladder it becomes a cheat: spend Energy in one tab and an old tab saves it back. Fix: a `saveVersion` number checked in a Firestore transaction (rules can check `request.resource.data.version == resource.data.version + 1`), and a `BroadcastChannel` message that tells a second tab "this game is open somewhere else."
4. **Hitting Spark's limit mid-battle (phase 5).** On Spark, saves stop until midnight Pacific. A student would see "We couldn't save" in the middle of a match. Upgrade to **Blaze with a budget alert (a few dollars)** before live battles, as MODES.md already says, and treat the `resource-exhausted` error as "the game is resting" with no penalty: the match ends as a draw and no Energy is lost.

### Medium
5. **The seed is readable (phase 5).** Both players can read the battle document, so a student could compute the opponent's round with the same generator in the console. Fine for a classroom, risky once a ladder pays out. Cheap fix: each player picks a secret nonce, writes only its hash, and reveals it at the end, and rounds come from `seed + nonce`. Both sides then verify the answers after the match.
6. **The device clock (phase 4).** Energy refill, the daily pick and the login streak all use the device clock. Set it forward and Energy refills for free. Use a server time offset: write a `serverTimestamp()` on the first save of a session, store the difference to `Date.now()`, and compute "now" from it. Ranked play needs this, computer play can wait.
7. **Telemetry is not shaped for battles.** `flat()` cuts any object to 200 characters, and the queue holds 200 events, so one event per turn would be dropped or clipped. Log one `battleEnd` with a short summary string (moves, hits, result, seconds).
8. **The minigames are not battle-shaped (phase 4).** Rounds are built inside UI closures with their own timers, and grading lives in the UI files, not in `gen.js`. Both clients must agree on a result, so each battle-eligible game needs a pure `makeRound(rng, difficulty)` and `grade(round, answer)` in `gen.js`, tested in Node, and a thin round runner for the UI. Fee Detective, Spot the Overdraft, Check Anatomy Hunt, Unit Price Showdown and Register Balancer are the closest. Ledger Sort and Cashier Rush are not.
9. **Unbounded lists in the save (phases 4 and 5).** Keep the last 25 battle results plus counters (wins, losses, streak). The ladder rank lives in the leaderboard entry, not in the save. Add the new lists to `tests/save-size.test.js` (it will fail first if one isn't capped).

### Low, but plan for it
10. **Rules that call `get()` cost a read every time.** Do not check the class's "battles on" switch with `get()` on every turn write. Copy it into the battle document when the battle is created.
11. **The teacher page** reads every student's whole save (about 5 MB for 50 students). Show battle stats from the small leaderboard entries instead, which already carry a heartbeat.
12. **A battle document is written at most once a second,** well inside Firestore's limit for one document. A turn timer of 3 seconds or more keeps it that way.
13. **Achievements are evaluated on every save** and scan the whole history. I did not time it. It should be cheap at 12 chapters, but measure it after battles add facts.
14. **Balance:** add a battle simulation (1,000 battles, as the life simulation does) and a test that no move or ability wins more than about 60%, as MODES.md plans. Also a rules test with the Firebase emulator, so the battle rules can be proven before they are pasted into the console.

## 4. A checklist for each phase

**Phase 4, battles against the computer**
- Battle engine pure in `js/engine/`, seeded, with its own simulation and balance test.
- Spend Energy and the fee through engine actions, save once at the start and once at the end. Cap the result list.
- Add `saveVersion` and the second-tab warning.
- Give each eligible minigame a pure `makeRound` and `grade`.
- One `battleEnd` telemetry event. Daily win limits so computer wins can't be farmed.

**Phase 5, live battles**
- Upgrade to Blaze with a budget alert. Add the quota-exceeded handling.
- `battles/{id}` rules: only the two players read and write, the turn number goes up by exactly 1, a result and a rank change can be written only once, and a bounded rank change.
- `onSnapshot` only while the Arena is open, narrow queries, ladder cached.
- Secret-nonce rounds, server time for ranked, a turn timer with a stand-in move.
- Emulator rules tests before the teacher pastes the new rules.

## 5. Changes made today
- `tests/save-size.test.js`: a save-size budget that fails if the save grows without a cap.
- Energy now exists (`play.energy`, capped at 10, earned from side quests). It is the first piece of battle state in the save, and nothing spends it yet.

## 6. Decisions for the teacher
- When to move to Blaze. Recommended: before phase 5, with a budget alert so a bug can't run up a bill.
- Whether computer battles can wait for the second-tab protection (recommended: no, build them together, because Energy makes a double-tab cheat worth doing).
