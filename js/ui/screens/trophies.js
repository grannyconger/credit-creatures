// Trophies (SPEC §16): achievements, XP and rank, personal records, and the
// class leaderboard (ranked by XP, so careful play wins, not cash).
import { h, fill, add } from "../dom.js";
import { placeHeader } from "../place-header.js";
import { icon } from "../icons.js";
import { ACHIEVEMENTS, CATEGORIES, RANKS } from "../../data/achievements.js";
import { rankFor, bestXpChapter } from "../../progress.js";
import { creatureSvg } from "../creature-art.js";

const TABS = [
  ["badges", "trophy", "Achievements"],
  ["rank", "star", "Rank and records"],
  ["board", "chart", "Leaderboard"],
];

let tab = "badges";

export function render(root, { game, go, track }) {
  const play = game.play;
  const panel = h("section.panel.trophies");
  root.append(panel);

  function paint() {
    const r = rankFor(play.xp);
    const body = h("div");
    fill(
      panel,
      placeHeader({ go, iconName: "trophy", kicker: "The Academy", title: `Trophies: ${r.icon} ${r.title}`, subtitle: `${play.xp} XP · ${Object.keys(play.achievements).length} of ${ACHIEVEMENTS.length} achievements` }),
      xpBar(play.xp),
      h(
        "nav.acct-tabs",
        { "aria-label": "Trophies" },
        TABS.map(([key, ico, label]) =>
          h(
            "button",
            {
              type: "button",
              "aria-current": key === tab ? "page" : null,
              onclick: () => {
                tab = key;
                track("trophiesTab", { tab: key });
                paint();
              },
            },
            icon(ico),
            ` ${label}`
          )
        )
      ),
      body
    );
    if (tab === "badges") add(body, badges(play));
    else if (tab === "rank") add(body, records(play, game));
    else leaderboard(body, game);
  }

  paint();
}

export function xpBar(xp) {
  const r = rankFor(xp);
  return h(
    "div.xp-bar-wrap",
    h(
      "div.xp-bar",
      { role: "progressbar", "aria-valuemin": r.xp, "aria-valuemax": r.next?.xp ?? r.xp, "aria-valuenow": xp, "aria-label": r.next ? `XP toward ${r.next.title}` : "Top rank reached" },
      h("span", { style: { width: `${Math.round(r.progress * 100)}%` } })
    ),
    h("small", r.next ? `${r.next.xp - xp} XP to ${r.next.icon} ${r.next.title}` : "Top rank! 👑")
  );
}

function badges(play) {
  return Object.entries(CATEGORIES).map(([cat, label]) =>
    h(
      "section.badge-group",
      h("h3", label),
      h(
        "ul.badge-list",
        ACHIEVEMENTS.filter((a) => a.cat === cat).map((a) => {
          const got = play.achievements[a.id];
          const secret = a.hidden && !got;
          return h(
            "li.badge",
            { class: got ? "earned" : "locked" },
            h("span.badge-icon", { "aria-hidden": "true" }, secret ? "❔" : got ? a.icon : "🔒"),
            h(
              "div",
              h("strong", secret ? "Hidden achievement" : a.title, got ? h("span.sr-only", " (earned)") : null),
              h("small", secret ? "Keep playing to find it." : a.how),
              h("small.badge-xp", got ? `✓ +${a.xp} XP, Chapter ${got.chapter}` : `${a.xp} XP`)
            )
          );
        })
      )
    )
  );
}

function records(play, game) {
  const best = bestXpChapter(play);
  return h(
    "div",
    h("h3", "Personal records"),
    h(
      "div.stat-grid",
      stat("Highest score", play.records.highestScore ?? "None yet"),
      stat("Longest on-time streak", `${play.records.longestOnTime} month${play.records.longestOnTime === 1 ? "" : "s"}`),
      stat("Best XP chapter", best ? `Chapter ${best.chapter}: ${best.xp} XP` : "None yet"),
      stat("Shifts worked", play.stats.shifts)
    ),
    h("h3", "Kingdom ranks"),
    h(
      "ol.rank-list",
      RANKS.map((r) => h("li", { class: play.xp >= r.xp ? "reached" : "" }, h("span", { "aria-hidden": "true" }, r.icon), ` ${r.title}`, h("small", ` ${r.xp} XP`), play.xp >= r.xp ? h("span.sr-only", " (reached)") : null))
    ),
    h("p.note", "XP comes from achievements, right answers, work shifts and reflections. It never goes down.")
  );
}

function stat(label, value) {
  return h("div.stat", h("span.stat-value", String(value)), h("span.stat-label", label));
}

async function leaderboard(body, game) {
  const cls = game.classInfo;
  if (cls && cls.leaderboard === false) return fill(body, h("p.callout", "Your teacher has the class leaderboard turned off right now."));
  if (!game.profile.classId) return fill(body, h("p.callout", "Join a class to see a leaderboard."));
  fill(body, h("p.muted", "Loading the leaderboard..."));
  await game.syncLeaderboard();
  let rows;
  try {
    rows = await game.db.readLeaderboard(game.profile.classId);
  } catch (err) {
    console.warn(err);
    return fill(body, h("p.error", "Couldn't load the leaderboard. Try again in a minute."));
  }
  const me = game.user.uid;
  fill(
    body,
    h("p.note.tight", "Ranked by XP, which comes from careful play and learning, not from having the most money."),
    h(
      "ol.leaderboard",
      rows.map((r, i) =>
        h(
          "li",
          { class: r.uid === me ? "me" : "" },
          h("span.lb-place", String(i + 1)),
          h("span.lb-art", { html: creatureSvg(r.look || { species: r.species, palette: r.palette, accessories: {} }, { size: 48, label: "" }) }),
          h("span.lb-name", h("strong", r.creatureName), h("small", `${r.displayName}${r.uid === me ? " (you)" : ""}`)),
          h("span.lb-rank", r.rank),
          h("strong.lb-xp", `${r.xp} XP`)
        )
      )
    )
  );
}
