// Firestore reads and writes. db-local.js has the same functions for ?local testing.
// The life is stored as a JSON string so Firestore never sees undefined values
// or nested arrays, and it loads back exactly.
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
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
  return { creature: d.creature, onboarding: d.onboarding, chapter: d.chapter, play: d.play || null, life: d.lifeJson ? JSON.parse(d.lifeJson) : null };
}

export async function writeSave(uid, save, summary) {
  await setDoc(doc(db, "saves", uid), {
    creature: plain(save.creature),
    onboarding: plain(save.onboarding),
    chapter: save.play?.chapter ?? save.chapter ?? 1,
    play: plain(save.play),
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

// ---------- leaderboard (SPEC §16): creature name, display name and XP only ----------

// The student's real name fields (person, fromPerson, toPerson) need the
// 2026-10-20 rules. Until the teacher publishes them, a refused write is tried
// again without those fields so nothing breaks.
const PERSON_KEYS = ["person", "fromPerson", "toPerson"];
async function withoutPeopleIfRefused(data, write) {
  try {
    await write(data);
  } catch (err) {
    if (err.code !== "permission-denied" || !PERSON_KEYS.some((k) => k in data)) throw err;
    const rest = { ...data };
    for (const k of PERSON_KEYS) delete rest[k];
    await write(rest);
  }
}

export async function writeLeaderboard(classId, uid, entry) {
  await withoutPeopleIfRefused(plain(entry), (d) => setDoc(doc(db, "leaderboards", classId, "players", uid), { ...d, updatedAt: serverTimestamp() }));
}

export async function readLeaderboard(classId) {
  const snap = await getDocs(query(collection(db, "leaderboards", classId, "players"), orderBy("xp", "desc"), limit(50)));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function setLeaderboardOn(classId, on) {
  await updateDoc(doc(db, "classes", classId), { leaderboard: on });
}

// Rules let only the class's own teacher change it, and never its code.
export async function releaseChapter(classId, chapter) {
  await updateDoc(doc(db, "classes", classId), { releasedChapter: chapter });
}

// ---------- social (Phase 8): friends, groups and gifts under social/{classId} ----------

const socialCol = (classId, name) => collection(db, "social", classId, name);

export async function listRequests(classId, uid) {
  const [incoming, outgoing] = await Promise.all([
    getDocs(query(socialCol(classId, "requests"), where("to", "==", uid))),
    getDocs(query(socialCol(classId, "requests"), where("from", "==", uid))),
  ]);
  return [...incoming.docs, ...outgoing.docs].map((d) => ({ id: d.id, ...d.data() }));
}

export async function sendFriendRequest(classId, from, to, fromName, toName, people = {}) {
  await withoutPeopleIfRefused({ from, to, fromName, toName, ...people }, (d) => setDoc(doc(db, "social", classId, "requests", `${from}_${to}`), { ...d, status: "pending", createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
}

export async function answerFriendRequest(classId, id, status) {
  await updateDoc(doc(db, "social", classId, "requests", id), { status, updatedAt: serverTimestamp() });
}

export async function removeFriendRequest(classId, id) {
  await deleteDoc(doc(db, "social", classId, "requests", id));
}

export async function listGroups(classId) {
  const snap = await getDocs(socialCol(classId, "groups"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createGroup(classId, uid, name, icon) {
  const ref = doc(socialCol(classId, "groups"));
  await setDoc(ref, { name, icon, members: [uid], createdBy: uid, createdAt: serverTimestamp() });
  return ref.id;
}

export async function joinGroup(classId, groupId, uid) {
  await updateDoc(doc(db, "social", classId, "groups", groupId), { members: arrayUnion(uid) });
}

// The last member out deletes the group.
export async function leaveGroup(classId, groupId, uid, lastOne) {
  const ref = doc(db, "social", classId, "groups", groupId);
  if (lastOne) await deleteDoc(ref);
  else await updateDoc(ref, { members: arrayRemove(uid) });
}

export async function listGifts(classId, uid) {
  const [incoming, outgoing] = await Promise.all([
    getDocs(query(socialCol(classId, "gifts"), where("to", "==", uid), limit(50))),
    getDocs(query(socialCol(classId, "gifts"), where("from", "==", uid), limit(50))),
  ]);
  const map = (d) => ({ id: d.id, ...d.data(), sentAt: d.data().sentAt?.toMillis?.() ?? null });
  return { incoming: incoming.docs.map(map), outgoing: outgoing.docs.map(map) };
}

// Milliseconds since this student last sent a gift (null if never).
export async function lastGiftAt(uid) {
  const snap = await getDoc(doc(db, "giftLimits", uid));
  return snap.exists() ? snap.data().lastSentAt?.toMillis?.() ?? null : null;
}

// The gift and the 40-hour limit go in one batch. Rules refuse both if it's too soon.
export async function sendGift(classId, gift) {
  await withoutPeopleIfRefused(plain(gift), (d) => {
    const b = writeBatch(db);
    b.set(doc(socialCol(classId, "gifts")), { ...d, sentAt: serverTimestamp(), claimed: false });
    b.set(doc(db, "giftLimits", gift.from), { lastSentAt: serverTimestamp() });
    return b.commit();
  });
}

export async function claimGift(classId, giftId) {
  await updateDoc(doc(db, "social", classId, "gifts", giftId), { claimed: true, claimedAt: serverTimestamp() });
}

// Teacher: everyone's requests and gifts in one class.
export async function listClassSocial(classId) {
  const [r, g] = await Promise.all([getDocs(socialCol(classId, "requests")), getDocs(socialCol(classId, "gifts"))]);
  return { requests: r.docs.map((d) => ({ id: d.id, ...d.data() })), gifts: g.docs.map((d) => ({ id: d.id, ...d.data(), sentAt: d.data().sentAt?.toMillis?.() ?? null })) };
}

// ---------- teacher dashboard (SPEC §20). Rules allow only the class's own teacher ----------

// Every save that names this teacher. Filtered to one class here, so Firestore
// needs no composite index.
export async function listClassSaves(teacherEmail, classId) {
  const snap = await getDocs(query(collection(db, "saves"), where("teacherEmail", "==", teacherEmail.toLowerCase())));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() })).filter((s) => s.classId === classId);
}

export async function updateClass(classId, fields) {
  await updateDoc(doc(db, "classes", classId), fields);
}

// Reset: the student starts over at the next sign-in. Their profile and class stay.
export async function deleteStudentSave(uid, classId) {
  await deleteDoc(doc(db, "saves", uid));
  await deleteDoc(doc(db, "leaderboards", classId, "players", uid)).catch(() => {});
}

export async function listEvents(uid, max = 300) {
  const snap = await getDocs(query(collection(db, "telemetry", uid, "events"), limit(max)));
  return snap.docs.map((d) => d.data());
}

export async function listFeedback(teacherEmail) {
  const snap = await getDocs(query(collection(db, "feedback"), where("teacherEmail", "==", teacherEmail.toLowerCase()), limit(100)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listMyClasses(teacherEmail) {
  const q = query(collection(db, "classes"), where("teacherEmail", "==", teacherEmail.toLowerCase()));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
