// Teacher dashboard (SPEC §20): classes, controls, roster, student detail,
// CSV export, the Tuning tab and bug reports. Firestore rules are the real
// gate. This page only shows what the signed-in teacher is allowed to read.
// Add ?local on localhost to try it on the browser test save, with no sign-in.
// Overhaul (teacher request 2026-10-23): one screen with the class strip, a
// summary of who needs help, pacing and grades, then a roster you switch
// between three short views. Settings live in a drawer and each student opens
// in a side panel with tabs. Bestiary colors and fonts, plain and quiet.
import { isConfigured } from "../firebase-config.js";
import { h, add, fill, money, ageLabel } from "../ui/dom.js";
import { icon } from "../ui/icons.js";
import { creatureSvg } from "../ui/creature-art.js";
import { reportTab } from "../ui/accounts/report-tab.js";
import { scoreTab } from "../ui/accounts/score-tab.js";
import { rosterRow, studentDetail, rosterCsv, tuning, tuningExport, classAlley, byName, FLAGS, LESSON_COUNT, parseEmails, needsHelp, pacing, gradeSummary } from "./analyze.js";
import { STALLS } from "../data/alley.js";
import { STANDARD_LABELS } from "../data/practice-questions.js";
import { CONFIG } from "../data/config.js";
import { chapterInfo } from "../data/chapters.js";

const LOCAL = new URLSearchParams(location.search).has("local") && ["localhost", "127.0.0.1"].includes(location.hostname);
const VIEW_KEY = "credit-creatures:teacherView";
const root = document.getElementById("teacher");
const state = { me: null, db: null, classes: [], classId: null, tab: "roster", view: savedView(), search: "", saves: [], rows: [], loaded: false, sort: ["lastName", 1], tuning: null, feedback: null, social: null, openUid: null, helpAll: false };

boot();

function savedView() {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return ["progress", "credit", "game"].includes(v) ? v : "progress";
  } catch {
    return "progress";
  }
}

async function boot() {
  if (LOCAL) {
    state.db = await import("../db-local.js");
    state.me = { email: "local.teacher@greermiddlecollege.org", displayName: "Local Teacher" };
    document.getElementById("sign-out").hidden = true;
    return loadClasses();
  }
  if (!isConfigured) return fill(root, h("p.t-error", "Sign-in is not set up yet."));
  const [auth, db] = await Promise.all([import("../auth.js"), import("../db.js")]);
  state.db = db;
  auth.onUser((user) => {
    state.me = user;
    document.getElementById("sign-out").hidden = !user;
    if (!user) return signedOut(auth);
    if (!auth.isTeacher(user)) {
      return fill(root, h("section.t-empty", h("p", "This page is for teachers only."), h("button.t-btn", { type: "button", onclick: () => auth.signOut() }, "Sign out")));
    }
    loadClasses();
  });
  document.getElementById("sign-out")?.addEventListener("click", () => auth.signOut());
}

function signedOut(auth) {
  const err = h("p.t-error", { role: "alert" });
  fill(
    root,
    h(
      "section.t-empty",
      h("h2", "Sign in to see your classes"),
      h(
        "button.t-btn.primary",
        {
          type: "button",
          onclick: async () => {
            try {
              await auth.signIn();
            } catch (e) {
              if (e.code !== "auth/popup-closed-by-user") err.textContent = "Sign-in did not work. Please try again.";
            }
          },
        },
        "Sign in with your school Google account"
      ),
      err
    )
  );
}

async function loadClasses() {
  fill(root, h("p.t-muted", "Loading your classes..."));
  try {
    state.classes = (await state.db.listMyClasses(state.me.email)).sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error(err);
    return fill(root, h("p.t-error", "Could not load your classes. Check that the newest Firestore rules are published (docs/setup-firebase.md)."));
  }
  if (!state.classId && state.classes.length) state.classId = state.classes[0].id;
  paint();
  if (state.classId) loadRoster();
}

const cls = () => state.classes.find((c) => c.id === state.classId);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const fullName = (r) => [r.firstName, r.lastName].filter(Boolean).join(" ") || r.studentName || r.studentEmail || r.uid;
const listName = (r) => (r.lastName ? `${r.lastName}, ${r.firstName}` : fullName(r));

function switchClass(id) {
  Object.assign(state, { classId: id, tuning: null, feedback: null, social: null, saves: [], rows: [], loaded: false, search: "", helpAll: false });
  paint();
  loadRoster();
}

// ---------- the page ----------

function paint() {
  paintHeader();
  const c = cls();
  if (!c) {
    return fill(
      root,
      h("section.t-empty", h("h2", "Make your first class"), h("p", "Students type its join code after they make their creature."), LOCAL ? null : createForm()),
      startOverForm()
    );
  }
  fill(
    root,
    h("div", { id: "t-strip" }, classStrip(c)),
    h("div", { id: "t-summary" }, summary()),
    h(
      "nav.t-tabs",
      { "aria-label": "Dashboard" },
      [
        ["roster", "people", "Roster", null],
        ["tuning", "chart", "Tuning", null],
        ["bugs", "bug", "Bug reports", state.feedback?.length || null],
      ].map(([k, mark, label, count]) =>
        h(
          "button",
          { type: "button", "aria-current": state.tab === k ? "page" : null, onclick: () => ((state.tab = k), paint()) },
          icon(mark, { size: 18 }),
          label,
          count ? h("span.t-count", { "aria-label": `${count} reports` }, count) : null
        )
      )
    ),
    h("div", { id: "tab-body" }, tabBody())
  );
}

