# Firebase and GitHub setup (one time)

Do these steps while signed in to the Google account that should own the project. Everything stays on the free Spark plan.

## 1. Create the project

1. Go to https://console.firebase.google.com
2. Click **Create a project** (or **Add project**).
3. Name it `credit-life`. Click **Continue**.
4. Turn **Google Analytics** off. Click **Create project**, then **Continue**.
5. Check that the plan in the lower left says **Spark**. Do not upgrade.

## 2. Turn on Google sign-in

1. In the left menu, click **Build > Authentication**, then **Get started**.
2. On the **Sign-in method** tab, click **Google**.
3. Flip **Enable** on. Pick your email as the **Project support email**. Click **Save**.

## 3. Authorize the game's domain

1. Still in Authentication, click the **Settings** tab, then **Authorized domains**.
2. Click **Add domain**, type `www.coachw.club`, click **Add**.
3. Click **Add domain** again, type `coachw.club`, click **Add**.
4. `localhost` is already on the list. Leave it for local testing.

(Your GitHub Pages site uses `www.coachw.club`, so that one is required. The bare domain is added in case anyone types it.)

## 4. Create the database

1. In the left menu, click **Build > Firestore Database**, then **Create database**.
2. Choose **Standard edition** if asked. Click **Next**.
3. Location: **us-east1 (South Carolina)**. Click **Next**. This cannot be changed later.
4. Choose **Start in production mode**. Click **Create**.
5. Open the **Rules** tab. Delete everything in the editor.
6. Paste the full contents of `firestore.rules` from the repo. Click **Publish**.

## 5. Register the web app and copy the config

