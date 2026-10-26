// The job board: pick a job, play its minigame, see your pay and what you
// missed, then collect (SPEC §17). Pay rises with experience at each job.
import { h, fill, money } from "./dom.js";
import { coinsFly } from "./fx.js";
import { CONFIG } from "../data/config.js";
import { JOBS } from "../data/minigames.js";
import { jobPay, experienceBonus, recordShift, rideAndHomeBonus, shiftRewards } from "../progress.js";
import { openJobs, opensText, unlockStage } from "../progression.js";
import { icon } from "./icons.js";
import * as P from "../play.js";
import { ledgerSort } from "./minigames/ledger-sort.js";
import { spotOverdraft } from "./minigames/spot-overdraft.js";
import { registerBalancer } from "./minigames/register-balancer.js";
import { checkHunt } from "./minigames/check-hunt.js";
import { countDrawer } from "./minigames/count-drawer.js";
import { unitPriceShowdown } from "./minigames/unit-price.js";
import { hasGuide, openGameGuide } from "./game-guide.js";
import { cabinetArt } from "./arcade-art.js";
import { setArcadeVoice } from "./arcade-sound.js";
import { watchJuice } from "./arcade-juice.js";
import { isArcade } from "../data/arcade/index.js";
import { arcadeRunner } from "./arcade/runner.js";
import { minutesLeft } from "../arcade/core.js";