function paintHeader() {
  const who = document.getElementById("t-who");
  if (who) who.textContent = `${state.me.displayName || state.me.email}${LOCAL ? " (local test)" : ""}`;
  const slot = document.getElementById("t-picker");
  if (!slot) return;
  if (state.classes.length < 2) return fill(slot);
  fill(
    slot,
    h("label.t-sr", { for: "class-pick" }, "Class"),
    h(
      "select",
      { id: "class-pick", onchange: (e) => switchClass(e.target.value) },
      state.classes.map((c) => h("option", { value: c.id, selected: c.id === state.classId }, c.name))
    )
  );
}

function repaintSummary() {
  const strip = document.getElementById("t-strip");
  if (strip && cls()) fill(strip, classStrip(cls()));
  const box = document.getElementById("t-summary");
  if (box) fill(box, summary());
}

// ---------- class strip: name, code, chapter and the one loud button ----------

async function saveClass(c, fields, label) {
  try {
    await state.db.updateClass(c.id, fields);
    Object.assign(c, fields);
    repaintSummary();
    return true;
  } catch (err) {
    console.error(err);
    alert(`Could not change ${label}. Check that the newest Firestore rules are published.`);
    return false;
  }
}

function classStrip(c) {
  const open = c.releasedChapter || 1;
  const next = open + 1;
  const status = (mark, text) => h("li", icon(mark, { size: 16 }), text);
  return h(
    "section.t-strip",
    { "aria-label": "Class" },
    h(
      "div.t-strip-name",
      h("h1", c.name),
      h("p", "Join code ", h("strong.t-code", c.code || ""))
    ),
    h(
      "ul.t-status",
      status(c.paused ? "pause" : "check", c.paused ? "Paused" : "Running"),
      status("calendar", `${plural(c.monthsPerChapter || CONFIG.pacing.monthsPerChapter, "month")} per chapter`),
      status("trophy", c.leaderboard === false ? "Leaderboard off" : "Leaderboard on"),
      status("gift", c.social === false ? "Friends off" : "Friends on"),
      status(c.sound === false ? "mute" : "volume", c.sound === false ? "Sound muted" : "Students choose sound")
    ),
    h(
      "div.t-strip-actions",
      h(
        "div.t-chapter",
        h("span", `Chapters 1 to ${open} open`),
        h(
          "button.t-btn.primary",
          {
            type: "button",
            onclick: () => confirm(`Open Chapter ${next} (${chapterInfo(next).title}) for ${c.name}? Students can start it right away.`) && saveClass(c, { releasedChapter: next }, "the chapter"),
          },
          `Release Chapter ${next}`
        )
      ),
      h("button.t-btn", { type: "button", onclick: () => openSettings(c) }, icon("gear", { size: 18 }), "Class settings")
    )
  );
}

// ---------- the summary: who needs help, pacing, grades ----------

function summary() {
  if (!state.loaded) return h("p.t-muted.t-summary-wait", "Loading students...");
  if (!state.rows.length) return h("p.t-empty-line", `No students yet. Students appear here after they join with code ${cls().code || ""} and save once.`);
  return h("section.t-summary", { "aria-label": "Class summary" }, helpPanel(), pacingPanel(), gradesPanel());
}

const nameLink = (r) => h("button.t-link", { type: "button", onclick: () => detail(r.uid) }, fullName(r));

function helpPanel() {
  const list = needsHelp(state.rows, { inactiveDays: CONFIG.teacher.inactiveDays });
  const shown = state.helpAll ? list : list.slice(0, 5);
  const bugs = state.feedback?.length || 0;
  return h(
    "div.t-panel-col.t-help",
    h("h2", "Needs help", list.length ? h("span.t-count", list.length) : null),
    list.length
      ? h(
          "ul.t-help-list",
          shown.map((x) =>
            h(
              "li",
              nameLink(x.row),
              h("span.t-reasons", x.reasons.slice(0, 2).map((r) => h("span.t-reason", { title: r.label }, icon(r.mark, { size: 15 }), r.kind === "inactive" ? r.label : FLAGS[r.kind].short)), x.reasons.length > 2 ? h("span.t-muted", `+${x.reasons.length - 2} more`) : null)
            )
          )
        )
      : h("p.t-ok", icon("check", { size: 18 }), "Nobody right now."),
    list.length > 5 ? h("button.t-link", { type: "button", onclick: () => ((state.helpAll = !state.helpAll), repaintSummary()) }, state.helpAll ? "Show fewer" : `Show all ${list.length}`) : null,
    bugs ? h("button.t-link.t-bugs-link", { type: "button", onclick: () => ((state.tab = "bugs"), paint()) }, icon("bug", { size: 16 }), plural(bugs, "bug report")) : null
  );
}

const PACE = [
  ["finished", "finished"],
  ["working", "working on it"],
  ["behind", "in an earlier chapter"],
  ["prologue", "in the prologue"],
  ["setup", "still setting up"],
];

function pacingPanel() {
  const c = cls();
  const open = c.releasedChapter || 1;
  const p = pacing(state.rows, open, CONFIG.teacher.readyShare);
  const parts = PACE.filter(([k]) => p[k]);
  return h(
    "div.t-panel-col.t-pace",
    h("h2", "Pacing"),
    h("p.t-pace-title", `Chapter ${open}: ${chapterInfo(open).title}`),
    h(
      "div.t-bar",
      { role: "img", "aria-label": parts.map(([k, w]) => `${p[k]} ${w}`).join(", ") },
      parts.map(([k]) => h("span", { class: `seg-${k}`, style: `flex: ${p[k]}` }, p[k]))
    ),
    h("ul.t-legend", parts.map(([k, w]) => h("li", h("span.t-swatch", { class: `seg-${k}`, "aria-hidden": "true" }), h("strong", p[k]), ` ${w}`))),
    p.ready ? h("p.t-ready", icon("check", { size: 18 }), `${p.finished} of ${p.total} finished. The class looks ready for Chapter ${open + 1}.`) : h("p.t-muted", `${p.finished} of ${p.total} finished Chapter ${open}.`)
  );
}

