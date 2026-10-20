// Same functions as db.js, kept in this browser's localStorage.
// Used only with ?local on localhost, so the game can be tested without signing in.
export const LOCAL_CLASS = { code: "TEST01", classId: "local-class", name: "Local Test Class", teacherEmail: "local.teacher@greermiddlecollege.org" };

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
  return classId === LOCAL_CLASS.classId
    ? {
        id: classId,
        name: LOCAL_CLASS.name,
        teacherEmail: LOCAL_CLASS.teacherEmail,
        releasedChapter: read("class/released") || 1,
        leaderboard: read("class/leaderboard") ?? true,
        paused: read("class/paused") ?? false,
        monthsPerChapter: read("class/months") || 3,
      }
    : null;
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

// Local stand-in for the teacher's "Release next chapter" button.
export async function releaseChapter(classId, chapter) {
  if (classId === LOCAL_CLASS.classId) write("class/released", chapter);
}

// Pretend classmates, so the leaderboard has something to rank against.
const CLASSMATES = [
  { uid: "c1", creatureName: "Nova Glimmerstone", displayName: "Avery", xp: 420, rank: "Knight", species: "crystalOwl", palette: "frost" },
  { uid: "c2", creatureName: "Biscuit McScales", displayName: "Jordan", xp: 260, rank: "Squire", species: "mossDragon", palette: "sunny" },
  { uid: "c3", creatureName: "Ember Lanternby", displayName: "Riley", xp: 610, rank: "Baron", species: "lanternFox", palette: "ember" },
  { uid: "c4", creatureName: "Puddles", displayName: "Sam", xp: 90, rank: "Apprentice", species: "puddleGolem", palette: "midnight" },
  { uid: "c5", creatureName: "Clover Thistledown", displayName: "Taylor", xp: 330, rank: "Knight", species: "mossDragon", palette: "rose" },
];

export async function writeLeaderboard(classId, uid, entry) {
  write("leaderboard/me", { uid, ...entry });
}

export async function readLeaderboard() {
  const me = read("leaderboard/me");
  return [...CLASSMATES, ...(me ? [me] : [])].sort((a, b) => b.xp - a.xp);
}

export async function setLeaderboardOn(classId, on) {
  write("class/leaderboard", on);
}

// ---------- teacher dashboard, on the same browser storage ----------

export async function listMyClasses() {
  return [await getClass(LOCAL_CLASS.classId)].map((c) => ({ ...c, code: LOCAL_CLASS.code }));
}

export async function updateClass(classId, fields) {
  const keys = { releasedChapter: "class/released", leaderboard: "class/leaderboard", paused: "class/paused", monthsPerChapter: "class/months" };
  for (const [k, v] of Object.entries(fields)) if (keys[k]) write(keys[k], v);
}

export async function listClassSaves() {
  const s = read(`saves/${LOCAL_USER.uid}`);
  if (!s) return [];
  return [{ uid: LOCAL_USER.uid, ...s.summary, creature: s.creature, play: s.play, onboarding: s.onboarding, lifeJson: s.life ? JSON.stringify(s.life) : "" }];
}

export async function deleteStudentSave(uid) {
  localStorage.removeItem(key(`saves/${uid}`));
  localStorage.removeItem(key("leaderboard/me"));
}

export async function listEvents(uid) {
  return (read(`telemetry/${uid}`) || []).map(({ rollup, ...batch }) => batch);
}

export async function listFeedback() {
  return (read("feedback") || []).map((f, i) => ({ id: `local-${i}`, ...f }));
}

export function resetLocal() {
  for (const k of Object.keys(localStorage)) if (k.startsWith(key(""))) localStorage.removeItem(k);
}
