// Teacher dashboard (SPEC §20): classes, controls, roster, student detail,
// CSV export, the Tuning tab and bug reports. Firestore rules are the real
// gate. This page only shows what the signed-in teacher is allowed to read.
// Add ?local on localhost to try it on the browser test save, with no sign-in.
import { isConfigured } from "../firebase-config.js";
import { h, add, fill, money, ageLabel } from "../ui/dom.js";
import { creatureSvg } from "../ui/creature-art.js";
import { reportTab } from "../ui/accounts/report-tab.js";
import { scoreTab } from "../ui/accounts/score-tab.js";
import { rosterRow, studentDetail, rosterCsv, tuning, FLAGS } from "./analyze.js";
import { STANDARD_LABELS } from "../data/practice-questions.js";
import { CONFIG } from "../data/config.js";
import { chapterInfo } from "../data/chapters.js";

const LOCAL = new URLSearchParams(location.search).has("local") && ["localhost", "127.0.0.1"].includes(location.hostname);
const root = document.getElementById("teacher");
const state = { me: null, db: null, classes: [], classId: null, tab: "roster", saves: [], rows: [], sort: ["studentName", 1], tuning: null, feedback: null, social: null };

boot();

async function boot() {
  if (LOCAL) {
    state.db = await import("../db-local.js");
    state.me = { email: "local.teacher@greermiddlecollege.org", displayName: "Local Teacher" };
    document.getElementById("sign-out").hidden = true;
    return loadClasses();
  }
  if (!isConfigured) return fill(root, h("p.error", "Sign-in is not set up yet."));
  const [auth, db] = await Promise.all([import("../auth.js"), import("../db.js")]);
  state.db = db;
  auth.onUser((user) => {
    state.me = user;
    document.getElementById("sign-out").hidden = !user;
    if (!user) return signedOut(auth);
    if (!auth.isTeacher(user)) {
      return fill(root, h("p", "This page is for teachers only."), h("button.secondary", { type: "button", onclick: () => auth.signOut() }, "Sign out"));
    }
    loadClasses();
  });
  document.getElementById("sign-out")?.addEventListener("click", () => auth.signOut());
}

