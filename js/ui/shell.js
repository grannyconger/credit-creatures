// The persistent shell (docs/UI-REBUILD.md, slice 1): status chips in the top
// bar, and a bottom bar with the creature, three shortcuts and Things To Do.
// Screens render only in the middle (#app), so these never rebuild per screen.
import { h, clear, money } from "./dom.js";
import { icon } from "./icons.js";
import { PLACES, placeStatus } from "../places.js";
import { hasFeature, prologueStep } from "../progression.js";
import { openPlace } from "./screens/map.js";
import { ensureDaily } from "../daily.js";
import { progress } from "../challenges.js";
import { STATS } from "../data/stats.js";
import { CONFIG } from "../data/config.js";

const status = document.getElementById("status");
const bottombar = document.getElementById("bottombar");
const shortcuts = document.getElementById("shortcuts");
const thingsBtn = document.getElementById("things-btn");

let api = null;

// Home, Arcade and Market are always one click away (route ids stay guild and shop).
const SHORTCUTS = [
  { id: "hub", label: "Home", icon: "home", route: "hub" },
  { id: "guild", label: "Arcade", icon: "guild", route: "guild" },
  { id: "market", label: "Market", icon: "market", route: "shop" },
];

// Places that aren't on PLACES but belong in Things To Do.
const EXTRAS = [
  { id: "daily", name: "Daily Pick", kind: "Free prizes every day", icon: "chest", route: "daily" },
  { id: "map", name: "Map", kind: "The whole kingdom", icon: "compass", route: "map" },
  { id: "leaderboard", name: "Leaderboard", kind: "How the class is doing", icon: "trophy", route: "leaderboard" },
  { id: "trophies", name: "Trophies", kind: "Ranks and achievements", icon: "star", route: "trophies" },
];

export function initShell({ getGame, go, track }) {
  api = { getGame, go, track };
  thingsBtn.addEventListener("click", () => openThingsToDo());
  shortcuts.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-route]");
    const game = getGame();
    if (!b || !game) return;
    track("shortcutClick", { to: b.dataset.route, from: location.hash.replace(/^#\/?/, "") || game.step });
    if (b.dataset.route === "hub") return go("hub");
    const pl = PLACES.find((p) => p.id === b.dataset.place);
    openPlace(pl, currentStatus(game), { game, go, track });
  });
  // T opens Things To Do, unless the student is typing.
  addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "t" || e.ctrlKey || e.metaKey || e.altKey) return;
    // An Arcade game uses T too (Phish Tank's Trust, Bill Drop's autopay), so a key a
    // game already handled, or any key during a shift, stays with the game.
    if (e.defaultPrevented || document.querySelector(".panel.playing .arc-frame")) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]") || document.querySelector("dialog[open]")) return;
    if (!getGame() || bottombar.hidden) return;
    openThingsToDo();
  });
}

function currentStatus(game) {
  const { play, life } = game.run;
  return placeStatus({ life, play, creature: game.save.creature, classInfo: game.classInfo });
}

