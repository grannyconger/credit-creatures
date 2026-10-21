// The Guild Hall: work shifts to earn money (SPEC §17). Up to 3 a month while
// a chapter is going. Then back to the kingdom.
import { h, add, fill, money, toast } from "../dom.js";
import * as P from "../../play.js";
import { jobBoard } from "../job-board.js";
import { placeHeader } from "../place-header.js";
import { moneyChips } from "../wallet.js";

export function render(root, { game, go, track, refreshWho }) {
  const run = game.run;
  const play = run.play;
  const panel = h("section.panel.place-screen.guild");
  root.append(panel);
  let board = null;

  const save = async (reason) => {
    refreshWho();
    await run.persist(reason);
  };

  function paint() {
    board?.stop();
    board = null;
    fill(panel, placeHeader({ go, iconName: "guild", title: "Guild Hall", subtitle: "Pick a job and work a shift. Pay depends on how well you do, and goes up with experience.", practice: run.practice }), moneyChips(run.life, play.sparkle.total));
    if (!play.active) {
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
        toast(`${money(pay)} went into checking.`, "good");
        paint();
      },
    });
    add(panel, h("p.muted", `${left} shift${left === 1 ? "" : "s"} left this month.`), board);
  }

  paint();
  return () => board?.stop();
}