function gradesPanel() {
  const g = gradeSummary(state.rows);
  const owe = g.missingReflections;
  const big = (value, label) => h("div.t-big", h("strong", value), h("span", label));
  return h(
    "div.t-panel-col.t-grades",
    h("h2", "Grades"),
    h("div.t-bigs", big(g.practice == null ? "–" : `${g.practice}%`, "practice accuracy"), big(g.chapters ?? "–", "chapters done"), big(g.reflections ?? "–", "reflections")),
    h("p.t-muted.t-small", "Class medians. Grade on these three. Score and XP are for motivation."),
    owe.length
      ? h("p.t-owe", h("strong", `${plural(owe.length, "student")} owe a reflection: `), joinNodes(owe.slice(0, 4).map((x) => nameLink(x.row))), owe.length > 4 ? ` and ${owe.length - 4} more` : "")
      : h("p.t-ok", icon("check", { size: 18 }), "Every finished chapter has a reflection.")
  );
}

function joinNodes(nodes) {
  return nodes.flatMap((n, i) => (i ? [", ", n] : [n]));
}

// ---------- settings drawer ----------

function openSettings(c) {
  const dialog = h("dialog.t-drawer", { "aria-labelledby": "t-settings-title" });
  const body = h("div.t-drawer-body");
  const close = () => dialog.close();
  dialog.addEventListener("close", () => dialog.remove());
  const repaint = () => fill(body, settingsBody(c, repaint));
  repaint();
  add(dialog, h("header.t-drawer-head", h("h2", { id: "t-settings-title" }, "Class settings"), h("button.t-btn", { type: "button", onclick: close }, "Close")), body);
  document.body.append(dialog);
  dialog.showModal();
}

function settingsBody(c, repaint) {
  const toggle = async (fields, label) => (await saveClass(c, fields, label)) && repaint();
  const row = (title, now, hint, control) => h("div.t-setting", h("div", h("strong", title), h("span.t-now", now), hint ? h("small.t-muted", hint) : null), control);
  const months = h(
    "select",
    { id: "months", "aria-label": "Months per chapter", onchange: (e) => toggle({ monthsPerChapter: Number(e.target.value) }, "months per chapter") },
    [1, 2, 3, 4, 5, 6].map((n) => h("option", { value: n, selected: (c.monthsPerChapter || CONFIG.pacing.monthsPerChapter) === n }, plural(n, "month")))
  );
  return [
    h(
      "section.t-drawer-section",
      row("Play", c.paused ? "Paused" : "Running", "Pausing stops students from playing until you resume.", h("button.t-btn", { type: "button", onclick: () => toggle({ paused: !c.paused }, "pause") }, c.paused ? "Resume play" : "Pause play")),
      row("Months per chapter", "", "Applies to chapters students start from now on.", months),
      row("Leaderboard", c.leaderboard === false ? "Off" : "On", null, h("button.t-btn", { type: "button", onclick: () => toggle({ leaderboard: c.leaderboard === false }, "the leaderboard") }, c.leaderboard === false ? "Turn on" : "Turn off")),
      row("Friends and gifts", c.social === false ? "Off" : "On", null, h("button.t-btn", { type: "button", onclick: () => toggle({ social: c.social === false }, "friends and gifts") }, c.social === false ? "Turn on" : "Turn off")),
      row("Sound effects", c.sound === false ? "Muted for everyone" : "Students choose", null, h("button.t-btn", { type: "button", onclick: () => toggle({ sound: c.sound === false }, "sound effects") }, c.sound === false ? "Let students choose" : "Mute for everyone"))
    ),
    LOCAL ? null : h("section.t-drawer-section", h("h3", "Another class"), createForm()),
    h("section.t-drawer-section.t-careful", h("h3", icon("alert", { size: 18 }), "Careful"), startOverForm(), LOCAL ? null : deleteBox(c)),
  ];
}

function createForm() {
  const name = h("input", { id: "class-name", type: "text", maxlength: 40, placeholder: "Period 2 Personal Finance", required: true });
  const err = h("p.t-error", { role: "alert" });
  return h(
    "form.t-create",
    {
      onsubmit: async (e) => {
        e.preventDefault();
        if (!name.value.trim()) return;
        try {
          const c = await state.db.createClass(state.me.email, name.value.trim());
          state.classes.push(c);
          document.querySelector("dialog.t-drawer")?.close();
          switchClass(c.id);
        } catch (er) {
          console.error(er);
          err.textContent = "Could not create the class. Check that the newest Firestore rules are published.";
        }
      },
    },
    h("label", { for: "class-name" }, "New class name"),
    h("div.t-row", name, h("button.t-btn", { type: "submit" }, "Create class")),
    err
  );
}

// ---------- send students back to the start ----------

