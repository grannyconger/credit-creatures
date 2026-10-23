// Firebase web config. These values are public by design and safe to commit.
// Security comes from Firestore rules (firestore.rules), not from hiding this.
// Paste the values from Firebase console > Project settings > Your apps > Web app.
export const firebaseConfig = {
  apiKey: "AIzaSyA3UTTF_XBxqGT3_Cz0NiLX0f13F_nCiIU",
  authDomain: "credit-life-38e4a.firebaseapp.com",
  projectId: "credit-life-38e4a",
  storageBucket: "credit-life-38e4a.firebasestorage.app",
  messagingSenderId: "252360372988",
  appId: "1:252360372988:web:a18ad24ea1d090096b9d79",
};

export const SCHOOL_DOMAIN = "greermiddlecollege.org";

export const TEACHER_EMAILS = [
  "bweaver@greermiddlecollege.org",
  "brobinson@greermiddlecollege.org",
];

// The only person who can open /admin (bug reports, tuning, every class).
// Firestore rules (isAdmin) are the real gate.
export const ADMIN_EMAIL = "bweaver@greermiddlecollege.org";

export const isConfigured = !firebaseConfig.apiKey.startsWith("PASTE_");
