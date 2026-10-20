// School-only Google sign-in. The hd hint and this check are for a friendly
// experience. Firestore rules are the real gate.
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";
import { SCHOOL_DOMAIN, TEACHER_EMAILS } from "./firebase-config.js";

export const WRONG_ACCOUNT_MESSAGE =
  "Please use your school Google account. It ends in @" + SCHOOL_DOMAIN + ".";

export function isSchoolUser(user) {
  return Boolean(
    user &&
      user.emailVerified &&
      user.email &&
      user.email.toLowerCase().endsWith("@" + SCHOOL_DOMAIN)
  );
}

export function isTeacher(user) {
  return isSchoolUser(user) && TEACHER_EMAILS.includes(user.email.toLowerCase());
}

export async function signIn() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ hd: SCHOOL_DOMAIN, prompt: "select_account" });
  const { user } = await signInWithPopup(auth, provider);
  if (!isSchoolUser(user)) {
    await fbSignOut(auth);
    throw new Error(WRONG_ACCOUNT_MESSAGE);
  }
  await saveProfile(user);
  return user;
}

export function signOut() {
  return fbSignOut(auth);
}

// Calls back with a school user, or null when signed out. Non-school
// sessions are signed out right away.
export function onUser(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (user && !isSchoolUser(user)) {
      fbSignOut(auth);
      callback(null);
      return;
    }
    callback(user);
  });
}

// The Google name goes in googleName. displayName is the student's own pick,
// so it is set only the first time.
async function saveProfile(user) {
  const ref = doc(db, "users", user.uid);
  const existing = await getDoc(ref);
  const fields = {
    googleName: user.displayName || "",
    email: user.email.toLowerCase(),
    lastSignIn: serverTimestamp(),
  };
  if (!existing.exists() || !existing.data().displayName) fields.displayName = user.displayName || "";
  await setDoc(ref, fields, { merge: true });
}
