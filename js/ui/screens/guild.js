// The Arcade: work shifts to earn money (SPEC §17). Up to 3 a month while
// a chapter is going. Then back to the kingdom.
import { h, add, fill, money, toast } from "../dom.js";
import * as P from "../../play.js";
import { jobBoard } from "../job-board.js";
import { moneyChips } from "../wallet.js";
import { firstVisitLesson } from "../guide.js";
import { icon } from "../icons.js";
import { settleAbandoned } from "../../arcade/core.js";
import { CONFIG } from "../../data/config.js";

export function render(root, { game, go, track, refreshWho }) {
  const run = game.run;
  const play = run.play;
  const panel = h("section.panel.place-screen.guild");
  // A page of the Mossy Bestiary (2026-10-22): jobs are shift tickets with a
  // tear-off stub, and each shift is worked on a stitched workbench.
  root.append(h("div.bestiary.bst-guild.arc-world", panel));
  let board = null;

  const save = async (reason) => {
    refreshWho();
    await run.persist(reason);
  };

  // A risky shift left running when the tab closed still counts (GAME-SPECS.md 2.3).
  const abandoned = settleAbandoned(play);
  if (abandoned) {
    track("arcadeAbandoned", abandoned);
    save("abandoned shift");
    if (abandoned.fired) toast(`Your last risky shift had ${abandoned.mistakes} mistakes. You're fired from that game for ${CONFIG.arcade.cooldownMinutes} minutes.`, "bad");
  }

  function paint() {
    board?.stop();
    board = null;
    // The hall's neon sign. The header folds away while a shift runs (.playing).
    fill(
      panel,
      h(
        "header.arc-hall-head",
        h("button.arc-back", { type: "button", onclick: () => go("map") }, icon("back", { size: 16 }), " Back to the map"),
        h("h1.arc-hall-title", "Arcade"),
        h("p.arc-hall-sub", "Pick a game, work a shift, earn coins. Every game plays its own way."),
        h("span.arc-wallet", icon("coins", { size: 22 }), h("small", "Coins"), h("strong", money(run.life.checking)))
      ),
      run.practice ? h("p.callout.warn.practice", "Practice mode. Nothing you do here is saved.") : null
    );
    const prologue = play.prologue && !play.prologue.done;
    if (!play.active && !prologue) {
      add(panel, h("p.callout", "The Arcade is open while a chapter is going. Start the next chapter at Town Hall."), h("div.row", h("button", { type: "button", onclick: () => go("hub") }, "Back home")));
      return;
    }
    const left = P.shiftsLeft(play);
    // The goal is met, but the Arcade stays open so a student can always earn.
    if (left <= 0) add(panel, h("p.callout", icon("check", { size: 18 }), prologue ? " Your piggy bank is filling up nicely. You worked all three jobs. Keep working for more coins, or check what Sage says to do next." : " You worked this month's shifts. You can keep working for more coins any time."));
    board = jobBoard({
      game,
      run,
      track,
      save,
      onCollected: (pay) => {
        if (pay != null) toast(`${money(pay)} went into ${prologue ? "your piggy bank" : "checking"}.`, "good");
        paint();
      },
    });
    panel.querySelector(".arc-hall-head")?.append(h("span.arc-shifts", prologue ? (left ? `${left} shift${left === 1 ? "" : "s"} to go before the bank opens` : "All 3 jobs worked") : left ? `${left} shift${left === 1 ? "" : "s"} to go this month` : "This month's shifts done"));
    add(panel, board);
  }

  paint();
  firstVisitLesson({ game, track, id: "guild", route: "guild" });
  return () => board?.stop();
}
