// Trophies (SPEC §16): achievements, XP and rank, personal records, and the
// class leaderboard (ranked by XP, so careful play wins, not cash).
// A page of the Mossy Bestiary (2026-10-22): the rank is a wax seal with an
// XP vine, achievements are medals pinned in a case (drawn icons, never
// emoji), and the leaderboard is the guild's ledger with ribbons for the top
// three. Earned, locked and "you" are always said in words too.
import { h, fill, add } from "../dom.js";
import { placeHeader } from "../place-header.js";
import { icon } from "../icons.js";
import { sealSvg } from "../bestiary-art.js";
import { ACHIEVEMENTS, CATEGORIES, RANKS } from "../../data/achievements.js";
import { rankFor, bestXpChapter } from "../../progress.js";
import { creatureSvg } from "../creature-art.js";
import { withPerson } from "../../social.js";

const TABS = [
  ["badges", "trophy", "Achievements"],
  ["rank", "star", "Rank and records"],
  ["board", "chart", "Leaderboard"],
  ["battles", "shield", "Battle wins"],
];

// The Battle wins board's filter (teacher request 2026-10-26): all wins by
// default, or only wins against classmates or the computer.
const BATTLE_FILTERS = [
  ["wins", "All wins"],
  ["live", "vs classmates"],
  ["bot", "vs computer"],
];
let battleFilter = "wins";

// A drawn icon for each kind of achievement.
const CATEGORY_MARK = { payment: "calendar", owed: "chart", building: "gauge", debt: "receipt", smart: "sparkle", learning: "academy", minigames: "guild", creature: "palette", persistence: "star", social: "people", battle: "shield" };
const PLACE_WORD = ["1st", "2nd", "3rd"];

let tab = "badges";
let nextBoardTab = null;

// Opens the leaderboard on another of its tabs next time (the Arena links to Battle wins).
export function openBoardTab(key) {
  nextBoardTab = key;
}

// The rank as a wax seal with its level in Roman numerals.
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
export const rankSeal = (level, size = 64) => h("span.tr-seal", { "aria-hidden": "true", html: sealSvg({ seed: 40 + level, size, letter: ROMAN[level - 1] || String(level) }) });

export function render(root, { game, go, track, startTab }) {
  const play = game.play;
  if (startTab) tab = nextBoardTab || startTab;
  nextBoardTab = null;
  const panel = h("section.panel.trophies");
  root.append(h("div.bestiary.bst-trophies", panel));

  function paint() {
    const r = rankFor(play.xp);
    const earned = ACHIEVEMENTS.filter((a) => play.achievements[a.id]).length;
    const body = h("div.tr-body");
    fill(
      panel,
      placeHeader({
        go,
        iconName: "trophy",
        kicker: "The Academy's hall of honors",
        title: "Trophies",
        subtitle: `${earned} of ${ACHIEVEMENTS.length} achievements earned.`,
        aside: h("div.tr-rank", rankSeal(r.level, 64), h("div.tr-rank-text", h("small", "Your rank"), h("strong", r.title), h("span", `${play.xp} XP`)), xpBar(play.xp)),
      }),
      h(
        "nav.tr-tabs",
        { "aria-label": "Trophies" },
        TABS.map(([key, ico, label]) =>
          h(
            "button.tr-tab",
            {
              type: "button",
              "aria-current": key === tab ? "page" : null,
              onclick: () => {
                tab = key;
                track("trophiesTab", { tab: key });
                paint();
              },
            },
            icon(ico, { size: 20 }),
            ` ${label}`
          )
        )
      ),
      body
    );
    if (tab === "badges") add(body, badges(play));
    else if (tab === "rank") add(body, records(play));
    else if (tab === "battles") battleBoard(body, game, track, paint);
    else leaderboard(body, game);
  }

  paint();
}

// The XP vine toward the next rank. Words say how far, not just the bar.
export function xpBar(xp) {
  const r = rankFor(xp);
  return h(
    "div.xp-bar-wrap",
    h(
      "div.xp-bar",
      { role: "progressbar", "aria-valuemin": r.xp, "aria-valuemax": r.next?.xp ?? r.xp, "aria-valuenow": xp, "aria-label": r.next ? `XP toward ${r.next.title}` : "Top rank reached" },
      h("span", { style: { width: `${Math.round(r.progress * 100)}%` } })
    ),
    h("small", r.next ? `${r.next.xp - xp} XP to ${r.next.title}` : "Top rank in the kingdom!")
  );
}

function badges(play) {
  return Object.entries(CATEGORIES).map(([cat, label]) => {
    const list = ACHIEVEMENTS.filter((a) => a.cat === cat);
    const got = list.filter((a) => play.achievements[a.id]).length;
    return h(
      "section.tr-case",
      h("h3", icon(CATEGORY_MARK[cat] || "trophy", { size: 22 }), ` ${label}`, h("small", ` ${got} of ${list.length}`)),
      h(
        "ul.tr-medals",
        list.map((a) => {
          const won = play.achievements[a.id];
          const secret = a.hidden && !won;
          return h(
            "li.tr-medal",
            { class: won ? "earned" : "locked" },
            h("span.tr-medal-face", { "aria-hidden": "true" }, secret ? h("span.tr-q", "?") : icon(won ? CATEGORY_MARK[cat] || "trophy" : "lock", { size: 26 })),
            h(
              "div.tr-medal-text",
              h("strong", secret ? "Hidden achievement" : a.title),
              h("small", secret ? "Keep playing to find it." : a.how),
              h("small.tr-medal-xp", won ? `✓ Earned in Chapter ${won.chapter}, +${a.xp} XP` : `Not yet · ${a.xp} XP`)
            )
          );
        })
      )
    );
  });
}