// The games that only need the shared options (seed, timed, onDone, track).
const GAMES = { ledger: ledgerSort, overdraft: spotOverdraft, register: registerBalancer, checkhunt: checkHunt, drawer: countDrawer, unitprice: unitPriceShowdown };

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
  // A GAME-SPECS.md game runs through the shared runner (settings, results, why, bonus).
  let runner = null;
  // The finished shift's telemetry, sent on Collect or when the student leaves.
  let logShift = null;

  // Jobs that open later, so students know more is coming.
  function lockedJobs() {
    const later = Object.entries(JOBS)
      .filter(([key]) => !openJobs(play).includes(key))
      .sort(([a], [b]) => unlockStage(a) - unlockStage(b));
    if (!later.length) return null;
    // Unopened jobs are pencil-sketch tickets, each saying when it opens.
    return h(
      "ul.jobs-later",
      { "aria-label": "Jobs coming later" },
      later.map(([key, job]) => h("li", icon("lock", { size: 16 }), h("strong", job.title), h("small", opensText(key))))
    );
  }

  function board() {
    const j = CONFIG.play.jobs;
    const timer = h("input", { type: "checkbox", id: "untimed", checked: !timed });
    timer.addEventListener("change", () => (timed = !timer.checked));
    fill(
      el,
      h(
        "div.job-cards.arc-cabinets",
        Object.entries(JOBS)
          .filter(([key]) => openJobs(play).includes(key))
          .map(([key, job]) => {
          const xp = experienceBonus(play, key) + (play.shiftBonus || 0) + rideAndHomeBonus(play);
          const stats = play.jobs[key];
          const worked = Boolean(play.prologue && !play.prologue.done && (play.prologue.worked || []).includes(key));
          // Classic games only pay from the month's safe shifts.
          const closed = !isArcade(key) && P.shiftsLeft(play) <= 0;
          const guide = hasGuide(key) ? h("button.job-guide.arc-guide", { type: "button", onclick: () => openGameGuide(key, { track }) }, icon("scroll", { size: 14 }), " Guide") : null;
          const pay = isArcade(key) ? `Up to ${money(CONFIG.arcade.payCap + xp)} a shift` : `Up to ${money(j.pay.max + xp)} a shift`;
          const fired = minutesLeft(play, key);
          const card = h(
            "button.job-card.arc-cab-front",
            { type: "button", disabled: worked || closed, onclick: () => start(key) },
            h("span.arc-cab-marquee", h("span.arc-cab-icon", { "aria-hidden": "true" }, job.mark ? icon(job.mark, { size: 26 }) : job.icon), h("strong", job.title)),
            h("span.arc-cab-screen", { html: cabinetArt(key) }, worked ? h("span.arc-stamp.done", "WORKED") : closed ? h("span.arc-stamp.done", "NO SHIFTS") : fired ? h("span.arc-stamp.fired", `FIRED ${fired} MIN`) : !stats ? h("span.arc-stamp", "NEW") : null),
            h("span.arc-cab-info", h("small.arc-job", job.job), h("span.arc-skill", job.skill), h("span.arc-pay", icon("coins", { size: 16 }), ` ${pay}`), xp ? h("small.arc-bonus", `+${money(xp)} for experience`) : null, stats && !worked ? h("small.arc-stats", `${stats.shifts} shift${stats.shifts === 1 ? "" : "s"} worked. Best: ${stats.best}.`) : null),
            h("span.arc-play", worked ? "Done for now" : closed ? "Next month" : "PLAY")
          );
          return h("div.job-slot.arc-cab", { class: `cab-${key}` }, card, guide);
        })
      ),
      lockedJobs(),
      h("label.untimed.arc-untimed", timer, " No timer for the classic games (fewer items, same pay for each right answer). New games pick their timer before each shift.")
    );
  }

  function start(key) {
    if (play.prologue && !play.prologue.done && (play.prologue.worked || []).includes(key)) return;
    if (isArcade(key)) {
      runner?.stop();
      runner = arcadeRunner({
        key,
        host: el,
        game,
        run,
        track,
        save,
        onBack: () => {
          runner?.stop();
          runner = null;
          onCollected(null);
        },
      });
      runner.open();
      return;
    }
    const shifts = play.active ? play.active.month.shifts : `p${play.prologue?.shifts ?? 0}`;
    const seed = `${run.life.seed}:job:${run.life.month}:${shifts}`;
    track("minigameStart", { game: key, timed });
    // While a shift runs, the page header and money fold away so the game fits one screen.
    el.closest(".panel")?.classList.add("playing");
    window.scrollTo(0, 0);
    // A minigame can only end a shift once.
    let ended = false;
    const done = (result) => {
      if (ended) return;
      ended = true;
      finish(key, result);
    };
    const opts = { seed, timed, onDone: done, track };
    running = GAMES[key](opts);
    const leave = h("span.job-leave");
    const askLeave = () =>
      fill(
        leave,
        h("span.job-leave-ask", { role: "alertdialog", "aria-label": "Leave this shift?" }, "Leave this shift? You won't be paid for it. ", h("button.small", { type: "button", onclick: backToGames }, "Leave"), h("button.small.secondary", { type: "button", onclick: showLeave }, "Keep playing"))
      );
    const showLeave = () => fill(leave, h("button.small.secondary.job-back", { type: "button", onclick: askLeave }, icon("back", { size: 16 }), " Back to the games"));
    const backToGames = () => {
      track("minigameLeave", { game: key });
      running?.stop?.();
      running = null;
      el.closest(".panel")?.classList.remove("playing");
      board();
    };
    showLeave();
    // Every game plays inside its own cabinet: a marquee with its name, and its own colors and sounds.
    setArcadeVoice(key);
    fill(el, h("div.arc-frame", { class: `skin-${key}` }, h("div.arc-marquee", leave, h("h3.arc-title", icon(JOBS[key].mark || "guild", { size: 28 }), ` ${JOBS[key].title}`), hasGuide(key) ? h("button.arc-guide", { type: "button", onclick: () => openGameGuide(key, { track }) }, icon("scroll", { size: 14 }), " Guide") : null), running));
    watchJuice(el.querySelector(".arc-frame"));
    // A minigame can say where the keyboard starts (Cashier Rush: Give change).
    (el.querySelector("[data-autofocus]") || el.querySelector("button"))?.focus();
  }

  function finish(key, result) {
    running = null;
    el.closest(".panel")?.classList.remove("playing");
    const pay = jobPay(play, key, result);
    let reaction = "";
    let rewards = { energy: 0, sparkle: 0 };
    // The pay is banked and saved the moment the shift ends (bug fix
    // 2026-10-22: leaving before Collect lost the whole shift). Collect is
    // just the coins and the reaction now.
    const r = P.workShift(play, run.life, pay, `work shift: ${JOBS[key].title}`, key);
    if (r.ok) {
      run.life = r.life;
      recordShift(play, key, { right: result.right, pay });
      // Side quests pay Coins, Energy and Sparkle. XP is for quests.
      rewards = shiftRewards(play, result);
    }
    const saved = r.ok ? save("shift") : Promise.resolve();
    logShift = () => {
      logShift = null;
      track("minigame", { game: key, right: result.right, wrong: result.wrong, total: result.total, pay, energy: rewards.energy, sparkle: rewards.sparkle, seconds: result.seconds, timed, reaction, depositOnly: result.depositOnly ?? null });
    };
    const collect = h("button.big.arc-collect", { type: "button", "data-sound": "none" }, icon("coins", { size: 26 }), ` Collect ${money(pay)}`);
    collect.addEventListener("click", async () => {
      if (collect.disabled) return;
      collect.disabled = true;
      if (!r.ok) return;
      coinsFly(collect);
      logShift?.();
      await saved;
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
    // The scoreboard: the same cabinet the game was in, with a big payout.
    const total = result.right + result.wrong;
    const accuracy = total ? Math.round((result.right / total) * 100) : 0;
    fill(
      el,
      h(
        "div.arc-frame.arc-results",
        { class: `skin-${key}` },
        h("div.arc-marquee", h("h3.arc-title", icon(JOBS[key].mark || "guild", { size: 28 }), ` ${JOBS[key].title}: shift over!`), hasGuide(key) ? h("button.arc-guide", { type: "button", onclick: () => openGameGuide(key, { track, tab: "irl" }) }, icon("scroll", { size: 14 }), " Read the guide") : null),
        h(
          "div.arc-score",
          h(
            "div.arc-payout",
            h("small", "You earned"),
            h("strong.big-number", money(pay)),
            // The other two things a side quest pays. XP is for quests, so it isn't here.
            h(
              "div.arc-extras",
              h("span.arc-extra", icon("energy", { size: 20 }), ` +${rewards.energy} Energy${play.energy >= CONFIG.pacing.rewards.energy.max ? " (full)" : ""}`),
              rewards.sparkle ? h("span.arc-extra", icon("sparkle", { size: 20 }), ` +${rewards.sparkle} Sparkle for a perfect shift`) : null
            )
          ),
          h("div.arc-tally", h("div.arc-stat", h("strong", String(result.right)), h("small", "Right")), h("div.arc-stat", h("strong", String(result.wrong)), h("small", "Missed")), h("div.arc-stat", h("strong", `${accuracy}%`), h("small", "Accuracy")))
        ),
        result.depositOnly ? h("p.arc-note", "Smart: \"For deposit only\" means nobody else can cash your check.") : null,
        result.misses.length ? h("details.math.arc-misses", { open: result.misses.length <= 4 }, h("summary", `What you missed (${result.misses.length})`), h("ul", result.misses.slice(0, 8).map((m) => h("li", m)))) : h("p.arc-note.arc-perfect", "Perfect shift!"),
        h("div.arc-after", reacts, collect)
      )
    );
    collect.focus();
  }

  board();
  // The month screen calls this when it repaints, so a running timer stops cleanly.
  el.stop = () => {
    el.closest(".panel")?.classList.remove("playing");
    running?.stop?.();
    runner?.stop();
    logShift?.();
  };
  return el;
}
