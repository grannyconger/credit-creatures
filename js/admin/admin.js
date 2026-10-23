// /admin (teacher request 2026-10-23): bug reports, tuning and an overview of
// every class from both teachers, for bweaver@greermiddlecollege.org only, so
// the teacher page can be about student progress. Firestore rules (isAdmin)
// are the real gate. Add ?local on localhost to try it with no sign-in.
import { isConfigured, ADMIN_EMAIL } from "../firebase-config.js";
import { h, fill, money } from "../ui/dom.js";
import { icon } from "../ui/icons.js";
import { rosterRow, tuning, tuningExport, needsHelp, gradeSummary } from "../teacher/analyze.js";
import { CONFIG } from "../data/config.js";

const LOCAL = new URLSearchParams(location.search).has("local") && ["localhost", "127.0.0.1"].includes(location.hostname);
const root = document.getElementById("admin");
const state = { me: null, db: null, tab: "overview", classes: [], saves: [], rows: [], feedback: [], bugFilter: "new", tuneClass: "all", tuning: null };
const STATUS = [
  ["new", "New"],
  ["fixing", "Fixing"],
  ["fixed", "Fixed"],
];

boot();

async function boot() {
  if (LOCAL) {
    state.db = await import("../db-local.js");
    state.me = { email: ADMIN_EMAIL, displayName: "Local Admin" };
    document.getElementById("sign-out").hidden = true;
    return load();
  }
  if (!isConfigured) return fill(root, h("p.t-error", "Sign-in is not set up yet."));
  const [auth, db] = await Promise.all([import("../auth.js"), import("../db.js")]);
  state.db = db;
  auth.onUser((user) => {
    state.me = user;
    document.getElementById("sign-out").hidden = !user;
    if (!user) return signedOut(auth);
    if (user.email.toLowerCase() !== ADMIN_EMAIL) {
      return fill(root, h("section.t-empty", h("h2", "Admins only"), h("p", "This page is for the game's admin. Teachers, your class is on the teacher page."), h("p", h("a.t-link", { href: "../teacher/" }, "Go to the teacher page"))));
    }
    load();
  });
  document.getElementById("sign-out")?.addEventListener("click", () => auth.signOut());
}

