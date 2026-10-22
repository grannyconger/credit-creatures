// The Guild Hall: work shifts to earn money (SPEC §17). Up to 3 a month while
// a chapter is going. Then back to the kingdom.
import { h, add, fill, money, toast } from "../dom.js";
import * as P from "../../play.js";
import { jobBoard } from "../job-board.js";
import { placeHeader } from "../place-header.js";
import { moneyChips } from "../wallet.js";
import { firstVisitLesson } from "../guide.js";
import { icon } from "../icons.js";

export function render(root, { game, go, track, refreshWho }) {
  const run = game.run;
  const play = run.play;
  const panel = h("section.panel.place-screen.guild");
  // A page of the Mossy Bestiary (2026-10-22): jobs are shift tickets with a
  // tear-off stub, and each shift is worked on a stitched workbench.
  root.append(h("div.bestiary.bst-guild", panel));
  let board = null;

  const save = async (reason) => {
    refreshWho();
    await run.persist(reason);
  };

  function paint() {
    board?.stop();
    board = null;
    fill(panel, placeHeader({ go, iconName: "guild", title: "Guild Hall", subtitle: "Pick a job and work a shift. Pay depends on how well you do, and goes up with experience.", practice: run.practice }), moneyChips(run.life, play));
    const prologue = play.prologue && !play.prologue.done;
    if (prologue && P.shiftsLeft(play) <= 0) {
      add(panel, h("p.callout", icon("piggy", { size: 18 }), " Your piggy bank is filling up nicely. That's all the shifts for now. Check what Sage says to do next."), h("div.row", h("button", { type: "button", onclick: () => go("hub") }, "Back to the kingdom")));
      return;
    }
    if (!play.active && !prologue) {
      add(panel, h("p.callout", "The Guild Hall is open while a chapter is going. Start the next chapter at Town Hall."), h("div.row", h("button", { type: "button", onclick: () => go("hub") }, "Back to the kingdom")));
      return;
    }
    const left = P.shiftsLeft(play);
    if (left <= 0) {
      add(panel, h("p.callout", "You've worked every shift you can this month. Head to Town Hall when you're ready to end the month."), h("div.row", h("button", { type: "button", onclick: () => go("month") }, "Go to Town Hall")));
      return;
    }
    board = jobBoard({
      game,
      run,
      track,
      save,
      onCollected: (pay) => {
        toast(`${money(pay)} went into ${prologue ? "your piggy bank" : "checking"}.`, "good");
        paint();
      },
    });
    add(panel, h("p.muted", prologue ? `${left} shift${left === 1 ? "" : "s"} left before the bank opens.` : `${left} shift${left === 1 ? "" : "s"} left this month.`), board);
  }

  paint();
  firstVisitLesson({ game, track, id: "guild", route: "guild" });
  return () => board?.stop();
}