// Teacher request 2026-10-22: deleting a class didn't reset students who had
// the game open, and their games then pointed at no class, so they didn't show
// on any roster. A note per email makes the student's own game start
// completely over the next time it loads (or when they come back to an open
// tab). They make a new creature and join with a class code.
function startOverForm() {
  const box = h("textarea", { id: "reset-emails", rows: 4, placeholder: "student1@greermiddlecollege.org\nstudent2@greermiddlecollege.org" });
  const msg = h("p", { role: "status" });
  const btn = h("button.t-btn.danger", { type: "button" }, "Send these students back to the start");
  btn.addEventListener("click", async () => {
    const { good, bad } = parseEmails(box.value);
    msg.className = "t-error";
    if (bad.length) return (msg.textContent = `These aren't school emails, so nothing was sent: ${bad.join(", ")}. Fix them and try again.`);
    if (!good.length) return (msg.textContent = "Paste at least one student email.");
    if (!confirm(`Send ${plural(good.length, "student")} back to the start? Their creature, money, score, XP and everything else are wiped the next time they open the game. This can't be undone.`)) return;
    btn.disabled = true;
    try {
      await state.db.sendResets(state.me.email, good);
    } catch (e) {
      console.error(e);
      btn.disabled = false;
      return (msg.textContent = "Could not send the resets. Check that the newest Firestore rules are published (docs/setup-firebase.md).");
    }
    btn.disabled = false;
    box.value = "";
    msg.className = "t-muted";
    msg.textContent = `Done. ${plural(good.length, "student")} will start over at the opening story the next time they open the game, then join with your class code.`;
  });
  return h(
    "details.t-fold",
    h("summary", "Send students back to the start"),
    h("p", "Paste school emails, one per line. Each student's game is wiped the next time they open it (or come back to an open tab), and they start over at the opening story. They make a new creature and join with your class code. It works even if their class was deleted."),
    h("label", { for: "reset-emails" }, "Student emails"),
    box,
    h("div.t-row", btn),
    msg
  );
}

// Delete a class (teacher request 2026-10-22). The teacher types the class
// name to confirm, because every student's game in it is deleted too.
function deleteBox(c) {
  const err = h("p.t-error", { role: "alert" });
  const typed = h("input", { id: "delete-name", type: "text", autocomplete: "off", placeholder: c.name });
  const btn = h("button.t-btn.danger", { type: "button", disabled: true }, "Delete this class");
  typed.addEventListener("input", () => (btn.disabled = typed.value.trim() !== c.name));
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    err.textContent = "";
    try {
      // Read the roster fresh, so no student's save is left behind.
      const saves = await state.db.listClassSaves(state.me.email, c.id);
      const n = saves.length;
      if (!confirm(`Delete ${c.name} for good? ${n ? `${plural(n, "student game")} will be deleted too. ` : ""}This can't be undone.`)) {
        btn.disabled = false;
        return;
      }
      await state.db.deleteClass(c.id, c.code, saves.map((s) => s.uid));
    } catch (e) {
      console.error(e);
      btn.disabled = false;
      err.textContent = "Could not delete the class. Check that the newest Firestore rules are published (docs/setup-firebase.md).";
      return;
    }
    document.querySelector("dialog.t-drawer")?.close();
    state.classes = state.classes.filter((x) => x.id !== c.id);
    if (state.classes[0]) switchClass(state.classes[0].id);
    else {
      Object.assign(state, { classId: null, saves: [], rows: [], tuning: null, feedback: null, social: null });
      paint();
    }
  });
  return h(
    "details.t-fold",
    h("summary", "Delete this class"),
    h("p", `This deletes the class, its join code, its leaderboard and every student's game in it. Students start over the next time they sign in and can join another class. It can't be undone.`),
    h("label", { for: "delete-name" }, `Type the class name (${c.name}) to confirm`),
    h("div.t-row", typed, btn),
    err
  );
}

// ---------- roster ----------

async function loadRoster() {
  state.loaded = false;
  state.rows = [];
  paintTab(h("p.t-muted", "Loading students..."));
  repaintSummary();
  loadFeedback();
  try {
    state.saves = await state.db.listClassSaves(state.me.email, state.classId);
  } catch (err) {
    console.error(err);
    return paintTab(h("p.t-error", "Could not load the roster. Check that the newest Firestore rules are published."));
  }
  state.rows = state.saves.map((s) => {
    try {
      return rosterRow(s);
    } catch (err) {
      console.error(err);
      return { uid: s.uid, studentName: s.studentName || s.uid, firstName: "", lastName: "", chaptersDone: 0, reflections: 0, flags: [], mismatches: [`Could not read this save: ${err.message}`], accountTypes: [], accuracy: {}, lastPlayed: null };
    }
  });
  state.loaded = true;
  repaintSummary();
  if (state.tab === "roster") paintTab(roster());
}

function paintTab(...kids) {
  const body = document.getElementById("tab-body");
  if (body) fill(body, ...kids);
}

function tabBody() {
  if (state.tab === "tuning") return tuningView();
  if (state.tab === "bugs") return bugsView();
  return state.loaded ? roster() : h("p.t-muted", "Loading students...");
}

const pctCell = (v) => (v == null ? "–" : `${v}%`);
const DAY = 24 * 60 * 60 * 1000;