function records(play) {
  const best = bestXpChapter(play);
  const cur = rankFor(play.xp).level;
  const line = (label, value) => h("li", h("span", label), h("strong", String(value)));
  return h(
    "div.tr-records",
    h(
      "section.tr-ledger",
      h("h3", "Personal records"),
      h(
        "ul",
        line("Highest score", play.records.highestScore ?? "None yet"),
        line("Longest on-time streak", `${play.records.longestOnTime} month${play.records.longestOnTime === 1 ? "" : "s"}`),
        line("Best XP chapter", best ? `Chapter ${best.chapter}: ${best.xp} XP` : "None yet"),
        line("Shifts worked", play.stats.shifts)
      )
    ),
    h(
      "section.tr-ladder",
      h("h3", "Kingdom ranks"),
      h(
        "ol",
        RANKS.map((r, i) =>
          h(
            "li",
            { class: i + 1 === cur ? "current" : play.xp >= r.xp ? "reached" : "ahead" },
            rankSeal(i + 1, 46),
            h("span.tr-ladder-title", r.title),
            h("small", `${r.xp} XP`),
            h("small.tr-ladder-state", i + 1 === cur ? "You are here" : play.xp >= r.xp ? "✓ Reached" : "Ahead")
          )
        )
      ),
      h("p.note", "XP comes from achievements, right answers, work shifts and finished chapters. It never goes down.")
    )
  );
}

async function battleBoard(body, game, track, paint) {
  const cls = game.classInfo;
  if (cls && cls.leaderboard === false) return fill(body, h("p.callout", "Your teacher has the class leaderboard turned off right now."));
  if (!game.profile.classId) return fill(body, h("p.callout", "Join a class to see who wins the most battles."));
  fill(body, h("p.note", "Counting the Arena's wins..."));
  await game.syncLeaderboard();
  let rows;
  try {
    rows = await game.db.readLeaderboard(game.profile.classId);
  } catch (err) {
    console.warn(err);
    return fill(body, h("p.error", "Couldn't load the battle board. Try again in a minute."));
  }
  const me = game.user.uid;
  const count = (r) => r.battles?.[battleFilter] || 0;
  const sorted = rows.slice().sort((a, b) => count(b) - count(a) || (b.xp || 0) - (a.xp || 0));
  const word = (n) => `${n} win${n === 1 ? "" : "s"}`;
  fill(
    body,
    h(
      "section.tr-board.tr-battle-board",
      h("h3", "The Arena's tally"),
      h("p.note", "Most battle wins in the class. Wins come from answering money questions right under pressure."),
      h(
        "div.tr-filters",
        { role: "group", "aria-label": "Which wins to count" },
        BATTLE_FILTERS.map(([key, label]) =>
          h(
            "button.tr-filter",
            {
              type: "button",
              "aria-pressed": String(key === battleFilter),
              onclick: () => {
                battleFilter = key;
                track("battleBoardFilter", { filter: key });
                paint();
              },
            },
            key === battleFilter ? icon("check", { size: 16 }) : null,
            ` ${label}`
          )
        )
      ),
      h(
        "ol.leaderboard.tr-rows",
        sorted.map((r, i) => {
          const n = count(r);
          const top = n > 0 && i < 3;
          return h(
            "li",
            { class: `${r.uid === me ? "me" : ""}${top ? ` top top-${i + 1}` : ""}` },
            top ? h("span.lb-place.tr-ribbon", { "aria-label": `${PLACE_WORD[i]} place` }, PLACE_WORD[i]) : h("span.lb-place", String(i + 1)),
            h("span.lb-art", { html: creatureSvg(r.look || { species: r.species, palette: r.palette, accessories: {} }, { size: 52, label: "" }) }),
            h("span.lb-name", h("strong", withPerson(r.creatureName, r.person)), r.uid === me ? h("small.tr-you", "That's you") : null),
            h("span.lb-rank", `${r.battles?.live || 0} vs classmates, ${r.battles?.bot || 0} vs computer`),
            h("strong.lb-xp", n ? word(n) : "No wins yet")
          );
        })
      )
    )
  );
}

async function leaderboard(body, game) {
  const cls = game.classInfo;
  if (cls && cls.leaderboard === false) return fill(body, h("p.callout", "Your teacher has the class leaderboard turned off right now."));
  if (!game.profile.classId) return fill(body, h("p.callout", "Join a class to see a leaderboard."));
  fill(body, h("p.note", "Opening the guild's ledger..."));
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
    h(
      "section.tr-board",
      h("h3", "The guild's ledger"),
      h("p.note", "Ranked by XP, which comes from careful play and learning, not from having the most money."),
      h(
        "ol.leaderboard.tr-rows",
        rows.map((r, i) =>
          h(
            "li",
            { class: `${r.uid === me ? "me" : ""}${i < 3 ? ` top top-${i + 1}` : ""}` },
            i < 3 ? h("span.lb-place.tr-ribbon", { "aria-label": `${PLACE_WORD[i]} place` }, PLACE_WORD[i]) : h("span.lb-place", String(i + 1)),
            h("span.lb-art", { html: creatureSvg(r.look || { species: r.species, palette: r.palette, accessories: {} }, { size: 52, label: "" }) }),
            h("span.lb-name", h("strong", withPerson(r.creatureName, r.person)), r.uid === me ? h("small.tr-you", "That's you") : null),
            h("span.lb-rank", r.rank),
            h("strong.lb-xp", `${r.xp} XP`)
          )
        )
      )
    )
  );
}
