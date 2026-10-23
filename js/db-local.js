// Same functions as db.js, kept in this browser's localStorage.
// Used only with ?local on localhost, so the game can be tested without signing in.
import { giftWindow } from "./social.js";

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
        social: read("class/social") ?? true,
        sound: read("class/sound") ?? true,
      }
    : null;
}

export async function loadSave(uid) {
  return read(`saves/${uid}`);
}

export async function writeSave(uid, save, summary) {
  write(`saves/${uid}`, { ...JSON.parse(JSON.stringify(save)), summary, updatedAt: Date.now() });
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
  { uid: "c1", creatureName: "Nova Glimmerstone", displayName: "Avery", person: "Avery Lee", xp: 420, rank: "Knight", species: "crystalOwl", palette: "frost", look: { species: "crystalOwl", palette: "frost", pattern: "stars", eyes: "sparkle", accessories: { head: "wizardHat", held: "book", effect: "sparkles" } } },
  { uid: "c2", creatureName: "Biscuit McScales", displayName: "Jordan", person: "Jordan Park", xp: 260, rank: "Squire", species: "mossDragon", palette: "sunny", look: { species: "mossDragon", palette: "sunny", pattern: "spots", accessories: { head: "headphones", feet: "sneakers" } } },
  { uid: "c3", creatureName: "Ember Lanternby", displayName: "Riley", person: "Riley Brooks", xp: 610, rank: "Baron", species: "lanternFox", palette: "ember", look: { species: "lanternFox", palette: "ember", markings: "blush", accessories: { head: "vikingHelmet", neck: "lei", feet: "boots", effect: "hearts" } } },
  { uid: "c4", creatureName: "Puddles", displayName: "Sam", person: "Sam Ortiz", xp: 90, rank: "Apprentice", species: "puddleGolem", palette: "midnight", look: { species: "puddleGolem", palette: "midnight", eyes: "sleepy", accessories: { held: "balloon" } } },
  { uid: "c5", creatureName: "Clover Thistledown", displayName: "Taylor", person: "Taylor Nguyen", xp: 330, rank: "Knight", species: "cloudBunny", palette: "rose", look: { species: "cloudBunny", palette: "rose", pattern: "hearts", eyeColor: "violet", accessories: { head: "bow", feet: "slippers" } } },
];

export async function writeLeaderboard(classId, uid, entry) {
  write("leaderboard/me", { uid, ...entry, updatedAt: Date.now() });
}

export async function readLeaderboard() {
  const me = read("leaderboard/me");
  // "teacherDemoBoard" holds pretend entries for the teacher page's save watch.
  return [...CLASSMATES, ...(read("teacherDemoBoard") || []), ...(me ? [me] : [])].sort((a, b) => b.xp - a.xp);
}

export async function setLeaderboardOn(classId, on) {
  write("class/leaderboard", on);
}

// ---------- teacher dashboard, on the same browser storage ----------

export async function listMyClasses() {
  return [await getClass(LOCAL_CLASS.classId)].map((c) => ({ ...c, code: LOCAL_CLASS.code }));
}

export async function updateClass(classId, fields) {
  const keys = { releasedChapter: "class/released", leaderboard: "class/leaderboard", paused: "class/paused", monthsPerChapter: "class/months", social: "class/social", sound: "class/sound" };
  for (const [k, v] of Object.entries(fields)) if (keys[k]) write(keys[k], v);
}