1. Click the gear icon next to **Project Overview**, then **Project settings**.
2. Under **Your apps**, click the web icon `</>`.
3. Nickname: `credit-life web`. Leave **Firebase Hosting** unchecked. Click **Register app**.
4. You will see a `firebaseConfig = { ... }` block. Copy the six values
   (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
5. Paste them to Claude, or replace the `PASTE_...` values in `js/firebase-config.js` yourself.
   These values are public by design and safe to commit.

## 6. Check GitHub Pages

1. Go to https://github.com/grannyconger/credit-creatures/settings/pages
2. **Source** should say **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. After a minute or two the page shows **Your site is live at https://www.coachw.club/credit-creatures/**.

## 7. Test it

1. Open https://www.coachw.club/credit-creatures/
2. Sign in with your school account. You should see "Hi, (your name)!"
3. In Firebase, open **Firestore Database > Data**. A `users` collection with your document should appear.
4. Sign out, then try a personal Gmail account. It should be turned away with
   "Please use your school Google account."
5. Open https://www.coachw.club/credit-creatures/teacher/ and sign in. It should say you have teacher access.

## 8. Publish the Phase 3 rules (once)

The game now saves creatures, classes, telemetry and bug reports, so the rules need an update.

1. Open https://console.firebase.google.com and click the **credit-life** project.
2. In the left menu, click **Build > Firestore Database**, then the **Rules** tab.
3. Click inside the editor, press **Ctrl+A** (or **Cmd+A** on a Mac) and delete everything.
4. Open https://github.com/grannyconger/credit-creatures/blob/main/firestore.rules, click the **Copy raw file** button (two overlapping squares, top right of the file), and paste it into the editor.
5. Click **Publish**. Wait for "Rules published."

## 9. Make a class and test the game

1. Open https://www.coachw.club/credit-creatures/teacher/ and sign in.
2. Under **Your classes**, type a class name (for example `Period 2`) and click **Create class**. A 6-character join code appears in the table.
3. Open https://www.coachw.club/credit-creatures/ in another tab and play through: name, creature, the join code, age 16, tutorial, time skip, Design Your Card.
4. In Firebase, open **Firestore Database > Data**. You should see `saves`, `classes`, `classCodes` and `telemetry`. Click the 🐞 button in the game once to check that `feedback` appears too.
5. Close the tab partway through, reopen the game, and check that it picks up where you stopped.

## 10. Publish the Phase 4 rules (once)

Phase 4 saves chapter progress and reflections in each student's save, so the rules need one more update. Same steps as section 8:

1. Open https://console.firebase.google.com and click the **credit-life** project.
2. In the left menu, click **Build > Firestore Database**, then the **Rules** tab.
3. Click inside the editor, press **Ctrl+A** (or **Cmd+A** on a Mac) and delete everything.
4. Open https://github.com/grannyconger/credit-creatures/blob/main/firestore.rules, click the **Copy raw file** button, and paste it into the editor.
5. Click **Publish**. Wait for "Rules published."

Until you publish, students who reach the hub will see "We couldn't save just now."

## 11. Release a chapter

1. Open https://www.coachw.club/credit-creatures/teacher/ and sign in.
2. In the class table, click **Release Chapter 2** for the class. Confirm the pop-up.
3. Students on the hub click **Check again** (or reload) and **Start Chapter 2** appears.
4. Each chapter is 3 game months. Release the next one when the class is ready. Students can't play past the newest released chapter, but they can replay finished chapters in practice mode, which never changes their real game.

## 12. Publish the Phase 6 rules (once)

Phase 6 adds the class leaderboard, so the rules need one more update. Same steps as before:

1. Open https://console.firebase.google.com and click the **credit-life** project.
2. In the left menu, click **Build > Firestore Database**, then the **Rules** tab.
3. Click inside the editor, press **Ctrl+A** (or **Cmd+A** on a Mac) and delete everything.
4. Open https://github.com/grannyconger/credit-creatures/blob/main/firestore.rules, click the **Copy raw file** button, and paste it into the editor.
5. Click **Publish**. Wait for "Rules published."

Until you publish, the game still saves. Only the leaderboard stays empty.

## 13. Turn the leaderboard on or off

On `/credit-creatures/teacher/`, the **Leaderboard** column shows **On (turn off)** or **Off (turn on)** for each class. It starts on. It ranks students by XP and shows only creature names, display names and XP.

## 14. Publish the Phase 7 rules (once)

Phase 7 lets you (and only you) read your own students' saves, play data and bug reports for the dashboard. It also limits which class settings can change. Same steps as before:

1. Open https://console.firebase.google.com and click the **credit-life** project.
2. In the left menu, click **Build > Firestore Database**, then the **Rules** tab.
3. Click inside the editor, press **Ctrl+A** (or **Cmd+A** on a Mac) and delete everything.
4. Open https://github.com/grannyconger/credit-creatures/blob/main/firestore.rules, click the **Copy raw file** button, and paste it into the editor.
5. Click **Publish**. Wait for "Rules published."

Then open `/credit-creatures/teacher/`. Each student shows up on the roster after their next save (any button press that saves, like End Month), because that save adds your email to it.

## 15. Using the dashboard

- **Controls:** release the next chapter, pause or resume play, turn the leaderboard on or off, and set months per chapter (1 to 6, for chapters started from then on).
- **Roster:** click a column to sort, click a name for details (decisions, credit report, score chart, achievements). **Download CSV** gives a gradebook-ready file.
- **Flags:** 💵 payday loan, 🚨 collections, 📈 a card 90% or more used, 🔎 3 or more hard inquiries, ⚠️ numbers that don't match the activity log (a sign someone edited their save).
- **Reset this student** (inside their details) deletes their game so they start over. Type RESET to confirm. It can't be undone.
- **Tuning:** click **Load tuning data** for time per month, how the class splits on each card, confusing cards, minigame pay, question accuracy and chapter ratings. **Export tuning data (JSON)** is the file to give Claude in Phase 9.
- **Bug reports:** each 🐞 report, with a download Claude can use to replay the exact problem.

## 16. Publish the Phase 8 rules (once)

Phase 8 adds friends, friend groups and gifts. Same steps as before:

1. Open https://console.firebase.google.com and click the **credit-life** project.
2. In the left menu, click **Build > Firestore Database**, then the **Rules** tab.
3. Click inside the editor, press **Ctrl+A** (or **Cmd+A** on a Mac) and delete everything.
4. Open https://github.com/grannyconger/credit-creatures/blob/main/firestore.rules, click the **Copy raw file** button, and paste it into the editor.
5. Click **Publish**. Wait for "Rules published."

What the rules enforce, so students can't get around them:
- Only classmates can friend each other, see groups or send gifts, and only while **Friends and gifts** is on for the class (dashboard controls).
- Gifts go only to accepted friends: $5 to $50, or a shop item, with a preset message. There's no free text anywhere.
- Up to 4 gifts per student in a 20-hour window, timed by Google's servers, so changing the computer clock doesn't help.
- Groups hold up to 6 students, and students can only add or remove themselves.
- You can see each student's friends and gifts in their details on the dashboard.

## 17. Publish the rules again for creature looks on the leaderboard (once)

The leaderboard now carries each creature's look (body, colors, pattern and what it's wearing), so classmates see it in the leaderboard and Friends. Publish the newest `firestore.rules` the same way as before (Firebase console > **Firestore Database > Rules** > replace everything with https://github.com/grannyconger/credit-creatures/blob/main/firestore.rules > **Publish**). Until you do, the leaderboard still works but shows plain creatures.

## The game moved to credit-creatures (2026-10-20)

The repo was renamed from `credit-life` to `credit-creatures`, so the game now lives at **https://www.coachw.club/credit-creatures/** and the dashboard at **https://www.coachw.club/credit-creatures/teacher/**.
- Saves, classes and join codes are all in Firebase, so nothing about students' games changes.
- `coachw.club` is already an authorized domain in Firebase, so sign-in keeps working. Nothing to change there.
- The old `/credit-life/` link stops working. Share the new link with students.
