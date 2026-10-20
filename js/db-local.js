// Same functions as db.js, kept in this browser's localStorage.
// Used only with ?local on localhost, so the game can be tested without signing in.
export const LOCAL_CLASS = { code: "TEST01", classId: "local-class", name: "Local Test Class" };

export const LOCAL_USER = {
  uid: "local-student",
  displayName: "Local Tester",
  email: "local.tester@greermiddlecollege.org",
  emailVerified: true,
};

const key = (k) => `credit-life:${k}`;

function read(k) {
  try {
    return JSON.parse(localStorage.getItem(key(k)));
  } catch {
    return null;
  }
}

function write(k, v) {
  try {
    localStorage.setItem(key(k), JSON.stringify(v));
  } catch (err) {
    console.warn("Local save failed", err);
  }
}

export async function loadProfile(uid) {
  return read(`users/${uid}`);
}

export async function saveProfileFields(user, fields) {
  write(`users/${user.uid}`, { ...(read(`users/${user.uid}`) || {}), ...fields, email: user.email });
}

export async function findClassByCode(code) {
  return code === LOCAL_CLASS.code ? { classId: LOCAL_CLASS.classId, name: LOCAL_CLASS.name } : null;
}

export async function getClass(classId) {
  return classId === LOCAL_CLASS.classId ? { id: classId, name: LOCAL_CLASS.name, releasedChapter: 1 } : null;
}

export async function loadSave(uid) {
  return read(`saves/${uid}`);
}

export async function writeSave(uid, save, summary) {
  write(`saves/${uid}`, { ...JSON.parse(JSON.stringify(save)), summary });
}

export async function flushTelemetry(uid, batchDoc, rollup) {
  const log = read(`telemetry/${uid}`) || [];
  log.push({ ...batchDoc, rollup });
  write(`telemetry/${uid}`, log.slice(-50));
}

export async function sendFeedback(report) {
  const all = read("feedback") || [];
  all.push(report);
  write("feedback", all.slice(-20));
}

export function resetLocal() {
  for (const k of Object.keys(localStorage)) if (k.startsWith(key(""))) localStorage.removeItem(k);
}