function signedOut(auth) {
  const err = h("p.error", { role: "alert" });
  fill(
    root,
    h(
      "button",
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
  );
}

async function loadClasses() {
  fill(root, h("p.muted", "Loading your classes..."));
  try {
    state.classes = (await state.db.listMyClasses(state.me.email)).sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error(err);
    return fill(root, h("p.error", "Could not load your classes. Check that the newest Firestore rules are published (docs/setup-firebase.md)."));
  }
  if (!state.classId && state.classes.length) state.classId = state.classes[0].id;
  paint();
  if (state.classId) loadRoster();
}

const cls = () => state.classes.find((c) => c.id === state.classId);

function paint() {
  fill(
    root,
    h("p.muted", `Signed in as ${state.me.displayName || state.me.email}.${LOCAL ? " Local test mode." : ""}`),
    classPicker(),
    cls() ? controls(cls()) : h("p.callout", "Create your first class below. Students type its join code after they make their creature."),
    cls()
      ? h(
          "nav.acct-tabs",
          { "aria-label": "Dashboard" },
          [
            ["roster", "👥 Roster"],
            ["tuning", "🎛️ Tuning"],
            ["bugs", "🐞 Bug reports"],
          ].map(([k, label]) => h("button", { type: "button", "aria-current": state.tab === k ? "page" : null, onclick: () => ((state.tab = k), paint(), k === "bugs" && !state.feedback && loadFeedback()) }, label))
        )
      : null,
    cls() ? h("div", { id: "tab-body" }, tabBody()) : null,
    LOCAL ? null : createForm()
  );
}

function classPicker() {
  if (state.classes.length < 2) return null;
  return h(
    "div.chip-group",
    { role: "group", "aria-label": "Your classes" },
    state.classes.map((c) =>
      h("button.chip", { type: "button", "aria-pressed": String(c.id === state.classId), onclick: () => ((state.classId = c.id), (state.tuning = null), (state.feedback = null), (state.social = null), paint(), loadRoster()) }, c.name)
    )
  );
}

function createForm() {
  const name = h("input", { id: "class-name", type: "text", maxlength: 40, placeholder: "Period 2 Personal Finance", required: true });
  const err = h("p.error", { role: "alert" });
  return h(
    "form.create-form",
    {
      onsubmit: async (e) => {
        e.preventDefault();
        if (!name.value.trim()) return;
        try {
          const c = await state.db.createClass(state.me.email, name.value.trim());
          state.classes.push(c);
          state.classId = c.id;
          paint();
          loadRoster();
        } catch (er) {
          console.error(er);
          err.textContent = "Could not create the class. Check that the newest Firestore rules are published.";
        }
      },
    },
    h("label", { for: "class-name" }, "New class name"),
    name,
    h("button", { type: "submit" }, "Create class"),
    err
  );
}

// ---------- class controls ----------

function controls(c) {
  const save = async (fields, label) => {
    try {
      await state.db.updateClass(c.id, fields);
      Object.assign(c, fields);
      paint();
    } catch (err) {
      console.error(err);
      alert(`Could not change ${label}. Check that the newest Firestore rules are published.`);
    }
  };
  const months = h(
    "select",
    { id: "months", onchange: (e) => save({ monthsPerChapter: Number(e.target.value) }, "months per chapter") },
    [1, 2, 3, 4, 5, 6].map((n) => h("option", { value: n, selected: (c.monthsPerChapter || CONFIG.pacing.monthsPerChapter) === n }, `${n} month${n === 1 ? "" : "s"}`))
  );
  const next = (c.releasedChapter || 1) + 1;
  return h(
    "section.t-controls",
    h("div", h("h2", c.name), h("p", "Join code: ", h("strong.code-cell", c.code || ""))),
    h(
      "div.t-control-grid",
      h(
        "div",
        h("strong", "Chapters open"),
        h("p", `1 to ${c.releasedChapter || 1}`),
        h(
          "button.small",
          {
            type: "button",
            onclick: () => confirm(`Open Chapter ${next} (${chapterInfo(next).title}) for ${c.name}? Students can start it right away.`) && save({ releasedChapter: next }, "the chapter"),
          },
          `Release Chapter ${next}`
        )
      ),
      h(
        "div",
        h("strong", "Play"),
        h("p", c.paused ? "⏸️ Paused" : "▶️ Running"),
        h("button.small", { type: "button", class: c.paused ? "" : "secondary", onclick: () => save({ paused: !c.paused }, "pause") }, c.paused ? "Resume play" : "Pause play")
      ),
      h("div", h("strong", "Friends and gifts"), h("p", c.social === false ? "Off" : "On"), h("button.small.secondary", { type: "button", onclick: () => save({ social: c.social === false }, "friends and gifts") }, c.social === false ? "Turn on" : "Turn off")),
      h("div", h("strong", "Leaderboard"), h("p", c.leaderboard === false ? "Off" : "On"), h("button.small.secondary", { type: "button", onclick: () => save({ leaderboard: c.leaderboard === false }, "the leaderboard") }, c.leaderboard === false ? "Turn on" : "Turn off")),
      h("div", h("label", { for: "months" }, h("strong", "Months per chapter")), months, h("small.muted", "Applies to chapters students start from now on."))
    )
  );
}

// ---------- roster ----------

async function loadRoster() {
  state.rows = [];
  paintTab(h("p.muted", "Loading students..."));
  try {
    state.saves = await state.db.listClassSaves(state.me.email, state.classId);
  } catch (err) {
    console.error(err);
    return paintTab(h("p.error", "Could not load the roster. Check that the newest Firestore rules are published."));
  }
  state.rows = state.saves.map((s) => {
    try {
      return rosterRow(s);
    } catch (err) {
      console.error(err);
      return { uid: s.uid, studentName: s.studentName || s.uid, flags: [], mismatches: [`Could not read this save: ${err.message}`], accountTypes: [], accuracy: {} };
    }
  });
  if (state.tab === "roster") paintTab(roster());
}

function paintTab(...kids) {
  const body = document.getElementById("tab-body");
  if (body) fill(body, ...kids);
}

function tabBody() {
  if (state.tab === "tuning") return tuningView();
  if (state.tab === "bugs") return bugsView();
  return state.rows.length ? roster() : h("p.muted", "Loading students...");
}

const COLUMNS = [
  ["studentName", "Student"],
  ["creatureName", "Creature"],
  ["chaptersDone", "Chapters"],
  ["reflections", "Reflections"],
  ["accuracyAll", "Practice %"],
  ["xp", "XP"],
  ["score", "Score"],
  ["onTimePct", "On-time %"],
  ["utilization", "Util %"],
  ["achievements", "🏆"],
  ["flags", "Flags"],
];

function roster() {
  if (!state.rows.length) return h("p.callout", "No students yet. Students appear here after they join with the class code and save once.");
  const [key, dir] = state.sort;
  const rows = state.rows.slice().sort((a, b) => {
    const x = key === "flags" ? a.flags.length : a[key];
    const y = key === "flags" ? b.flags.length : b[key];
    if (x == null) return 1;
    if (y == null) return -1;
    return (typeof x === "string" ? x.localeCompare(y) : x - y) * dir;
  });
  const csv = () => {
    const blob = new Blob([rosterCsv(rows)], { type: "text/csv" });
    const a = h("a", { href: URL.createObjectURL(blob), download: `${cls().name.replace(/\W+/g, "-")}-credit-life.csv` });
    document.body.append(a);
    a.click();
    a.remove();
  };
  return h(
    "div",
    h(
      "div.t-toolbar",
      h("p", `${rows.length} student${rows.length === 1 ? "" : "s"}. Click a name for details. Grade on practice accuracy, chapters and reflections (SPEC §20). Score and XP are for motivation.`),
      h("div.row", h("button.secondary.small", { type: "button", onclick: loadRoster }, "Refresh"), h("button.small", { type: "button", onclick: csv }, "Download CSV"))
    ),
    h(
      "div.t-table-wrap",
      h(
        "table.class-table.roster",
        h(
          "thead",
          h(
            "tr",
            COLUMNS.map(([k, label]) =>
              h("th", { "aria-sort": key === k ? (dir > 0 ? "ascending" : "descending") : null }, h("button.link", { type: "button", onclick: () => ((state.sort = [k, key === k ? -dir : 1]), paintTab(roster())) }, label, key === k ? (dir > 0 ? " ▲" : " ▼") : ""))
            )
          )
        ),
        h(
          "tbody",
          rows.map((r) =>
            h(
              "tr",
              h("td", h("button.link", { type: "button", onclick: () => detail(r.uid) }, r.studentName || r.studentEmail || r.uid), h("small.muted", h("br"), r.displayName)),
              h("td", r.creatureName),
              h("td", r.chaptersDone),
              h("td", r.reflections),
              h("td", r.accuracyAll ?? "–"),
              h("td", `${r.xp} `, h("small.muted", r.rank)),
              h("td", r.score ?? "–"),
              h("td", r.onTimePct ?? "–"),
              h("td", r.utilization ?? "–"),
              h("td", r.achievements),
              h("td", r.flags.map((f) => h("span.t-flag", { title: FLAGS[f].label, "aria-label": FLAGS[f].label }, FLAGS[f].icon)))
            )
          )
        )
      )
    ),
    h("p.grid-key", Object.values(FLAGS).map((f) => h("span", `${f.icon} ${f.label}`)))
  );
}

// ---------- student detail ----------

function detail(uid) {
  const raw = state.saves.find((s) => s.uid === uid);
  const d = studentDetail(raw);
  const r = d.row;
  const dialog = h("dialog.t-detail", { "aria-label": `Details for ${r.studentName}` });
  const socialBox = h("div", h("p.muted", "Loading..."));
  loadSocial(uid, socialBox);
  const close = () => (dialog.close(), dialog.remove());
  const reset = async () => {
    const typed = prompt(`Reset ${r.studentName}? Their creature, money, score, XP and reflections are deleted, and they start over at the next sign-in. This can't be undone. Type RESET to confirm.`);
    if (typed !== "RESET") return;
    try {
      await state.db.deleteStudentSave(uid, state.classId);
      close();
      loadRoster();
    } catch (err) {
      console.error(err);
      alert("Could not reset the student. Check that the newest Firestore rules are published.");
    }
  };
  add(
    dialog,
    h(
      "header.acct-head",
      h(
        "div.hero",
        d.creature ? h("div.hero-art", { html: creatureSvg(d.creature, { size: 110 }) }) : null,
        h("div", h("h2", r.studentName || r.uid), h("p.muted", [r.studentEmail, r.displayName, r.creatureName].filter(Boolean).join(" · ")), d.life ? h("p", `${ageLabel(d.life.ageMonths)}. Chapter ${r.chapter}. ${r.rank}, ${r.xp} XP.`) : null)
      ),
      h("button.secondary", { type: "button", onclick: close }, "Close")
    ),
    h(
      "div.stat-grid",
      stat("Score", r.score ?? "None yet"),
      stat("Checking", d.life ? money(d.life.checking) : "–"),
      stat("Savings", d.life ? money(d.life.savings) : "–"),
      stat("On-time", r.onTimePct == null ? "–" : `${r.onTimePct}%`),
      stat("Practice", r.accuracyAll == null ? "–" : `${r.accuracyAll}%`),
      stat("Achievements", r.achievements)
    ),
    r.flags.length
      ? h("div.callout.warn", h("p", h("strong", "Flags")), h("ul", r.flags.map((f) => h("li", `${FLAGS[f].icon} ${FLAGS[f].label}`))), r.mismatches.length ? h("details", h("summary", "What doesn't match the log"), h("ul", r.mismatches.map((m) => h("li", m)))) : null)
      : null,
    h("h3", "Practice accuracy by standard"),
    h("ul.upcoming", Object.entries(STANDARD_LABELS).map(([s, label]) => h("li", h("span", label), h("strong", r.accuracy[s] == null ? "No answers yet" : `${r.accuracy[s]}%`)))),
    h("h3", "Reflections"),
    d.reflections.length
      ? d.reflections.map((x) => h("div.callout", h("p", h("strong", `Chapter ${x.chapter}: ${x.title}`), h("small.muted", `  Fun ${x.fun}/5 · Clear ${x.clear}/5 · Score ${x.startScore ?? "none"} → ${x.endScore ?? "none"}`)), h("p", x.text)))
      : h("p.muted", "No reflections yet."),
    h("h3", "Decisions"),
    d.decisions.length
      ? h(
          "table.class-table",
          h("thead", h("tr", h("th", "Card"), h("th", "Choice"), h("th", "Quality"))),
          h("tbody", d.decisions.map((x) => h("tr", h("td", `${x.icon || ""} ${x.title}`), h("td", x.label), h("td", x.quiz ? "Quiz" : x.quality || "–"))))
        )
      : h("p.muted", "No decisions yet."),
    h("h3", "Friends and gifts"),
    socialBox,
    h("h3", "Achievements"),
    d.achievements.length ? h("p", d.achievements.map((a) => h("span.t-badge", `${a.icon} ${a.title}`))) : h("p.muted", "None yet."),
    d.life && d.play ? h("details.t-section", h("summary", h("strong", "Score and the 5 parts")), scoreTab({ run: { life: d.life, play: d.play } })) : null,
    d.life ? h("details.t-section", h("summary", h("strong", "Credit report")), reportTab({ run: { life: d.life } })) : null,
    h("div.row", h("button.secondary", { type: "button", class: "danger", onclick: reset }, "Reset this student"))
  );
  document.body.append(dialog);
  dialog.showModal();
}

// Friends and gifts for one student (Phase 8). Loaded once per class.
async function loadSocial(uid, box) {
  try {
    state.social ??= await state.db.listClassSocial(state.classId);
  } catch (err) {
    console.error(err);
    return fill(box, h("p.muted", "Couldn't load friends and gifts. Check that the newest Firestore rules are published."));
  }
  const name = (id) => state.rows.find((r) => r.uid === id)?.studentName || "a classmate";
  const friends = state.social.requests.filter((r) => r.status === "accepted" && (r.from === uid || r.to === uid)).map((r) => name(r.from === uid ? r.to : r.from));
  const gifts = state.social.gifts.filter((g) => g.from === uid || g.to === uid);
  fill(
    box,
    h("p", friends.length ? `Friends: ${friends.join(", ")}` : "No friends yet."),
    gifts.length
      ? h("ul", gifts.map((g) => h("li", `${g.from === uid ? `Sent to ${name(g.to)}` : `From ${name(g.from)}`}: ${g.kind === "money" ? money(g.amount) : g.itemId}${g.sentAt ? `, ${new Date(g.sentAt).toLocaleDateString()}` : ""}${g.claimed ? "" : " (not opened)"}`)))
      : h("p.muted", "No gifts sent or received.")
  );
}

function stat(label, value) {
  return h("div.stat", h("span.stat-value", String(value)), h("span.stat-label", label));
}

// ---------- tuning (docs/FEEDBACK.md section 3) ----------

function tuningView() {
  if (!state.tuning) {
    const reads = state.rows.length * 300;
    return h(
      "div",
      h("p", "The Tuning tab reads students' play data: how long months take, how the class splits on each card, what's confusing, minigame pay, question accuracy and chapter ratings."),
      h("p.note.tight", `This reads up to about ${reads.toLocaleString()} small records, which is fine within the free Firebase plan (50,000 reads a day).`),
      h("div.row", h("button", { type: "button", onclick: loadTuning }, "Load tuning data"))
    );
  }
  const t = state.tuning;
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), class: cls().name, tuning: t, roster: state.rows }, null, 2)], { type: "application/json" });
    const a = h("a", { href: URL.createObjectURL(blob), download: `${cls().name.replace(/\W+/g, "-")}-tuning.json` });
    document.body.append(a);
    a.click();
    a.remove();
  };
  const m = t.minutesPerMonth;
  return h(
    "div.t-tuning",
    h("div.t-toolbar", h("p", `${t.events.toLocaleString()} play events from ${state.rows.length} students (practice mode left out).`), h("div.row", h("button.secondary.small", { type: "button", onclick: loadTuning }, "Reload"), h("button.small", { type: "button", onclick: exportJson }, "Export tuning data (JSON)"))),
    h(
      "div.stat-grid",
      stat("Minutes per game month", m.median == null ? "No data" : `${m.median} (target ${m.targetLow} to ${m.targetHigh})`),
      stat("Months measured", m.n),
      stat("Answers past the XP cap", t.xpCapHits)
    ),
    table("Decision cards", ["Card", "Times", "Choices", "Top choice", "Seconds", "👍 😐 👎", "Confusing"], t.cards.map((c) => [c.id, c.n, Object.entries(c.choices).map(([k, v]) => `${k} ${v}`).join(", "), `${Math.round(c.topShare * 100)}%${c.lopsided ? " ⚠️ lopsided" : ""}`, c.medianSeconds, `${c.up} ${c.meh} ${c.down}`, c.confusing ? `🚩 ${c.confusing}` : 0])),
    table("Minigames", ["Game", "Shifts", "Median pay", "Median right", "No-timer shifts", "👍 😐 👎"], t.games.map((g) => [g.game, g.n, money(g.medianPay || 0), g.medianRight, g.untimed, `${g.up} ${g.meh} ${g.down}`])),
    table("Practice Desk questions", ["Type", "Answers", "Accuracy", "Median seconds"], t.questions.map((q) => [q.type, q.n, `${q.accuracy}%`, q.medianSeconds])),
    table("Chapter ratings", ["Chapter", "Ratings", "Fun (1 to 5)", "Clear (1 to 5)"], t.ratings.map((r) => [r.chapter, r.n, r.fun, r.clear])),
    table("Class scores", ["Range", "Students"], t.scoreBands.map((b) => [`${b.lo} to ${b.hi}`, b.n])),
    table("Errors students hit", ["Message", "Times"], t.errors.map((e) => [e.message, e.n]))
  );
}

