// Firebase web config. These values are public by design and safe to commit.
// Security comes from Firestore rules (firestore.rules), not from hiding this.
// Paste the values from Firebase console > Project settings > Your apps > Web app.
export const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID",
};

export const SCHOOL_DOMAIN = "greermiddlecollege.org";

export const TEACHER_EMAILS = [
  "bweaver@greermiddlecollege.org",
  "brobinson@greermiddlecollege.org",
];

export const isConfigured = !firebaseConfig.apiKey.startsWith("PASTE_");