// "teacherDemo" can hold extra pretend saves, so the dashboard can be tried
// with a full class on localhost.
export async function listClassSaves() {
  const s = read(`saves/${LOCAL_USER.uid}`);
  const demo = read("teacherDemo") || [];
  if (!s) return demo;
  return [{ uid: LOCAL_USER.uid, ...s.summary, creature: s.creature, play: s.play, onboarding: s.onboarding, updatedAt: s.updatedAt, lifeJson: s.life ? JSON.stringify(s.life) : "" }, ...demo];
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

// ---------- /admin on localhost ----------

export async function listAllClasses() {
  return listMyClasses();
}

export async function listAllSaves() {
  return (await listClassSaves()).map((s) => ({ classId: LOCAL_CLASS.classId, teacherEmail: LOCAL_CLASS.teacherEmail, ...s }));
}

export async function listAllFeedback() {
  return listFeedback();
}

export async function setFeedbackStatus(id, status) {
  const all = read("feedback") || [];
  const i = Number(String(id).replace("local-", ""));
  if (all[i]) all[i].status = status;
  write("feedback", all);
}

// ---------- social, with pretend classmates who answer right away ----------

const HOURS = 60 * 60 * 1000;

function social() {
  return (
    read("social") || {
      requests: [{ id: `c3_${LOCAL_USER.uid}`, from: "c3", to: LOCAL_USER.uid, fromName: "Ember Lanternby", fromPerson: "Riley Brooks", toName: "", status: "pending" }],
      groups: [{ id: "g1", name: "The Golden Lanterns", icon: "🏮", members: ["c1", "c2"], createdBy: "c1" }],
      gifts: [{ id: "gift1", from: "c1", to: LOCAL_USER.uid, fromName: "Nova Glimmerstone", fromPerson: "Avery Lee", kind: "money", amount: 20, message: 4, sentAt: Date.now() - 2 * HOURS, claimed: false }],
      giftLimit: null,
    }
  );
}
const saveSocial = (s) => write("social", s);

export async function listRequests() {
  const s = social();
  // Pretend classmates accept requests as soon as they're sent.
  for (const r of s.requests) if (r.from === LOCAL_USER.uid && r.status === "pending") r.status = "accepted";
  saveSocial(s);
  return s.requests;
}

export async function sendFriendRequest(classId, from, to, fromName, toName, people = {}) {
  const s = social();
  if (s.requests.some((r) => r.id === `${to}_${from}`)) throw new Error("They already asked you.");
  s.requests.push({ id: `${from}_${to}`, from, to, fromName, toName, ...people, status: "pending" });
  saveSocial(s);
}

export async function answerFriendRequest(classId, id, status) {
  const s = social();
  s.requests.find((r) => r.id === id).status = status;
  saveSocial(s);
}

export async function removeFriendRequest(classId, id) {
  const s = social();
  s.requests = s.requests.filter((r) => r.id !== id);
  saveSocial(s);
}

export async function listGroups() {
  return social().groups;
}

export async function createGroup(classId, uid, name, icon) {
  const s = social();
  const id = `g${Date.now()}`;
  s.groups.push({ id, name, icon, members: [uid], createdBy: uid });
  saveSocial(s);
  return id;
}

export async function joinGroup(classId, groupId, uid) {
  const s = social();
  const g = s.groups.find((x) => x.id === groupId);
  if (g.members.length >= 6) throw new Error("That group is full.");
  if (!g.members.includes(uid)) g.members.push(uid);
  saveSocial(s);
}

export async function leaveGroup(classId, groupId, uid, lastOne) {
  const s = social();
  if (lastOne) s.groups = s.groups.filter((x) => x.id !== groupId);
  else s.groups.find((x) => x.id === groupId).members = s.groups.find((x) => x.id === groupId).members.filter((m) => m !== uid);
  saveSocial(s);
}

export async function listGifts(classId, uid) {
  const s = social();
  return { incoming: s.gifts.filter((g) => g.to === uid), outgoing: s.gifts.filter((g) => g.from === uid) };
}

export async function giftLimit() {
  return social().giftLimit || null;
}

// The same gift window as the Firestore rules.
export async function sendGift(classId, gift) {
  const s = social();
  const win = giftWindow(s.giftLimit);
  if (!win.left) throw Object.assign(new Error("Too soon"), { code: "permission-denied" });
  s.gifts.push({ id: `gift${Date.now()}`, ...gift, sentAt: Date.now(), claimed: false });
  s.giftLimit = win.fresh ? { windowStart: Date.now(), count: 1 } : { ...s.giftLimit, count: win.count + 1 };
  saveSocial(s);
}

export async function claimGift(classId, giftId) {
  const s = social();
  s.gifts.find((g) => g.id === giftId).claimed = true;
  saveSocial(s);
}

export async function listClassSocial() {
  const s = social();
  return { requests: s.requests, gifts: s.gifts };
}

export function resetLocal() {
  for (const k of Object.keys(localStorage)) if (k.startsWith(key(""))) localStorage.removeItem(k);
}

// Start over, like db.js: a note per email that the game reads on load.
export async function getReset(email) {
  return read(`resets/${String(email).toLowerCase()}`) || null;
}

export async function sendResets(teacherEmail, emails) {
  for (const e of emails) write(`resets/${e.toLowerCase()}`, Date.now());
}
