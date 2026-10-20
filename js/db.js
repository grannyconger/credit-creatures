// Firestore reads and writes. db-local.js has the same functions for ?local testing.
// The life is stored as a JSON string so Firestore never sees undefined values
// or nested arrays, and it loads back exactly.
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  increment,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "./firebase.js";

const plain = (o) => JSON.parse(JSON.stringify(o ?? null));

export async function loadProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// Rules require the email on every write to users/{uid}.
export async function saveProfileFields(user, fields) {
  await setDoc(doc(db, "users", user.uid), { ...plain(fields), email: user.email.toLowerCase() }, { merge: true });
}

export async function findClassByCode(code) {
  const snap = await getDoc(doc(db, "classCodes", code));
  if (!snap.exists()) return null;
  return { classId: snap.data().classId, name: snap.data().name };
}

export async function getClass(classId) {
  const snap = await getDoc(doc(db, "classes", classId));
  return snap.exists() ? { id: classId, ...snap.data() } : null;
}

export async function loadSave(uid) {
  const snap = await getDoc(doc(db, "saves", uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { creature: d.creature, onboarding: d.onboarding, chapter: d.chapter, life: d.lifeJson ? JSON.parse(d.lifeJson) : null };
}

export async function writeSave(uid, save, summary) {
  await setDoc(doc(db, "saves", uid), {
    creature: plain(save.creature),
    onboarding: plain(save.onboarding),
    chapter: save.chapter,
    lifeJson: save.life ? JSON.stringify(save.life) : "",
    ...plain(summary),
    updatedAt: serverTimestamp(),
  });
}

// One write for the events since the last flush, one merge for the rollup.
export async function flushTelemetry(uid, batchDoc, rollup) {
  const b = writeBatch(db);
  b.set(doc(collection(db, "telemetry", uid, "events")), { ...plain(batchDoc), createdAt: serverTimestamp() });
  b.set(
    doc(db, "telemetry", uid),
    {
      flushes: increment(1),
      sessions: increment(rollup.newSession ? 1 : 0),
      secondsPlayed: increment(rollup.seconds),
      errors: increment(rollup.errors),
      lastScreen: rollup.lastScreen,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  await b.commit();
}

export async function sendFeedback(report) {
  await addDoc(collection(db, "feedback"), { ...plain(report), createdAt: serverTimestamp() });
}

// ---------- teacher ----------

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newClassCode() {
  let s = "";
  const r = crypto.getRandomValues(new Uint32Array(6));
  for (const n of r) s += CODE_CHARS[n % CODE_CHARS.length];
  return s;
}

// Writes the class and its code together. If the code is taken, the rules
// refuse the batch and we try another code.
export async function createClass(teacherEmail, name) {
  const email = teacherEmail.toLowerCase();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newClassCode();
    const classRef = doc(collection(db, "classes"));
    const b = writeBatch(db);
    b.set(classRef, { name, teacherEmail: email, code, releasedChapter: 1, createdAt: serverTimestamp() });
    b.set(doc(db, "classCodes", code), { classId: classRef.id, name, teacherEmail: email });
    try {
      await b.commit();
      return { id: classRef.id, name, code, releasedChapter: 1 };
    } catch (err) {
      if (err.code !== "permission-denied" || attempt === 4) throw err;
    }
  }
}

export async function listMyClasses(teacherEmail) {
  const q = query(collection(db, "classes"), where("teacherEmail", "==", teacherEmail.toLowerCase()));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