function table(title, heads, rows) {
  return h("section", h("h3", title), rows.length ? h("div.t-table-wrap", h("table.class-table", h("thead", h("tr", heads.map((x) => h("th", x)))), h("tbody", rows.map((r) => h("tr", r.map((c) => h("td", String(c ?? "–")))))))) : h("p.muted", "No data yet."));
}

async function loadTuning() {
  paintTab(h("p.muted", "Loading play data..."));
  try {
    const batches = (await Promise.all(state.rows.map((r) => state.db.listEvents(r.uid, 300).catch(() => [])))).flat();
    state.tuning = tuning(batches, state.rows);
  } catch (err) {
    console.error(err);
    return paintTab(h("p.error", "Could not load play data. Check that the newest Firestore rules are published."));
  }
  paintTab(tuningView());
}

// ---------- bug reports ----------

function bugsView() {
  if (!state.feedback) return h("p.muted", "Loading bug reports...");
  if (!state.feedback.length) return h("p.callout", "No bug reports. 🎉");
  const names = Object.fromEntries(state.rows.map((r) => [r.uid, r.studentName || r.uid]));
  return h(
    "ul.inbox",
    state.feedback
      .slice()
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .map((f) =>
        h(
          "li.note-item.tone-red",
          h("span.note-icon", { "aria-hidden": "true" }, "🐞"),
          h(
            "div.note-text",
            h("small", `${names[f.uid] || "A student"} · screen: ${f.screen || "?"} · month ${f.month ?? "?"}`),
            h("p", f.note || "(no note)"),
            h("button.link", { type: "button", onclick: () => download(`bug-${f.id}.json`, f) }, "Download for Claude (seed and last actions)")
          )
        )
      )
  );
}

async function loadFeedback() {
  try {
    state.feedback = (await state.db.listFeedback(state.me.email)).filter((f) => !f.classId || f.classId === state.classId);
  } catch (err) {
    console.error(err);
    state.feedback = [];
  }
  if (state.tab === "bugs") paintTab(bugsView());
}

function download(name, data) {
  const a = h("a", { href: URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })), download: name });
  document.body.append(a);
  a.click();
  a.remove();
}