// Repainted whenever the screen changes or the game saves.
export function paintShell(game) {
  const inKingdom = game?.step === "hub";
  bottombar.hidden = !inKingdom;
  status.hidden = !inKingdom;
  if (!inKingdom) return void (pill.hidden = true);
  const { play, life } = game.run;
  const here = location.hash.replace(/^#\/?/, "") || "hub";

  clear(status);
  const streak = ensureDaily(play).streak;
  for (const [key, ico, label, value] of [
    ["coins", "coins", "Coins", money(life.checking)],
    ["energy", "energy", "Energy", `${play.energy || 0}/${CONFIG.pacing.rewards.energy.max}`],
    ["xp", "star", "XP", String(play.xp || 0)],
    streak ? ["streak", "flame", "Streak", `${streak} day${streak === 1 ? "" : "s"}`] : null,
  ].filter(Boolean)) {
    status.append(
      h("li", h("button.stat-chip", { type: "button", "data-stat": key, "aria-haspopup": "dialog", "aria-label": `${label}: ${value}. What is this?`, onclick: (e) => openStat(key, value, e.currentTarget) }, icon(ico, { size: 20 }), h("small", label), h("strong", value)))
    );
  }

  paintChallenges(game);
  const st = currentStatus(game);
  clear(shortcuts);
  for (const s of SHORTCUTS) {
    const locked = st[s.id]?.tone === "locked";
    shortcuts.append(
      h(
        "button",
        { type: "button", "data-route": s.route, "data-place": s.id, "aria-current": s.route === here ? "page" : "false", "aria-disabled": locked ? "true" : null },
        icon(locked ? "lock" : s.icon, { size: 22 }),
        h("span", s.label)
      )
    );
  }
}

// Today's three challenges: a small pill above the bottom bar that opens a list.
const pill = document.getElementById("challenges");
let pillOpen = false;
function paintChallenges(game) {
  pill.hidden = !(game?.step === "hub");
  if (pill.hidden) return;
  const p = progress(game.run.play, game.run.life);
  clear(pill);
  pill.append(
    ...[h("button.challenge-toggle", { type: "button", "aria-expanded": pillOpen ? "true" : "false", onclick: () => ((pillOpen = !pillOpen), paintChallenges(game)) }, icon("check", { size: 18 }), h("span", ` Today ${p.done}/${p.total}`), icon(pillOpen ? "down" : "up", { size: 16 })),
    pillOpen
      ? h(
          "div.challenge-list",
          h("h2", "Today's challenges"),
          h("ul", p.rows.map((r) => h("li", { class: r.done ? "done" : "" }, icon(r.done ? "check" : "next", { size: 14 }), ` ${r.text}`, r.done ? h("span.sr-only", " (done)") : null))),
          h("p", p.bonus ? "All done. Bonus earned!" : "Finish all three for a coin bonus.")
        )
      : null].filter(Boolean)
  );
}

// A grid of big tiles, one per place. Locked places stay visible with a lock
// and the words that say when they open, so students see what is coming.
// Four groups of big colored tiles (teacher request 2026-10-23: they all looked
// the same). Each place has its own hue and a large icon on a medallion. Locked
// places stay visible with a lock and the words that say when they open.
const GROUPS = [
  { title: "Your money", ids: ["vault", "townhall", "garage"] },
  { title: "Earn and learn", ids: ["guild", "academy", "daily", "alley"] },
  { title: "Shop and home", ids: ["market", "cottage"] },
  { title: "Friends and fame", ids: ["plaza", "leaderboard", "trophies", "map"] },
];
const HUE = { vault: "vault", townhall: "townhall", guild: "arcade", garage: "garage", market: "market", cottage: "cottage", plaza: "plaza", alley: "alley", academy: "academy", map: "map", leaderboard: "board", trophies: "trophy", daily: "daily" };

export function openThingsToDo() {
  const game = api?.getGame();
  if (!game?.run) return;
  const { go, track } = api;
  const { play, life } = game.run;
  const st = currentStatus(game);
  track("thingsToDoOpen", { from: location.hash.replace(/^#\/?/, "") || game.step });

  const dialog = h("dialog.things-dialog.bst-scope", { "aria-labelledby": "things-title" });
  const close = () => {
    dialog.close();
    dialog.remove();
  };
  const everything = Object.fromEntries([...PLACES, ...EXTRAS].map((x) => [x.id, x]));
  const hidden = (x) => (x.id === "leaderboard" && game.classInfo?.leaderboard === false) || (x.id === "trophies" && !hasFeature(play, "academy", life));
  const tile = (x) => {
    const locked = st[x.id]?.tone === "locked";
    const text = st[x.id]?.text || "";
    const isPlace = PLACES.some((p) => p.id === x.id);
    return h(
      "button.thing-tile",
      {
        type: "button",
        "data-place": x.id,
        class: `${locked ? "locked" : ""} ${st[x.id]?.tone === "action" ? "needs" : ""}`,
        style: `--tile-hue: var(--hue-${HUE[x.id] || "home"})`,
        "aria-disabled": locked ? "true" : null,
        onclick: () => {
          track("thingsToDoPick", { place: x.id, locked });
          close();
          if (isPlace) openPlace(x, st, { game, go, track });
          else go(x.route);
        },
      },
      h("span.thing-medal", icon(locked ? "lock" : x.icon, { size: 44 })),
      h("span.thing-words", h("strong", x.name), h("small", x.kind), text ? h("span.thing-status", { class: locked ? "locked" : st[x.id]?.tone === "action" ? "action" : "" }, text) : null)
    );
  };
  const columns = GROUPS.map((g, i) =>
    h(
      "section.thing-group",
      { class: `group-${i + 1}` },
      h("h3", g.title),
      h("div.thing-list", g.ids.map((id) => everything[id]).filter((x) => x && !hidden(x)).map(tile))
    )
  );
  dialog.append(
    h("div.things-head", h("h2", { id: "things-title" }, icon("compass", { size: 28 }), " Things To Do"), h("p.muted", prologueStep(play) ? "Sage says: follow the one with the red mark." : "Pick where to go. Press T any time to open this."), h("button.things-close", { type: "button", "aria-label": "Close Things To Do", onclick: close }, icon("down", { size: 20 }))),
    h("div.things-columns", columns)
  );
  dialog.addEventListener("cancel", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  document.body.append(dialog);
  dialog.showModal();
}

// A pop-up under a top bar chip that says what the number is and what it does.
const statPop = document.getElementById("stat-pop");
function openStat(key, value, anchor) {
  const st = STATS[key];
  if (!st) return;
  api?.track("statInfoOpen", { stat: key });
  statPop.replaceChildren(
    h("div.stat-pop-head", h("h2", icon(st.icon, { size: 22 }), ` ${st.title}`), h("strong.stat-pop-value", value)),
    h("p", h("strong", "What it is: "), st.what),
    h("p", h("strong", "What it does: "), st.does),
    h("p", h("strong", "How to get more: "), st.gain)
  );
  const r = anchor.getBoundingClientRect();
  statPop.style.top = `${Math.round(r.bottom + 8)}px`;
  statPop.style.left = `${Math.max(8, Math.min(Math.round(r.left), innerWidth - 360))}px`;
  if (statPop.matches(":popover-open")) statPop.hidePopover();
  statPop.showPopover();
}
