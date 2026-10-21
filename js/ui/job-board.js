// The job board: pick a job, play its minigame, see your pay and what you
// missed, then collect (SPEC §17). Pay rises with experience at each job.
import { h, fill, money } from "./dom.js";
import { coinsFly } from "./fx.js";
import { CONFIG } from "../data/config.js";
import { JOBS } from "../data/minigames.js";
import { jobPay, experienceBonus, recordShift, rideAndHomeBonus } from "../progress.js";
import { openJobs, opensText, unlockStage } from "../progression.js";
import { icon } from "./icons.js";
import * as P from "../play.js";
import { ledgerSort } from "./minigames/ledger-sort.js";
import { cashierRush } from "./minigames/cashier-rush.js";
import { checkWriter } from "./minigames/check-writer.js";

const REACTIONS = [
  ["up", "👍", "I liked this job"],
  ["meh", "😐", "This job was okay"],
  ["down", "👎", "I didn't like this job"],
];

// onCollected() repaints the month after pay goes into checking.
export function jobBoard({ game, run, track, save, onCollected }) {
  const play = run.play;
  const el = h("div.job-board");
  // New players start untimed (Phase 10 prologue).
  let timed = !(play.prologue && !play.prologue.done);
  let running = null;

  // Jobs that open later, so students know more is coming.
  function lockedJobs() {
    const later = Object.entries(JOBS)
      .filter(([key]) => !openJobs(play).includes(key))
      .sort(([a], [b]) => unlockStage(a) - unlockStage(b));
    if (!later.length) return null;
    return h("p.note.tight.center", icon("lock", { size: 14 }), " Coming later: ", later.map(([key, job]) => `${job.icon} ${job.title} (${opensText(key).replace("Opens", "opens")})`).join(", "));
  }

  function board() {
    const j = CONFIG.play.jobs;
    const timer = h("input", { type: "checkbox", id: "untimed", checked: !timed });
    timer.addEventListener("change", () => (timed = !timer.checked));
    fill(
      el,
      h(
        "div.job-cards",
        Object.entries(JOBS)
          .filter(([key]) => openJobs(play).includes(key))
          .map(([key, job]) => {
          const xp = experienceBonus(play, key) + (play.shiftBonus || 0) + rideAndHomeBonus(play);
          const stats = play.jobs[key];
          return h(
            "button.job-card",
            { type: "button", onclick: () => start(key) },
            h("span.job-icon", { "aria-hidden": "true" }, job.icon),
            h("strong", job.title),
            h("small", job.job),
            h("span", job.skill),
            h("span.job-pay", `Pays ${money(j.pay.min + xp)} to ${money(j.pay.max + xp)}`),
            stats ? h("small", `${stats.shifts} shift${stats.shifts === 1 ? "" : "s"} worked. Best: ${stats.best}.`) : h("small", "New job!"),
            xp ? h("small.good-text", `+${money(xp)} for experience`) : null
          );
        })
      ),
      lockedJobs(),
      h("label.untimed", timer, " No timer (fewer items, same pay for each right answer)")
    );
  }

  function start(key) {
    const shifts = play.active ? play.active.month.shifts : `p${play.prologue?.shifts ?? 0}`;
    const seed = `${run.life.seed}:job:${run.life.month}:${shifts}`;
    track("minigameStart", { game: key, timed });
    const done = (result) => finish(key, result);
    const opts = { seed, timed, onDone: done, track };
    running =
      key === "ledger"
        ? ledgerSort(opts)
        : key === "cashier"
          ? cashierRush(opts)
          : checkWriter({ ...opts, life: run.life, creature: game.save.creature, payFor: (right) => jobPay(play, "checks", { right }) });
    fill(el, h("h3", `${JOBS[key].icon} ${JOBS[key].title}`), running);
    el.querySelector("button")?.focus();
  }

  function finish(key, result) {
    running = null;
    const pay = jobPay(play, key, result);
    let reaction = "";
    const collect = h("button.big", { type: "button", "data-sound": "none" }, `Collect ${money(pay)}`);
    collect.addEventListener("click", async () => {
      collect.disabled = true;
      const r = P.workShift(play, run.life, pay, `work shift: ${JOBS[key].title}`);
      if (!r.ok) return;
      coinsFly(collect);
      run.life = r.life;
      recordShift(play, key, { right: result.right, pay });
      track("minigame", { game: key, right: result.right, wrong: result.wrong, total: result.total, pay, seconds: result.seconds, timed, reaction, depositOnly: result.depositOnly ?? null });
      await save("shift");
      onCollected(pay);
    });
    const reacts = h(
      "div.reactions",
      { role: "group", "aria-label": "How was this job?" },
      REACTIONS.map(([k, emoji, label]) =>
        h(
          "button.reaction",
          {
            type: "button",
            "aria-label": label,
            "aria-pressed": "false",
            onclick: (e) => {
              reaction = k;
              reacts.querySelectorAll(".reaction").forEach((b) => b.setAttribute("aria-pressed", String(b === e.currentTarget)));
            },
          },
          emoji
        )
      )
    );
    fill(
      el,
      h("h3", `${JOBS[key].icon} Shift over!`),
      h("div.big-number", money(pay)),
      h("p.center", `${result.right} right${result.wrong ? `, ${result.wrong} missed` : ""}.`),
      result.depositOnly ? h("p.callout.good", "Smart: \"For deposit only\" means nobody else can cash your check.") : null,
      result.misses.length
        ? h("details.math", { open: result.misses.length <= 4 }, h("summary", `What you missed (${result.misses.length})`), h("ul", result.misses.slice(0, 8).map((m) => h("li", m))))
        : h("p.callout.good", "Perfect shift!"),
      reacts,
      h("div.row", collect)
    );
    collect.focus();
  }

  board();
  // The month screen calls this when it repaints, so a running timer stops cleanly.
  el.stop = () => running?.stop?.();
  return el;
}