function ago(ms) {
  if (ms == null) return "–";
  const days = Math.floor((Date.now() - ms) / DAY);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function chapterCell(r) {
  if (r.step === "prologue") return "Prologue";
  if (!["hub", "done"].includes(r.step) && !r.chaptersDone) return "Setting up";
  return `Chapter ${r.chapter}`;
}

function flagCell(r) {
  if (!r.flags.length) return h("span.t-muted", "None");
  return h("span.t-reasons", r.flags.map((f) => h("span.t-reason", { title: FLAGS[f].label }, icon(FLAGS[f].mark, { size: 15 }), FLAGS[f].short)));
}

// Each view is about six columns. sort is the row field it sorts by.
const VIEWS = {
  progress: {
    label: "Progress",
    columns: [
      { key: "creatureName", label: "Creature", cell: (r) => r.creatureName || "–" },
      { key: "chapter", label: "Chapter", cell: chapterCell },
      { key: "chaptersDone", label: "Chapters done", num: true, cell: (r) => r.chaptersDone },
      { key: "reflections", label: "Reflections", num: true, cell: (r) => (r.chaptersDone ? `${r.reflections} of ${r.chaptersDone}` : r.reflections) },
      { key: "accuracyAll", label: "Practice", num: true, cell: (r) => pctCell(r.accuracyAll) },
      { key: "lastPlayed", label: "Last played", cell: (r) => ago(r.lastPlayed) },
    ],
  },
  credit: {
    label: "Credit",
    columns: [
      { key: "score", label: "Score", num: true, cell: (r) => r.score ?? "–" },
      { key: "onTimePct", label: "On time", num: true, cell: (r) => pctCell(r.onTimePct) },
      { key: "utilization", label: "Card use", num: true, cell: (r) => pctCell(r.utilization) },
      { key: "accounts", label: "Accounts", cell: (r) => (r.accountTypes?.length ? r.accountTypes.join(", ") : "–") },
      { key: "flags", label: "Flags", cell: flagCell },
    ],
  },
  game: {
    label: "Game",
    columns: [
      { key: "xp", label: "XP", num: true, cell: (r) => h("span", `${r.xp ?? 0} `, h("small.t-muted", r.rank || "")) },
      { key: "achievements", label: "Achievements", num: true, cell: (r) => r.achievements ?? 0 },
      { key: "alleyRight", label: "Lantern Alley", num: true, cell: (r) => (r.alleyRight == null ? "–" : `${r.alleyRight} of ${r.alleyChecked}`) },
      { key: "lessons", label: "Lessons", num: true, cell: (r) => `${r.lessons ?? 0} of ${LESSON_COUNT}` },
      { key: "dreamStage", label: "Dream", num: true, cell: (r) => `Stage ${r.dreamStage ?? 0} of 3` },
    ],
  },
};

function sortValue(r, key) {
  if (key === "flags") return r.flags.length;
  if (key === "accounts") return r.accountTypes?.length ?? 0;
  return r[key];
}

function setView(v) {
  state.view = v;
  try {
    localStorage.setItem(VIEW_KEY, v);
  } catch {}
  if (state.sort[0] !== "lastName" && !VIEWS[v].columns.some((c) => c.key === state.sort[0])) state.sort = ["lastName", 1];
  paintTab(roster());
}

function roster() {
  if (!state.rows.length) return h("p.t-empty-line", "No students yet. Students appear here after they join with the class code and save once.");
  const view = VIEWS[state.view];
  const [key, dir] = state.sort;
  const sorted = state.rows.slice().sort((a, b) => {
      if (key === "lastName") return byName(a, b) * dir;
      const x = sortValue(a, key);
      const y = sortValue(b, key);
      if (x == null && y == null) return byName(a, b);
      if (x == null) return 1;
      if (y == null) return -1;
      const c = typeof x === "string" ? x.localeCompare(y) : x - y;
      return (c || byName(a, b)) * dir;
    });
  const matching = () => {
    const q = state.search.trim().toLowerCase();
    return q ? sorted.filter((r) => [r.firstName, r.lastName, r.studentName, r.creatureName, r.studentEmail].some((x) => (x || "").toLowerCase().includes(q))) : sorted;
  };
  const csv = () => {
    // The CSV always has every column, whatever view is showing.
    const all = state.rows.slice().sort(byName);
    const blob = new Blob([rosterCsv(all)], { type: "text/csv" });
    const a = h("a", { href: URL.createObjectURL(blob), download: `${cls().name.replace(/\W+/g, "-")}-credit-creatures.csv` });
    document.body.append(a);
    a.click();
    a.remove();
  };
  const head = (k, label, num) =>
    h(
      "th",
      { class: num ? "num" : null, "aria-sort": key === k ? (dir > 0 ? "ascending" : "descending") : null },
      h("button", { type: "button", onclick: () => ((state.sort = [k, key === k ? -dir : num ? -1 : 1]), paintTab(roster())) }, label, key === k ? h("span.t-sort", { "aria-hidden": "true" }, dir > 0 ? " ↑" : " ↓") : null)
    );
  const search = h("input.t-search", { type: "search", placeholder: "Find a student", value: state.search, "aria-label": "Find a student" });
  // Search swaps only the table, so typing keeps focus in the box.
  search.addEventListener("input", () => {
    state.search = search.value;
    const body = document.getElementById("t-roster-table");
    if (body) body.replaceWith(table());
  });
  const table = () => {
    const rows = matching();
    return h(
      "div.t-table-wrap",
      { id: "t-roster-table" },
      h(
        "table.t-table",
        h("thead", h("tr", head("lastName", "Student"), view.columns.map((c) => head(c.key, c.label, c.num)))),
        h(
          "tbody",
          rows.map((r) =>
            h(
              "tr",
              { "data-uid": r.uid, class: r.uid === state.openUid ? "is-open" : null },
              h("th", { scope: "row" }, h("button.t-link", { type: "button", onclick: () => detail(r.uid) }, listName(r))),
              view.columns.map((c) => h("td", { class: c.num ? "num" : null }, c.cell(r)))
            )
          )
        )
      ),
      rows.length ? null : h("p.t-muted", `No student matches "${state.search}".`)
    );
  };
  return h(
    "div.t-roster",
    h(
      "div.t-toolbar",
      h(
        "div.t-views",
        { role: "group", "aria-label": "Columns to show" },
        Object.entries(VIEWS).map(([k, v]) => h("button", { type: "button", "aria-pressed": String(state.view === k), onclick: () => setView(k) }, v.label))
      ),
      h("label.t-search-wrap", icon("search", { size: 16 }), search),
      h("span.t-muted", plural(state.rows.length, "student")),
      h("div.t-row.t-toolbar-end", h("button.t-btn", { type: "button", onclick: loadRoster }, "Refresh"), h("button.t-btn", { type: "button", onclick: csv, title: "Every column, for your gradebook" }, "Download CSV"))
    ),
    table(),
    state.view === "game" ? alleyTable() : null
  );
}

// Which Lantern Alley offers fool the class (Phase 14). Traps first, the
// hardest at the top. Good for a class discussion.
function alleyTable() {
  const rows = classAlley(state.saves);
  if (!rows.some((r) => r.n)) return h("p.t-muted.t-after", "Lantern Alley opens in Chapter 5. Which offers fool the class will show here.");
  const p = (v) => (v == null ? "–" : `${v}%`);
  return h(
    "section.t-after",
    h("h3", "Lantern Alley: which offers fool the class"),
    h("p.t-muted", "Each offer is a trap or a fair deal. \"Read first\" means the student opened the fine print before deciding."),
    h(
      "div.t-table-wrap",
      h(
        "table.t-table",
        h("thead", h("tr", h("th", "Offer"), h("th", "It's"), h("th.num", "Students"), h("th.num", "Called right"), h("th.num", "Read first"), h("th.num", "Right when read first"))),
        h("tbody", rows.map((r) => h("tr", h("td", r.name), h("td", r.trap ? "Trap" : "Fair deal"), h("td.num", r.n), h("td.num", p(r.rightPct)), h("td.num", p(r.readPct)), h("td.num", p(r.rightWhenReadPct)))))
      )
    )
  );
}

// ---------- student detail: a side panel with tabs ----------

function detail(uid) {
  document.querySelector("dialog.t-side")?.close();
  const raw = state.saves.find((s) => s.uid === uid);
  if (!raw) return;
  const d = studentDetail(raw);
  const r = d.row;
  state.openUid = uid;
  markOpenRow();
  const dialog = h("dialog.t-side", { "aria-label": `Details for ${fullName(r)}` });
  const close = () => dialog.close();
  dialog.addEventListener("close", () => {
    dialog.remove();
    state.openUid = null;
    markOpenRow();
  });
  // A click on the dimmed page beside the panel closes it.
  dialog.addEventListener("click", (e) => e.target === dialog && close());
  const reset = async () => {
    const typed = prompt(`Reset ${fullName(r)}? Their creature, money, score, XP and reflections are deleted, and they start over at the next sign-in. This can't be undone. Type RESET to confirm.`);
    if (typed !== "RESET") return;
    try {
      await state.db.deleteStudentSave(uid, state.classId);
      // The note makes it stick even if the student has the game open.
      if (r.studentEmail) await state.db.sendResets(state.me.email, [r.studentEmail]);
      close();
      loadRoster();
    } catch (err) {
      console.error(err);
      alert("Could not reset the student. Check that the newest Firestore rules are published.");
    }
  };

  const tabs = [
    ["overview", "Overview", () => overviewTab(d)],
    ["reflections", `Reflections (${d.reflections.length})`, () => reflectionsTab(d)],
    ["decisions", `Decisions (${d.decisions.length})`, () => decisionsTab(d)],
    ["credit", "Credit", () => creditTab(d)],
    ["friends", "Friends", () => friendsTab(uid)],
  ];
  const panel = h("div.t-side-body", { role: "tabpanel" });
  const tabBar = h("div.t-side-tabs", { role: "tablist", "aria-label": "Student details" });
  const show = (k) => {
    for (const b of tabBar.children) b.setAttribute("aria-selected", String(b.dataset.tab === k));
    fill(panel, tabs.find((t) => t[0] === k)[2]());
  };
  for (const [k, label] of tabs) tabBar.append(h("button", { type: "button", role: "tab", "data-tab": k, onclick: () => show(k) }, label));

  const stat = (label, value) => h("div.t-big", h("strong", String(value)), h("span", label));
  add(
    dialog,
    h(
      "header.t-side-head",
      d.creature ? h("div.t-side-art", { "aria-hidden": "true", html: creatureSvg(d.creature, { size: 84, label: "" }) }) : null,
      h(
        "div",
        h("h2", fullName(r)),
        h("p.t-muted", [r.studentEmail, r.creatureName ? `Creature: ${r.creatureName}` : ""].filter(Boolean).join(". ")),
        h("p", [chapterCell(r), d.life ? ageLabel(d.life.ageMonths) : "", `${r.rank}, ${r.xp} XP`, `Last played ${ago(r.lastPlayed).toLowerCase()}`].filter(Boolean).join(". "))
      ),
      h("button.t-btn", { type: "button", onclick: close }, "Close")
    ),
    h("div.t-bigs.t-side-stats", stat("score", r.score ?? "None yet"), stat("practice", pctCell(r.accuracyAll)), stat("on time", pctCell(r.onTimePct)), stat("reflections", r.chaptersDone ? `${r.reflections} of ${r.chaptersDone}` : r.reflections)),
    r.flags.length
      ? h(
          "div.t-flags",
          h("ul", r.flags.map((f) => h("li", icon(FLAGS[f].mark, { size: 16 }), FLAGS[f].label))),
          r.mismatches.length ? h("details", h("summary", "What doesn't match the log"), h("ul", r.mismatches.map((m) => h("li", m)))) : null
        )
      : null,
    tabBar,
    panel,
    h("footer.t-side-foot", h("button.t-btn.danger", { type: "button", onclick: reset }, "Reset this student"))
  );
  document.body.append(dialog);
  dialog.showModal();
  show("overview");
}

function markOpenRow() {
  for (const tr of document.querySelectorAll(".t-table tr.is-open")) tr.classList.remove("is-open");
  if (state.openUid) document.querySelector(`#t-roster-table tr[data-uid="${CSS.escape(state.openUid)}"]`)?.classList.add("is-open");
}

function overviewTab(d) {
  const r = d.row;
  return [
    h("h3", "Practice accuracy by standard"),
    h("dl.t-lines", Object.entries(STANDARD_LABELS).flatMap(([s, label]) => [h("dt", label), h("dd", r.accuracy[s] == null ? "No answers yet" : `${r.accuracy[s]}%`)])),
    d.life ? h("h3", "Money") : null,
    d.life ? h("dl.t-lines", h("dt", "Checking"), h("dd", money(d.life.checking)), h("dt", "Savings"), h("dd", money(d.life.savings))) : null,
    d.play?.alley && Object.keys(d.play.alley.checked).length
      ? [
          h("h3", `Lantern Alley: ${r.alleyRight} of ${r.alleyChecked} called right`),
          h(
            "dl.t-lines",
            STALLS.filter((s) => d.play.alley.checked[s.id]).flatMap((s) => {
              const c = d.play.alley.checked[s.id];
              return [h("dt", `${s.name} (${s.trap ? "trap" : "fair deal"})`), h("dd", `${c.right ? "Right" : "Missed"}${c.readFine ? ", read the fine print" : ""}`)];
            })
          ),
        ]
      : null,
    h("h3", `Achievements (${d.achievements.length})`),
    d.achievements.length ? h("p.t-tags", d.achievements.map((a) => h("span.t-tag", a.title))) : h("p.t-muted", "None yet."),
  ];
}

function reflectionsTab(d) {
  if (!d.reflections.length) return h("p.t-muted", "No reflections yet.");
  return d.reflections.map((x) =>
    h(
      "article.t-reflection",
      h("h3", `Chapter ${x.chapter}: ${x.title}`),
      h("p.t-muted.t-small", `Fun ${x.fun}/5. Clear ${x.clear}/5. Score ${x.startScore ?? "none"} to ${x.endScore ?? "none"}.`),
      h("p", x.text)
    )
  );
}

function decisionsTab(d) {
  if (!d.decisions.length) return h("p.t-muted", "No decisions yet.");
  return h(
    "table.t-table",
    h("thead", h("tr", h("th", "Card"), h("th", "Choice"), h("th", "Quality"))),
    h("tbody", d.decisions.map((x) => h("tr", h("td", x.title), h("td", x.label), h("td", x.quiz ? "Quiz" : x.quality || "–"))))
  );
}

function creditTab(d) {
  if (!d.life) return h("p.t-muted", "No credit yet. The bank opens after the prologue.");
  return [
    d.play ? h("details.t-fold", { open: true }, h("summary", "Score and the 5 parts"), scoreTab({ run: { life: d.life, play: d.play } })) : null,
    h("details.t-fold", h("summary", "Credit report"), reportTab({ run: { life: d.life } })),
  ];
}

function friendsTab(uid) {
  const box = h("div", h("p.t-muted", "Loading..."));
  loadSocial(uid, box);
  return box;
}

// Friends and gifts for one student (Phase 8). Loaded once per class.
async function loadSocial(uid, box) {
  try {
    state.social ??= await state.db.listClassSocial(state.classId);
  } catch (err) {
    console.error(err);
    return fill(box, h("p.t-muted", "Couldn't load friends and gifts. Check that the newest Firestore rules are published."));
  }
  // The roster name, else the student name saved on the request or gift.
  const name = (id, saved) => state.rows.find((r) => r.uid === id)?.studentName || saved || "a classmate";
  const friends = state.social.requests.filter((r) => r.status === "accepted" && (r.from === uid || r.to === uid)).map((r) => (r.from === uid ? name(r.to, r.toPerson) : name(r.from, r.fromPerson)));
  const gifts = state.social.gifts.filter((g) => g.from === uid || g.to === uid);
  fill(
    box,
    h("h3", "Friends"),
    h("p", friends.length ? friends.join(", ") : "No friends yet."),
    h("h3", "Gifts"),
    gifts.length
      ? h("ul.t-plain", gifts.map((g) => h("li", `${g.from === uid ? `Sent to ${name(g.to)}` : `From ${name(g.from, g.fromPerson)}`}: ${g.kind === "money" ? money(g.amount) : g.itemId}${g.sentAt ? `, ${new Date(g.sentAt).toLocaleDateString()}` : ""}${g.claimed ? "" : " (not opened)"}`)))
      : h("p.t-muted", "No gifts sent or received.")
  );
}

// ---------- tuning (docs/FEEDBACK.md section 3) ----------

function tuningView() {
  if (!state.tuning) {
    const reads = state.rows.length * 300;
    return h(
      "div.t-tuning",
      h("p", "The Tuning tab reads students' play data: how long months take, how the class splits on each card, what's confusing, minigame pay, question accuracy and chapter ratings."),
      h("p.t-muted", `This reads up to about ${reads.toLocaleString()} small records, which is fine within the free Firebase plan (50,000 reads a day).`),
      h("div.t-row", h("button.t-btn", { type: "button", onclick: loadTuning }, "Load tuning data"))
    );
  }
  const t = state.tuning;
  const exportJson = () => {
    const data = tuningExport({ className: cls().name, tuningData: t, rows: state.rows, saves: state.saves });
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const a = h("a", { href: URL.createObjectURL(blob), download: `${cls().name.replace(/\W+/g, "-")}-tuning.json` });
    document.body.append(a);
    a.click();
    a.remove();
  };
  const m = t.minutesPerMonth;
  const stat = (label, value) => h("div.t-big", h("strong", String(value)), h("span", label));
  const votes = (x) => `${x.up} liked, ${x.meh} okay, ${x.down} didn't`;
  return h(
    "div.t-tuning",
    h("div.t-toolbar", h("span.t-muted", `${t.events.toLocaleString()} play events from ${plural(state.rows.length, "student")} (practice mode left out).`), h("div.t-row.t-toolbar-end", h("button.t-btn", { type: "button", onclick: loadTuning }, "Reload"), h("button.t-btn", { type: "button", onclick: exportJson, title: "No names or emails are included" }, "Export tuning data (JSON, no names)"))),
    h(
      "div.t-bigs",
      stat("minutes per game month", m.median == null ? "No data" : `${m.median} (target ${m.targetLow} to ${m.targetHigh})`),
      stat("months measured", m.n),
      stat("answers past the XP cap", t.xpCapHits)
    ),
    table("Decision cards", ["Card", "Times", "Choices", "Top choice", "Seconds", "Ratings", "Confusing"], t.cards.map((c) => [c.id, c.n, Object.entries(c.choices).map(([k, v]) => `${k} ${v}`).join(", "), `${Math.round(c.topShare * 100)}%${c.lopsided ? " (lopsided)" : ""}`, c.medianSeconds, votes(c), c.confusing || 0])),
    table("Minigames", ["Game", "Shifts", "Median pay", "Median right", "No-timer shifts", "Ratings"], t.games.map((g) => [g.game, g.n, money(g.medianPay || 0), g.medianRight, g.untimed, votes(g)])),
    table("Practice Desk questions", ["Type", "Answers", "Accuracy", "Median seconds"], t.questions.map((q) => [q.type, q.n, `${q.accuracy}%`, q.medianSeconds])),
    table("Chapter ratings", ["Chapter", "Ratings", "Fun (1 to 5)", "Clear (1 to 5)"], t.ratings.map((r) => [r.chapter, r.n, r.fun, r.clear])),
    table("Class scores", ["Range", "Students"], t.scoreBands.map((b) => [`${b.lo} to ${b.hi}`, b.n])),
    table("Errors students hit", ["Message", "Times"], t.errors.map((e) => [e.message, e.n]))
  );
}

function table(title, heads, rows) {
  return h("section.t-after", h("h3", title), rows.length ? h("div.t-table-wrap", h("table.t-table", h("thead", h("tr", heads.map((x) => h("th", x)))), h("tbody", rows.map((r) => h("tr", r.map((c) => h("td", String(c ?? "–")))))))) : h("p.t-muted", "No data yet."));
}

async function loadTuning() {
  paintTab(h("p.t-muted", "Loading play data..."));
  try {
    const batches = (await Promise.all(state.rows.map((r) => state.db.listEvents(r.uid, 300).catch(() => [])))).flat();
    state.tuning = tuning(batches, state.rows);
  } catch (err) {
    console.error(err);
    return paintTab(h("p.t-error", "Could not load play data. Check that the newest Firestore rules are published."));
  }
  paintTab(tuningView());
}

// ---------- bug reports ----------

function bugsView() {
  if (!state.feedback) return h("p.t-muted", "Loading bug reports...");
  if (!state.feedback.length) return h("p.t-ok", icon("check", { size: 18 }), "No bug reports.");
  const names = Object.fromEntries(state.rows.map((r) => [r.uid, fullName(r)]));
  return h(
    "ul.t-bugs",
    state.feedback
      .slice()
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .map((f) =>
        h(
          "li",
          icon("bug", { size: 18 }),
          h(
            "div",
            h("p.t-muted.t-small", `${names[f.uid] || "A student"}. Screen: ${f.screen || "?"}. Month ${f.month ?? "?"}.`),
            h("p", f.note || "(no note)"),
            h("button.t-link", { type: "button", onclick: () => download(`bug-${f.id}.json`, f) }, "Download for Claude (seed and last actions)")
          )
        )
      )
  );
}

async function loadFeedback() {
  const id = state.classId;
  try {
    const all = await state.db.listFeedback(state.me.email);
    if (id !== state.classId) return;
    state.feedback = all.filter((f) => !f.classId || f.classId === state.classId);
  } catch (err) {
    console.error(err);
    state.feedback = [];
  }
  repaintSummary();
  const tabs = document.querySelector(".t-tabs");
  if (tabs) {
    const bugTab = tabs.lastElementChild;
    bugTab.querySelector(".t-count")?.remove();
    if (state.feedback.length) bugTab.append(h("span.t-count", { "aria-label": `${state.feedback.length} reports` }, state.feedback.length));
  }
  if (state.tab === "bugs") paintTab(bugsView());
}

function download(name, data) {
  const a = h("a", { href: URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })), download: name });
  document.body.append(a);
  a.click();
  a.remove();
}
