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

1. Go to https://github.com/grannyconger/credit-life/settings/pages
2. **Source** should say **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. After a minute or two the page shows **Your site is live at https://www.coachw.club/credit-life/**.

## 7. Test it

1. Open https://www.coachw.club/credit-life/
2. Sign in with your school account. You should see "Hi, (your name)!"
3. In Firebase, open **Firestore Database > Data**. A `users` collection with your document should appear.
4. Sign out, then try a personal Gmail account. It should be turned away with
   "Please use your school Google account."
5. Open https://www.coachw.club/credit-life/teacher/ and sign in. It should say you have teacher access.

## 8. Publish the Phase 3 rules (once)

The game now saves creatures, classes, telemetry and bug reports, so the rules need an update.

1. Open https://console.firebase.google.com and click the **credit-life** project.
2. In the left menu, click **Build > Firestore Database**, then the **Rules** tab.
3. Click inside the editor, press **Ctrl+A** (or **Cmd+A** on a Mac) and delete everything.
4. Open https://github.com/grannyconger/credit-life/blob/main/firestore.rules, click the **Copy raw file** button (two overlapping squares, top right of the file), and paste it into the editor.
5. Click **Publish**. Wait for "Rules published."

## 9. Make a class and test the game

1. Open https://www.coachw.club/credit-life/teacher/ and sign in.
2. Under **Your classes**, type a class name (for example `Period 2`) and click **Create class**. A 6-character join code appears in the table.
3. Open https://www.coachw.club/credit-life/ in another tab and play through: name, creature, the join code, age 16, tutorial, time skip, Design Your Card.
4. In Firebase, open **Firestore Database > Data**. You should see `saves`, `classes`, `classCodes` and `telemetry`. Click the 🐞 button in the game once to check that `feedback` appears too.
5. Close the tab partway through, reopen the game, and check that it picks up where you stopped.

## 10. Publish the Phase 4 rules (once)

Phase 4 saves chapter progress and reflections in each student's save, so the rules need one more update. Same steps as section 8:

1. Open https://console.firebase.google.com and click the **credit-life** project.
2. In the left menu, click **Build > Firestore Database**, then the **Rules** tab.
3. Click inside the editor, press **Ctrl+A** (or **Cmd+A** on a Mac) and delete everything.
4. Open https://github.com/grannyconger/credit-life/blob/main/firestore.rules, click the **Copy raw file** button, and paste it into the editor.
5. Click **Publish**. Wait for "Rules published."

Until you publish, students who reach the hub will see "We couldn't save just now."

## 11. Release a chapter

1. Open https://www.coachw.club/credit-life/teacher/ and sign in.
2. In the class table, click **Release Chapter 2** for the class. Confirm the pop-up.
3. Students on the hub click **Check again** (or reload) and **Start Chapter 2** appears.
4. Each chapter is 3 game months. Release the next one when the class is ready. Students can't play past the newest released chapter, but they can replay finished chapters in practice mode, which never changes their real game.
