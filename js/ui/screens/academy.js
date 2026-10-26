// The Academy: practice questions for XP, and a door to
// trophies and ranks. Learning is how creatures rise in Coinhaven.
import { h, fill } from "../dom.js";
import { icon } from "../icons.js";
import { deskTab } from "../accounts/desk-tab.js";
import { placeHeader } from "../place-header.js";
import { xpBar } from "./trophies.js";
import { runLesson, firstVisitLesson } from "../guide.js";
import { LESSONS, LESSON_ORDER } from "../../data/lessons.js";
import { hasFeature } from "../../progression.js";

export function render(root, { game, go, track, refreshWho }) {
  const run = game.run;
  const panel = h("section.panel.place-screen.academy");
  // A page of the Mossy Bestiary (2026-10-22): the naturalist's study, with
  // Sage's lessons as books on a shelf and practice on an exam sheet.
  root.append(h("div.bestiary.bst-academy", panel));
  const ctx = {
    game,
    run,
    track,
    async save(reason) {
      refreshWho();
      await run.persist(reason);
    },
    repaint: () => paint(),
  };
  function paint() {
    fill(
      panel,
      placeHeader({ go, iconName: "academy", title: "The Academy", subtitle: "Answer questions to earn XP. XP raises your rank and unlocks new looks.", practice: run.practice, aside: h("div.academy-rank", xpBar(run.play.xp), h("button.secondary.small", { type: "button", onclick: () => go("trophies") }, icon("trophy", { size: 16 }), " Trophies and ranks")) }),
      lessonShelf(),
      deskTab(ctx)
    );
  }
  // Every lesson unlocked so far, to replay any time (Phase 10).
  function lessonShelf() {
    const seen = game.save.play.lessonsSeen || [];
    const ids = LESSON_ORDER.filter((id) => hasFeature(run.play, LESSONS[id].feature, run.life));
    return h(
      "section.lesson-shelf",
      h("h3", icon("academy", { size: 22 }), " Lessons from Sage"),
      h("p.note.tight", "Replay any lesson you've unlocked. New ones arrive as the kingdom grows."),
      h(
        "div.chip-group.bst-books",
        ids.map((id, i) =>
          h(
            "button.chip.bst-book",
            { type: "button", style: `--i: ${i}`, "aria-label": `${LESSONS[id].title}${seen.includes(id) ? ", read" : ", not read yet"}`, onclick: () => runLesson({ game, track, id, returnTo: "academy" }) },
            h("span.bst-book-title", LESSONS[id].title),
            seen.includes(id) ? h("span.bst-book-read", icon("check", { size: 14 }), " read") : h("span.bst-book-read.new", "new")
          )
        )
      )
    );
  }

  paint();
  firstVisitLesson({ game, track, id: "academy", route: "academy" });
}