function signedOut(auth) {
  const err = h("p.t-error", { role: "alert" });
  fill(
    root,
    h(
      "section.t-empty",
      h("h2", "Sign in to the admin page"),
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

async function load() {
  const who = document.getElementById("t-who");
  if (who) who.textContent = `${state.me.displayName || state.me.email}${LOCAL ? " (local test)" : ""}`;
  fill(root, h("p.t-muted", "Loading every class..."));
  try {
    const [classes, saves, feedback] = await Promise.all([state.db.listAllClasses(), state.db.listAllSaves(), state.db.listAllFeedback()]);
    Object.assign(state, { classes: classes.sort((a, b) => (a.teacherEmail || "").localeCompare(b.teacherEmail || "") || a.name.localeCompare(b.name)), saves, feedback });
  } catch (err) {
    console.error(err);
    return fill(root, h("p.t-error", "Could not load the admin data. Check that the newest Firestore rules (with isAdmin) are published in the Firebase console."));
  }
  state.rows = state.saves.map((s) => {
    try {
      return { ...rosterRow(s), classId: s.classId, teacherEmail: s.teacherEmail };
    } catch (err) {
      console.error(err);
      return { uid: s.uid, classId: s.classId, studentName: s.studentName || s.uid, firstName: "", lastName: "", chaptersDone: 0, reflections: 0, flags: [], accuracy: {}, lastPlayed: null };
    }
  });
  paint();
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const className = (id) => state.classes.find((c) => c.id === id)?.name || "No class";
const studentName = (uid) => {
  const r = state.rows.find((x) => x.uid === uid);
  return r ? [r.firstName, r.lastName].filter(Boolean).join(" ") || r.studentName : "A student";
};
const statusOf = (f) => f.status || "new";

function ago(ms) {
  if (ms == null) return "Never";
  const mins = Math.floor((Date.now() - ms) / 60000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins} minutes ago`;
  const days = Math.floor(mins / 1440);
  if (days < 1) return `${Math.floor(mins / 60)} hours ago`;
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

function paint() {
  const fresh = state.feedback.filter((f) => statusOf(f) === "new").length;
  fill(
    root,
    h("section.t-strip.a-strip", h("div.t-strip-name", h("h1", "Admin"), h("p", `${plural(state.classes.length, "class", "classes")}, ${plural(state.rows.length, "student")}, ${plural(state.feedback.length, "bug report")}`)), h("div.t-strip-actions", h("button.t-btn", { type: "button", onclick: load }, "Refresh"))),
    h(
      "nav.t-tabs",
      { "aria-label": "Admin" },
      [
        ["overview", "castle", "All classes", null],
        ["bugs", "bug", "Bug reports", fresh],
        ["tuning", "chart", "Tuning", null],
      ].map(([k, mark, label, count]) =>
        h("button", { type: "button", "aria-current": state.tab === k ? "page" : null, onclick: () => ((state.tab = k), paint()) }, icon(mark, { size: 18 }), label, count ? h("span.t-count", { "aria-label": `${count} new` }, count) : null)
      )
    ),
    h("div", { id: "tab-body" }, state.tab === "bugs" ? bugsView() : state.tab === "tuning" ? tuningView() : overview())
  );
}

const paintTab = (...kids) => fill(document.getElementById("tab-body"), ...kids);

// ---------- every class in one table ----------

function overview() {
  if (!state.classes.length) return h("p.t-empty-line", "No classes yet.");
  const rows = state.classes.map((c) => {
    const kids = state.rows.filter((r) => r.classId === c.id);
    const g = gradeSummary(kids);
    const last = Math.max(...kids.map((r) => r.lastPlayed ?? 0), 0) || null;
    const help = needsHelp(kids, { inactiveDays: CONFIG.teacher.inactiveDays }).length;
    return { c, n: kids.length, g, last, help };
  });
  const unplaced = state.rows.filter((r) => !state.classes.some((c) => c.id === r.classId)).length;
  return h(
    "div",
    h(
      "div.t-table-wrap.t-after-tight",
      h(
        "table.t-table",
        h("thead", h("tr", ["Class", "Teacher", "Code", "Students", "Chapters open", "Practice (median)", "Chapters done (median)", "Needs help", "Last activity"].map((x, i) => h("th", { class: i >= 3 && i <= 7 ? "num" : null }, x)))),
        h(
          "tbody",
          rows.map(({ c, n, g, last, help }) =>
            h(
              "tr",
              h("th", { scope: "row" }, c.name),
              h("td", c.teacherEmail || "–"),
              h("td", h("strong.t-code-small", c.code || "–")),
              h("td.num", n),
              h("td.num", `1 to ${c.releasedChapter || 1}`),
              h("td.num", g.practice == null ? "–" : `${g.practice}%`),
              h("td.num", g.chapters ?? "–"),
              h("td.num", help),
              h("td", ago(last))
            )
          )
        )
      )
    ),
    unplaced ? h("p.t-muted", `${plural(unplaced, "student")} have a save that points at no class (their class was deleted). "Send students back to the start" on the teacher page clears them.`) : null
  );
}

// ---------- bug reports, with a status on each ----------

function bugsView() {
  if (!state.feedback.length) return h("p.t-ok", icon("check", { size: 18 }), "No bug reports.");
  const count = (k) => state.feedback.filter((f) => k === "all" || statusOf(f) === k).length;
  const list = state.feedback
    .filter((f) => state.bugFilter === "all" || statusOf(f) === state.bugFilter)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return h(
    "div",
    h(
      "div.t-toolbar",
      h(
        "div.t-views",
        { role: "group", "aria-label": "Show bug reports" },
        [["all", "All"], ...STATUS].map(([k, label]) => h("button", { type: "button", "aria-pressed": String(state.bugFilter === k), onclick: () => ((state.bugFilter = k), paintTab(bugsView())) }, `${label} (${count(k)})`))
      )
    ),
    list.length
      ? h(
          "ul.t-bugs",
          list.map((f) =>
            h(
              "li",
              icon("bug", { size: 18 }),
              h(
                "div.a-bug",
                h("p.t-muted.t-small", [studentName(f.uid), className(f.classId), `Screen: ${f.screen || "?"}`, `Month ${f.month ?? "?"}`, f.createdAt?.seconds ? new Date(f.createdAt.seconds * 1000).toLocaleString() : ""].filter(Boolean).join(". ")),
                h("p", f.note || "(no note)"),
                h(
                  "div.t-row",
                  h(
                    "div.t-views.a-status",
                    { role: "group", "aria-label": "Status" },
                    STATUS.map(([k, label]) => h("button", { type: "button", "aria-pressed": String(statusOf(f) === k), onclick: () => setStatus(f, k) }, label))
                  ),
                  h("button.t-link", { type: "button", onclick: () => download(`bug-${f.id}.json`, f) }, "Download for Claude (seed and last actions)")
                )
              )
            )
          )
        )
      : h("p.t-muted", "Nothing here.")
  );
}

async function setStatus(f, status) {
  try {
    await state.db.setFeedbackStatus(f.id, status);
    f.status = status;
  } catch (err) {
    console.error(err);
    alert("Could not change the status. Check that the newest Firestore rules are published.");
  }
  paint();
}

// ---------- tuning (docs/FEEDBACK.md section 3) ----------

function tuneRows() {
  return state.tuneClass === "all" ? state.rows : state.rows.filter((r) => r.classId === state.tuneClass);
}

function tuningView() {
  const pick = h(
    "select",
    { id: "tune-class", onchange: (e) => ((state.tuneClass = e.target.value), (state.tuning = null), paintTab(tuningView())) },
    h("option", { value: "all", selected: state.tuneClass === "all" }, "All classes"),
    state.classes.map((c) => h("option", { value: c.id, selected: state.tuneClass === c.id }, c.name))
  );
  const head = h("div.t-toolbar", h("label", { for: "tune-class" }, "Class"), pick);
  if (!state.tuning) {
    const reads = tuneRows().length * 300;
    return h(
      "div.t-tuning",
      head,
      h("p", "Tuning reads students' play data: how long months take, how the class splits on each card, what's confusing, minigame pay, question accuracy and chapter ratings."),
      h("p.t-muted", `This reads up to about ${reads.toLocaleString()} small records. The free Firebase plan allows 50,000 reads a day.`),
      h("div.t-row", h("button.t-btn", { type: "button", onclick: loadTuning }, "Load tuning data"))
    );
  }
  const t = state.tuning;
  const label = state.tuneClass === "all" ? "All classes" : className(state.tuneClass);
  const exportJson = () => {
    const rows = tuneRows();
    const data = tuningExport({ className: label, tuningData: t, rows, saves: state.saves.filter((s) => rows.some((r) => r.uid === s.uid)) });
    download(`${label.replace(/\W+/g, "-")}-tuning.json`, data, false);
  };
  const m = t.minutesPerMonth;
  const stat = (name, value) => h("div.t-big", h("strong", String(value)), h("span", name));
  const votes = (x) => `${x.up} liked, ${x.meh} okay, ${x.down} didn't`;
  return h(
    "div.t-tuning",
    head,
    h("div.t-toolbar", h("span.t-muted", `${t.events.toLocaleString()} play events from ${plural(tuneRows().length, "student")} (practice mode left out).`), h("div.t-row.t-toolbar-end", h("button.t-btn", { type: "button", onclick: loadTuning }, "Reload"), h("button.t-btn", { type: "button", onclick: exportJson, title: "No names or emails are included" }, "Export tuning data (JSON, no names)"))),
    h("div.t-bigs", stat("minutes per game month", m.median == null ? "No data" : `${m.median} (target ${m.targetLow} to ${m.targetHigh})`), stat("months measured", m.n), stat("answers past the XP cap", t.xpCapHits)),
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
  const rows = tuneRows();
  try {
    const batches = (await Promise.all(rows.map((r) => state.db.listEvents(r.uid, 300).catch(() => [])))).flat();
    state.tuning = tuning(batches, rows);
  } catch (err) {
    console.error(err);
    return paintTab(h("p.t-error", "Could not load play data. Check that the newest Firestore rules are published."));
  }
  paintTab(tuningView());
}

function download(name, data, pretty = true) {
  const a = h("a", { href: URL.createObjectURL(new Blob([JSON.stringify(data, null, pretty ? 2 : 0)], { type: "application/json" })), download: name });
  document.body.append(a);
  a.click();
  a.remove();
}
