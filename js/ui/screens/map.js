// The kingdom map on its own page (teacher request 2026-10-22): nearly the
// whole screen, calm, and every place says what it is in plain words. It opens
// from Map in the top bar, and every place's back button returns here.
import { h, toast } from "../dom.js";
import { kingdomMap } from "../bestiary-map.js";
import { CONFIG } from "../../data/config.js";
import * as P from "../../play.js";
import { placeStatus } from "../../places.js";

export function render(root, { game, go, track }) {
  const { play, life } = game.run;
  const c = game.save.creature;
  const status = placeStatus({ life, play, creature: c, classInfo: game.classInfo });
  root.append(
    h(
      "div.bestiary.bst-hub.bst-mapscreen",
      h(
        "section.panel.map-page",
        h("h1.sr-only", "Map of Coinhaven"),
        kingdomMap({ creature: c, ageMonths: life.ageMonths, status, home: play.home || [], calm: true, onOpen: (pl) => openPlace(pl, status, { game, go, track }) }),
        h("p.map-help", "Tap a place to go there. New places appear on the map as they open.")
      )
    )
  );
}

// Opening a place from the map or from Home. Town Hall starts the chapter
// when one is open and not started yet.
export async function openPlace(pl, status, { game, go, track }) {
  const play = game.run.play;
  track("placeOpen", { place: pl.id, status: status[pl.id]?.text || "" });
  if (status[pl.id]?.tone === "locked") return toast(`${pl.name}: ${status[pl.id].text.toLowerCase()}. Keep playing to unlock it!`, "info");
  if (pl.id === "townhall" && !play.active && !play.summary) return startChapter({ game, go, track });
  go(pl.route);
}

export async function startChapter({ game, go, track }) {
  const { play, life } = game.run;
  const n = play.chapter;
  if (game.run.practice || game.classInfo?.paused || !P.canPlay(play, game.classInfo?.releasedChapter || 1)) return go("month");
  P.startChapter(play, life, game.classInfo?.monthsPerChapter || CONFIG.pacing.monthsPerChapter);
  track("chapterStart", { chapter: n });
  await game.persist("chapterStart");
  go("month");
}
