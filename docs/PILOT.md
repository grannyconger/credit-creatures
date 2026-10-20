# Pilot run-book (Phase 9)

One class plays Credit Life for real. The game collects play data on its own, and you send Claude one file after the first week. Claude turns it into specific number changes, checked against your students' real games before anything ships.

## Before day 1

1. **Rules are published** in Firebase. Publish `firestore.rules` once with the newest version (`docs/setup-firebase.md` sections 8 to 16 all use the same steps). One publish covers every phase.
2. **Your class exists** on `/credit-creatures/teacher/`, and you have its 6-character join code.
3. **Settings** on the dashboard:
   - Chapters open: 1. Release Chapter 2 when the class has finished Chapter 1.
   - Months per chapter: 3 (about 10 to 15 minutes a chapter).
   - Leaderboard: your choice.
   - Friends and gifts: your choice (you can start with it off and turn it on in week 2).
4. **Play Chapter 1 yourself** with a school account, start to finish. It takes about 15 minutes.
5. **Tell students:**
   - Sign in with your school Google account.
   - Pick fun names, not your real name.
   - The 🐞 button reports problems.
   - Save and quit is always safe.

## Each class day

- Students sign in and pick up exactly where they stopped. A nudge suggests saving after 15 minutes.
- Release the next chapter when most of the class is ready. Students who finish early can use the Practice Desk, the shop, Trophies, or practice an earlier chapter (practice never changes their real game).
- Use **Pause play** if you need everyone's attention. It stops months but keeps accounts, practice and the shop open.
- Glance at the roster flags: 💵 payday loan, 🚨 collections, 📈 maxed card, 🔎 many inquiries, ⚠️ numbers don't match the log. They make good discussion starters.

## Grading

**Download CSV** on the roster. Grade on what's hard to fake (SPEC §20):
- practice accuracy (overall and by standard)
- chapters completed
- reflections written (read them in each student's details)

Treat score, XP and money as motivation, not grades.

## After the first week: send Claude the data

1. On the dashboard, open **Tuning** and click **Load tuning data**.
2. Click **Export tuning data (JSON, no names)**. The file has no names or emails. Students are "Student 1", "Student 2" and so on.
3. Put the file in the `pilot-data/` folder of the project. Git ignores that folder, so it can never be pushed to GitHub.
4. Tell Claude: "pilot data is in pilot-data". Claude runs:
   - `npm run tuning-report -- pilot-data/<file>.json`, which suggests changes with reasons: time per month, money saved per month, lopsided or confusing cards, question difficulty, minigame pay, and chapter ratings.
   - `npm run replay -- pilot-data/<file>.json --set <setting>=<value>`, which re-runs every student's real game with a proposed change and shows how scores, interest, fees and debt would shift.
5. Claude makes the changes in `js/data/config.js`, runs the tests and pushes. Students get the new numbers the next time they load the game.

Also send any 🐞 bug reports. The **Download for Claude** link on each report has what Claude needs to replay the exact problem.

## What "done" looks like (SPEC §24)

The checklist is in `docs/PROGRESS.md` under "Definition of done".
